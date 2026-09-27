with open('firebaseSetup.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re

old_sync = '''          // Only overwrite local arrays if Firestore actually has data for them, 
          // otherwise keep local data so it doesn't get wiped out.
          if (data.tasks && data.tasks.length > 0) window.app.tasks = data.tasks;
          if (data.sessions && data.sessions.length > 0) window.app.sessions = data.sessions;
          
          window.app.dailyNotes = Object.keys(data.dailyNotes || {}).length > 0 ? data.dailyNotes : window.app.dailyNotes;
          window.app.customDailyTargets = Object.keys(data.customDailyTargets || {}).length > 0 ? data.customDailyTargets : window.app.customDailyTargets;'''

new_sync = '''          // Sync arrays and objects
          if ('tasks' in data) window.app.tasks = data.tasks;
          if ('sessions' in data) window.app.sessions = data.sessions;
          if ('dailyNotes' in data) window.app.dailyNotes = data.dailyNotes;
          if ('customDailyTargets' in data) window.app.customDailyTargets = data.customDailyTargets;'''

content = content.replace(old_sync, new_sync)

with open('firebaseSetup.js', 'w', encoding='utf-8') as f:
    f.write(content)
