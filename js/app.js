const App = {
  currentPage: 'home',
  notifTimeout: null,

  init() {
    if (Auth.isLoggedIn()) {
      this.showApp();
    } else {
      this.showLogin();
    }
    this.bindLoginEvents();
    this.bindSidebarEvents();
  },

  showLogin() {
    document.getElementById('page-login').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  },

  showApp() {
    document.getElementById('page-login').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    this.updateSidebar();
    this.navigate('home');
  },

  navigate(page) {
    this.currentPage = page;
    document.querySelectorAll('.page-section').forEach(p => p.classList.remove('page-active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('nav-active'));
    const el = document.getElementById('page-' + page);
    if (el) el.classList.add('page-active');
    const nav = document.getElementById('nav-' + page);
    if (nav) nav.classList.add('nav-active');
    switch(page) {
      case 'home':     Tasks.init();    break;
      case 'tracker':  Tracker.init();  break;
      case 'settings': Settings.init(); break;
      case 'faq':      FAQ.init();      break;
    }
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      document.getElementById('sidebar').classList.remove('sidebar-open');
    }
  },

  updateSidebar() {
    const u = Auth.current(); if (!u) return;
    const cfg = Storage.getSettings(u.username);
    const lvl = cfg.level || 1;
    const xp = cfg.xp || 0;
    const nextLvlXP = lvl * 500;
    const currentLvlXP = (lvl - 1) * 500;
    const pct = Math.min(Math.round(((xp - currentLvlXP) / 500) * 100), 100);
    const r = rank(lvl);
    document.getElementById('sb-name').textContent = cfg.displayName || u.username;
    document.getElementById('sb-rank').textContent = 'Rank ' + r;
    document.getElementById('sb-level').textContent = 'Lv.' + lvl;
    document.getElementById('sb-xp-bar').style.width = pct + '%';
    document.getElementById('sb-xp-text').textContent = xp + ' XP';
    const rankEl = document.getElementById('sb-rank-badge');
    if (rankEl) { rankEl.textContent = r; rankEl.className = 'rank-badge rank-' + r.toLowerCase(); }
  },

  bindLoginEvents() {
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(x => x.classList.remove('active-tab'));
      t.classList.add('active-tab');
      document.getElementById('login-form').classList.toggle('hidden', t.dataset.tab !== 'login');
      document.getElementById('register-form').classList.toggle('hidden', t.dataset.tab !== 'register');
    }));

    document.getElementById('btn-login').addEventListener('click', () => {
      const u = document.getElementById('login-user').value.trim();
      const p = document.getElementById('login-pass').value;
      const res = Auth.login(u, p);
      if (!res.ok) { this.showAuthError('login', res.err); return; }
      this.showApp();
    });

    document.getElementById('btn-register').addEventListener('click', () => {
      const u = document.getElementById('reg-user').value.trim();
      const p = document.getElementById('reg-pass').value;
      const d = document.getElementById('reg-name').value.trim();
      const res = Auth.register(u, p, d);
      if (!res.ok) { this.showAuthError('register', res.err); return; }
      this.showApp();
      this.notify('Welcome, Hunter ' + (d||u) + '! Your journey begins.', 'success');
    });

    ['login-user','login-pass','reg-user','reg-pass','reg-name'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('keydown', e => { if (e.key==='Enter') document.getElementById(id.startsWith('login')?'btn-login':'btn-register').click(); });
    });
  },

  showAuthError(form, msg) {
    const el = document.getElementById(form + '-error');
    if (el) { el.textContent = msg; el.classList.remove('hidden'); setTimeout(()=>el.classList.add('hidden'), 4000); }
  },

  bindSidebarEvents() {
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('sidebar-open');
    });
    document.getElementById('sidebar-overlay').addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('sidebar-open');
    });
    document.getElementById('btn-logout').addEventListener('click', () => {
      Auth.logout();
      Object.values(Tracker.charts||{}).forEach(c=>c.destroy?.());
      Tracker.charts = {};
      this.showLogin();
    });
  },

  notify(msg, type = 'info') {
    clearTimeout(this.notifTimeout);
    const el = document.getElementById('sys-notify');
    el.textContent = msg;
    el.className = 'sys-notify notify-' + type + ' notify-show';
    this.notifTimeout = setTimeout(() => el.classList.remove('notify-show'), 3500);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
