with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_timer = '''  startTimer() {
    this.isTimerRunning = true;
    this.sound.playChime('timer-start');
    this.timerBtnIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    this.timerBtnText.textContent = 'Pause Focus';
    this.btnTimerStartPause.classList.add('timer-active');
    this.quickTimerToggleBtn.textContent = 'Pause Session';
    this.quickTimerToggleBtn.className = 'px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all';

    this.timerInterval = setInterval(() => {
      if (this.timerMode === 'stopwatch') {
        this.timerSeconds++;
      } else {
        this.timerSeconds--;
        if (this.timerSeconds <= 0) {
          this.sound.playChime('level-up');
          alert(' Pomodoro Focus Block Complete! Fantastic work!');
          this.logTimerSession();
          this.resetTimer();
          return;
        }
      }
      this.updateTimerDisplay();
    }, 1000);
  }

  pauseTimer() {
    this.isTimerRunning = false;
    clearInterval(this.timerInterval);
    this.timerBtnIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    this.timerBtnText.textContent = 'Resume Focus';
    this.btnTimerStartPause.classList.remove('timer-active');
    this.quickTimerToggleBtn.textContent = 'Start Session';
    this.quickTimerToggleBtn.className = 'px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all';
  }'''

new_timer = '''  startTimer() {
    this.isTimerRunning = true;
    this.sound.playChime('timer-start');
    this.timerBtnIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    this.timerBtnText.textContent = 'Pause Focus';
    this.btnTimerStartPause.classList.add('timer-active');
    this.quickTimerToggleBtn.textContent = 'Pause Session';
    this.quickTimerToggleBtn.className = 'px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all';

    this.lastTickTime = Date.now();
    
    this.timerInterval = setInterval(() => {
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
    }, 500); // Check more frequently to keep accurate time across background throttling
  }

  pauseTimer() {
    this.isTimerRunning = false;
    clearInterval(this.timerInterval);
    this.timerBtnIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    this.timerBtnText.textContent = 'Resume Focus';
    this.btnTimerStartPause.classList.remove('timer-active');
    this.quickTimerToggleBtn.textContent = 'Start Session';
    this.quickTimerToggleBtn.className = 'px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all';
    document.title = 'FocusFlow'; // Reset tab title
  }'''

content = content.replace(old_timer, new_timer)

old_update = '''    this.timerDisplay.textContent = formatted;
    this.quickTimerStatus.textContent = formatted;
  }'''
new_update = '''    this.timerDisplay.textContent = formatted;
    this.quickTimerStatus.textContent = formatted;
    
    if (this.isTimerRunning) {
      document.title = `${formatted} - FocusFlow`;
    } else {
      document.title = 'FocusFlow';
    }
  }'''
content = content.replace(old_update, new_update)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
