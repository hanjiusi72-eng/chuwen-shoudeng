/* 交互 4：沿轮廓描画龙纹、虎纹，选择吉语 */
function drawFinalLamp(scene, x, y, s = 1, opt = {}) {
  const c = scene.add.container(x, y);
  if (opt.glow) c.add(scene.add.image(0, 0, 'glow').setTint(0xffd060).setScale(3.2 * s).setAlpha(0.7));
  const g = scene.add.graphics();
  g.lineStyle(4 * s, 0x7a3a10, 1); g.lineBetween(0, -250 * s, 0, -215 * s);
  g.fillStyle(C.red, 1); g.fillRoundedRect(-80 * s, -222 * s, 160 * s, 26 * s, 6 * s); g.fillRoundedRect(-80 * s, 196 * s, 160 * s, 26 * s, 6 * s);
  g.fillStyle(opt.lit ? 0xfff0b0 : 0xfffdf4, 1); g.fillEllipse(0, 0, 380 * s, 430 * s);
  g.lineStyle(2 * s, 0xe0d4c0, 1); g.strokeEllipse(0, 0, 380 * s, 430 * s); g.strokeEllipse(0, 0, 230 * s, 430 * s);
  g.fillStyle(C.yellow, 1); g.fillRect(-70 * s, -200 * s, 140 * s, 5 * s); g.fillRect(-70 * s, 194 * s, 140 * s, 5 * s);
  g.fillStyle(C.magenta, 1); g.fillRect(-6 * s, 222 * s, 12 * s, 14 * s); g.fillTriangle(-16 * s, 266 * s, 16 * s, 266 * s, 0, 232 * s);
  c.add(g);
  if (opt.patterns !== false) {
    c.add(scene.add.image(-74 * s, -50 * s, 'pattern_dragon').setScale(0.4 * s));
    c.add(scene.add.image(74 * s, -50 * s, 'pattern_tiger').setScale(0.4 * s));
  }
  const b = BLESSINGS.find(b => b.id === G.blessingId);
  if (b && opt.blessing !== false) c.add(T(scene, 0, 112 * s, b.text, Math.round(44 * s), '#e8202a', { bold: true }));
  return c;
}

class DecorateScene extends Phaser.Scene {
  constructor() { super('Decorate'); }
  create() {
    fadeIn(this, ['finished', 'drawing', 'rt', 'brush', 'dragonImg', 'tigerImg', 'done']);
    this.add.image(W / 2, H / 2, 'bg_pattern').setDisplaySize(W, H);
    this.hud = hud(this, '天明 · 落笔祈愿', '沿着淡淡的轮廓描出龙纹');
    this.LX = 667; this.LY = 408;
    this.lamp = drawFinalLamp(this, this.LX, this.LY, 1, { patterns: false, blessing: false });
    this.canMask = this.renderer.type === Phaser.WEBGL;
    this.stage = 'dragon';
    this.leftPanel();
    this.rightPanel();
    this.blessText = T(this, this.LX, this.LY + 112, '', 44, '#e8202a', { bold: true }).setDepth(50);
    this.startPattern('dragon');
    this.input.on('pointerdown', p => this.penDown(p));
    this.input.on('pointermove', p => this.penMove(p));
    this.input.on('pointerup', () => { this.drawing = false; });
    this.input.on('gameout', () => { this.drawing = false; });
    muteButton(this);
    this.time.delayedCall(400, () => dialog(this, [{ who: 'dragon', text: '用手指（或鼠标）按住，沿着灯面上淡淡的龙纹来回描。描出八成，剩下的会自动补全。' }]));
  }
  leftPanel() {
    panel(this, 28, 86, 300, 420, { fill: C.cream });
    T(this, 178, 116, '画 灯 步 骤', 21, '#9a0078', { bold: true });
    this.stepT = ['① 描龙纹', '② 描虎纹', '③ 选一句吉语', '④ 完成这盏灯'].map((s, i) => T(this, 60, 166 + i * 44, s, 20, '#8a8a96', { ox: 0 }));
    this.progT = T(this, 178, 352, '', 18, '#2a1030', { sans: true });
    this.progG = this.add.graphics();
    this.clearB = button(this, 178, 444, '清除当前纹样', () => this.clearCurrent(), { w: 220, h: 50, size: 19, fill: C.blue, edge: 0x00248a });
    T(this, 178, 545, '描到轮廓外不扣分，\n可以放心地描。', 16, '#fff8d0', { sans: true, align: 'center', stroke: '#9a0078', strokeThickness: 4 });
  }
  rightPanel() {
    this.rp = this.add.container(0, 0);
    this.rp.add(panel(this, 1006, 86, 300, 470, { fill: C.cream }));
    this.rp.add(T(this, 1156, 116, '吉 语', 22, '#9a0078', { bold: true }));
    this.rpHint = T(this, 1156, 300, '先描好龙纹和虎纹，\n再来挑选吉语。', 18, '#6a6a7a', { sans: true, align: 'center' });
    this.rp.add(this.rpHint);
    this.bBtns = BLESSINGS.map((b, i) => {
      const btn = button(this, 1156, 196 + i * 90, b.text, () => this.pickBlessing(b), { w: 220, h: 62, size: 28, fill: 0xffffff, edge: C.magenta, color: '#e8202a', line: C.magenta });
      btn.setVisible(false); this.rp.add(btn); return btn;
    });
    this.doneB = button(this, 1156, 640, '完成这盏灯 ✔', () => this.finish(), { w: 250, h: 62, size: 23 });
    this.doneB.setVisible(false);
  }
  refreshSteps() {
    const idx = { dragon: 0, tiger: 1, bless: 2 }[this.stage];
    this.stepT.forEach((t, i) => { t.setColor(i < idx ? '#118a5a' : i === idx ? '#e8007a' : '#8a8a96').setFontStyle(i === idx ? 'bold' : 'normal'); t.setText((i < idx ? '✔ ' : '') + t.text.replace('✔ ', '')); });
  }

  /* ---------- 纹样描画 ---------- */
  startPattern(kind) {
    this.stage = kind; this.refreshSteps();
    const key = 'pattern_' + kind, size = 300;
    const src = this.textures.get(key).getSourceImage();
    const sc = size / Math.max(src.width, src.height);
    const x = this.LX, y = this.LY - 20;
    this.faint = this.add.image(x, y, key).setScale(sc).setAlpha(0.2).setDepth(20);
    this.full = this.add.image(x, y, key).setScale(sc).setDepth(21);
    if (this.canMask) {
      this.rt = this.make.renderTexture({ x, y, width: size + 40, height: size + 40 }, false);
      this.full.setMask(this.rt.createBitmapMask());
    } else this.full.setAlpha(0);
    // 采样点：网格中不透明像素占比 > 25% 的格子
    const cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height;
    const cx = cv.getContext('2d'); cx.drawImage(src, 0, 0);
    const data = cx.getImageData(0, 0, src.width, src.height).data;
    const step = 16, pts = [];
    for (let gy = 0; gy < src.height; gy += step) for (let gx = 0; gx < src.width; gx += step) {
      let n = 0, tot = 0;
      for (let yy = gy; yy < Math.min(src.height, gy + step); yy += 2) for (let xx = gx; xx < Math.min(src.width, gx + step); xx += 2) { tot++; if (data[(yy * src.width + xx) * 4 + 3] > 128) n++; }
      if (n / tot > 0.25) pts.push({ x: x + (gx + step / 2 - src.width / 2) * sc, y: y + (gy + step / 2 - src.height / 2) * sc, hit: false });
    }
    this.pts = pts; this.hits = 0; this.sc = sc; this.patX = x; this.patY = y; this.patSize = size;
    this.done = false;
    this.hud.setObjective(kind === 'dragon' ? '沿着淡淡的轮廓描出龙纹' : '再描出虎纹');
    this.updateProg();
  }
  penDown(p) {
    if (this.done || this.stage === 'bless' || this.dlgOpen()) return;
    if (Phaser.Math.Distance.Between(p.x, p.y, this.LX, this.LY) > 260) return;
    this.drawing = true; this.last = { x: p.x, y: p.y }; this.stamp(p.x, p.y);
  }
  penMove(p) {
    if (!this.drawing || this.done) return;
    const d = Phaser.Math.Distance.Between(this.last.x, this.last.y, p.x, p.y);
    const n = Math.max(1, Math.ceil(d / 6));
    for (let i = 1; i <= n; i++) this.stamp(this.last.x + (p.x - this.last.x) * i / n, this.last.y + (p.y - this.last.y) * i / n);
    this.last = { x: p.x, y: p.y };
  }
  stamp(x, y) {
    const R = 24;
    let gained = 0;
    this.pts.forEach(pt => { if (!pt.hit && (pt.x - x) ** 2 + (pt.y - y) ** 2 < R * R) { pt.hit = true; gained++; } });
    if (gained && this.rt) {
      const lx = x - this.patX + (this.patSize + 40) / 2, ly = y - this.patY + (this.patSize + 40) / 2;
      if (!this.brush) { this.brush = this.make.graphics({ add: false }); this.brush.fillStyle(0xffffff, 1); this.brush.fillCircle(0, 0, R + 4); }
      this.rt.draw(this.brush, lx, ly);
    }
    if (gained) {
      this.hits += gained; this.updateProg();
      if (Math.random() < 0.3) { const s = this.add.image(x, y, 'spark').setTint(C.magenta).setScale(0.5).setDepth(30); this.tweens.add({ targets: s, alpha: 0, scale: 0.1, duration: 400, onComplete: () => s.destroy() }); }
      if (this.hits / this.pts.length >= 0.8) this.completePattern();
    }
  }
  updateProg() {
    const f = this.pts.length ? this.hits / this.pts.length : 0;
    if (!this.rt) this.full.setAlpha(f);
    const g = this.progG; g.clear();
    g.fillStyle(0xd8d0e0, 1); g.fillRoundedRect(58, 380, 240, 18, 9);
    g.fillStyle(C.magenta, 1); if (f > 0) g.fillRoundedRect(58, 380, Math.max(18, 240 * Math.min(1, f / 0.8)), 18, 9);
    this.progT.setText(`${this.stage === 'tiger' ? '虎纹' : '龙纹'}完成度 ${Math.min(100, Math.round(f / 0.8 * 100))}%`);
  }
  clearCurrent() {
    if (this.done || this.stage === 'bless') { toast(this, '已完成的纹样会保留'); return; }
    this.pts.forEach(p => p.hit = false); this.hits = 0;
    if (this.rt) this.rt.clear();
    this.updateProg();
  }
  completePattern() {
    if (this.done) return; this.done = true; this.drawing = false;
    SFX.ok();
    if (this.rt) { this.full.clearMask(true); }
    this.full.setAlpha(1);
    sparkle(this, this.patX, this.patY, C.magenta, 26, 60);
    const kind = this.stage, faint = this.faint, full = this.full;
    faint.destroy();
    const tx = this.LX + (kind === 'dragon' ? -74 : 74), ty = this.LY - 50;
    this.tweens.add({ targets: full, x: tx, y: ty, scale: 0.4, duration: 700, delay: 400, ease: 'Cubic.inOut' });
    if (kind === 'dragon') { G.dragonDone = true; this.dragonImg = full; }
    else { G.tigerDone = true; this.tigerImg = full; }
    this.time.delayedCall(1200, () => {
      if (kind === 'dragon') { toast(this, '龙纹完成！接着描虎纹'); this.startPattern('tiger'); }
      else this.toBlessing();
    });
  }
  toBlessing() {
    this.stage = 'bless'; this.refreshSteps();
    this.hud.setObjective('为灯题一句吉语（点击可替换）');
    this.progT.setText('龙纹、虎纹都已完成'); this.clearB.setEnabled(false);
    this.rpHint.setVisible(false);
    this.bBtns.forEach((b, i) => { b.setVisible(true).setScale(0); this.tweens.add({ targets: b, scale: 1, duration: 300, delay: i * 120, ease: 'Back.out' }); });
    this.doneB.setVisible(true).setEnabled(false);
    this.rp.add(T(this, 1156, 480, '只能保留一句，\n再点其他吉语即可替换', 15, '#6a6a7a', { sans: true, align: 'center' }));
  }
  pickBlessing(b) {
    G.blessingId = b.id;
    this.blessText.setText(b.text).setScale(0.5).setAlpha(0);
    this.tweens.add({ targets: this.blessText, scale: 1, alpha: 1, duration: 300, ease: 'Back.out' });
    this.bBtns.forEach((btn, i) => btn.setAlpha(BLESSINGS[i].id === b.id ? 1 : 0.55));
    this.doneB.setEnabled(true);
    this.stepT[3].setColor('#e8007a').setFontStyle('bold');
    this.hud.setObjective('满意了就点击“完成这盏灯”');
  }
  finish() {
    if (!G.blessingId) { toast(this, '先选一句吉语'); return; }
    if (this.finished) return; this.finished = true;
    SFX.ok(); sparkle(this, this.LX, this.LY, C.yellow, 30);
    goTo(this, 'Ending');
  }
  dlgOpen() { return this.children.list.some(o => o.depth === 1200); }
}
