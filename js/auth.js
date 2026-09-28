const Auth = {
  hash(pw) {
    let s = 0;
    const str = pw + ':slsalt2024';
    for (let i = 0; i < str.length; i++) s = ((s << 5) - s) + str.charCodeAt(i), s |= 0;
    return btoa(String(s));
  },
  register(username, password, displayName) {
    username = username.trim().toLowerCase();
    if (!username || username.length < 3) return { ok: false, err: 'Username must be at least 3 characters.' };
    if (!/^[a-z0-9_]+$/.test(username)) return { ok: false, err: 'Username: letters, numbers, underscores only.' };
    if (!password || password.length < 4) return { ok: false, err: 'Password must be at least 4 characters.' };
    const users = Storage.getUsers();
    if (users[username]) return { ok: false, err: 'This hunter ID is already taken.' };
    users[username] = { pw: this.hash(password), displayName: displayName || username, joined: Date.now() };
    Storage.saveUsers(users);
    Storage.setSession(username);
    return { ok: true };
  },
  login(username, password) {
    username = username.trim().toLowerCase();
    const users = Storage.getUsers();
    if (!users[username]) return { ok: false, err: 'Hunter not found in the System.' };
    if (users[username].pw !== this.hash(password)) return { ok: false, err: 'Wrong password, hunter.' };
    Storage.setSession(username);
    return { ok: true };
  },
  logout() { Storage.clearSession(); },
  current() {
    const s = Storage.getSession();
    if (!s) return null;
    const users = Storage.getUsers();
    if (!users[s.username]) return null;
    return { ...users[s.username], username: s.username };
  },
  isLoggedIn() { return !!this.current(); },
  updateDisplay(username, displayName) {
    const users = Storage.getUsers();
    if (users[username]) { users[username].displayName = displayName; Storage.saveUsers(users); }
  },
  changePassword(username, oldPw, newPw) {
    const users = Storage.getUsers();
    if (!users[username] || users[username].pw !== this.hash(oldPw)) return { ok: false, err: 'Current password is incorrect.' };
    if (!newPw || newPw.length < 4) return { ok: false, err: 'New password must be 4+ characters.' };
    users[username].pw = this.hash(newPw);
    Storage.saveUsers(users);
    return { ok: true };
  }
};
