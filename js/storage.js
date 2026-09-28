const Storage = {
  P: 'sl_',
  get(k) { try { const v = localStorage.getItem(this.P+k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(k, v) { try { localStorage.setItem(this.P+k, JSON.stringify(v)); } catch(e) { console.error('Storage full:', e); } },
  del(k) { localStorage.removeItem(this.P+k); },
  getUsers() { return this.get('users') || {}; },
  saveUsers(u) { this.set('users', u); },
  getSession() { return this.get('session'); },
  setSession(u) { this.set('session', { username: u, loginAt: Date.now() }); },
  clearSession() { this.del('session'); },
  getTasks(u, d) { return this.get(`tasks_${u}_${d}`) || {}; },
  setTasks(u, d, data) { this.set(`tasks_${u}_${d}`, data); },
  getHistory(u) { return this.get(`hist_${u}`) || []; },
  addHistory(u, e) {
    const h = this.getHistory(u);
    const entry = { ...e, ts: Date.now(), date: todayStr() };
    const exists = h.findIndex(x => x.date === entry.date && x.task === entry.task);
    if (exists > -1) h[exists] = entry; else h.unshift(entry);
    if (h.length > 500) h.pop();
    this.set(`hist_${u}`, h);
  },
  getSettings(u) {
    return this.get(`cfg_${u}`) || { displayName: u, accent: 'purple', xp: 0, level: 1, totalDays: 0 };
  },
  saveSettings(u, s) { this.set(`cfg_${u}`, s); },
  addXP(u, xp) {
    const cfg = this.getSettings(u);
    cfg.xp = (cfg.xp || 0) + xp;
    cfg.level = Math.max(1, Math.floor(cfg.xp / 500) + 1);
    this.saveSettings(u, cfg);
    return cfg;
  },
  clearUserData(u) {
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.P + 'tasks_' + u) || k.startsWith(this.P + 'hist_' + u))
      .forEach(k => localStorage.removeItem(k));
  },
  getAllKeys() { return Object.keys(localStorage).filter(k => k.startsWith(this.P)); }
};

function todayStr() { return new Date().toISOString().slice(0,10); }
function dateStr(offset=0) {
  const d = new Date(); d.setDate(d.getDate()+offset);
  return d.toISOString().slice(0,10);
}
function rank(level) {
  if (level >= 50) return 'S';
  if (level >= 30) return 'A';
  if (level >= 20) return 'B';
  if (level >= 10) return 'C';
  if (level >= 5)  return 'D';
  return 'E';
}
