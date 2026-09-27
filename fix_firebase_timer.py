with open('firebaseSetup.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Add timerState to onSnapshot
old_sync = '''          // Sync arrays and objects
          if ('tasks' in data) window.app.tasks = data.tasks;'''
          
new_sync = '''          // Sync Timer State across devices
          if (data.timerState && window.app) {
             const ts = data.timerState;
             if (ts.isRunning && !window.app.isTimerRunning) {
                 window.app.timerMode = ts.mode;
                 const elapsed = Math.round((Date.now() - ts.lastUpdatedAt) / 1000);
                 if (ts.mode === 'stopwatch') {
                     window.app.timerSeconds = ts.lastKnownSeconds + elapsed;
                 } else {
                     window.app.timerSeconds = Math.max(0, ts.lastKnownSeconds - elapsed);
                 }
                 window.app.startTimer(false); // start without syncing back
             } else if (!ts.isRunning && window.app.isTimerRunning) {
                 window.app.timerSeconds = ts.lastKnownSeconds;
                 window.app.pauseTimer(false);
             }
          }

          // Sync arrays and objects
          if ('tasks' in data) window.app.tasks = data.tasks;'''

content = content.replace(old_sync, new_sync)

# Add timerState to saveState
old_save = '''            gamification: window.app.gamification.data || {}'''

new_save = '''            gamification: window.app.gamification.data || {},
            timerState: {
              isRunning: window.app.isTimerRunning || false,
              mode: window.app.timerMode || 'pomodoro',
              lastKnownSeconds: window.app.timerSeconds || 0,
              lastUpdatedAt: window.app.timerLastUpdatedAt || Date.now()
            }'''

content = content.replace(old_save, new_save)

with open('firebaseSetup.js', 'w', encoding='utf-8') as f:
    f.write(content)
