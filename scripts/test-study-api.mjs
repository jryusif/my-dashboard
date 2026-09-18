// =============================================================================
// scripts/test-study-api.mjs — Verify Study Database Models & Operations
// =============================================================================

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Starting Study Suite Database & Logic Verification...\n');

  try {
    // 1. Get or create test user
    let user = await prisma.user.findFirst({
      where: { email: { contains: '@' } }
    });

    if (!user) {
      console.log('No user found, creating temporary test user...');
      user = await prisma.user.create({
        data: {
          email: 'study_test@dashboard.com',
          password: 'hashed_password_placeholder',
          name: 'Test Student'
        }
      });
    }

    console.log(`✅ Using user: ${user.name} (${user.email}) [ID: ${user.id}]`);

    // 2. Test StudyProfile
    const profile = await prisma.studyProfile.upsert({
      where: { userId: user.id },
      update: {
        mode: 'STUDENT',
        institution: 'University Dental College',
        program: 'Faculty of Oral & Dental Medicine',
        academicYear: '2026-2027',
        yearLevel: 'Year 4'
      },
      create: {
        userId: user.id,
        mode: 'STUDENT',
        institution: 'University Dental College',
        program: 'Faculty of Oral & Dental Medicine',
        academicYear: '2026-2027',
        yearLevel: 'Year 4'
      }
    });
    console.log(`✅ StudyProfile upserted: mode=${profile.mode}, program=${profile.program}`);

    // 3. Test StudySemester
    let semester = await prisma.studySemester.findFirst({
      where: { userId: user.id, name: 'Semester 1' }
    });

    if (!semester) {
      semester = await prisma.studySemester.create({
        data: {
          userId: user.id,
          name: 'Semester 1',
          academicYear: '2026-2027',
          startDate: '2026-09-01',
          endDate: '2027-01-25',
          examStartDate: '2027-01-10',
          examEndDate: '2027-01-25',
          isCurrent: true
        }
      });
    }
    console.log(`✅ StudySemester ready: ${semester.name} (isCurrent=${semester.isCurrent})`);

    // 4. Test StudySubject with Chapters
    let subject = await prisma.studySubject.findFirst({
      where: { userId: user.id, name: 'Operative Dentistry' }
    });

    if (!subject) {
      subject = await prisma.studySubject.create({
        data: {
          userId: user.id,
          semesterId: semester.id,
          name: 'Operative Dentistry',
          code: 'DENT-401',
          color: 'purple',
          icon: 'activity',
          category: 'Clinical',
          creditHours: 3.0,
          instructor: 'Prof. Harrison'
        }
      });
    }
    console.log(`✅ StudySubject ready: ${subject.name} [Color: ${subject.color}]`);

    // Add Chapters if not present
    const existingChapters = await prisma.studyChapter.findMany({
      where: { subjectId: subject.id }
    });

    if (existingChapters.length === 0) {
      const chapterTitles = [
        'Chapter 1 — Principles of Cavity Preparation',
        'Chapter 2 — Dental Amalgam Restorations',
        'Chapter 3 — Composite Restorations & Bonding Agents',
        'Chapter 4 — Isolation & Dental Dam Applications',
        'Chapter 5 — Glass Ionomer Cements'
      ];

      for (let i = 0; i < chapterTitles.length; i++) {
        await prisma.studyChapter.create({
          data: {
            subjectId: subject.id,
            title: chapterTitles[i],
            chapterNumber: i + 1,
            order: i,
            status: i < 2 ? 'COMPLETED' : (i === 2 ? 'IN_PROGRESS' : 'NOT_STARTED')
          }
        });
      }
      console.log(`✅ Added 5 test chapters (2 COMPLETED, 1 IN_PROGRESS, 2 NOT_STARTED)`);
    } else {
      console.log(`✅ Found ${existingChapters.length} chapters for ${subject.name}`);
    }

    // 5. Test Progress Calculation
    const allChaps = await prisma.studyChapter.findMany({ where: { subjectId: subject.id } });
    const doneCount = allChaps.filter(c => c.status === 'COMPLETED').length;
    const progressPct = Math.round((doneCount / allChaps.length) * 100);
    console.log(`✅ Calculated Progress: ${doneCount}/${allChaps.length} chapters (${progressPct}%)`);

    // 6. Test Recurring Timetable Slot
    let slot = await prisma.studyTimetableSlot.findFirst({
      where: { userId: user.id, title: 'Operative Dentistry Lecture' }
    });
    if (!slot) {
      slot = await prisma.studyTimetableSlot.create({
        data: {
          userId: user.id,
          subjectId: subject.id,
          title: 'Operative Dentistry Lecture',
          dayOfWeek: 'Saturday',
          startTime: '10:00',
          endTime: '12:00',
          type: 'Lecture',
          location: 'Hall A',
          color: 'purple'
        }
      });
    }
    console.log(`✅ Timetable Slot ready: Every ${slot.dayOfWeek} ${slot.startTime}-${slot.endTime} (${slot.title})`);

    // 7. Test Course
    let course = await prisma.studyCourse.findFirst({
      where: { userId: user.id, name: 'Endodontic Masterclass' }
    });
    if (!course) {
      course = await prisma.studyCourse.create({
        data: {
          userId: user.id,
          name: 'Endodontic Masterclass',
          provider: 'Dental CME Academy',
          totalLessons: 14,
          completedLessons: 8,
          color: 'peach',
          icon: 'laptop',
          status: 'IN_PROGRESS'
        }
      });
    }
    const coursePct = Math.round((course.completedLessons / course.totalLessons) * 100);
    console.log(`✅ Course ready: ${course.name} [${course.completedLessons}/${course.totalLessons} Lessons — ${coursePct}%]`);

    // 8. Test Book / Reading Resource
    let book = await prisma.studyResource.findFirst({
      where: { userId: user.id, title: { contains: 'Operative Dentistry' } }
    });
    if (!book) {
      book = await prisma.studyResource.create({
        data: {
          userId: user.id,
          title: 'Sturdevant’s Art & Science of Operative Dentistry',
          author: 'Andre V. Ritter',
          type: 'BOOK',
          totalPages: 320,
          currentPage: 145,
          color: 'mint',
          status: 'READING'
        }
      });
    }
    const bookPct = Math.round((book.currentPage / book.totalPages) * 100);
    console.log(`✅ Book Resource ready: ${book.title} [Page ${book.currentPage}/${book.totalPages} — ${bookPct}%]`);

    // 9. Test StudySession
    const session = await prisma.studySession.create({
      data: {
        userId: user.id,
        subjectId: subject.id,
        date: new Date().toISOString().split('T')[0],
        durationMinutes: 85,
        type: 'Revision',
        notes: 'Reviewed cavity preparations and matrix systems'
      }
    });
    console.log(`✅ Logged Study Session: ${session.durationMinutes}m for ${subject.name}`);

    console.log('\n🎉 ALL 9 TEST SUITES PASSED WITH ZERO ERRORS!');
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
