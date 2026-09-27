import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { requireFeature, checkApiQuota, incrementApiUsage } from "@/lib/server/feature-gating";

const protectedRoutes: Record<string, string[]> = {
  "/api/ai": ["aiWorkoutPlans", "formCoaching", "aiCoach247"],
  "/api/analytics": ["advancedAnalytics"],
  "/api/plans": ["aiWorkoutPlans", "unlimitedCustomPlans"],
  "/api/coach": ["aiCoach247"],
};

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  for (const [routePrefix, features] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(routePrefix)) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !anonKey) return NextResponse.next({ request });

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
        return NextResponse.json(
          { error: "Authentication required", loginUrl: "/?redirect=" + pathname },
          { status: 401 }
        );
      }

      for (const feature of features) {
        const result = await requireFeature(user.id, feature as any);
        if (!result.allowed) {
          return NextResponse.json(
            { error: result.message, upgradeUrl: result.upgradeUrl },
            { status: 403 }
          );
        }
      }

      if (pathname.startsWith("/api/")) {
        const quota = await checkApiQuota(user.id);
        if (!quota.allowed) {
          return NextResponse.json(
            { error: "API quota exceeded", quota: { limit: quota.limit, remaining: quota.remaining, resetDate: quota.resetDate }, upgradeUrl: "/pricing" },
            { status: 429 }
          );
        }
        await incrementApiUsage(user.id);
      }

      await supabase.auth.getClaims();
      return response;
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next({ request });

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
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};