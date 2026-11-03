/* 交互 4 · 第五幕「画灯」：心愿灯（同视频结尾——暗色照片背景上，选纹样、选祝福，落在白灯笼上） */

/* 白纸灯笼（圆角纸身 + 竖骨 + 金穗），pattern/blessing 可后置点亮 */
function drawWishLantern(scene, x, y, s = 1, opt = {}) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  // 挂绳与提环
  g.lineStyle(3 * s, 0x8a6a30, 1); g.lineBetween(0, -208 * s, 0, -178 * s);
  g.fillStyle(0xcaa02a, 1); g.fillRoundedRect(-38 * s, -180 * s, 76 * s, 14 * s, 6 * s);
  // 纸身
  g.fillStyle(0xfffdf4, 1); g.fillRoundedRect(-86 * s, -166 * s, 172 * s, 330 * s, 30 * s);
  g.lineStyle(2 * s, 0xe3dac4, 1); g.strokeRoundedRect(-86 * s, -166 * s, 172 * s, 330 * s, 30 * s);
  // 竖骨
  g.lineStyle(2 * s, 0xeadfc6, 0.9);
  [-52, -26, 0, 26, 52].forEach(rx => g.lineBetween(rx * s, -164 * s, rx * s, 162 * s));
  // 上下箍
  g.fillStyle(0xcaa02a, 1); g.fillRoundedRect(-42 * s, -170 * s, 84 * s, 10 * s, 4 * s); g.fillRoundedRect(-42 * s, 162 * s, 84 * s, 12 * s, 5 * s);
  // 穗子
  g.lineStyle(3 * s, 0xcaa02a, 1); g.lineBetween(0, 174 * s, 0, 196 * s);
  g.fillStyle(0xf2c43a, 1); g.fillRoundedRect(-13 * s, 196 * s, 26 * s, 52 * s, 6 * s);
  g.lineStyle(2 * s, 0xd9a41e, 1);
  [-7, 0, 7].forEach(rx => g.lineBetween(rx * s, 204 * s, rx * s, 244 * s));
  c.add(g);
  if (opt.glow) {
    const gl = scene.add.image(0, 0, 'glow').setTint(0xfff0c0).setScale(2.4 * s).setAlpha(0.5);
    c.addAt(gl, 0);
  }
  const ui = { c, pattern: null, chars: [] };
  if (opt.pattern) {
    const p = scene.add.image(0, -12 * s, 'pattern_' + opt.pattern).setScale(0.42 * s).setAlpha(0.8);
    if (opt.patColor) p.setTint(opt.patColor);
    c.add(p); ui.pattern = p;
  }
  if (opt.blessing) ui.chars = wishBlessingChars(scene, c, opt.blessing, s);
  return ui;
}

/* 祝福字：竖排写在灯面上（先淡后浓，像落笔） */
function wishBlessingChars(scene, c, word, s = 1, animated = false) {
  const col = '#cf1420';
  const gap = 78 * s;
  // 字落在纹样下方的空白灯面上
  const y0 = 60 * s;
  return word.split('').map((ch, i) => {
    const t = scene.add.text(0, y0 + i * gap, ch, {
      fontFamily: SERIF, fontSize: Math.round(64 * s) + 'px', color: col,
      fontStyle: 'bold', resolution: TEXT_RES
    }).setOrigin(0.5).setAlpha(animated ? 0.12 : 1);
    c.add(t);
    if (animated) {
      scene.tweens.add({ targets: t, alpha: 1, duration: 620, delay: 260 + i * 360, ease: 'Quad.out' });
      scene.tweens.add({ targets: t, scale: 1.12, duration: 200, delay: 260 + i * 360, yoyo: true });
    }
    return t;
  });
}

class DecorateScene extends Phaser.Scene {
  constructor() { super('Decorate'); }
  create() {
    fadeIn(this, ['chipG', 'lampUI']);
    // 暗色照片背景（视频同款：匠人工作照压暗）
    this.add.image(W / 2, H / 2, this.textures.exists('end_photo') ? 'end_photo' : 'bg_village_dim').setDisplaySize(W, H);
    this.add.rectangle(W / 2, H / 2, W, H, 0x0c0705, 0.56);
    // 压住照片里烙印的标题/词条，同时给本页文字留出干净区域
    const grad = this.add.graphics().setDepth(1);
    grad.fillGradientStyle(0x0c0705, 0x0c0705, 0x0c0705, 0x000000, 0.0, 0.0, 0.72, 0.55);
    grad.fillRect(0, 0, W, 200);
    grad.fillGradientStyle(0x000000, 0x000000, 0x0c0705, 0x0c0705, 0.55, 0.55, 0.0, 0.0);
    grad.fillRect(0, H - 220, W, 220);
    BGM.setMode('festive');

    T(this, 42, 56, '第 五 幕 · 画 灯', 17, '#c9a45a', { ox: 0, style: { fontFamily: SERIF } }).setDepth(2);
    T(this, 42, 104, '为这盏灯，落下你的心愿', 40, '#f3e9d2', { ox: 0, style: { fontFamily: SERIF } }).setDepth(2);
    T(this, 44, 146, '同安龙虎灯 · 亲手添彩', 15, '#9a8f80', { ox: 0, sans: true }).setDepth(2);
    muteButton(this);

    /* 白灯笼（盖住背景照片里同位置的原灯） */
    this.LX = 670; this.LY = 352;
    this.lamp = drawWishLantern(this, this.LX, this.LY, 1.12, { glow: true });
    this.lamp.c.setDepth(3);

    /* 选择：纹样 + 祝福文字 */
    this.sel = { pattern: 'tiger', bless: null };
    const rowY = 648;
    T(this, 96, rowY, '选择纹样', 15, '#9a8f80', { ox: 0, sans: true });
    this.patternChips = [
      this.mkChip(206, rowY, '画龙', 'dragon', true),
      this.mkChip(288, rowY, '画虎', 'tiger', true)
    ];
    T(this, 452, rowY, '祝福文字', 15, '#9a8f80', { ox: 0, sans: true });
    this.blessChips = ['平安', '喜乐', '自由', '多财', '安康'].map((w, i) => this.mkChip(560 + i * 84, rowY, w, w, false));

    /* 毛笔确认按钮 */
    const bx = 1216, by = rowY - 4;
    const brush = this.add.container(bx, by).setSize(92, 92).setDepth(60).setInteractive({ useHandCursor: true });
    const bg2 = this.add.graphics();
    bg2.fillStyle(0x5a3a10, 1);
    bg2.fillEllipse(16, -18, 13, 13);      // 笔尾
    bg2.fillRoundedRect(-9, -30, 18, 8, 3); // 笔箍
    bg2.fillRect(-2, -24, 9, 32);           // 笔杆
    bg2.fillTriangle(-5, 8, 7, 8, 0, 27);   // 笔锋
    brush.add([bg2]);
    brush.on('pointerup', () => this.confirm());
    this.tweens.add({ targets: brush, scale: 1.06, yoyo: true, repeat: -1, duration: 900 });

    this.refreshChips();
    this.applyPattern('tiger');
    this.time.delayedCall(500, () => dialog(this, [
      { who: 'dragon', text: '灯面还空着。选一个纹样、一句祝福，让这盏灯带上你的心意——落笔之前，都可以换。' }
    ]));
  }
  mkChip(x, y, label, value, isPattern) {
    const c = this.add.container(x, y).setDepth(55);
    const g = this.add.graphics();
    const t = T(this, 0, 0, label, 20, '#e8dcc4', { style: { fontFamily: SERIF } });
    c.add([g, t]);
    c.setSize(74, 48).setInteractive({ useHandCursor: true });
    const redraw = sel => {
      g.clear();
      g.fillStyle(sel ? 0xf2e3c0 : 0x241a12, sel ? 0.95 : 0.62);
      g.fillRoundedRect(-36, -24, 72, 48, 10);
      if (sel) { g.fillStyle(0xc9a45a, 1); g.fillRect(-18, 15, 36, 4); }
      t.setColor(sel ? '#3a2410' : '#e8dcc4');
    };
    c.redraw = redraw;
    c.value = value;
    c.on('pointerup', () => {
      SFX.pick();
      if (isPattern) { this.sel.pattern = value; this.applyPattern(value); }
      else { this.sel.bless = value; this.applyBlessing(value); }
      this.refreshChips();
    });
    redraw(false);
    return c;
  }
  refreshChips() {
    this.patternChips.forEach(ch => ch.redraw(ch.value === this.sel.pattern));
    this.blessChips.forEach(ch => ch.redraw(ch.value === this.sel.bless));
  }
  applyPattern(kind) {
    G.lampPattern = kind;
    if (this.patImg) { this.patImg.destroy(); this.patImg = null; }
    this.patImg = this.add.image(this.LX, this.LY - 14, 'pattern_' + kind).setScale(0.4).setAlpha(0).setTint(0xd84545).setDepth(3);
    this.tweens.add({ targets: this.patImg, alpha: 0.85, duration: 500 });
    SFX.light();
  }
  applyBlessing(word) {
    G.blessingText = word;
    if (this.charObjs) this.charObjs.forEach(t => t.destroy());
    this.charObjs = wishBlessingChars(this, this.lamp.c, word, 1.06, true).map(t => { t.setDepth(4); return t; });
    SFX.page();
  }
  confirm() {
    if (!this.sel.bless) { toast(this, '先在下面选一句祝福文字', { y: 520 }); return; }
    if (this.done) return; this.done = true;
    SFX.ok(); sparkle(this, this.LX, this.LY, 0xffd040, 26, 80);
    this.tweens.add({ targets: this.lamp.c, scale: 1.04, yoyo: true, duration: 220, repeat: 1 });
    this.time.delayedCall(1300, () => {
      dialog(this, [
        { who: 'tiger', text: '纹样有了，祝福也落了笔——这盏灯，这下真的属于你了。' },
        { who: 'dragon', text: '走，去老街上看看。灯成了，手艺还在一双手一双手里传下去。' }
      ], () => goTo(this, 'Ending'));
    });
  }
}
