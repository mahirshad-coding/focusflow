with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_meta = '''            <div class="task-meta">
              <input type="time" id="task-scheduled-time" class="input-mini mono" title="Scheduled Time" style="padding-left:4px; padding-right:4px;">'''

new_meta = '''            <div class="task-meta">
              <input type="date" id="task-scheduled-date" class="input-mini mono" title="Scheduled Date" style="padding-left:4px; padding-right:4px;">
              <input type="time" id="task-scheduled-time" class="input-mini mono" title="Scheduled Time" style="padding-left:4px; padding-right:4px;">'''

content = content.replace(old_meta, new_meta)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
