with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Inline notes
old_meta_row = '''          <div class="task-meta-row">
            ${timeStr}
            <span class="task-est"> ${estStr}</span>
            ${(task.actualMinutes || 0) > 0 ? `<span class="task-est" style="color:#818cf8">(${task.actualMinutes}m logged)</span>` : ''}
            ${tagsHtml}
          </div>
        </div>'''
        
new_meta_row = '''          <div class="task-meta-row">
            ${timeStr}
            <span class="task-est"> ${estStr}</span>
            ${(task.actualMinutes || 0) > 0 ? `<span class="task-est" style="color:#818cf8">(${task.actualMinutes}m logged)</span>` : ''}
            ${tagsHtml}
          </div>
          ${hasNotes ? `<div style="font-size: 12px; color: var(--text-2); margin-top: 6px; padding-left: 8px; border-left: 2px solid var(--border); font-style: italic;">${this.escapeHtml(task.notes).replace(/\\n/g, '<br>')}</div>` : ''}
        </div>'''

content = content.replace(old_meta_row, new_meta_row)

# Fix timer background sync logic
old_start = '''  startTimer() {
    this.isTimerRunning = true;
    this.sound.playChime('timer-start');'''

new_start = '''  startTimer(syncToCloud = true) {
    this.isTimerRunning = true;
    
    // Play silent audio to hijack MediaSession and keep notification active on mobile
    const silentAudio = document.getElementById('silent-audio');
    if (silentAudio) {
      silentAudio.play().catch(e => console.warn('Audio play failed:', e));
    }
    
    this.sound.playChime('timer-start');'''

content = content.replace(old_start, new_start)

old_start_end = '''    }, 500); // Check more frequently to keep accurate time across background throttling
  }'''

new_start_end = '''    }, 500); // Check more frequently to keep accurate time across background throttling
    
    if (syncToCloud) {
       this.timerLastUpdatedAt = Date.now();
       if (this.saveState) this.saveState(); // Trigger cloud sync
    }
  }'''

content = content.replace(old_start_end, new_start_end)

old_pause = '''  pauseTimer() {
    this.isTimerRunning = false;
    clearInterval(this.timerInterval);'''

new_pause = '''  pauseTimer(syncToCloud = true) {
    this.isTimerRunning = false;
    clearInterval(this.timerInterval);
    
    const silentAudio = document.getElementById('silent-audio');
    if (silentAudio) {
      silentAudio.pause();
    }
'''

content = content.replace(old_pause, new_pause)

old_pause_end = '''    document.title = 'FocusFlow'; // Reset tab title
  }'''

new_pause_end = '''    document.title = 'FocusFlow'; // Reset tab title
    
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
    
    if (syncToCloud) {
       this.timerLastUpdatedAt = Date.now();
       if (this.saveState) this.saveState(); // Trigger cloud sync
    }
  }'''

content = content.replace(old_pause_end, new_pause_end)

old_update = '''    if (this.isTimerRunning) {
      document.title = `${formatted} - FocusFlow`;
    } else {
      document.title = 'FocusFlow';
    }
  }'''

new_update = '''    if (this.isTimerRunning) {
      document.title = `${formatted} - FocusFlow`;
      
      // Update lock-screen notification via MediaSession
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
  }'''

content = content.replace(old_update, new_update)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
