const Tracker = {
  charts: {},
  activeTab: 'running',
  TABS: [
    { id:'running', label:'🏃 Running' },
    { id:'protein', label:'🥩 Protein' },
    { id:'screen',  label:'📵 Screen Time' },
    { id:'habits',  label:'✨ Habits' },
    { id:'workout', label:'💪 Workouts' },
  ],
  init() {
    this.render();
  },
  render() {
    const u = Auth.current(); if (!u) return;
    const hist = Storage.getHistory(u.username);
    const el = document.getElementById('tracker-content');
    el.innerHTML = `
      <div class="tracker-tabs">${this.TABS.map(t=>`
        <button class="tracker-tab${t.id===this.activeTab?' tab-active':''}" onclick="Tracker.switchTab('${t.id}')">${t.label}</button>`).join('')}
      </div>
      <div id="tracker-panel" class="tracker-panel"></div>`;
    this.renderPanel(hist);
  },
  switchTab(id) {
    this.activeTab = id;
    Object.values(this.charts).forEach(c => c.destroy?.());
    this.charts = {};
    this.render();
  },
  renderPanel(hist) {
    const panel = document.getElementById('tracker-panel');
    switch(this.activeTab) {
      case 'running':  panel.innerHTML = this.runningPanel(hist); this.drawRunning(hist); break;
      case 'protein':  panel.innerHTML = this.proteinPanel(hist); this.drawProtein(hist); break;
      case 'screen':   panel.innerHTML = this.screenPanel(hist);  this.drawScreen(hist);  break;
      case 'habits':   panel.innerHTML = this.habitsPanel(hist);  break;
      case 'workout':  panel.innerHTML = this.workoutPanel(hist); break;
    }
  },
  last7() { return Array.from({length:7},(_,i)=>dateStr(i-6)); },
  getByTask(hist, task) {
    const dates = this.last7();
    return dates.map(d => hist.find(h=>h.task===task&&h.date===d)||null);
  },
  runningPanel(hist) {
    const data = this.getByTask(hist,'running');
    const totalKm = data.reduce((a,d)=>a+(d?.data?.km||0),0).toFixed(1);
    const runs = data.filter(Boolean).length;
    return `
      <div class="stat-cards">
        <div class="stat-card"><div class="stat-val">${totalKm}<span class="stat-unit">km</span></div><div class="stat-lbl">Last 7 Days</div></div>
        <div class="stat-card"><div class="stat-val">${runs}</div><div class="stat-lbl">Sessions</div></div>
        <div class="stat-card"><div class="stat-val">${runs?Math.round(data.filter(Boolean).reduce((a,d)=>a+(d?.data?.minutes||0),0)/runs):0}<span class="stat-unit">min</span></div><div class="stat-lbl">Avg Duration</div></div>
      </div>
      <div class="chart-wrap"><canvas id="chart-running"></canvas></div>
      <div class="hist-list"><h4 class="hist-title">SESSION HISTORY</h4>
        ${data.filter(Boolean).reverse().map(d=>`
          <div class="hist-row"><span class="hist-date">${d.date}</span><span class="hist-val">${d.data.km||0} km</span><span class="hist-val">${d.data.minutes||0} min</span><span class="hist-note">${d.data.notes||''}</span></div>`).join('')||'<div class="no-data">No running sessions logged yet.</div>'}
      </div>`;
  },
  drawRunning(hist) {
    const dates = this.last7();
    const byDate = dates.map(d => { const h=hist.find(x=>x.task==='running'&&x.date===d); return h?h.data.km||0:0; });
    const ctx = document.getElementById('chart-running')?.getContext('2d');
    if (!ctx) return;
    this.charts.running = new Chart(ctx, {
      type:'bar',
      data:{ labels:dates.map(d=>d.slice(5)), datasets:[{ label:'Distance (km)', data:byDate, backgroundColor:'rgba(0,212,255,0.3)', borderColor:'#00D4FF', borderWidth:2, borderRadius:4 }] },
      options:{ responsive:true, plugins:{ legend:{labels:{color:'#a0a0e0'}}}, scales:{ x:{ticks:{color:'#6060a0'},grid:{color:'rgba(255,255,255,0.05)'}}, y:{ticks:{color:'#6060a0'},grid:{color:'rgba(255,255,255,0.05)'},beginAtZero:true} } }
    });
  },
  proteinPanel(hist) {
    const data = this.getByTask(hist,'protein');
    const avg = data.filter(Boolean).length ? Math.round(data.filter(Boolean).reduce((a,d)=>a+(d?.data?.grams||0),0)/data.filter(Boolean).length) : 0;
    return `
      <div class="stat-cards">
        <div class="stat-card"><div class="stat-val">${avg}<span class="stat-unit">g</span></div><div class="stat-lbl">Daily Avg</div></div>
        <div class="stat-card"><div class="stat-val">${data.filter(d=>d&&d.data.grams>=150).length}</div><div class="stat-lbl">Days Hit Goal</div></div>
        <div class="stat-card"><div class="stat-val">${data.filter(Boolean).length}</div><div class="stat-lbl">Days Tracked</div></div>
      </div>
      <div class="chart-wrap"><canvas id="chart-protein"></canvas></div>`;
  },
  drawProtein(hist) {
    const dates = this.last7();
    const byDate = dates.map(d => { const h=hist.find(x=>x.task==='protein'&&x.date===d); return h?h.data.grams||0:0; });
    const ctx = document.getElementById('chart-protein')?.getContext('2d');
    if (!ctx) return;
    this.charts.protein = new Chart(ctx, {
      type:'bar',
      data:{ labels:dates.map(d=>d.slice(5)), datasets:[
        { label:'Protein (g)', data:byDate, backgroundColor:'rgba(123,47,190,0.4)', borderColor:'#7B2FBE', borderWidth:2, borderRadius:4 },
        { label:'Goal (150g)', data:Array(7).fill(150), type:'line', borderColor:'#FFD700', borderDash:[5,5], borderWidth:1.5, pointRadius:0, fill:false }
      ]},
      options:{ responsive:true, plugins:{ legend:{labels:{color:'#a0a0e0'}}}, scales:{ x:{ticks:{color:'#6060a0'},grid:{color:'rgba(255,255,255,0.05)'}}, y:{ticks:{color:'#6060a0'},grid:{color:'rgba(255,255,255,0.05)'},beginAtZero:true} } }
    });
  },
  screenPanel(hist) {
    const data = this.getByTask(hist,'screen');
    const underBudget = data.filter(d=>d&&d.data.actual<=d.data.target).length;
    return `
      <div class="stat-cards">
        <div class="stat-card"><div class="stat-val">${underBudget}</div><div class="stat-lbl">Days Under Budget</div></div>
        <div class="stat-card"><div class="stat-val">${data.filter(Boolean).length-underBudget}</div><div class="stat-lbl">Days Over Budget</div></div>
        <div class="stat-card"><div class="stat-val">${data.filter(Boolean).length?((data.filter(Boolean).reduce((a,d)=>a+(d?.data?.actual||0),0)/data.filter(Boolean).length).toFixed(1)):'—'}<span class="stat-unit">hrs</span></div><div class="stat-lbl">Avg Screen Time</div></div>
      </div>
      <div class="chart-wrap"><canvas id="chart-screen"></canvas></div>`;
  },
  drawScreen(hist) {
    const dates = this.last7();
    const actuals = dates.map(d => { const h=hist.find(x=>x.task==='screen'&&x.date===d); return h?h.data.actual||0:0; });
    const targets = dates.map(d => { const h=hist.find(x=>x.task==='screen'&&x.date===d); return h?h.data.target||2:2; });
    const ctx = document.getElementById('chart-screen')?.getContext('2d');
    if (!ctx) return;
    this.charts.screen = new Chart(ctx, {
      type:'bar',
      data:{ labels:dates.map(d=>d.slice(5)), datasets:[
        { label:'Actual (hrs)', data:actuals, backgroundColor:actuals.map((a,i)=>a>targets[i]?'rgba(255,68,68,0.4)':'rgba(0,255,136,0.3)'), borderColor:actuals.map((a,i)=>a>targets[i]?'#ff4444':'#00ff88'), borderWidth:2, borderRadius:4 },
        { label:'Target (hrs)', data:targets, type:'line', borderColor:'#FFD700', borderDash:[5,5], borderWidth:1.5, pointRadius:3, fill:false }
      ]},
      options:{ responsive:true, plugins:{ legend:{labels:{color:'#a0a0e0'}}}, scales:{ x:{ticks:{color:'#6060a0'},grid:{color:'rgba(255,255,255,0.05)'}}, y:{ticks:{color:'#6060a0'},grid:{color:'rgba(255,255,255,0.05)'},beginAtZero:true} } }
    });
  },
  habitsPanel(hist) {
    const habits = ['skincare','haircare','facial'];
    const dates = this.last7();
    return `<div class="habits-grid">
      ${habits.map(h => {
        const data = dates.map(d => hist.find(x=>x.task===h&&x.date===d));
        const streak = this.calcStreak(data);
        const label = h.charAt(0).toUpperCase()+h.slice(1);
        return `<div class="habit-card">
          <div class="habit-header"><span class="habit-name">${label}</span><span class="habit-streak">${streak} day streak 🔥</span></div>
          <div class="habit-dots">${dates.map((d,i)=>`<div class="habit-dot${data[i]?' dot-done':''}" title="${d}"></div>`).join('')}</div>
          <div class="habit-labels">${dates.map(d=>`<span>${d.slice(5)}</span>`).join('')}</div>
        </div>`;
      }).join('')}
    </div>`;
  },
  calcStreak(data) {
    let streak=0;
    for (let i=data.length-1;i>=0;i--) { if (data[i]) streak++; else break; }
    return streak;
  },
  workoutPanel(hist) {
    const data = this.getByTask(hist,'workout');
    const sessions = data.filter(Boolean);
    return `
      <div class="stat-cards">
        <div class="stat-card"><div class="stat-val">${sessions.length}</div><div class="stat-lbl">Sessions (7d)</div></div>
        <div class="stat-card"><div class="stat-val">${sessions.length?Math.round(sessions.reduce((a,d)=>a+(d?.data?.duration||0),0)/sessions.length):0}<span class="stat-unit">min</span></div><div class="stat-lbl">Avg Duration</div></div>
      </div>
      <div class="hist-list"><h4 class="hist-title">WORKOUT LOG</h4>
        ${sessions.reverse().map(d=>`
          <div class="hist-row"><span class="hist-date">${d.date}</span><span class="hist-val">${d.data.type||'—'}</span><span class="hist-val">${d.data.duration||0} min</span></div>`).join('')||'<div class="no-data">No workouts logged yet.</div>'}
      </div>`;
  }
};
