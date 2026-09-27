import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { requireFeature, checkApiQuota, incrementApiUsage } from "@/lib/server/feature-gating";
import * as Sentry from "@sentry/nextjs";

const RATE_LIMIT_CONFIG = {
  "/api/checkout": { requests: 5, windowMs: 60 * 1000 },
  "/api/billing-portal": { requests: 10, windowMs: 60 * 1000 },
  "/api/cron": { requests: 60, windowMs: 60 * 1000 },
  "/api/stripe/webhook": { requests: 100, windowMs: 60 * 1000 },
  "/api/": { requests: 100, windowMs: 60 * 1000 },
  "/": { requests: 200, windowMs: 60 * 1000 },
} as const;

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : 
             request.headers.get("x-real-ip") || 
             "unknown";
  return ip;
}

function getRateLimitConfig(pathname: string) {
  for (const [routePrefix, config] of Object.entries(RATE_LIMIT_CONFIG)) {
    if (pathname.startsWith(routePrefix)) {
      return config;
    }
  }
  return RATE_LIMIT_CONFIG["/"];
}

function checkRateLimit(key: string, config: { requests: number; windowMs: number }): { limited: boolean; entry: RateLimitEntry; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);
    return { limited: false, entry: newEntry, remaining: config.requests - 1, resetTime: newEntry.resetTime };
  }
  
  entry.count++;
  const remaining = Math.max(0, config.requests - entry.count);
  
  if (entry.count > config.requests) {
    return { limited: true, entry, remaining: 0, resetTime: entry.resetTime };
  }
  
  return { limited: false, entry, remaining, resetTime: entry.resetTime };
}

function applyRateLimitHeaders(response: NextResponse, config: { requests: number; windowMs: number }, remaining: number, resetTime: number, limited: boolean) {
  response.headers.set("X-RateLimit-Limit", config.requests.toString());
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", Math.ceil(resetTime / 1000).toString());
  
  if (limited) {
    response.headers.set("Retry-After", Math.ceil((resetTime - Date.now()) / 1000).toString());
  }
}

const protectedRoutes: Record<string, string[]> = {
  "/api/ai": ["aiWorkoutPlans", "formCoaching", "aiCoach247"],
  "/api/analytics": ["advancedAnalytics"],
  "/api/plans": ["aiWorkoutPlans", "unlimitedCustomPlans"],
  "/api/coach": ["aiCoach247"],
};

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const clientId = getClientIdentifier(request);
  const rateLimitConfig = getRateLimitConfig(pathname);
  const rateLimitKey = `${pathname}:${clientId}`;
  const rateLimitResult = checkRateLimit(rateLimitKey, rateLimitConfig);

  if (rateLimitResult.limited) {
    const response = new NextResponse(
      JSON.stringify({ 
        error: "Too Many Requests", 
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) 
      }), 
      { 
        status: 429,
        headers: { "Content-Type": "application/json" }
      }
    );
    applyRateLimitHeaders(response, rateLimitConfig, rateLimitResult.remaining, rateLimitResult.resetTime, true);
    return response;
  }

  try {
    for (const [routePrefix, features] of Object.entries(protectedRoutes)) {
      if (pathname.startsWith(routePrefix)) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !anonKey) {
          const nextResponse = NextResponse.next({ request });
          applyRateLimitHeaders(nextResponse, rateLimitConfig, rateLimitResult.remaining, rateLimitResult.resetTime, false);
          return nextResponse;
        }

        let response = NextResponse.next({ request });
        const supabase = createServerClient<Database>(url, anonKey, {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
              response = NextResponse.next({ request });
              cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            },
          },
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          const authResponse = NextResponse.json(
            { error: "Authentication required", loginUrl: "/?redirect=" + pathname },
            { status: 401 }
          );
          applyRateLimitHeaders(authResponse, rateLimitConfig, rateLimitResult.remaining, rateLimitResult.resetTime, false);
          return authResponse;
        }

        for (const feature of features) {
          const result = await requireFeature(user.id, feature as any);
          if (!result.allowed) {
            const forbiddenResponse = NextResponse.json(
              { error: result.message, upgradeUrl: result.upgradeUrl },
              { status: 403 }
            );
            applyRateLimitHeaders(forbiddenResponse, rateLimitConfig, rateLimitResult.remaining, rateLimitResult.resetTime, false);
            return forbiddenResponse;
          }
        }

        if (pathname.startsWith("/api/")) {
          const quota = await checkApiQuota(user.id);
          if (!quota.allowed) {
            const quotaResponse = NextResponse.json(
              { error: "API quota exceeded", quota: { limit: quota.limit, remaining: quota.remaining, resetDate: quota.resetDate }, upgradeUrl: "/pricing" },
              { status: 429 }
            );
            applyRateLimitHeaders(quotaResponse, rateLimitConfig, rateLimitResult.remaining, rateLimitResult.resetTime, false);
            return quotaResponse;
          }
          await incrementApiUsage(user.id);
        }

        await supabase.auth.getClaims();
        applyRateLimitHeaders(response, rateLimitConfig, rateLimitResult.remaining, rateLimitResult.resetTime, false);
        return response;
      }
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      const nextResponse = NextResponse.next({ request });
      applyRateLimitHeaders(nextResponse, rateLimitConfig, rateLimitResult.remaining, rateLimitResult.resetTime, false);
      return nextResponse;
    }

    let response = NextResponse.next({ request });
    const supabase = createServerClient<Database>(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    await supabase.auth.getClaims();
    applyRateLimitHeaders(response, rateLimitConfig, rateLimitResult.remaining, rateLimitResult.resetTime, false);
    return response;
  } catch (error) {
    Sentry.captureException(error);
    const errorResponse = NextResponse.next({ request });
    applyRateLimitHeaders(errorResponse, rateLimitConfig, rateLimitResult.remaining, rateLimitResult.resetTime, false);
    return errorResponse;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};