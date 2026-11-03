/* 序章 · 滚动叙述页（同视频开头：粉纹底上逐段浮现的引子文字），轻点推进，最后进入正片 */
const SERIF = '"Songti SC","STSong","STZhongsong","SimSun","Noto Serif SC",serif';

const PROLOGUE_PAGES = [
  ['同安老街，一盏龙虎灯，守着一家的平安。', '竹篾为骨，纸上绘龙虎，灯火代代相传。'],
  ['灯上的龙虎，连着保生大帝的传说。', '人们也唤他大道公，一位救人护生的医者。'],
  ['暑气不退，村中病起，乡亲们等着汤药。', '你将随大帝入山，也为受困的龙虎伸出援手。'],
  ['晨雾渐散，山路已在脚下。', '背好药囊，随大帝入山寻药。']
];

class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    fadeIn(this, ['dbgOpen']);
    BGM.setMode('festive');
    this.add.image(W / 2, H / 2, 'bg_pattern').setDisplaySize(W, H);
    this.layer = this.add.container(0, 0).setDepth(10);
    this.idx = -1;
    this.busy = false;

    const hint = T(this, W - 64, H - 26, '轻点继续 ▸', 18, '#ffe9f6', { ox: 1, sans: true, stroke: '#8a005e', strokeThickness: 4 }).setAlpha(0);
    this.tweens.add({ targets: hint, alpha: 1, duration: 500, delay: 800, onComplete: () => this.tweens.add({ targets: hint, alpha: 0.35, yoyo: true, repeat: -1, duration: 700 }) });

    const dbg = T(this, 26, H - 26, '章节跳转（调试入口）', 14, '#fff8d0', { ox: 0, sans: true, stroke: '#6a0050', strokeThickness: 4 }).setInteractive({ useHandCursor: true }).setDepth(50);
    dbg.on('pointerup', () => this.showDebug());
    muteButton(this);

    this.input.on('pointerup', p => {
      if (p.y > H - 50 && p.x < 280) return;   // 避开调试入口
      this.showNext();
    });
    this.time.delayedCall(900, () => this.showNext());
  }
  showNext() {
    if (this.busy) return;
    this.idx++;
    if (this.idx >= PROLOGUE_PAGES.length) return this.enter();
    this.busy = true;
    const [l1, l2] = PROLOGUE_PAGES[this.idx];
    const old = this.layer.list.slice();
    old.forEach(t => this.tweens.add({ targets: t, y: t.y - 110, alpha: 0, duration: 1100, ease: 'Quad.in' }));
    const t1 = T(this, W / 2, 330, l1, 26, '#fdf3ea', { style: { fontFamily: SERIF } }).setAlpha(0);
    const t2 = T(this, W / 2, 388, l2, 26, '#fdf3ea', { style: { fontFamily: SERIF } }).setAlpha(0);
    this.layer.add([t1, t2]);
    this.tweens.add({ targets: [t1, t2], alpha: 1, duration: 900, delay: this.idx === 0 ? 200 : 350 });
    const last = this.idx === PROLOGUE_PAGES.length - 1;
    this.time.delayedCall(last ? 2600 : 3400, () => { this.busy = false; this.showNext(); });
  }
  enter() {
    if (this._leaving) return;
    goTo(this, 'Story', { id: 'prologue' });
  }
  showDebug() {
    if (this.dbgOpen) return; this.dbgOpen = true;
    const c = this.add.container(0, 0).setDepth(1000);
    const bl = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive();
    c.add(bl);
    c.add(panel(this, W / 2 - 330, 110, 660, 560, { fill: C.cream }));
    c.add(T(this, W / 2, 150, '调试入口 · 注入前置状态后跳转', 22, '#9a0078', { bold: true }));
    const items = [
      ['序章文字', () => ['Title']],
      ['交互 0 采药棋盘', () => ['Forage']],
      ['交互 1A 治虎 · 符水', () => { G.foragePos = 7; G.debugRescue = 'tiger'; return ['Forage']; }],
      ['交互 1B 医龙 · 药贴', () => { G.healedTiger = true; G.foragePos = 12; G.debugRescue = 'dragon'; return ['Forage']; }],
      ['剧情A→济世', () => { G.healedTiger = G.healedDragon = true; G.foragePos = 14; return ['Story', { id: 'A' }]; }],
      ['交互 2B 药庐济世', () => { G.healedTiger = G.healedDragon = true; G.bookOpened = true; G.foragePos = 14; ['herb', 'bamboo', 'paper', 'oil'].forEach(s => G.purchased.add(s)); return ['Medicine', { mode: 'effects' }]; }],
      ['剧情B→木匠家', () => { G.effectsDone = new Set(['E1', 'E2', 'E3']); return ['Story', { id: 'B' }]; }],
      ['交互 2C 木匠制灯', () => { G.carpenterRescued = G.craftUnlocked = true; return ['Craft']; }],
      ['剧情C→守灯', () => { G.lampCrafted = true; return ['Story', { id: 'C' }]; }],
      ['交互 3 守灯夜战', () => { G.lampCrafted = true; return ['Defense']; }],
      ['剧情D→心愿', () => { return ['Story', { id: 'D' }]; }],
      ['交互 4 心愿灯', () => { G.lampCrafted = true; return ['Decorate']; }],
      ['尾声 · 灯与人', () => { G.lampCrafted = true; G.blessingText = '平安'; G.lampPattern = 'tiger'; return ['Ending']; }],
      ['市集(备用)', () => { G.healedTiger = G.healedDragon = true; G.bookOpened = true; G.foragePos = 14; return ['Market']; }]
    ];
    items.forEach(([label, fn], i) => {
      const b = button(this, W / 2 - 150 + (i % 2) * 300, 195 + Math.floor(i / 2) * 52, label, () => { G.reset(); const [k, d] = fn(); goTo(this, k, d); }, { w: 270, h: 42, size: 17, fill: i % 2 ? C.blue : C.magenta, edge: i % 2 ? 0x00248a : 0x9a0078 });
      c.add(b);
    });
    c.add(button(this, W / 2, 625, '关闭', () => { c.destroy(); this.dbgOpen = false; }, { w: 140, h: 42, size: 18, fill: C.gray, edge: 0x555560 }));
  }
}
