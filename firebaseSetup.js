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
const provider = new firebase.auth.GoogleAuthProvider();

window.addEventListener('DOMContentLoaded', () => {
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

        // Fetch data from Firestore
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
        }

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
            gamification: window.app.gamification.data || {}
          }, { merge: true }).catch(err => {
            console.error('Failed to sync to cloud:', err);
          });
        };
      }
    } else {
      // Show login screen if signed out
      loginOverlay.style.display = 'flex';
      btnGoogleLogin.textContent = 'Continue with Google';
    }
  });
});

window.addEventListener('DOMContentLoaded', () => {
  const btnSignOut = document.getElementById('btn-sign-out');
  if (btnSignOut) {
    btnSignOut.addEventListener('click', () => {
      auth.signOut();
    });
  }
});

