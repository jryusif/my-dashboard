import fs from 'fs';
import path from 'path';

/**
 * /api/config — Public app configuration & OAuth setup
 */
export async function GET() {
  const gId = process.env.GOOGLE_CLIENT_ID || '';
  const aId = process.env.APPLE_CLIENT_ID || '';
  const isRealGoogleId = gId && !gId.includes('YOUR_GOOGLE_CLIENT_ID') && gId.includes('.apps.googleusercontent.com');

  return Response.json({
    googleClientId: isRealGoogleId ? gId : '',
    hasGoogleConfig: Boolean(isRealGoogleId),
    appleClientId:  aId && !aId.includes('YOUR_APPLE') ? aId : '',
    appUrl:         process.env.NEXT_PUBLIC_APP_URL || ''
  });
}

export async function POST(req) {
  try {
    const { googleClientId, googleClientSecret, appleClientId, appleClientSecret, appUrl } = await req.json();

    const cleanAppUrl = (appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').trim();
    process.env.NEXT_PUBLIC_APP_URL = cleanAppUrl;

    const envPath = path.join(process.cwd(), '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

    if (googleClientId && googleClientId.trim()) {
      const cleanClientId = googleClientId.trim();
      const cleanSecret = (googleClientSecret || '').trim();
      process.env.GOOGLE_CLIENT_ID = cleanClientId;
      if (cleanSecret) process.env.GOOGLE_CLIENT_SECRET = cleanSecret;

      if (envContent.includes('GOOGLE_CLIENT_ID=')) {
        envContent = envContent.replace(/GOOGLE_CLIENT_ID=.*/g, `GOOGLE_CLIENT_ID="${cleanClientId}"`);
      } else {
        envContent += `\nGOOGLE_CLIENT_ID="${cleanClientId}"`;
      }

      if (cleanSecret) {
        if (envContent.includes('GOOGLE_CLIENT_SECRET=')) {
          envContent = envContent.replace(/GOOGLE_CLIENT_SECRET=.*/g, `GOOGLE_CLIENT_SECRET="${cleanSecret}"`);
        } else {
          envContent += `\nGOOGLE_CLIENT_SECRET="${cleanSecret}"`;
        }
      }
    }

    if (appleClientId && appleClientId.trim()) {
      const cleanClientId = appleClientId.trim();
      const cleanSecret = (appleClientSecret || '').trim();
      process.env.APPLE_CLIENT_ID = cleanClientId;
      if (cleanSecret) process.env.APPLE_CLIENT_SECRET = cleanSecret;

      if (envContent.includes('APPLE_CLIENT_ID=')) {
        envContent = envContent.replace(/APPLE_CLIENT_ID=.*/g, `APPLE_CLIENT_ID="${cleanClientId}"`);
      } else {
        envContent += `\nAPPLE_CLIENT_ID="${cleanClientId}"`;
      }

      if (cleanSecret) {
        if (envContent.includes('APPLE_CLIENT_SECRET=')) {
          envContent = envContent.replace(/APPLE_CLIENT_SECRET=.*/g, `APPLE_CLIENT_SECRET="${cleanSecret}"`);
        } else {
          envContent += `\nAPPLE_CLIENT_SECRET="${cleanSecret}"`;
        }
      }
    }

    if (envContent.includes('NEXT_PUBLIC_APP_URL=')) {
      envContent = envContent.replace(/NEXT_PUBLIC_APP_URL=.*/g, `NEXT_PUBLIC_APP_URL="${cleanAppUrl}"`);
    } else {
      envContent += `\nNEXT_PUBLIC_APP_URL="${cleanAppUrl}"`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');

    return Response.json({
      success: true,
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      appleClientId: process.env.APPLE_CLIENT_ID,
      appUrl: cleanAppUrl,
      message: 'OAuth credentials saved successfully.'
    });
  } catch (err) {
    console.error('Error saving Google credentials:', err);
    return Response.json({ error: 'Could not save credentials to .env.' }, { status: 500 });
  }
}
