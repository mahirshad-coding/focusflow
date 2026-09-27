with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace cacheDom
content = content.replace(
    "this.pomodoroCustomTimeInput = document.getElementById('pomodoro-custom-time');",
    "this.pomodoroCustomHrs = document.getElementById('pomodoro-custom-hrs');\n    this.pomodoroCustomMins = document.getElementById('pomodoro-custom-mins');"
)

# Replace bindEvents
old_bind = '''    if (this.pomodoroCustomTimeInput) {
      // Set initial value from settings
      this.pomodoroCustomTimeInput.value = this.settings.pomodoroDuration || 25;
      
      this.pomodoroCustomTimeInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) val = 25;
        if (val > 300) val = 300;
        e.target.value = val;
        
        this.settings.pomodoroDuration = val;
        this.pomodoroTargetSeconds = val * 60;
        this.saveState();
        
        if (this.timerMode === 'pomodoro' && !this.isTimerRunning) {
          this.timerSeconds = this.pomodoroTargetSeconds;
          this.updateTimerDisplay();
        }
      });
    }'''

new_bind = '''    if (this.pomodoroCustomHrs && this.pomodoroCustomMins) {
      const duration = this.settings.pomodoroDuration || 25;
      this.pomodoroCustomHrs.value = Math.floor(duration / 60);
      this.pomodoroCustomMins.value = duration % 60;
      
      const updatePomo = () => {
        let h = parseInt(this.pomodoroCustomHrs.value) || 0;
        let m = parseInt(this.pomodoroCustomMins.value) || 0;
        
        if (h < 0) h = 0; if (h > 12) h = 12;
        if (m < 0) m = 0; if (m > 59) m = 59;
        if (h === 0 && m === 0) m = 1;
        
        this.pomodoroCustomHrs.value = h;
        this.pomodoroCustomMins.value = m;
        
        const totalMins = (h * 60) + m;
        this.settings.pomodoroDuration = totalMins;
        this.pomodoroTargetSeconds = totalMins * 60;
        this.saveState();
        
        if (this.timerMode === 'pomodoro' && !this.isTimerRunning) {
          this.timerSeconds = this.pomodoroTargetSeconds;
          this.updateTimerDisplay();
        }
      };

      this.pomodoroCustomHrs.addEventListener('change', updatePomo);
      this.pomodoroCustomMins.addEventListener('change', updatePomo);
    }'''

content = content.replace(old_bind, new_bind)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
