/* 尾声 · 灯与人（同视频结尾：照片暗背景上的收束页）+ 完成页 */
class EndingScene extends Phaser.Scene {
  constructor() { super('Ending'); }
  create() {
    fadeIn(this, ['art']);
    this.add.image(W / 2, H / 2, this.textures.exists('end_photo2') ? 'end_photo2' : 'bg_village_dim').setDisplaySize(W, H);
    this.add.rectangle(W / 2, H / 2, W, H, 0x0b0806, 0.66);
    const grad = this.add.graphics().setDepth(1);
    grad.fillGradientStyle(0x0b0806, 0x0b0806, 0x0b0806, 0x000000, 0.0, 0.0, 0.7, 0.5);
    grad.fillRect(0, 0, W, 210);
    grad.fillGradientStyle(0x000000, 0x000000, 0x0b0806, 0x0b0806, 0.5, 0.5, 0.0, 0.0);
    grad.fillRect(0, H - 190, W, 190);
    BGM.setMode('festive');

    T(this, 42, 56, '尾 声 · 灯 与 人', 17, '#c9a45a', { ox: 0, style: { fontFamily: SERIF } }).setDepth(2);
    T(this, 42, 104, '灯已成，手艺仍在延续', 40, '#f3e9d2', { ox: 0, style: { fontFamily: SERIF } }).setDepth(2);
    T(this, 44, 146, '从一双手，到下一双手。', 15, '#9a8f80', { ox: 0, sans: true }).setDepth(2);
    muteButton(this);

    /* 左侧：你这盏灯 */
    const word = G.blessingText || '平安';
    const pat = G.lampPattern || 'tiger';
    drawWishLantern(this, 218, 428, 0.8, { glow: true, pattern: pat, patColor: 0xd84545, blessing: word }).c.setDepth(3);
    T(this, 218, 700, '归来总有一盏灯。', 15, '#9a8f80', { style: { fontFamily: SERIF } }).setDepth(2);

    /* 右侧：老街的灯坊 */
    const ax = 712;
    const art = this.add.container(0, 0).setDepth(10);
    const kicker = T(this, ax, 228, '一 盏 灯 · 四 代 人', 15, '#c9a45a', { ox: 0, style: { fontFamily: SERIF } });
    const heading = T(this, ax, 266, '老街里的灯，还在做', 30, '#f3e9d2', { ox: 0, style: { fontFamily: SERIF } });
    const p1 = T(this, ax, 330, '同安松柏林老街，一家人守着传了几代的灯坊，快半个世纪。竹篾为骨，棉纸为面，灯面上绘龙虎——让古老的纹样，一盏一盏，亮在灯上。', 16, '#c8bba4', { ox: 0, oy: 0, wrap: 470, sans: true, lineSpacing: 9 });
    const p2 = T(this, ax, 442, '2008 年，同安龙虎灯列入国家级非物质文化遗产名录。如今新一代接过灯坊，守着四代人的老手艺，也试着用新的方式，把灯讲给更多人听。', 16, '#c8bba4', { ox: 0, oy: 0, wrap: 470, sans: true, lineSpacing: 9 });
    const p3 = T(this, ax, 554, '从父亲教孩子画虎，到孩子描出第一笔，灯火就在一双双手里传递。愿你再见龙虎灯时，记得灯上的笔意，也记得灯下的人。', 16, '#c8bba4', { ox: 0, oy: 0, wrap: 470, sans: true, lineSpacing: 9 });
    art.add([kicker, heading, p1, p2, p3]);
    art.setAlpha(0);
    this.tweens.add({ targets: art, alpha: 1, duration: 900, delay: 300 });

    button(this, W - 130, H - 34, '再点一盏灯 ↺', () => { G.reset(); goTo(this, 'Title'); }, { w: 200, h: 50, size: 19, fill: C.ink, edge: 0x000000, line: C.magenta }).setDepth(2);
  }
}

class FinishScene extends Phaser.Scene {
  constructor() { super('Finish'); }
  create() {
    fadeIn(this);
    this.add.image(W / 2, H / 2, 'bg_pattern').setDisplaySize(W, H);
    panel(this, 120, 70, W - 240, 610, { fill: C.blue, stroke: C.yellow, lw: 6, r: 30 });
    drawWishLantern(this, 420, 380, 0.82, { glow: true, pattern: G.lampPattern || 'tiger', patColor: 0xd84545, blessing: G.blessingText || '平安' });
    T(this, 880, 170, '光 亮 · 灯火相传', 44, '#fbf5a2', { bold: true, stroke: '#ff00c8', strokeThickness: 8 });
    T(this, 880, 250, `你的祝福：“${G.blessingText || '平安'}”`, 24, '#ffffff');
    T(this, 880, 330, '入山采药 · 治虎化符 · 医龙敷眼\n药庐制药 · 灯下传艺 · 扎制素灯 · 守夜到天明 · 落笔心愿', 18, '#cfe0ff', { sans: true, align: 'center', lineSpacing: 10 });
    T(this, 880, 410, '游戏中的药方仅为互动内容，不作现实用药建议。', 14, '#ffd0ee', { sans: true });
    button(this, 760, 500, '再看尾声', () => goTo(this, 'Ending'), { w: 200, h: 60, size: 22, fill: C.green, edge: 0x118a5a });
    button(this, 1000, 500, '重新体验', () => this.confirmRestart(), { w: 200, h: 60, size: 22 });
    muteButton(this);
  }
  confirmRestart() {
    const c = this.add.container(0, 0).setDepth(1300);
    c.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive());
    c.add(panel(this, W / 2 - 260, 250, 520, 240, { fill: C.cream }));
    c.add(T(this, W / 2, 315, '重新体验会清空本轮的全部进度，确定吗？', 21, '#2a1030', { wrap: 440, align: 'center' }));
    c.add(button(this, W / 2 - 110, 420, '确定重来', () => { G.reset(); goTo(this, 'Title'); }, { w: 180, h: 54, size: 20 }));
    c.add(button(this, W / 2 + 110, 420, '再看看', () => this.time.delayedCall(10, () => c.destroy()), { w: 180, h: 54, size: 20, fill: C.gray, edge: 0x555560 }));
  }
}
