with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_set_timer = '''  setTimerForTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && this.timerActivityInput) {
      this.timerActivityInput.value = task.title;
    }
    if (!this.isTimerRunning) {
      this.startTimer();
    }
  }'''

new_set_timer = '''  setTimerForTask(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task && this.timerActivityInput) {
      this.timerActivityInput.value = task.title;
      
      // Check Punctual Panda
      if (task.scheduledTime) {
        const now = new Date();
        const [tHrs, tMins] = task.scheduledTime.split(':').map(Number);
        const tDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), tHrs, tMins);
        const diffMs = now - tDate;
        const diffMins = Math.floor(diffMs / 60000);
        
        // If they start between 1 minute early and 2 minutes late
        if (diffMins >= -1 && diffMins <= 2) {
          this.gamification.data.punctualStarts = (this.gamification.data.punctualStarts || 0) + 1;
          this.evaluateGamification();
        }
      }
    }
    
    // Request notification permission if they click start (user gesture)
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (!this.isTimerRunning) {
      this.startTimer();
    }
  }'''

content = content.replace(old_set_timer, new_set_timer)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
