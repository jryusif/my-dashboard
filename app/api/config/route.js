/**
 * /api/config — Public app configuration
 * Safely exposes only non-secret, client-safe env vars to the frontend.
 */
export async function GET() {
  return Response.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    appleClientId:  process.env.APPLE_CLIENT_ID  || '',
    appUrl:         process.env.NEXT_PUBLIC_APP_URL || ''
  });
}
