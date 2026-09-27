with open('firebaseSetup.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_str = "if (window.app.pomodoroCustomTimeInput) window.app.pomodoroCustomTimeInput.value = window.app.settings.pomodoroDuration;"
new_str = '''if (window.app.pomodoroCustomHrs) window.app.pomodoroCustomHrs.value = Math.floor(window.app.settings.pomodoroDuration / 60);
              if (window.app.pomodoroCustomMins) window.app.pomodoroCustomMins.value = window.app.settings.pomodoroDuration % 60;'''

content = content.replace(old_str, new_str)

with open('firebaseSetup.js', 'w', encoding='utf-8') as f:
    f.write(content)
