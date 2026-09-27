with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re

start_match = re.search(r'startTimer\(.*?\) \{', content)
if not start_match:
    start_match = re.search(r'startTimer\(\) \{', content)

end_match = re.search(r'updateTimerDisplay\(\) \{.*?\}\n  \}', content, re.DOTALL)

if start_match and end_match:
    start_idx = start_match.start()
    end_idx = end_match.end()
    
    new_methods = """startTimer(syncToCloud = true) {
    this.isTimerRunning = true;
    this.lastTickTime = Date.now();

    const silentAudio = document.getElementById('silent-audio');
    if (silentAudio) {
      silentAudio.play().catch(e => console.warn('Audio play failed:', e));
    }

    this.sound.playChime('timer-start');
    if (this.requestWakeLock) this.requestWakeLock();
    
    this.timerBtnIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    this.timerBtnText.textContent = 'Pause Focus';
    this.btnTimerStartPause.classList.add('timer-active');
    
    if (this.quickTimerToggleBtn) {
      this.quickTimerToggleBtn.textContent = 'Pause Session';
      this.quickTimerToggleBtn.className = 'px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all';
    }

    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (this.catchUpTimer) {
        this.catchUpTimer();
      } else {
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
    }, 500);
    
    if (syncToCloud) {
       this.timerLastUpdatedAt = Date.now();
       if (this.saveState) this.saveState();
    }
  }

  pauseTimer(syncToCloud = true) {
    this.isTimerRunning = false;
    clearInterval(this.timerInterval);
    if (this.releaseWakeLock) this.releaseWakeLock();

    const silentAudio = document.getElementById('silent-audio');
    if (silentAudio) {
      silentAudio.pause();
    }

    this.timerBtnIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    this.timerBtnText.textContent = 'Resume Focus';
    this.btnTimerStartPause.classList.remove('timer-active');
    
    if (this.quickTimerToggleBtn) {
      this.quickTimerToggleBtn.textContent = 'Start Session';
      this.quickTimerToggleBtn.className = 'px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all';
    }
    
    document.title = 'FocusFlow';
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
    
    if (syncToCloud) {
       this.timerLastUpdatedAt = Date.now();
       if (this.saveState) this.saveState();
    }
  }

  resetTimer() {
    this.pauseTimer(false);
    this.timerSeconds = this.timerMode === 'stopwatch' ? 0 : this.pomodoroTargetSeconds;
    this.updateTimerDisplay();
    
    if (this.saveState) this.saveState();
  }

  updateTimerDisplay() {
    const h = Math.floor(this.timerSeconds / 3600);
    const m = Math.floor((this.timerSeconds % 3600) / 60);
    const s = this.timerSeconds % 60;
    
    let formatted = '';
    if (h > 0) {
      formatted = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
      formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    
    this.timerDisplay.textContent = formatted;
    if (this.quickTimerDisplay) this.quickTimerDisplay.textContent = formatted;
    
    if (this.isTimerRunning) {
      document.title = `${formatted} - FocusFlow`;
      
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: formatted,
          artist: this.timerActivityInput ? this.timerActivityInput.value : 'Focusing...',
          album: 'FocusFlow Timer'
        });
        navigator.mediaSession.playbackState = 'playing';
      }
    } else {
      document.title = 'FocusFlow';
    }
  }"""
    
    final_content = content[:start_idx] + new_methods + content[end_idx:]
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(final_content)
    print("Success")
else:
    print("Could not find start/end matches")
