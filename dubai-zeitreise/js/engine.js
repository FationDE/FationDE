'use strict';
/* Kern: Canvas-Skalierung, Eingabe, Modus-Wechsel, Dialoge, Inventar, Spielstand. */

const W = 960, H = 540;
const $ = (s) => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Deterministischer Zufall für Kulissen */
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const store = {
  get(k, d) { try { const v = localStorage.getItem('einladung_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('einladung_' + k, JSON.stringify(v)); } catch (e) { /* egal */ } },
  del(k) { try { localStorage.removeItem('einladung_' + k); } catch (e) { /* egal */ } },
};

/* ---------------- Spielzustand ---------------- */
const ITEMS = {
  invite: '✉️', dates: '🧺', cardamom: '🌿', gahwa: '☕', pearl: '🦪', hammer: '🔨', coil: '🌀', radio: '📻',
};

const G = {
  lang: store.get('lang', (navigator.language || 'de').toLowerCase().startsWith('de') ? 'de' : 'en'),
  inv: [],
  flags: {},
  bonus: 0,      // Sekunden aus dem Zeittunnel
  sparks: 0,
  timeLeft: 0,
  playerX: 480,
  facing: 1,
  reset() { this.inv = []; this.flags = {}; this.bonus = 0; this.sparks = 0; this.timeLeft = 0; this.playerX = 480; this.facing = 1; },
  has(id) { return this.inv.includes(id); },
  give(id) {
    if (this.has(id)) return;
    this.inv.push(id);
    UI.renderInventory(id);
    UI.toast(T('got', { item: ITEMS[id] + ' ' + T('it_' + id) }));
    Sfx.pickup();
  },
  take(id) { this.inv = this.inv.filter((i) => i !== id); UI.renderInventory(); },
  save(scene) {
    store.set('save', { scene, inv: this.inv, flags: this.flags, bonus: this.bonus, x: this.playerX });
  },
  load() {
    const s = store.get('save', null);
    if (!s) return null;
    this.inv = s.inv || []; this.flags = s.flags || {}; this.bonus = s.bonus || 0; this.playerX = s.x || 480;
    return s.scene;
  },
};

/* ---------------- Engine ---------------- */
const Engine = {
  mode: null, t: 0, keys: {}, flash: 0, fade: 0, fadeDir: 0, fadeCb: null, fadeResolve: null, locked: false, shake: 0,
  init() {
    this.canvas = $('#game');
    this.ctx = this.canvas.getContext('2d');
    this.stage = $('#stage');
    addEventListener('resize', () => this.resize());
    addEventListener('orientationchange', () => setTimeout(() => this.resize(), 200));
    this.resize();

    this.canvas.addEventListener('pointerdown', (e) => {
      Sfx.init();
      const p = this.toLogical(e);
      if (UI.busy) { UI.advance(); return; }
      if (this.mode && this.mode.pointerDown && !this.locked) this.mode.pointerDown(p.x, p.y, e);
    });
    this.canvas.addEventListener('pointermove', (e) => {
      const p = this.toLogical(e);
      this.mouse = p;
      if (this.mode && this.mode.pointerMove) this.mode.pointerMove(p.x, p.y, e);
    });
    const up = (e) => { if (this.mode && this.mode.pointerUp) this.mode.pointerUp(e); };
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('pointercancel', up);
    this.canvas.addEventListener('pointerleave', up);

    addEventListener('keydown', (e) => {
      Sfx.init();
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (e.repeat) { this.keys[e.code] = true; return; }
      this.keys[e.code] = true;
      if (UI.handleKey(e)) return;
      if (this.mode && this.mode.keyDown && !this.locked) this.mode.keyDown(e);
    });
    addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    addEventListener('blur', () => { this.keys = {}; });

    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.t += dt;
      this.frame(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },
  resize() {
    const vw = innerWidth, vh = innerHeight;
    const s = Math.min(vw / W, vh / H);
    this.scale = s;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    const st = this.stage;
    st.style.width = W * s + 'px';
    st.style.height = H * s + 'px';
    st.style.left = (vw - W * s) / 2 + 'px';
    st.style.top = (vh - H * s) / 2 + 'px';
    st.style.setProperty('--u', s);
    this.canvas.width = Math.round(W * s * this.dpr);
    this.canvas.height = Math.round(H * s * this.dpr);
    UI.checkRotate();
  },
  toLogical(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  },
  setMode(m) {
    if (this.mode && this.mode.exit) this.mode.exit();
    this.mode = m;
    if (m.enter) m.enter();
  },
  /* Ausblenden → cb → Einblenden. Liefert Promise, das nach dem Einblenden auflöst. */
  fadeTo(cb, speed = 2.6) {
    return new Promise((resolve) => {
      this.fadeDir = 1; this.fadeSpeed = speed; this.fadeCb = cb; this.fadeResolve = resolve; this.locked = true;
    });
  },
  frame(dt) {
    const c = this.ctx;
    const k = this.canvas.width / W;
    c.setTransform(k, 0, 0, k, 0, 0);

    if (this.fadeDir === 1) {
      this.fade += dt * this.fadeSpeed;
      if (this.fade >= 1) {
        this.fade = 1; this.fadeDir = -1;
        const cb = this.fadeCb; this.fadeCb = null;
        if (cb) cb();
      }
    } else if (this.fadeDir === -1) {
      this.fade -= dt * this.fadeSpeed;
      if (this.fade <= 0) {
        this.fade = 0; this.fadeDir = 0; this.locked = false;
        const r = this.fadeResolve; this.fadeResolve = null;
        if (r) r();
      }
    }

    if (this.mode && this.mode.update) this.mode.update(dt);
    UI.update(dt);

    c.save();
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 30);
      c.translate(rand(-1, 1) * this.shake, rand(-1, 1) * this.shake);
    }
    if (this.mode && this.mode.draw) this.mode.draw(c, this.t);
    c.restore();

    if (this.flash > 0) {
      c.fillStyle = `rgba(235,255,255,${Math.min(1, this.flash)})`;
      c.fillRect(0, 0, W, H);
      this.flash = Math.max(0, this.flash - dt * 1.4);
    }
    if (this.fade > 0) {
      c.fillStyle = `rgba(4,3,10,${this.fade})`;
      c.fillRect(0, 0, W, H);
    }
  },
};

/* ---------------- UI: Dialoge, Toasts, Inventar, Screens ---------------- */
const SPEAKER_STYLE = {
  mariam: '#ffd27a', grandma: '#ff9c7a', yusuf: '#f5b85a', khalid: '#e59a5a', saif: '#8fd3ff',
  abuali: '#c8e0ff', capsule: '#5ff2ff', radio: '#d9c9a3', nova: '#7cf7d4', noor: '#ff8de0',
};

const UI = {
  busy: false, queue: [], line: null, shown: 0, resolve: null, toastTimer: null, rotateDismissed: false,
  init() {
    this.dlg = $('#dialog');
    this.dWho = this.dlg.querySelector('.who');
    this.dText = this.dlg.querySelector('.text');
    this.dlg.addEventListener('pointerdown', (e) => { e.stopPropagation(); Sfx.init(); this.advance(); });
    this.inv = $('#inventory');
    this.screen = $('#screen');
    this.toastEl = $('#toast');

    $('#btnHint').addEventListener('click', () => { Sfx.init(); Sfx.blip(); const h = Hints.current(); if (h) this.toast('💡 ' + h, 4200); });
    $('#btnSound').addEventListener('click', () => { Sfx.init(); Sfx.toggle(); this.refreshButtons(); });
    $('#btnLang').addEventListener('click', () => {
      G.lang = G.lang === 'de' ? 'en' : 'de';
      store.set('lang', G.lang);
      document.documentElement.lang = G.lang;
      this.refreshButtons();
      this.renderInventory();
      if (Engine.mode && Engine.mode.onLang) Engine.mode.onLang();
      if (this.line) this.renderLine(true);
    });
    $('#btnFull').addEventListener('click', () => {
      const d = document.documentElement;
      try {
        if (!document.fullscreenElement) {
          const p = d.requestFullscreen ? d.requestFullscreen() : (d.webkitRequestFullscreen && d.webkitRequestFullscreen());
          if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* egal */ } }).catch(() => {});
        } else if (document.exitFullscreen) document.exitFullscreen();
      } catch (e) { /* nicht unterstützt */ }
    });
    $('#rotateBtn').addEventListener('click', () => { this.rotateDismissed = true; this.checkRotate(); });
    this.refreshButtons();
  },
  refreshButtons() {
    $('#btnLang').textContent = G.lang === 'de' ? 'EN' : 'DE';
    $('#btnSound').textContent = Sfx.on ? '🔊' : '🔇';
    $('#rotateText').textContent = T('rotate');
    $('#rotateBtn').textContent = T('rotate_btn');
  },
  checkRotate() {
    const el = $('#rotate');
    if (!el) return;
    const portrait = innerHeight > innerWidth * 1.05;
    const touch = matchMedia('(pointer: coarse)').matches;
    el.hidden = !(portrait && touch && !this.rotateDismissed);
  },
  setChapter(key) { $('#chapter').textContent = key ? T(key) : ''; this.chapterKey = key; },

  /* lines: [[speaker, key, vars?], …]  speaker: null = Erzähler, 'letter' = Brief */
  say(lines) {
    return new Promise((resolve) => {
      this.queue = lines.slice();
      this.resolve = resolve;
      this.busy = true;
      this.next();
    });
  },
  next() {
    if (!this.queue.length) {
      this.line = null;
      this.busy = false;
      this.dlg.hidden = true;
      this.inv.hidden = !this.invVisible;
      const r = this.resolve; this.resolve = null;
      if (r) r();
      return;
    }
    this.line = this.queue.shift();
    this.shown = 0;
    this.renderLine(false);
    this.dlg.hidden = false;
    this.inv.hidden = true;
  },
  renderLine(full) {
    const [who, key, vars] = this.line;
    this.fullText = T(key, vars);
    this.dlg.className = '';
    if (!who) this.dlg.classList.add('narr');
    else if (who === 'letter') this.dlg.classList.add('letter');
    else if (who === 'capsule') this.dlg.classList.add('machine');
    this.dWho.textContent = who && who !== 'letter' ? T('n_' + who) : '';
    this.dWho.style.color = SPEAKER_STYLE[who] || '';
    if (full) this.shown = this.fullText.length;
    this.dText.textContent = this.fullText.slice(0, Math.floor(this.shown));
    this.dlg.classList.toggle('done', this.shown >= this.fullText.length);
  },
  advance() {
    if (!this.busy || !this.line) return;
    if (this.shown < this.fullText.length) { this.shown = this.fullText.length; this.renderLine(false); return; }
    Sfx.click();
    this.next();
  },
  handleKey(e) {
    if (this.busy && (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE')) { this.advance(); return true; }
    if (!this.screen.hidden && this.screenKey && (e.code === 'Space' || e.code === 'Enter')) { this.screenKey(); return true; }
    return false;
  },
  update(dt) {
    if (this.busy && this.line && this.shown < this.fullText.length) {
      const before = Math.floor(this.shown);
      this.shown = Math.min(this.fullText.length, this.shown + dt * 55);
      if (Math.floor(this.shown) !== before) {
        this.dText.textContent = this.fullText.slice(0, Math.floor(this.shown));
        if (Math.floor(this.shown) % 3 === 0) Sfx.type(this.line[0]);
      }
      this.dlg.classList.toggle('done', this.shown >= this.fullText.length);
    }
  },
  toast(text, ms = 2400) {
    const el = this.toastEl;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.remove('show'), ms);
  },
  showInventory(v) { this.invVisible = v; this.inv.hidden = !v || this.busy; if (v) this.renderInventory(); },
  renderInventory(newId) {
    this.inv.innerHTML = '';
    for (const id of G.inv) {
      const b = document.createElement('button');
      b.textContent = ITEMS[id];
      b.title = T('it_' + id);
      if (id === newId) b.classList.add('new');
      b.addEventListener('pointerdown', (e) => { e.stopPropagation(); Sfx.blip(); this.toast(ITEMS[id] + ' ' + T('it_' + id) + ' – ' + T('d_' + id), 3600); });
      this.inv.appendChild(b);
    }
  },
  /* Vollbild-Overlay mit HTML. onKey: Leertaste/Enter-Handler. */
  showScreen(html, cls, onKey) {
    this.screen.className = cls || '';
    this.screen.innerHTML = html;
    this.screen.hidden = false;
    this.screenKey = onKey || null;
  },
  hideScreen() { this.screen.hidden = true; this.screen.innerHTML = ''; this.screenKey = null; },
  showTimer(v) { $('#timer').hidden = !v; },
  setTimer(text, warn) { const el = $('#timer'); el.textContent = text; el.classList.toggle('warn', !!warn); },
};

/* ---------------- Tipps ---------------- */
const Hints = {
  current() {
    const f = G.flags;
    const m = Engine.mode;
    if (m && m.hint) return m.hint();
    if (!f.readInv) return T('h_readInv');
    if (!f.talkedGrandma) return T('h_grandma');
    if (f.lens && f.coilIn) {
      if (G.has('radio')) return T('h_radio');
      return T('h_signal');
    }
    if (G.has('pearl') || G.has('coil')) {
      if ((G.has('pearl') || f.lens) && (G.has('coil') || f.coilIn)) return T('h_install');
    }
    if (!f.lens && !G.has('pearl')) {
      if (G.has('gahwa')) return T('h_gahwa');
      if (G.has('cardamom')) return T('h_cardamom');
      if (G.has('dates')) return T('h_dates');
    }
    if (!f.coilIn && !G.has('coil')) {
      if (G.has('hammer')) return T('h_hammer');
      if (f.talkedKhalid) return T('h_coil1');
      return T('h_coil0');
    }
    return T('h_install');
  },
};
