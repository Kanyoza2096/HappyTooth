import { NextResponse } from 'next/server';

/**
 * Lightweight health check for load balancers / uptime monitors.
 * Does not expose secrets or internal diagnostics.
 */
export async function GET() {
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return NextResponse.json(
    {
      status: 'ok',
      app: process.env.NEXT_PUBLIC_APP_NAME || 'Happy Tooth',
      configured: hasSupabase,
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}
