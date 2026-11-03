/* 标题页 + 调试章节跳转 */
class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    fadeIn(this, ['dbgOpen']);
    this.add.image(W / 2, H / 2, 'bg_pattern').setDisplaySize(W, H);
    const dr = this.add.image(170, H + 40, 'char_dragon').setOrigin(0.5, 1); dr.setScale(700 / dr.height);
    const tg = this.add.image(W - 190, H + 40, 'char_tiger').setOrigin(0.5, 1); tg.setScale(700 / tg.height);
    this.tweens.add({ targets: dr, y: H + 30, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.inOut' });
    this.tweens.add({ targets: tg, y: H + 30, yoyo: true, repeat: -1, duration: 2000, ease: 'Sine.inOut', delay: 400 });

    panel(this, W / 2 - 300, 120, 600, 440, { fill: C.blue, stroke: C.yellow, lw: 6, r: 30 });
    const g = this.add.graphics(); g.lineStyle(2, C.cream, 0.8); g.strokeRoundedRect(W / 2 - 286, 134, 572, 412, 22);
    const lamp = this.add.image(W / 2, 205, 'lantern_lit').setScale(0.7);
    this.tweens.add({ targets: lamp, angle: { from: -5, to: 5 }, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.inOut' });
    T(this, W / 2, 318, '除瘟守灯', 76, '#fbf5a2', { bold: true, stroke: '#ff00c8', strokeThickness: 10 });
    T(this, W / 2, 388, '龙 虎 灯 · 闽 南 民 俗 互 动 游 戏', 22, '#ffffff');
    T(this, W / 2, 422, '查药书 · 医龙虎 · 学扎灯 · 守长夜 · 画龙虎', 17, '#ffd0ee', { sans: true });
    button(this, W / 2, 488, '开始体验', () => { SFX.unlock(); G.reset(); goTo(this, 'Story', { id: 'prologue' }); }, { w: 240, h: 62, size: 26 });

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
      ['交互 1A 药房 · 治虎', () => ['Medicine', { mode: 'tiger' }]],
      ['交互 1B 药房 · 医龙', () => { G.healedTiger = true; G.bookOpened = true; return ['Medicine', { mode: 'dragon' }]; }],
      ['交互 2A 市集', () => { G.healedTiger = G.healedDragon = true; G.bookOpened = true; return ['Market']; }],
      ['交互 2B 功效制药', () => { G.healedTiger = G.healedDragon = true; G.bookOpened = true; ['herb', 'bamboo', 'paper', 'oil'].forEach(s => G.purchased.add(s)); return ['Medicine', { mode: 'effects' }]; }],
      ['交互 2C 木匠制灯', () => { G.carpenterRescued = G.craftUnlocked = true; return ['Craft']; }],
      ['交互 3 守灯夜战', () => { G.lampCrafted = true; return ['Defense']; }],
      ['交互 4 画灯题字', () => ['Decorate']],
      ['结尾动画', () => { G.dragonDone = G.tigerDone = true; G.blessingId = 'b1'; return ['Ending']; }]
    ];
    items.forEach(([label, fn], i) => {
      const b = button(this, W / 2 - 150 + (i % 2) * 300, 215 + Math.floor(i / 2) * 78, label, () => { G.reset(); const [k, d] = fn(); goTo(this, k, d); }, { w: 270, h: 54, size: 19, fill: i % 2 ? C.blue : C.magenta, edge: i % 2 ? 0x00248a : 0x9a0078 });
      c.add(b);
    });
    c.add(button(this, W / 2, 585, '关闭', () => { c.destroy(); this.dbgOpen = false; }, { w: 140, h: 46, size: 18, fill: C.gray, edge: 0x555560 }));
  }
}
