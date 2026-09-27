with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Add Wake Lock variable to constructor
old_constructor_end = '''    this.evaluateGamification();
    this.startClock();
    this.startNotificationEngine();'''
new_constructor_end = '''    this.wakeLock = null;
    this.evaluateGamification();
    this.startClock();
    this.startNotificationEngine();
    
    // Visibility change listener to instantly catch up timer when returning to app
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isTimerRunning) {
        this.catchUpTimer();
      }
    });'''
content = content.replace(old_constructor_end, new_constructor_end)

# Add catchUpTimer, requestWakeLock, releaseWakeLock
methods = '''  // --- WAKE LOCK & BACKGROUND CATCH-UP ---
  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock active');
      } catch (err) {
        console.log('Wake Lock failed:', err);
      }
    }
  }

  releaseWakeLock() {
    if (this.wakeLock !== null) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }

  catchUpTimer() {
    if (!this.lastTickTime || !this.isTimerRunning) return;
    const now = Date.now();
    const deltaSecs = Math.round((now - this.lastTickTime) / 1000);
    
    if (deltaSecs >= 1) {
      this.lastTickTime = now;
      if (this.timerMode === 'stopwatch') {
        this.timerSeconds += deltaSecs;
      } else {
        this.timerSeconds -= deltaSecs;
        if (this.timerSeconds <= 0) {
          this.timerSeconds = 0;
          this.sound.playChime('level-up');
          alert(' Pomodoro Focus Block Complete! Fantastic work!');
          this.logTimerSession();
          this.resetTimer();
          return;
        }
      }
      this.updateTimerDisplay();
    }
  }
'''
content = content.replace('  startTimer(syncToCloud = true) {', methods + '\\n  startTimer(syncToCloud = true) {')

# Hook wake lock into startTimer and pauseTimer
content = content.replace(
    "this.sound.playChime('timer-start');", 
    "this.sound.playChime('timer-start');\n    this.requestWakeLock();"
)
content = content.replace(
    "clearInterval(this.timerInterval);", 
    "clearInterval(this.timerInterval);\n    this.releaseWakeLock();"
)

# Hook into resetTimer too, just in case
content = content.replace(
    "this.timerSeconds = this.timerMode === 'stopwatch' ? 0 : this.pomodoroTargetSeconds;",
    "this.releaseWakeLock();\n    this.timerSeconds = this.timerMode === 'stopwatch' ? 0 : this.pomodoroTargetSeconds;"
)

# Remove the delta logic in startTimer interval, and just call catchUpTimer!
old_interval = '''    this.timerInterval = setInterval(() => {
      const now = Date.now();
      const deltaSecs = Math.round((now - this.lastTickTime) / 1000);
      
      if (deltaSecs >= 1) {
        this.lastTickTime = now;
        
        if (this.timerMode === 'stopwatch') {
          this.timerSeconds += deltaSecs;
        } else {
          this.timerSeconds -= deltaSecs;
          if (this.timerSeconds <= 0) {
            this.timerSeconds = 0;
            this.sound.playChime('level-up');
            alert(' Pomodoro Focus Block Complete! Fantastic work!');
            this.logTimerSession();
            this.resetTimer();
            return;
          }
        }
        this.updateTimerDisplay();
      }
    }, 500); // Check more frequently to keep accurate time across background throttling'''

new_interval = '''    this.timerInterval = setInterval(() => {
      this.catchUpTimer();
    }, 500);'''
content = content.replace(old_interval, new_interval)


with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
