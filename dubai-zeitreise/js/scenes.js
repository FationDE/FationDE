'use strict';
/* Point-and-Click-Szenen: Dubai 1971 (Innenhof, Souk, Creek) und der Innenhof 2071. */

Object.assign(STR.de, {
  lb_barjeel: 'Windturm', lb_palm: 'Dattelpalme', lb_capsule: 'Zeitkapsel', lb_flags: 'Fahnen', lb_dhow: 'Dhau',
  lb_creek: 'Creek', lb_vitrine: 'Vitrine', lb_holo: 'Hologramm', lb_souk: 'Souk', lb_creekExit: 'Zum Creek', lb_home: 'Nach Hause', lb_skyway: 'Skyway',
});
Object.assign(STR.en, {
  lb_barjeel: 'Wind tower', lb_palm: 'Date palm', lb_capsule: 'Time capsule', lb_flags: 'Flags', lb_dhow: 'Dhow',
  lb_creek: 'Creek', lb_vitrine: 'Display case', lb_holo: 'Hologram', lb_souk: 'Souk', lb_creekExit: 'To the Creek', lb_home: 'Home', lb_skyway: 'Skyway',
});

const CHARS = {
  mariam: { h: 104, skin: '#c58a5e', robe: '#1f8f8a', robeShade: 'rgba(0,0,0,0.13)', sleeve: '#1a7c78', trim: '#f2c46d', hemTrim: true, head: 'scarf', headColor: '#b8323f', headTrim: '#f2c46d', shoe: '#5a2a1a' },
  grandma: { h: 110, skin: '#b97d55', robe: '#1d1922', robeShade: 'rgba(255,255,255,0.05)', trim: '#c9a24a', trimLen: 0.5, hemTrim: true, head: 'scarf', headColor: '#141117', mask: '#c9a24a', phase: 1 },
  yusuf: { h: 122, skin: '#b67b52', robe: '#f2efe6', robeShade: 'rgba(0,0,0,0.08)', trim: '#d9d2c0', head: 'ghutra', headColor: '#f6f3ec', beard: '#3a2a20', phase: 2 },
  khalid: { h: 118, skin: '#a86b44', robe: '#c8b08a', robeShade: 'rgba(0,0,0,0.12)', head: 'cap', headColor: '#f3efe4', beard: '#2a1d16', sleeve: '#b89c74', phase: 3 },
  saif: { h: 120, skin: '#9a6040', robe: '#6d8aa6', robeShade: 'rgba(0,0,0,0.15)', head: 'wrap', headColor: '#e9dcc0', beard: '#2a1d16', phase: 4 },
  abuali: { h: 118, skin: '#a56b48', robe: '#ece7da', robeShade: 'rgba(0,0,0,0.08)', head: 'ghutra', headColor: '#ffffff', beard: '#e8e4dc', phase: 5 },
  noor: { h: 104, skin: '#c58a5e', robe: '#eef3ff', robeShade: 'rgba(80,90,160,0.18)', sleeve: '#dfe6ff', glowTrim: '#5ff2ff', head: 'hairbun', headColor: '#2a1c18', band: '#ff8de0', shoe: '#2a2f4a', phase: 6 },
};

const FLOOR = 470;

/* ---------------- Gemeinsame Kulissen ---------------- */
function drawOldHouse(c, t, lit) {
  // Hauswand mit Windturm, Tür, Fenstern und Arkade (Innenhof)
  const wall = lit ? '#c9a678' : '#dcbf92', shade = lit ? '#a8865c' : '#c4a273';
  Art.windtower(c, 110, 30, 120, 180, wall, shade);
  c.fillStyle = wall;
  c.fillRect(-70, 170, 1100, 250);
  Art.crenels(c, -70, 1030, 172, wall, 11);
  c.fillStyle = shade;
  c.fillRect(-70, 196, 1100, 6);
  // Steinstruktur
  c.strokeStyle = 'rgba(120,85,50,0.13)'; c.lineWidth = 1;
  const r = seeded(11);
  for (let y = 214; y < 410; y += 16) {
    c.beginPath(); c.moveTo(-70, y); c.lineTo(1030, y); c.stroke();
    for (let x = -70 + (y % 32); x < 1030; x += 36 + r() * 30) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 16); c.stroke(); }
  }
  Art.door(c, 430, 280, 74, 130);
  Art.shutterWindow(c, 300, 250, 50, 60);
  Art.shutterWindow(c, 560, 250, 46, 56);
  // Arkade (Liwan)
  for (let i = 0; i < 3; i++) {
    const ax = 670 + i * 92;
    const g = Art.grad(c, 0, 260, 0, 410, [[0, lit ? '#2a1830' : '#6a4a2c'], [1, lit ? '#4a2a3a' : '#8a6a44']]);
    c.fillStyle = g;
    c.beginPath(); c.moveTo(ax, 410); c.lineTo(ax, 300); c.arc(ax + 36, 300, 36, Math.PI, 0); c.lineTo(ax + 72, 410); c.fill();
    if (lit) Art.glow(c, ax + 36, 300, 50, 'rgba(255,190,110,0.35)');
  }
  c.fillStyle = shade;
  c.fillRect(655, 248, 300, 8);
}

function drawPersonAt(c, who, x, t, facing, st = {}) {
  Art.person(c, x, st.y || FLOOR, CHARS[who], t, Object.assign({ facing }, st));
}

function departure(adv) {
  return (async () => {
    const f = G.flags;
    G.take('radio');
    f.radioIn = true;
    await UI.say([[null, 'f1']]);
    Sfx.noise(1.4, 0.06, 1800);
    await UI.say([['radio', 'f2']]);
    adv.sc.active = true;
    Sfx.warp();
    Engine.shake = 6;
    await UI.say([['capsule', 'f3'], ['grandma', 'f4'], ['mariam', 'f5']]);
    adv.boarding = true;
    await adv.walkTo(640);
    Engine.flash = 1;
    Sfx.boom();
    await sleep(350);
    await Engine.fadeTo(() => Engine.setMode(new Tunnel()), 1.6);
  })();
}

/* ---------------- Szenen ---------------- */
const SCENES = {
  /* ===== Innenhof 1971 ===== */
  home71: {
    chapter: 'ch1', music: '1971',
    init() {
      const r = seeded(3);
      this.far = [];
      for (let x = -80; x < 1060; x += 70 + r() * 50) this.far.push({ x, w: 60 + r() * 70, h: 30 + r() * 50, tower: r() < 0.35 });
    },
    drawBack(c, t, cam) {
      Art.sky(c, [[0, '#6fb6e2'], [0.5, '#bfe0ee'], [1, '#f3e2c0']]);
      Art.glow(c, 820 - cam * 0.05, 80, 140, 'rgba(255,246,214,0.9)');
      c.fillStyle = '#fff8e4'; Art.circ(c, 820 - cam * 0.05, 80, 26);
      c.save(); c.translate(-cam * 0.3, 0);
      for (const b of this.far) {
        c.fillStyle = '#e4cfa6';
        c.fillRect(b.x, 175 - b.h, b.w, b.h + 10);
        if (b.tower) { c.fillStyle = '#d9c094'; c.fillRect(b.x + b.w * 0.3, 175 - b.h - 40, 26, 44); c.fillStyle = 'rgba(80,50,30,.4)'; c.fillRect(b.x + b.w * 0.3 + 5, 175 - b.h - 32, 16, 18); }
      }
      c.fillStyle = '#e8d5ae'; c.fillRect(760, 40, 18, 140); c.fillRect(754, 70, 30, 6); Art.circ(c, 769, 40, 11);
      c.restore();
      c.save(); c.translate(-cam * 0.6, 0);
      drawOldHouse(c, t, false);
      Art.bunting(c, 250, 650, 205, 18, t);
      c.restore();
      // Boden
      c.save(); c.translate(-cam, 0);
      c.fillStyle = Art.grad(c, 0, 405, 0, 540, [[0, '#d9c194'], [1, '#e9d5aa']]);
      c.fillRect(-80, 405, 1120, 140);
      c.fillStyle = 'rgba(150,110,60,0.12)';
      const r = seeded(5);
      for (let i = 0; i < 60; i++) Art.ell(c, r() * 1100 - 60, 420 + r() * 110, 4 + r() * 10, 1.5 + r() * 2);
      // Teppich + Kaffeeset bei Großmutter
      c.fillStyle = '#9b2c2c'; c.beginPath(); c.ellipse(300, 478, 110, 22, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#e0b04a'; c.lineWidth = 2; c.beginPath(); c.ellipse(300, 478, 96, 17, 0, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#c99a3a'; Art.ell(c, 372, 474, 9, 12); c.fillRect(368, 458, 8, 6); c.beginPath(); c.moveTo(381, 468); c.lineTo(392, 460); c.lineTo(383, 474); c.fill();
      c.restore();
    },
    drawFront(c, t, cam) {
      c.save(); c.translate(-cam * 1.25, 0);
      // Tonkrug im Vordergrund
      c.fillStyle = '#a5643a'; Art.ell(c, 30, 520, 46, 54); c.fillStyle = '#8a4f2c'; c.fillRect(8, 456, 44, 14);
      c.restore();
    },
    exits: { right: { to: 'souk71', spawn: 70, label: 'lb_souk' } },
    hotspots: [
      { id: 'barjeel', x: 170, y: 175, w: 140, h: 160, label: 'lb_barjeel', stand: 200, look: true,
        act: () => UI.say([['mariam', 'look_barjeel']]) },
      { id: 'palm', x: 880, y: FLOOR, w: 80, h: 320, label: 'lb_palm', stand: 820, look: true,
        draw: (c, t) => Art.palm(c, 880, FLOOR + 6, 300, t),
        act: () => UI.say([['mariam', 'look_palm']]) },
      { id: 'grandma', x: 290, y: FLOOR, w: 70, h: 125, label: 'n_grandma', stand: 380,
        draw: (c, t, adv) => drawPersonAt(c, 'grandma', 290, t, adv.px >= 290 ? 1 : -1),
        act: async () => {
          const f = G.flags;
          if (!f.readInv) return UI.say([['grandma', 'g_pre']]);
          if (!f.talkedGrandma) {
            await UI.say([['mariam', 'm_g1'], ['grandma', 'g_1'], ['grandma', 'g_2'], ['mariam', 'm_g2'], ['grandma', 'g_3'], ['grandma', 'g_4']]);
            G.give('dates');
            await UI.say([['grandma', 'g_5']]);
            f.talkedGrandma = true;
            return;
          }
          if (G.has('cardamom')) {
            G.take('cardamom');
            await UI.say([['grandma', 'g_card1'], [null, 'g_card2'], ['grandma', 'g_card3']]);
            G.give('gahwa');
            return;
          }
          if (f.lens && f.coilIn && !G.has('radio') && !f.radioIn) {
            await UI.say([['mariam', 'm_g_radio'], ['grandma', 'g_radio1']]);
            G.give('radio');
            return;
          }
          let k = 'g_idle_install';
          if (G.has('radio')) k = 'g_idle_radio';
          else if (G.has('gahwa')) k = 'g_idle_gahwa';
          else if (!f.lens && !G.has('pearl')) k = 'g_idle_pearl';
          else if (!f.coilIn && !G.has('coil')) k = 'g_idle_coil';
          return UI.say([['grandma', k]]);
        } },
      { id: 'capsule', x: 640, y: FLOOR, w: 160, h: 190, label: 'lb_capsule', stand: 545,
        draw: (c, t, adv) => {
          const f = G.flags;
          Art.capsule(c, 640, FLOOR, t, { lens: f.lens, coil: f.coilIn, radio: f.radioIn, card: !f.readInv, active: adv.sc.active });
        },
        act: async (adv) => {
          const f = G.flags;
          if (!f.readInv) {
            await UI.say([[null, 'cap_first1'], ['letter', 'inv_text'], ['letter', 'inv_text2'], ['mariam', 'cap_first2']]);
            f.readInv = true;
            G.give('invite');
            return;
          }
          let did = false;
          if (G.has('pearl')) { G.take('pearl'); f.lens = true; Sfx.success(); await UI.say([[null, 'cap_lens']]); did = true; }
          if (G.has('coil')) { G.take('coil'); f.coilIn = true; Sfx.success(); await UI.say([[null, 'cap_coil']]); did = true; }
          if (f.lens && f.coilIn) {
            if (G.has('radio')) return departure(adv);
            return UI.say([['capsule', 'cap_need_signal'], ['mariam', 'cap_need_signal2']]);
          }
          if (!did) {
            const miss = [];
            if (!f.lens) miss.push(T('it_pearl'));
            if (!f.coilIn) miss.push(T('it_coil'));
            return UI.say([[null, 'cap_missing', { list: miss.join(' + ') }]]);
          }
        } },
    ],
  },

  /* ===== Souk 1971 ===== */
  souk71: {
    chapter: 'ch1', music: '1971',
    init() {
      const r = seeded(21);
      this.goods = [];
      const cols = ['#c0392b', '#e67e22', '#2e86ab', '#8e44ad', '#d4ac0d', '#16a085', '#d35400', '#a93226'];
      for (let i = 0; i < 8; i++) {
        const ax = -20 + i * 135;
        const n = 3 + Math.floor(r() * 3);
        for (let j = 0; j < n; j++) this.goods.push({ kind: 'cloth', x: ax + 14 + j * (72 / n), y: 236, w: 72 / n - 4, h: 60 + r() * 70, c: cols[Math.floor(r() * cols.length)] });
        for (let j = 0; j < 3; j++) this.goods.push({ kind: 'pot', x: ax + 22 + j * 28, y: 398, w: 10 + r() * 5, c: r() < 0.5 ? '#b5651d' : '#8d5524' });
      }
    },
    drawBack(c, t, cam) {
      Art.sky(c, [[0, '#3a2414'], [1, '#6a4a2c']]);
      c.save(); c.translate(-cam * 0.5, 0);
      // Ladenfront hinten
      c.fillStyle = '#c9a77a'; c.fillRect(-60, 160, 1100, 260);
      for (let i = 0; i < 8; i++) {
        const ax = -20 + i * 135;
        c.fillStyle = '#4a2e18';
        c.beginPath(); c.moveTo(ax, 410); c.lineTo(ax, 250); c.arc(ax + 50, 250, 50, Math.PI, 0); c.lineTo(ax + 100, 410); c.fill();
        Art.glow(c, ax + 50, 280, 60, 'rgba(255,190,100,0.25)');
      }
      for (const g of this.goods) {
        c.fillStyle = g.c;
        if (g.kind === 'cloth') {
          const sw = Math.sin(t * 1.2 + g.x) * 2;
          c.beginPath(); c.moveTo(g.x, g.y); c.lineTo(g.x + g.w, g.y); c.lineTo(g.x + g.w + sw, g.y + g.h); c.lineTo(g.x + sw, g.y + g.h - 6); c.fill();
          c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(g.x, g.y + 10, g.w, 3);
        } else {
          Art.ell(c, g.x, g.y, g.w, g.w * 1.1); c.fillRect(g.x - g.w * 0.4, g.y - g.w * 1.5, g.w * 0.8, g.w * 0.6);
        }
      }
      // Laternen
      for (let i = 0; i < 6; i++) {
        const lx = 60 + i * 175, ly = 190 + Math.sin(t * 1.5 + i) * 2;
        c.strokeStyle = '#2a1a0e'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(lx, 120); c.lineTo(lx, ly - 12); c.stroke();
        Art.glow(c, lx, ly, 34, 'rgba(255,200,110,0.55)');
        c.fillStyle = '#e9a83a'; Art.rr(c, lx - 7, ly - 12, 14, 22, 4);
      }
      c.restore();
      // Dach aus Palmwedeln mit Lichtschächten
      c.save(); c.translate(-cam * 0.75, 0);
      c.fillStyle = '#5a3a1e'; c.fillRect(-80, 0, 1140, 130);
      c.fillStyle = '#4a2e16';
      for (let x = -80; x < 1060; x += 9) c.fillRect(x, 0, 4, 128);
      for (let i = 0; i < 6; i++) {
        const bx = -40 + i * 190;
        c.fillStyle = '#3a2410'; c.fillRect(bx, 118, 1200, 0);
        c.fillStyle = '#2e1c0c'; c.fillRect(bx, 0, 14, 140);
      }
      c.fillStyle = '#3a2410'; c.fillRect(-80, 124, 1140, 14);
      Art.bunting(c, 0, 960, 140, 30, t);
      c.restore();
      // Lichtstrahlen
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) {
        const lx = 80 + i * 200 - cam * 0.75;
        const a = 0.07 + Math.sin(t * 0.7 + i) * 0.025;
        c.fillStyle = `rgba(255,220,150,${a})`;
        c.beginPath(); c.moveTo(lx, 130); c.lineTo(lx + 30, 130); c.lineTo(lx + 150, 540); c.lineTo(lx + 60, 540); c.fill();
      }
      c.restore();
      // Boden
      c.save(); c.translate(-cam, 0);
      c.fillStyle = Art.grad(c, 0, 405, 0, 540, [[0, '#b8946a'], [1, '#d7b98a']]);
      c.fillRect(-80, 405, 1120, 140);
      c.restore();
    },
    drawFront(c, t, cam) {
      c.save(); c.translate(-cam * 1.3, 0);
      // Säcke im Vordergrund
      const sacks = [[20, '#c78a3a', '#e3a43a'], [930, '#b56a2a', '#a8322a']];
      for (const [x, s, top] of sacks) {
        c.fillStyle = s; Art.rr(c, x - 40, 470, 80, 80, 18);
        c.fillStyle = top; Art.ell(c, x, 474, 34, 10);
      }
      c.restore();
    },
    exits: { left: { to: 'home71', spawn: 880, label: 'lb_home' }, right: { to: 'creek71', spawn: 70, label: 'lb_creekExit' } },
    hotspots: [
      { id: 'flags', x: 480, y: 175, w: 600, h: 60, label: 'lb_flags', stand: 480, look: true,
        act: () => UI.say([['mariam', 'look_flags']]) },
      { id: 'yusuf', x: 290, y: FLOOR, w: 220, h: 150, label: 'n_yusuf', stand: 430,
        draw: (c, t, adv) => {
          drawPersonAt(c, 'yusuf', 290, t, adv.px >= 290 ? 1 : -1, { y: 440 });
          // Gewürzstand
          c.fillStyle = '#6b4424'; c.fillRect(190, 420, 200, 52);
          c.fillStyle = '#7d5230'; c.fillRect(186, 414, 208, 10);
          const spices = [['#e2a12a', 214], ['#b8321f', 258], ['#5f8a2e', 302], ['#7a4a26', 346]];
          for (const [col, x] of spices) {
            c.fillStyle = '#c9a670'; Art.rr(c, x - 22, 400, 44, 26, 8);
            c.fillStyle = col; c.beginPath(); c.moveTo(x - 20, 404); c.quadraticCurveTo(x, 376, x + 20, 404); c.fill();
          }
        },
        act: async () => {
          const f = G.flags;
          if (G.has('dates')) {
            G.take('dates');
            await UI.say([['yusuf', 'y_d1'], ['yusuf', 'y_d2']]);
            G.give('cardamom');
            f.gotCard = true;
            return;
          }
          if (f.gotCard) return UI.say([['yusuf', 'y_after']]);
          return UI.say([['yusuf', 'y_1'], ['yusuf', 'y_2']]);
        } },
      { id: 'khalid', x: 700, y: FLOOR, w: 200, h: 160, label: 'n_khalid', stand: 575,
        draw: (c, t, adv) => {
          // Kupfertöpfe am Balken
          c.strokeStyle = '#3a2410'; c.lineWidth = 6; c.beginPath(); c.moveTo(610, 300); c.lineTo(800, 300); c.stroke();
          for (let i = 0; i < 5; i++) {
            const px = 625 + i * 40, py = 318 + Math.sin(t * 1.2 + i) * 1.5;
            c.strokeStyle = '#3a2410'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px, 300); c.lineTo(px, py - 10); c.stroke();
            c.fillStyle = Art.grad(c, px - 14, py, px + 14, py, [[0, '#a5521f'], [0.5, '#f0a060'], [1, '#8a3f14']]);
            c.beginPath(); c.arc(px, py, 14, 0, Math.PI); c.fill(); c.fillRect(px - 15, py - 4, 30, 5);
          }
          drawPersonAt(c, 'khalid', 720, t, adv.px >= 720 ? 1 : -1, { y: 445 });
          // Amboss
          c.fillStyle = '#3c3c44'; c.fillRect(650, 440, 50, 14); c.fillRect(662, 452, 26, 18); c.fillRect(652, 466, 46, 6);
          c.fillStyle = '#5a5a66'; c.beginPath(); c.moveTo(700, 440); c.lineTo(716, 440); c.lineTo(700, 450); c.fill();
          // Dallahs
          c.fillStyle = '#d08a3a'; Art.ell(c, 770, 462, 12, 14); c.fillStyle = '#b8722a'; Art.ell(c, 800, 465, 10, 11);
        },
        act: async () => {
          const f = G.flags;
          if (G.has('hammer')) {
            G.take('hammer');
            await UI.say([['khalid', 'k_h1'], [null, 'k_h2']]);
            for (let i = 0; i < 3; i++) Sfx.tone(1400, 0.12, 'square', 0.05, -300, i * 0.18);
            await UI.say([['khalid', 'k_h3'], ['mariam', 'm_k'], ['khalid', 'k_h4']]);
            G.give('coil');
            f.gotCoil = true;
            return;
          }
          if (f.gotCoil) return UI.say([['khalid', 'k_after']]);
          await UI.say([['khalid', 'k_1'], ['khalid', 'k_2']]);
          f.talkedKhalid = true;
        } },
    ],
  },

  /* ===== Creek 1971 ===== */
  creek71: {
    chapter: 'ch1', music: '1971',
    init() {
      const r = seeded(31);
      this.bank = [];
      for (let x = -80; x < 1080; x += 40 + r() * 50) this.bank.push({ x, w: 40 + r() * 60, h: 16 + r() * 30, tower: r() < 0.3, palm: r() < 0.2 });
    },
    drawBack(c, t, cam) {
      Art.sky(c, [[0, '#5aa9db'], [0.55, '#b7dcee'], [1, '#e8f1ee']]);
      Art.glow(c, 180, 70, 120, 'rgba(255,250,225,0.85)');
      c.fillStyle = '#fffbe9'; Art.circ(c, 180, 70, 24);
      c.save(); c.translate(-cam * 0.25, 0);
      for (const b of this.bank) {
        c.fillStyle = '#d9c39a'; c.fillRect(b.x, 290 - b.h, b.w, b.h + 6);
        if (b.tower) { c.fillStyle = '#cdb68a'; c.fillRect(b.x + b.w * 0.4, 290 - b.h - 26, 16, 28); }
        if (b.palm) { c.strokeStyle = '#6a8a52'; c.lineWidth = 2; c.beginPath(); c.moveTo(b.x + 6, 290 - b.h); c.lineTo(b.x + 10, 290 - b.h - 30); c.stroke(); c.fillStyle = '#5e8a46'; Art.ell(c, b.x + 10, 290 - b.h - 32, 14, 5); }
      }
      c.fillStyle = '#e2cfaa'; c.fillRect(620, 190, 14, 100); c.fillRect(615, 214, 24, 5); Art.circ(c, 627, 190, 9);
      c.restore();
      // Wasser
      c.save(); c.translate(-cam * 0.5, 0);
      c.fillStyle = Art.grad(c, 0, 290, 0, 420, [[0, '#4b9fb0'], [1, '#2e7d8f']]);
      c.fillRect(-80, 290, 1140, 140);
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.5;
      for (let i = 0; i < 26; i++) {
        const wy = 300 + (i % 8) * 15, wx = ((i * 137 + t * (12 + (i % 3) * 6)) % 1140) - 80;
        c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 10, wy - 3, wx + 22, wy); c.stroke();
      }
      Art.dhow(c, 200, 325, 0.8, t, '#7d5230');
      Art.dhow(c, 620, 330, 0.95, t, '#8a5a30');
      c.restore();
      Art.abra(c, 760 - cam * 0.85, 405, t);
      // Kai
      c.save(); c.translate(-cam, 0);
      c.fillStyle = Art.grad(c, 0, 410, 0, 540, [[0, '#bfa47a'], [1, '#d9c39c']]);
      c.fillRect(-80, 412, 1120, 130);
      c.fillStyle = '#a88b60'; c.fillRect(-80, 410, 1120, 8);
      c.strokeStyle = 'rgba(90,60,30,0.2)';
      for (let x = -80; x < 1040; x += 46) { c.beginPath(); c.moveTo(x, 410); c.lineTo(x, 418); c.stroke(); }
      c.restore();
    },
    drawFront(c, t, cam) {
      c.save(); c.translate(-cam * 1.3, 0);
      c.fillStyle = '#5b3a1e';
      Art.rr(c, 930, 440, 24, 110, 6); Art.rr(c, 470, 470, 22, 80, 6);
      c.strokeStyle = '#c9b28a'; c.lineWidth = 3; c.beginPath(); c.moveTo(942, 452); c.quadraticCurveTo(880, 470, 830, 410); c.stroke();
      c.restore();
    },
    exits: { left: { to: 'souk71', spawn: 880, label: 'lb_souk' } },
    hotspots: [
      { id: 'dhow', x: 620, y: 345, w: 220, h: 180, label: 'lb_dhow', look: true, stand: null,
        act: () => UI.say([['mariam', 'look_dhow']]) },
      { id: 'creek', x: 480, y: 410, w: 960, h: 110, label: 'lb_creek', look: true, stand: null,
        act: () => UI.say([['mariam', 'look_creek']]) },
      { id: 'abuali', x: 240, y: FLOOR, w: 110, h: 112, label: 'n_abuali', stand: 340,
        draw: (c, t, adv) => {
          // Netz + Kiste
          c.strokeStyle = 'rgba(80,60,40,0.6)'; c.lineWidth = 1;
          for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(140 + i * 8, 470); c.lineTo(170 + i * 4, 440); c.stroke(); c.beginPath(); c.moveTo(140, 470 - i * 4); c.lineTo(200, 470 - i * 3); c.stroke(); }
          c.fillStyle = '#7a5530'; c.fillRect(205, 432, 64, 40); c.strokeStyle = '#5a3a1e'; c.lineWidth = 2; c.strokeRect(205, 432, 64, 40);
          drawPersonAt(c, 'abuali', 235, t, 1, { sit: true });
        },
        act: async () => {
          const f = G.flags;
          if (G.has('gahwa')) {
            G.take('gahwa');
            await UI.say([['abuali', 'a_g1'], ['abuali', 'a_g2']]);
            G.give('pearl');
            f.gotPearl = true;
            return;
          }
          if (f.gotPearl) return UI.say([['abuali', 'a_after']]);
          return UI.say([['abuali', 'a_1'], ['abuali', 'a_2'], ['abuali', 'a_3']]);
        } },
      { id: 'saif', x: 680, y: FLOOR, w: 70, h: 130, label: 'n_saif', stand: 590,
        draw: (c, t, adv) => drawPersonAt(c, 'saif', 680, t, adv.px >= 680 ? 1 : -1),
        act: async () => {
          const f = G.flags;
          if (!f.gotHammer) {
            await UI.say([['saif', 's_1'], ['saif', 's_2'], ['mariam', 's_m']]);
            G.give('hammer');
            f.gotHammer = true;
            return;
          }
          return UI.say([['saif', 's_after']]);
        } },
    ],
  },

  /* ===== Innenhof 2071 ===== */
  home2071: {
    chapter: 'ch3', music: 'calm',
    init() {
      const r = seeded(71);
      this.stars = [];
      for (let i = 0; i < 90; i++) this.stars.push({ x: r() * 1000 - 20, y: r() * 260, r: r() < 0.15 ? 2 : 1, a: 0.3 + r() * 0.7, sp: 1 + r() * 3 });
      this.towers = [];
      const shapes = ['spire', 'rect', 'sail', 'step', 'twist', 'rect'];
      for (let x = -80, i = 0; x < 1100; i++) {
        const w = 40 + r() * 60;
        this.towers.push({ x, w, h: 160 + r() * 260, o: { shape: shapes[Math.floor(r() * shapes.length)], body: r() < 0.5 ? '#1a1638' : '#221b46', windows: 'rgba(255,214,150,0.85)', accent: '#5ff2ff', lit: 0.25 + r() * 0.25, seed: i + 1, edge: r() < 0.4 ? (r() < 0.5 ? 'rgba(95,242,255,0.7)' : 'rgba(255,120,220,0.7)') : null, beacon: r() < 0.5, stripe: r() < 0.3 ? 'rgba(95,242,255,0.5)' : null } });
        x += w * (0.6 + r() * 0.5);
      }
      this.cars = [];
      for (let i = 0; i < 7; i++) this.cars.push({ y: 60 + r() * 160, sp: (r() < 0.5 ? -1 : 1) * (40 + r() * 70), off: r() * 1200, col: r() < 0.5 ? 'rgba(255,122,217,0.8)' : 'rgba(95,242,255,0.8)' });
    },
    drawBack(c, t, cam) {
      Art.sky(c, [[0, '#120c2c'], [0.45, '#3a1f5e'], [0.75, '#b0466c'], [1, '#ff9a5c']]);
      Art.stars(c, this.stars, t);
      c.save(); c.translate(-cam * 0.2, 0);
      for (const tw of this.towers) Art.tower(c, tw.x, 420, tw.w, tw.h, tw.o, t);
      c.restore();
      // Flugtaxis
      for (const car of this.cars) {
        const x = ((car.off + t * car.sp) % 1200 + 1200) % 1200 - 120 - cam * 0.35;
        Art.glow(c, x, car.y, 14, car.col);
        c.fillStyle = '#fff'; c.fillRect(x - 4, car.y - 1, 8, 2);
      }
      c.save(); c.translate(-cam * 0.6, 0);
      drawOldHouse(c, t, true);
      c.fillStyle = 'rgba(30,14,60,0.5)'; c.fillRect(-70, 20, 1100, 400);
      Art.glow(c, 467, 340, 120, 'rgba(255,180,100,0.35)');
      Art.glow(c, 325, 280, 70, 'rgba(255,190,110,0.3)');
      Art.glow(c, 583, 278, 70, 'rgba(255,190,110,0.3)');
      // Spots auf den Windturm
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = 'rgba(255,200,120,0.12)';
      c.beginPath(); c.moveTo(170, 420); c.lineTo(90, 10); c.lineTo(250, 10); c.fill();
      c.restore();
      // Glasdach
      c.strokeStyle = 'rgba(160,220,255,0.25)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-70, 150); c.quadraticCurveTo(480, 60, 1030, 150); c.stroke();
      for (let i = 0; i < 12; i++) { const x = -40 + i * 95; c.beginPath(); c.moveTo(x, 150 - Math.sin((i / 11) * Math.PI) * 60); c.lineTo(x, 172); c.stroke(); }
      // Hologramm
      const hy = 110 + Math.sin(t * 1.5) * 4;
      c.save(); c.globalCompositeOperation = 'lighter';
      Art.glow(c, 480, hy, 120, 'rgba(95,242,255,0.18)');
      c.font = 'bold 64px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = `rgba(150,250,255,${0.75 + Math.sin(t * 12) * 0.05})`;
      c.fillText('100', 480, hy);
      c.font = '600 15px system-ui, sans-serif'; c.fillStyle = 'rgba(255,170,230,0.9)';
      c.fillText('UAE · 1971 – 2071', 480, hy + 42);
      c.fillStyle = 'rgba(150,250,255,0.08)';
      for (let y = hy - 40; y < hy + 55; y += 4) c.fillRect(380, y, 200, 1);
      c.restore();
      c.restore();
      // Boden
      c.save(); c.translate(-cam, 0);
      c.fillStyle = Art.grad(c, 0, 405, 0, 540, [[0, '#2a2140'], [1, '#3b2f55']]);
      c.fillRect(-80, 405, 1120, 140);
      c.fillStyle = 'rgba(95,242,255,0.7)'; c.fillRect(-80, 410, 1120, 2);
      c.fillStyle = 'rgba(95,242,255,0.08)';
      for (let x = -80; x < 1040; x += 80) c.fillRect(x, 412, 1, 130);
      c.restore();
    },
    drawFront(c, t, cam) {},
    exits: { right: { to: 'runner', spawn: 0, label: 'lb_skyway', need: () => G.flags.metNova, block: 'x_block' } },
    hotspots: [
      { id: 'holo', x: 480, y: 160, w: 220, h: 110, label: 'lb_holo', stand: 480, look: true,
        act: () => UI.say([['mariam', 'look_holo']]) },
      { id: 'barjeel', x: 170, y: 175, w: 140, h: 160, label: 'lb_barjeel', stand: 200, look: true,
        act: () => UI.say([['mariam', 'look_barjeel2']]) },
      { id: 'palm', x: 900, y: FLOOR, w: 90, h: 470, label: 'lb_palm', stand: 830, look: true,
        draw: (c, t) => Art.palm(c, 900, FLOOR + 6, 470, t, { frondScale: 0.75 }),
        act: () => UI.say([['mariam', 'look_palm2']]) },
      { id: 'vitrine', x: 300, y: FLOOR, w: 110, h: 150, label: 'lb_vitrine', stand: 390,
        draw: (c, t) => {
          c.fillStyle = '#1c1830'; c.fillRect(255, 400, 90, 70);
          c.fillStyle = 'rgba(95,242,255,0.6)'; c.fillRect(255, 400, 90, 2);
          Art.glow(c, 300, 360, 70, 'rgba(255,220,160,0.3)');
          c.fillStyle = 'rgba(180,230,255,0.13)'; c.fillRect(250, 318, 100, 82);
          c.strokeStyle = 'rgba(200,240,255,0.5)'; c.lineWidth = 1.5; c.strokeRect(250, 318, 100, 82);
          c.fillStyle = '#8a8f96'; Art.rr(c, 262, 368, 34, 26, 4); c.fillStyle = '#6a6e74'; c.fillRect(262, 366, 34, 6);
          c.save(); c.translate(318, 378); c.rotate(-0.15); c.fillStyle = '#efe0b8'; c.fillRect(-14, -18, 28, 34);
          c.fillStyle = 'rgba(80,60,30,0.5)'; for (let i = 0; i < 6; i++) c.fillRect(-10, -13 + i * 5, 18 - (i % 2) * 4, 1.2);
          c.restore();
          c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.moveTo(254, 322); c.lineTo(274, 322); c.lineTo(254, 352); c.fill();
        },
        act: async () => { await UI.say([[null, 'v_1'], ['letter', 'v_2'], ['mariam', 'v_3']]); G.flags.readLetter = true; } },
      { id: 'capsule', x: 570, y: FLOOR, w: 150, h: 190, label: 'lb_capsule', stand: 470,
        draw: (c, t) => Art.capsule(c, 570, FLOOR, t, { lens: true, coil: true, radio: true, steam: true, era2071: true }),
        act: () => UI.say([['mariam', 'look_cap2']]) },
      { id: 'nova', x: 760, y: FLOOR, w: 70, h: 130, label: 'n_nova', stand: 690,
        draw: (c, t) => Art.robot(c, 760, FLOOR, t),
        act: async () => {
          if (G.flags.metNova) return UI.say([['nova', 'n_again']]);
          await UI.say([['nova', 'n_1'], ['nova', 'n_2'], ['nova', 'n_3']]);
          G.flags.metNova = true;
          G.save('home2071');
        } },
    ],
    hint() {
      if (!G.flags.metNova) return T('h_nova');
      return T('h_go');
    },
    async onEnter() {
      if (!G.flags.arrived) {
        G.flags.arrived = true;
        await sleep(400);
        await UI.say([[null, 'z_1'], ['mariam', 'z_2']]);
      }
    },
  },
};

/* ---------------- Adventure-Modus ---------------- */
class Adventure {
  constructor(id, x) {
    this.id = id;
    this.sc = SCENES[id];
    if (x !== undefined) G.playerX = x;
  }
  enter() {
    const sc = this.sc;
    if (sc.init && !sc._inited) { sc.init(); sc._inited = true; }
    sc.active = false;
    this.px = G.playerX;
    this.facing = G.facing || 1;
    this.target = null;
    this.pending = null;
    this.walking = false;
    this.running = false;
    this.boarding = false;
    this.alpha = 1;
    this.cam = clamp((this.px - 480) * 0.1, -48, 48);
    this.stepT = 0;
    UI.setChapter(sc.chapter);
    UI.showInventory(true);
    UI.showTimer(false);
    $('#touch').hidden = true;
    Music.play(sc.music);
    G.save(this.id);
    if (sc.onEnter) this.runScript(() => sc.onEnter(this));
  }
  hint() { return this.sc.hint ? this.sc.hint() : null; }
  onLang() { UI.setChapter(this.sc.chapter); }
  async runScript(fn) {
    this.running = true;
    try { await fn(); } finally { this.running = false; }
  }
  walkTo(x) {
    return new Promise((res) => { this.target = clamp(x, 30, 930); this.walkResolve = res; });
  }
  visibleHotspots() { return this.sc.hotspots.filter((h) => !h.visible || h.visible()); }
  hit(wx, sy) {
    const hs = this.visibleHotspots();
    // Personen/Objekte vor Kulisse prüfen: von hinten nach vorn in Liste, aber "look" zuletzt
    const ordered = hs.filter((h) => !h.look).concat(hs.filter((h) => h.look));
    for (const h of ordered) {
      if (wx >= h.x - h.w / 2 && wx <= h.x + h.w / 2 && sy >= h.y - h.h && sy <= h.y) return h;
    }
    return null;
  }
  pointerMove(x, y) {
    if (this.running) { this.hover = null; return; }
    const wx = x + this.cam;
    this.hover = this.hit(wx, y);
    this.hoverExit = null;
    if (!this.hover) {
      if (wx < 60 && this.sc.exits.left) this.hoverExit = 'left';
      if (wx > 900 && this.sc.exits.right) this.hoverExit = 'right';
    }
  }
  pointerDown(x, y) {
    if (this.running || this.boarding) return;
    const wx = x + this.cam;
    const exL = this.sc.exits.left, exR = this.sc.exits.right;
    if (exL && x < 70 && y > 300) return this.goExit('left');
    if (exR && x > 890 && y > 300) return this.goExit('right');
    const h = this.hit(wx, y);
    if (h) {
      let stand = h.stand;
      if (stand === null) stand = this.px; // nur anschauen
      if (stand === undefined) stand = h.x + (this.px < h.x ? -h.w / 2 - 30 : h.w / 2 + 30);
      this.target = clamp(stand, 30, 930);
      this.pending = h;
      this.marker = null;
      return;
    }
    if (y > 380) {
      this.target = clamp(wx, 30, 930);
      this.pending = null;
      this.marker = { x: this.target, t: 0.6 };
    }
  }
  keyDown(e) {
    if (this.running) return;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') { this.target = clamp(this.px - 140, 30, 930); this.pending = null; }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.target = clamp(this.px + 140, 30, 930); this.pending = null; }
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
      // nächstes Objekt in Reichweite benutzen
      let best = null, bd = 1e9;
      for (const h of this.visibleHotspots()) { const d = Math.abs(h.x - this.px); if (!h.look && d < bd) { bd = d; best = h; } }
      if (best && bd < 160) { this.target = this.px; this.pending = best; }
    }
  }
  goExit(side) {
    const ex = this.sc.exits[side];
    if (ex.need && !ex.need()) {
      this.runScript(() => UI.say([['mariam', ex.block]]));
      return;
    }
    this.target = side === 'left' ? 30 : 930;
    this.pending = { exit: ex };
  }
  arrive() {
    const p = this.pending;
    this.pending = null;
    if (this.walkResolve) { const r = this.walkResolve; this.walkResolve = null; r(); }
    if (!p) return;
    if (p.exit) {
      const ex = p.exit;
      Sfx.door();
      G.facing = this.facing;
      Engine.fadeTo(() => {
        if (ex.to === 'runner') Engine.setMode(new Runner());
        else Engine.setMode(new Adventure(ex.to, ex.spawn));
      });
      return;
    }
    if (p.x !== this.px) this.facing = p.x > this.px ? 1 : -1;
    if (p.act) this.runScript(() => p.act(this));
  }
  update(dt) {
    if (this.target !== null) {
      const d = this.target - this.px;
      const sp = 240 * dt;
      if (Math.abs(d) <= sp) {
        this.px = this.target; this.target = null; this.walking = false;
        this.arrive();
      } else {
        this.facing = Math.sign(d);
        this.px += Math.sign(d) * sp;
        this.walking = true;
        this.stepT += dt;
        if (this.stepT > 0.31) { this.stepT = 0; Sfx.step(); }
      }
    } else this.walking = false;
    if (this.boarding) this.alpha = Math.max(0, this.alpha - dt * 0.9);
    G.playerX = this.px;
    const want = clamp((this.px - 480) * 0.1, -48, 48);
    this.cam = lerp(this.cam, want, Math.min(1, dt * 3));
    if (this.marker) { this.marker.t -= dt; if (this.marker.t <= 0) this.marker = null; }
  }
  draw(c, t) {
    const sc = this.sc;
    sc.drawBack(c, t, this.cam);
    c.save();
    c.translate(-this.cam, 0);
    const hs = this.visibleHotspots();
    for (const h of hs) if (h.draw && h.id !== 'palm') h.draw(c, t, this);
    if (this.marker) {
      c.strokeStyle = `rgba(255,255,255,${this.marker.t})`; c.lineWidth = 2;
      c.beginPath(); c.ellipse(this.marker.x, FLOOR, 20 * (1.2 - this.marker.t), 6 * (1.2 - this.marker.t), 0, 0, Math.PI * 2); c.stroke();
    }
    if (this.alpha > 0) Art.person(c, this.px, FLOOR, CHARS.mariam, t, { facing: this.facing, walk: this.walking, alpha: this.alpha });
    for (const h of hs) if (h.draw && h.id === 'palm') h.draw(c, t, this);
    // Interaktions-Marker
    if (!this.running) {
      for (const h of hs) {
        if (h.look) continue;
        const my = h.y - h.h - 14 + Math.sin(t * 3 + h.x) * 4;
        c.fillStyle = 'rgba(255,230,150,0.9)';
        c.save(); c.translate(h.x, my); c.rotate(t * 1.5);
        c.beginPath();
        for (let i = 0; i < 8; i++) { const r = i % 2 ? 2.5 : 7; const a = i * Math.PI / 4; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        c.fill(); c.restore();
      }
    }
    c.restore();
    sc.drawFront(c, t, this.cam);
    // Ausgänge
    for (const side of ['left', 'right']) {
      const ex = sc.exits[side];
      if (!ex) continue;
      const ok = !ex.need || ex.need();
      const x = side === 'left' ? 26 : W - 26, dir = side === 'left' ? -1 : 1;
      const k = Math.sin(t * 4) * 4;
      c.save();
      c.globalAlpha = ok ? 0.9 : 0.35;
      c.fillStyle = 'rgba(16,12,28,0.6)'; Art.circ(c, x, 440, 20);
      c.strokeStyle = sc.chapter === 'ch3' ? '#5ff2ff' : '#ffe0a0'; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x - dir * 5 + dir * k * 0.5, 430); c.lineTo(x + dir * 5 + dir * k * 0.5, 440); c.lineTo(x - dir * 5 + dir * k * 0.5, 450); c.stroke();
      c.restore();
      if (this.hoverExit === side) this.label(c, T(ex.label), side === 'left' ? 70 : W - 70, 405);
    }
    if (this.hover && !this.running) this.label(c, T(this.hover.label), clamp(this.hover.x - this.cam, 80, W - 80), Math.max(70, this.hover.y - this.hover.h - 34));
  }
  label(c, text, x, y) {
    c.save();
    c.font = '600 15px system-ui, sans-serif';
    const w = c.measureText(text).width + 22;
    c.fillStyle = 'rgba(16,12,28,0.85)';
    Art.rr(c, x - w / 2, y - 14, w, 28, 14);
    c.fillStyle = '#fff6e0'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, x, y + 1);
    c.restore();
  }
}
