'use strict';
/* Skyway 2071: Jump'n'Run über die Dächer – gegen die Uhr bis zum Feuerwerk um 20:00. */

const LEVEL = {
  end: 6620,
  goal: 6360,
  solids: [
    [-300, 470, 1000], [840, 470, 460], [2040, 470, 560], [3100, 450, 600],
    [3700, 210, 380], [4650, 470, 560], [5520, 470, 1100],
  ],
  plats: [
    { x: 1380, y: 410, w: 150 }, { x: 1600, y: 345, w: 150 }, { x: 1830, y: 410, w: 150 },
    { x: 2640, y: 450, w: 140, mx: [2640, 2860], sp: 0.9 },
    { x: 4200, y: 290, w: 150 }, { x: 4430, y: 370, w: 150 },
    { x: 5240, y: 450, w: 130, mx: [5240, 5380], sp: 1.1 },
  ],
  drones: [
    { x1: 980, x2: 1250, y: 425, sp: 1.1 }, { x1: 2150, x2: 2550, y: 405, sp: 0.9 },
    { x1: 3200, x2: 3500, y: 385, sp: 1.3 }, { x1: 3800, x2: 4040, y: 160, sp: 1.0 },
    { x1: 5650, x2: 6050, y: 425, sp: 1.4 }, { x1: 5900, x2: 6280, y: 395, sp: 0.8 },
  ],
  sparks: [
    [420, 400], [560, 400], [770, 380], [1100, 340], [1455, 350], [1675, 280], [1905, 350], [2300, 330],
    [2750, 380], [2990, 400], [3350, 330], [3800, 90], [3940, 120], [4275, 230], [4505, 310], [4610, 380],
    [4900, 400], [5300, 380], [5450, 400], [5800, 330], [6100, 400],
  ],
  checks: [[60, 470], [2080, 470], [3140, 450], [4700, 470], [5560, 470]],
  pads: [[3560, 450]],
};

class Runner {
  enter() {
    UI.setChapter('ch3');
    UI.showInventory(false);
    $('#touch').hidden = !(matchMedia('(pointer: coarse)').matches || G.touchSeen);
    Music.play('2071');
    G.save('runner');
    this.r = seeded(99);
    this.buildScenery();
    this.reset();
    this.started = false;
    UI.showTimer(true);
    this.updateTimer();
    UI.say([['nova', 'r_intro']]).then(() => {
      UI.toast(T('r_ctrl'), 3200);
      this.started = true;
    });
  }
  exit() { $('#touch').hidden = true; UI.showTimer(false); }
  hint() { return T('h_run'); }
  onLang() { UI.setChapter('ch3'); }
  reset() {
    this.p = { x: 60, y: 470, vx: 0, vy: 0, ground: null, face: 1, coyote: 0, buffer: 0, inv: 0 };
    this.check = LEVEL.checks[0];
    this.cam = 0;
    this.T0 = 80 + (G.bonus || 0);
    this.left = this.T0;
    G.sparks = 0;
    this.sparks = LEVEL.sparks.map(([x, y]) => ({ x, y, got: false }));
    this.plats = LEVEL.plats.map((p) => Object.assign({ dx: 0, ph: 0 }, p));
    this.drones = LEVEL.drones.map((d, i) => Object.assign({ x: d.x1, ph: i * 1.3 }, d));
    this.checksHit = new Set([0]);
    this.parts = [];
    this.floaters = [];
    this.jumpHeld = false;
    this.finished = false;
    this.failed = false;
    this.el = 0;
  }
  buildScenery() {
    const r = this.r;
    this.stars = [];
    for (let i = 0; i < 110; i++) this.stars.push({ x: r() * W, y: r() * 300, r: r() < 0.15 ? 2 : 1, a: 0.3 + r() * 0.7, sp: 1 + r() * 3 });
    const mk = (factor, hmin, hmax, body, lit) => {
      const arr = []; const shapes = ['rect', 'spire', 'sail', 'step', 'twist', 'rect'];
      for (let x = -100, i = 0; x < LEVEL.end * factor + W + 100; i++) {
        const w = 50 + r() * 80;
        arr.push({ x, w, h: hmin + r() * (hmax - hmin), o: { shape: shapes[Math.floor(r() * shapes.length)], body, windows: 'rgba(255,214,150,0.8)', accent: '#ff7ad9', lit, seed: i * 7 + 3, edge: r() < 0.35 ? (r() < 0.5 ? 'rgba(95,242,255,0.6)' : 'rgba(255,120,220,0.6)') : null, beacon: r() < 0.5, stripe: r() < 0.2 ? 'rgba(95,242,255,0.45)' : null } });
        x += w * (0.7 + r() * 0.6);
      }
      return arr;
    };
    this.far = mk(0.12, 180, 420, '#1a1438', 0.14);
    this.mid = mk(0.35, 120, 300, '#231a48', 0.2);
    this.roofProps = LEVEL.solids.map((s, i) => {
      const rr = seeded(500 + i), props = [];
      for (let x = s[0] + 40; x < s[0] + s[2] - 40; x += 70 + rr() * 90) props.push({ x, kind: Math.floor(rr() * 4), s: 0.7 + rr() * 0.5 });
      return props;
    });
  }
  /* ---------- Logik ---------- */
  update(dt) {
    if (!this.started || this.finished || this.failed) { this.updateParts(dt); return; }
    this.el += dt;
    const p = this.p, k = Engine.keys;
    // Uhr
    this.left -= dt;
    if (this.left <= 0) { this.left = 0; this.updateTimer(); return this.late(); }
    this.updateTimer();

    // bewegte Plattformen
    for (const pl of this.plats) {
      pl.ph += dt * pl.sp;
      const old = pl.x;
      if (pl.mx) pl.x = lerp(pl.mx[0], pl.mx[1], 0.5 - 0.5 * Math.cos(pl.ph));
      pl.dx = pl.x - old;
    }
    if (p.ground && p.ground.dx) p.x += p.ground.dx;

    // Eingabe
    let dir = 0;
    if (k.ArrowLeft || k.KeyA || k.TouchLeft) dir -= 1;
    if (k.ArrowRight || k.KeyD || k.TouchRight) dir += 1;
    const jumpNow = !!(k.Space || k.ArrowUp || k.KeyW || k.TouchJump);
    if (jumpNow && !this.jumpHeld) p.buffer = 0.14;
    if (!jumpNow && this.jumpHeld && p.vy < -540) p.vy = -540;
    this.jumpHeld = jumpNow;

    const target = dir * 270;
    p.vx = lerp(p.vx, target, Math.min(1, dt * (p.ground ? 14 : 7)));
    if (dir) p.face = dir;

    p.coyote = p.ground ? 0.1 : p.coyote - dt;
    p.buffer -= dt;
    if (p.buffer > 0 && p.coyote > 0) {
      p.vy = -730; p.ground = null; p.coyote = 0; p.buffer = 0;
      Sfx.jump();
    }

    // Physik
    p.vy = Math.min(p.vy + 1850 * dt, 1100);
    const prevY = p.y;
    p.x += p.vx * dt;
    // seitliche Kollision mit Dächern
    for (const [sx, sy, sw] of LEVEL.solids) {
      if (p.y > sy + 3 && p.y - 88 < H + 200 && p.x + 14 > sx && p.x - 14 < sx + sw) {
        if (p.x < sx + sw / 2) p.x = sx - 14; else p.x = sx + sw + 14;
        p.vx = 0;
      }
    }
    p.x = Math.max(p.x, -60);
    p.y += p.vy * dt;
    const wasGround = !!p.ground;
    p.ground = null;
    if (p.vy >= 0) {
      const tops = LEVEL.solids.map(([sx, sy, sw]) => ({ x: sx, y: sy, w: sw, dx: 0 })).concat(this.plats);
      for (const s of tops) {
        if (prevY <= s.y + 1 && p.y >= s.y && p.x + 12 > s.x && p.x - 12 < s.x + s.w) {
          p.y = s.y; p.vy = 0; p.ground = s;
          if (!wasGround) Sfx.land();
          break;
        }
      }
    }
    // Sprungfeld
    for (const [px, py] of LEVEL.pads) {
      if (p.ground && Math.abs(p.x - px) < 34 && Math.abs(p.y - py) < 2) {
        p.vy = -1120; p.ground = null; p.coyote = 0;
        Sfx.tone(300, 0.4, 'square', 0.06, 900);
        this.burst(px, py, '#5ff2ff', 16);
      }
    }
    // Abgestürzt
    if (p.y > H + 120) {
      this.penalty(5, 'r_fall');
      Sfx.hurt();
      p.x = this.check[0]; p.y = this.check[1]; p.vx = 0; p.vy = 0; p.inv = 1;
    }
    // Drohnen
    if (p.inv > 0) p.inv -= dt;
    for (const d of this.drones) {
      d.ph += dt * d.sp;
      d.x = lerp(d.x1, d.x2, 0.5 - 0.5 * Math.cos(d.ph));
      d.yy = d.y + Math.sin(d.ph * 3) * 6;
      if (p.inv <= 0 && Math.abs(p.x - d.x) < 32 && p.y - 86 < d.yy + 10 && p.y > d.yy - 10) {
        p.inv = 1.2;
        p.vx = (p.x < d.x ? -1 : 1) * 380;
        p.vy = -420; p.ground = null;
        Engine.shake = 8; Sfx.hurt();
        this.penalty(3, 'r_hit');
        this.burst(d.x, d.yy, '#ff5a6a', 14);
      }
    }
    // Zeitfunken
    for (const s of this.sparks) {
      if (!s.got && Math.abs(p.x - s.x) < 26 && p.y - 90 < s.y + 14 && p.y > s.y - 14) {
        s.got = true; G.sparks++; this.left += 2; Sfx.spark();
        this.burst(s.x, s.y, '#ffd36a', 12);
        this.floaters.push({ x: s.x, y: s.y - 10, t: 1, text: '+2 s', col: '#ffd36a' });
      }
    }
    // Checkpoints
    LEVEL.checks.forEach((c, i) => {
      if (!this.checksHit.has(i) && p.x > c[0] - 10) {
        this.checksHit.add(i); this.check = c; Sfx.success();
        UI.toast('🚩 ' + T('r_check'), 1400);
      }
    });
    // Ziel
    if (p.x >= LEVEL.goal) return this.finish();

    this.cam = clamp(lerp(this.cam, p.x - 330, Math.min(1, dt * 6)), 0, LEVEL.end - W);
    this.updateParts(dt);
  }
  updateParts(dt) {
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 400 * dt; q.life -= dt; }
    this.parts = this.parts.filter((q) => q.life > 0);
    for (const f of this.floaters) { f.y -= 40 * dt; f.t -= dt; }
    this.floaters = this.floaters.filter((f) => f.t > 0);
  }
  burst(x, y, col, n) {
    for (let i = 0; i < n; i++) { const a = rand(0, Math.PI * 2), v = rand(60, 220); this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: rand(0.3, 0.8), col }); }
  }
  penalty(s, key) {
    this.left = Math.max(0, this.left - s);
    this.floaters.push({ x: this.p.x, y: this.p.y - 110, t: 1.2, text: '−' + s + ' s', col: '#ff6a6a' });
    UI.toast(T(key), 1400);
  }
  clockText() {
    const total = 20 * 3600 - this.left * (480 / this.T0);
    const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = Math.floor(total % 60);
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  updateTimer() { UI.setTimer('⏱ ' + this.clockText(), this.left < 15); }
  late() {
    this.failed = true;
    Sfx.boom();
    UI.showScreen(`<h1>${T('r_late_t')}</h1><p>${T('r_late')}</p><div class="row"><button class="btn cyan" id="retry">${T('r_retry')}</button></div>`, 'dim', () => this.retry());
    $('#retry').addEventListener('click', () => this.retry());
  }
  retry() {
    UI.hideScreen();
    this.reset();
    this.started = true;
  }
  finish() {
    this.finished = true;
    G.timeLeft = Math.ceil(this.left);
    Sfx.success();
    Engine.fadeTo(() => Engine.setMode(new Finale()), 1.4);
  }

  /* ---------- Zeichnen ---------- */
  draw(c, t) {
    const cam = this.cam;
    Art.sky(c, [[0, '#0b0820'], [0.5, '#2a1650'], [0.85, '#7a2e66'], [1, '#c4507a']]);
    Art.stars(c, this.stars, t);
    // Mond
    Art.glow(c, 780, 80, 80, 'rgba(255,240,220,0.4)');
    c.fillStyle = '#fff3dc'; Art.circ(c, 780, 80, 20);
    c.save(); c.translate(-cam * 0.12, 0);
    for (const tw of this.far) if (tw.x - cam * 0.12 < W + 100 && tw.x + tw.w - cam * 0.12 > -100) Art.tower(c, tw.x, 520, tw.w, tw.h, tw.o, t);
    c.restore();
    c.fillStyle = 'rgba(120,60,140,0.18)'; c.fillRect(0, 300, W, 240);
    c.save(); c.translate(-cam * 0.35, 0);
    for (const tw of this.mid) if (tw.x - cam * 0.35 < W + 100 && tw.x + tw.w - cam * 0.35 > -100) Art.tower(c, tw.x, 560, tw.w, tw.h, tw.o, t);
    c.restore();
    c.fillStyle = 'rgba(12,7,30,0.5)'; c.fillRect(0, 0, W, H);

    c.save(); c.translate(-cam, 0);
    // Dächer
    LEVEL.solids.forEach(([sx, sy, sw], i) => {
      if (sx > cam + W + 50 || sx + sw < cam - 50) return;
      c.fillStyle = Art.grad(c, 0, sy, 0, H, [[0, '#2b2152'], [1, '#120e26']]);
      c.fillRect(sx, sy, sw, H - sy + 10);
      const rr = seeded(900 + i);
      for (let y = sy + 26; y < H; y += 22) for (let x = sx + 12; x < sx + sw - 12; x += 18) {
        const v = rr();
        if (v < 0.3) { c.fillStyle = v < 0.04 ? 'rgba(95,242,255,0.8)' : 'rgba(255,210,140,0.55)'; c.fillRect(x, y, 8, 9); }
      }
      c.fillStyle = '#3d3278'; c.fillRect(sx, sy, sw, 14);
      c.fillStyle = i % 2 ? '#ff7ad9' : '#5ff2ff';
      c.shadowColor = c.fillStyle; c.shadowBlur = 12;
      c.fillRect(sx, sy, sw, 3);
      c.shadowBlur = 0;
      for (const pr of this.roofProps[i]) this.drawProp(c, pr, sy, t);
    });
    // Sprungfelder
    for (const [px, py] of LEVEL.pads) {
      c.fillStyle = '#10203a'; Art.rr(c, px - 32, py - 8, 64, 10, 4);
      for (let i = 0; i < 3; i++) {
        const a = (Math.sin(t * 6 - i) + 1) / 2;
        c.strokeStyle = `rgba(95,242,255,${0.3 + a * 0.7})`; c.lineWidth = 3;
        const yy = py - 16 - i * 12;
        c.beginPath(); c.moveTo(px - 14, yy + 6); c.lineTo(px, yy - 2); c.lineTo(px + 14, yy + 6); c.stroke();
      }
    }
    // Checkpoints
    LEVEL.checks.forEach(([cx, cy], i) => {
      if (i === 0) return;
      const on = this.checksHit.has(i);
      c.fillStyle = '#c8d0e8'; c.fillRect(cx - 2, cy - 70, 3, 70);
      if (on) { Art.glow(c, cx + 20, cy - 58, 40, 'rgba(95,242,255,0.35)'); Art.flag(c, cx + 1, cy - 70, 38, 22, t); }
      else { c.fillStyle = 'rgba(200,210,240,0.35)'; c.fillRect(cx + 1, cy - 70, 30, 18); }
    });
    // Plattformen
    for (const pl of this.plats) {
      Art.glow(c, pl.x + pl.w / 2, pl.y + 12, pl.w * 0.6, 'rgba(95,242,255,0.25)');
      c.fillStyle = Art.grad(c, 0, pl.y, 0, pl.y + 14, [[0, '#d8f6ff'], [1, '#5a7ab0']]);
      Art.rr(c, pl.x, pl.y, pl.w, 14, 7);
      c.fillStyle = '#5ff2ff'; c.fillRect(pl.x + 8, pl.y + 5, pl.w - 16, 2);
      for (const tx of [pl.x + 18, pl.x + pl.w - 18]) {
        c.fillStyle = `rgba(95,242,255,${0.4 + Math.random() * 0.4})`;
        c.beginPath(); c.moveTo(tx - 5, pl.y + 14); c.lineTo(tx + 5, pl.y + 14); c.lineTo(tx, pl.y + 26 + Math.random() * 6); c.fill();
      }
    }
    // Funken
    for (const s of this.sparks) {
      if (s.got) continue;
      const yy = s.y + Math.sin(t * 3 + s.x) * 4;
      Art.glow(c, s.x, yy, 22, 'rgba(255,210,100,0.55)');
      c.save(); c.translate(s.x, yy); c.rotate(t * 2);
      c.fillStyle = '#ffe08a';
      c.beginPath();
      for (let i = 0; i < 8; i++) { const r = i % 2 ? 3 : 10; const a = i * Math.PI / 4; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      c.fill(); c.restore();
    }
    // Ziel
    this.drawGoal(c, t);
    // Drohnen
    for (const d of this.drones) {
      if (d.x < cam - 60 || d.x > cam + W + 60) continue;
      const y = d.yy || d.y;
      c.fillStyle = '#20203a'; Art.rr(c, d.x - 20, y - 7, 40, 14, 6);
      c.fillStyle = '#ff4a5a'; c.shadowColor = '#ff4a5a'; c.shadowBlur = 10; Art.circ(c, d.x, y, 3.5); c.shadowBlur = 0;
      c.strokeStyle = 'rgba(220,220,255,0.7)'; c.lineWidth = 2;
      for (const ox of [-18, 18]) {
        c.fillStyle = '#2c2c48'; c.fillRect(d.x + ox - 1, y - 12, 2, 6);
        const w = Math.abs(Math.sin(t * 40 + ox)) * 14 + 4;
        c.beginPath(); c.moveTo(d.x + ox - w, y - 12); c.lineTo(d.x + ox + w, y - 12); c.stroke();
      }
    }
    // Spielerin
    const p = this.p;
    const blink = p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0;
    if (!blink) {
      c.save();
      c.translate(p.x, p.y);
      if (!p.ground) c.rotate(clamp(p.vx / 1600, -0.15, 0.15));
      Art.person(c, 0, 0, Object.assign({}, CHARS.mariam, { h: 94 }), t, { facing: p.face, walk: !!p.ground && Math.abs(p.vx) > 30 });
      c.restore();
    }
    for (const q of this.parts) { c.globalAlpha = clamp(q.life * 1.6, 0, 1); c.fillStyle = q.col; c.fillRect(q.x - 2, q.y - 2, 4, 4); }
    c.globalAlpha = 1;
    c.font = '800 18px system-ui, sans-serif'; c.textAlign = 'center';
    for (const f of this.floaters) { c.globalAlpha = clamp(f.t, 0, 1); c.fillStyle = f.col; c.fillText(f.text, f.x, f.y); }
    c.globalAlpha = 1;
    c.restore();

    // Fortschritt
    const prog = clamp(p.x / LEVEL.goal, 0, 1);
    c.fillStyle = 'rgba(16,12,28,0.6)'; Art.rr(c, 330, 60, 300, 8, 4);
    c.fillStyle = '#5ff2ff'; Art.rr(c, 330, 60, 300 * prog, 8, 4);
    c.fillStyle = '#fff'; Art.circ(c, 330 + 300 * prog, 64, 6);
    c.font = '14px system-ui, sans-serif'; c.textAlign = 'left'; c.fillStyle = '#ffd36a';
    c.fillText('✦ ' + G.sparks, 640, 69);
  }
  drawProp(c, pr, sy, t) {
    const x = pr.x, s = pr.s;
    if (pr.kind === 0) { // Klimagerät
      c.fillStyle = '#3a3360'; c.fillRect(x - 16 * s, sy - 20 * s, 32 * s, 20 * s);
      c.strokeStyle = '#5a5290'; c.beginPath(); c.arc(x, sy - 10 * s, 7 * s, 0, Math.PI * 2); c.stroke();
    } else if (pr.kind === 1) { // Antenne
      c.strokeStyle = '#4a4580'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, sy); c.lineTo(x, sy - 50 * s); c.stroke();
      c.fillStyle = Math.sin(t * 4 + x) > 0 ? '#ff4a5a' : '#552030'; Art.circ(c, x, sy - 50 * s, 3);
    } else if (pr.kind === 2) { // Dachgarten
      c.fillStyle = '#2a4a3a'; c.fillRect(x - 24 * s, sy - 10 * s, 48 * s, 10 * s);
      c.fillStyle = '#3f8a5a'; for (let i = 0; i < 4; i++) Art.circ(c, x - 18 * s + i * 12 * s, sy - 14 * s, 7 * s);
    } else { // Solarpaneel
      c.fillStyle = '#1d2f5a'; c.beginPath(); c.moveTo(x - 22 * s, sy - 4); c.lineTo(x + 22 * s, sy - 4); c.lineTo(x + 16 * s, sy - 22 * s); c.lineTo(x - 26 * s, sy - 22 * s); c.fill();
      c.strokeStyle = 'rgba(95,242,255,0.3)'; c.lineWidth = 1; c.stroke();
    }
  }
  drawGoal(c, t) {
    const gx = LEVEL.goal;
    Art.glow(c, gx + 60, 380, 220, 'rgba(255,140,220,0.25)');
    c.strokeStyle = '#ff7ad9'; c.lineWidth = 8; c.shadowColor = '#ff7ad9'; c.shadowBlur = 16;
    c.beginPath(); c.moveTo(gx - 20, 470); c.lineTo(gx - 20, 330); c.quadraticCurveTo(gx + 60, 250, gx + 140, 330); c.lineTo(gx + 140, 470); c.stroke();
    c.shadowBlur = 0;
    c.font = '800 16px system-ui, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#fff';
    c.fillText('UNION SKY PLAZA', gx + 60, 318);
    Art.flag(c, gx + 160, 300, 60, 34, t);
    c.fillStyle = '#c8d0e8'; c.fillRect(gx + 158, 300, 3, 170);
  }
}
