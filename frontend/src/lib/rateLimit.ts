import { NextResponse } from "next/server";

/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Serverless caveat: the counter lives in a single process, so it resets on
 * cold starts and doesn't span instances. For this app's scale (a handful of
 * admins) that's an acceptable first line of defense against accidental or
 * scripted request bursts; a distributed limiter (Upstash/Vercel) is the
 * upgrade path if the app ever serves the public.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

type Bucket = { count: number; windowStart: number };
const buckets = new Map<string, Bucket>();
let lastSweep = 0;

export function isRateLimited(key: string): boolean {
  const now = Date.now();

  // Opportunistic cleanup: x-forwarded-for is client-controlled, so prune
  // expired buckets at most once per window to keep the map bounded even if
  // a caller rotates spoofed IPs.
  if (now - lastSweep >= WINDOW_MS) {
    for (const [k, b] of buckets) {
      if (now - b.windowStart >= WINDOW_MS) {
        buckets.delete(k);
      }
    }
    lastSweep = now;
  }

  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > MAX_REQUESTS;
}

/** Reads the client IP from the request (Next.js/Vercel convention). */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Returns a 429 response when the caller is over the limit. */
export function rateLimitGuard(request: Request): NextResponse | null {
  if (isRateLimited(getClientIp(request))) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }
  return null;
}
