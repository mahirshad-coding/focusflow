with open('firebaseSetup.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Find the docRef.get() block and replace it
match = re.search(r'// Fetch data from Firestore.*?catch \(e\) \{.*?\}', content, re.DOTALL)
if match:
    old_fetch = match.group(0)
    new_fetch = '''// Fetch data from Firestore in real-time
      const docRef = db.collection('users').doc(user.uid);
      
      docRef.onSnapshot((docSnap) => {
        if (docSnap.exists) {
          // Ignore local pending writes to avoid infinite loops and UI stutter
          if (docSnap.metadata.hasPendingWrites) return;

          const data = docSnap.data();
          window.app.settings = data.settings || window.app.settings;
          if (window.app.settings.pomodoroDuration) {
            window.app.pomodoroTargetSeconds = window.app.settings.pomodoroDuration * 60;
            if (window.app.pomodoroCustomHrs) window.app.pomodoroCustomHrs.value = Math.floor(window.app.settings.pomodoroDuration / 60);
            if (window.app.pomodoroCustomMins) window.app.pomodoroCustomMins.value = window.app.settings.pomodoroDuration % 60;
          }
          window.app.userProfile = data.userProfile || window.app.userProfile;
          
          // Only overwrite local arrays if Firestore actually has data for them, 
          // otherwise keep local data so it doesn't get wiped out.
          if (data.tasks && data.tasks.length > 0) window.app.tasks = data.tasks;
          if (data.sessions && data.sessions.length > 0) window.app.sessions = data.sessions;
          
          window.app.dailyNotes = Object.keys(data.dailyNotes || {}).length > 0 ? data.dailyNotes : window.app.dailyNotes;
          window.app.customDailyTargets = Object.keys(data.customDailyTargets || {}).length > 0 ? data.customDailyTargets : window.app.customDailyTargets;
          
          if (data.gamification) {
             window.app.gamification.data = data.gamification;
          }

          // Re-render the app with cloud data
          window.app.renderAll();
          window.app.renderProfile();
        } else {
          // If the document doesn't exist yet in Firestore, push our local data up!
          window.app.saveState();
        }
      }, (e) => {
        console.error("Error fetching cloud data", e);
      });'''
    content = content.replace(old_fetch, new_fetch)

with open('firebaseSetup.js', 'w', encoding='utf-8') as f:
    f.write(content)
