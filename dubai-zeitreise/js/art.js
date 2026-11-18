'use strict';
/* Prozedurale Grafik: alles wird mit Canvas-Formen gezeichnet. */

const Art = {
  ell(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2); c.fill(); },
  circ(c, x, y, r) { c.beginPath(); c.arc(x, y, Math.abs(r), 0, Math.PI * 2); c.fill(); },
  rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); c.fill(); },
  grad(c, x0, y0, x1, y1, stops) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    return g;
  },
  sky(c, stops) { c.fillStyle = this.grad(c, 0, 0, 0, H, stops); c.fillRect(-60, -20, W + 120, H + 40); },
  glow(c, x, y, r, col) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  },

  /* --------- Figuren --------- */
  person(c, x, y, o, t, st = {}) {
    const h = o.h || 110, f = st.facing || 1, walking = !!st.walk;
    const ph = t * 10 + (o.phase || 0);
    c.save();
    c.translate(x, y);
    c.fillStyle = 'rgba(0,0,0,0.22)';
    this.ell(c, 0, 0, h * 0.2, h * 0.045);
    if (st.alpha !== undefined) c.globalAlpha = st.alpha;
    const bob = walking ? Math.abs(Math.sin(ph)) * 3 : Math.sin(t * 2 + (o.phase || 0)) * 0.8;
    c.translate(0, -bob);
    c.scale(f, 1);

    if (st.sit) {
      // sitzend: Schienbein, Schoß, dann Oberkörper auf Sitzhöhe
      const seat = st.seat || 40;
      c.fillStyle = o.shoe || '#3b2a1f';
      this.ell(c, h * 0.31, -3, h * 0.07, h * 0.03);
      c.fillStyle = o.robe;
      this.rr(c, h * 0.21, -seat - 4, h * 0.12, seat + 2, h * 0.05);
      this.rr(c, -h * 0.1, -seat - h * 0.14, h * 0.44, h * 0.16, h * 0.07);
      if (o.robeShade) { c.fillStyle = o.robeShade; this.rr(c, -h * 0.1, -seat - h * 0.03, h * 0.44, h * 0.05, h * 0.02); }
      c.translate(0, h * 0.4 - seat);
    } else {
      const sw = walking ? Math.sin(ph) * h * 0.09 : 0;
      c.fillStyle = o.shoe || '#3b2a1f';
      this.ell(c, sw + h * 0.03, -3, h * 0.06, h * 0.03);
      this.ell(c, -sw + h * 0.03, -3, h * 0.06, h * 0.03);
    }

    const sh = -h * 0.74, hem = -h * 0.06;
    const sway = walking ? Math.sin(ph) * 2 : 0;
    // Robe
    if (!st.sit) {
      c.fillStyle = o.robe;
      c.beginPath();
      c.moveTo(-h * 0.13, sh);
      c.quadraticCurveTo(-h * 0.2, -h * 0.4, -h * 0.21 + sway, hem);
      c.lineTo(h * 0.21 + sway, hem);
      c.quadraticCurveTo(h * 0.2, -h * 0.4, h * 0.13, sh);
      c.closePath();
      c.fill();
      if (o.robeShade) {
        c.fillStyle = o.robeShade;
        c.beginPath();
        c.moveTo(-h * 0.13, sh);
        c.quadraticCurveTo(-h * 0.2, -h * 0.4, -h * 0.21 + sway, hem);
        c.lineTo(-h * 0.08 + sway, hem);
        c.quadraticCurveTo(-h * 0.08, -h * 0.4, -h * 0.05, sh);
        c.fill();
      }
    } else {
      c.fillStyle = o.robe;
      this.rr(c, -h * 0.14, sh, h * 0.28, h * 0.42, h * 0.08);
    }
    // Saum / Verzierung
    if (o.trim) {
      c.strokeStyle = o.trim; c.lineWidth = Math.max(1.5, h * 0.018);
      c.beginPath(); c.moveTo(h * 0.05, sh + 2); c.lineTo(h * 0.07, sh + h * (o.trimLen || 0.22)); c.stroke();
      if (o.hemTrim && !st.sit) { c.beginPath(); c.moveTo(-h * 0.2 + sway, hem - 4); c.lineTo(h * 0.2 + sway, hem - 4); c.stroke(); }
    }
    if (o.glowTrim) {
      c.strokeStyle = o.glowTrim; c.lineWidth = 2;
      c.shadowColor = o.glowTrim; c.shadowBlur = 8;
      c.beginPath(); c.moveTo(-h * 0.12, sh + h * 0.12); c.lineTo(h * 0.14, sh + h * 0.12); c.stroke();
      c.beginPath(); c.moveTo(h * 0.02, sh); c.lineTo(h * 0.04, hem); c.stroke();
      c.shadowBlur = 0;
    }
    // Arme
    const arm = st.sit ? -0.75 : walking ? Math.sin(ph) * 0.45 : (st.wave ? -2.3 + Math.sin(t * 9) * 0.35 : 0.08);
    c.save();
    c.translate(h * 0.02, sh + h * 0.05);
    c.rotate(arm);
    c.fillStyle = o.sleeve || o.robe;
    this.rr(c, -h * 0.045, 0, h * 0.09, h * 0.33, h * 0.04);
    c.fillStyle = o.skin;
    this.circ(c, 0, h * 0.35, h * 0.04);
    c.restore();
    // Hals + Kopf
    const hy = -h * 0.86, hr = h * 0.1;
    c.fillStyle = o.skin;
    this.rr(c, -h * 0.03, sh - h * 0.06, h * 0.06, h * 0.08, 2);
    // Kopfbedeckung hinten
    if (o.head === 'scarf') {
      c.fillStyle = o.headColor;
      c.beginPath();
      c.arc(-hr * 0.1, hy - hr * 0.05, hr * 1.25, Math.PI * 0.75, Math.PI * 2.25);
      c.lineTo(hr * 0.5, sh + h * 0.05);
      c.lineTo(-hr * 1.5, sh + h * 0.12);
      c.closePath(); c.fill();
    } else if (o.head === 'ghutra') {
      c.fillStyle = o.headColor || '#f4f1ea';
      c.beginPath();
      c.moveTo(-hr * 1.15, hy - hr * 0.4);
      c.lineTo(-hr * 1.7, sh + h * 0.1);
      c.lineTo(hr * 0.2, sh + h * 0.02);
      c.lineTo(hr * 0.9, hy - hr * 0.2);
      c.closePath(); c.fill();
    } else if (o.head === 'hairbun') {
      c.fillStyle = o.headColor;
      this.circ(c, -hr * 0.2, hy - hr * 0.1, hr * 1.12);
      this.circ(c, -hr * 1.1, hy - hr * 0.7, hr * 0.55);
    }
    // Gesicht
    c.fillStyle = o.skin;
    this.circ(c, hr * 0.12, hy, hr);
    // Bart
    if (o.beard) {
      c.fillStyle = o.beard;
      c.beginPath(); c.arc(hr * 0.2, hy + hr * 0.25, hr * 0.78, 0.05 * Math.PI, 0.95 * Math.PI); c.fill();
    }
    // Auge + Nase
    c.fillStyle = '#2a1a12';
    this.circ(c, hr * 0.55, hy - hr * 0.12, hr * 0.12);
    c.fillStyle = o.skinShade || 'rgba(0,0,0,0.12)';
    this.ell(c, hr * 1.05, hy + hr * 0.12, hr * 0.14, hr * 0.2);
    if (o.mask) { // Burqa/Batoola (Goldmaske)
      c.fillStyle = o.mask;
      c.beginPath();
      c.moveTo(hr * 0.35, hy - hr * 0.3); c.lineTo(hr * 1.15, hy - hr * 0.3);
      c.lineTo(hr * 1.05, hy + hr * 0.55); c.lineTo(hr * 0.65, hy + hr * 0.3); c.lineTo(hr * 0.35, hy + hr * 0.5);
      c.closePath(); c.fill();
      c.fillStyle = '#2a1a12'; this.circ(c, hr * 0.62, hy - hr * 0.1, hr * 0.1);
    }
    // Kopfbedeckung vorne
    if (o.head === 'scarf') {
      c.fillStyle = o.headColor;
      c.beginPath(); c.arc(hr * 0.1, hy, hr * 1.12, Math.PI * 1.05, Math.PI * 1.85); c.lineTo(hr * 0.1, hy - hr * 0.35); c.closePath(); c.fill();
      if (o.headTrim) { c.strokeStyle = o.headTrim; c.lineWidth = 1.5; c.beginPath(); c.arc(hr * 0.1, hy, hr * 1.12, Math.PI * 1.1, Math.PI * 1.8); c.stroke(); }
    } else if (o.head === 'ghutra') {
      c.fillStyle = o.headColor || '#f4f1ea';
      c.beginPath(); c.arc(hr * 0.1, hy - hr * 0.05, hr * 1.12, Math.PI * 1.0, Math.PI * 1.95); c.closePath(); c.fill();
      c.fillStyle = '#1d1a1a';
      this.rr(c, -hr * 0.9, hy - hr * 0.95, hr * 1.9, hr * 0.22, hr * 0.1);
    } else if (o.head === 'cap') {
      c.fillStyle = o.headColor || '#f4f1ea';
      c.beginPath(); c.arc(hr * 0.12, hy - hr * 0.25, hr * 0.98, Math.PI, 0); c.closePath(); c.fill();
    } else if (o.head === 'wrap') {
      c.fillStyle = o.headColor;
      this.ell(c, hr * 0.1, hy - hr * 0.6, hr * 1.1, hr * 0.55);
      c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(-hr * 0.9, hy - hr * 0.55); c.lineTo(hr * 1.1, hy - hr * 0.8); c.stroke();
    } else if (o.head === 'hairbun') {
      c.fillStyle = o.headColor;
      c.beginPath(); c.arc(hr * 0.1, hy - hr * 0.1, hr * 1.05, Math.PI * 1.05, Math.PI * 1.75); c.closePath(); c.fill();
      if (o.band) {
        c.strokeStyle = o.band; c.lineWidth = 2.5; c.shadowColor = o.band; c.shadowBlur = 10;
        c.beginPath(); c.arc(hr * 0.1, hy - hr * 0.05, hr * 1.02, Math.PI * 1.15, Math.PI * 1.9); c.stroke();
        c.shadowBlur = 0;
      }
    }
    c.restore();
  },

  robot(c, x, y, t) {
    const by = y - 70 + Math.sin(t * 2.2) * 6;
    c.save();
    c.fillStyle = 'rgba(95,242,255,0.18)';
    this.ell(c, x, y, 26 - Math.sin(t * 2.2) * 3, 6);
    this.glow(c, x, by + 30, 40, 'rgba(95,242,255,0.35)');
    // Körper
    c.fillStyle = this.grad(c, x - 24, by - 24, x + 24, by + 24, [[0, '#ffffff'], [1, '#aeb8d6']]);
    this.circ(c, x, by, 24);
    c.fillStyle = '#e9eefc';
    this.ell(c, x, by + 22, 14, 6);
    // Visier
    c.fillStyle = '#10142c';
    this.rr(c, x - 16, by - 9, 32, 14, 7);
    c.fillStyle = '#5ff2ff';
    c.shadowColor = '#5ff2ff'; c.shadowBlur = 10;
    const blink = (t % 3.5) < 0.12 ? 0.3 : 1;
    this.ell(c, x - 6, by - 2, 3, 3 * blink);
    this.ell(c, x + 6, by - 2, 3, 3 * blink);
    c.shadowBlur = 0;
    // Antenne
    c.strokeStyle = '#aeb8d6'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x, by - 24); c.lineTo(x, by - 36); c.stroke();
    c.fillStyle = `hsl(${(t * 80) % 360},90%,65%)`;
    this.circ(c, x, by - 38, 4);
    c.restore();
  },

  /* --------- Zeitkapsel --------- */
  capsule(c, x, y, t, s = {}) {
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.25)';
    this.ell(c, x, y, 70, 10);
    const cy = y - 92;
    if (s.active) this.glow(c, x, cy, 170 + Math.sin(t * 8) * 20, 'rgba(95,242,255,0.45)');
    else if (s.lens) this.glow(c, x, cy - 60, 70 + Math.sin(t * 3) * 10, 'rgba(255,255,255,0.35)');
    // Beine
    c.strokeStyle = '#6b4518'; c.lineWidth = 7; c.lineCap = 'round';
    [[-42, -60], [42, 60], [0, 0]].forEach(([a, b]) => { c.beginPath(); c.moveTo(x + a * 0.6, cy + 40); c.lineTo(x + b, y - 4); c.stroke(); });
    c.fillStyle = '#4e3010';
    [-60, 0, 60].forEach((b) => this.ell(c, x + b, y - 4, 12, 4));
    // Körper
    const g = c.createRadialGradient(x - 22, cy - 26, 8, x, cy, 70);
    g.addColorStop(0, s.era2071 ? '#fff4d6' : '#ffe2a0');
    g.addColorStop(0.45, '#d8a252');
    g.addColorStop(1, '#6e4416');
    c.fillStyle = g;
    this.circ(c, x, cy, 64);
    // Band + Nieten
    c.strokeStyle = '#7a4c18'; c.lineWidth = 6;
    c.beginPath(); c.ellipse(x, cy + 6, 64, 18, 0, 0, Math.PI); c.stroke();
    c.fillStyle = '#ffd98a';
    for (let i = 0; i < 9; i++) { const a = Math.PI * (i + 0.5) / 9; this.circ(c, x + Math.cos(a) * 63, cy + 6 + Math.sin(a) * 18, 2.4); }
    // Bullauge
    c.fillStyle = '#5a3812'; this.circ(c, x - 6, cy - 6, 30);
    const gg = c.createRadialGradient(x - 16, cy - 16, 2, x - 6, cy - 6, 28);
    gg.addColorStop(0, s.active ? '#e6ffff' : '#bfe9ff');
    gg.addColorStop(1, s.active ? '#2bc4d8' : '#1b4b6e');
    c.fillStyle = gg; this.circ(c, x - 6, cy - 6, 25);
    c.fillStyle = 'rgba(255,255,255,0.55)'; this.ell(c, x - 16, cy - 16, 8, 4, -0.6);
    // Linse oben
    c.fillStyle = '#6e4416'; this.rr(c, x - 14, cy - 76, 28, 16, 5);
    if (s.lens) {
      this.glow(c, x, cy - 82, 26, 'rgba(255,255,255,0.9)');
      c.fillStyle = '#fbf8f2'; this.circ(c, x, cy - 80, 9);
      c.fillStyle = 'rgba(200,220,255,0.8)'; this.circ(c, x - 3, cy - 83, 3);
    } else {
      c.fillStyle = '#2a1a08'; this.circ(c, x, cy - 78, 7);
    }
    // Spule rechts
    c.fillStyle = '#6e4416'; this.rr(c, x + 50, cy - 18, 26, 36, 6);
    if (s.coil) {
      c.strokeStyle = '#ff9a4a'; c.lineWidth = 3;
      for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(x + 63, cy - 12 + i * 5, 10, 3, 0, 0, Math.PI * 2); c.stroke(); }
      c.fillStyle = `rgba(255,170,80,${0.35 + Math.sin(t * 6) * 0.25})`; this.circ(c, x + 63, cy, 16);
    } else {
      c.fillStyle = '#2a1a08'; this.rr(c, x + 56, cy - 12, 14, 24, 4);
    }
    // Radio
    if (s.radio) {
      c.fillStyle = '#5b2f1a'; this.rr(c, x - 30, cy - 70, 40, 22, 4);
      c.fillStyle = '#d9c9a3'; this.rr(c, x - 26, cy - 66, 18, 14, 2);
      c.fillStyle = '#222'; this.circ(c, x + 2, cy - 59, 5);
    }
    // Leuchtende Karte
    if (s.card) {
      c.save(); c.translate(x + 30, cy + 28); c.rotate(-0.2);
      this.glow(c, 0, 0, 34, `rgba(255,220,120,${0.5 + Math.sin(t * 4) * 0.2})`);
      c.fillStyle = '#fff6da'; this.rr(c, -12, -8, 24, 16, 2);
      c.strokeStyle = '#e0a63a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-12, -8); c.lineTo(0, 2); c.lineTo(12, -8); c.stroke();
      c.restore();
    }
    // Energiebögen
    if (s.active) {
      c.strokeStyle = `rgba(160,250,255,${0.6 + Math.random() * 0.4})`; c.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        let a = Math.random() * Math.PI * 2, px = x + Math.cos(a) * 64, py = cy + Math.sin(a) * 64;
        c.moveTo(px, py);
        for (let j = 0; j < 4; j++) { px += Math.cos(a) * 14 + rand(-10, 10); py += Math.sin(a) * 14 + rand(-10, 10); c.lineTo(px, py); }
        c.stroke();
      }
    }
    if (s.steam) {
      for (let i = 0; i < 4; i++) {
        const k = ((t * 0.4 + i / 4) % 1);
        c.fillStyle = `rgba(255,255,255,${0.25 * (1 - k)})`;
        this.circ(c, x - 30 + i * 20 + Math.sin(t + i) * 8, cy - 70 - k * 90, 10 + k * 22);
      }
    }
    c.restore();
  },

  /* --------- Architektur 1971 --------- */
  windtower(c, x, top, w, base, col, shade) {
    c.fillStyle = col;
    c.fillRect(x, top, w, base - top);
    // Krone
    c.fillStyle = shade;
    c.fillRect(x - 6, top - 6, w + 12, 10);
    for (let i = 0; i <= 6; i++) { c.fillStyle = col; c.fillRect(x - 6 + i * (w + 12) / 7, top - 16, (w + 12) / 14, 12); }
    // Lamellen
    const sh = (base - top) * 0.55;
    c.fillStyle = 'rgba(60,35,20,0.75)';
    const n = Math.max(3, Math.round(w / 16));
    for (let i = 0; i < n; i++) {
      const sx = x + 8 + i * (w - 16) / n;
      c.fillRect(sx, top + 14, (w - 16) / n - 5, sh);
    }
    c.fillStyle = shade;
    c.fillRect(x, top + 14 + sh, w, 6);
    // Holzstangen
    c.strokeStyle = '#5c3b22'; c.lineWidth = 3;
    for (let i = 0; i < 3; i++) { const yy = top + 30 + i * 30; c.beginPath(); c.moveTo(x - 10, yy); c.lineTo(x + w + 10, yy + 2); c.stroke(); }
  },
  crenels(c, x0, x1, y, col, size = 12) {
    c.fillStyle = col;
    for (let x = x0; x < x1; x += size * 2) {
      c.beginPath();
      c.moveTo(x, y); c.lineTo(x + size * 0.5, y - size * 1.1); c.lineTo(x + size, y);
      c.fill();
    }
  },
  palm(c, x, base, h, t, opts = {}) {
    c.save();
    const sway = Math.sin(t * 0.8 + x) * 4;
    c.strokeStyle = opts.trunk || '#7a5532'; c.lineCap = 'round';
    const segs = 14;
    for (let i = 0; i < segs; i++) {
      const k0 = i / segs, k1 = (i + 1) / segs;
      c.lineWidth = lerp(h * 0.07, h * 0.04, k0);
      c.beginPath();
      c.moveTo(x + Math.sin(k0 * 1.4) * h * 0.08 + sway * k0, base - k0 * h);
      c.lineTo(x + Math.sin(k1 * 1.4) * h * 0.08 + sway * k1, base - k1 * h);
      c.stroke();
    }
    const tx = x + Math.sin(1.4) * h * 0.08 + sway, ty = base - h;
    c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 1;
    for (let i = 0; i < segs; i++) { const k = i / segs, yy = base - k * h, xx = x + Math.sin(k * 1.4) * h * 0.08 + sway * k; c.beginPath(); c.moveTo(xx - h * 0.03, yy); c.lineTo(xx + h * 0.03, yy - 3); c.stroke(); }
    // Datteln
    if (!opts.noFruit) { c.fillStyle = '#c0652a'; for (let i = 0; i < 7; i++) this.circ(c, tx - 8 + (i % 4) * 5, ty + 8 + Math.floor(i / 4) * 5, 3.5); }
    // Wedel
    const fronds = 9;
    for (let i = 0; i < fronds; i++) {
      const a = -Math.PI + (i / (fronds - 1)) * Math.PI + Math.sin(t * 1.2 + i) * 0.04;
      const len = h * (0.42 + (i % 2) * 0.08) * (opts.frondScale || 1);
      const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.55 + len * 0.35;
      const mx = tx + Math.cos(a) * len * 0.5, my = ty + Math.sin(a) * len * 0.5 - len * 0.12;
      c.strokeStyle = opts.frond || '#3f7a3a'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
      c.strokeStyle = opts.frond2 || '#5e9b48'; c.lineWidth = 1.6;
      for (let j = 1; j < 9; j++) {
        const k = j / 9;
        const px = (1 - k) * (1 - k) * tx + 2 * (1 - k) * k * mx + k * k * ex;
        const py = (1 - k) * (1 - k) * ty + 2 * (1 - k) * k * my + k * k * ey;
        const l = (1 - k * 0.6) * h * 0.08;
        c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a + 1.2) * l, py + Math.sin(a + 1.2) * l + l * 0.6); c.stroke();
        c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a - 1.2) * l, py + Math.sin(a - 1.2) * l + l * 0.6); c.stroke();
      }
    }
    c.restore();
  },
  door(c, x, y, w, h) {
    c.fillStyle = '#6b4a2b';
    c.beginPath(); c.moveTo(x - 8, y + h); c.lineTo(x - 8, y + w * 0.5); c.arc(x + w / 2, y + w * 0.5, w / 2 + 8, Math.PI, 0); c.lineTo(x + w + 8, y + h); c.fill();
    c.fillStyle = '#7a4a22';
    c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w * 0.5); c.arc(x + w / 2, y + w * 0.5, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.fill();
    c.strokeStyle = '#4a2d14'; c.lineWidth = 2;
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x + i * w / 4, y + 10); c.lineTo(x + i * w / 4, y + h); c.stroke(); }
    c.fillStyle = '#d9b46a';
    for (let r = 0; r < 5; r++) for (let i = 0; i < 3; i++) this.circ(c, x + (i + 0.5) * w / 3, y + w * 0.45 + r * (h - w * 0.5) / 5, 2);
  },
  shutterWindow(c, x, y, w, h) {
    c.fillStyle = '#5c3b22'; c.fillRect(x - 4, y - 4, w + 8, h + 8);
    c.fillStyle = '#2b1a0e'; c.fillRect(x, y, w, h);
    c.strokeStyle = '#8a6440'; c.lineWidth = 2;
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x + i * w / 4, y); c.lineTo(x + i * w / 4, y + h); c.stroke(); }
    for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(x, y + i * h / 4); c.lineTo(x + w, y + i * h / 4); c.stroke(); }
  },
  dhow(c, x, y, s, t, col = '#8a5a30') {
    c.save(); c.translate(x, y + Math.sin(t * 1.3 + x) * 2); c.scale(s, s);
    c.fillStyle = col;
    c.beginPath(); c.moveTo(-90, -14); c.lineTo(110, -24); c.quadraticCurveTo(80, 12, 40, 14); c.lineTo(-70, 14); c.quadraticCurveTo(-88, 4, -90, -14); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(-80, -4, 170, 4);
    c.strokeStyle = '#4a2f18'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(-10, -16); c.lineTo(0, -150); c.stroke();
    c.lineWidth = 3; c.beginPath(); c.moveTo(-70, -60); c.lineTo(70, -150); c.stroke();
    c.fillStyle = 'rgba(245,236,214,0.92)';
    c.beginPath(); c.moveTo(-60, -66); c.lineTo(66, -146); c.lineTo(46, -40); c.closePath(); c.fill();
    c.restore();
  },
  abra(c, x, y, t) {
    c.save(); c.translate(x, y + Math.sin(t * 1.7) * 2.5);
    c.fillStyle = '#7a4a26';
    c.beginPath(); c.moveTo(-110, -16); c.lineTo(110, -16); c.quadraticCurveTo(100, 14, 70, 14); c.lineTo(-70, 14); c.quadraticCurveTo(-100, 14, -110, -16); c.fill();
    c.fillStyle = '#d7b98a'; c.fillRect(-100, -22, 200, 7);
    c.fillStyle = '#5b3418';
    for (let i = -3; i <= 3; i++) c.fillRect(i * 28 - 2, -54, 4, 34);
    c.fillStyle = '#e8d6b0'; c.fillRect(-104, -60, 208, 8);
    c.restore();
  },

  /* --------- Architektur 2071 --------- */
  tower(c, x, base, w, h, o, t) {
    c.save();
    c.fillStyle = o.body;
    c.beginPath();
    if (o.shape === 'spire') {
      c.moveTo(x, base); c.lineTo(x + w * 0.1, base - h * 0.75); c.lineTo(x + w * 0.5, base - h); c.lineTo(x + w * 0.9, base - h * 0.75); c.lineTo(x + w, base);
    } else if (o.shape === 'sail') {
      c.moveTo(x, base); c.quadraticCurveTo(x + w * 0.1, base - h * 0.6, x + w * 0.3, base - h); c.quadraticCurveTo(x + w * 1.05, base - h * 0.55, x + w, base);
    } else if (o.shape === 'step') {
      c.moveTo(x, base); c.lineTo(x, base - h * 0.6); c.lineTo(x + w * 0.15, base - h * 0.6); c.lineTo(x + w * 0.15, base - h * 0.85); c.lineTo(x + w * 0.35, base - h * 0.85); c.lineTo(x + w * 0.4, base - h); c.lineTo(x + w * 0.6, base - h * 0.85); c.lineTo(x + w * 0.85, base - h * 0.85); c.lineTo(x + w * 0.85, base - h * 0.6); c.lineTo(x + w, base - h * 0.6); c.lineTo(x + w, base);
    } else if (o.shape === 'twist') {
      c.moveTo(x, base); c.bezierCurveTo(x - w * 0.15, base - h * 0.4, x + w * 0.25, base - h * 0.7, x + w * 0.2, base - h); c.lineTo(x + w * 0.8, base - h); c.bezierCurveTo(x + w * 0.75, base - h * 0.7, x + w * 1.15, base - h * 0.4, x + w, base);
    } else {
      c.rect(x, base - h, w, h);
    }
    c.closePath();
    c.fill();
    if (o.edge) {
      c.strokeStyle = o.edge; c.lineWidth = 1.5; c.shadowColor = o.edge; c.shadowBlur = 8; c.stroke(); c.shadowBlur = 0;
    }
    c.save(); c.clip();
    if (o.windows) {
      const r = seeded(o.seed || 1);
      for (let yy = base - h + 8; yy < base; yy += 9) {
        for (let xx = x + 3; xx < x + w - 3; xx += 7) {
          const v = r();
          if (v < (o.lit || 0.35)) {
            c.fillStyle = v < 0.05 ? o.accent || '#5ff2ff' : o.windows;
            c.fillRect(xx, yy, 3.5, 3);
          }
        }
      }
    }
    if (o.stripe) {
      c.fillStyle = o.stripe;
      const k = (t * 0.25 + (o.seed || 0) * 0.13) % 1;
      c.fillRect(x, base - h + k * h, w, 3);
    }
    c.restore();
    if (o.beacon) {
      c.fillStyle = Math.sin(t * 3 + (o.seed || 0)) > 0 ? '#ff4a5a' : 'rgba(255,74,90,0.3)';
      const bx = o.shape === 'sail' ? x + w * 0.3 : x + w * 0.5;
      this.circ(c, bx, base - h - 2, 2.5);
    }
    c.restore();
  },
  stars(c, list, t) {
    for (const s of list) {
      c.fillStyle = `rgba(255,255,255,${s.a * (0.6 + 0.4 * Math.sin(t * s.sp + s.x))})`;
      c.fillRect(s.x, s.y, s.r, s.r);
    }
  },
  flag(c, x, y, w, h, t) {
    // VAE-Flagge, weht leicht
    c.save();
    const cols = ['#00843d', '#ffffff', '#111111'];
    const seg = 10;
    for (let i = 0; i < seg; i++) {
      const k0 = i / seg, k1 = (i + 1) / seg;
      const off0 = Math.sin(t * 4 + k0 * 5) * 3 * k0, off1 = Math.sin(t * 4 + k1 * 5) * 3 * k1;
      const x0 = x + k0 * w, x1 = x + k1 * w + 0.6;
      if (k0 < 0.25) {
        c.fillStyle = '#e31b23';
        c.beginPath(); c.moveTo(x0, y + off0); c.lineTo(x1, y + off1); c.lineTo(x1, y + h + off1); c.lineTo(x0, y + h + off0); c.fill();
      } else {
        for (let j = 0; j < 3; j++) {
          c.fillStyle = cols[j];
          c.beginPath(); c.moveTo(x0, y + off0 + j * h / 3); c.lineTo(x1, y + off1 + j * h / 3); c.lineTo(x1, y + off1 + (j + 1) * h / 3); c.lineTo(x0, y + off0 + (j + 1) * h / 3); c.fill();
        }
      }
    }
    c.restore();
  },
  bunting(c, x0, x1, y, sag, t) {
    c.strokeStyle = '#3a2a1a'; c.lineWidth = 1.5;
    c.beginPath();
    for (let i = 0; i <= 20; i++) {
      const k = i / 20, xx = lerp(x0, x1, k), yy = y + Math.sin(k * Math.PI) * sag;
      i ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
    }
    c.stroke();
    const cols = ['#e31b23', '#00843d', '#ffffff', '#111111'];
    const n = Math.round((x1 - x0) / 26);
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n, xx = lerp(x0, x1, k), yy = y + Math.sin(k * Math.PI) * sag;
      c.fillStyle = cols[i % 4];
      const sw = Math.sin(t * 3 + i) * 2;
      c.beginPath(); c.moveTo(xx - 8, yy); c.lineTo(xx + 8, yy); c.lineTo(xx + sw, yy + 16); c.fill();
    }
  },
};
