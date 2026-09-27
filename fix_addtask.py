with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add to cacheDom
content = content.replace(
    "this.taskScheduledTime = document.getElementById('task-scheduled-time');",
    "this.taskScheduledTime = document.getElementById('task-scheduled-time');\n    this.taskScheduledDate = document.getElementById('task-scheduled-date');"
)

# Update day navigator so the default date sets the input
old_nav = '''  renderDayNavigator() {
    const d = new Date(this.selectedDate + 'T00:00:00');'''

new_nav = '''  renderDayNavigator() {
    const d = new Date(this.selectedDate + 'T00:00:00');
    if (this.taskScheduledDate) {
      this.taskScheduledDate.value = this.selectedDate;
    }'''

content = content.replace(old_nav, new_nav)

# Update handleAddTask
old_handle_add = '''  handleAddTask(e) {
    if (e) e.preventDefault();
    const title = this.taskTitleInput.value.trim();
    if (!title) return;

    let estHrs = parseFloat(this.taskEstHoursInput.value) || 0;
    let estMins = parseFloat(this.taskEstMinsInput.value) || 0;
    
    // Bounds
    if (estHrs < 0) estHrs = 0;
    if (estMins < 0) estMins = 0;
    
    let totalMins = Math.round((estHrs * 60) + estMins);
    if (totalMins <= 0) {
      totalMins = 60; // default 1 hour if left empty/zero
    }

    const scheduledTime = this.taskScheduledTime ? this.taskScheduledTime.value : '';

    const newTask = {
      id: 'task_' + Date.now(),
      title,
      estMinutes: totalMins,
      isCompleted: false,
      date: this.selectedDate,
      order: Date.now(), // timestamp for sorting (newer first)
      scheduledTime: scheduledTime,
      notifiedOnTime: false,
      notified5Min: false,
      notified20Min: false,
      stopReminding: false
    };'''

new_handle_add = '''  handleAddTask(e) {
    if (e) e.preventDefault();
    const title = this.taskTitleInput.value.trim();
    if (!title) return;

    let estHrs = parseFloat(this.taskEstHoursInput.value) || 0;
    let estMins = parseFloat(this.taskEstMinsInput.value) || 0;
    
    // Bounds
    if (estHrs < 0) estHrs = 0;
    if (estMins < 0) estMins = 0;
    
    let totalMins = Math.round((estHrs * 60) + estMins);
    if (totalMins <= 0) {
      totalMins = 60; // default 1 hour if left empty/zero
    }

    const scheduledTime = this.taskScheduledTime ? this.taskScheduledTime.value : '';
    
    // Sarcastic prompt if time is omitted
    if (!scheduledTime && this.taskScheduledTime) {
       const wantsTime = confirm("You didn't set a time. You want to set a time now or what? 🙄\\n(Click OK to set a time, or Cancel to just add it anyway)");
       if (wantsTime) {
           this.taskScheduledTime.focus();
           return; // Abort adding, wait for user
       }
    }

    const targetDateStr = (this.taskScheduledDate && this.taskScheduledDate.value) ? this.taskScheduledDate.value : this.selectedDate;

    // Gamification: Future scheduling check
    const today = new Date();
    const targetDate = new Date(targetDateStr + 'T00:00:00');
    // Calculate difference in days (ignoring time of day)
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.round((targetDate - todayMidnight) / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 2) {
       this.gamification.data.futureScheduling = (this.gamification.data.futureScheduling || 0) + 1;
       this.evaluateGamification();
    }

    const newTask = {
      id: 'task_' + Date.now(),
      title,
      estMinutes: totalMins,
      isCompleted: false,
      date: targetDateStr,
      order: Date.now(), // timestamp for sorting (newer first)
      scheduledTime: scheduledTime,
      notifiedOnTime: false,
      notified5Min: false,
      notified20Min: false,
      stopReminding: false
    };'''

content = content.replace(old_handle_add, new_handle_add)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
