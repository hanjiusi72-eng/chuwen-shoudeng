/* 光亮 · 核心：常量、全局状态、通用 UI、音效、背景音乐 */
const W = 1334, H = 750;
const FONT = '"Heiti SC","STHeiti","SimHei","Source Han Sans SC","Noto Sans SC","Microsoft YaHei","PingFang SC",sans-serif';
const FONT_SANS = '"Heiti SC","STHeiti","PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
const TEXT_RES = Math.min(2, window.devicePixelRatio || 1) + 0.5;

const C = {
  magenta: 0xff00c8, pink: 0xff9cd4, cream: 0xfbf5a2, yellow: 0xffe62a, blue: 0x004dfc,
  cyan: 0x2ad4f0, green: 0x2bbf98, orange: 0xff9a1f, red: 0xe8202a, navy: 0x14164a,
  ink: 0x2a1030, white: 0xffffff, gold: 0xf6c21c, purple: 0x6a2a9a, gray: 0x8a8a96
};
const HEX = n => '#' + n.toString(16).padStart(6, '0');

/* ---------------- 全局状态（仅当前会话） ---------------- */
const G = {
  reset() {
    Object.assign(this, {
      bookOpened: false, bookPageIndex: 0,
      healedTiger: false, healedDragon: false,
      foragePos: 0, forageGot: [],
      purchased: new Set(), effectsDone: new Set(), prepared: [],
      carpenterRescued: false, craftUnlocked: false, lampCrafted: false,
      tutorialSeen: false, tutorialSkipped: false, nightRetries: 0, assist: false,
      dragonDone: false, tigerDone: false, blessingId: null,
      errorStreak: {}
    });
  }
};
G.reset();

/* ---------------- 角色 ---------------- */
const WHO = {
  tiger:  { name: '白额虎', head: 'head_tiger', color: C.orange },
  dragon: { name: '青龙',   head: 'head_dragon', color: C.green },
  wu:     { name: '吴夲 · 保生大帝', head: 'head_baosheng', color: C.magenta },
  carp:   { name: '木匠',   head: 'head_elder', color: C.blue },
  me:     { name: '学徒（你）', head: null, color: C.ink },
  narr:   { name: '', head: null, color: C.ink }
};

/* ---------------- 文本 / 按钮 / 面板 ---------------- */
/* 逐字测宽的中文换行；行首不放收尾标点 */
const NO_LINE_START = '，。、！？；：）”’》」…—';
function cjkWrap(text, obj) {
  const max = obj.style.wordWrapWidth, ctx = obj.context, out = [];
  text.split('\n').forEach(para => {
    let line = '';
    for (const ch of para) {
      if (line && ctx.measureText(line + ch).width > max) {
        if (NO_LINE_START.includes(ch)) { out.push(line + ch); line = ''; continue; }
        out.push(line); line = ch === ' ' ? '' : ch;
      } else line += ch;
    }
    out.push(line);
  });
  return out;
}
function T(scene, x, y, str, size = 22, color = '#2a1030', opt = {}) {
  const t = scene.add.text(x, y, str, Object.assign({
    fontFamily: opt.sans ? FONT_SANS : FONT, fontSize: size + 'px', color,
    align: opt.align || 'left', resolution: TEXT_RES,
    wordWrap: opt.wrap ? { width: opt.wrap, callback: cjkWrap } : undefined,
    lineSpacing: opt.lineSpacing || 4, fontStyle: opt.bold ? 'bold' : 'normal',
    stroke: opt.stroke, strokeThickness: opt.strokeThickness || 0,
    padding: { x: 2, y: 3 }
  }, opt.style || {}));
  t.setOrigin(opt.ox ?? 0.5, opt.oy ?? 0.5);
  return t;
}
/* 竖排文字 */
function VT(scene, x, y, str, size = 20, color = '#2a1030', opt = {}) {
  return T(scene, x, y, str.split('').join('\n'), size, color, Object.assign({ align: 'center', lineSpacing: opt.ls ?? -2 }, opt));
}

function panel(scene, x, y, w, h, opt = {}) {
  const g = scene.add.graphics();
  const r = opt.r ?? 18;
  if (opt.shadow !== false) { g.fillStyle(opt.shadowColor ?? 0x000000, opt.shadowAlpha ?? 0.22); g.fillRoundedRect(x + 4, y + 6, w, h, r); }
  g.fillStyle(opt.fill ?? C.cream, opt.alpha ?? 1); g.fillRoundedRect(x, y, w, h, r);
  if (opt.stroke !== null) { g.lineStyle(opt.lw ?? 4, opt.stroke ?? C.magenta, 1); g.strokeRoundedRect(x, y, w, h, r); }
  return g;
}

function button(scene, x, y, label, onClick, opt = {}) {
  const w = opt.w || Math.max(120, label.length * (opt.size || 22) + 48), h = opt.h || 54;
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const fill = opt.fill ?? C.magenta, edge = opt.edge ?? 0x9a0078;
  const draw = (down) => {
    g.clear();
    g.fillStyle(edge, 1); g.fillRoundedRect(-w / 2, -h / 2 + 5, w, h, h / 2);
    g.fillStyle(fill, 1); g.fillRoundedRect(-w / 2, -h / 2 + (down ? 4 : 0), w, h, h / 2);
    g.lineStyle(3, opt.line ?? C.cream, 1); g.strokeRoundedRect(-w / 2 + 4, -h / 2 + 4 + (down ? 4 : 0), w - 8, h - 8, (h - 8) / 2);
  };
  draw(false);
  const t = T(scene, 0, -1, label, opt.size || 22, opt.color || '#fff8d0', { bold: true });
  c.add([g, t]); c.setSize(w, h);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerdown', () => { draw(true); t.y = 3; });
  c.on('pointerout', () => { draw(false); t.y = -1; });
  c.on('pointerup', () => { draw(false); t.y = -1; if (!c.disabled && c.visible) { SFX.click(); onClick && scene.time.delayedCall(0, onClick); } });
  c.setEnabled = (on) => { c.disabled = !on; c.setAlpha(on ? 1 : 0.45); };
  c.label = t;
  return c;
}

/* 顶部任务栏 */
function hud(scene, chapter, objective) {
  const c = scene.add.container(0, 0).setDepth(900);
  const g = scene.add.graphics();
  g.fillStyle(C.ink, 0.86); g.fillRect(0, 0, W, 58);
  g.fillStyle(C.magenta, 1); g.fillRect(0, 58, W, 4);
  g.fillStyle(C.yellow, 1); for (let x = 0; x < W; x += 24) g.fillTriangle(x, 62, x + 12, 70, x + 24, 62);
  const chip = scene.add.graphics();
  chip.fillStyle(C.magenta, 1); chip.fillRoundedRect(14, 10, 10 + chapter.length * 22, 38, 19);
  const ct = T(scene, 19 + chapter.length * 11, 29, chapter, 20, '#fff8d0', { bold: true });
  const ot = T(scene, 40 + chapter.length * 22, 29, objective, 22, '#fbf5a2', { ox: 0 });
  const st = T(scene, W - 20, 29, '', 17, '#ffd0ee', { ox: 1, sans: true });
  c.add([g, chip, ct, ot, st]);
  return {
    c,
    setObjective(s) { ot.setText(s); scene.tweens.add({ targets: ot, alpha: { from: 0.2, to: 1 }, duration: 300 }); },
    setStep(s) { st.setText(s); }
  };
}

/* 浮动提示 */
function toast(scene, text, opt = {}) {
  const x = opt.x ?? W / 2, y = opt.y ?? 110;
  const t = T(scene, 0, 0, text, opt.size || 22, opt.color || '#fff8d0', { bold: true, wrap: opt.wrap || 560, align: 'center' });
  const w = Math.min(620, t.width + 44), h = t.height + 22;
  const g = scene.add.graphics();
  g.fillStyle(opt.fill ?? C.ink, 0.92); g.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
  g.lineStyle(3, opt.edge ?? C.yellow, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
  const c = scene.add.container(x, y, [g, t]).setDepth(1500).setAlpha(0);
  scene.tweens.add({ targets: c, alpha: 1, y: y + 6, duration: 180 });
  scene.time.delayedCall(opt.ms || 1800, () => scene.tweens.add({ targets: c, alpha: 0, duration: 260, onComplete: () => c.destroy() }));
  return c;
}

/* 说话气泡 */
function bubble(scene, x, y, text, opt = {}) {
  const w = opt.w || 300;
  const t = T(scene, 0, 0, text, opt.size || 19, '#2a1030', { wrap: w - 28, ox: 0, oy: 0 });
  const h = t.height + 22;
  const g = scene.add.graphics();
  g.fillStyle(C.white, 1); g.lineStyle(3, opt.edge ?? C.magenta, 1);
  g.fillRoundedRect(0, 0, w, h, 14); g.strokeRoundedRect(0, 0, w, h, 14);
  const tail = opt.tail || 'left';
  if (tail === 'left') { g.fillTriangle(-14, h / 2, 2, h / 2 - 10, 2, h / 2 + 10); g.lineBetween(-14, h / 2, 1, h / 2 - 10); g.lineBetween(-14, h / 2, 1, h / 2 + 10); }
  if (tail === 'down') { g.fillTriangle(30, h + 14, 22, h - 1, 44, h - 1); g.lineBetween(30, h + 14, 22, h); g.lineBetween(30, h + 14, 44, h); }
  t.setPosition(14, 11);
  const c = scene.add.container(x, y, [g, t]).setDepth(opt.depth ?? 600);
  c.setScale(0.6).setAlpha(0);
  scene.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 220, ease: 'Back.out' });
  c.bh = h;
  return c;
}

/* 底部对白框：lines=[{who,text}]，点击推进，结束回调 */
function dialog(scene, lines, onDone, opt = {}) {
  const c = scene.add.container(0, 0).setDepth(opt.depth ?? 1200);
  const y0 = opt.top ? 78 : H - 178;
  const blocker = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, opt.dim ?? 0.0).setInteractive();
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.25); g.fillRoundedRect(36, y0 + 8, W - 72, 158, 22);
  g.fillStyle(C.cream, 1); g.fillRoundedRect(30, y0, W - 60, 158, 22);
  g.lineStyle(5, C.magenta, 1); g.strokeRoundedRect(30, y0, W - 60, 158, 22);
  g.lineStyle(2, C.blue, 1); g.strokeRoundedRect(40, y0 + 10, W - 80, 138, 16);
  const head = scene.add.image(120, y0 + 80, '__WHITE').setVisible(false);
  const nameBg = scene.add.graphics();
  const name = T(scene, 0, y0 - 2, '', 20, '#fff8d0', { bold: true, ox: 0 });
  const body = T(scene, 230, y0 + 34, '', 24, '#2a1030', { ox: 0, oy: 0, wrap: W - 330, lineSpacing: 8 });
  const more = T(scene, W - 70, y0 + 132, '点击继续 ▸', 16, '#9a0078', { ox: 1, sans: true });
  scene.tweens.add({ targets: more, alpha: 0.3, yoyo: true, repeat: -1, duration: 600 });
  c.add([blocker, g, head, nameBg, name, body, more]);
  let i = -1, typing = null, full = '', k = 0;
  const stopTyping = () => { if (typing) { typing.remove(); typing = null; } };
  c.once('destroy', stopTyping);
  const show = () => {
    i++;
    if (i >= lines.length) { stopTyping(); c.destroy(); onDone && onDone(); return; }
    const L = lines[i], who = WHO[L.who] || WHO.narr;
    if (who.head) {
      head.setTexture(who.head).setVisible(true);
      const s = Math.min(150 / head.width, 140 / head.height); head.setScale(s);
      body.x = 230; body.setWordWrapWidth(W - 330);
    } else { head.setVisible(false); body.x = 80; body.setWordWrapWidth(W - 180); }
    nameBg.clear();
    if (who.name) {
      name.setText(who.name); name.x = body.x + 14;
      nameBg.fillStyle(who.color, 1); nameBg.fillRoundedRect(body.x, y0 - 18, name.width + 28, 34, 17);
    } else name.setText('');
    full = L.text; body.setText('');
    k = 0; stopTyping();
    typing = scene.time.addEvent({ delay: 28, repeat: full.length - 1, callback: () => { if (!body.active) return stopTyping(); k++; body.setText(full.slice(0, k)); } });
  };
  blocker.on('pointerup', () => {
    if (k < full.length) { stopTyping(); k = full.length; body.setText(full); return; }
    SFX.click(); show();
  });
  show();
  return c;
}

/* 场景切换（成功条件只触发一次） */
function goTo(scene, key, data) {
  if (scene._leaving) return;
  scene._leaving = true;
  scene.input.enabled = false;
  scene.cameras.main.fadeOut(380, 20, 6, 24);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
}
function fadeIn(scene, transient = []) {
  scene._leaving = false;
  transient.forEach(k => { scene[k] = undefined; });
  scene.cameras.main.fadeIn(380, 20, 6, 24);
}

/* 虚线圆/框 */
function dashedRect(g, x, y, w, h, dash = 10, gap = 7) {
  const seg = (x1, y1, x2, y2) => {
    const len = Math.hypot(x2 - x1, y2 - y1), dx = (x2 - x1) / len, dy = (y2 - y1) / len;
    for (let d = 0; d < len; d += dash + gap) { const e = Math.min(len, d + dash); g.lineBetween(x1 + dx * d, y1 + dy * d, x1 + dx * e, y1 + dy * e); }
  };
  seg(x, y, x + w, y); seg(x + w, y, x + w, y + h); seg(x + w, y + h, x, y + h); seg(x, y + h, x, y);
}
function dashedCircle(g, x, y, r, n = 28) {
  for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 0.55) / n * Math.PI * 2; g.beginPath(); g.arc(x, y, r, a0, a1); g.strokePath(); }
}

/* 闪光粒子 */
function sparkle(scene, x, y, color = C.yellow, n = 14, depth = 800) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 70;
    const s = scene.add.image(x, y, 'spark').setTint(color).setDepth(depth).setScale(0.4 + Math.random() * 0.6);
    scene.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 0.1, angle: 180, duration: 600 + Math.random() * 400, ease: 'Cubic.out', onComplete: () => s.destroy() });
  }
}

/* ---------------- 音频总线（音乐与音效共用一个 AudioContext，避免移动端多上下文互相打断） ---------------- */
const AUDIO = (() => {
  let ctx = null, master = null, music = null, sfx = null, wet = null, muted = false;
  const impulse = (a, seconds, decay) => {
    const len = Math.floor(a.sampleRate * seconds), buf = a.createBuffer(2, len, a.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  };
  function ensure() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ctx.state === 'suspended') { try { const pr = ctx.resume(); if (pr && pr.catch) pr.catch(() => { }); } catch (e) { } }
    if (!master) {
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 5;
      comp.attack.value = 0.006; comp.release.value = 0.26;
      master.connect(comp); comp.connect(ctx.destination);
      music = ctx.createGain(); music.gain.value = 0.55; music.connect(master);
      sfx = ctx.createGain(); sfx.gain.value = 0.75; sfx.connect(master);
      const conv = ctx.createConvolver(); conv.buffer = impulse(ctx, 2.0, 2.6);
      wet = ctx.createGain(); wet.gain.value = 0.20;
      music.connect(conv); conv.connect(wet); wet.connect(master);
    }
    return ctx;
  }
  return {
    ensure, ctx: () => ctx, music: () => music, sfx: () => sfx,
    now: () => ctx ? ctx.currentTime : 0,
    get muted() { return muted; },
    setMuted(m) {
      muted = m;
      if (master && ctx) {
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setTargetAtTime(m ? 0 : 0.9, t, 0.06);
      }
    },
    toggleMuted() { this.setMuted(!muted); return muted; }
  };
})();

/* ---------------- 音效（WebAudio 合成，无需素材） ---------------- */
const SFX = (() => {
  const ac = () => AUDIO.ensure();
  const out = () => AUDIO.sfx() || (AUDIO.ctx() && AUDIO.ctx().destination);
  const tone = (f, d = 0.15, type = 'sine', v = 0.15, slide = 0, delay = 0) => {
    const a = ac(); if (!a || AUDIO.muted) return;
    const t0 = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t0 + d);
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + d);
    o.connect(g); g.connect(out()); o.start(t0); o.stop(t0 + d + 0.02);
  };
  const noise = (d = 0.3, v = 0.2, lp = 800, delay = 0) => {
    const a = ac(); if (!a || AUDIO.muted) return;
    const len = a.sampleRate * d, b = a.createBuffer(1, len, a.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    f.type = 'lowpass'; f.frequency.value = lp; g.gain.value = v;
    s.buffer = b; s.connect(f); f.connect(g); g.connect(out()); s.start(a.currentTime + delay);
  };
  return {
    unlock: ac,
    toggle() { return AUDIO.toggleMuted(); },
    get muted() { return AUDIO.muted; },
    click() { tone(880, 0.06, 'triangle', 0.08); },
    drop() { tone(520, 0.1, 'sine', 0.14, 200); },
    ok() { tone(660, 0.12, 'triangle', 0.14); tone(880, 0.12, 'triangle', 0.14, 0, 0.1); tone(1320, 0.25, 'triangle', 0.12, 0, 0.2); },
    bad() { tone(220, 0.2, 'square', 0.07, -60); tone(180, 0.25, 'square', 0.06, -40, 0.12); },
    brew() { noise(1.2, 0.12, 1400); tone(300, 0.6, 'sine', 0.05, 300); },
    page() { noise(0.25, 0.15, 3000); },
    drum() { tone(110, 0.35, 'sine', 0.5, -60); noise(0.2, 0.35, 500); },
    roar() { tone(140, 0.5, 'sawtooth', 0.12, -70); noise(0.5, 0.2, 700); },
    blow() { noise(0.45, 0.12, 2200); },
    light() { tone(990, 0.1, 'sine', 0.1); tone(1480, 0.2, 'sine', 0.08, 0, 0.08); },
    rain() { noise(1.4, 0.18, 4000); },
    dead() { tone(160, 0.5, 'triangle', 0.12, -80); },
    step() { tone(520, 0.05, 'sine', 0.06); tone(760, 0.04, 'sine', 0.04, 0, 0.04); },
    dice() { for (let i = 0; i < 5; i++) noise(0.06, 0.1, 2600, i * 0.09); tone(300, 0.3, 'triangle', 0.1, 160, 0.45); },
    pick() { tone(980, 0.07, 'sine', 0.08); },
    grind() { noise(0.28, 0.14, 900); tone(140, 0.24, 'sine', 0.1, -40); }
  };
})();

/* 静音按钮（各场景右下角） */
function muteButton(scene) {
  const t = T(scene, W - 26, H - 22, AUDIO.muted ? '🔇' : '🔊', 22, '#fff', { ox: 1, sans: true }).setDepth(2000).setInteractive({ useHandCursor: true });
  t.on('pointerup', () => { const m = SFX.toggle(); t.setText(m ? '🔇' : '🔊'); });
  return t;
}

/* ---------------- 背景音乐（连续生成式配乐：日/夜两层常驻，交叉淡化，不重启、不断句） ----------------
   说明：所有声部共用一条不断前进的八分音符时钟；日夜只是两组音色/密度的交叉淡化，
   换场不重置小节、不换主音，因此场景切换、对话、过场都不会出现音乐断口。 */
const BGM = (() => {
  const SPB = 0.30;                    // 100 BPM 的八分音符
  // 前瞻 6 秒 + 100ms 轮询：守灯夜等重负载场景主线程卡顿、后台标签节流时也不断粮
  const LOOKAHEAD = 6.0, TICK = 100;
  let timer = null, running = false, step = 0, nextT = 0;
  let mode = 'festive', pendingMode = null, day = null, night = null, windGain = null;
  let dayTarget = 1.0, nightTarget = 0.10;

  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  /* C - Am - F - G，每小节一个和弦；日夜共用同一和声，换场只换配器 */
  const CHORDS = [
    { root: 48, fifth: 55, third: 52 },
    { root: 45, fifth: 52, third: 48 },
    { root: 41, fifth: 48, third: 45 },
    { root: 43, fifth: 50, third: 47 }
  ];

  /* 日间筝句：每句 4 小节（32 个八分音符），四句循环 */
  const DAY_PHRASES = [
    [[0, 76, 2], [2, 79, 2], [4, 81, 2], [6, 79, 2], [8, 76, 2], [10, 74, 2], [12, 72, 4],
     [16, 74, 2], [18, 76, 2], [20, 79, 2], [22, 76, 2], [24, 74, 2], [26, 72, 6]],
    [[0, 81, 2], [2, 79, 2], [4, 76, 2], [6, 74, 2], [8, 76, 2], [10, 79, 2], [12, 81, 4],
     [16, 79, 2], [18, 76, 2], [20, 74, 2], [22, 72, 2], [24, 74, 8]],
    [[0, 72, 2], [2, 74, 2], [4, 76, 2], [6, 79, 2], [8, 81, 2], [10, 79, 2], [12, 76, 4],
     [16, 74, 2], [18, 76, 2], [20, 79, 2], [22, 81, 2], [24, 79, 2], [26, 76, 2], [28, 74, 4]],
    [[0, 76, 2], [2, 79, 2], [4, 81, 2], [6, 84, 2], [8, 81, 2], [10, 79, 2], [12, 76, 4],
     [16, 74, 2], [18, 72, 2], [20, 74, 2], [22, 76, 2], [24, 72, 8]]
  ];

  /* 夜间低音短句：8 小节一循环，音符稀疏、时值长 */
  const NIGHT_NOTES = [
    [0, 57, 4], [6, 60, 3], [12, 64, 4], [20, 62, 3], [26, 60, 4],
    [32, 57, 4], [40, 55, 3], [46, 57, 4], [52, 60, 4], [58, 57, 6]
  ];

  /* 夜间埙/箫旋律：16 小节一循环，与和弦同步走，保证夜里音乐仍然成句不空窗 */
  const NIGHT_MELODY = [
    [0, 72, 10], [14, 74, 6], [22, 76, 8], [34, 74, 6], [42, 72, 10],
    [56, 69, 6], [64, 72, 10], [78, 74, 6], [86, 76, 12],
    [104, 79, 8], [116, 76, 6], [124, 74, 10],
    [140, 76, 6], [148, 72, 8], [160, 74, 6], [168, 72, 12],
    [186, 69, 8], [198, 67, 6], [206, 69, 10],
    [222, 72, 6], [230, 74, 8], [242, 76, 6], [250, 72, 14]
  ];

  function nightFlute(f, t, dur, vol) {
    const a = AUDIO.ctx(); if (!a || !night) return;
    const o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter();
    o.type = 'sine'; o.frequency.value = f;
    o2.type = 'sine'; o2.frequency.value = f * 1.005;   // 轻微失谐做出箫的颤感
    lp.type = 'lowpass'; lp.frequency.value = Math.min(1200, f * 2.4);
    const vib = a.createOscillator(), vg = a.createGain();
    vib.frequency.value = 4.2; vg.gain.value = f * 0.004;
    vib.connect(vg); vg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(1.2, dur * 0.3));
    g.gain.setValueAtTime(vol, t + Math.max(1.2, dur * 0.7));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(night);
    o.start(t); o2.start(t); vib.start(t);
    o.stop(t + dur + 0.1); o2.stop(t + dur + 0.1); vib.stop(t + dur + 0.1);
  }

  function pluck(f, t, dur, vol, isNight) {
    const a = AUDIO.ctx(); if (!a) return;
    const bus = isNight ? night : day; if (!bus) return;
    const o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter();
    o.type = 'triangle'; o.frequency.setValueAtTime(f * 0.994, t); o.frequency.linearRampToValueAtTime(f, t + 0.035);
    o2.type = 'sine'; o2.frequency.value = f * 2.002;
    lp.type = 'lowpass';
    const hi = isNight ? Math.min(1500, f * 3.2) : Math.min(5200, f * 7.5);
    lp.frequency.setValueAtTime(hi, t);
    lp.frequency.exponentialRampToValueAtTime(Math.max(220, f * 1.4), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(bus);
    o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }

  function pad(freqs, t, dur, vol, isNight) {
    const a = AUDIO.ctx(); if (!a) return;
    const bus = isNight ? night : day; if (!bus) return;
    freqs.forEach((f, i) => {
      const o = a.createOscillator(), g = a.createGain(), lp = a.createBiquadFilter();
      o.type = isNight ? 'sine' : 'triangle';
      o.frequency.value = f; o.detune.value = (i - 1) * 5;
      lp.type = 'lowpass'; lp.frequency.value = isNight ? 640 : 1500;
      const v = vol / (i * 0.7 + 1.4);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v, t + dur * 0.28);
      g.gain.setValueAtTime(v, t + dur * 0.72);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(lp); lp.connect(g); g.connect(bus);
      o.start(t); o.stop(t + dur + 0.12);
    });
  }

  function flute(f, t, dur, vol) {
    const a = AUDIO.ctx(); if (!a || !day) return;
    const o = a.createOscillator(), g = a.createGain(), l = a.createOscillator(), lg = a.createGain();
    o.type = 'sine'; o.frequency.value = f;
    l.frequency.value = 4.7; lg.gain.value = f * 0.006;
    l.connect(lg); lg.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.45);
    g.gain.setValueAtTime(vol, t + Math.max(0.6, dur - 0.6));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(day);
    o.start(t); l.start(t); o.stop(t + dur + 0.08); l.stop(t + dur + 0.08);
  }

  function drum(t, vol, isNight) {
    const a = AUDIO.ctx(); if (!a) return;
    const bus = isNight ? night : day; if (!bus) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(isNight ? 92 : 132, t);
    o.frequency.exponentialRampToValueAtTime(isNight ? 38 : 48, t + 0.26);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (isNight ? 0.42 : 0.3));
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.46);
    const len = a.sampleRate * 0.05, b = a.createBuffer(1, len, a.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), ng = a.createGain();
    f.type = 'lowpass'; f.frequency.value = 460; ng.gain.value = vol * 0.35;
    s.buffer = b; s.connect(f); f.connect(ng); ng.connect(bus); s.start(t);
  }

  function wood(t, vol) {
    const a = AUDIO.ctx(); if (!a || !day) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'square'; o.frequency.value = 1680;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    o.connect(g); g.connect(day); o.start(t); o.stop(t + 0.06);
  }

  function shaker(t, vol) {
    const a = AUDIO.ctx(); if (!a || !day) return;
    const len = a.sampleRate * 0.045, b = a.createBuffer(1, len, a.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    f.type = 'highpass'; f.frequency.value = 5200; g.gain.value = vol;
    s.buffer = b; s.connect(f); f.connect(g); g.connect(day); s.start(t);
  }

  function gong(t, vol) {
    const a = AUDIO.ctx(); if (!a || !day) return;
    [196, 294, 392].forEach((f, i) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(vol / (i + 1.5), t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 2.6);
      o.connect(g); g.connect(day); o.start(t); o.stop(t + 2.7);
    });
  }

  function bell(t, f, vol) {
    const a = AUDIO.ctx(); if (!a || !night) return;
    [1, 2.01, 2.98, 4.12].forEach((m, i) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = f * m;
      g.gain.setValueAtTime(vol / (i * 1.3 + 1), t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.8 + i * 0.4);
      o.connect(g); g.connect(night); o.start(t); o.stop(t + 2.8);
    });
  }

  function buildWind(a) {
    const len = a.sampleRate * 4, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = last * 0.965 + w * 0.035; d[i] = last * 2.6; }
    const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 430;
    windGain = a.createGain(); windGain.gain.value = 0.10;
    const lfo = a.createOscillator(), lg = a.createGain();
    lfo.frequency.value = 0.07; lg.gain.value = 0.045;
    lfo.connect(lg); lg.connect(windGain.gain);
    src.connect(lp); lp.connect(windGain); windGain.connect(night);
    src.start(); lfo.start();
  }

  function scheduleStep(s, t) {
    const bar = Math.floor(s / 8), inBar = s % 8, chord = CHORDS[bar % 4];
    // 换模式只在整小节边界生效：交叉淡化与乐句对齐，避免切到半句上产生拼接感
    if (inBar === 0 && pendingMode !== null) {
      mode = pendingMode; pendingMode = null;
      dayTarget = mode === 'night' ? 0.10 : 1.0;
      nightTarget = mode === 'night' ? 1.0 : 0.10;
      const a = AUDIO.ctx(); const now = a ? a.currentTime : t;
      if (a && day) {
        const rt = Math.max(t, now + 0.05);
        [day, night].forEach(g => {
          if (g.gain.cancelAndHoldAtTime) g.gain.cancelAndHoldAtTime(rt);
          else { const v = g.gain.value; g.gain.cancelScheduledValues(rt); g.gain.setValueAtTime(v, rt); }
        });
        day.gain.linearRampToValueAtTime(dayTarget, rt + 5.5);
        night.gain.linearRampToValueAtTime(nightTarget, rt + 5.5);
      }
    }
    if (inBar === 0) pad([midi(chord.root), midi(chord.root + 7), midi(chord.root + 12)], t, SPB * 8 * 1.12, 0.050, false);
    if (inBar === 0 && bar % 2 === 0) pad([midi(chord.root - 12), midi(chord.root - 5), midi(chord.root)], t, SPB * 16 * 1.06, 0.060, true);

    const phrase = DAY_PHRASES[Math.floor(bar / 4) % DAY_PHRASES.length];
    const local = s % 32;
    for (let i = 0; i < phrase.length; i++) {
      const ev = phrase[i];
      if (ev[0] !== local) continue;
      const f = midi(ev[1]);
      pluck(f, t, SPB * ev[2] * 0.96, 0.082 + (local % 4 === 0 ? 0.014 : 0), false);
      if (rnd(s + ev[1]) < 0.10) pluck(f * 2, t + 0.025, SPB * Math.max(1, ev[2] * 0.5), 0.016, false);
      if (rnd(s + ev[1] + 7) < 0.08) pluck(midi(ev[1] - 12), t + 0.012, SPB * ev[2] * 0.8, 0.022, true);
    }
    const nl = s % 64;
    for (let i = 0; i < NIGHT_NOTES.length; i++) {
      const ev = NIGHT_NOTES[i];
      if (ev[0] === nl) pluck(midi(ev[1]), t, SPB * ev[2] * 1.35, 0.070, true);
    }
    // 夜间旋律：与和弦同步的箫句，让守灯夜里音乐依然成句、不显空窗
    const nm = s % 256;
    for (let i = 0; i < NIGHT_MELODY.length; i++) {
      const ev = NIGHT_MELODY[i];
      if (ev[0] === nm) nightFlute(midi(ev[1]), t, SPB * ev[2] * 0.92, 0.030);
    }

    if (local === 0 || local === 16) {
      const n = local === 0 ? chord.third + 12 : chord.fifth + 12;
      flute(midi(n), t, SPB * 11, 0.026);
    }
    if (inBar === 0 || inBar === 4) drum(t, 0.20, false);
    else if (inBar === 6 && bar % 2 === 1) drum(t, 0.10, false);
    if (inBar === 3 || inBar === 7) wood(t, 0.032);
    if (s % 2 === 0) shaker(t, 0.010);
    if (inBar === 0 && bar % 8 === 0) gong(t, 0.075);

    if (inBar === 0 && bar % 2 === 0) drum(t, 0.12, true);
    if (inBar === 0 && bar % 8 === 2) bell(t, midi(84), 0.032);
    if (inBar === 4 && bar % 8 === 5) bell(t, midi(79), 0.022);
  }

  function tick() {
    const a = AUDIO.ctx();
    if (!a || !running || a.state !== 'running') return;
    const now = a.currentTime;
    if (nextT < now - 0.25) {
      // 落后时按整小节对齐追赶：既追上时间，又不把乐句/和弦切在半截
      const missed = Math.ceil((now - nextT) / SPB);
      const skip = missed + ((8 - (step + missed) % 8) % 8);
      step += skip; nextT += skip * SPB;
      if (nextT < now + 0.02) nextT = now + 0.05;
    }
    while (nextT < now + LOOKAHEAD) {
      try { scheduleStep(step, nextT); } catch (e) { }
      step++; nextT += SPB;
    }
  }

  return {
    ensure() {
      const a = AUDIO.ensure(); if (!a) return;
      if (!day) {
        day = a.createGain(); day.gain.value = 0; day.connect(AUDIO.music());
        night = a.createGain(); night.gain.value = 0; night.connect(AUDIO.music());
        buildWind(a);
        day.gain.setValueAtTime(0, a.currentTime);
        day.gain.linearRampToValueAtTime(dayTarget, a.currentTime + 2.6);
        night.gain.setValueAtTime(0, a.currentTime);
        night.gain.linearRampToValueAtTime(nightTarget, a.currentTime + 3.4);
      }
      if (!running) {
        running = true;
        nextT = a.currentTime + 0.12;
        step = 0;
        timer = setInterval(tick, TICK);
      }
    },
    setMode(m) {
      const want = m === 'night' ? 'night' : 'festive';
      this.ensure();
      const a = AUDIO.ctx(); if (!a || !day) return;
      if (!running) {                 // 音乐还没起：直接以目标模式启动
        mode = want;
        dayTarget = mode === 'night' ? 0.10 : 1.0;
        nightTarget = mode === 'night' ? 1.0 : 0.10;
        const t = a.currentTime;
        day.gain.setValueAtTime(0, t); day.gain.linearRampToValueAtTime(dayTarget, t + 3);
        night.gain.setValueAtTime(0, t); night.gain.linearRampToValueAtTime(nightTarget, t + 3);
        return;
      }
      if (want === mode && pendingMode === null) return;   // 同模式重复调用不重触发淡化
      if (want === pendingMode) return;
      // 记下待生效模式，由 scheduleStep 在下一个整小节边界平滑交叉淡化
      pendingMode = want;
    },
    setMuted(m) { AUDIO.setMuted(m); }
  };
})();
['pointerdown', 'touchend'].forEach(ev => window.addEventListener(ev, () => BGM.ensure(), { once: true, passive: true }));
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { const a = AUDIO.ctx(); if (a) BGM.ensure(); }
});
