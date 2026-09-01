import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function mergeAdminAccounts() {
  const prisma = new PrismaClient();
  const keepEmail = 'jryusiif@gmail.com';
  const removeEmail = 'jryusif@dashboard.com';

  console.log(`🔄 Merging admin accounts: migrating data from ${removeEmail} to ${keepEmail}...`);

  try {
    const oldUser = await prisma.user.findUnique({ where: { email: removeEmail } });
    const targetUser = await prisma.user.findUnique({ where: { email: keepEmail } });

    if (!oldUser) {
      console.log(`ℹ️ Account ${removeEmail} already does not exist.`);
      return;
    }

    if (!targetUser) {
      console.log(`🔄 Target user ${keepEmail} not found, renaming ${removeEmail} to ${keepEmail}...`);
      await prisma.user.update({
        where: { id: oldUser.id },
        data: {
          email: keepEmail,
          role: 'ADMIN',
          status: 'APPROVED',
          approvedAt: new Date()
        }
      });
      console.log('✅ Renamed successfully!');
      return;
    }

    console.log(`Found Source User ID: ${oldUser.id} and Target User ID: ${targetUser.id}`);

    // Reassign all associated tables
    await prisma.$transaction(async (tx) => {
      // 1. Tasks
      const tasks = await tx.task.updateMany({
        where: { userId: oldUser.id },
        data: { userId: targetUser.id }
      });
      console.log(`- Migrated ${tasks.count} tasks.`);

      // 2. Routines
      const routines = await tx.routine.updateMany({
        where: { userId: oldUser.id },
        data: { userId: targetUser.id }
      });
      console.log(`- Migrated ${routines.count} routines.`);

      // 3. Routine Logs
      const rlogs = await tx.routineLog.updateMany({
        where: { userId: oldUser.id },
        data: { userId: targetUser.id }
      });
      console.log(`- Migrated ${rlogs.count} routine logs.`);

      // 4. Dental Cases
      const cases = await tx.dentalCase.updateMany({
        where: { userId: oldUser.id },
        data: { userId: targetUser.id }
      });
      console.log(`- Migrated ${cases.count} dental cases.`);

      // 5. Workout Splits & Exercises
      await tx.workoutSplit.deleteMany({ where: { userId: targetUser.id } });
      const splits = await tx.workoutSplit.updateMany({
        where: { userId: oldUser.id },
        data: { userId: targetUser.id }
      });
      console.log(`- Migrated ${splits.count} workout splits.`);

      const wexercises = await tx.workoutExercise.updateMany({
        where: { userId: oldUser.id },
        data: { userId: targetUser.id }
      });
      console.log(`- Migrated ${wexercises.count} workout exercises.`);

      const weightLogs = await tx.exerciseWeightLog.updateMany({
        where: { userId: oldUser.id },
        data: { userId: targetUser.id }
      });
      console.log(`- Migrated ${weightLogs.count} exercise weight logs.`);

      // 6. Roadmap Milestones
      const milestones = await tx.roadmapMilestone.updateMany({
        where: { userId: oldUser.id },
        data: { userId: targetUser.id }
      });
      console.log(`- Migrated ${milestones.count} roadmap milestones.`);

      // 7. Finance
      const transactions = await tx.financialTransaction.updateMany({
        where: { userId: oldUser.id },
        data: { userId: targetUser.id }
      });
      console.log(`- Migrated ${transactions.count} financial transactions.`);

      const fgoals = await tx.financialGoal.updateMany({
        where: { userId: oldUser.id },
        data: { userId: targetUser.id }
      });
      console.log(`- Migrated ${fgoals.count} financial goals.`);

      await tx.financialSetting.deleteMany({ where: { userId: targetUser.id } });
      await tx.financialSetting.updateMany({
        where: { userId: oldUser.id },
        data: { userId: targetUser.id }
      });

      // 8. Assets & Gold
      const assets = await tx.asset.updateMany({
        where: { userId: oldUser.id },
        data: { userId: targetUser.id }
      });
      console.log(`- Migrated ${assets.count} assets.`);

      const gold = await tx.goldLot.updateMany({
        where: { userId: oldUser.id },
        data: { userId: targetUser.id }
      });
      console.log(`- Migrated ${gold.count} gold lots.`);

      // 9. Notifications
      await tx.notificationPreference.deleteMany({ where: { userId: targetUser.id } });
      await tx.notificationPreference.updateMany({
        where: { userId: oldUser.id },
        data: { userId: targetUser.id }
      });

      const notifs = await tx.notificationLog.updateMany({
        where: { userId: oldUser.id },
        data: { userId: targetUser.id }
      });
      console.log(`- Migrated ${notifs.count} notification logs.`);

      // 10. Copy profile metadata & ensure ADMIN/APPROVED
      await tx.user.update({
        where: { id: targetUser.id },
        data: {
          role: 'ADMIN',
          status: 'APPROVED',
          approvedAt: new Date(),
          name: targetUser.name || oldUser.name,
          avatar: targetUser.avatar || oldUser.avatar,
          bio: targetUser.bio || oldUser.bio,
          specialty: targetUser.specialty || oldUser.specialty,
          phone: targetUser.phone || oldUser.phone
        }
      });

      // 11. Delete the old user account
      await tx.user.delete({
        where: { id: oldUser.id }
      });
      console.log(`🗑️ Deleted ${removeEmail}`);
    });

    console.log(`\n🎉 Accounts successfully merged! Only ${keepEmail} remains with all data.`);

    const remainingUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        _count: {
          select: {
            tasks: true,
            routines: true,
            dentalCases: true,
            roadmapMilestones: true
          }
        }
      }
    });
    console.log('Current DB Users:', JSON.stringify(remainingUsers, null, 2));
  } catch (err) {
    console.error('Error during merge:', err);
  } finally {
    await prisma.$disconnect();
  }
}

mergeAdminAccounts();
