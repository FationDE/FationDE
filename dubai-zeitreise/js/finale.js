'use strict';
/* Finale: Union Sky Plaza 2071 – Noor trifft Mariam, Feuerwerk zum 100. Geburtstag. */

class Finale {
  enter() {
    UI.setChapter('ch4');
    UI.showInventory(false);
    UI.showTimer(false);
    $('#touch').hidden = true;
    Music.play('calm');
    store.del('save');
    const r = seeded(2071);
    this.stars = [];
    for (let i = 0; i < 100; i++) this.stars.push({ x: r() * W, y: r() * 250, r: r() < 0.15 ? 2 : 1, a: 0.3 + r() * 0.7, sp: 1 + r() * 3 });
    this.towers = [];
    const shapes = ['spire', 'sail', 'step', 'twist', 'rect'];
    for (let x = -40, i = 0; x < W + 60; i++) {
      const w = 40 + r() * 60;
      this.towers.push({ x, w, h: 150 + r() * 250, o: { shape: shapes[Math.floor(r() * shapes.length)], body: '#18123a', windows: 'rgba(255,214,150,0.85)', accent: '#5ff2ff', lit: 0.3, seed: i + 40, edge: r() < 0.5 ? 'rgba(255,120,220,0.6)' : 'rgba(95,242,255,0.6)', beacon: true } });
      x += w * (0.7 + r() * 0.5);
    }
    this.crowd = [];
    for (let i = 0; i < 46; i++) this.crowd.push({ x: r() * (W + 40) - 20, h: 60 + r() * 30, ph: r() * 6, col: `hsl(${250 + r() * 40},30%,${10 + r() * 8}%)` });
    this.px = -40;
    this.walk = true;
    this.noorWave = false;
    this.parts = [];
    this.rockets = [];
    this.fireworks = false;
    this.fwT = 0;
    this.text100 = this.sampleText('100', 260);
    this.script();
  }
  hint() { return null; }
  onLang() { UI.setChapter('ch4'); }
  sampleText(txt, size) {
    const cv = document.createElement('canvas');
    cv.width = 600; cv.height = 300;
    const c = cv.getContext('2d');
    c.fillStyle = '#fff'; c.font = `900 ${size}px system-ui, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(txt, 300, 150);
    const d = c.getImageData(0, 0, 600, 300).data, pts = [];
    for (let y = 0; y < 300; y += 6) for (let x = 0; x < 600; x += 6) if (d[(y * 600 + x) * 4 + 3] > 128) pts.push([x - 300, y - 150]);
    return pts;
  }
  async script() {
    await sleep(300);
    await new Promise((res) => { this.arrived = res; });
    this.noorWave = true;
    await UI.say([['noor', 'e_1'], ['mariam', 'e_2'], ['noor', 'e_3'], ['nova', 'e_4'], ['noor', 'e_5']]);
    this.noorWave = false;
    this.fireworks = true;
    Music.stop();
    await sleep(2200);
    this.form100();
    await sleep(6500);
    this.end();
  }
  form100() {
    Sfx.boom();
    const cols = ['#e31b23', '#00a651', '#ffffff', '#ffd36a'];
    const cx = W / 2, cy = 150;
    for (const [x, y] of this.text100) {
      const col = x < -60 ? '#e31b23' : y < -40 ? '#00a651' : y < 30 ? '#ffffff' : '#ffd36a';
      this.parts.push({ x: cx, y: cy + 40, tx: cx + x, ty: cy + y, form: true, life: 6.5, max: 6.5, col: col || cols[0] });
    }
  }
  end() {
    const html = `
      <h1>${T('end_t')}</h1>
      <h2>1971 · 2071</h2>
      <p>${T('end_txt')}</p>
      <div class="stats">${T('end_stats', { t: G.timeLeft, s: G.sparks, r: G.bonus })}</div>
      <div class="row"><button class="btn" id="again">${T('end_again')}</button></div>
      <div class="small">${T('end_small')}</div>`;
    UI.showScreen(html, 'dim', () => restartGame());
    $('#again').addEventListener('click', () => restartGame());
  }
  launch() {
    const x = rand(120, W - 120);
    this.rockets.push({ x, y: H - 60, vy: rand(-520, -420), vx: rand(-40, 40), col: ['#e31b23', '#00a651', '#ffffff', '#ffd36a', '#ff7ad9', '#5ff2ff'][Math.floor(rand(0, 6))] });
    Sfx.tone(500, 0.6, 'sine', 0.025, 900);
  }
  update(dt) {
    if (this.walk) {
      this.px += 200 * dt;
      if (this.px >= 520) { this.px = 520; this.walk = false; if (this.arrived) this.arrived(); }
    }
    this.dim = clamp((this.dim || 0) + (this.fireworks ? dt * 0.6 : 0), 0, 1);
    if (this.fireworks) {
      this.fwT -= dt;
      if (this.fwT <= 0) { this.fwT = rand(0.25, 0.6); this.launch(); }
    }
    for (const r of this.rockets) {
      r.x += r.vx * dt; r.y += r.vy * dt; r.vy += 220 * dt;
      if (r.vy > -60 && !r.done) {
        r.done = true; Sfx.pop();
        const n = 50;
        for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, v = rand(90, 190); this.parts.push({ x: r.x, y: r.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(1.2, 1.9), max: 1.9, col: r.col }); }
      }
    }
    this.rockets = this.rockets.filter((r) => !r.done);
    for (const q of this.parts) {
      if (q.form) { q.x = lerp(q.x, q.tx, Math.min(1, dt * 2.5)); q.y = lerp(q.y, q.ty, Math.min(1, dt * 2.5)); }
      else { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 60 * dt; q.vx *= 0.99; }
      q.life -= dt;
    }
    this.parts = this.parts.filter((q) => q.life > 0);
  }
  draw(c, t) {
    Art.sky(c, [[0, '#070516'], [0.6, '#1d1240'], [1, '#4a1e52']]);
    Art.stars(c, this.stars, t);
    for (const tw of this.towers) Art.tower(c, tw.x, 360, tw.w, tw.h, tw.o, t);
    if (this.dim > 0) { c.fillStyle = `rgba(5,3,16,${this.dim * 0.6})`; c.fillRect(0, 0, W, 362); }
    // Feuerwerk
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const r of this.rockets) { c.fillStyle = r.col; Art.circ(c, r.x, r.y, 2.5); Art.glow(c, r.x, r.y + 8, 10, 'rgba(255,220,160,0.5)'); }
    for (const q of this.parts) {
      const a = clamp(q.life / (q.max * 0.5), 0, 1);
      c.globalAlpha = a * (q.form ? 0.75 + 0.25 * Math.sin(t * 20 + q.tx) : 1);
      c.fillStyle = q.col;
      c.fillRect(q.x - 1.8, q.y - 1.8, 3.6, 3.6);
    }
    c.globalAlpha = 1;
    c.restore();
    // Wasser mit Spiegelung
    c.fillStyle = Art.grad(c, 0, 360, 0, 430, [[0, '#1a1440'], [1, '#0c0a24']]);
    c.fillRect(0, 360, W, 70);
    c.save(); c.globalAlpha = 0.25; c.translate(0, 720); c.scale(1, -1);
    for (const tw of this.towers) Art.tower(c, tw.x, 360, tw.w, tw.h * 0.4, tw.o, t);
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,0.12)';
    for (let i = 0; i < 20; i++) { const y = 370 + (i % 6) * 10, x = (i * 97 + t * 20) % W; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 30, y); c.stroke(); }
    // Plaza
    c.fillStyle = Art.grad(c, 0, 430, 0, 540, [[0, '#2a2048'], [1, '#3b2c5c']]);
    c.fillRect(0, 430, W, 110);
    c.fillStyle = '#ff7ad9'; c.fillRect(0, 430, W, 2);
    // Personen
    Art.person(c, 620, FLOOR, CHARS.noor, t, { facing: -1, wave: this.noorWave });
    Art.robot(c, 720, FLOOR - 10, t);
    Art.person(c, this.px, FLOOR, CHARS.mariam, t, { facing: 1, walk: this.walk });
    // Menschenmenge im Vordergrund
    for (const p of this.crowd) {
      const bob = this.fireworks ? Math.abs(Math.sin(t * 4 + p.ph)) * 6 : 0;
      c.fillStyle = p.col;
      const y = 560 - bob;
      Art.rr(c, p.x - 14, y - p.h, 28, p.h, 12);
      Art.circ(c, p.x, y - p.h - 8, 11);
      if (this.fireworks && Math.sin(p.ph * 3) > 0.6) {
        c.strokeStyle = p.col; c.lineWidth = 6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(p.x + 8, y - p.h + 8); c.lineTo(p.x + 16, y - p.h - 24 + Math.sin(t * 8 + p.ph) * 4); c.stroke();
      }
    }
  }
}
