// =============================================================================
// public/studyApp.js — Interactive Study & Academic Operating System
// Inspired by colorful card reference design, vector illustrations, timetable automation
// =============================================================================

(function() {
  'use strict';

  // State
  const StudyState = {
    profile: null,
    mode: 'STUDENT', // 'STUDENT' | 'PROFESSIONAL' | 'GENERAL'
    activeTab: 'overview',
    semesters: [],
    activeSemesterId: null,
    subjects: [],
    timetableData: null,
    courses: [],
    resources: [],
    sessionsData: null,
    goalsData: null,
    selectedSubjectForDrawer: null,
    isLoading: false
  };

  // Helper for authenticated API calls
  async function studyFetch(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(window.getAuthHeaders ? window.getAuthHeaders() : {})
    };
    const res = await fetch(url, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  }

  // Toast notification helper
  function notify(msg) {
    if (typeof window.showToast === 'function') {
      window.showToast(msg);
    } else {
      console.log(msg);
    }
  }

  // =============================================================================
  // SVG ILLUSTRATIONS (Line-art with colored accents inspired by reference image)
  // =============================================================================

  const STUDY_ILLUSTRATIONS = {
    // Activity / Pinned notes (Lilac)
    activity: `
      <svg viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="15" width="22" height="22" rx="4" fill="#FFFFFF" stroke="#11141D" stroke-width="2.5" transform="rotate(-6 25 15)"/>
        <rect x="68" y="10" width="24" height="24" rx="4" fill="#FEF08A" stroke="#11141D" stroke-width="2.5" transform="rotate(4 68 10)"/>
        <rect x="115" y="18" width="20" height="20" rx="4" fill="#FFFFFF" stroke="#11141D" stroke-width="2.5" transform="rotate(8 115 18)"/>
        <path d="M10 25 Q80 35 150 25" stroke="#11141D" stroke-width="2.5" stroke-dasharray="4 4"/>
        <!-- Character body -->
        <circle cx="80" cy="52" r="14" fill="#FDE047" stroke="#11141D" stroke-width="2.5"/>
        <path d="M74 48 Q80 44 86 48" stroke="#11141D" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M68 66 C68 66 74 95 80 95 C86 95 92 66 92 66" fill="#11141D" stroke="#11141D" stroke-width="2.5"/>
        <!-- Arms pinning -->
        <path d="M70 70 L48 36" stroke="#11141D" stroke-width="3" stroke-linecap="round"/>
        <path d="M90 70 L118 36" stroke="#11141D" stroke-width="3" stroke-linecap="round"/>
        <!-- Boxes below -->
        <rect x="42" y="95" width="34" height="26" rx="4" fill="#FFFFFF" stroke="#11141D" stroke-width="2.5"/>
        <rect x="84" y="92" width="30" height="29" rx="4" fill="#FFFFFF" stroke="#11141D" stroke-width="2.5"/>
        <path d="M52 105 L66 105" stroke="#11141D" stroke-width="2"/>
        <path d="M94 102 L104 102" stroke="#11141D" stroke-width="2"/>
      </svg>
    `,

    // Armchair with Laptop (Peach / Continuous Learning)
    laptop: `
      <svg viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Floating knowledge stack -->
        <rect x="88" y="8" width="22" height="7" rx="2" fill="#FFFFFF" stroke="#11141D" stroke-width="2"/>
        <rect x="85" y="16" width="28" height="7" rx="2" fill="#BAE6FD" stroke="#11141D" stroke-width="2"/>
        <rect x="83" y="24" width="32" height="7" rx="2" fill="#FFFFFF" stroke="#11141D" stroke-width="2"/>
        <!-- Armchair -->
        <path d="M30 65 Q30 45 48 45 L112 45 Q130 45 130 65 L130 105 L30 105 Z" fill="#FFFFFF" stroke="#11141D" stroke-width="2.5"/>
        <rect x="22" y="70" width="18" height="36" rx="6" fill="#FED7AA" stroke="#11141D" stroke-width="2.5"/>
        <rect x="120" y="70" width="18" height="36" rx="6" fill="#FED7AA" stroke="#11141D" stroke-width="2.5"/>
        <!-- Person with glasses -->
        <circle cx="95" cy="42" r="12" fill="#FED7AA" stroke="#11141D" stroke-width="2.5"/>
        <circle cx="91" cy="42" r="3.5" stroke="#11141D" stroke-width="1.8"/>
        <circle cx="99" cy="42" r="3.5" stroke="#11141D" stroke-width="1.8"/>
        <path d="M94 42 L96 42" stroke="#11141D" stroke-width="2"/>
        <!-- Body & Laptop -->
        <path d="M85 54 C85 54 75 75 75 88 L110 88 C110 75 105 54 105 54 Z" fill="#93C5FD" stroke="#11141D" stroke-width="2.5"/>
        <path d="M55 78 L80 78 L85 68 L60 68 Z" fill="#11141D" stroke="#11141D" stroke-width="2"/>
        <!-- Legs & Ottoman -->
        <rect x="42" y="98" width="46" height="20" rx="6" fill="#FED7AA" stroke="#11141D" stroke-width="2.5"/>
      </svg>
    `,

    // Checklist & Magnifying Glass / Economics / Planning (Amber)
    checklist: `
      <svg viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Floating check mark badge -->
        <circle cx="98" cy="20" r="14" fill="#BBF7D0" stroke="#11141D" stroke-width="2.5"/>
        <path d="M92 20 L96 24 L105 15" stroke="#11141D" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Character studying document -->
        <circle cx="120" cy="45" r="12" fill="#FED7AA" stroke="#11141D" stroke-width="2.5"/>
        <path d="M110 58 C110 58 112 110 120 110 C128 110 130 58 130 58 Z" fill="#FEF08A" stroke="#11141D" stroke-width="2.5"/>
        <!-- Left Document -->
        <rect x="25" y="45" width="55" height="65" rx="5" fill="#FFFFFF" stroke="#11141D" stroke-width="2.5" transform="rotate(-8 25 45)"/>
        <line x1="38" y1="58" x2="68" y2="54" stroke="#11141D" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="40" y1="70" x2="65" y2="67" stroke="#11141D" stroke-width="2" stroke-linecap="round"/>
        <line x1="42" y1="82" x2="60" y2="79" stroke="#11141D" stroke-width="2" stroke-linecap="round"/>
        <!-- Magnifying glass -->
        <circle cx="75" cy="85" r="14" fill="#BAE6FD" stroke="#11141D" stroke-width="2.5"/>
        <line x1="85" y1="95" x2="102" y2="112" stroke="#11141D" stroke-width="3.5" stroke-linecap="round"/>
      </svg>
    `,

    // Books & Science / Clinical (Mint)
    book: `
      <svg viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Open master book -->
        <path d="M80 85 C65 72 30 74 20 78 L20 115 C30 110 65 110 80 120 C95 110 130 110 140 115 L140 78 C130 74 95 72 80 85 Z" fill="#FFFFFF" stroke="#11141D" stroke-width="2.5"/>
        <line x1="80" y1="85" x2="80" y2="120" stroke="#11141D" stroke-width="2"/>
        <!-- Dental / Clinical Tooth Icon or Stethoscope Accent -->
        <path d="M72 40 C68 25 92 25 88 40 C88 48 85 58 88 68 C84 66 82 56 80 56 C78 56 76 66 72 68 C75 58 72 48 72 40 Z" fill="#E0F2FE" stroke="#11141D" stroke-width="2.5"/>
        <!-- Sparkles -->
        <path d="M50 35 L52 40 L57 42 L52 44 L50 49 L48 44 L43 42 L48 40 Z" fill="#FDE047" stroke="#11141D" stroke-width="1.5"/>
        <path d="M115 35 L117 40 L122 42 L117 44 L115 49 L113 44 L108 42 L113 40 Z" fill="#FDE047" stroke="#11141D" stroke-width="1.5"/>
      </svg>
    `,

    // Math / Focus / Deep Work (Rose)
    focus: `
      <svg viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Big Hand / Coin gesture -->
        <circle cx="48" cy="28" r="9" fill="#FDE047" stroke="#11141D" stroke-width="2"/>
        <path d="M30 45 C30 38 45 38 45 45 L45 70 L30 70 Z" fill="#FED7AA" stroke="#11141D" stroke-width="2"/>
        <!-- Person thinking with hand on chin -->
        <circle cx="105" cy="46" r="14" fill="#FED7AA" stroke="#11141D" stroke-width="2.5"/>
        <path d="M96 60 C96 60 90 92 105 92 C120 92 118 60 118 60 Z" fill="#11141D" stroke="#11141D" stroke-width="2.5"/>
        <!-- Arm supporting chin -->
        <path d="M80 82 L95 82 L100 55" stroke="#11141D" stroke-width="3" stroke-linecap="round"/>
        <!-- Desk & Laptop -->
        <line x1="20" y1="110" x2="140" y2="110" stroke="#11141D" stroke-width="3" stroke-linecap="round"/>
        <rect x="62" y="92" width="28" height="18" rx="2" fill="#FFFFFF" stroke="#11141D" stroke-width="2"/>
      </svg>
    `,

    // Timetable / Calendar (Blue)
    timetable: `
      <svg viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="35" y="25" width="90" height="85" rx="10" fill="#FFFFFF" stroke="#11141D" stroke-width="2.5"/>
        <rect x="35" y="25" width="90" height="22" rx="10" fill="#BAE6FD" stroke="#11141D" stroke-width="2.5"/>
        <circle cx="55" cy="20" r="4" fill="#11141D"/>
        <circle cx="105" cy="20" r="4" fill="#11141D"/>
        <!-- Grid slots -->
        <rect x="45" y="58" width="20" height="16" rx="3" fill="#BBF7D0" stroke="#11141D" stroke-width="1.8"/>
        <rect x="70" y="58" width="20" height="16" rx="3" fill="#FED7AA" stroke="#11141D" stroke-width="1.8"/>
        <rect x="95" y="58" width="20" height="16" rx="3" fill="#C4B5FD" stroke="#11141D" stroke-width="1.8"/>
        <rect x="45" y="80" width="20" height="16" rx="3" fill="#FEF08A" stroke="#11141D" stroke-width="1.8"/>
        <rect x="70" y="80" width="20" height="16" rx="3" fill="#FBCFE8" stroke="#11141D" stroke-width="1.8"/>
        <rect x="95" y="80" width="20" height="16" rx="3" fill="#BAE6FD" stroke="#11141D" stroke-width="1.8"/>
      </svg>
    `
  };

  // Helper to pick illustration for subject/course
  function getIllustrationSvg(key, color) {
    if (STUDY_ILLUSTRATIONS[key]) return STUDY_ILLUSTRATIONS[key];
    if (color === 'peach' || color === 'orange') return STUDY_ILLUSTRATIONS.laptop;
    if (color === 'mint' || color === 'green') return STUDY_ILLUSTRATIONS.book;
    if (color === 'amber' || color === 'yellow') return STUDY_ILLUSTRATIONS.checklist;
    if (color === 'rose' || color === 'pink') return STUDY_ILLUSTRATIONS.focus;
    if (color === 'blue' || color === 'cyan') return STUDY_ILLUSTRATIONS.timetable;
    return STUDY_ILLUSTRATIONS.activity;
  }

  // =============================================================================
  // INITIALIZATION & EVENT WIRING
  // =============================================================================

  async function openStudyPage() {
    // Hide all other dashboard sections
    if (typeof window.hideAllTopLevelSections === 'function') {
      window.hideAllTopLevelSections();
    }
    const studySec = document.getElementById('studySection');
    if (studySec) {
      studySec.hidden = false;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Initial load
    await loadStudyData();
  }
  window.openStudyPage = openStudyPage;

  async function loadStudyData() {
    StudyState.isLoading = true;
    try {
      // 1. Profile & Active Semester
      const profileRes = await studyFetch('/api/study/profile').catch(() => ({ profile: null }));
      StudyState.profile = profileRes.profile;
      StudyState.mode = profileRes.profile?.mode || 'STUDENT';
      StudyState.activeSemesterId = profileRes.profile?.activeSemesterId || profileRes.activeSemester?.id || null;

      // 2. Semesters
      const semestersRes = await studyFetch('/api/study/semesters').catch(() => []);
      StudyState.semesters = semestersRes;
      if (!StudyState.activeSemesterId && semestersRes.length > 0) {
        const activeOne = semestersRes.find(s => s.isCurrent) || semestersRes[0];
        StudyState.activeSemesterId = activeOne.id;
      }

      // 3. Subjects
      const subjectsRes = await studyFetch('/api/study/subjects').catch(() => []);
      StudyState.subjects = subjectsRes;

      // 4. Timetable
      const timetableRes = await studyFetch('/api/study/timetable').catch(() => null);
      StudyState.timetableData = timetableRes;

      // 5. Courses
      const coursesRes = await studyFetch('/api/study/courses').catch(() => []);
      StudyState.courses = coursesRes;

      // 6. Resources
      const resourcesRes = await studyFetch('/api/study/resources').catch(() => []);
      StudyState.resources = resourcesRes;

      // 7. Sessions & Analytics
      const sessionsRes = await studyFetch('/api/study/sessions').catch(() => null);
      StudyState.sessionsData = sessionsRes;

      // 8. Goals & Exams
      const goalsRes = await studyFetch('/api/study/goals').catch(() => null);
      StudyState.goalsData = goalsRes;

      renderStudyApp();
    } catch (err) {
      console.error('Error loading study data:', err);
      notify('⚠️ Could not load study workspace data.');
    } finally {
      StudyState.isLoading = false;
    }
  }

  function setStudyTab(tabKey) {
    StudyState.activeTab = tabKey;
    document.querySelectorAll('.study-tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tabKey);
    });
    renderStudyTabContent();
  }

  // =============================================================================
  // MAIN RENDER CONTROLLER
  // =============================================================================

  function renderStudyApp() {
    renderStudyHeader();
    renderStudyTabContent();
  }

  function renderStudyHeader() {
    const headerTextEl = document.getElementById('studyHeaderDesc');
    const modeBadgeEl = document.getElementById('studyCurrentModeBadge');
    const streakEl = document.getElementById('studyStreakVal');

    if (modeBadgeEl) {
      const modeIcons = {
        STUDENT: '🎓 Student Mode',
        PROFESSIONAL: '💼 Professional / Practitioner',
        GENERAL: '📚 General Learner'
      };
      modeBadgeEl.textContent = modeIcons[StudyState.mode] || '🎓 Student Mode';
    }

    if (headerTextEl) {
      if (StudyState.mode === 'STUDENT') {
        const activeSem = StudyState.semesters.find(s => s.id === StudyState.activeSemesterId);
        const semText = activeSem ? `${activeSem.name} • ` : '';
        const program = StudyState.profile?.program || 'Undergraduate Studies';
        const year = StudyState.profile?.yearLevel ? ` (${StudyState.profile.yearLevel})` : '';
        headerTextEl.textContent = `${semText}${program}${year} • Structured semester progress & recurring classes`;
      } else if (StudyState.mode === 'PROFESSIONAL') {
        const field = StudyState.profile?.program || 'Clinical & Professional Practice';
        headerTextEl.textContent = `${field} • Courses, clinical resource vault, CME tracking & study sessions`;
      } else {
        headerTextEl.textContent = `Continuous learning roadmap, books, courses and personal study goals`;
      }
    }

    if (streakEl && StudyState.sessionsData) {
      streakEl.textContent = `${StudyState.sessionsData.analytics?.streak || 0} Days`;
    }
  }

  function renderStudyTabContent() {
    const container = document.getElementById('studyTabContent');
    if (!container) return;

    if (StudyState.activeTab === 'overview') {
      renderOverviewView(container);
    } else if (StudyState.activeTab === 'subjects') {
      renderSubjectsView(container);
    } else if (StudyState.activeTab === 'timetable') {
      renderTimetableView(container);
    } else if (StudyState.activeTab === 'courses') {
      renderCoursesView(container);
    } else if (StudyState.activeTab === 'resources') {
      renderResourcesView(container);
    } else if (StudyState.activeTab === 'sessions') {
      renderSessionsView(container);
    } else if (StudyState.activeTab === 'analytics') {
      renderAnalyticsView(container);
    }
  }

  // =============================================================================
  // TAB 1: OVERVIEW (Motivating Study Dashboard)
  // =============================================================================

  function renderOverviewView(container) {
    // Compute total progress
    let totalChapters = 0;
    let completedChapters = 0;
    StudyState.subjects.forEach(s => {
      totalChapters += s.totalChapters || 0;
      completedChapters += s.completedChapters || 0;
    });
    const overallProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    // SVG radial calculation (circumference 2 * PI * 45 = 282.7)
    const circleCircumference = 282.7;
    const strokeOffset = circleCircumference - (circleCircumference * overallProgress) / 100;

    // Today's classes from timetableData
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayClasses = StudyState.timetableData?.scheduleByDay?.[todayName] || [];

    // Filter active items for cards grid (top 6)
    const activeSubjects = StudyState.subjects.slice(0, 6);

    container.innerHTML = `
      <!-- Hero Metric Box & Today Schedule -->
      <div class="study-overview-hero">
        <div class="study-hero-progress-box">
          <div class="study-box-head">
            <h3>Overall Study Progress</h3>
            <span class="study-accent-subhead">${StudyState.mode === 'STUDENT' ? 'Current Academic Progress' : 'Learning Completion'}</span>
          </div>

          <div class="study-progress-ring-wrap">
            <svg class="study-progress-circle-svg" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="studyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#8B5CF6"/>
                  <stop offset="100%" stop-color="#EC4899"/>
                </linearGradient>
              </defs>
              <circle class="study-progress-circle-bg" cx="50" cy="50" r="45" />
              <circle class="study-progress-circle-bar" cx="50" cy="50" r="45"
                      stroke-dasharray="${circleCircumference}"
                      stroke-dashoffset="${strokeOffset}" />
            </svg>
            <div>
              <div class="study-overview-pct">${overallProgress}%</div>
              <div class="study-overview-sub">${completedChapters} of ${totalChapters} chapters done</div>
            </div>
          </div>

          <div class="study-hero-progress-stats">
            <div class="study-stat-item">
              <strong>${StudyState.subjects.length}</strong>
              <span>Active Subjects</span>
            </div>
            <div class="study-stat-item">
              <strong>${StudyState.sessionsData?.analytics?.totalHours || '0.0'}h</strong>
              <span>Study Logged</span>
            </div>
          </div>
        </div>

        <!-- Today's Schedule -->
        <div class="study-today-schedule-box">
          <div class="study-box-head">
            <h3>Today's Academic Schedule (${todayName})</h3>
            <button type="button" class="btn-secondary" style="font-size: 11.5px; padding: 4px 10px; border-radius: 999px;" onclick="StudyHub.switchTab('timetable')">
              Full Timetable &rarr;
            </button>
          </div>

          <div class="study-schedule-list">
            ${todayClasses.length === 0 ? `
              <div class="study-empty-state" style="padding: 24px 0;">
                <span class="empty-icon">☕</span>
                <span>No classes scheduled for today (${todayName}). Enjoy deep study or revision!</span>
              </div>
            ` : todayClasses.map(c => `
              <div class="study-schedule-item ${c.completed ? 'is-completed' : ''}" id="schedItem_${c.slotId}">
                <div class="study-schedule-time">${c.startTime} - ${c.endTime}</div>
                <span class="study-schedule-type-badge type-${(c.type || 'lecture').toLowerCase()}">${c.type || 'Lecture'}</span>
                <div class="study-schedule-title">${c.title}</div>
                <button type="button" class="study-schedule-check-btn ${c.completed ? 'checked' : ''}"
                        onclick="StudyHub.toggleTodayClass('${c.slotId}', '${c.date}', ${!c.completed}, '${c.title.replace(/'/g, "\\'")}', '${c.subjectId || ''}')"
                        title="${c.completed ? 'Mark incomplete' : 'Mark completed'}">
                  ${c.completed ? '✓' : ''}
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Quick Action Floating Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin: 28px 0 16px;">
        <h2 class="study-section-title">Active Subjects &amp; Courses</h2>
        <div style="display:flex; gap:10px;">
          <button type="button" class="btn-secondary" style="font-size:12.5px; border-radius:999px; padding:6px 14px;" onclick="StudyHub.openAddSubjectModal()">+ Add Subject</button>
          <button type="button" class="btn-secondary" style="font-size:12.5px; border-radius:999px; padding:6px 14px;" onclick="StudyHub.openAddCourseModal()">+ Add Course</button>
        </div>
      </div>

      <!-- Colorful Cards Grid (Inspired by Reference Design) -->
      ${StudyState.subjects.length === 0 && StudyState.courses.length === 0 ? `
        <div class="study-empty-state" style="background: var(--study-box-bg); border: 1px dashed var(--study-box-border); border-radius: 20px; padding: 50px 20px;">
          <span class="empty-icon">📚</span>
          <h3 style="color:var(--study-text-primary); font-size:18px; margin: 8px 0;">Your Study Workspace is Fresh &amp; Ready</h3>
          <p style="max-width:480px; margin:0 auto 20px; line-height:1.5; color:var(--study-text-secondary);">Get started by loading a starter pack or adding your university subjects, chapters, and weekly schedule.</p>
          <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
            <button type="button" class="btn-primary" style="border-radius:999px; padding:10px 22px;" onclick="StudyHub.seedStarterPack('dental')">
              ⚡ Load Dental Student Starter Pack
            </button>
            <button type="button" class="btn-secondary" style="border-radius:999px; padding:10px 20px;" onclick="StudyHub.openAddSubjectModal()">
              + Create Custom Subject
            </button>
          </div>
        </div>
      ` : `
        <div class="study-cards-grid">
          ${activeSubjects.map(sub => renderSubjectCard(sub)).join('')}
        </div>
      `}
    `;
  }

  // =============================================================================
  // SUBJECT CARD RENDERER (Clean Pastel Surfaces & Character Illustration)
  // =============================================================================

  function renderSubjectCard(sub) {
    const colorClass = `card-${sub.color || 'purple'}`;
    const illustrationSvg = getIllustrationSvg(sub.icon, sub.color);

    return `
      <div class="study-card ${colorClass}" onclick="StudyHub.openSubjectDrawer('${sub.id}')">
        <div class="study-card-header">
          <span class="study-card-category-pill">${escapeHtml(sub.category || 'Clinical')}</span>
          <span class="study-card-semester-tag">${escapeHtml(sub.semesterName || 'Semester 1')}</span>
        </div>

        <div class="study-card-illustration-wrap">
          ${illustrationSvg}
        </div>

        <div class="study-card-body">
          <h3 class="study-card-title">${escapeHtml(sub.name)}</h3>
          <div class="study-card-meta">
            <span>${sub.completedChapters} / ${sub.totalChapters} Chapters</span>
            <span>${sub.progressPct}%</span>
          </div>

          <div class="study-card-progress-bar">
            <div class="study-card-progress-fill" style="width: ${sub.progressPct}%;"></div>
          </div>

          <div class="study-card-next-pill">
            <span>Next: <strong>${escapeHtml(sub.nextChapter)}</strong></span>
            <span class="arrow">&rarr;</span>
          </div>
        </div>
      </div>
    `;
  }

  // =============================================================================
  // TAB 2: SUBJECTS & CHAPTERS
  // =============================================================================

  function renderSubjectsView(container) {
    const activeSem = StudyState.semesters.find(s => s.id === StudyState.activeSemesterId);

    container.innerHTML = `
      <div class="study-timetable-controls">
        <!-- Semester Switcher Tabs (Semester 1, Semester 2) -->
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <span style="font-size:12.5px; font-weight:700; color:var(--study-text-muted); text-transform:uppercase; margin-right:4px;">Academic Semester:</span>
          ${StudyState.semesters.map(sem => `
            <button type="button" class="study-tab-btn ${sem.id === StudyState.activeSemesterId ? 'active' : ''}"
                    onclick="StudyHub.selectSemester('${sem.id}')">
              ${sem.name} ${sem.isCurrent ? '⭐' : ''} (${sem.progressPct || 0}%)
            </button>
          `).join('')}
          <button type="button" class="btn-secondary" style="font-size:12px; border-radius:999px; padding:6px 14px;" onclick="StudyHub.openAddSemesterModal()">
            + Add Semester
          </button>
        </div>

        <button type="button" class="study-quick-add-btn" onclick="StudyHub.openAddSubjectModal()">
          <span>+</span> Add Subject
        </button>
      </div>

      <!-- Semester Date Bar if dates exist -->
      ${activeSem && activeSem.startDate && activeSem.endDate ? `
        <div class="study-sem-banner">
          <span>📅 <strong>${activeSem.name}</strong> Period: ${activeSem.startDate} to ${activeSem.endDate}</span>
          ${activeSem.examStartDate ? `<span class="study-exam-badge">⚠️ Exams Period: ${activeSem.examStartDate} to ${activeSem.examEndDate || ''}</span>` : ''}
        </div>
      ` : ''}

      <!-- Subject Cards Grid -->
      <div class="study-cards-grid">
        ${StudyState.subjects.map(sub => renderSubjectCard(sub)).join('')}
      </div>
    `;
  }

  // =============================================================================
  // TAB 3: WEEKLY TIMETABLE
  // =============================================================================

  function renderTimetableView(container) {
    const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const scheduleByDay = StudyState.timetableData?.scheduleByDay || {};
    const weekDates = StudyState.timetableData?.weekDates || [];

    container.innerHTML = `
      <div class="study-timetable-controls">
        <div>
          <h2 class="study-section-title">Weekly Academic Schedule</h2>
          <p class="study-section-desc">Automated recurring classes. Classes populate every week automatically without manual recreation.</p>
        </div>

        <button type="button" class="study-quick-add-btn" onclick="StudyHub.openAddTimetableModal()">
          <span>+</span> Add Class Slot
        </button>
      </div>

      <div class="study-timetable-grid">
        ${days.map((dayName, idx) => {
          const isToday = dayName.toLowerCase() === todayName.toLowerCase();
          const daySlots = scheduleByDay[dayName] || [];
          const dateInfo = weekDates[idx] || {};

          return `
            <div class="study-timetable-col ${isToday ? 'is-today' : ''}">
              <div class="study-timetable-col-head">
                <span class="study-timetable-day-name">${dayName} ${isToday ? '• Today' : ''}</span>
                <span class="study-timetable-date-badge">${dateInfo.date || ''}</span>
              </div>

              <div class="study-timetable-cards">
                ${daySlots.length === 0 ? `
                  <div style="text-align:center; padding:30px 6px; color:var(--study-text-muted); font-size:12px;">
                    No classes
                  </div>
                ` : daySlots.map(slot => `
                  <div class="study-time-slot-card slot-${slot.color || 'purple'}">
                    <div class="slot-time-badge">${slot.startTime} - ${slot.endTime}</div>
                    <div class="slot-title">${escapeHtml(slot.title)}</div>
                    <div class="slot-footer">
                      <span>${slot.type}</span>
                      ${slot.location ? `<span>📍 ${escapeHtml(slot.location)}</span>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // =============================================================================
  // TAB 4: COURSES
  // =============================================================================

  function renderCoursesView(container) {
    container.innerHTML = `
      <div class="study-timetable-controls">
        <div>
          <h2 class="study-section-title">Courses &amp; Clinical Certifications</h2>
          <p class="study-section-desc">Track modules, lessons, and completion certificates.</p>
        </div>

        <button type="button" class="study-quick-add-btn" onclick="StudyHub.openAddCourseModal()">
          <span>+</span> Add Course
        </button>
      </div>

      ${StudyState.courses.length === 0 ? `
        <div class="study-empty-state" style="background:var(--study-box-bg); border: 1px dashed var(--study-box-border); border-radius:20px; padding:50px 20px;">
          <span class="empty-icon">💻</span>
          <h3 style="color:var(--study-text-primary); margin:10px 0;">No courses logged yet</h3>
          <button type="button" class="btn-primary" style="border-radius:999px; padding:10px 22px; margin-top:10px;" onclick="StudyHub.openAddCourseModal()">
            + Add Your First Course
          </button>
        </div>
      ` : `
        <div class="study-cards-grid">
          ${StudyState.courses.map(course => {
            const colorClass = `card-${course.color || 'peach'}`;
            return `
              <div class="study-card ${colorClass}" style="min-height:280px;">
                <div class="study-card-header">
                  <span class="study-card-category-pill">${escapeHtml(course.category || 'Online Course')}</span>
                  <span class="study-card-semester-tag">${escapeHtml(course.provider || '')}</span>
                </div>

                <div class="study-card-illustration-wrap">
                  ${STUDY_ILLUSTRATIONS.laptop}
                </div>

                <div class="study-card-body">
                  <h3 class="study-card-title">${escapeHtml(course.name)}</h3>
                  <div class="study-card-meta">
                    <span>${course.completedLessons} / ${course.totalLessons} Lessons</span>
                    <span>${course.progressPct}%</span>
                  </div>

                  <div class="study-card-progress-bar">
                    <div class="study-card-progress-fill" style="width: ${course.progressPct}%;"></div>
                  </div>

                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                    ${course.linkUrl ? `
                      <a href="${escapeHtml(course.linkUrl)}" target="_blank" rel="noopener noreferrer" class="study-card-next-pill" style="text-decoration:none;" onclick="event.stopPropagation();">
                        <span>Continue Learning &rarr;</span>
                      </a>
                    ` : `
                      <div class="study-card-next-pill" onclick="StudyHub.incrementCourseLesson('${course.id}', 1); event.stopPropagation();">
                        <span>+1 Lesson Done</span>
                      </div>
                    `}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;
  }

  // =============================================================================
  // TAB 5: BOOKS & STUDY RESOURCES
  // =============================================================================

  function renderResourcesView(container) {
    container.innerHTML = `
      <div class="study-timetable-controls">
        <div>
          <h2 class="study-section-title">Books, Articles &amp; Clinical Resources</h2>
          <p class="study-section-desc">Reading list with live page counters and progress tracking.</p>
        </div>

        <button type="button" class="study-quick-add-btn" onclick="StudyHub.openAddResourceModal()">
          <span>+</span> Add Book / Resource
        </button>
      </div>

      ${StudyState.resources.length === 0 ? `
        <div class="study-empty-state" style="background:var(--study-box-bg); border: 1px dashed var(--study-box-border); border-radius:20px; padding:50px 20px;">
          <span class="empty-icon">📖</span>
          <h3 style="color:var(--study-text-primary); margin:10px 0;">No books or resources added yet</h3>
          <button type="button" class="btn-primary" style="border-radius:999px; padding:10px 22px; margin-top:10px;" onclick="StudyHub.openAddResourceModal()">
            + Add Book or PDF
          </button>
        </div>
      ` : `
        <div class="study-cards-grid">
          ${StudyState.resources.map(res => {
            const colorClass = `card-${res.color || 'mint'}`;
            return `
              <div class="study-card ${colorClass}" style="min-height:280px;">
                <div class="study-card-header">
                  <span class="study-card-category-pill">${escapeHtml(res.type || 'Book')}</span>
                  <span class="study-card-semester-tag">${escapeHtml(res.author || '')}</span>
                </div>

                <div class="study-card-illustration-wrap">
                  ${STUDY_ILLUSTRATIONS.book}
                </div>

                <div class="study-card-body">
                  <h3 class="study-card-title">${escapeHtml(res.title)}</h3>
                  <div class="study-card-meta">
                    <span>${res.totalPages ? `Page ${res.currentPage} / ${res.totalPages}` : res.status}</span>
                    <span>${res.progressPct}%</span>
                  </div>

                  <div class="study-card-progress-bar">
                    <div class="study-card-progress-fill" style="width: ${res.progressPct}%;"></div>
                  </div>

                  <!-- Quick Page Increment Steppers -->
                  <div style="display:flex; gap:8px; align-items:center; margin-top:8px;">
                    <button type="button" class="btn-secondary" style="background:rgba(255,255,255,0.7); color:#000; border:none; padding:4px 10px; border-radius:8px; font-weight:700; font-size:11.5px;" onclick="StudyHub.updateBookPages('${res.id}', 10)">
                      +10 Pages
                    </button>
                    <button type="button" class="btn-secondary" style="background:rgba(255,255,255,0.7); color:#000; border:none; padding:4px 10px; border-radius:8px; font-weight:700; font-size:11.5px;" onclick="StudyHub.updateBookPages('${res.id}', 1)">
                      +1 Page
                    </button>
                    ${res.linkUrl ? `
                      <a href="${escapeHtml(res.linkUrl)}" target="_blank" rel="noopener noreferrer" style="margin-left:auto; font-size:12px; font-weight:700; color:#11141D; text-decoration:underline;">
                        Open &rarr;
                      </a>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    `;
  }

  // =============================================================================
  // TAB 6: STUDY SESSIONS & HOURS
  // =============================================================================

  function renderSessionsView(container) {
    const analytics = StudyState.sessionsData?.analytics || {};
    const sessions = StudyState.sessionsData?.sessions || [];

    container.innerHTML = `
      <div class="study-session-box">
        <div class="session-stat-card">
          <div class="session-stat-icon">⏱️</div>
          <div>
            <strong style="font-size:24px; color:var(--study-text-primary); display:block;">${analytics.totalHours || '0.0'} Hours</strong>
            <span style="font-size:12px; color:var(--study-text-muted); text-transform:uppercase; font-weight:700;">Total Study Time Logged</span>
          </div>
        </div>

        <div class="session-stat-card">
          <div class="session-stat-icon">📅</div>
          <div>
            <strong style="font-size:24px; color:var(--study-text-primary); display:block;">${analytics.weekHours || '0.0'} Hours</strong>
            <span style="font-size:12px; color:var(--study-text-muted); text-transform:uppercase; font-weight:700;">This Week</span>
          </div>
        </div>

        <div class="session-stat-card">
          <div class="session-stat-icon">🔥</div>
          <div>
            <strong style="font-size:24px; color:#d97706; display:block;">${analytics.streak || 0} Days</strong>
            <span style="font-size:12px; color:var(--study-text-muted); text-transform:uppercase; font-weight:700;">Current Streak</span>
          </div>
        </div>

        <button type="button" class="study-quick-add-btn" onclick="StudyHub.openLogSessionModal()">
          <span>+</span> Log Study Session
        </button>
      </div>

      <h3 style="font-size:18px; color:var(--study-text-primary); margin-bottom:14px;">Recent Study Logs</h3>
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${sessions.length === 0 ? `
          <div class="study-empty-state">No study sessions logged yet. Log your first study sprint!</div>
        ` : sessions.map(s => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 20px; background:var(--study-box-bg); border:1px solid var(--study-box-border); border-radius:12px; box-shadow:var(--study-box-shadow);">
            <div>
              <strong style="color:var(--study-text-primary); font-size:15px; display:block;">${escapeHtml(s.subject?.name || 'General Revision')}</strong>
              <span style="font-size:12.5px; color:var(--study-text-secondary);">${s.type} • ${s.notes ? escapeHtml(s.notes) : ''}</span>
            </div>
            <div style="text-align:right;">
              <span style="font-size:16px; font-weight:800; color:var(--study-accent-purple); display:block;">${s.durationMinutes}m</span>
              <span style="font-size:11.5px; color:var(--study-text-muted);">${s.date}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // =============================================================================
  // TAB 7: ANALYTICS & PROGRESS
  // =============================================================================

  function renderAnalyticsView(container) {
    const dist = StudyState.sessionsData?.analytics?.subjectDistribution || {};
    const entries = Object.entries(dist);

    container.innerHTML = `
      <div style="margin-bottom:24px;">
        <h2 class="study-section-title">Study Analytics &amp; Hours Breakdown</h2>
        <p class="study-section-desc">Visual summary of time invested across subjects and topics.</p>
      </div>

      <div style="background:var(--study-box-bg); border:1px solid var(--study-box-border); border-radius:20px; padding:24px; box-shadow:var(--study-box-shadow);">
        <h3 style="font-size:16px; color:var(--study-text-primary); margin:0 0 16px;">Study Minutes by Subject</h3>
        ${entries.length === 0 ? `
          <div class="study-empty-state">Log study sessions to see hours distribution charts.</div>
        ` : entries.map(([subName, mins]) => {
          const maxMins = Math.max(...Object.values(dist), 60);
          const pct = Math.round((mins / maxMins) * 100);
          return `
            <div style="margin-bottom:14px;">
              <div style="display:flex; justify-content:space-between; font-size:13.5px; margin-bottom:6px;">
                <strong style="color:var(--study-text-primary);">${escapeHtml(subName)}</strong>
                <span style="color:var(--study-accent-purple); font-weight:700;">${(mins / 60).toFixed(1)} hrs (${mins}m)</span>
              </div>
              <div style="height:10px; background:var(--study-ring-bg); border-radius:999px; overflow:hidden;">
                <div style="height:100%; width:${pct}%; background:linear-gradient(90deg, #8B5CF6, #EC4899); border-radius:999px;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // =============================================================================
  // CHAPTER MANAGER DRAWER (Interactive Checklist with 1-Click Statuses)
  // =============================================================================

  async function openSubjectDrawer(subjectId) {
    const subject = StudyState.subjects.find(s => s.id === subjectId);
    if (!subject) return;

    StudyState.selectedSubjectForDrawer = subject;
    const drawer = document.getElementById('studyChapterDrawer');
    const backdrop = document.getElementById('studyDrawerBackdrop');
    if (!drawer || !backdrop) return;

    renderChapterDrawerContent(subject);
    drawer.classList.add('open');
    backdrop.classList.add('active');
  }

  function renderChapterDrawerContent(subject) {
    const titleEl = document.getElementById('studyDrawerSubjectTitle');
    const listEl = document.getElementById('studyDrawerChapterList');
    if (titleEl) titleEl.textContent = subject.name;
    if (!listEl) return;

    const chapters = subject.chapters || [];

    listEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <span style="font-size:13px; color:var(--study-text-secondary);">${subject.completedChapters} of ${subject.totalChapters} completed (${subject.progressPct}%)</span>
        <button type="button" class="btn-secondary" style="font-size:11px; padding:4px 10px; border-radius:8px; color:#ef4444;" onclick="StudyHub.deleteSubject('${subject.id}')">
          Delete Subject
        </button>
      </div>

      <div class="study-card-progress-bar" style="height:6px; margin-bottom:20px;">
        <div class="study-card-progress-fill" style="width:${subject.progressPct}%; background:#34d399;"></div>
      </div>

      <div id="studyChaptersContainer">
        ${chapters.length === 0 ? `
          <div class="study-empty-state">No chapters added yet. Quick-add chapters below!</div>
        ` : chapters.map((ch, idx) => {
          let statusClass = 'status-not-started';
          let statusLabel = '⚪ Not started';
          if (ch.status === 'IN_PROGRESS') {
            statusClass = 'status-in-progress';
            statusLabel = '🟡 In progress';
          } else if (ch.status === 'COMPLETED') {
            statusClass = 'status-completed';
            statusLabel = '🟢 Completed ✓';
          }

          return `
            <div class="study-chapter-item" id="chapItem_${ch.id}">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:12px; color:var(--study-text-muted); font-weight:700;">#${idx + 1}</span>
                <strong style="font-size:14px; color:var(--study-text-primary);">${escapeHtml(ch.title)}</strong>
              </div>
              <div style="display:flex; align-items:center; gap:8px;">
                <button type="button" class="chapter-status-pill ${statusClass}" onclick="StudyHub.cycleChapterStatus('${ch.id}', '${ch.status}')">
                  ${statusLabel}
                </button>
                <button type="button" style="background:none; border:none; color:var(--study-text-muted); cursor:pointer; font-size:14px;" onclick="StudyHub.deleteChapter('${ch.id}')" title="Delete">
                  ✕
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Quick Add Chapter Input -->
      <div class="chapter-quick-add-wrap">
        <input type="text" id="quickAddChapterInput" placeholder="Add chapter name (e.g. Chapter 14 — Pulp Therapy)..." onkeydown="if(event.key==='Enter') StudyHub.submitQuickChapter('${subject.id}')" />
        <button type="button" class="btn-primary" style="border-radius:10px; padding:0 18px;" onclick="StudyHub.submitQuickChapter('${subject.id}')">
          Add
        </button>
      </div>
    `;
  }

  function closeSubjectDrawer() {
    const drawer = document.getElementById('studyChapterDrawer');
    const backdrop = document.getElementById('studyDrawerBackdrop');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
  }

  // =============================================================================
  // ACTIONS & MODALS HANDLERS
  // =============================================================================

  // Cycle chapter status: NOT_STARTED -> IN_PROGRESS -> COMPLETED -> NOT_STARTED
  async function cycleChapterStatus(chapterId, currentStatus) {
    const nextStatus = currentStatus === 'NOT_STARTED' ? 'IN_PROGRESS'
                     : currentStatus === 'IN_PROGRESS' ? 'COMPLETED'
                     : 'NOT_STARTED';

    try {
      await studyFetch('/api/study/chapters', {
        method: 'PATCH',
        body: JSON.stringify({ id: chapterId, status: nextStatus })
      });

      if (nextStatus === 'COMPLETED') {
        notify('🎉 Chapter marked completed!');
      }

      // Reload subjects in background and update drawer
      const subjectsRes = await studyFetch('/api/study/subjects');
      StudyState.subjects = subjectsRes;

      if (StudyState.selectedSubjectForDrawer) {
        const updatedSub = subjectsRes.find(s => s.id === StudyState.selectedSubjectForDrawer.id);
        if (updatedSub) {
          StudyState.selectedSubjectForDrawer = updatedSub;
          renderChapterDrawerContent(updatedSub);
        }
      }

      renderStudyHeader();
      renderStudyTabContent();
    } catch (err) {
      console.error(err);
      notify('Failed to update chapter');
    }
  }

  async function submitQuickChapter(subjectId) {
    const input = document.getElementById('quickAddChapterInput');
    if (!input || !input.value.trim()) return;

    try {
      await studyFetch('/api/study/chapters', {
        method: 'POST',
        body: JSON.stringify({ subjectId, title: input.value.trim() })
      });
      input.value = '';

      const subjectsRes = await studyFetch('/api/study/subjects');
      StudyState.subjects = subjectsRes;
      const updatedSub = subjectsRes.find(s => s.id === subjectId);
      if (updatedSub) {
        StudyState.selectedSubjectForDrawer = updatedSub;
        renderChapterDrawerContent(updatedSub);
      }
      renderStudyTabContent();
    } catch (err) {
      console.error(err);
      notify('Could not add chapter');
    }
  }

  async function deleteChapter(chapterId) {
    try {
      await studyFetch(`/api/study/chapters?id=${chapterId}`, { method: 'DELETE' });
      const subjectsRes = await studyFetch('/api/study/subjects');
      StudyState.subjects = subjectsRes;
      if (StudyState.selectedSubjectForDrawer) {
        const updatedSub = subjectsRes.find(s => s.id === StudyState.selectedSubjectForDrawer.id);
        if (updatedSub) {
          StudyState.selectedSubjectForDrawer = updatedSub;
          renderChapterDrawerContent(updatedSub);
        }
      }
      renderStudyTabContent();
    } catch (err) {
      console.error(err);
      notify('Could not delete chapter');
    }
  }

  async function deleteSubject(subjectId) {
    if (!confirm('Are you sure you want to delete this subject and all its chapters?')) return;
    try {
      await studyFetch(`/api/study/subjects?id=${subjectId}`, { method: 'DELETE' });
      closeSubjectDrawer();
      await loadStudyData();
      notify('Subject removed.');
    } catch (err) {
      console.error(err);
      notify('Could not delete subject');
    }
  }

  // Toggle today's class occurrence
  async function toggleTodayClass(slotId, date, completed, title, subjectId) {
    try {
      await studyFetch('/api/study/lectures', {
        method: 'PATCH',
        body: JSON.stringify({ slotId, date, completed, title, subjectId })
      });

      // Reload timetable
      const timetableRes = await studyFetch('/api/study/timetable');
      StudyState.timetableData = timetableRes;
      renderStudyTabContent();
      notify(completed ? '✅ Class marked completed!' : 'Marked incomplete');
    } catch (err) {
      console.error(err);
      notify('Failed to update class');
    }
  }

  // Quick book page updater
  async function updateBookPages(resourceId, delta) {
    try {
      await studyFetch('/api/study/resources', {
        method: 'PATCH',
        body: JSON.stringify({ id: resourceId, deltaPages: delta })
      });
      const res = await studyFetch('/api/study/resources');
      StudyState.resources = res;
      renderStudyTabContent();
    } catch (err) {
      console.error(err);
      notify('Could not update reading progress');
    }
  }

  async function incrementCourseLesson(courseId, delta) {
    const course = StudyState.courses.find(c => c.id === courseId);
    if (!course) return;
    const newCount = Math.min((course.totalLessons || 100), (course.completedLessons || 0) + delta);
    try {
      await studyFetch('/api/study/courses', {
        method: 'PATCH',
        body: JSON.stringify({ id: courseId, completedLessons: newCount })
      });
      const res = await studyFetch('/api/study/courses');
      StudyState.courses = res;
      renderStudyTabContent();
    } catch (err) {
      console.error(err);
      notify('Could not update course progress');
    }
  }

  // Mode Switcher Modal
  function openModeModal() {
    openModal('studyModeModal');
  }

  async function selectStudyMode(mode) {
    try {
      await studyFetch('/api/study/profile', {
        method: 'POST',
        body: JSON.stringify({ mode })
      });
      StudyState.mode = mode;
      closeModal('studyModeModal');
      renderStudyHeader();
      renderStudyTabContent();
      notify(`Switched to ${mode} mode!`);
    } catch (err) {
      console.error(err);
      notify('Failed to change study mode');
    }
  }

  // Modal Open/Close helpers
  function openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) {
      m.classList.add('is-open');
      m.style.setProperty('display', 'flex', 'important');
      document.body.style.overflow = 'hidden';
    }
  }
  function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) {
      m.classList.remove('is-open');
      m.style.setProperty('display', 'none', 'important');
      document.body.style.overflow = '';
    }
  }

  // Starter pack seeder (Dental Student Starter Pack)
  async function seedStarterPack(type) {
    StudyState.isLoading = true;
    notify('⚡ Generating Dental Student curriculum & timetable...');
    try {
      // 1. Create Semesters
      const sem1 = await studyFetch('/api/study/semesters', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Semester 1',
          academicYear: '2026-2027',
          startDate: '2026-09-01',
          endDate: '2027-01-25',
          isCurrent: true
        })
      });

      // 2. Create Subjects with Chapters
      const dentalSubjects = [
        {
          name: 'Operative Dentistry',
          code: 'DENT-401',
          color: 'purple',
          icon: 'activity',
          category: 'Clinical',
          semesterId: sem1.id,
          chapters: [
            'Chapter 1 — Principles of Cavity Preparation',
            'Chapter 2 — Dental Amalgam Restorations',
            'Chapter 3 — Composite Restorations & Bonding Agents',
            'Chapter 4 — Isolation & Dental Dam Applications',
            'Chapter 5 — Glass Ionomer Cements',
            'Chapter 6 — Complex Restorations & Cuspal Protection'
          ]
        },
        {
          name: 'Endodontics',
          code: 'DENT-402',
          color: 'peach',
          icon: 'laptop',
          category: 'Clinical',
          semesterId: sem1.id,
          chapters: [
            'Chapter 1 — Biology of Dental Pulp & Periapex',
            'Chapter 2 — Endodontic Examination & Diagnosis',
            'Chapter 3 — Access Cavity Preparation',
            'Chapter 4 — Cleaning & Shaping Root Canals',
            'Chapter 5 — Obturation Techniques',
            'Chapter 6 — Endodontic Emergencies'
          ]
        },
        {
          name: 'Oral Anatomy & Histology',
          code: 'DENT-305',
          color: 'mint',
          icon: 'book',
          category: 'Basic Science',
          semesterId: sem1.id,
          chapters: [
            'Chapter 1 — Morphological Development of Teeth',
            'Chapter 2 — Enamel & Dentin Complex',
            'Chapter 3 — Pulp-Periodontium Interface',
            'Chapter 4 — Temporomandibular Joint Biomechanics'
          ]
        },
        {
          name: 'Dental Pharmacology',
          code: 'PHARM-310',
          color: 'amber',
          icon: 'checklist',
          category: 'Medical Science',
          semesterId: sem1.id,
          chapters: [
            'Chapter 1 — Local Anesthetics in Dentistry',
            'Chapter 2 — Analgesics & NSAIDs',
            'Chapter 3 — Antibiotic Prophylaxis Guidelines'
          ]
        }
      ];

      for (const s of dentalSubjects) {
        await studyFetch('/api/study/subjects', {
          method: 'POST',
          body: JSON.stringify({
            name: s.name,
            code: s.code,
            color: s.color,
            icon: s.icon,
            category: s.category,
            semesterId: s.semesterId,
            defaultChapters: s.chapters
          })
        });
      }

      // 3. Create Recurring Weekly Timetable
      const recurringClasses = [
        { dayOfWeek: 'Saturday', startTime: '10:00', endTime: '12:00', title: 'Operative Dentistry Lecture', type: 'Lecture', location: 'Hall A' },
        { dayOfWeek: 'Saturday', startTime: '12:30', endTime: '14:30', title: 'Operative Phantom Lab', type: 'Lab', location: 'Phantom Lab 2' },
        { dayOfWeek: 'Sunday', startTime: '09:00', endTime: '11:00', title: 'Endodontics Lecture', type: 'Lecture', location: 'Hall B' },
        { dayOfWeek: 'Monday', startTime: '11:00', endTime: '13:00', title: 'Oral Anatomy Practical', type: 'Lab', location: 'Microbiology Lab' },
        { dayOfWeek: 'Wednesday', startTime: '10:00', endTime: '12:00', title: 'Dental Pharmacology Section', type: 'Section', location: 'Tutorial Room 4' }
      ];

      for (const cl of recurringClasses) {
        await studyFetch('/api/study/timetable', {
          method: 'POST',
          body: JSON.stringify(cl)
        });
      }

      // 4. Create Reading Resource
      await studyFetch('/api/study/resources', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Sturdevant’s Art & Science of Operative Dentistry',
          author: 'Andre V. Ritter',
          type: 'BOOK',
          totalPages: 540,
          currentPage: 165,
          color: 'purple'
        })
      });

      await loadStudyData();
      notify('🎉 Dental Student curriculum loaded successfully!');
    } catch (err) {
      console.error(err);
      notify('Failed to generate starter pack');
    }
  }

  // =============================================================================
  // FORM SUBMISSION HANDLERS
  // =============================================================================

  async function handleCreateSubjectSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('subjectFormName').value;
    const code = document.getElementById('subjectFormCode').value;
    const color = document.getElementById('subjectFormColor').value;
    const category = document.getElementById('subjectFormCategory').value;
    const semesterId = document.getElementById('subjectFormSemester').value;

    try {
      await studyFetch('/api/study/subjects', {
        method: 'POST',
        body: JSON.stringify({ name, code, color, category, semesterId: semesterId || null })
      });
      closeModal('addSubjectModal');
      await loadStudyData();
      notify('Subject created!');
    } catch (err) {
      console.error(err);
      notify('Failed to create subject');
    }
  }

  async function handleCreateTimetableSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('ttFormTitle').value;
    const dayOfWeek = document.getElementById('ttFormDay').value;
    const startTime = document.getElementById('ttFormStartTime').value;
    const endTime = document.getElementById('ttFormEndTime').value;
    const type = document.getElementById('ttFormType').value;
    const location = document.getElementById('ttFormLocation').value;
    const color = document.getElementById('ttFormColor').value;

    try {
      await studyFetch('/api/study/timetable', {
        method: 'POST',
        body: JSON.stringify({ title, dayOfWeek, startTime, endTime, type, location, color })
      });
      closeModal('addTimetableModal');
      await loadStudyData();
      notify('Class slot added to weekly schedule!');
    } catch (err) {
      console.error(err);
      notify('Failed to add timetable slot');
    }
  }

  async function handleCreateCourseSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('courseFormName').value;
    const provider = document.getElementById('courseFormProvider').value;
    const totalLessons = document.getElementById('courseFormLessons').value;
    const color = document.getElementById('courseFormColor').value;
    const linkUrl = document.getElementById('courseFormLink').value;

    try {
      await studyFetch('/api/study/courses', {
        method: 'POST',
        body: JSON.stringify({ name, provider, totalLessons, color, linkUrl })
      });
      closeModal('addCourseModal');
      await loadStudyData();
      notify('Course added!');
    } catch (err) {
      console.error(err);
      notify('Failed to add course');
    }
  }

  async function handleCreateResourceSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('resFormTitle').value;
    const author = document.getElementById('resFormAuthor').value;
    const totalPages = document.getElementById('resFormPages').value;
    const color = document.getElementById('resFormColor').value;

    try {
      await studyFetch('/api/study/resources', {
        method: 'POST',
        body: JSON.stringify({ title, author, totalPages, color, type: 'BOOK' })
      });
      closeModal('addResourceModal');
      await loadStudyData();
      notify('Book added to reading list!');
    } catch (err) {
      console.error(err);
      notify('Failed to add resource');
    }
  }

  async function handleLogSessionSubmit(e) {
    e.preventDefault();
    const subjectId = document.getElementById('sessFormSubject').value;
    const durationMinutes = document.getElementById('sessFormDuration').value;
    const type = document.getElementById('sessFormType').value;
    const notes = document.getElementById('sessFormNotes').value;

    try {
      await studyFetch('/api/study/sessions', {
        method: 'POST',
        body: JSON.stringify({ subjectId: subjectId || null, durationMinutes, type, notes })
      });
      closeModal('logSessionModal');
      await loadStudyData();
      notify('Study session logged! Keep going!');
    } catch (err) {
      console.error(err);
      notify('Failed to log session');
    }
  }

  async function handleCreateSemesterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('semFormName').value;
    const startDate = document.getElementById('semFormStart').value;
    const endDate = document.getElementById('semFormEnd').value;
    const isCurrent = document.getElementById('semFormCurrent').checked;

    try {
      await studyFetch('/api/study/semesters', {
        method: 'POST',
        body: JSON.stringify({ name, startDate, endDate, isCurrent })
      });
      closeModal('addSemesterModal');
      await loadStudyData();
      notify('Semester created!');
    } catch (err) {
      console.error(err);
      notify('Failed to create semester');
    }
  }

  // HTML escaping utility
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Expose public API on window.StudyHub
  window.StudyHub = {
    openStudyPage,
    switchTab: setStudyTab,
    selectSemester: (semId) => {
      StudyState.activeSemesterId = semId;
      renderStudyTabContent();
    },
    openSubjectDrawer,
    closeSubjectDrawer,
    cycleChapterStatus,
    submitQuickChapter,
    deleteChapter,
    deleteSubject,
    toggleTodayClass,
    updateBookPages,
    incrementCourseLesson,
    openModeModal,
    selectStudyMode,
    seedStarterPack,
    openAddSubjectModal: () => {
      // Populate semester select in modal
      const semSelect = document.getElementById('subjectFormSemester');
      if (semSelect) {
        semSelect.innerHTML = StudyState.semesters.map(s => `
          <option value="${s.id}" ${s.id === StudyState.activeSemesterId ? 'selected' : ''}>${s.name}</option>
        `).join('');
      }
      openModal('addSubjectModal');
    },
    openAddTimetableModal: () => openModal('addTimetableModal'),
    openAddCourseModal: () => openModal('addCourseModal'),
    openAddResourceModal: () => openModal('addResourceModal'),
    openAddSemesterModal: () => openModal('addSemesterModal'),
    openLogSessionModal: () => {
      const subSelect = document.getElementById('sessFormSubject');
      if (subSelect) {
        subSelect.innerHTML = `<option value="">General Study</option>` + StudyState.subjects.map(s => `
          <option value="${s.id}">${s.name}</option>
        `).join('');
      }
      openModal('logSessionModal');
    },
    closeModal,
    handleCreateSubjectSubmit,
    handleCreateTimetableSubmit,
    handleCreateCourseSubmit,
    handleCreateResourceSubmit,
    handleLogSessionSubmit,
    handleCreateSemesterSubmit
  };

  // Wire back button and dashboard links once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const backBtn = document.getElementById('backToDashboardFromStudy');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (typeof window.showDashboard === 'function') {
          window.showDashboard();
        }
      });
    }
  });

})();
