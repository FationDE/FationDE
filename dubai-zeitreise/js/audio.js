'use strict';
/* Klang komplett synthetisch über WebAudio – keine Audiodateien nötig. */

const Sfx = {
  ctx: null, master: null, on: store.get('sound', true), noiseBuf: null,
  init() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.on ? 0.55 : 0;
        this.master.connect(this.ctx.destination);
        const len = this.ctx.sampleRate;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { this.ctx = null; return; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  },
  toggle() {
    this.on = !this.on;
    store.set('sound', this.on);
    if (this.master) this.master.gain.value = this.on ? 0.55 : 0;
  },
  ok() { return this.ctx && this.on && this.ctx.state === 'running'; },
  tone(f, d, type = 'sine', v = 0.12, slide = 0, delay = 0) {
    if (!this.ok()) return;
    const a = this.ctx, t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + d + 0.05);
  },
  noise(d, v = 0.1, freq = 1200, delay = 0, type = 'bandpass') {
    if (!this.ok()) return;
    const a = this.ctx, t = a.currentTime + delay;
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = this.noiseBuf;
    f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t, Math.random() * 0.5); s.stop(t + d + 0.05);
  },
  click() { this.tone(660, 0.05, 'triangle', 0.05); },
  blip() { this.tone(880, 0.07, 'sine', 0.07); },
  type(who) {
    const base = who === 'capsule' || who === 'nova' ? 1200 : who === 'grandma' || who === 'abuali' ? 330 : 520;
    this.tone(base + Math.random() * 60, 0.03, who === 'capsule' ? 'square' : 'triangle', 0.018);
  },
  step() { this.noise(0.05, 0.03, 500); },
  pickup() { [660, 880, 1320].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.09, 0, i * 0.07)); },
  success() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.1, 0, i * 0.09)); },
  hurt() { this.tone(220, 0.25, 'sawtooth', 0.09, -140); this.noise(0.2, 0.08, 400); },
  jump() { this.tone(360, 0.14, 'square', 0.045, 380); },
  land() { this.noise(0.06, 0.04, 300); },
  spark() { this.tone(1320, 0.1, 'sine', 0.06); this.tone(1760, 0.12, 'sine', 0.05, 0, 0.05); },
  warp() { this.tone(120, 1.6, 'sawtooth', 0.07, 1600); this.noise(1.4, 0.06, 2400); },
  door() { this.noise(0.3, 0.06, 700, 0, 'lowpass'); },
  boom() { this.noise(0.9, 0.18, 180, 0, 'lowpass'); this.noise(0.6, 0.05, 3000, 0.05); },
  pop() { this.noise(0.25, 0.08, 1800); },
};

/* Kleine generative Musik: 1971 (Hijaz-Skala, Oud-artig) und 2071 (Synth-Arpeggio). */
const Music = {
  cur: null, timer: null, step: 0, note: 3,
  play(name) {
    if (this.cur === name) return;
    this.stop();
    this.cur = name;
    if (!name) return;
    this.step = 0;
    const ms = name === '1971' ? 340 : name === 'tunnel' ? 150 : 190;
    this.timer = setInterval(() => this.tick(), ms);
  },
  stop() { clearInterval(this.timer); this.timer = null; this.cur = null; },
  tick() {
    if (!Sfx.ok()) return;
    const s = this.step++;
    if (this.cur === '1971') {
      const scale = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 587.33, 622.25, 739.99];
      if (s % 16 === 0) Sfx.tone(73.42, 5.2, 'sine', 0.05);
      if (s % 16 === 8) Sfx.tone(110, 2.6, 'sine', 0.025);
      const drum = [1, 0, 0, 1, 0, 1, 0, 0];
      if (drum[s % 8]) Sfx.noise(0.08, s % 8 === 0 ? 0.05 : 0.025, s % 8 === 0 ? 180 : 900);
      if (Math.random() < 0.62) {
        this.note = clamp(this.note + Math.round(rand(-2, 2)), 0, scale.length - 1);
        Sfx.tone(scale[this.note], 0.42, 'triangle', 0.045);
        if (Math.random() < 0.2) Sfx.tone(scale[this.note] * 2, 0.2, 'sine', 0.012, 0, 0.02);
      }
    } else {
      const chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]];
      const ch = chords[Math.floor(s / 16) % 4];
      const n = ch[s % 3] * (s % 6 < 3 ? 2 : 1);
      Sfx.tone(n, 0.16, 'square', this.cur === 'tunnel' ? 0.018 : 0.022);
      if (s % 4 === 0) Sfx.tone(ch[0] / 2, 0.3, 'sawtooth', 0.03);
      if (this.cur !== 'calm') {
        if (s % 8 === 0) Sfx.tone(60, 0.18, 'sine', 0.12, -30);
        if (s % 8 === 4) Sfx.noise(0.08, 0.04, 2400);
        if (s % 2 === 1) Sfx.noise(0.03, 0.012, 6000, 0, 'highpass');
      }
    }
  },
};
