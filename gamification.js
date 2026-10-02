const BADGES_CONFIG = [
  {
    id: 'speed_demon',
    icon: '⚡',
    title: 'Speed Demon',
    description: 'Wow, you\'re working fast... or you just really didn\'t want to do the task and rushed it. Either way, 5 early finishes! 🙄',
    req: (stats) => (stats.earlyCompletions || 0) >= 5
  },
  {
    id: 'first_blood',
    title: 'Baby Steps',
    description: 'Completed your very first task. Do you want a cookie? 🍪',
    icon: '🤥',
    req: (stats) => stats.totalSessions >= 1
  },
  {
    id: 'streak_3',
    title: 'Three-Day Wonder',
    description: 'A 3-day streak. Let\'s see if you actually make it to 4 before giving up. 🔥',
    icon: '🤨',
    req: (stats) => stats.currentStreak >= 3
  },
  {
    id: 'streak_7',
    title: 'Week-Long Warrior',
    description: '7 day streak. Okay, color me slightly impressed. 📅',
    icon: '😏',
    req: (stats) => stats.currentStreak >= 7
  },
  {
    id: 'streak_14',
    title: 'Sweat & Tears',
    description: '14 days. You really don\'t know when to quit, do you? 😅',
    icon: '🤓',
    req: (stats) => stats.currentStreak >= 14
  },
  {
    id: 'streak_30',
    title: 'No Life',
    description: '30 day streak! Do you do anything else besides working? 👑',
    icon: '👑',
    req: (stats) => stats.currentStreak >= 30
  },
  {
    id: 'streak_keeper',
    title: 'Bare Minimum',
    description: 'Kept your momentum alive. Thanks for doing what you\'re supposed to do. 💼',
    icon: '🙄',
    req: (stats) => stats.currentStreak >= 5
  },
  {
    id: 'rest_day_shield',
    title: 'Couch Potato',
    description: 'Took a rest day without losing your streak. Enjoy doing absolutely nothing. 🛋️',
    icon: '😴',
    req: (stats) => stats.workedOnRestDay === true || stats.currentStreak >= 6
  },
  {
    id: 'zombified',
    title: 'Zombified',
    description: 'Logged 9+ hours. Braaains... Seriously, you need sleep! 🧟',
    icon: '🧟',
    req: (stats) => (stats.maxDailyMinutes >= 540 || stats.maxOvertimeMinutes >= 180)
  },
  {
    id: 'brain_fried',
    title: 'Brain Fried',
    description: 'Endured a grueling 3+ hour single focus session. Go touch some grass. 🍳',
    icon: '🧠',
    req: (stats) => stats.longestSessionMinutes >= 180
  },
  {
    id: 'night_owl',
    title: 'Vampire Shift',
    description: 'Logged work between 12 AM and 4 AM. Sunlight is good for you, you know. 🦇',
    icon: '🦇',
    req: (stats) => stats.nightSessionLogged === true
  },
  {
    id: 'caffeine_overdrive',
    title: 'Caffeine Demon',
    description: '4+ sessions in a day. We can hear your heart palpitating from here. 🕳',
    icon: '🤗',
    req: (stats) => stats.maxSessionsInDay >= 4
  },
  {
    id: 'terminal_velocity',
    title: 'Try-Hard Supreme',
    description: 'Smashed target by 150%. Who exactly are you trying to impress? 🚀',
    icon: '💯',
    req: (stats) => stats.maxEfficiencyPercent >= 150
  },
  {
    id: 'punctual_panda',
    title: 'Teacher\'s Pet',
    description: 'Started a scheduled task exactly on time. Wow, someone wants a gold star. ⭐',
    icon: '🤓',
    req: (stats) => stats.punctualStarts >= 1
  },
  {
    id: 'snooze_master',
    title: 'Professional Procrastinator',
    description: 'Used Remind Later 3 times. We get it, you\'ll do it \"tomorrow\". 🥱',
    icon: '💤',
    req: (stats) => stats.snoozeCount >= 3
  },
  {
    id: 'fashionably_late',
    title: 'Chronically Tardy',
    description: 'Started late 3+ times. Do you even own a watch? 🐢',
    icon: '🐢',
    req: (stats) => stats.lateStarts >= 3
  },
  {
    id: 'redemption_arc',
    title: 'Glitch in the Matrix',
    description: 'You\'re usually late, but you started on time! Did someone hack your account? 😲',
    icon: '🤯',
    req: (stats) => stats.redemptionEarned === true
  },
  {
    id: 'math_is_broken',
    title: '110% Effort',
    description: 'You hit over 100% efficiency today. Either you\'re a productivity god, or you just don\'t know when to clock out. Go outside. 🤯',
    icon: '🤯',
    req: (stats) => stats.maxEfficiencyPercent > 100
  },
  {
    id: 'overachiever',
    title: 'Premature Finisher',
    description: 'Finished a task before it was even scheduled to start. Chill out, speed demon. 🏎️',
    icon: '🚀',
    req: (stats) => stats.earlyCompletions >= 1
  },
  {
    id: 'prodigal_son',
    title: 'Look Who Decided To Show Up',
    description: 'Ghosted your tasks for over 2 days and finally crawled back. We missed you... mostly. 👻',
    icon: '👻',
    req: (stats) => stats.cameBackAfterAbsence === true
  },
  {
    id: 'task_juggernaut',
    title: 'Teacher\'s Pet',
    description: 'Completed 100% of your daily tasks (min 2) for 3 days in a row. We get it, you\'re better than us. 🤓',
    icon: '🤓',
    req: (stats) => stats.maxTaskStreak >= 3
  },
  {
    id: 'stockholm_syndrome',
    title: 'Stockholm Syndrome',
    description: 'Started the timer for the EXACT same task for a 3rd time. Are you being held hostage by this to-do item? Blink twice if you need help. 🏳️',
    icon: '🏳️',
    req: (stats) => stats.stockholmSyndrome === true
  },
  {
    id: 'glutton_for_punishment',
    title: 'Glutton for Punishment',
    description: 'Started the timer AGAIN for a task you already completed a session for. Didn\'t hear no bell, huh? 🥊',
    icon: '🥊',
    req: (stats) => stats.gluttonForPunishment === true
  },
  {
    id: 'calendar_shredder',
    title: 'Calendar Shredder',
    description: 'Started tasks completely out of order 5 times. You know clocks have numbers on them for a reason, right? 🗓️🔥',
    icon: '🗑️',
    req: (stats) => stats.earlyStarts >= 5
  },
  {
    id: 'agent_of_chaos',
    title: 'Agent of Chaos',
    description: 'Started a scheduled task completely out of order. Why do you even bother making a schedule? 🌪️',
    icon: '🤪',
    req: (stats) => stats.earlyStarts >= 1
  },
  {
    id: 'visionary_procrastinator',
    title: 'Visionary Procrastinator',
    description: 'Scheduled a task 2+ days in advance. We all know you\'re just delaying the inevitable. 🔮',
    icon: '🔮',
    req: (stats) => stats.futureScheduling >= 1
  }
];

const LEVEL_THRESHOLDS = [
  { level: 1, minXp: 0, title: 'Novice Scholar' },
  { level: 2, minXp: 200, title: 'Focus Apprentice' },
  { level: 3, minXp: 500, title: 'Deep Worker' },
  { level: 4, minXp: 1000, title: 'Flow Specialist' },
  { level: 5, minXp: 1800, title: 'Focus Master' },
  { level: 6, minXp: 3000, title: 'Productivity Titan' }
];

class GamificationManager {
  constructor(storageKey = 'focusflow_gamification') {
    this.storageKey = storageKey;
    this.data = this.load();
  }

  load() {
    const defaults = {
      xp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      lastEvaluatedDate: null,
      freezeTokens: 2,
      unlockedBadges: [],
      totalSessions: 0,
      tasksCompletedCount: 0,
      longestSessionMinutes: 0,
      workedOnRestDay: false,
      lifetimeHours: 0,
      punctualStarts: 0,
      snoozeCount: 0,
      lateStarts: 0,
      earlyStarts: 0,
      earlyCompletions: 0,
      futureScheduling: 0,
      redemptionEarned: false
    };

    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Safely merge with defaults so returning users don't crash when new badges are added
        return { ...defaults, ...parsed, unlockedBadges: parsed.unlockedBadges || [] };
      } catch (e) {
        console.error('Error loading gamification data', e);
      }
    }
    return defaults;
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  addXp(amount, reason = '') {
    this.data.xp += amount;
    const oldLevel = this.data.level;
    this.updateLevel();
    this.save();
    return {
      gained: amount,
      total: this.data.xp,
      leveledUp: this.data.level > oldLevel,
      currentLevel: this.data.level,
      title: this.getLevelTitle(this.data.level),
      reason
    };
  }

  updateLevel() {
    let current = LEVEL_THRESHOLDS[0];
    for (const t of LEVEL_THRESHOLDS) {
      if (this.data.xp >= t.minXp) {
        current = t;
      } else {
        break;
      }
    }
    
    const maxKnown = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    if (this.data.xp >= maxKnown.minXp) {
        const excessXp = this.data.xp - maxKnown.minXp;
        const extraLevels = Math.floor(excessXp / 1500);
        this.data.level = maxKnown.level + extraLevels;
    } else {
        this.data.level = current.level;
    }
  }

  getLevelInfo() {
    this.updateLevel();
    const currentIdx = LEVEL_THRESHOLDS.findIndex(l => l.level === this.data.level);
    
    let current, nextMin;
    if (currentIdx !== -1) {
        current = LEVEL_THRESHOLDS[currentIdx];
        const next = LEVEL_THRESHOLDS[currentIdx + 1];
        nextMin = next ? next.minXp : current.minXp + 1500;
    } else {
        // We are extrapolated!
        const maxKnown = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
        current = { level: this.data.level, minXp: maxKnown.minXp + ((this.data.level - maxKnown.level) * 1500), title: 'Productivity Legend' };
        nextMin = current.minXp + 1500;
    }
    const currentMin = current.minXp;
    const progress = Math.min(100, Math.max(0, ((this.data.xp - currentMin) / (nextMin - currentMin)) * 100));

    return {
      level: this.data.level,
      title: current.title,
      xp: this.data.xp,
      nextLevelXp: nextMin,
      percentToNext: Math.round(progress)
    };
  }

  getLevelTitle(level) {
    const t = LEVEL_THRESHOLDS.find(item => item.level === level);
    return t ? t.title : 'Focus Master';
  }

  /**
   * Recalculates streak considering a 6-day schedule (Sunday Rest Day).
   * @param {Object} dailyHistory map of dateString ('YYYY-MM-DD') to { targetMinutes, actualMinutes }
   * @param {string} scheduleType '6-day-sunday-rest' | '7-day-everyday' | '5-day-workweek'
   */
  evaluateStreaks(dailyHistory, scheduleType = '6-day-sunday-rest') {
    const dates = Object.keys(dailyHistory).sort();
    if (dates.length === 0) return this.data.currentStreak;

    let currentStreak = 0;
    let longestStreak = this.data.longestStreak || 0;
    let workedOnRestDay = false;

    // Check consecutive days backwards from yesterday/today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let checkDate = new Date(today);
    let streakBroken = false;

    // First, check if today has met target
    const todayStr = this.formatDate(today);
    const todayLog = dailyHistory[todayStr];
    const isTodaySunday = today.getDay() === 0;

    let todayCounted = false;
    if (todayLog) {
      const targetM = todayLog.targetMinutes || 360;
      const actualM = todayLog.actualMinutes || 0;
      if (actualM >= targetM * 0.8) {
        currentStreak++;
        todayCounted = true;
      }
      if (isTodaySunday && actualM > 0) {
        workedOnRestDay = true;
      }
    }

    // Step back day by day
    for (let i = 1; i <= 365; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      const pastStr = this.formatDate(pastDate);
      const dayOfWeek = pastDate.getDay(); // 0 = Sunday, 6 = Saturday

      const log = dailyHistory[pastStr];
      const actualM = log ? log.actualMinutes : 0;
      const targetM = log ? (log.targetMinutes || 360) : 360;

      const isRestDay = (scheduleType === '6-day-sunday-rest' && dayOfWeek === 0) ||
                        (scheduleType === '5-day-workweek' && (dayOfWeek === 0 || dayOfWeek === 6));

      if (isRestDay) {
        // If it was a rest day, lack of work DOES NOT break streak!
        if (actualM >= 30) {
          workedOnRestDay = true; // Bonus overachiever
        }
        continue;
      }

      // It was an active workday
      if (actualM >= targetM * 0.8) {
        currentStreak++;
      } else {
        // Streak broken
        streakBroken = true;
        break;
      }
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    this.data.currentStreak = currentStreak;
    this.data.longestStreak = longestStreak;
    if (workedOnRestDay) this.data.workedOnRestDay = true;
    this.save();

    return currentStreak;
  }

  checkBadges(customStats = {}) {
    const stats = {
      ...this.data,
      ...customStats
    };

    const newUnlocked = [];
    BADGES_CONFIG.forEach(badge => {
      if (!(this.data.unlockedBadges || []).includes(badge.id)) {
        if (badge.req(stats)) {
          if (!this.data.unlockedBadges) this.data.unlockedBadges = [];\n          this.data.unlockedBadges.push(badge.id);
          newUnlocked.push(badge);
          this.addXp(100, `Achievement Unlocked: ${badge.title}`);
        }
      }
    });

    this.save();
    return newUnlocked;
  }

  getBadges() {
    return BADGES_CONFIG.map(b => ({
      ...b,
      unlocked: (this.data.unlockedBadges || []).includes(b.id)
    }));
  }

  formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

window.GamificationManager = GamificationManager;