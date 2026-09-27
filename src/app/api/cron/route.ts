import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

const CRON_ENDPOINTS = [
  "/api/cron/trial-ending",
  "/api/cron/trial-ended",
  "/api/cron/payment-failed",
  "/api/cron/renewal-reminder",
] as const;

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    const results: Record<string, { success: boolean; sent?: number; error?: string }> = {};

    for (const endpoint of CRON_ENDPOINTS) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${cronSecret}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        results[endpoint] = { success: response.ok, ...data };
      } catch (error) {
        results[endpoint] = { success: false, error: error instanceof Error ? error.message : "Unknown error" };
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    endpoints: CRON_ENDPOINTS,
    description: "POST to this endpoint with Authorization: Bearer <CRON_SECRET> to run all cron jobs"
  });
}