/**
 * FocusFlow — Core Application Controller
 * Responsive, clean work & focus tracker with user profile, role-tailored suggestions,
 * efficiency scoring, flexible timer, 6-day streak logic, and 7-column calendar.
 */

// Web Audio synthesizer for pleasant sound effects without external assets
class SoundFX {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playChime(type = 'success') {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'level-up') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          o.frequency.value = freq;
          g.gain.setValueAtTime(0.2, now + (i * 0.1));
          g.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.1) + 0.3);
          o.start(now + (i * 0.1));
          o.stop(now + (i * 0.1) + 0.3);
        });
      } else if (type === 'timer-start') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }
}

class FocusFlowApp {
  constructor() {
    this.gamification = new GamificationManager();
    this.engine = new PredictiveSuggestionEngine();
    this.sound = new SoundFX(true);

    // App State
    this.selectedDate = this.formatDate(new Date());
    this.calendarMonth = new Date().getMonth();
    this.calendarYear = new Date().getFullYear();
    this.taskFilter = 'all'; // 'all', 'pending', 'completed'

    // Timer State
    this.timerMode = 'stopwatch'; // 'stopwatch' | 'pomodoro'
    this.timerInterval = null;
    this.timerSeconds = 0;
    this.pomodoroTargetSeconds = 25 * 60;
    this.isTimerRunning = false;

    // Load store
    this.loadState();

    // DOM Elements
    this.cacheDom();
    this.bindEvents();

    // Initial Render
    this.initScheduleAndBanner();
    this.renderAll();
    this.wakeLock = null;
    this.evaluateGamification();
    this.startClock();
    this.startNotificationEngine();
    
    // Visibility change listener to instantly catch up timer when returning to app
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isTimerRunning) {
        this.catchUpTimer();
      }
    });

    // Onboarding check for first time users
    if (!this.userProfile) {
      setTimeout(() => this.openOnboardingModal(), 300);
    } else {
      this.renderProfile();
    }
  }

  startClock() {
    const update = () => {
      const now = new Date();
      if (this.liveClock) {
        this.liveClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    };
    update();
    setInterval(update, 1000);
  }

  formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadState() {
    this.settings = JSON.parse(localStorage.getItem('focusflow_settings')) || {
      defaultDailyTarget: 6.0,
      scheduleType: '6-day-sunday-rest',
      soundEnabled: true,
      pomodoroDuration: 25
    };
    this.sound.enabled = this.settings.soundEnabled;
    this.pomodoroTargetSeconds = (this.settings.pomodoroDuration || 25) * 60;

    this.userProfile = JSON.parse(localStorage.getItem('focusflow_profile')) || null;
    this.tasks = JSON.parse(localStorage.getItem('focusflow_tasks')) || [];
    this.sessions = JSON.parse(localStorage.getItem('focusflow_sessions')) || [];
    this.dailyNotes = JSON.parse(localStorage.getItem('focusflow_daily_notes')) || {};
    this.customDailyTargets = JSON.parse(localStorage.getItem('focusflow_daily_targets')) || {};
  }

  saveState() {
    localStorage.setItem('focusflow_settings', JSON.stringify(this.settings));
    if (this.userProfile) {
      localStorage.setItem('focusflow_profile', JSON.stringify(this.userProfile));
    }
    localStorage.setItem('focusflow_tasks', JSON.stringify(this.tasks));
    localStorage.setItem('focusflow_sessions', JSON.stringify(this.sessions));
    localStorage.setItem('focusflow_daily_notes', JSON.stringify(this.dailyNotes));
    localStorage.setItem('focusflow_daily_targets', JSON.stringify(this.customDailyTargets));
  }

  cacheDom() {
    // Header & Clock
    this.liveClock = document.getElementById('live-clock');
    this.currentDayLabel = document.getElementById('current-day-label');
    this.dayRelativeBadge = document.getElementById('day-relative-badge');
    this.btnPrevDay = document.getElementById('btn-prev-day');
    this.btnNextDay = document.getElementById('btn-next-day');
    this.btnReturnToday = document.getElementById('btn-return-today');
    this.datePicker = document.getElementById('date-picker');
    this.headerStreakCount = document.getElementById('header-streak-count');
    this.btnQuickWidgetToggle = document.getElementById('btn-quick-widget-toggle');
    this.btnOpenSettings = document.getElementById('btn-open-settings');
    this.welcomeMessage = document.getElementById('welcome-message');

    // Profile Trigger in Header
    this.btnOpenProfileModal = document.getElementById('btn-open-profile-modal');
    this.headerAvatarInitial = document.getElementById('header-avatar-initial');
    this.headerUserName = document.getElementById('header-user-name');
    this.headerUserRole = document.getElementById('header-user-role');
    this.headerBadgeCount = document.getElementById('header-badge-count');

    // Rest day banner
    this.restDayBanner = document.getElementById('rest-day-banner');
    this.btnToggleWorkRestDay = document.getElementById('btn-toggle-work-rest-day');

    // Target vs Actual & Efficiency
    this.efficiencyTierBadge = document.getElementById('efficiency-tier-badge');
    this.efficiencyScoreNum = document.getElementById('efficiency-score-num');
    this.efficiencyBarFill = document.getElementById('efficiency-bar-fill');
    this.btnEditTarget = document.getElementById('btn-edit-target');
    this.actualCircleProgress = document.getElementById('actual-circle-progress');
    this.actualHoursBig = document.getElementById('actual-hours-big');
    this.targetHoursSub = document.getElementById('target-hours-sub');
    this.remainingHoursText = document.getElementById('remaining-hours-text');
    this.barActualLabel = document.getElementById('bar-actual-label');
    this.barActualFill = document.getElementById('bar-actual-fill');
    this.overtimeAlert = document.getElementById('overtime-alert');

    // Timer (100% Free-form Input)
    this.timerModeStopwatch = document.getElementById('timer-mode-stopwatch');
    this.timerModePomodoro = document.getElementById('timer-mode-pomodoro');
    this.timerActivityInput = document.getElementById('timer-activity-input');
    this.timerDisplay = document.getElementById('timer-display');
    this.pomodoroPhaseLabel = document.getElementById('pomodoro-phase-label');
    this.pomodoroCustomHrs = document.getElementById('pomodoro-custom-hrs');
    this.pomodoroCustomMins = document.getElementById('pomodoro-custom-mins');
    this.btnTimerStartPause = document.getElementById('btn-timer-start-pause');
    this.timerBtnIcon = document.getElementById('timer-btn-icon');
    this.timerBtnText = document.getElementById('timer-btn-text');
    this.btnTimerReset = document.getElementById('btn-timer-reset');
    this.btnTimerLog = document.getElementById('btn-timer-log');

    // Notes
    this.dailyNotesInput = document.getElementById('daily-notes-input');
    this.noteSaveStatus = document.getElementById('note-save-status');

    // Tasks
    this.addTaskForm = document.getElementById('add-task-form');
    this.taskTitleInput = document.getElementById('task-title-input');
    this.taskScheduledTime = document.getElementById('task-scheduled-time');
    this.taskScheduledDate = document.getElementById('task-scheduled-date');
    this.taskEstHours = document.getElementById('task-est-hours');
    this.taskEstMins = document.getElementById('task-est-mins');
    this.tasksCountBadge = document.getElementById('tasks-count-badge');
    this.tasksList = document.getElementById('tasks-list');
    this.addTodoForm = document.getElementById('add-todo-form');
    this.todoTitleInput = document.getElementById('todo-title-input');
    this.todoScheduledTime = document.getElementById('todo-scheduled-time');
    this.todosList = document.getElementById('todos-list');
    this.todosCountBadge = document.getElementById('todos-count-badge');
    this.tabTasksAll = document.getElementById('tab-tasks-all');
    this.tabTasksPending = document.getElementById('tab-tasks-pending');
    this.tabTasksCompleted = document.getElementById('tab-tasks-completed');
    this.btnClearCompleted = document.getElementById('btn-clear-completed');

    // Suggestions
    this.suggestionsList = document.getElementById('suggestions-list');
    this.btnRefreshSuggestions = document.getElementById('btn-refresh-suggestions');

    // Calendar
    this.calPrevMonth = document.getElementById('cal-prev-month');
    this.calNextMonth = document.getElementById('cal-next-month');
    this.calMonthLabel = document.getElementById('cal-month-label');
    this.calendarDaysGrid = document.getElementById('calendar-days-grid');

    // Profile & Badges Modal
    this.profileBadgesModal = document.getElementById('profile-badges-modal');
    this.btnCloseProfileModal = document.getElementById('btn-close-profile-modal');
    this.btnEditProfile = document.getElementById('btn-edit-profile');
    this.modalProfileInitial = document.getElementById('modal-profile-initial');
    this.modalProfileName = document.getElementById('modal-profile-name');
    this.modalProfileAgeBadge = document.getElementById('modal-profile-age-badge');
    this.modalProfileRole = document.getElementById('modal-profile-role');
    this.modalProfileLevel = document.getElementById('modal-profile-level');
    this.modalProfileHours = document.getElementById('modal-profile-hours');
    this.modalProfileStreak = document.getElementById('modal-profile-streak');
    this.modalBadgesUnlockedCount = document.getElementById('modal-badges-unlocked-count');
    this.badgesGrid = document.getElementById('badges-grid');

    // Onboarding Modal
    this.onboardingModal = document.getElementById('onboarding-modal');
    this.onboardingForm = document.getElementById('onboarding-form');
    this.onboardNameInput = document.getElementById('onboard-name-input');
    this.onboardWorkInput = document.getElementById('onboard-work-input');
    this.onboardAgeInput = document.getElementById('onboard-age-input');

    // Quick Action Overlay
    this.quickWidgetOverlay = document.getElementById('quick-widget-overlay');
    this.btnCloseQuickWidget = document.getElementById('btn-close-quick-widget');
    this.quickProgressPercent = document.getElementById('quick-progress-percent');
    this.quickHoursLeft = document.getElementById('quick-hours-left');
    this.quickTasksContainer = document.getElementById('quick-tasks-container');
    this.quickTimerStatus = document.getElementById('quick-timer-status');
    this.quickTimerToggleBtn = document.getElementById('quick-timer-toggle-btn');

    // Task Edit Modal
    this.taskEditModal = document.getElementById('task-edit-modal');
    this.editTaskTitle = document.getElementById('edit-task-title');
    this.editTaskTime = document.getElementById('edit-task-time');
    this.editTaskEstH = document.getElementById('edit-task-est-h');
    this.editTaskEstM = document.getElementById('edit-task-est-m');
    this.editTaskNotes = document.getElementById('edit-task-notes');
    this.btnCloseTaskEditModal = document.getElementById('btn-close-task-edit-modal');
    this.btnSaveTaskEdit = document.getElementById('btn-save-task-edit');

    // Settings Modal
    this.settingsModal = document.getElementById('settings-modal');
    this.analyticsModal = document.getElementById('analytics-modal');
    this.snoozeModal = document.getElementById('snooze-modal');
    this.badgeModal = document.getElementById('badge-modal');
    this.badgeModalIcon = document.getElementById('badge-modal-icon');
    this.badgeModalTitle = document.getElementById('badge-modal-title');
    this.badgeModalStatus = document.getElementById('badge-modal-status');
    this.badgeModalDesc = document.getElementById('badge-modal-desc');
    this.snoozeTaskTitle = document.getElementById('snooze-task-title');
    this.snoozeTimeInput = document.getElementById('snooze-time-input');
    this.btnSnoozeConfirm = document.getElementById('btn-snooze-confirm');
    this.btnSnoozeStop = document.getElementById('btn-snooze-stop');
    this.btnSnoozeStart = document.getElementById('btn-snooze-start');
    this.btnOpenAnalytics = document.getElementById('btn-open-analytics');
    this.btnCloseAnalytics = document.getElementById('btn-close-analytics');
    this.analyticsEmoji = document.getElementById('analytics-emoji');
    this.analyticsTitle = document.getElementById('analytics-title');
    this.analyticsDesc = document.getElementById('analytics-desc');
    this.analyticsIndicator = document.getElementById('analytics-indicator');
    this.monthlyChartCanvas = document.getElementById('monthly-chart');
    this.btnCloseSettingsModal = document.getElementById('btn-close-settings-modal');
    this.settingDailyTarget = document.getElementById('setting-daily-target');
    this.settingScheduleType = document.getElementById('setting-schedule-type');
    this.settingSoundToggle = document.getElementById('setting-sound-toggle');
    this.btnSettingsEditProfile = document.getElementById('btn-settings-edit-profile');
    this.btnLoadDemoData = document.getElementById('btn-load-demo-data');
    this.btnSaveSettings = document.getElementById('btn-save-settings');
  }

  bindEvents() {
    // Date Navigation
    this.btnPrevDay.addEventListener('click', () => this.shiftDay(-1));
    this.btnNextDay.addEventListener('click', () => this.shiftDay(1));
    if (this.btnReturnToday) {
      this.btnReturnToday.addEventListener('click', () => this.selectDate(this.formatDate(new Date())));
    }
    this.datePicker.addEventListener('change', (e) => this.selectDate(e.target.value));

    // Target Edit
    this.btnEditTarget.addEventListener('click', () => this.promptTargetEdit());

    // Timer Controls
    this.timerModeStopwatch.addEventListener('click', () => this.switchTimerMode('stopwatch'));
    this.timerModePomodoro.addEventListener('click', () => this.switchTimerMode('pomodoro'));
    this.btnTimerStartPause.addEventListener('click', () => this.toggleTimer());
    this.btnTimerReset.addEventListener('click', () => this.resetTimer());
    this.btnTimerLog.addEventListener('click', () => this.logTimerSession());

    if (this.pomodoroCustomHrs && this.pomodoroCustomMins) {
      const duration = this.settings.pomodoroDuration || 25;
      this.pomodoroCustomHrs.value = Math.floor(duration / 60);
      this.pomodoroCustomMins.value = duration % 60;
      
      const updatePomo = () => {
        let h = parseInt(this.pomodoroCustomHrs.value) || 0;
        let m = parseInt(this.pomodoroCustomMins.value) || 0;
        
        if (h < 0) h = 0; if (h > 12) h = 12;
        if (m < 0) m = 0; if (m > 59) m = 59;
        if (h === 0 && m === 0) m = 1;
        
        this.pomodoroCustomHrs.value = h;
        this.pomodoroCustomMins.value = m;
        
        const totalMins = (h * 60) + m;
        this.settings.pomodoroDuration = totalMins;
        this.pomodoroTargetSeconds = totalMins * 60;
        this.saveState();
        
        if (this.timerMode === 'pomodoro' && !this.isTimerRunning) {
          this.timerSeconds = this.pomodoroTargetSeconds;
          this.updateTimerDisplay();
        }
      };

      this.pomodoroCustomHrs.addEventListener('change', updatePomo);
      this.pomodoroCustomMins.addEventListener('change', updatePomo);
    }

    // Notes autosave
    let noteTimer = null;
    this.dailyNotesInput.addEventListener('input', () => {
      this.noteSaveStatus.textContent = 'Saving...';
      clearTimeout(noteTimer);
      noteTimer = setTimeout(() => {
        this.dailyNotes[this.selectedDate] = this.dailyNotesInput.value;
        this.saveState();
        this.noteSaveStatus.textContent = 'Saved';
      }, 500);
    });

    // Add Task
    this.addTodoForm.addEventListener('submit', (e) => this.handleAddTodo(e));
    this.addTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddTask();
    });

    // Task Filter Tabs
    this.tabTasksAll.addEventListener('click', () => this.setTaskFilter('all'));
    this.tabTasksPending.addEventListener('click', () => this.setTaskFilter('pending'));
    this.tabTasksCompleted.addEventListener('click', () => this.setTaskFilter('completed'));
    this.btnClearCompleted.addEventListener('click', () => this.clearCompletedTasks());

    // Suggestions
    this.btnRefreshSuggestions.addEventListener('click', () => this.renderSuggestions());

    // Calendar navigation
    this.calPrevMonth.addEventListener('click', () => this.shiftMonth(-1));
    this.calNextMonth.addEventListener('click', () => this.shiftMonth(1));

    // Profile & Badges Modal
    this.btnOpenProfileModal.addEventListener('click', () => this.openProfileModal());
    this.btnCloseProfileModal.addEventListener('click', () => this.closeProfileModal());
    this.profileBadgesModal.addEventListener('click', (e) => {
      if (e.target === this.profileBadgesModal) this.closeProfileModal();
    });
    this.btnEditProfile.addEventListener('click', () => {
      this.closeProfileModal();
      this.openOnboardingModal(true);
    });
    if (this.btnSettingsEditProfile) {
      this.btnSettingsEditProfile.addEventListener('click', () => {
        this.closeSettingsModal();
        this.openOnboardingModal(true);
      });
    }

    // Onboarding Form
    this.onboardingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleOnboardingSubmit();
    });

    // Quick Widget Overlay
    this.btnQuickWidgetToggle.addEventListener('click', () => this.openQuickWidget());
    this.btnCloseQuickWidget.addEventListener('click', () => this.closeQuickWidget());
    this.quickWidgetOverlay.addEventListener('click', (e) => {
      if (e.target === this.quickWidgetOverlay) this.closeQuickWidget();
    });
    this.quickTimerToggleBtn.addEventListener('click', () => this.toggleTimer());

    // Task Note Modal
    if (this.btnCloseTaskEditModal) this.btnCloseTaskEditModal.addEventListener('click', () => this.closeTaskEditModal());
    if (this.btnSaveTaskEdit) this.btnSaveTaskEdit.addEventListener('click', () => this.saveTaskEdit());
    if (this.taskEditModal) {
      this.taskEditModal.addEventListener('click', (e) => {
        if (e.target === this.taskEditModal) this.closeTaskEditModal();
      });
    }

    // Settings Modal
    this.btnOpenSettings.addEventListener('click', () => this.openSettingsModal());
    
    // Snooze Modal
    if (this.btnSnoozeConfirm) {
      this.btnSnoozeConfirm.addEventListener('click', () => this.handleSnoozeConfirm());
      this.btnSnoozeStop.addEventListener('click', () => this.handleSnoozeStop());
      this.btnSnoozeStart.addEventListener('click', () => this.handleSnoozeStart());
    }
    this.btnCloseSettingsModal.addEventListener('click', () => this.closeSettingsModal());

    // Analytics Modal
    if (this.btnOpenAnalytics) {
      this.btnOpenAnalytics.addEventListener('click', () => this.openAnalyticsModal());
    }
    if (this.btnCloseAnalytics) {
      this.btnCloseAnalytics.addEventListener('click', () => this.closeAnalyticsModal());
    }
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) this.closeSettingsModal();
    });
    this.btnSaveSettings.addEventListener('click', () => this.saveSettingsFromModal());
    this.btnLoadDemoData.addEventListener('click', () => this.loadRichDemoData());

    // Rest day dismissal
    this.btnToggleWorkRestDay.addEventListener('click', () => {
      this.restDayBanner.classList.add('hidden');
    });

    // Hotkey: Press 'Q' for quick mode when not typing
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (e.key === 'q' || e.key === 'Q') {
        this.openQuickWidget();
      }
    });
  }

  // --- USER PROFILE & ONBOARDING ---

  openOnboardingModal(isEditing = false) {
    if (isEditing && this.userProfile) {
      this.onboardNameInput.value = this.userProfile.name || '';
      this.onboardWorkInput.value = this.userProfile.work || '';
      this.onboardAgeInput.value = this.userProfile.age || '';
    }
    this.onboardingModal.classList.remove('hidden');
    this.onboardNameInput.focus();
  }

  handleOnboardingSubmit() {
    const name = this.onboardNameInput.value.trim() || 'Focus Hero';
    const work = this.onboardWorkInput.value.trim() || 'Student';
    const age = parseInt(this.onboardAgeInput.value) || null;

    this.userProfile = { name, work, age };
    this.saveState();

    this.onboardingModal.classList.add('hidden');
    this.renderProfile();
    this.renderAll();
    this.evaluateGamification();
    this.sound.playChime('success');
  }

  renderProfile() {
    if (!this.userProfile) return;

    const initial = (this.userProfile.name || 'U').charAt(0).toUpperCase();
    this.headerAvatarInitial.textContent = initial;
    this.headerUserName.textContent = this.userProfile.name;
    this.headerUserRole.textContent = this.userProfile.work;

    if (this.welcomeMessage) {
      this.welcomeMessage.textContent = 'Hi, ' + (this.userProfile.name || 'Hero');
    }

    // Modal elements
    this.modalProfileInitial.textContent = initial;
    this.modalProfileName.textContent = this.userProfile.name;
    this.modalProfileRole.textContent = this.userProfile.work;
    this.modalProfileAgeBadge.textContent = this.userProfile.age ? `Age ${this.userProfile.age}` : 'Learner';
  }

  openProfileModal() {
    this.renderProfile();
    this.evaluateGamification();
    this.profileBadgesModal.classList.remove('hidden');
  }

  closeProfileModal() {
    this.profileBadgesModal.classList.add('hidden');
  }

  shiftDay(delta) {
    const current = new Date(this.selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + delta);
    this.selectDate(this.formatDate(current));
  }

  selectDate(dateStr) {
    this.selectedDate = dateStr;
    this.datePicker.value = dateStr;
    const dateObj = new Date(dateStr + 'T00:00:00');
    
    this.calendarMonth = dateObj.getMonth();
    this.calendarYear = dateObj.getFullYear();

    this.initScheduleAndBanner();
    this.renderAll();
  }

  initScheduleAndBanner() {
    const dateObj = new Date(this.selectedDate + 'T00:00:00');
    const today = new Date();
    const todayStr = this.formatDate(today);
    const isSunday = dateObj.getDay() === 0;

    // Linked date pills
    if (this.dayRelativeBadge) {
      if (this.selectedDate === todayStr) {
        this.dayRelativeBadge.textContent = 'TODAY';
        this.dayRelativeBadge.style.cssText = 'background:rgba(99,102,241,0.2);color:#a5b4fc;border-color:rgba(99,102,241,0.3)';
        if (this.btnReturnToday) this.btnReturnToday.classList.add('hidden');
      } else if (this.selectedDate < todayStr) {
        this.dayRelativeBadge.textContent = 'PAST DAY';
        this.dayRelativeBadge.style.cssText = 'background:rgba(30,32,48,0.8);color:#94a3b8;border-color:#1e2030';
        if (this.btnReturnToday) this.btnReturnToday.classList.remove('hidden');
      } else {
        this.dayRelativeBadge.textContent = 'FUTURE';
        this.dayRelativeBadge.style.cssText = 'background:rgba(6,182,212,0.12);color:#67e8f9;border-color:rgba(6,182,212,0.3)';
        if (this.btnReturnToday) this.btnReturnToday.classList.remove('hidden');
      }
    }

    if (this.settings.scheduleType === '6-day-sunday-rest' && isSunday) {
      this.restDayBanner.classList.remove('hidden');
    } else {
      this.restDayBanner.classList.add('hidden');
    }

    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    this.currentDayLabel.textContent = dateObj.toLocaleDateString('en-US', options);
  }

  // --- TARGET VS ACTUAL & EFFICIENCY SCORE ---

  getTargetMinutesForDate(dateStr) {
    if (this.customDailyTargets[dateStr] !== undefined) {
      return this.customDailyTargets[dateStr];
    }
    return Math.round((this.settings.defaultDailyTarget || 6.0) * 60);
  }

  getActualMinutesForDate(dateStr) {
    const daySessions = this.sessions.filter(s => s.date === dateStr);
    return daySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  }

  renderTargetVsActual() {
    const targetM = this.getTargetMinutesForDate(this.selectedDate);
    const actualM = this.getActualMinutesForDate(this.selectedDate);

    const targetH = (targetM / 60).toFixed(1);
    const actualH = (actualM / 60).toFixed(1);
    const remainingM = Math.max(0, targetM - actualM);
    const remainingH = (remainingM / 60).toFixed(1);

    const percent = targetM > 0 ? Math.round((actualM / targetM) * 100) : 0;

    // Badges & numbers
    this.actualHoursBig.innerHTML = `${actualH}<span class="text-xs font-semibold text-slate-400">h</span>`;
    this.targetHoursSub.textContent = `${targetH}h`;
    this.remainingHoursText.textContent = `${remainingH}h`;

    // Efficiency Score Display
    this.efficiencyScoreNum.textContent = `${percent}%`;
    this.efficiencyBarFill.style.width = `${Math.min(100, percent)}%`;

    // Efficiency Tier Rating
    const tierStyles = {
      0: ['Not Started',    '#64748b', 'rgba(30,32,48,0.6)', '#1e2030'],
      1: ['Warming Up',     '#fcd34d', 'rgba(251,191,36,0.12)', 'rgba(251,191,36,0.3)'],
      2: ['Solid Focus',    '#a5b4fc', 'rgba(99,102,241,0.12)', 'rgba(99,102,241,0.3)'],
      3: ['High Efficiency','#67e8f9', 'rgba(34,211,238,0.12)', 'rgba(34,211,238,0.3)'],
      4: ['Target Met! 🏆', '#6ee7b7', 'rgba(52,211,153,0.12)', 'rgba(52,211,153,0.3)'],
      5: ['Overdrive 🔥',   '#c4b5fd', 'rgba(167,139,250,0.12)', 'rgba(167,139,250,0.3)']
    };
    let tierKey = 0;
    if (percent > 0 && percent < 50) tierKey = 1;
    else if (percent >= 50 && percent < 80) tierKey = 2;
    else if (percent >= 80 && percent < 100) tierKey = 3;
    else if (percent >= 100 && percent < 130) tierKey = 4;
    else if (percent >= 130) tierKey = 5;

    const [label, color, bg, border] = tierStyles[tierKey];
    this.efficiencyTierBadge.textContent = label;
    this.efficiencyTierBadge.style.cssText = `color:${color};background:${bg};border-color:${border}`;

    // Circular Gauge Stroke
    const circumference = 314.16;
    const progressOffset = Math.max(0, circumference - (circumference * Math.min(100, percent)) / 100);
    this.actualCircleProgress.style.strokeDashoffset = progressOffset;

    if (percent >= 100) {
      this.actualCircleProgress.style.stroke = '#34d399'; // emerald
    } else if (percent >= 50) {
      this.actualCircleProgress.style.stroke = '#6366f1'; // indigo
    } else {
      this.actualCircleProgress.style.stroke = '#f59e0b'; // amber
    }

    // Comparative Bar
    this.barActualLabel.textContent = `${actualH} / ${targetH} hrs`;
    this.barActualFill.style.width = `${Math.min(100, percent)}%`;

    // Overtime Alert (exceeds target by >= 2h)
    if (actualM - targetM >= 120) {
      this.overtimeAlert.classList.remove('hidden');
    } else {
      this.overtimeAlert.classList.add('hidden');
    }

    // Quick Widget
    this.quickProgressPercent.textContent = `${percent}%`;
    this.quickHoursLeft.textContent = `${remainingH}h`;
  }

  promptTargetEdit() {
    const currentH = (this.getTargetMinutesForDate(this.selectedDate) / 60).toFixed(1);
    const input = prompt(`Set target focus hours for ${this.selectedDate}:`, currentH);
    if (input !== null) {
      const val = parseFloat(input);
      if (!isNaN(val) && val > 0 && val <= 24) {
        this.customDailyTargets[this.selectedDate] = Math.round(val * 60);
        this.saveState();
        this.renderTargetVsActual();
        this.renderCalendar();
      }
    }
  }

  // --- TIMER ENGINE (100% Free-form Input) ---

  switchTimerMode(mode) {
    if (this.timerMode === mode) return;

    if (this.isTimerRunning) {
      this.pauseTimer(); // Just pause it, don't reset
    }
    
    // Seamlessly convert elapsed time
    if (mode === 'stopwatch') {
      this.timerModeStopwatch.className = 'mode-btn active';
      this.timerModePomodoro.className = 'mode-btn';
      this.pomodoroPhaseLabel.classList.add('hidden');
      this.timerSeconds = Math.max(0, this.pomodoroTargetSeconds - this.timerSeconds);
    } else {
      this.timerModePomodoro.className = 'mode-btn active';
      this.timerModeStopwatch.className = 'mode-btn';
      this.pomodoroPhaseLabel.classList.remove('hidden');
      this.timerSeconds = Math.max(0, this.pomodoroTargetSeconds - this.timerSeconds);
    }
    
    this.timerMode = mode;
    this.updateTimerDisplay();
  }

  toggleTimer() {
    if (this.isTimerRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  }

  // --- WAKE LOCK & BACKGROUND CATCH-UP ---
  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock active');
      } catch (err) {
        console.log('Wake Lock failed:', err);
      }
    }
  }

  releaseWakeLock() {
    if (this.wakeLock !== null) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }

  catchUpTimer() {
    if (!this.lastTickTime || !this.isTimerRunning) return;
    const now = Date.now();
    const deltaSecs = Math.floor((now - this.lastTickTime) / 1000);
    
    if (deltaSecs >= 1) {
      this.lastTickTime += (deltaSecs * 1000);
      if (this.timerMode === 'stopwatch') {
        this.timerSeconds += deltaSecs;
      } else {
        this.timerSeconds -= deltaSecs;
        if (this.timerSeconds <= 0) {
          this.timerSeconds = 0;
          this.sound.playChime('level-up');
          const msgs = [
  "Ding! Time's up. You actually survived. I'm as surprised as you are. Great job! 🌟",
  "Pomodoro complete! You focused for a whole block. Gold star for acting like a responsible adult today. 🏆",
  "Time is up! You may now return to scrolling endlessly through social media. You've earned it. 📱",
  "Focus block finished! You're basically unstoppable now. Please try not to let the power go to your head. 🦸‍♂️",
  "Zero seconds left! I didn't think you had it in you, but you proved me wrong. Fantastic work! 🎉"
];
setTimeout(() => { alert(msgs[Math.floor(Math.random() * msgs.length)]); }, 100);
          this.logTimerSession();
          this.resetTimer();
          return;
        }
      }
      
      this.updateTimerDisplay();
      
      // Auto-sync heartbeat every 15 seconds of progress to keep other devices perfectly locked in!
      if (this.lastSyncSeconds === undefined) this.lastSyncSeconds = this.timerSeconds;
      if (Math.abs(this.lastSyncSeconds - this.timerSeconds) >= 15) {
          this.lastSyncSeconds = this.timerSeconds;
          if (this.saveState) this.saveState();
      }
    }
  }

  startTimer(syncToCloud = true) {
    if (this.timerMode === 'pomodoro' && this.timerSeconds <= 0) {
      this.resetTimer();
      return;
    }
    
    this.isTimerRunning = true;
    this.lastTickTime = Date.now();

    const typedTitle = (this.timerActivityInput && this.timerActivityInput.value.trim()) || '';
    if (typedTitle && this.tasks && this.gamification) {
        const taskObj = this.tasks.find(t => t.date === this.selectedDate && t.title.toLowerCase() === typedTitle.toLowerCase());
        if (taskObj) {
            const sessionsCount = this.sessions.filter(s => s.taskId === taskObj.id).length;
            
            let changed = false;
            if (sessionsCount >= 1 && !this.gamification.data.gluttonForPunishment) {
                this.gamification.data.gluttonForPunishment = true;
                changed = true;
            }
            if (sessionsCount >= 2 && !this.gamification.data.stockholmSyndrome) {
                this.gamification.data.stockholmSyndrome = true;
                changed = true;
            }
            
            if (changed && this.evaluateGamification) this.evaluateGamification();
        }
    }



    this.sound.playChime('timer-start');
    if (this.requestWakeLock) this.requestWakeLock();
    
    this.timerBtnIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    this.timerBtnText.textContent = 'Pause Focus';
    this.btnTimerStartPause.classList.add('timer-active');
    
    if (this.quickTimerToggleBtn) {
      this.quickTimerToggleBtn.textContent = 'Pause Session';
      this.quickTimerToggleBtn.className = 'px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all';
    }

    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.catchUpTimer) {
        this.catchUpTimer();
      } else {
        const now = Date.now();
        const deltaSecs = Math.floor((now - this.lastTickTime) / 1000);
        if (deltaSecs >= 1) {
          this.lastTickTime += (deltaSecs * 1000);
          if (this.timerMode === 'stopwatch') {
            this.timerSeconds += deltaSecs;
          } else {
            this.timerSeconds -= deltaSecs;
            if (this.timerSeconds <= 0) {
              this.timerSeconds = 0;
              this.sound.playChime('level-up');
              this.logTimerSession();
              this.resetTimer();
              // Use setTimeout so it doesn't block the execution of resetTimer and sync
              setTimeout(() => { const msgs = [
  "Ding! Time's up. You actually survived. I'm as surprised as you are. Great job! 🌟",
  "Pomodoro complete! You focused for a whole block. Gold star for acting like a responsible adult today. 🏆",
  "Time is up! You may now return to scrolling endlessly through social media. You've earned it. 📱",
  "Focus block finished! You're basically unstoppable now. Please try not to let the power go to your head. 🦸‍♂️",
  "Zero seconds left! I didn't think you had it in you, but you proved me wrong. Fantastic work! 🎉"
];
setTimeout(() => { alert(msgs[Math.floor(Math.random() * msgs.length)]); }, 100); }, 100);
              return;
            }
          }
          this.updateTimerDisplay();
          
          if (this.lastSyncSeconds === undefined) this.lastSyncSeconds = this.timerSeconds;
          if (Math.abs(this.lastSyncSeconds - this.timerSeconds) >= 15) {
              this.lastSyncSeconds = this.timerSeconds;
              if (this.saveState) this.saveState();
          }
        }
      }
    }, 500);
    
    if (syncToCloud) {
       this.timerLastUpdatedAt = Date.now();
       if (this.saveState) this.saveState();
    }
  }

  pauseTimer(syncToCloud = true) {
    this.isTimerRunning = false;
    clearInterval(this.timerInterval);
    if (this.releaseWakeLock) this.releaseWakeLock();



    this.timerBtnIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    this.timerBtnText.textContent = 'Resume Focus';
    this.btnTimerStartPause.classList.remove('timer-active');
    
    if (this.quickTimerToggleBtn) {
      this.quickTimerToggleBtn.textContent = 'Start Session';
      this.quickTimerToggleBtn.className = 'px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all';
    }
    
    document.title = 'FocusFlow';
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
    
    if (syncToCloud) {
       this.timerLastUpdatedAt = Date.now();
       if (this.saveState) this.saveState();
    }
  }

  resetTimer() {
    this.pauseTimer(false);
    this.timerSeconds = this.timerMode === 'stopwatch' ? 0 : this.pomodoroTargetSeconds;
    this.timerLastUpdatedAt = Date.now(); // Signal that this is a completely new timer epoch!
    this.updateTimerDisplay();
    
    if (this.saveState) this.saveState();
  }

  updateTimerDisplay() {
    const h = Math.floor(this.timerSeconds / 3600);
    const m = Math.floor((this.timerSeconds % 3600) / 60);
    const s = this.timerSeconds % 60;
    
    let formatted = '';
    if (h > 0) {
      formatted = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
      formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    
    this.timerDisplay.textContent = formatted;
    if (this.quickTimerDisplay) this.quickTimerDisplay.textContent = formatted;
    
    if (this.isTimerRunning) {
      document.title = `${formatted} - FocusFlow`;
      
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: formatted,
          artist: this.timerActivityInput ? this.timerActivityInput.value : 'Focusing...',
          album: 'FocusFlow Timer'
        });
        navigator.mediaSession.playbackState = 'playing';
      }
    } else {
      document.title = 'FocusFlow';
    }
  }

  logTimerSession() {
    let minutesToLog = 0;
    if (this.timerMode === 'stopwatch') {
      minutesToLog = Math.round(this.timerSeconds / 60);
    } else {
      minutesToLog = Math.round((this.pomodoroTargetSeconds - this.timerSeconds) / 60);
    }

    if (minutesToLog < 1) {
      alert('Session was too brief to log (< 1 minute).');
      return;
    }

    const typedTitle = (this.timerActivityInput && this.timerActivityInput.value.trim()) || 'General Focus Session';
    const taskObj = this.tasks.find(t => t.date === this.selectedDate && t.title.toLowerCase() === typedTitle.toLowerCase()) || null;
    const taskId = taskObj ? taskObj.id : null;
    const taskTitle = typedTitle;

    const newSession = {
      id: 'sess-' + Date.now(),
      taskId,
      taskTitle,
      durationMinutes: minutesToLog,
      date: this.selectedDate,
      timestamp: Date.now()
    };

    this.sessions.push(newSession);

    // If matches task, increment its actual minutes
    if (taskObj) {
      taskObj.actualMinutes = (taskObj.actualMinutes || 0) + minutesToLog;
    }

    this.saveState();
    this.resetTimer();
    this.sound.playChime('success');

    // Award XP
    const earnedXp = Math.round(minutesToLog * 1.5);
    this.gamification.addXp(earnedXp, `Logged ${minutesToLog}m focus session`);
    this.gamification.data.totalSessions++;
    this.gamification.data.longestSessionMinutes = Math.max(
      this.gamification.data.longestSessionMinutes || 0,
      minutesToLog
    );
    this.gamification.save();

    this.renderAll();
    this.evaluateGamification();
  }

  // --- DYNAMIC TO-DO & TASK MANAGEMENT WITH ALWAYS-VISIBLE DELETE ---

  handleAddTodo(e) {
    e.preventDefault();
    const text = this.todoTitleInput.value.trim();
    if (!text) return;
    
    const tagMatches = text.match(/#([a-zA-Z0-9_-]+)/g) || [];
    const tags = tagMatches.map(t => t.replace('#', '').toLowerCase());
    const cleanTitle = text.replace(/#([a-zA-Z0-9_-]+)/g, '').replace(/\s+/g, ' ').trim() || 'Untitled';

    const newTask = {
      id: 'task_' + Date.now(),
      title: cleanTitle,
      tags: tags.length > 0 ? tags : ['routine'],
      notes: '',
      date: this.selectedDate,
      estimatedMinutes: 0,
      actualMinutes: 0,
      isCompleted: false,
      scheduledTime: this.todoScheduledTime ? this.todoScheduledTime.value : '',
      createdAt: new Date().toISOString()
    };

    this.tasks.push(newTask);
    this.todoTitleInput.value = '';
    if (this.todoScheduledTime) this.todoScheduledTime.value = '';
    
    this.saveState();
    this.renderTasks();
    this.renderTargetVsActual();
  }

  handleAddTask() {
    try {
      const rawTitle = this.taskTitleInput.value.trim();
      if (!rawTitle) return;

      const tagMatches = rawTitle.match(/#([a-zA-Z0-9_-]+)/g) || [];
      const tags = tagMatches.map(t => t.replace('#', '').toLowerCase());
      const cleanTitle = rawTitle.replace(/#([a-zA-Z0-9_-]+)/g, '').replace(/\s+/g, ' ').trim() || 'Untitled';

      const hours = Math.max(0, parseInt(this.taskEstHours.value) || 0);
      const mins = Math.max(0, parseInt(this.taskEstMins.value) || 0);
      const estMinutes = (hours * 60) + mins || 60; // default 60 if both 0
      
      const scheduledTime = this.taskScheduledTime ? this.taskScheduledTime.value : '';

      const newTask = {
        id: 'task-' + Date.now(),
        title: cleanTitle,
        tags: tags.length > 0 ? tags : ['focus'],
        estimatedMinutes: estMinutes,
        actualMinutes: 0,
        isCompleted: false,
        date: this.selectedDate,
        notes: '',
        scheduledTime: scheduledTime
      };

      this.tasks.unshift(newTask);
      this.saveState();

      this.taskTitleInput.value = '';
      this.taskEstHours.value = '1';
      this.taskEstMins.value = '0';
      if (this.taskScheduledTime) this.taskScheduledTime.value = '';
      
      this.renderTasks();
      this.renderTargetVsActual();
      this.renderSuggestions();
    } catch (err) {
      alert('Error in handleAddTask: ' + err.message + '\n' + err.stack);
    }
  }

  setTaskFilter(filter) {
    this.taskFilter = filter;
    const tabs = [
      { el: this.tabTasksAll, name: 'all' },
      { el: this.tabTasksPending, name: 'pending' },
      { el: this.tabTasksCompleted, name: 'completed' }
    ];
    tabs.forEach(t => {
      if (t.name === filter) {
        t.el.className = 'tab-btn active';
      } else {
        t.el.className = 'tab-btn';
      }
    });
    this.renderTasks();
  }

  clearCompletedTasks() {
    this.tasks = this.tasks.filter(t => !(t.date === this.selectedDate && t.isCompleted));
    this.saveState();
    this.renderTasks();
    this.renderTargetVsActual();
  }

  toggleTaskCompletion(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.isCompleted = !task.isCompleted;

    if (task.isCompleted) {
      this.sound.playChime('success');
      this.gamification.addXp(30, `Completed task: ${task.title}`);
      this.gamification.data.tasksCompletedCount = (this.gamification.data.tasksCompletedCount || 0) + 1;
      this.gamification.save();
    }

    this.saveState();
    this.renderTasks();
    this.renderTargetVsActual();
    this.evaluateGamification();
    this.renderSuggestions();
    this.renderQuickTasks();
  }

  deleteTask(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.saveState();
    this.renderTasks();
    this.renderTargetVsActual();
    this.renderSuggestions();
  }

  renderTasks() {
    try {
      const dayTasks = this.tasks.filter(t => t.date === this.selectedDate);
      this.tasksCountBadge.textContent = `${dayTasks.length} Tasks`;

      let filtered = dayTasks;
      if (this.taskFilter === 'pending') filtered = dayTasks.filter(t => !t.isCompleted);
      if (this.taskFilter === 'completed') filtered = dayTasks.filter(t => t.isCompleted);

      if (filtered.length === 0) {
        this.tasksList.innerHTML = `
          <div style="text-align:center;padding:24px 0;color:var(--text-4);font-size:12px;">
            <p style="font-size:24px;margin-bottom:4px">📋</p>
            <p>No ${this.taskFilter === 'all' ? '' : this.taskFilter} tasks for this date.</p>
          </div>
        `;
        return;
      }

          
      const generateTaskHtml = (task) => {
        const tagsHtml = (task.tags || []).map(tag => `<span class="task-tag">#${tag}</span>`).join('');
        const hasNotes = task.notes && task.notes.trim().length > 0;
        
        const estH = Math.floor((task.estimatedMinutes || 0) / 60);
        const estM = (task.estimatedMinutes || 0) % 60;
        const estStr = estH > 0 ? (estM > 0 ? `${estH}h ${estM}m` : `${estH}h`) : (estM > 0 ? `${estM}m` : '');
        const timeStr = task.scheduledTime ? `<span class="task-est" style="color:#e2e8f0;font-weight:600;margin-right:4px;">@ ${task.scheduledTime}</span>` : '';
        
        return `
        <div class="task-item ${task.isCompleted ? 'completed' : ''}">
          <div class="task-check ${task.isCompleted ? 'done' : ''}" 
               onclick="app.toggleTaskCompletion('${task.id}')" 
               title="${task.isCompleted ? 'Mark incomplete' : 'Mark complete'}"></div>
          <div class="task-body">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span class="task-title">${this.escapeHtml(task.title || '')}</span>
            </div>
            <div class="task-meta-row">
              ${timeStr}
              ${estStr ? `<span class="task-est"> ${estStr}</span>` : ''}
              ${(task.actualMinutes || 0) > 0 ? `<span class="task-est" style="color:#818cf8">(${task.actualMinutes}m logged)</span>` : ''}
              ${tagsHtml}
            </div>
            ${hasNotes ? `<div class="task-meta-row" style="margin-top:4px;"><span style="font-size:11px;color:var(--text-3);font-style:italic;">${this.escapeHtml(task.notes).substring(0, 100)}${task.notes.length > 100 ? '...' : ''}</span></div>` : ''}
          </div>
          <div class="task-actions">
            ${estStr ? `<button class="task-action-btn" onclick="app.setTimerForTask('${task.id}')" title="Start timer for this task"></button>` : ''}
            <button class="task-action-btn edit-icon" onclick="app.openTaskEditModal('${task.id}')" title="Edit Task">✎</button>
            <button class="task-action-btn delete" onclick="app.deleteTask('${task.id}')" title="Delete task"></button>
          </div>
        </div>
        `;
      };

      const focusTasks = filtered.filter(t => (t.estimatedMinutes || 0) > 0);
      const quickTodos = filtered.filter(t => (t.estimatedMinutes || 0) === 0);

      this.tasksCountBadge.textContent = `${focusTasks.length} Tasks`;
      if (this.todosCountBadge) this.todosCountBadge.textContent = `${quickTodos.length} To-Do`;

      if (focusTasks.length > 0) {
        this.tasksList.innerHTML = focusTasks.map(generateTaskHtml).join('');
      } else {
        this.tasksList.innerHTML = '<div class="text-xs text-slate-500 text-center py-4">No tasks found.</div>';
      }
      
      if (this.todosList) {
        if (quickTodos.length > 0) {
          this.todosList.innerHTML = quickTodos.map(generateTaskHtml).join('');
        } else {
          this.todosList.innerHTML = '<div class="text-xs text-slate-500 text-center py-4">No routines found.</div>';
        }
      }
    } catch (err) {
      alert('Error in renderTasks: ' + err.message + '\n' + err.stack);
    }
  }

  setTimerForTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && this.timerActivityInput) {
      this.timerActivityInput.value = task.title;
      
      // Check Punctual Panda
      if (task.scheduledTime) {
        const now = new Date();
        const [tHrs, tMins] = task.scheduledTime.split(':').map(Number);
        const tDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), tHrs, tMins);
        const diffMs = now - tDate;
        const diffMins = Math.floor(diffMs / 60000);
        
        // If they start between 1 minute early and 2 minutes late
        if (diffMins >= -1 && diffMins <= 2) {
          this.gamification.data.punctualStarts = (this.gamification.data.punctualStarts || 0) + 1;
          if ((this.gamification.data.lateStarts || 0) >= 3) {
            this.gamification.data.redemptionEarned = true;
          }
          this.evaluateGamification();
        } else if (diffMins > 5) {
          this.gamification.data.lateStarts = (this.gamification.data.lateStarts || 0) + 1;
          this.evaluateGamification();
        } else if (diffMins < -1) {
          this.gamification.data.earlyStarts = (this.gamification.data.earlyStarts || 0) + 1;
          this.evaluateGamification();
        }
      }
    }
    
    // Request notification permission if they click start (user gesture)
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (!this.isTimerRunning) {
      this.startTimer();
    }
  }

  // --- PREDICTIVE & ROLE-TAILORED SUGGESTIONS ---

  renderSuggestions() {
    const curDate = new Date(this.selectedDate + 'T00:00:00');
    const tomorrow = new Date(curDate);
    tomorrow.setDate(curDate.getDate() + 1);

    const predictions = this.engine.generateSuggestions(this.tasks, tomorrow, this.userProfile);

    if (predictions.length === 0) {
      this.suggestionsList.innerHTML = `
        <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-1">
          <div class="text-base">🌱</div>
          <div class="text-xs font-semibold text-slate-300">FocusFlow is observing your work patterns</div>
          <div class="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
            As you log tasks today, FocusFlow will note your unfinished items and recurring habits, and start generating recommendations for tomorrow.
          </div>
        </div>
      `;
      return;
    }

    const badgeClasses = {
      amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    };

    this.suggestionsList.innerHTML = predictions.map(pred => {
      const pillClass = badgeClasses[pred.badgeColor] || badgeClasses.indigo;
      return `
        <div style="background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:12px; margin-bottom:12px; display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span style="font-size:14px; font-weight:700; color:var(--text);">${this.escapeHtml(pred.title)}</span>
              <span class="${pillClass}" style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px; border-width:1px;">${pred.reason}</span>
            </div>
            <div style="font-size:11px; color:var(--text-3); font-family:var(--mono);">
              Suggested: ${pred.estimatedMinutes}m
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button onclick="app.acceptSuggestion('${encodeURIComponent(pred.title)}', ${pred.estimatedMinutes}, 'today')" class="btn-secondary btn-sm" style="flex:1; justify-content:center; border:1px solid var(--border); font-size:12px;" title="Add to Today's Tasks">
              + Today
            </button>
            <button onclick="app.acceptSuggestion('${encodeURIComponent(pred.title)}', ${pred.estimatedMinutes}, 'tomorrow')" class="btn-primary btn-sm" style="flex:1; justify-content:center; font-size:12px;" title="Add to Tomorrow">
              + Tomorrow
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  acceptSuggestion(encodedTitle, estMinutes, targetDay = 'today') {
    const title = decodeURIComponent(encodedTitle);
    const targetDateStr = targetDay === 'today' ? this.selectedDate : this.formatDate(new Date(Date.now() + 86400000));

    const newTask = {
      id: 'task-' + Date.now(),
      title,
      tags: ['suggested'],
      estimatedMinutes: estMinutes || 60,
      actualMinutes: 0,
      isCompleted: false,
      priority: 'medium',
      date: targetDateStr,
      notes: 'Added from intelligent suggestions engine.'
    };

    this.tasks.push(newTask);
    this.saveState();
    this.sound.playChime('success');

    if (targetDateStr === this.selectedDate) {
      this.renderTasks();
    } else {
      alert(`✅ Added "${title}" to your schedule for tomorrow!`);
    }
  }

  // --- CALENDAR & HISTORY (Exact 7 equal columns) ---

  shiftMonth(delta) {
    this.calendarMonth += delta;
    if (this.calendarMonth < 0) {
      this.calendarMonth = 11;
      this.calendarYear--;
    } else if (this.calendarMonth > 11) {
      this.calendarMonth = 0;
      this.calendarYear++;
    }
    this.renderCalendar();
  }

  renderCalendar() {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.calMonthLabel.textContent = `${monthNames[this.calendarMonth]} ${this.calendarYear}`;

    const firstDayIndex = new Date(this.calendarYear, this.calendarMonth, 1).getDay();
    const daysInMonth = new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate();

    const todayStr = this.formatDate(new Date());

    let html = '';

    // Empty lead cells (invisible placeholders to push days to correct column)
    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div class="cal-day" style="opacity:0;pointer-events:none"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(this.calendarYear, this.calendarMonth, day);
      const dateStr = this.formatDate(dayDate);
      const isSelected = dateStr === this.selectedDate;
      const isToday = dateStr === todayStr;
      const dayOfWeek = dayDate.getDay();

      const targetM = this.getTargetMinutesForDate(dateStr);
      const actualM = this.getActualMinutesForDate(dateStr);

      const isRestDay = (this.settings.scheduleType === '6-day-sunday-rest' && dayOfWeek === 0) ||
                        (this.settings.scheduleType === '5-day-workweek' && (dayOfWeek === 0 || dayOfWeek === 6));

      let stateClass = '';
      let dotStyle = '';
      if (actualM >= targetM * 0.8 && targetM > 0) {
        stateClass = 'hit-target';
        dotStyle = 'background:#34d399';
      } else if (actualM > 0) {
        stateClass = 'partial';
        dotStyle = 'background:#fbbf24';
      } else if (isRestDay) {
        stateClass = 'rest-sunday';
        dotStyle = 'background:#60a5fa';
      }

      html += `
        <div onclick="app.selectDate('${dateStr}')" class="cal-day ${stateClass} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}">
          <span class="cal-day-num">${day}</span>
          ${dotStyle ? `<span class="cal-dot" style="${dotStyle}"></span>` : `<span class="cal-dot" style="opacity:0"></span>`}
        </div>
      `;
    }

    this.calendarDaysGrid.innerHTML = html;
  }

  // --- GAMIFICATION & BADGES ---

  evaluateGamification() {
    const historyMap = {};
    this.sessions.forEach(s => {
      if (!historyMap[s.date]) {
        historyMap[s.date] = {
          targetMinutes: this.getTargetMinutesForDate(s.date),
          actualMinutes: 0
        };
      }
      historyMap[s.date].actualMinutes += s.durationMinutes;
    });

    let maxDailyMinutes = 0;
    let maxOvertimeMinutes = 0;
    let maxEfficiencyPercent = 0;
    let sundayFullTargetMet = false;
    let nightSessionLogged = false;
    const sessionsPerDay = {};

    this.sessions.forEach(s => {
      if (s.timestamp) {
        const sDate = new Date(s.timestamp);
        const hours = sDate.getHours();
        const mins = sDate.getMinutes();
        if (hours < 4 || (hours === 4 && mins <= 30)) {
          nightSessionLogged = true;
        }
      }
      sessionsPerDay[s.date] = (sessionsPerDay[s.date] || 0) + 1;
    });

    const maxSessionsInDay = Object.values(sessionsPerDay).length > 0 ? Math.max(...Object.values(sessionsPerDay)) : 0;

    Object.keys(historyMap).forEach(dateStr => {
      const item = historyMap[dateStr];
      const actual = item.actualMinutes;
      const target = item.targetMinutes;
      if (actual > maxDailyMinutes) maxDailyMinutes = actual;
      if (actual > target) {
        const overtime = actual - target;
        if (overtime > maxOvertimeMinutes) maxOvertimeMinutes = overtime;
      }
      if (target > 0) {
        const eff = Math.round((actual / target) * 100);
        if (eff > maxEfficiencyPercent) maxEfficiencyPercent = eff;
      }
      const dObj = new Date(dateStr + 'T00:00:00');
      if (dObj.getDay() === 0 && actual >= target && target > 0) {
        sundayFullTargetMet = true;
      }
    });

    const sortedDates = Object.keys(historyMap).sort();
    let cameBackAfterAbsence = false;
    if (sortedDates.length >= 2) {
      const last = new Date(sortedDates[sortedDates.length - 1]);
      const prev = new Date(sortedDates[sortedDates.length - 2]);
      const diffDays = (last - prev) / (1000 * 60 * 60 * 24);
      if (diffDays >= 3) {
        cameBackAfterAbsence = true;
      }
    }

    let perfectTaskDays = 0;
    const tasksByDate = {};
    this.tasks.forEach(t => {
       if (!tasksByDate[t.date]) tasksByDate[t.date] = { total: 0, completed: 0 };
       tasksByDate[t.date].total++;
       if (t.isCompleted) tasksByDate[t.date].completed++;
    });
    
    const taskDates = Object.keys(tasksByDate).sort();
    let currentTaskStreak = 0;
    let maxTaskStreak = 0;
    
    for (let i = 0; i < taskDates.length; i++) {
        const day = tasksByDate[taskDates[i]];
        // Only counts if they had at least 2 tasks that day
        if (day.total >= 2 && day.completed === day.total) {
            currentTaskStreak++;
            if (currentTaskStreak > maxTaskStreak) maxTaskStreak = currentTaskStreak;
        } else {
            currentTaskStreak = 0;
        }
    }

    const currentStreak = this.gamification.evaluateStreaks(historyMap, this.settings.scheduleType);
    const newBadges = this.gamification.checkBadges({
      maxDailyMinutes,
      maxOvertimeMinutes,
      maxEfficiencyPercent,
      sundayFullTargetMet,
      nightSessionLogged,
      maxSessionsInDay,
      cameBackAfterAbsence,
      maxTaskStreak
    });

    if (newBadges && newBadges.length > 0) {
      this.sound.playChime('level-up');
    }

    const totalLifetimeM = this.sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
    this.gamification.data.lifetimeHours = (totalLifetimeM / 60).toFixed(1);
    this.gamification.save();

    // Stats
    this.headerStreakCount.textContent = currentStreak;

    // Badges Showcase (Near Profile)
    const badges = this.gamification.getBadges();
    const unlockedCount = badges.filter(b => b.unlocked).length;
    this.headerBadgeCount.textContent = `${unlockedCount}/${badges.length}`;
    if (this.modalBadgesUnlockedCount) {
      this.modalBadgesUnlockedCount.textContent = `${unlockedCount}/${badges.length} Unlocked`;
    }

    if (this.modalProfileHours) {
      this.modalProfileHours.textContent = `${this.gamification.data.lifetimeHours}h`;
      this.modalProfileStreak.textContent = `${currentStreak} Days`;
      this.modalProfileLevel.textContent = `LVL ${this.gamification.data.level}`;
    }

    this.badgesGrid.innerHTML = badges.map(b => `
      <div class="badge-slot ${b.unlocked ? 'unlocked' : 'locked'}" style="cursor: pointer;" onclick="app.openBadgeModal('${b.id}')">
        <span class="badge-icon text-xl">${b.icon}</span>
        <span class="badge-title text-[10px] text-center mt-1 truncate w-full px-1">${b.title}</span>
        ${b.unlocked ? '<span class="text-[8px] font-bold text-amber-400 uppercase tracking-tighter">UNLOCKED</span>' : '<span class="text-[8px] font-mono text-slate-600">LOCKED</span>'}
      </div>
    `).join('');
  }

  openBadgeModal(badgeId) {
    if (!this.gamification) return;
    const badges = this.gamification.getBadges();
    const b = badges.find(x => x.id === badgeId);
    if (!b) return;

    this.badgeModalIcon.textContent = b.icon || '🏆';
    this.badgeModalTitle.textContent = b.title;
    this.badgeModalDesc.textContent = b.description;
    
    if (b.unlocked) {
      this.badgeModalStatus.textContent = 'UNLOCKED';
      this.badgeModalStatus.style.backgroundColor = 'rgba(251, 191, 36, 0.2)'; // amber-400 with opacity
      this.badgeModalStatus.style.color = '#fbbf24'; // amber-400
    } else {
      this.badgeModalStatus.textContent = 'LOCKED';
      this.badgeModalStatus.style.backgroundColor = 'rgba(71, 85, 105, 0.2)'; // slate-600 with opacity
      this.badgeModalStatus.style.color = '#94a3b8'; // slate-400
    }

    this.badgeModal.classList.remove('hidden');
  }

  closeBadgeModal() {
    this.badgeModal.classList.add('hidden');
  }

  // --- QUICK ACTION / HOMEPAGE OVERLAY ---

  openQuickWidget() {
    this.quickWidgetOverlay.classList.remove('hidden');
    this.renderQuickTasks();
  }

  closeQuickWidget() {
    this.quickWidgetOverlay.classList.add('hidden');
  }

  renderQuickTasks() {
    const dayTasks = this.tasks.filter(t => t.date === this.selectedDate);
    if (dayTasks.length === 0) {
      this.quickTasksContainer.innerHTML = `<div class="text-xs text-slate-500 py-3 text-center">No tasks for today. Add some to get started!</div>`;
      return;
    }

    this.quickTasksContainer.innerHTML = dayTasks.map(task => `
      <div class="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
        <label class="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
          <input type="checkbox" ${task.isCompleted ? 'checked' : ''} onchange="app.toggleTaskCompletion('${task.id}')" class="w-4 h-4 accent-indigo-600 rounded">
          <span class="${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'} truncate">${this.escapeHtml(task.title)}</span>
        </label>
        <span class="text-[10px] text-slate-500 font-mono ml-2">${task.estimatedMinutes}m</span>
      </div>
    `).join('');
  }

  // --- TASK NOTES MODAL ---

  openTaskEditModal(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    this.activeTaskForEdit = task;
    this.editTaskTitle.value = task.title || '';
    this.editTaskTime.value = task.scheduledTime || '';
    this.editTaskEstH.value = Math.floor((task.estimatedMinutes || 0) / 60);
    this.editTaskEstM.value = (task.estimatedMinutes || 0) % 60;
    this.editTaskNotes.value = task.notes || '';
    this.taskEditModal.classList.remove('hidden');
  }

  closeTaskEditModal() {
    this.taskEditModal.classList.add('hidden');
    this.activeTaskForEdit = null;
  }

  saveTaskEdit() {
    if (this.activeTaskForEdit) {
      const rawEdit = this.editTaskTitle.value.trim();
      const tagMatches = rawEdit.match(/#([a-zA-Z0-9_-]+)/g) || [];
      const newTags = tagMatches.map(t => t.replace('#', '').toLowerCase());
      const cleanTitle = rawEdit.replace(/#([a-zA-Z0-9_-]+)/g, '').replace(/\s+/g, ' ').trim() || 'Untitled';
      
      this.activeTaskForEdit.title = cleanTitle;
      if (newTags.length > 0) {
          // merge new tags with old tags uniquely
          this.activeTaskForEdit.tags = [...new Set([...(this.activeTaskForEdit.tags || []), ...newTags])];
      }
      
      this.activeTaskForEdit.scheduledTime = this.editTaskTime.value;
      const eh = Math.max(0, parseInt(this.editTaskEstH.value) || 0);
      const em = Math.max(0, parseInt(this.editTaskEstM.value) || 0);
      this.activeTaskForEdit.estimatedMinutes = (eh * 60) + em;
      this.activeTaskForEdit.notes = this.editTaskNotes.value;
      
      this.saveState();
      this.renderTasks();
      this.renderTargetVsActual();
      this.closeTaskEditModal();
    }
  }

  // --- SETTINGS MODAL ---

  openSettingsModal() {
    this.settingDailyTarget.value = this.settings.defaultDailyTarget || 6.0;
    this.settingScheduleType.value = this.settings.scheduleType || '6-day-sunday-rest';
    this.settingSoundToggle.checked = this.settings.soundEnabled;
    this.settingsModal.classList.remove('hidden');
  }

  closeSettingsModal() {
    this.settingsModal.classList.add('hidden');
  }

  saveSettingsFromModal() {
    const targetVal = parseFloat(this.settingDailyTarget.value);
    if (!isNaN(targetVal) && targetVal > 0) {
      this.settings.defaultDailyTarget = targetVal;
    }
    this.settings.scheduleType = this.settingScheduleType.value;
    this.settings.soundEnabled = this.settingSoundToggle.checked;
    this.sound.enabled = this.settings.soundEnabled;

    this.saveState();
    this.closeSettingsModal();
    this.initScheduleAndBanner();
    this.renderAll();
    this.evaluateGamification();
  }

  loadRichDemoData() {
    const today = new Date();
    const todayStr = this.formatDate(today);

    const yest = new Date(today);
    yest.setDate(today.getDate() - 1);
    const yestStr = this.formatDate(yest);

    this.tasks = [
      {
        id: 'demo-1',
        title: 'Complete Deep Work Project Sprint #dev',
        tags: ['dev'],
        estimatedMinutes: 90,
        actualMinutes: 90,
        isCompleted: true,
        priority: 'high',
        date: yestStr,
        notes: 'Finished core implementation.'
      },
      {
        id: 'demo-2',
        title: 'Review System Specs & API endpoints #review',
        tags: ['review'],
        estimatedMinutes: 60,
        actualMinutes: 60,
        isCompleted: true,
        priority: 'medium',
        date: yestStr,
        notes: 'Verified endpoints.'
      },
      {
        id: 'demo-3',
        title: 'Draft Project Implementation Proposal #work',
        tags: ['work'],
        estimatedMinutes: 120,
        actualMinutes: 45,
        isCompleted: false,
        priority: 'high',
        date: todayStr,
        notes: 'Continue section 2.'
      }
    ];

    this.sessions = [
      {
        id: 'sess-demo-1',
        taskId: 'demo-1',
        taskTitle: 'Complete Deep Work Project Sprint #dev',
        durationMinutes: 360,
        date: yestStr,
        timestamp: Date.now() - 86400000
      }
    ];

    this.dailyNotes[yestStr] = "Crushed the 6.0h target yesterday!";
    this.saveState();

    alert('Demo data loaded successfully!');
    this.closeSettingsModal();
    this.renderAll();
    this.evaluateGamification();
  }


  // --- NOTIFICATION ENGINE ---
  startNotificationEngine() {
    // Request permission if not granted
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Run every minute
    setInterval(() => {
      this.checkReminders();
    }, 60000);
    
    // Initial check
    setTimeout(() => this.checkReminders(), 5000);
  }

  checkReminders() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    
    const now = new Date();
    const currentHrs = String(now.getHours()).padStart(2, '0');
    const currentMins = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHrs}:${currentMins}`;
    
    const dayTasks = this.tasks.filter(t => t.date === this.selectedDate && !t.isCompleted && t.scheduledTime && !t.stopReminding);
    
    let stateChanged = false;

    dayTasks.forEach(task => {
      // Calculate diff in minutes
      const [tHrs, tMins] = task.scheduledTime.split(':').map(Number);
      const tDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), tHrs, tMins);
      const diffMs = now - tDate;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins === 0 && !task.notifiedOnTime) {
        this.sendNotification(`Time to crush it: ${task.title} 🚀`, `Your focus awaits!`);
        task.notifiedOnTime = true;
        stateChanged = true;
      } 
      else if (diffMins === 5 && !task.notified5Min) {
        this.sendNotification(`You're 5 minutes late for ${task.title}.`, `Did you get lost? It's not going to do itself. 👀`);
        task.notified5Min = true;
        stateChanged = true;
      }
      else if (diffMins === 20 && !task.notified20Min) {
        // Send actionable notification and show in-app modal
        const notif = new Notification(`20 mins late to ${task.title}.`, {
          body: `Are we still doing this? Click here to reschedule or dismiss. 💤`,
          icon: '/icon.png' // Fallback
        });
        notif.onclick = () => {
          window.focus();
          this.openSnoozeModal(task.id);
        };
        
        // Also just open it directly if they are active on the tab
        if (!document.hidden) {
          this.openSnoozeModal(task.id);
        }

        task.notified20Min = true;
        stateChanged = true;
      }
    });

    if (stateChanged) {
      this.saveState();
    }
  }

  sendNotification(title, body) {
    new Notification(title, { body: body });
    // Also play chime
    this.sound.playChime('chime');
  }

  // --- SNOOZE MODAL ---
  openSnoozeModal(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return;
    this.currentSnoozeTaskId = taskId;
    
    this.snoozeTaskTitle.textContent = task.title;
    
    // Default snooze time to +15 mins from now
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    this.snoozeTimeInput.value = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    this.snoozeModal.classList.remove('hidden');
  }

  handleSnoozeConfirm() {
    if (!this.currentSnoozeTaskId) return;
    const task = this.tasks.find(t => t.id === this.currentSnoozeTaskId);
    if (task) {
      task.scheduledTime = this.snoozeTimeInput.value;
      // Reset notifications
      task.notifiedOnTime = false;
      task.notified5Min = false;
      task.notified20Min = false;
      task.stopReminding = false;
      this.saveState();
      this.renderTasks();
      
      // Gamification
      this.gamification.data.snoozeCount = (this.gamification.data.snoozeCount || 0) + 1;
      this.evaluateGamification();
    }
    this.snoozeModal.classList.add('hidden');
    this.currentSnoozeTaskId = null;
  }

  handleSnoozeStop() {
    if (!this.currentSnoozeTaskId) return;
    const task = this.tasks.find(t => t.id === this.currentSnoozeTaskId);
    if (task) {
      task.stopReminding = true;
      this.saveState();
    }
    this.snoozeModal.classList.add('hidden');
    this.currentSnoozeTaskId = null;
  }

  handleSnoozeStart() {
    if (!this.currentSnoozeTaskId) return;
    const task = this.tasks.find(t => t.id === this.currentSnoozeTaskId);
    if (task) {
      // Start the task immediately
      this.setTimerForTask(task.id);
      
      // Gamification: maybe they started it a bit late, but let's check
      // Actually, if they start it exactly on time, they get a badge.
      // This is handled in setTimerForTask!
    }
    this.snoozeModal.classList.add('hidden');
    this.currentSnoozeTaskId = null;
  }


  // --- GENERAL RENDER ---

  renderAll() {
    this.renderTargetVsActual();
    this.renderTasks();
    this.renderSuggestions();
    this.renderCalendar();
    this.dailyNotesInput.value = this.dailyNotes[this.selectedDate] || '';
  }

  // --- ANALYTICS MODAL ---
  openAnalyticsModal() {
    this.analyticsModal.classList.remove('hidden');
    
    // Calculate daily completion stats for the current month
    const daysInMonth = new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate();
    const labels = [];
    const data = [];
    
    let totalCompletedMonth = 0;
    let totalTasksMonth = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      labels.push(d.toString());
      const dateStr = `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const dayTasks = this.tasks.filter(t => t.date === dateStr);
      const total = dayTasks.length;
      const completed = dayTasks.filter(t => t.isCompleted).length;
      
      let percentage = 0;
      if (total > 0) {
        percentage = Math.round((completed / total) * 100);
        totalTasksMonth += total;
        totalCompletedMonth += completed;
      }
      
      data.push(percentage);
    }

    // Overall Average
    let average = 0;
    if (totalTasksMonth > 0) {
      average = Math.round((totalCompletedMonth / totalTasksMonth) * 100);
    }

    // Set UI Feedback
    let emoji = '😐';
    let title = 'Average';
    let color = 'var(--text-1)';
    let borderColor = 'var(--border)';
    
    if (totalTasksMonth === 0) {
      emoji = '🤷‍♂️';
      title = 'No Tasks Yet';
      this.analyticsDesc.textContent = "It's hard to fail when you literally haven't scheduled anything to do.";
    } else if (average < 40) {
      emoji = '🤦‍♂️';
      title = 'Needs Focus';
      color = '#ef4444'; // red
      borderColor = 'rgba(239, 68, 68, 0.3)';
      this.analyticsDesc.textContent = `You completed ${average}% of your tasks. Are you actually trying, or just enjoying watching the days pass you by?`;
    } else if (average < 70) {
      emoji = '😐';
      title = 'Mediocre';
      color = '#fbbf24'; // yellow
      borderColor = 'rgba(251, 191, 36, 0.3)';
      this.analyticsDesc.textContent = `You completed ${average}% of your tasks. Aggressively mediocre. You're the human equivalent of a participation trophy.`;
    } else if (average < 95) {
      emoji = '🚀';
      title = 'Great Job!';
      color = '#10b981'; // green
      borderColor = 'rgba(16, 185, 129, 0.3)';
      this.analyticsDesc.textContent = `You crushed ${average}% of your tasks. Oh look, someone decided to function like a proper adult.`;
    } else {
      emoji = '🤖';
      title = 'Robot Status';
      color = '#8b5cf6'; // purple
      borderColor = 'rgba(139, 92, 246, 0.3)';
      this.analyticsDesc.textContent = `You completed ${average}% of your tasks. We get it, you're perfect. Now please go outside and touch some grass.`;
    }

    this.analyticsEmoji.textContent = emoji;
    this.analyticsTitle.textContent = title;
    this.analyticsTitle.style.color = color;
    this.analyticsIndicator.style.borderColor = borderColor;

    // Render Chart
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
    }

    if (window.Chart) {
      const ctx = this.monthlyChartCanvas.getContext('2d');
      this.monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Completion %',
            data: data,
            borderColor: color === 'var(--text-1)' ? '#6366f1' : color,
            backgroundColor: (color === 'var(--text-1)' ? '#6366f1' : color) + '33', // 33 for hex opacity 20%
            borderWidth: 3,
            pointBackgroundColor: color === 'var(--text-1)' ? '#6366f1' : color,
            pointRadius: 4,
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#9ca3af' }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#9ca3af' }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) { return context.parsed.y + '% completed'; }
              }
            }
          }
        }
      });
    }
  }

  closeAnalyticsModal() {
    this.analyticsModal.classList.add('hidden');
  }

  escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  }
}

// Global initialization

  window.app = new FocusFlowApp();

  // Register PWA Service Worker if supported
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.log('PWA ServiceWorker registration skipped:', err);
    });
  }

  // Handle App Shortcuts from home screen
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('quick') === 'true') {
    setTimeout(() => {
      if (window.app) window.app.openQuickWidget();
    }, 200);
  } else if (urlParams.get('timer') === 'start') {
    setTimeout(() => {
      if (window.app) window.app.startTimer();
    }, 200);
  }
