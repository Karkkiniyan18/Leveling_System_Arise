const Settings = {
  init() { this.render(); },
  render() {
    const u = Auth.current(); if (!u) return;
    const cfg = Storage.getSettings(u.username);
    const el = document.getElementById('settings-content');
    el.innerHTML = `
      <div class="settings-section sys-panel">
        <div class="section-title">HUNTER PROFILE</div>
        <div class="sys-field"><label class="sys-label">HUNTER ID</label>
          <input type="text" class="sys-input" value="${u.username}" disabled style="opacity:.5"></div>
        <div class="sys-field"><label class="sys-label">DISPLAY NAME</label>
          <input type="text" class="sys-input" id="cfg-name" value="${cfg.displayName||u.username}" placeholder="Your display name" maxlength="30"></div>
        <button class="btn-quest" onclick="Settings.saveName()">SAVE NAME</button>
      </div>
      <div class="settings-section sys-panel">
        <div class="section-title">CHANGE PASSWORD</div>
        <div class="sys-field"><label class="sys-label">CURRENT PASSWORD</label>
          <input type="password" class="sys-input" id="cfg-old-pw" placeholder="Current password"></div>
        <div class="sys-field"><label class="sys-label">NEW PASSWORD</label>
          <input type="password" class="sys-input" id="cfg-new-pw" placeholder="New password (4+ chars)"></div>
        <button class="btn-quest" onclick="Settings.changePassword()">UPDATE PASSWORD</button>
      </div>
      <div class="settings-section sys-panel">
        <div class="section-title">PROGRESS STATS</div>
        <div class="stats-grid">
          <div class="cfg-stat"><span class="cfg-stat-val">${cfg.level||1}</span><span class="cfg-stat-lbl">Level</span></div>
          <div class="cfg-stat"><span class="cfg-stat-val">${cfg.xp||0}</span><span class="cfg-stat-lbl">Total XP</span></div>
          <div class="cfg-stat"><span class="cfg-stat-val">${rank(cfg.level||1)}</span><span class="cfg-stat-lbl">Rank</span></div>
        </div>
      </div>
      <div class="settings-section sys-panel danger-zone">
        <div class="section-title" style="color:#ff4444">DANGER ZONE</div>
        <p class="danger-desc">These actions are irreversible. Proceed with caution, hunter.</p>
        <button class="btn-danger" onclick="Settings.resetTasks()">RESET TODAY'S TASKS</button>
        <button class="btn-danger" onclick="Settings.clearAllData()">CLEAR ALL DATA</button>
      </div>`;
  },
  saveName() {
    const u = Auth.current(); if (!u) return;
    const name = document.getElementById('cfg-name')?.value?.trim();
    if (!name) { App.notify('Display name cannot be empty.','error'); return; }
    Auth.updateDisplay(u.username, name);
    const cfg = Storage.getSettings(u.username);
    cfg.displayName = name; Storage.saveSettings(u.username, cfg);
    App.notify('Display name updated!', 'success');
    App.updateSidebar();
  },
  changePassword() {
    const u = Auth.current(); if (!u) return;
    const old = document.getElementById('cfg-old-pw')?.value||'';
    const nw = document.getElementById('cfg-new-pw')?.value||'';
    const res = Auth.changePassword(u.username, old, nw);
    if (!res.ok) { App.notify(res.err,'error'); return; }
    App.notify('Password updated successfully!','success');
    document.getElementById('cfg-old-pw').value='';
    document.getElementById('cfg-new-pw').value='';
  },
  resetTasks() {
    if (!confirm('Reset all of today\'s tasks? This cannot be undone.')) return;
    const u = Auth.current(); if (!u) return;
    Storage.setTasks(u.username, todayStr(), {});
    App.notify('Today\'s tasks have been reset.','success');
    if (document.getElementById('page-home').classList.contains('page-active')) Tasks.render();
  },
  clearAllData() {
    if (!confirm('Delete ALL task history and progress? This CANNOT be undone!')) return;
    const u = Auth.current(); if (!u) return;
    Storage.clearUserData(u.username);
    const cfg = Storage.getSettings(u.username);
    cfg.xp=0; cfg.level=1; Storage.saveSettings(u.username, cfg);
    App.notify('All data cleared.','success');
    App.updateSidebar();
  }
};

const FAQ = {
  ITEMS: [
    { q:'What is this app?', a:'A Solo Leveling-themed personal productivity tracker. Complete daily quests to build discipline, track your body, mind, and habits — and level up as a hunter.' },
    { q:'How does XP and leveling work?', a:'Each completed task awards XP. Complete all 9 daily quests for up to 515 XP/day. Every 500 XP = 1 level. Ranks go E → D → C → B → A → S.' },
    { q:'When do tasks reset?', a:'Tasks automatically reset each new day (based on your local date). Your history and XP are permanently saved.' },
    { q:'Is my data private?', a:'All data is stored locally in your browser\'s localStorage. Nothing is sent to any server. Clearing browser data will erase it.' },
    { q:'Can I use this on multiple devices?', a:'Not currently — data is browser-specific. Export/import features may come in a future update.' },
    { q:'What are the workout weekday guidelines?', a:'The workout grid tracks all 7 days. Log your workout type each day. The grid persists across daily resets so you can see your weekly training pattern.' },
    { q:'How does protein tracking work?', a:'Log your total protein intake in grams each day. The goal is 150g/day (adjustable via Settings). The Tracker charts show your trend over 7 days.' },
    { q:'Can I register multiple accounts?', a:'Yes — the login screen has a Register tab. Multiple hunter accounts can be created on the same device. Each has separate data.' },
    { q:'What is the "Reduce Screen Time" quest?', a:'Set a daily screen time target (default 2 hrs) and log your actual usage. The Tracker charts target vs actual so you can identify patterns.' },
    { q:'How do I delete my account?', a:'Go to Settings → Danger Zone → Clear All Data. This removes all your task history and resets XP. To fully delete the account, also clear browser localStorage manually.' },
  ],
  init() { this.render(); },
  render() {
    const el = document.getElementById('faq-content');
    el.innerHTML = `<div class="faq-list">${this.ITEMS.map((item,i)=>`
      <div class="faq-item" id="faq-${i}">
        <button class="faq-q" onclick="FAQ.toggle(${i})">${item.q}<span class="faq-arrow">›</span></button>
        <div class="faq-a" id="faq-ans-${i}">${item.a}</div>
      </div>`).join('')}
    </div>`;
  },
  toggle(i) {
    const ans = document.getElementById(`faq-ans-${i}`);
    const item = document.getElementById(`faq-${i}`);
    const open = item.classList.contains('faq-open');
    document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('faq-open'));
    document.querySelectorAll('.faq-a').forEach(el => el.style.maxHeight='0');
    if (!open) { item.classList.add('faq-open'); ans.style.maxHeight = ans.scrollHeight+'px'; }
  }
};
