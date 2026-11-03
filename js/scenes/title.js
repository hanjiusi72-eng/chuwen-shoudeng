/* 标题页 + 调试章节跳转 */
class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    fadeIn(this, ['dbgOpen']);
    BGM.setMode('festive');
    this.add.image(W / 2, H / 2, 'bg_pattern').setDisplaySize(W, H);
    const dr = this.add.image(170, H + 40, 'char_dragon').setOrigin(0.5, 1); dr.setScale(700 / dr.height);
    const tg = this.add.image(W - 190, H + 40, 'char_tiger').setOrigin(0.5, 1); tg.setScale(700 / tg.height);
    this.tweens.add({ targets: dr, y: H + 30, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.inOut' });
    this.tweens.add({ targets: tg, y: H + 30, yoyo: true, repeat: -1, duration: 2000, ease: 'Sine.inOut', delay: 400 });

    panel(this, W / 2 - 300, 120, 600, 440, { fill: C.blue, stroke: C.yellow, lw: 6, r: 30 });
    const g = this.add.graphics(); g.lineStyle(2, C.cream, 0.8); g.strokeRoundedRect(W / 2 - 286, 134, 572, 412, 22);
    const lamp = this.add.image(W / 2, 205, 'lantern_lit').setScale(0.7);
    this.tweens.add({ targets: lamp, angle: { from: -5, to: 5 }, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.inOut' });
    T(this, W / 2, 318, '光 亮', 84, '#fbf5a2', { bold: true, stroke: '#ff00c8', strokeThickness: 10 });
    T(this, W / 2, 390, '一 盏 龙 虎 灯 · 守 一 村 灯 火 与 人', 22, '#ffffff');
    T(this, W / 2, 424, '采药 · 医龙虎 · 扎灯 · 守夜 · 画灯寄平安', 17, '#ffd0ee', { sans: true });
    button(this, W / 2, 488, '点亮这盏灯', () => { SFX.unlock(); BGM.ensure(); G.reset(); goTo(this, 'Story', { id: 'prologue' }); }, { w: 240, h: 62, size: 26 });

    const dbg = T(this, W / 2, 585, '章节跳转（调试入口）', 16, '#fff8d0', { sans: true, stroke: '#6a0050', strokeThickness: 4 }).setInteractive({ useHandCursor: true });
    dbg.on('pointerup', () => this.showDebug());
    T(this, W / 2, H - 22, '建议横屏 · 支持鼠标与触屏 · 约 12～18 分钟', 15, '#ffffff', { sans: true, stroke: '#6a0050', strokeThickness: 4 });
    muteButton(this);
  }
  showDebug() {
    if (this.dbgOpen) return; this.dbgOpen = true;
    const c = this.add.container(0, 0).setDepth(1000);
    const bl = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive();
    c.add(bl);
    c.add(panel(this, W / 2 - 330, 110, 660, 520, { fill: C.cream }));
    c.add(T(this, W / 2, 150, '调试入口 · 注入前置状态后跳转', 22, '#9a0078', { bold: true }));
    const items = [
      ['交互 0 采药棋盘', () => ['Forage']],
      ['交互 1A 治虎 · 符水', () => { G.foragePos = 7; G.debugRescue = 'tiger'; return ['Forage']; }],
      ['交互 1B 医龙 · 药贴', () => { G.healedTiger = true; G.foragePos = 12; G.debugRescue = 'dragon'; return ['Forage']; }],
      ['交互 2A 市集', () => { G.healedTiger = G.healedDragon = true; G.bookOpened = true; G.foragePos = 14; return ['Market']; }],
      ['交互 2B 药庐济世', () => { G.healedTiger = G.healedDragon = true; G.bookOpened = true; G.foragePos = 14; ['herb', 'bamboo', 'paper', 'oil'].forEach(s => G.purchased.add(s)); return ['Medicine', { mode: 'effects' }]; }],
      ['交互 2C 木匠制灯', () => { G.carpenterRescued = G.craftUnlocked = true; return ['Craft']; }],
      ['交互 3 守灯夜战', () => { G.lampCrafted = true; return ['Defense']; }],
      ['交互 4 画灯题字', () => ['Decorate']],
      ['结尾动画', () => { G.dragonDone = G.tigerDone = true; G.blessingId = 'b1'; return ['Ending']; }]
    ];
    items.forEach(([label, fn], i) => {
      const b = button(this, W / 2 - 150 + (i % 2) * 300, 205 + Math.floor(i / 2) * 72, label, () => { G.reset(); const [k, d] = fn(); goTo(this, k, d); }, { w: 270, h: 52, size: 19, fill: i % 2 ? C.blue : C.magenta, edge: i % 2 ? 0x00248a : 0x9a0078 });
      c.add(b);
    });
    c.add(button(this, W / 2, 585, '关闭', () => { c.destroy(); this.dbgOpen = false; }, { w: 140, h: 46, size: 18, fill: C.gray, edge: 0x555560 }));
  }
}
