import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma.js';

/**
 * Helper to fetch a setting from PostgreSQL system_settings table
 */
async function getDbSetting(key) {
  try {
    const rows = await prisma.$queryRaw`
      SELECT value FROM system_settings WHERE key = ${key} LIMIT 1;
    `;
    if (rows && rows.length > 0 && rows[0].value) {
      return rows[0].value.trim();
    }
  } catch (err) {
    // If table doesn't exist yet or connection issue, silently ignore and fallback to env
  }
  return null;
}

/**
 * Helper to persist a setting to PostgreSQL system_settings table
 */
async function setDbSetting(key, value) {
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await prisma.$executeRaw`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = NOW();
    `;
    return true;
  } catch (err) {
    console.warn(`[system_settings] Failed to write key ${key} to DB:`, err.message);
    return false;
  }
}

/**
 * /api/config — Public app configuration & OAuth setup
 */
export async function GET() {
  // 1. Check in-memory / process.env
  let gId = process.env.GOOGLE_CLIENT_ID || '';
  let aId = process.env.APPLE_CLIENT_ID || '';
  let appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  // 2. Fallback to PostgreSQL system_settings (crucial for serverless Vercel deployments)
  if (!gId || gId.includes('YOUR_GOOGLE_CLIENT_ID')) {
    const dbGId = await getDbSetting('GOOGLE_CLIENT_ID');
    if (dbGId) {
      gId = dbGId;
      process.env.GOOGLE_CLIENT_ID = dbGId;
    }
  }

  if (!aId || aId.includes('YOUR_APPLE')) {
    const dbAId = await getDbSetting('APPLE_CLIENT_ID');
    if (dbAId) {
      aId = dbAId;
      process.env.APPLE_CLIENT_ID = dbAId;
    }
  }

  if (!appUrl || appUrl.includes('localhost')) {
    const dbAppUrl = await getDbSetting('NEXT_PUBLIC_APP_URL');
    if (dbAppUrl) {
      appUrl = dbAppUrl;
      process.env.NEXT_PUBLIC_APP_URL = dbAppUrl;
    }
  }

  // 3. Resolve secrets (check existence only, never leak the actual secret values)
  let gSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  if (!gSecret || gSecret.includes('YOUR_')) {
    const dbGSecret = await getDbSetting('GOOGLE_CLIENT_SECRET');
    if (dbGSecret) {
      gSecret = dbGSecret;
      process.env.GOOGLE_CLIENT_SECRET = dbGSecret;
    }
  }

  let aSecret = process.env.APPLE_CLIENT_SECRET || '';
  if (!aSecret || aSecret.includes('YOUR_')) {
    const dbASecret = await getDbSetting('APPLE_CLIENT_SECRET');
    if (dbASecret) {
      aSecret = dbASecret;
      process.env.APPLE_CLIENT_SECRET = dbASecret;
    }
  }

  const isRealGoogleId = gId && !gId.includes('YOUR_GOOGLE_CLIENT_ID') && gId.includes('.apps.googleusercontent.com');
  const hasGoogleSecret = Boolean(gSecret && !gSecret.includes('YOUR_') && gSecret.trim().length > 5);
  const hasAppleSecret = Boolean(aSecret && !aSecret.includes('YOUR_') && aSecret.trim().length > 5);

  return Response.json({
    googleClientId: isRealGoogleId ? gId : '',
    hasGoogleConfig: Boolean(isRealGoogleId),
    hasGoogleSecret,
    appleClientId:  aId && !aId.includes('YOUR_APPLE') ? aId : '',
    hasAppleSecret,
    appUrl:         appUrl || ''
  });
}

export async function POST(req) {
  try {
    const { googleClientId, googleClientSecret, appleClientId, appleClientSecret, appUrl } = await req.json();

    const cleanAppUrl = (appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://mydashboard-bice.vercel.app').trim();
    process.env.NEXT_PUBLIC_APP_URL = cleanAppUrl;
    await setDbSetting('NEXT_PUBLIC_APP_URL', cleanAppUrl);

    let cleanGoogleId = '';
    if (googleClientId && googleClientId.trim()) {
      cleanGoogleId = googleClientId.trim();
      const cleanSecret = (googleClientSecret || '').trim();
      process.env.GOOGLE_CLIENT_ID = cleanGoogleId;
      await setDbSetting('GOOGLE_CLIENT_ID', cleanGoogleId);

      if (cleanSecret) {
        process.env.GOOGLE_CLIENT_SECRET = cleanSecret;
        await setDbSetting('GOOGLE_CLIENT_SECRET', cleanSecret);
      }
    }

    let cleanAppleId = '';
    if (appleClientId && appleClientId.trim()) {
      cleanAppleId = appleClientId.trim();
      const cleanSecret = (appleClientSecret || '').trim();
      process.env.APPLE_CLIENT_ID = cleanAppleId;
      await setDbSetting('APPLE_CLIENT_ID', cleanAppleId);

      if (cleanSecret) {
        process.env.APPLE_CLIENT_SECRET = cleanSecret;
        await setDbSetting('APPLE_CLIENT_SECRET', cleanSecret);
      }
    }

    // Try to update local .env file if writable (fails gracefully on read-only serverless like Vercel)
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');

        if (cleanGoogleId) {
          if (envContent.includes('GOOGLE_CLIENT_ID=')) {
            envContent = envContent.replace(/GOOGLE_CLIENT_ID=.*/g, `GOOGLE_CLIENT_ID="${cleanGoogleId}"`);
          } else {
            envContent += `\nGOOGLE_CLIENT_ID="${cleanGoogleId}"`;
          }
        }

        if (googleClientSecret && googleClientSecret.trim()) {
          const s = googleClientSecret.trim();
          if (envContent.includes('GOOGLE_CLIENT_SECRET=')) {
            envContent = envContent.replace(/GOOGLE_CLIENT_SECRET=.*/g, `GOOGLE_CLIENT_SECRET="${s}"`);
          } else {
            envContent += `\nGOOGLE_CLIENT_SECRET="${s}"`;
          }
        }

        if (cleanAppleId) {
          if (envContent.includes('APPLE_CLIENT_ID=')) {
            envContent = envContent.replace(/APPLE_CLIENT_ID=.*/g, `APPLE_CLIENT_ID="${cleanAppleId}"`);
          } else {
            envContent += `\nAPPLE_CLIENT_ID="${cleanAppleId}"`;
          }
        }

        if (cleanAppUrl) {
          if (envContent.includes('NEXT_PUBLIC_APP_URL=')) {
            envContent = envContent.replace(/NEXT_PUBLIC_APP_URL=.*/g, `NEXT_PUBLIC_APP_URL="${cleanAppUrl}"`);
          } else {
            envContent += `\nNEXT_PUBLIC_APP_URL="${cleanAppUrl}"`;
          }
        }

        fs.writeFileSync(envPath, envContent, 'utf8');
      }
    } catch (fsErr) {
      console.warn('[api/config] File system write skipped (read-only environment):', fsErr.message);
    }

    return Response.json({
      success: true,
      googleClientId: process.env.GOOGLE_CLIENT_ID || cleanGoogleId,
      appleClientId: process.env.APPLE_CLIENT_ID || cleanAppleId,
      appUrl: cleanAppUrl,
      message: 'OAuth credentials saved successfully.'
    });
  } catch (err) {
    console.error('Error saving credentials:', err);
    return Response.json({ error: 'Could not save credentials.' }, { status: 500 });
  }
}
