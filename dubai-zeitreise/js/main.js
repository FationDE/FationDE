'use strict';
/* Titelbild, Intro und Start. */

class Title {
  enter() {
    UI.setChapter(null);
    UI.showInventory(false);
    UI.showTimer(false);
    $('#touch').hidden = true;
    Music.stop();
    const r = seeded(1971);
    this.old = [];
    for (let x = -20; x < W / 2 + 120; x += 30 + r() * 40) this.old.push({ x, w: 30 + r() * 50, h: 20 + r() * 50, tower: r() < 0.4 });
    this.neo = [];
    const shapes = ['spire', 'sail', 'step', 'twist', 'rect'];
    for (let x = W / 2 - 120, i = 0; x < W + 40; i++) {
      const w = 34 + r() * 50;
      this.neo.push({ x, w, h: 140 + r() * 300, o: { shape: shapes[Math.floor(r() * shapes.length)], body: '#1a1438', windows: 'rgba(255,214,150,0.85)', accent: '#5ff2ff', lit: 0.3, seed: i + 9, edge: r() < 0.5 ? 'rgba(95,242,255,0.6)' : 'rgba(255,120,220,0.6)', beacon: true } });
      x += w * (0.75 + r() * 0.4);
    }
    this.stars = [];
    for (let i = 0; i < 70; i++) this.stars.push({ x: W / 2 + r() * W / 2, y: r() * 280, r: r() < 0.2 ? 2 : 1, a: 0.3 + r() * 0.7, sp: 1 + r() * 3 });
    this.motes = [];
    this.render();
  }
  render() {
    const has = !!store.get('save', null);
    UI.showScreen(`
      <h1>${T('title')}</h1>
      <h2>${T('subtitle')}</h2>
      <p>${T('tagline')}</p>
      <div class="row">
        ${has ? `<button class="btn" id="cont">${T('cont')}</button><button class="btn alt" id="new">${T('newgame')}</button>`
              : `<button class="btn" id="new">${T('play')}</button>`}
      </div>`, '', () => (has ? continueGame() : newGame()));
    $('#new').addEventListener('click', () => newGame());
    if (has) $('#cont').addEventListener('click', () => continueGame());
  }
  onLang() { this.render(); }
  update(dt) {
    if (Math.random() < dt * 30) this.motes.push({ y: rand(0, H), x: W / 2 + rand(-20, 20), vx: rand(-60, 60), life: 1 });
    for (const m of this.motes) { m.x += m.vx * dt; m.life -= dt * 0.8; }
    this.motes = this.motes.filter((m) => m.life > 0);
  }
  draw(c, t) {
    const seam = (y) => W / 2 + 70 - (y / H) * 140 + Math.sin(y * 0.03 + t * 2) * 6;
    // 1971 links
    c.save();
    c.beginPath(); c.moveTo(0, 0); for (let y = 0; y <= H; y += 20) c.lineTo(seam(y), y); c.lineTo(0, H); c.closePath(); c.clip();
    Art.sky(c, [[0, '#e9a65a'], [0.6, '#f5d39a'], [1, '#f0e0c0']]);
    Art.glow(c, 200, 230, 160, 'rgba(255,240,200,0.9)');
    c.fillStyle = '#fff4d8'; Art.circ(c, 200, 230, 40);
    c.fillStyle = '#c9925a';
    for (const b of this.old) {
      c.fillRect(b.x, 360 - b.h, b.w, b.h + 10);
      if (b.tower) c.fillRect(b.x + b.w * 0.3, 360 - b.h - 40, 20, 44);
    }
    c.fillRect(330, 220, 14, 150); Art.circ(c, 337, 220, 10);
    c.fillStyle = Art.grad(c, 0, 360, 0, H, [[0, '#c98a4a'], [1, '#e7c08a']]);
    c.fillRect(0, 360, W, H - 360);
    Art.dhow(c, 150, 420, 0.7, t, '#6a3e1e');
    Art.palm(c, 60, 470, 200, t, { trunk: '#6a4426', frond: '#4a6a2a', frond2: '#5e7f36' });
    c.fillStyle = 'rgba(120,70,20,0.18)'; c.fillRect(0, 0, W, H);
    c.restore();
    // 2071 rechts
    c.save();
    c.beginPath(); c.moveTo(W, 0); for (let y = 0; y <= H; y += 20) c.lineTo(seam(y), y); c.lineTo(W, H); c.closePath(); c.clip();
    Art.sky(c, [[0, '#0b0820'], [0.55, '#2c1656'], [1, '#8a2e6e']]);
    Art.stars(c, this.stars, t);
    for (const tw of this.neo) Art.tower(c, tw.x, 420, tw.w, tw.h, tw.o, t);
    c.fillStyle = Art.grad(c, 0, 420, 0, H, [[0, '#1a1440'], [1, '#08061a']]);
    c.fillRect(0, 420, W, H - 420);
    c.fillStyle = '#5ff2ff'; c.fillRect(0, 420, W, 2);
    for (let i = 0; i < 4; i++) {
      const x = ((t * (60 + i * 25) + i * 300) % 700) + W / 2 - 100, y = 120 + i * 50;
      Art.glow(c, x, y, 12, i % 2 ? 'rgba(255,122,217,0.8)' : 'rgba(95,242,255,0.8)');
    }
    c.restore();
    // Zeitriss
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) {
      c.strokeStyle = k === 0 ? 'rgba(255,255,255,0.9)' : k === 1 ? 'rgba(95,242,255,0.5)' : 'rgba(255,190,90,0.35)';
      c.lineWidth = [2, 8, 18][k];
      c.beginPath();
      for (let y = 0; y <= H; y += 12) { const x = seam(y) + (k ? 0 : rand(-2, 2)); y ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    }
    for (const m of this.motes) { c.fillStyle = `rgba(200,250,255,${m.life})`; c.fillRect(m.x, m.y, 2, 2); }
    c.restore();
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, 0, W, H);
    c.font = '800 28px Georgia, serif'; c.textBaseline = 'bottom';
    c.fillStyle = 'rgba(255,240,210,0.85)'; c.textAlign = 'left'; c.fillText('1971', 24, H - 18);
    c.fillStyle = 'rgba(150,250,255,0.9)'; c.textAlign = 'right'; c.fillText('2071', W - 24, H - 18);
  }
}

class Intro {
  enter() {
    UI.setChapter('ch1');
    UI.showInventory(false);
    Music.play('1971');
    this.sc = SCENES.home71;
    if (!this.sc._inited) { this.sc.init(); this.sc._inited = true; }
    this.i = 0;
    this.show();
  }
  show() {
    UI.showScreen(`<div class="story"><p>${T('intro' + (this.i + 1))}</p><div class="tap">${T('tap')} ▸</div></div>`, 'dim', () => this.next());
    UI.screen.onclick = () => this.next();
  }
  onLang() { UI.setChapter('ch1'); this.show(); }
  next() {
    Sfx.click();
    this.i++;
    if (this.i < 3) return this.show();
    UI.screen.onclick = null;
    UI.hideScreen();
    Engine.flash = 1.3;
    Engine.shake = 8;
    Sfx.boom();
    Sfx.warp();
    Engine.setMode(new Adventure('home71', 470));
  }
  draw(c, t) {
    this.sc.drawBack(c, t, 0);
    Art.palm(c, 880, FLOOR + 6, 300, t);
    Art.person(c, 290, FLOOR, CHARS.grandma, t, { facing: 1 });
  }
}

function newGame() {
  Sfx.init();
  G.reset();
  store.del('save');
  UI.hideScreen();
  UI.renderInventory();
  Engine.fadeTo(() => Engine.setMode(new Intro()));
}

function continueGame() {
  Sfx.init();
  G.reset();
  const scene = G.load();
  UI.hideScreen();
  UI.renderInventory();
  Engine.fadeTo(() => {
    if (scene === 'tunnel') Engine.setMode(new Tunnel());
    else if (scene === 'runner') Engine.setMode(new Runner());
    else if (SCENES[scene]) Engine.setMode(new Adventure(scene));
    else Engine.setMode(new Intro());
  });
}

function restartGame() {
  UI.hideScreen();
  G.reset();
  Engine.fadeTo(() => Engine.setMode(new Title()));
}

/* ---------- Start ---------- */
(function boot() {
  document.documentElement.lang = G.lang;
  UI.init();
  Engine.init();

  for (const [id, code] of [['tLeft', 'TouchLeft'], ['tRight', 'TouchRight'], ['tJump', 'TouchJump']]) {
    const b = $('#' + id);
    const on = (e) => { e.preventDefault(); Sfx.init(); Engine.keys[code] = true; b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (_) { /* egal */ } };
    const off = () => { Engine.keys[code] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
    b.addEventListener('lostpointercapture', off);
  }
  addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('visibilitychange', () => { if (document.hidden) Engine.keys = {}; });

  Engine.setMode(new Title());

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !window.__NO_SW__) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
