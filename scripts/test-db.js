// =============================================================================
// Database Connection Verification Script
// Run: node scripts/test-db.js
// =============================================================================

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('\n🔍 Testing PostgreSQL & Prisma connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.split('@')[0]}@*****` : 'NOT SET');

  if (!process.env.DATABASE_URL) {
    console.error('\n❌ DATABASE_URL is not set in your .env file!');
    console.log('👉 Please set DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require" in your .env file.\n');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, version() as pg_version;`;
    console.log('\n✅ Database connection successful!');
    console.log('🕒 Server Time:', result[0].current_time);
    console.log('🐘 PostgreSQL Version:', result[0].pg_version.split(' ')[0], result[0].pg_version.split(' ')[1]);
    
    const userCount = await prisma.user.count();
    console.log(`👥 Total registered users in database: ${userCount}\n`);
  } catch (err) {
    console.error('\n❌ Database connection failed:');
    console.error(err.message);
    console.log('\n👉 Troubleshooting checklist:');
    console.log('1. Verify your database password is correct (URL-encode special characters like @, #, $, % in the password).');
    console.log('2. Ensure ?sslmode=require is appended to the connection string for Railway / Supabase / Neon / Render.');
    console.log('3. Ensure your IP or cloud service has permission to connect.\n');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
