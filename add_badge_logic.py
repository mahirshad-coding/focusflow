with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# 1. Update cacheDom
cache_patch = '''    this.snoozeModal = document.getElementById('snooze-modal');
    this.badgeModal = document.getElementById('badge-modal');
    this.badgeModalIcon = document.getElementById('badge-modal-icon');
    this.badgeModalTitle = document.getElementById('badge-modal-title');
    this.badgeModalStatus = document.getElementById('badge-modal-status');
    this.badgeModalDesc = document.getElementById('badge-modal-desc');'''
content = content.replace("    this.snoozeModal = document.getElementById('snooze-modal');", cache_patch)

# 2. Update renderProfile badgesGrid innerHTML
old_badge_html = '''    this.badgesGrid.innerHTML = badges.map(b => `
      <div class="badge-slot ${b.unlocked ? 'unlocked' : 'locked'}" title="${b.title}: ${b.description}">'''

new_badge_html = '''    this.badgesGrid.innerHTML = badges.map(b => `
      <div class="badge-slot ${b.unlocked ? 'unlocked' : 'locked'}" style="cursor: pointer;" onclick="app.openBadgeModal('${b.id}')">'''
content = content.replace(old_badge_html, new_badge_html)

# 3. Add Modal functions
modal_functions = '''  openBadgeModal(badgeId) {
    if (!this.gamification) return;
    const badges = this.gamification.getBadges();
    const b = badges.find(x => x.id === badgeId);
    if (!b) return;

    this.badgeModalIcon.textContent = b.icon || '🏆';
    this.badgeModalTitle.textContent = b.title;
    this.badgeModalDesc.textContent = b.description;
    
    if (b.unlocked) {
      this.badgeModalStatus.textContent = 'UNLOCKED';
      this.badgeModalStatus.style.backgroundColor = 'rgba(251, 191, 36, 0.2)'; // amber-400 with opacity
      this.badgeModalStatus.style.color = '#fbbf24'; // amber-400
    } else {
      this.badgeModalStatus.textContent = 'LOCKED';
      this.badgeModalStatus.style.backgroundColor = 'rgba(71, 85, 105, 0.2)'; // slate-600 with opacity
      this.badgeModalStatus.style.color = '#94a3b8'; // slate-400
    }

    this.badgeModal.classList.remove('hidden');
  }

  closeBadgeModal() {
    this.badgeModal.classList.add('hidden');
  }

  // --- QUICK ACTION / HOMEPAGE OVERLAY ---'''
content = content.replace('  // --- QUICK ACTION / HOMEPAGE OVERLAY ---', modal_functions)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
