'use strict';
/* Zeittunnel: Die Kapsel rast von 1971 nach 2071. Splitter ausweichen, goldene Jahresringe sammeln. */

class Tunnel {
  enter() {
    UI.setChapter('ch2');
    UI.showInventory(false);
    UI.showTimer(false);
    $('#touch').hidden = true;
    Music.play('tunnel');
    G.save('tunnel');
    this.reset();
    this.started = false;
    UI.say([[null, 't_intro']]).then(() => {
      UI.toast(T('t_ctrl'), 3000);
      this.started = true;
    });
  }
  reset() {
    this.px = 0; this.vx = 0; this.steer = null;
    this.objs = [];
    this.el = 0; this.dur = 34;
    this.spawnT = 0.8;
    this.hp = 3; this.inv = 0;
    this.rings = 0;
    this.done = false;
    this.parts = [];
  }
  hint() { return T('h_tunnel'); }
  onLang() { UI.setChapter('ch2'); }
  pointerDown(x) { this.steer = (x - W / 2) / 360; }
  pointerMove(x, y, e) { if (this.steer !== null && (e.buttons || e.pointerType === 'touch')) this.steer = (x - W / 2) / 360; }
  pointerUp() { this.steer = null; }
  progress() { return clamp(this.el / this.dur, 0, 1); }
  update(dt) {
    if (!this.started || this.done) return;
    this.el += dt;
    // Steuerung
    const k = Engine.keys;
    let dir = 0;
    if (k.ArrowLeft || k.KeyA) dir -= 1;
    if (k.ArrowRight || k.KeyD) dir += 1;
    if (dir) { this.vx = lerp(this.vx, dir * 2.1, Math.min(1, dt * 8)); this.steer = null; }
    else if (this.steer !== null) this.vx = clamp((clamp(this.steer, -1, 1) - this.px) * 7, -2.4, 2.4);
    else this.vx = lerp(this.vx, 0, Math.min(1, dt * 6));
    this.px = clamp(this.px + this.vx * dt, -1, 1);
    if (this.inv > 0) this.inv -= dt;

    // Spawnen
    const p = this.progress();
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.el < this.dur - 1.5) {
      this.spawnT = lerp(0.62, 0.36, p) + rand(0, 0.15);
      const ring = Math.random() < 0.32;
      this.objs.push({ x: rand(-0.95, 0.95), z: 1, ring, rot: rand(0, 6), spin: rand(-3, 3) });
      if (!ring && p > 0.4 && Math.random() < 0.35) this.objs.push({ x: rand(-0.95, 0.95), z: 1.12, ring: false, rot: rand(0, 6), spin: rand(-3, 3) });
    }
    const speed = lerp(0.85, 1.25, p);
    for (const o of this.objs) {
      o.z -= dt * speed;
      o.rot += o.spin * dt;
      if (!o.hit && o.z < 0.06 && o.z > -0.04 && Math.abs(o.x - this.px) < (o.ring ? 0.2 : 0.15)) {
        o.hit = true;
        if (o.ring) {
          this.rings++; Sfx.spark();
          this.burst(o, '#ffd36a');
        } else if (this.inv <= 0) {
          this.hp--; this.inv = 1.1; Engine.shake = 10; Sfx.hurt();
          this.burst(o, '#8ff');
          if (this.hp <= 0) return this.fail();
        }
      }
    }
    this.objs = this.objs.filter((o) => o.z > -0.1 && !(o.hit && o.ring));
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; }
    this.parts = this.parts.filter((q) => q.life > 0);

    if (this.el >= this.dur) {
      this.done = true;
      G.bonus = this.rings;
      Sfx.boom();
      Engine.flash = 1.2;
      UI.toast(T('t_rings', { n: this.rings }), 3000);
      Engine.fadeTo(() => Engine.setMode(new Adventure('home2071', 470)), 1.2);
    }
  }
  burst(o, col) {
    const s = this.project(o.x, Math.max(0, o.z));
    for (let i = 0; i < 18; i++) { const a = rand(0, Math.PI * 2), v = rand(80, 260); this.parts.push({ x: s.x, y: s.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.3, 0.7), col }); }
  }
  fail() {
    this.done = true;
    UI.say([[null, 't_fail']]).then(() => { this.reset(); this.started = true; });
  }
  project(x, z) {
    const p = 1 / (1 + z * 7);
    return { x: W / 2 + x * 380 * p, y: 250 + 210 * p, s: p };
  }
  draw(c, t) {
    const p = this.progress();
    const hue = lerp(32, 190, p);
    c.fillStyle = `hsl(${hue + 220},40%,${lerp(10, 6, p)}%)`;
    c.fillRect(0, 0, W, H);
    // Tunnelringe
    const cx = W / 2, cy = 250;
    const speed = 0.7 + p * 0.6;
    for (let i = 0; i < 18; i++) {
      const z = 1 - ((i / 18 + this.el * speed * 0.35) % 1);
      const s = 1 / (1 + z * 7);
      const r = 560 * s;
      c.strokeStyle = `hsla(${hue + i * 4},85%,${55 + Math.sin(i + t * 3) * 10}%,${0.15 + s * 0.6})`;
      c.lineWidth = 1 + s * 6;
      c.beginPath(); c.ellipse(cx, cy, r * 1.35, r, 0, 0, Math.PI * 2); c.stroke();
    }
    // Strahlen
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2 + t * 0.2;
      c.strokeStyle = `hsla(${hue},90%,70%,0.08)`; c.lineWidth = 2;
      c.beginPath(); c.moveTo(cx + Math.cos(a) * 30, cy + Math.sin(a) * 22); c.lineTo(cx + Math.cos(a) * 900, cy + Math.sin(a) * 650); c.stroke();
    }
    Art.glow(c, cx, cy, 120, `hsla(${hue},100%,80%,0.5)`);
    c.restore();
    // Jahreszahl
    const year = Math.floor(lerp(1971, 2071, p));
    c.save();
    c.font = `800 ${46 + Math.sin(t * 6) * 1.5}px system-ui, sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = `hsla(${hue},90%,85%,0.9)`;
    c.shadowColor = `hsl(${hue},100%,60%)`; c.shadowBlur = 20;
    c.fillText(String(year), cx, 70);
    c.restore();
    // Fortschrittsbalken
    c.fillStyle = 'rgba(255,255,255,0.15)'; Art.rr(c, cx - 200, 104, 400, 6, 3);
    c.fillStyle = `hsl(${hue},90%,65%)`; Art.rr(c, cx - 200, 104, 400 * p, 6, 3);
    // Objekte (hinten zuerst)
    const sorted = this.objs.slice().sort((a, b) => b.z - a.z);
    for (const o of sorted) {
      if (o.z > 1.1) continue;
      const s = this.project(o.x, Math.max(-0.04, o.z));
      const size = 62 * s.s;
      c.save(); c.translate(s.x, s.y); c.rotate(o.rot);
      c.globalAlpha = clamp((1.1 - o.z) * 2, 0, 1);
      if (o.ring) {
        Art.glow(c, 0, 0, size * 1.3, 'rgba(255,210,100,0.6)');
        c.strokeStyle = '#ffd36a'; c.lineWidth = Math.max(2, size * 0.16);
        c.beginPath(); c.arc(0, 0, size * 0.55, 0, Math.PI * 2); c.stroke();
      } else {
        c.fillStyle = `hsla(${hue + 160},80%,70%,0.9)`;
        c.strokeStyle = '#fff'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(0, -size * 0.75); c.lineTo(size * 0.38, -size * 0.1); c.lineTo(size * 0.12, size * 0.7); c.lineTo(-size * 0.45, size * 0.2); c.closePath();
        c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.moveTo(0, -size * 0.75); c.lineTo(size * 0.1, -size * 0.1); c.lineTo(-size * 0.2, size * 0.1); c.fill();
      }
      c.restore();
    }
    // Kapsel
    const sx = cx + this.px * 380, sy = 452;
    const blink = this.inv > 0 && Math.floor(this.inv * 12) % 2 === 0;
    if (!blink) {
      c.save();
      c.translate(sx, sy);
      c.rotate(this.vx * 0.12);
      c.scale(0.55, 0.55);
      Art.capsule(c, 0, 92, t, { lens: true, coil: true, radio: true, active: true });
      c.restore();
    }
    for (const q of this.parts) { c.fillStyle = q.col; c.globalAlpha = q.life * 1.5; c.fillRect(q.x - 2, q.y - 2, 4, 4); }
    c.globalAlpha = 1;
    // Stabilität + Ringe
    c.save();
    c.font = '700 18px system-ui, sans-serif'; c.textBaseline = 'middle';
    for (let i = 0; i < 3; i++) {
      c.fillStyle = i < this.hp ? '#5ff2ff' : 'rgba(255,255,255,0.2)';
      Art.rr(c, 24 + i * 26, H - 40, 20, 20, 5);
    }
    c.fillStyle = '#ffd36a'; c.textAlign = 'right';
    c.fillText('◯ ' + this.rings, W - 24, H - 30);
    c.restore();
  }
}
