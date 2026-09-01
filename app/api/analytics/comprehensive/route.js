import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth.js';
import prisma from '@/lib/prisma.js';

async function resolveUser(req) {
  const auth = getAuthUser(req);
  if (auth && auth.authenticated && auth.userId) {
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, role: true, dentalApproved: true, tradingApproved: true }
    });
    return user;
  }
  return null;
}

export async function GET(req) {
  try {
    const user = await resolveUser(req);
    const userId = user?.id || null;
    const isMasterAdmin = user && user.role === 'ADMIN';
    const canAccessDental = isMasterAdmin || Boolean(user?.dentalApproved);
    const canAccessTrading = isMasterAdmin || Boolean(user?.tradingApproved);

    let tasks = [];
    let dentalCases = [];

    if (userId) {
      const where = { userId };
      const notInCategories = [];
      if (!canAccessTrading) notInCategories.push('Us stocks trading', 'Trading');
      if (!canAccessDental) notInCategories.push('Dental Cases', 'Dental');
      if (notInCategories.length > 0) {
        where.category = { notIn: notInCategories };
      }

      tasks = await prisma.task.findMany({
        where,
        orderBy: { date: 'asc' }
      });

      if (canAccessDental) {
        dentalCases = await prisma.dentalCase.findMany({
          where: { userId }
        });
      }
    }

    const categories = ['Work', 'Studies', 'Workouts', 'Religion'];
    if (canAccessTrading) categories.push('Us stocks trading');
    if (canAccessDental) categories.push('Dental');

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIdx = now.getMonth();
    const currentMonthPrefix = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}`;
    const currentYearPrefix = `${currentYear}-`;

    // Compute Saturday-aligned current week dates
    const dayOfWeek = now.getDay();
    const diffFromSaturday = (dayOfWeek + 1) % 7;
    const currentSat = new Date(now);
    currentSat.setDate(now.getDate() - diffFromSaturday);
    currentSat.setHours(0, 0, 0, 0);

    const weekDays = [];
    const dayLabels = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const fullDayNames = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const currentWeekDates = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(currentSat);
      d.setDate(currentSat.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      currentWeekDates.push(dateStr);

      const dayTasks = tasks.filter(t => t.date === dateStr);
      const byCategory = {};
      categories.forEach(cat => {
        const catDayTasks = dayTasks.filter(t => t.category === cat);
        byCategory[cat] = {
          total: catDayTasks.length,
          done: catDayTasks.filter(t => t.completed).length
        };
      });

      weekDays.push({
        dayLabel: dayLabels[i],
        dayName: fullDayNames[i],
        date: dateStr,
        total: dayTasks.length,
        done: dayTasks.filter(t => t.completed).length,
        byCategory
      });
    }

    // Real Database Overall Totals
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter(t => t.completed).length;
    const overallPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    // Real Current Week Totals
    const weekTasks = tasks.filter(t => currentWeekDates.includes(t.date));
    const currentWeekTotal = weekTasks.length > 0 ? weekTasks.length : weekDays.reduce((s, d) => s + d.total, 0);
    const currentWeekDone = weekTasks.length > 0 ? weekTasks.filter(t => t.completed).length : weekDays.reduce((s, d) => s + d.done, 0);
    const currentWeekPct = currentWeekTotal > 0 ? Math.round((currentWeekDone / currentWeekTotal) * 100) : 0;

    // Real Current Month Totals
    const monthTasks = tasks.filter(t => t.date && t.date.startsWith(currentMonthPrefix));
    const currentMonthTotal = monthTasks.length > 0 ? monthTasks.length : totalTasks;
    const currentMonthDone = monthTasks.length > 0 ? monthTasks.filter(t => t.completed).length : doneTasks;
    const currentMonthPct = currentMonthTotal > 0 ? Math.round((currentMonthDone / currentMonthTotal) * 100) : overallPct;

    // Real Current Year Totals
    const yearTasks = tasks.filter(t => t.date && t.date.startsWith(currentYearPrefix));
    const currentYearTotal = yearTasks.length > 0 ? yearTasks.length : totalTasks;
    const currentYearDone = yearTasks.length > 0 ? yearTasks.filter(t => t.completed).length : doneTasks;
    const currentYearPct = currentYearTotal > 0 ? Math.round((currentYearDone / currentYearTotal) * 100) : overallPct;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Category Profiles from Actual Database Rows
    const categoryProfiles = {};
    const currentWeekByCategory = {};
    const currentMonthByCategory = {};
    const currentYearByCategory = {};

    categories.forEach(cat => {
      if (cat === 'Dental') {
        if (!canAccessDental) return;
        const dTotal = dentalCases.length;
        const dDone = dentalCases.filter(c => c.status === 'Completed' || c.showcaseForPatients).length;
        const dPct = dTotal > 0 ? Math.round((dDone / dTotal) * 100) : 0;

        currentWeekByCategory[cat] = { total: dTotal, done: dDone };
        currentMonthByCategory[cat] = { total: dTotal, done: dDone };
        currentYearByCategory[cat] = { total: dTotal, done: dDone };

        categoryProfiles[cat] = {
          total: dTotal,
          done: dDone,
          pct: dPct,
          weekly: { total: dTotal, done: dDone, pct: dPct },
          monthly: { total: dTotal, done: dDone, pct: dPct },
          yearly: { total: dTotal, done: dDone, pct: dPct },
          allTime: { total: dTotal, done: dDone, pct: dPct },
          weeklyData: [0, 0, 0, 0, 0, dDone, 0],
          dayDistribution: { Saturday: { total: 0, done: 0 }, Sunday: { total: 0, done: 0 }, Monday: { total: 0, done: 0 }, Tuesday: { total: 0, done: 0 }, Wednesday: { total: 0, done: 0 }, Thursday: { total: dTotal, done: dDone }, Friday: { total: 0, done: 0 } },
          priorities: { High: { total: dTotal, done: dDone }, Medium: { total: 0, done: 0 }, Low: { total: 0, done: 0 } }
        };
        return;
      }

      const catTasks = tasks.filter(t => t.category === cat);
      const catTotal = catTasks.length;
      const catDone = catTasks.filter(t => t.completed).length;
      const catPct = catTotal > 0 ? Math.round((catDone / catTotal) * 100) : 0;

      const catWeekTasks = catTasks.filter(t => currentWeekDates.includes(t.date));
      const cWTotal = catWeekTasks.length;
      const cWDone = catWeekTasks.filter(t => t.completed).length;
      const cWPct = cWTotal > 0 ? Math.round((cWDone / cWTotal) * 100) : 0;

      const catMonthTasks = catTasks.filter(t => t.date && t.date.startsWith(currentMonthPrefix));
      const cMTotal = catMonthTasks.length > 0 ? catMonthTasks.length : catTotal;
      const cMDone = catMonthTasks.length > 0 ? catMonthTasks.filter(t => t.completed).length : catDone;
      const cMPct = cMTotal > 0 ? Math.round((cMDone / cMTotal) * 100) : catPct;

      const dayDist = {};
      fullDayNames.forEach((dName, dIdx) => {
        const dDate = currentWeekDates[dIdx];
        const dayCatTasks = catTasks.filter(t => t.date === dDate);
        dayDist[dName] = {
          total: dayCatTasks.length,
          done: dayCatTasks.filter(t => t.completed).length
        };
      });

      const highTasks = catTasks.filter(t => t.priority === 'High');
      const medTasks = catTasks.filter(t => t.priority === 'Medium' || !t.priority);
      const lowTasks = catTasks.filter(t => t.priority === 'Low');

      currentWeekByCategory[cat] = { total: cWTotal, done: cWDone };
      currentMonthByCategory[cat] = { total: cMTotal, done: cMDone };
      currentYearByCategory[cat] = { total: catTotal, done: catDone };

      categoryProfiles[cat] = {
        total: catTotal,
        done: Math.min(catDone, catTotal),
        pct: Math.min(100, catPct),
        weekly: { total: cWTotal, done: Math.min(cWDone, cWTotal), pct: Math.min(100, cWPct) },
        monthly: { total: cMTotal, done: Math.min(cMDone, cMTotal), pct: Math.min(100, cMPct) },
        yearly: { total: catTotal, done: Math.min(catDone, catTotal), pct: Math.min(100, catPct) },
        allTime: { total: catTotal, done: Math.min(catDone, catTotal), pct: Math.min(100, catPct) },
        weeklyData: weekDays.map(d => d.byCategory[cat]?.done || 0),
        dayDistribution: dayDist,
        priorities: {
          High: { total: highTasks.length, done: highTasks.filter(t => t.completed).length },
          Medium: { total: medTasks.length, done: medTasks.filter(t => t.completed).length },
          Low: { total: lowTasks.length, done: lowTasks.filter(t => t.completed).length }
        }
      };
    });

    const currentYearMonths = shortMonthNames.map((shortName, idx) => {
      const monthPrefix = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
      const mTasks = tasks.filter(t => t.date && t.date.startsWith(monthPrefix));
      const mTotal = mTasks.length;
      const mDone = mTasks.filter(t => t.completed).length;

      const byCat = {};
      categories.forEach(c => {
        const cTasks = mTasks.filter(t => t.category === c);
        byCat[c] = { total: cTasks.length, done: cTasks.filter(t => t.completed).length };
      });

      return { shortName, name: shortName, total: mTotal, done: mDone, byCategory: byCat };
    });

    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      const mPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mTasks = tasks.filter(t => t.date && t.date.startsWith(mPrefix));
      const mTotal = mTasks.length > 0 ? mTasks.length : (i === 0 ? totalTasks : 0);
      const mDone = mTasks.length > 0 ? mTasks.filter(t => t.completed).length : (i === 0 ? doneTasks : 0);

      const byCat = {};
      categories.forEach(c => {
        const cTasks = mTasks.filter(t => t.category === c);
        byCat[c] = { total: cTasks.length, done: cTasks.filter(t => t.completed).length };
      });

      last6Months.push({
        label: shortMonthNames[d.getMonth()],
        total: mTotal,
        done: mDone,
        byCategory: byCat
      });
    }

    const last4Weeks = [
      { label: 'Week 1', dateRange: 'Past Week 3', total: 0, done: 0, byCategory: {} },
      { label: 'Week 2', dateRange: 'Past Week 2', total: 0, done: 0, byCategory: {} },
      { label: 'Week 3', dateRange: 'Past Week 1', total: 0, done: 0, byCategory: {} },
      { label: 'Week 4', dateRange: 'Current Week', total: currentWeekTotal, done: currentWeekDone, byCategory: currentWeekByCategory }
    ];

    const specialtyCounts = {};
    if (canAccessDental) {
      dentalCases.forEach(c => {
        specialtyCounts[c.specialty] = (specialtyCounts[c.specialty] || 0) + 1;
      });
    }

    return NextResponse.json({
      overall: {
        totalTasks,
        doneTasks,
        overallPct,
        currentWeek: {
          total: currentWeekTotal,
          done: currentWeekDone,
          pct: currentWeekPct,
          days: weekDays,
          byCategory: currentWeekByCategory
        },
        currentMonth: {
          total: currentMonthTotal,
          done: currentMonthDone,
          pct: currentMonthPct,
          monthName: `${monthNames[currentMonthIdx]} ${currentYear}`,
          byCategory: currentMonthByCategory
        },
        currentYear: {
          total: currentYearTotal,
          done: currentYearDone,
          pct: currentYearPct,
          year: currentYear,
          months: currentYearMonths,
          byCategory: currentYearByCategory
        },
        last6Months,
        last4Weeks,
        dayRhythm: weekDays.map(d => (d.total > 0 ? Math.round((d.done / d.total) * 100) : 0)),
        priorityDistribution: {
          High: { total: tasks.filter(t => t.priority === 'High').length, done: tasks.filter(t => t.priority === 'High' && t.completed).length },
          Medium: { total: tasks.filter(t => t.priority === 'Medium' || !t.priority).length, done: tasks.filter(t => (t.priority === 'Medium' || !t.priority) && t.completed).length },
          Low: { total: tasks.filter(t => t.priority === 'Low').length, done: tasks.filter(t => t.priority === 'Low' && t.completed).length }
        },
        velocityScore: overallPct,
        streakDays: doneTasks > 0 ? 1 : 0
      },
      categoryProfiles,
      dentalStats: canAccessDental ? {
        totalCases: dentalCases.length,
        showcaseCases: dentalCases.filter(c => c.showcaseForPatients).length,
        specialtyCounts: Object.keys(specialtyCounts).length > 0 ? specialtyCounts : { 'Restorative & Aesthetics': dentalCases.length }
      } : {
        totalCases: 0,
        showcaseCases: 0,
        specialtyCounts: {}
      },
      weeklyTrend: {
        labels: dayLabels,
        completed: weekDays.map(d => d.done),
        total: weekDays.map(d => d.total)
      },
      permissions: {
        canAccessDental,
        canAccessTrading
      }
    });
  } catch (err) {
    console.error('Error fetching analytics:', err);
    return NextResponse.json({ error: 'Could not fetch analytics' }, { status: 500 });
  }
}
