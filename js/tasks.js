const Tasks = {
  DEFS: [
    { id:'time',     icon:'⏰', title:'Time Management',      xp:50,  type:'time',    desc:'Lock in your 7:00 AM – 11:00 AM power block' },
    { id:'learning', icon:'📚', title:'Learning Goals',        xp:75,  type:'text',    desc:'Define and pursue today\'s learning objective' },
    { id:'workout',  icon:'💪', title:'Workout Tracker',       xp:100, type:'workout', desc:'Log your weekly training session' },
    { id:'skincare', icon:'✨', title:'Daily Skincare',         xp:30,  type:'check',   desc:'Complete your full skincare routine' },
    { id:'facial',   icon:'🔥', title:'Daily Facial Exercise', xp:30,  type:'reps',    desc:'Facial exercises for definition & jawline' },
    { id:'haircare', icon:'💫', title:'Haircare',               xp:30,  type:'check',   desc:'Complete your haircare routine' },
    { id:'running',  icon:'🏃', title:'Running',                xp:80,  type:'running', desc:'Boost testosterone with daily cardio' },
    { id:'protein',  icon:'🥩', title:'Protein Intake',         xp:60,  type:'protein', desc:'Track protein consumption for muscle gain' },
    { id:'screen',   icon:'📵', title:'Reduce Screen Time',     xp:60,  type:'screen',  desc:'Control digital consumption for peak focus' },
  ],
  repsVal: 0,
  init() { this.render(); },
  render() {
    const u = Auth.current(); if (!u) return;
    const saved = Storage.getTasks(u.username, todayStr());
    this.repsVal = (saved.facial && saved.facial.reps) || 0;
    const total = this.DEFS.reduce((a,t) => a + t.xp, 0);
    const earned = this.DEFS.reduce((a,t) => a + (saved[t.id]&&saved[t.id].done ? t.xp : 0), 0);
    const pct = Math.round((earned/total)*100);
    const completed = this.DEFS.filter(t => saved[t.id]&&saved[t.id].done).length;
    document.getElementById('daily-xp').textContent = earned + ' / ' + total + ' XP';
    document.getElementById('daily-progress').style.width = pct + '%';
    document.getElementById('daily-pct').textContent = pct + '%';
    document.getElementById('completed-count').textContent = completed + ' / ' + this.DEFS.length;
    const c = document.getElementById('tasks-container');
    c.innerHTML = this.DEFS.map(t => this.card(t, saved[t.id]||{})).join('');
    this.bindEvents();
  },
  card(t, d) {
    const done = !!d.done;
    return `<div class="quest-card${done?' quest-done':''}" id="qcard-${t.id}">
      <div class="quest-top">
        <div class="quest-badge-wrap"><span class="quest-badge">DAILY QUEST</span></div>
        <div class="quest-xp-badge${done?' xp-earned':''}">+${t.xp} XP</div>
      </div>
      <div class="quest-header-row">
        <div class="quest-icon-big">${t.icon}</div>
        <div class="quest-title-wrap">
          <h3 class="quest-title">${t.title}</h3>
          <p class="quest-desc">${t.desc}</p>
        </div>
        ${done ? '<div class="quest-done-badge">✓ COMPLETE</div>' : ''}
      </div>
      <div class="quest-input-area">${this.input(t, d)}</div>
    </div>`;
  },
  input(t, d) {
    const done = !!d.done;
    const dis = done ? 'disabled' : '';
    switch(t.type) {
      case 'time': return `
        <div class="sys-field"><label class="sys-label">POWER BLOCK</label>
          <div class="time-block-display"><span class="time-glow">07:00 AM</span><span class="time-sep">——</span><span class="time-glow">11:00 AM</span></div>
        </div>
        <div class="sys-field"><label class="sys-label">SESSION NOTES</label>
          <input type="text" class="sys-input" id="inp-time-notes" placeholder="What will you accomplish?" value="${d.notes||''}" ${dis}>
        </div>
        <button class="btn-quest${done?' btn-done':''}" onclick="Tasks.complete('time')" ${dis}>${done?'✓ CONFIRMED':'CONFIRM BLOCK'}</button>`;

      case 'text': return `
        <div class="sys-field"><label class="sys-label">TODAY'S OBJECTIVE</label>
          <input type="text" class="sys-input" id="inp-learning-goal" placeholder="e.g. Read 30 pages of Clean Code" value="${d.goal||''}" ${dis}>
        </div>
        <div class="sys-field check-row">
          <label class="check-label"><input type="checkbox" class="sys-check" id="inp-learning-done" ${d.goalDone?'checked':''} ${dis}><span class="check-text">Goal achieved today</span></label>
        </div>
        <button class="btn-quest${done?' btn-done':''}" onclick="Tasks.complete('learning')" ${dis}>${done?'✓ LOGGED':'LOG GOAL'}</button>`;

      case 'workout':
        const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        const todayIdx=[6,0,1,2,3,4,5][new Date().getDay()];
        return `
        <div class="sys-field"><label class="sys-label">WEEKLY GRID</label>
          <div class="week-grid">${days.map((day,i)=>`
            <div class="day-slot${i===todayIdx?' day-today':''} ${d.days&&d.days[day]?' day-logged':''}" title="${day}: ${d.days&&d.days[day]?d.days[day]:'Not logged'}">
              <span class="day-lbl">${day}</span>
              <span class="day-status">${d.days&&d.days[day]?'✓':'—'}</span>
            </div>`).join('')}
          </div>
        </div>
        <div class="dual-input">
          <div class="sys-field"><label class="sys-label">TYPE</label><input type="text" class="sys-input" id="inp-workout-type" placeholder="Push / Pull / Legs / etc." value="${d.type||''}" ${dis}></div>
          <div class="sys-field"><label class="sys-label">DURATION (MIN)</label><input type="number" class="sys-input" id="inp-workout-dur" placeholder="45" min="0" max="300" value="${d.duration||''}" ${dis}></div>
        </div>
        <button class="btn-quest${done?' btn-done':''}" onclick="Tasks.complete('workout')" ${dis}>${done?'✓ LOGGED':'LOG WORKOUT'}</button>`;

      case 'check': return `
        <div class="big-check-wrap">
          <div class="big-check${d.done?' big-check-done':''}" id="bigcheck-${t.id}" onclick="${!done?`Tasks.complete('${t.id}')`:''}" style="${done?'':'cursor:pointer'}">
            <span class="big-check-icon">${d.done?'✓':'◎'}</span>
            <span class="big-check-label">${d.done?'COMPLETED':'TAP TO COMPLETE'}</span>
          </div>
        </div>`;

      case 'reps': return `
        <div class="sys-field"><label class="sys-label">REPS COUNTER</label>
          <div class="reps-row">
            <button class="reps-btn" onclick="Tasks.adjustReps(-5)" ${dis}>−5</button>
            <span class="reps-val" id="reps-display">${d.reps||0}</span>
            <button class="reps-btn" onclick="Tasks.adjustReps(5)" ${dis}>+5</button>
          </div>
          <div class="reps-presets">
            ${[10,20,30,50].map(n=>`<button class="preset-btn" onclick="Tasks.setReps(${n})" ${dis}>${n}</button>`).join('')}
          </div>
        </div>
        <button class="btn-quest${done?' btn-done':''}" onclick="Tasks.complete('facial')" ${dis}>${done?'✓ LOGGED':'LOG REPS'}</button>`;

      case 'running': return `
        <div class="dual-input">
          <div class="sys-field"><label class="sys-label">DISTANCE (KM)</label><input type="number" class="sys-input" step="0.1" min="0" id="inp-run-km" placeholder="5.0" value="${d.km||''}" ${dis}></div>
          <div class="sys-field"><label class="sys-label">TIME (MIN)</label><input type="number" class="sys-input" min="0" id="inp-run-min" placeholder="30" value="${d.minutes||''}" ${dis}></div>
        </div>
        <div class="sys-field"><label class="sys-label">NOTES</label><input type="text" class="sys-input" id="inp-run-notes" placeholder="Route, weather, how you felt..." value="${d.notes||''}" ${dis}></div>
        <button class="btn-quest${done?' btn-done':''}" onclick="Tasks.complete('running')" ${dis}>${done?'✓ LOGGED':'LOG RUN'}</button>`;

      case 'protein':
        const grams = d.grams||0, goal=150, pct=Math.min(Math.round((grams/goal)*100),100);
        return `
        <div class="sys-field"><label class="sys-label">PROTEIN PROGRESS</label>
          <div class="prot-bar-wrap"><div class="prot-bar" style="width:${pct}%"></div></div>
          <div class="prot-stats"><span>${grams}g consumed</span><span>Goal: ${goal}g</span></div>
        </div>
        <div class="dual-input">
          <div class="sys-field"><label class="sys-label">AMOUNT (G)</label><input type="number" class="sys-input" min="0" max="500" id="inp-prot-g" placeholder="150" value="${d.grams||''}" ${dis}></div>
          <div class="sys-field"><label class="sys-label">MEALS</label><input type="text" class="sys-input" id="inp-prot-meals" placeholder="Eggs, Shake, Chicken..." value="${d.meals||''}" ${dis}></div>
        </div>
        <button class="btn-quest${done?' btn-done':''}" onclick="Tasks.complete('protein')" ${dis}>${done?'✓ LOGGED':'LOG INTAKE'}</button>`;

      case 'screen':
        const tgt=d.target||2, act=d.actual||0;
        const underBudget = act>0 && act<=tgt;
        return `
        <div class="dual-input">
          <div class="sys-field"><label class="sys-label">TARGET (HRS)</label><input type="number" class="sys-input" step="0.5" min="0" max="24" id="inp-scr-target" placeholder="2" value="${d.target||2}" ${dis}></div>
          <div class="sys-field"><label class="sys-label">ACTUAL (HRS)</label><input type="number" class="sys-input" step="0.5" min="0" max="24" id="inp-scr-actual" placeholder="1.5" value="${d.actual||''}" ${dis}></div>
        </div>
        ${act>0?`<div class="screen-verdict ${underBudget?'verdict-good':'verdict-bad'}">${underBudget?'✓ Under budget — focus maintained':'⚠ Over budget — recalibrate'}</div>`:''}
        <button class="btn-quest${done?' btn-done':''}" onclick="Tasks.complete('screen')" ${dis}>${done?'✓ LOGGED':'LOG SCREEN TIME'}</button>`;
    }
    return '';
  },
  complete(id) {
    const u = Auth.current(); if (!u) return;
    const today = todayStr();
    const saved = Storage.getTasks(u.username, today);
    if (saved[id]&&saved[id].done) return;
    const t = this.DEFS.find(x=>x.id===id); if (!t) return;
    let data = { done: true };
    let valid = true, errMsg = '';

    if (id==='time') {
      data.notes = (document.getElementById('inp-time-notes')||{}).value||'';
    } else if (id==='learning') {
      const goal = (document.getElementById('inp-learning-goal')||{}).value||'';
      if (!goal.trim()) { valid=false; errMsg='Please enter your learning goal.'; }
      data.goal = goal; data.goalDone = document.getElementById('inp-learning-done')?.checked||false;
    } else if (id==='workout') {
      const type = (document.getElementById('inp-workout-type')||{}).value||'';
      const dur = (document.getElementById('inp-workout-dur')||{}).value||0;
      if (!type.trim()) { valid=false; errMsg='Please enter your workout type.'; }
      const dayNames=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      const todayDay = dayNames[[6,0,1,2,3,4,5][new Date().getDay()]];
      data.type=type; data.duration=+dur;
      data.days = saved.workout?.days||{};
      data.days[todayDay] = type;
    } else if (id==='running') {
      const km = +(document.getElementById('inp-run-km')||{}).value||0;
      const min = +(document.getElementById('inp-run-min')||{}).value||0;
      if (!km) { valid=false; errMsg='Please enter distance.'; }
      data.km=km; data.minutes=min; data.notes=(document.getElementById('inp-run-notes')||{}).value||'';
    } else if (id==='protein') {
      const g = +(document.getElementById('inp-prot-g')||{}).value||0;
      if (!g) { valid=false; errMsg='Please enter protein amount.'; }
      data.grams=g; data.meals=(document.getElementById('inp-prot-meals')||{}).value||'';
    } else if (id==='screen') {
      const tgt = +(document.getElementById('inp-scr-target')||{}).value||2;
      const act = +(document.getElementById('inp-scr-actual')||{}).value||0;
      if (!act) { valid=false; errMsg='Please enter actual screen time.'; }
      data.target=tgt; data.actual=act;
    } else if (id==='facial') {
      if (this.repsVal <= 0) { valid=false; errMsg='Set at least 1 rep.'; }
      data.reps = this.repsVal;
    }

    if (!valid) { App.notify(errMsg, 'error'); return; }

    saved[id] = data;
    if (id==='workout') saved.workout = data;
    Storage.setTasks(u.username, today, saved);
    Storage.addHistory(u.username, { task: id, data, xp: t.xp });
    const cfg = Storage.addXP(u.username, t.xp);
    App.notify(`+${t.xp} XP — ${t.title} complete!`, 'success');
    App.updateSidebar();
    this.render();
  },
  adjustReps(n) {
    this.repsVal = Math.max(0, this.repsVal + n);
    const el = document.getElementById('reps-display');
    if (el) el.textContent = this.repsVal;
  },
  setReps(n) {
    this.repsVal = n;
    const el = document.getElementById('reps-display');
    if (el) el.textContent = n;
  },
  bindEvents() {
    document.querySelectorAll('.sys-input').forEach(inp => {
      inp.addEventListener('input', () => {
        const id = inp.id;
        if (id==='inp-prot-g') {
          const g = +inp.value||0, goal=150, pct=Math.min(Math.round((g/goal)*100),100);
          const bar = inp.closest('.quest-input-area')?.querySelector('.prot-bar');
          if (bar) bar.style.width = pct+'%';
          const stats = inp.closest('.quest-input-area')?.querySelectorAll('.prot-stats span');
          if (stats&&stats[0]) stats[0].textContent = g+'g consumed';
        }
        if (id==='inp-scr-target'||id==='inp-scr-actual') {
          const tgt = +(document.getElementById('inp-scr-target')||{value:2}).value||2;
          const act = +(document.getElementById('inp-scr-actual')||{value:0}).value||0;
          const v = inp.closest('.quest-input-area')?.querySelector('.screen-verdict');
          if (v&&act>0) { v.className='screen-verdict '+(act<=tgt?'verdict-good':'verdict-bad'); v.textContent=act<=tgt?'✓ Under budget — focus maintained':'⚠ Over budget — recalibrate'; }
        }
      });
    });
  }
};
