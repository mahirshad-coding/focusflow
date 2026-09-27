with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

badge_modal = '''  <!--
    BADGE MODAL
  -->
  <div id="badge-modal" class="modal-overlay hidden" style="z-index: 100;">
    <div class="modal-content" style="max-width: 320px; width: 90%; text-align: center; border: 1px solid var(--border);">
      <div id="badge-modal-icon" style="font-size: 4rem; margin-bottom: 16px; line-height: 1;">🏆</div>
      <h2 id="badge-modal-title" style="font-size: 1.25rem; font-weight: bold; color: var(--text-1); margin-bottom: 8px;">Badge Title</h2>
      <div id="badge-modal-status" style="font-size: 0.75rem; font-weight: 800; letter-spacing: 0.05em; margin-bottom: 16px; padding: 4px 12px; border-radius: 9999px; display: inline-block;">UNLOCKED</div>
      <p id="badge-modal-desc" style="font-size: 0.875rem; color: var(--text-2); margin-bottom: 24px; line-height: 1.4;">Description goes here.</p>
      <button type="button" class="btn-primary" style="width: 100%;" onclick="app.closeBadgeModal()">Awesome</button>
    </div>
  </div>

'''

content = content.replace('  <!--\n    SNOOZE MODAL', badge_modal + '  <!--\n    SNOOZE MODAL')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
