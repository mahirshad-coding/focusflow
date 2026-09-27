with open('gamification.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Find the start of LEVEL_THRESHOLDS
level_idx = content.find('const LEVEL_THRESHOLDS = [')

# Find the end of the file where GamificationManager ends
end_idx = content.find('window.GamificationManager = GamificationManager;') + len('window.GamificationManager = GamificationManager;')

# Extract the good parts
class_and_levels = content[level_idx:end_idx]

# Define the new BADGES_CONFIG
new_badges = """const BADGES_CONFIG = [
  {
    id: 'first_blood',
    title: 'Baby Steps',
    description: 'Completed your very first task. Do you want a cookie? \U0001F36A',
    icon: '\U0001F925',
    req: (stats) => stats.totalSessions >= 1
  },
  {
    id: 'streak_3',
    title: 'Three-Day Wonder',
    description: 'A 3-day streak. Let\\'s see if you actually make it to 4 before giving up. \U0001F525',
    icon: '\U0001F928',
    req: (stats) => stats.currentStreak >= 3
  },
  {
    id: 'streak_7',
    title: 'Week-Long Warrior',
    description: '7 day streak. Okay, color me slightly impressed. \U0001F4C5',
    icon: '\U0001F60F',
    req: (stats) => stats.currentStreak >= 7
  },
  {
    id: 'streak_14',
    title: 'Sweat & Tears',
    description: '14 days. You really don\\'t know when to quit, do you? \U0001F605',
    icon: '\U0001F913',
    req: (stats) => stats.currentStreak >= 14
  },
  {
    id: 'streak_30',
    title: 'No Life',
    description: '30 day streak! Do you do anything else besides working? \U0001F451',
    icon: '\U0001F451',
    req: (stats) => stats.currentStreak >= 30
  },
  {
    id: 'streak_keeper',
    title: 'Bare Minimum',
    description: 'Kept your momentum alive. Thanks for doing what you\\'re supposed to do. \U0001F4BC',
    icon: '\U0001F644',
    req: (stats) => stats.currentStreak >= 5
  },
  {
    id: 'rest_day_shield',
    title: 'Couch Potato',
    description: 'Took a rest day without losing your streak. Enjoy doing absolutely nothing. \U0001F6CB\uFE0F',
    icon: '\U0001F634',
    req: (stats) => stats.workedOnRestDay === true || stats.currentStreak >= 6
  },
  {
    id: 'zombified',
    title: 'Zombified',
    description: 'Logged 9+ hours. Braaains... Seriously, you need sleep! \U0001F9DF',
    icon: '\U0001F9DF',
    req: (stats) => (stats.maxDailyMinutes >= 540 || stats.maxOvertimeMinutes >= 180)
  },
  {
    id: 'brain_fried',
    title: 'Brain Fried',
    description: 'Endured a grueling 3+ hour single focus session. Go touch some grass. \U0001F373',
    icon: '\U0001F9E0',
    req: (stats) => stats.longestSessionMinutes >= 180
  },
  {
    id: 'night_owl',
    title: 'Vampire Shift',
    description: 'Logged work between 12 AM and 4 AM. Sunlight is good for you, you know. \U0001F987',
    icon: '\U0001F987',
    req: (stats) => stats.nightSessionLogged === true
  },
  {
    id: 'caffeine_overdrive',
    title: 'Caffeine Demon',
    description: '4+ sessions in a day. We can hear your heart palpitating from here. \U0001F573',
    icon: '\U0001F917',
    req: (stats) => stats.maxSessionsInDay >= 4
  },
  {
    id: 'terminal_velocity',
    title: 'Try-Hard Supreme',
    description: 'Smashed target by 150%. Who exactly are you trying to impress? \U0001F680',
    icon: '\U0001F4AF',
    req: (stats) => stats.maxEfficiencyPercent >= 150
  },
  {
    id: 'punctual_panda',
    title: 'Teacher\\'s Pet',
    description: 'Started a scheduled task exactly on time. Wow, someone wants a gold star. \u2B50',
    icon: '\U0001F913',
    req: (stats) => stats.punctualStarts >= 1
  },
  {
    id: 'snooze_master',
    title: 'Professional Procrastinator',
    description: 'Used Remind Later 3 times. We get it, you\\'ll do it \\"tomorrow\\". \U0001F971',
    icon: '\U0001F4A4',
    req: (stats) => stats.snoozeCount >= 3
  },
  {
    id: 'fashionably_late',
    title: 'Chronically Tardy',
    description: 'Started late 3+ times. Do you even own a watch? \U0001F422',
    icon: '\U0001F422',
    req: (stats) => stats.lateStarts >= 3
  },
  {
    id: 'redemption_arc',
    title: 'Glitch in the Matrix',
    description: 'You\\'re usually late, but you started on time! Did someone hack your account? \U0001F632',
    icon: '\U0001F92F',
    req: (stats) => stats.redemptionEarned === true
  },
  {
    id: 'overachiever',
    title: 'Premature Finisher',
    description: 'Finished a task before it was even scheduled to start. Chill out, speed demon. \U0001F3CE\uFE0F',
    icon: '\U0001F680',
    req: (stats) => stats.earlyCompletions >= 1
  },
  {
    id: 'visionary_procrastinator',
    title: 'Visionary Procrastinator',
    description: 'Scheduled a task 2+ days in advance. We all know you\\'re just delaying the inevitable. \U0001F52E',
    icon: '\U0001F52E',
    req: (stats) => stats.futureScheduling >= 1
  }
];

"""

final_content = new_badges + class_and_levels

with open('gamification.js', 'w', encoding='utf-8') as f:
    f.write(final_content)
