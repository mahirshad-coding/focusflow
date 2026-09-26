/**
 * FocusFlow — Gamification, Streak & Reward System
 * Handles XP, Levels, Badges, and flexible Streak logic (e.g. 6-day work schedule with Sunday rest).
 */

const BADGES_CONFIG = [
  {
    id: 'streak_3',
    title: '+3 Days',
    description: 'Maintained a 3-day active study or work streak.',
    icon: '🔥',
    req: (stats) => stats.currentStreak >= 3
  },
  {
    id: 'streak_7',
    title: '+7 Days',
    description: 'Crushed a full 7-day consistency sprint.',
    icon: '⚡',
    req: (stats) => stats.currentStreak >= 7
  },
  {
    id: 'streak_14',
    title: '+14 Days',
    description: 'Two full weeks of relentless dedication.',
    icon: '🏆',
    req: (stats) => stats.currentStreak >= 14
  },
  {
    id: 'streak_30',
    title: '+30 Days',
    description: 'A full month of unstoppable momentum. Legendary!',
    icon: '👑',
    req: (stats) => stats.currentStreak >= 30
  },
  {
    id: 'streak_keeper',
    title: 'Streak Keeper',
    description: 'Kept your momentum alive across your scheduled workweek.',
    icon: '🛡️',
    req: (stats) => stats.currentStreak >= 5
  },
  {
    id: 'first_blood',
    title: 'First Step',
    description: 'Logged your very first focus block.',
    icon: '🎯',
    req: (stats) => stats.totalSessions >= 1
  },
  {
    id: 'rest_day_shield',
    title: 'Rest Shield',
    description: 'Successfully navigated a rest day with streak intact.',
    icon: '☕',
    req: (stats) => stats.workedOnRestDay === true || stats.currentStreak >= 6
  },
  {
    id: 'zombified',
    title: 'Zombified',
    description: 'Logged 9+ hours or exceeded daily target by 3+ hours. Braaains... need sleep!',
    icon: '🧟',
    req: (stats) => (stats.maxDailyMinutes >= 540 || stats.maxOvertimeMinutes >= 180)
  },
  {
    id: 'brain_fried',
    title: 'Brain Fried',
    description: 'Endured a grueling 3+ hour single focus session without pausing.',
    icon: '🍳',
    req: (stats) => stats.longestSessionMinutes >= 180
  },
  {
    id: 'night_owl',
    title: 'Vampire Shift',
    description: 'Logged focus work between 12:00 AM and 4:30 AM.',
    icon: '🧛',
    req: (stats) => stats.nightSessionLogged === true
  },
  {
    id: 'caffeine_overdrive',
    title: 'Caffeine Demon',
    description: 'Completed 4 or more separate focus blocks in a single day.',
    icon: '☕',
    req: (stats) => stats.maxSessionsInDay >= 4
  },
  {
    id: 'terminal_velocity',
    title: '150% Overdrive',
    description: 'Smashed your daily target by 150% or more. Total hyperfocus!',
    icon: '🚀',
    req: (stats) => stats.maxEfficiencyPercent >= 150
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
    const raw = localStorage.getItem(this.storageKey);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Error loading gamification data', e);
      }
    }
    return {
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
      lifetimeHours: 0
    };
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
    this.data.level = current.level;
  }

  getLevelInfo() {
    this.updateLevel();
    const currentIdx = LEVEL_THRESHOLDS.findIndex(l => l.level === this.data.level);
    const current = LEVEL_THRESHOLDS[currentIdx];
    const next = LEVEL_THRESHOLDS[currentIdx + 1] || null;

    const currentMin = current.minXp;
    const nextMin = next ? next.minXp : currentMin + 1500;
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
      if (!this.data.unlockedBadges.includes(badge.id)) {
        if (badge.req(stats)) {
          this.data.unlockedBadges.push(badge.id);
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
      unlocked: this.data.unlockedBadges.includes(b.id)
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
