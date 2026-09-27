with open('gamification.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# We will replace the entire ACHIEVEMENTS array.
# First, let's find the array boundaries.
start_idx = content.find('const ACHIEVEMENTS = [')
end_idx = content.find('];', start_idx) + 2

new_achievements = '''const ACHIEVEMENTS = [
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
    description: '7 day streak. Okay, color me slightly impressed. 📅',
    icon: '\U0001F60F',
    req: (stats) => stats.currentStreak >= 7
  },
  {
    id: 'streak_14',
    title: 'Sweat & Tears',
    description: '14 days. You really don\\'t know when to quit, do you? 😅',
    icon: '\U0001F913',
    req: (stats) => stats.currentStreak >= 14
  },
  {
    id: 'streak_30',
    title: 'No Life',
    description: '30 day streak! Do you do anything else besides working? 👑',
    icon: '\U0001F451',
    req: (stats) => stats.currentStreak >= 30
  },
  {
    id: 'streak_keeper',
    title: 'Bare Minimum',
    description: 'Kept your momentum alive. Thanks for doing what you\\'re supposed to do. 💼',
    icon: '\U0001F644',
    req: (stats) => stats.currentStreak >= 5
  },
  {
    id: 'rest_day_shield',
    title: 'Couch Potato',
    description: 'Took a rest day without losing your streak. Enjoy doing absolutely nothing. \U0001F6CB️',
    icon: '\U0001F634',
    req: (stats) => stats.workedOnRestDay === true || stats.currentStreak >= 6
  },
  {
    id: 'zombified',
    title: 'Zombified',
    description: 'Logged 9+ hours. Braaains... Seriously, you need sleep! 🧟',
    icon: '\U0001F9DF',
    req: (stats) => (stats.maxDailyMinutes >= 540 || stats.maxOvertimeMinutes >= 180)
  },
  {
    id: 'brain_fried',
    title: 'Brain Fried',
    description: 'Endured a grueling 3+ hour single focus session. Go touch some grass. 🍳',
    icon: '\U0001F9E0',
    req: (stats) => stats.longestSessionMinutes >= 180
  },
  {
    id: 'night_owl',
    title: 'Vampire Shift',
    description: 'Logged work between 12 AM and 4 AM. Sunlight is good for you, you know. 🦇',
    icon: '\U0001F987',
    req: (stats) => stats.nightSessionLogged === true
  },
  {
    id: 'caffeine_overdrive',
    title: 'Caffeine Demon',
    description: '4+ sessions in a day. We can hear your heart palpitating from here. ☕',
    icon: '\U0001F917',
    req: (stats) => stats.maxSessionsInDay >= 4
  },
  {
    id: 'terminal_velocity',
    title: 'Try-Hard Supreme',
    description: 'Smashed target by 150%. Who exactly are you trying to impress? 🚀',
    icon: '\U0001F4AF',
    req: (stats) => stats.maxEfficiencyPercent >= 150
  },
  {
    id: 'punctual_panda',
    title: 'Teacher\\'s Pet',
    description: 'Started a scheduled task exactly on time. Wow, someone wants a gold star. ⭐',
    icon: '\U0001F913',
    req: (stats) => stats.punctualStarts >= 1
  },
  {
    id: 'snooze_master',
    title: 'Professional Procrastinator',
    description: 'Used Remind Later 3 times. We get it, you\\'ll do it "tomorrow". 🥱',
    icon: '\U0001F4A4',
    req: (stats) => stats.snoozeCount >= 3
  },
  {
    id: 'fashionably_late',
    title: 'Chronically Tardy',
    description: 'Started late 3+ times. Do you even own a watch? 🐢',
    icon: '\U0001F422',
    req: (stats) => stats.lateStarts >= 3
  },
  {
    id: 'redemption_arc',
    title: 'Glitch in the Matrix',
    description: 'You\\'re usually late, but you started on time! Did someone hack your account? 😲',
    icon: '\U0001F92F',
    req: (stats) => stats.redemptionEarned === true
  },
  {
    id: 'overachiever',
    title: 'Premature Finisher',
    description: 'Finished a task before it was even scheduled to start. Chill out, speed demon. 🏎️',
    icon: '\U0001F680',
    req: (stats) => stats.earlyCompletions >= 1
  }
];'''

content = content[:start_idx] + new_achievements + content[end_idx:]

with open('gamification.js', 'w', encoding='utf-8') as f:
    f.write(content)
