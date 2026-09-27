const firebaseConfig = {
  apiKey: "AIzaSyBFkzJSG0CWWFcfGW5lRWioSPHD4OYcbWE",
  authDomain: "focusflow-ca238.firebaseapp.com",
  projectId: "focusflow-ca238",
  storageBucket: "focusflow-ca238.firebasestorage.app",
  messagingSenderId: "283999246479",
  appId: "1:283999246479:web:d0919ce1c0ed210640b8fa",
  measurementId: "G-BF0C3LS80E"
};

// Initialize Firebase using compat window object
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence for Firestore
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
    console.warn('Firestore offline persistence error:', err.code);
});

const provider = new firebase.auth.GoogleAuthProvider();


  const loginOverlay = document.getElementById('login-overlay');
  const btnGoogleLogin = document.getElementById('btn-google-login');

  btnGoogleLogin.addEventListener('click', () => {
        btnGoogleLogin.textContent = 'Signing in...';
    auth.signInWithPopup(provider).catch(err => {
      console.error(err);
      btnGoogleLogin.textContent = 'Continue with Google';
      alert('Sign in failed: ' + err.message);
    });
  });

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // Hide login screen
      loginOverlay.style.display = 'none';
      
      // Override the app's save/load methods to use Firestore!
      if (window.app) {
        window.app.userId = user.uid;

        // Fetch data from Firestore in real-time
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
          
          // Sync Timer State across devices
          if (data.timerState && window.app) {
             const ts = data.timerState;
             
             const isNewEpoch = ts.lastUpdatedAt > (window.app.timerLastUpdatedAt || 0);
             window.app.timerLastUpdatedAt = ts.lastUpdatedAt;
             
             // The "Dominance" Rule: Always favor the timer that has progressed the FURTHEST,
             // BUT ONLY if they belong to the same epoch (started at the same time).
             // If remote is a NEWER epoch (e.g. one device finished and reset), remote always wins!
             let remoteIsFurther = isNewEpoch; 
             
             if (!isNewEpoch) {
                 if (ts.mode === 'stopwatch') {
                     remoteIsFurther = ts.lastKnownSeconds > window.app.timerSeconds;
                 } else {
                     remoteIsFurther = ts.lastKnownSeconds < window.app.timerSeconds;
                 }
             }

             if (ts.isRunning && !window.app.isTimerRunning) {
                 window.app.timerMode = ts.mode;
                 if (remoteIsFurther) window.app.timerSeconds = ts.lastKnownSeconds;
                 window.app.startTimer(false); 
                 if (!remoteIsFurther) window.app.saveState(); 
             } else if (!ts.isRunning && window.app.isTimerRunning) {
                 window.app.timerMode = ts.mode;
                 if (remoteIsFurther) window.app.timerSeconds = ts.lastKnownSeconds;
                 window.app.pauseTimer(false);
                 if (!remoteIsFurther) window.app.saveState(); 
             } else if (ts.isRunning && window.app.isTimerRunning) {
                 if (remoteIsFurther && Math.abs(window.app.timerSeconds - ts.lastKnownSeconds) > 2) {
                     window.app.timerSeconds = ts.lastKnownSeconds;
                 }
             } else if (!ts.isRunning && !window.app.isTimerRunning) {
                 if (remoteIsFurther) {
                     window.app.timerMode = ts.mode;
                     window.app.timerSeconds = ts.lastKnownSeconds;
                     if (window.app.updateTimerDisplay) window.app.updateTimerDisplay();
                 } else if (window.app.timerSeconds !== ts.lastKnownSeconds && !isNewEpoch) {
                     window.app.saveState();
                 }
             }
          }

          // Sync arrays and objects
          if ('tasks' in data) window.app.tasks = data.tasks;
          if ('sessions' in data) window.app.sessions = data.sessions;
          if ('dailyNotes' in data) window.app.dailyNotes = data.dailyNotes;
          if ('customDailyTargets' in data) window.app.customDailyTargets = data.customDailyTargets;
          
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
      });

        const originalGamificationSave = window.app.gamification.save.bind(window.app.gamification);
      window.app.gamification.save = () => {
        originalGamificationSave();
        window.app.saveState(); // Trigger cloud sync
      };
      // Monkey-patch saveState to push to cloud
        const originalSaveState = window.app.saveState.bind(window.app);
        window.app.saveState = () => {
          // Keep local storage as a backup
          originalSaveState();
          
          // Save to Firestore
          db.collection('users').doc(user.uid).set({
            settings: window.app.settings || {},
            userProfile: window.app.userProfile || null,
            tasks: window.app.tasks || [],
            sessions: window.app.sessions || [],
            dailyNotes: window.app.dailyNotes || {},
            customDailyTargets: window.app.customDailyTargets || {},
            gamification: window.app.gamification.data || {},
            timerState: {
              isRunning: window.app.isTimerRunning || false,
              mode: window.app.timerMode || 'pomodoro',
              lastKnownSeconds: window.app.timerSeconds || 0,
              lastUpdatedAt: window.app.timerLastUpdatedAt || Date.now()
            }
          }, { merge: true }).catch(err => {
            console.error('Failed to sync to cloud:', err);
          });
        };
      }
    } else {
      // Show login screen if signed out
      loginOverlay.style.display = 'flex';
      btnGoogleLogin.classList.remove('hidden');
      const spinner = document.getElementById('auth-loading-spinner');
      if (spinner) spinner.style.display = 'none';
      btnGoogleLogin.textContent = 'Continue with Google';
    }
  });

  const btnSignOut = document.getElementById('btn-sign-out');
  if (btnSignOut) {
    btnSignOut.addEventListener('click', () => {
      auth.signOut();
    });
  }
