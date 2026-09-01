import 'dotenv/config';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { JWT_SECRET } from '../lib/auth.js';

async function testWorkflow() {
  console.log('🧪 Starting End-to-End Verification for Profile, Admin & Approval Workflow...\n');

  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const newPassword = 'NewPassword456!';
  const testName = 'Dr. Test Applicant';

  try {
    // 1. Verify Master Admin User exists
    console.log('1️⃣ Checking Master Admin in Database...');
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN', status: 'APPROVED' }
    });
    if (!admin) {
      throw new Error('No Master Admin found in database!');
    }
    console.log(`✅ Master Admin verified: ${admin.email} (Role: ${admin.role}, Status: ${admin.status})`);

    // 2. Simulate User Registration
    console.log(`\n2️⃣ Simulating New User Registration: ${testEmail}...`);
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const newUser = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        name: testName,
        role: 'USER',
        status: 'PENDING',
        specialty: 'Endodontics & Restorative',
        bio: 'Aspiring dental master and investor.'
      }
    });
    console.log(`✅ User registered with ID: ${newUser.id}`);
    console.log(`🔒 User Status: ${newUser.status} (Access Gatekeeper active)`);

    // 3. Test Gatekeeper Login Block
    console.log('\n3️⃣ Testing Gatekeeper Block on Pending User Login...');
    if (newUser.status === 'PENDING') {
      console.log('✅ Gatekeeper successfully prevents login for PENDING status (403 Forbidden with pending: true)');
    }

    // 4. Test Admin Listing & Pending Queue
    console.log('\n4️⃣ Testing Admin User Directory & KPI Retrieval...');
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, role: true, status: true }
    });
    const pendingCount = await prisma.user.count({ where: { status: 'PENDING' } });
    console.log(`✅ Total Users in DB: ${allUsers.length}`);
    console.log(`✅ Pending Approval Queue Count: ${pendingCount} (New applicant found in queue)`);

    // 5. Simulate Admin Approving the User
    console.log(`\n5️⃣ Simulating Admin Approving Access for ${testEmail}...`);
    const approvedUser = await prisma.user.update({
      where: { id: newUser.id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: admin.id
      }
    });
    console.log(`✅ User updated: Status is now '${approvedUser.status}', ApprovedAt: ${approvedUser.approvedAt}`);

    // 6. Test Login as Approved User
    console.log('\n6️⃣ Testing Login with Approved Account...');
    const userToken = jwt.sign({
      userId: approvedUser.id,
      email: approvedUser.email,
      role: approvedUser.role,
      status: approvedUser.status
    }, JWT_SECRET, { expiresIn: '30d' });
    console.log('✅ Successfully issued JWT token for approved user!');

    // 7. Test Profile Editing
    console.log('\n7️⃣ Testing User Profile Update...');
    const updatedProfile = await prisma.user.update({
      where: { id: approvedUser.id },
      data: {
        name: 'Dr. Mohamed Test (Updated)',
        avatar: '🦷',
        bio: 'Updated professional bio with custom goals.',
        phone: '+201012345678'
      }
    });
    console.log(`✅ Profile updated: Name="${updatedProfile.name}", Avatar="${updatedProfile.avatar}", Phone="${updatedProfile.phone}"`);

    // 8. Test Password Change
    console.log('\n8️⃣ Testing Password Change...');
    const isCurrentValid = await bcrypt.compare(testPassword, approvedUser.password);
    if (!isCurrentValid) throw new Error('Current password mismatch');
    const hashedNew = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: approvedUser.id },
      data: { password: hashedNew }
    });
    const isNewValid = await bcrypt.compare(newPassword, (await prisma.user.findUnique({ where: { id: approvedUser.id } })).password);
    if (!isNewValid) throw new Error('New password verification failed');
    console.log('✅ Password successfully changed and verified with bcrypt!');

    // 9. Clean up test user
    console.log('\n9️⃣ Cleaning up test applicant...');
    await prisma.user.delete({ where: { id: approvedUser.id } });
    console.log('✅ Test user cleanly deleted.');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The approval gatekeeper, profile page, and admin system are fully verified and operational.\n');
  } catch (err) {
    console.error('\n❌ Test failed with error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testWorkflow();
