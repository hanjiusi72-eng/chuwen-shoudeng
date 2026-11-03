/* 除瘟守灯 · 核心：常量、全局状态、通用 UI、音效 */
const W = 1334, H = 750;
const FONT = '"Songti SC","STSongti-SC","Noto Serif SC","Source Han Serif SC","SimSun",serif';
const FONT_SANS = '"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
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

/* ---------------- 音效（WebAudio 合成，无需素材） ---------------- */
const SFX = (() => {
  let ctx = null, muted = false;
  const ac = () => { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (ctx && ctx.state === 'suspended') ctx.resume(); return ctx; };
  const tone = (f, d = 0.15, type = 'sine', v = 0.15, slide = 0, delay = 0) => {
    const a = ac(); if (!a || muted) return;
    const t0 = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t0 + d);
    g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + d);
    o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + d + 0.02);
  };
  const noise = (d = 0.3, v = 0.2, lp = 800, delay = 0) => {
    const a = ac(); if (!a || muted) return;
    const len = a.sampleRate * d, b = a.createBuffer(1, len, a.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    f.type = 'lowpass'; f.frequency.value = lp; g.gain.value = v;
    s.buffer = b; s.connect(f); f.connect(g); g.connect(a.destination); s.start(a.currentTime + delay);
  };
  return {
    unlock: ac,
    toggle() { muted = !muted; return muted; },
    get muted() { return muted; },
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
    dead() { tone(160, 0.5, 'triangle', 0.12, -80); }
  };
})();

/* 静音按钮（各场景右下角） */
function muteButton(scene) {
  const t = T(scene, W - 26, H - 22, SFX.muted ? '🔇' : '🔊', 22, '#fff', { ox: 1, sans: true }).setDepth(2000).setInteractive({ useHandCursor: true });
  t.on('pointerup', () => t.setText(SFX.toggle() ? '🔇' : '🔊'));
  return t;
}
