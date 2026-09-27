with open('firebaseSetup.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_fetch = '''      // Fetch data from Firestore
      const docRef = db.collection('users').doc(user.uid);
      try {
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          const data = docSnap.data();
          window.app.settings = data.settings || window.app.settings;
          if (window.app.settings.pomodoroDuration) {
            window.app.pomodoroTargetSeconds = window.app.settings.pomodoroDuration * 60;
            if (window.app.pomodoroCustomHrs) window.app.pomodoroCustomHrs.value = Math.floor(window.app.settings.pomodoroDuration / 60);
            if (window.app.pomodoroCustomMins) window.app.pomodoroCustomMins.value = window.app.settings.pomodoroDuration % 60;
          }
          window.app.userProfile = data.userProfile || window.app.userProfile;
          window.app.tasks = data.tasks || [];
          window.app.sessions = data.sessions || [];
          window.app.dailyNotes = data.dailyNotes || {};
          window.app.customDailyTargets = data.customDailyTargets || {};

          // Re-render the app with cloud data
          window.app.renderAll();
          window.app.renderProfile();
        }
      } catch (e) {
        console.error("Error fetching cloud data", e);
      }'''

new_fetch = '''      // Fetch data from Firestore (Real-time listener)
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
          window.app.tasks = data.tasks || [];
          window.app.sessions = data.sessions || [];
          window.app.dailyNotes = data.dailyNotes || {};
          window.app.customDailyTargets = data.customDailyTargets || {};
          if (data.gamification) {
            window.app.gamification.data = data.gamification;
          }

          // Re-render the app with cloud data synced from other devices
          window.app.renderAll();
          window.app.renderProfile();
        }
      }, (e) => {
        console.error("Error fetching cloud data", e);
      });'''

content = content.replace(old_fetch, new_fetch)

old_save = '''            customDailyTargets: window.app.customDailyTargets || {}'''
new_save = '''            customDailyTargets: window.app.customDailyTargets || {},
            gamification: window.app.gamification.data || {}'''
content = content.replace(old_save, new_save)

# Also patch gamification.save
add_patch = '''      const originalGamificationSave = window.app.gamification.save.bind(window.app.gamification);
      window.app.gamification.save = () => {
        originalGamificationSave();
        window.app.saveState(); // Trigger cloud sync
      };
'''
content = content.replace('      // Monkey-patch saveState to push to cloud', add_patch + '      // Monkey-patch saveState to push to cloud')

with open('firebaseSetup.js', 'w', encoding='utf-8') as f:
    f.write(content)
