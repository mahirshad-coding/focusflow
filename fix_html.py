with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Base64 encoded empty WAV file
silent_audio = '''  <!-- Silent Audio for MediaSession Hack (Mobile Background Notification) -->
  <audio id="silent-audio" src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==" loop playsinline></audio>\n'''

content = content.replace('</body>', silent_audio + '</body>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
