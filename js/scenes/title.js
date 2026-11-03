/* 采用远端四段序言文案，以原生文字叠化进入故事；保留全部章节入口。 */
const SERIF = '"Songti SC","STSong","STZhongsong","SimSun","Noto Serif SC",serif';

const PROLOGUE_PAGES = [
  ['同安老街，一盏龙虎灯，守着一家的平安。', '竹篾为骨，纸上绘龙虎，灯火代代相传。'],
  ['灯上的龙虎，连着保生大帝的传说。', '人们也唤他大道公，一位救人护生的医者。'],
  ['暑气不退，村中病起，乡亲们等着汤药。', '你将随大帝入山，也为受困的龙虎伸出援手。'],
  ['晨雾渐散，山路已在脚下。', '背好药囊，随大帝入山寻药。']
];

class TitleScene extends PrologueScene {
  constructor() { super('Title'); }
  create() {
    super.create(); this.dbgOpen = false;
    const chapters = document.createElement('button'); chapters.className = 'quiet chapters'; chapters.type = 'button'; chapters.textContent = '重访篇章';
    chapters.onclick = () => this.showDebug(); this.el.appendChild(chapters);
    const lamp = document.createElement('button'); lamp.className = 'quiet direct-lamp'; lamp.type = 'button'; lamp.textContent = '直接去灯坊 →';
    lamp.onclick = () => { this.el.classList.remove('is-visible'); this.el.style.pointerEvents = 'none'; journeyDelay(this, () => goTo(this, 'Workshop'), 650); };
    this.el.appendChild(lamp);
  }
  showDebug() {
    if (this.dbgOpen) return; this.dbgOpen = true; this.el.style.visibility = 'hidden';
    const c = this.add.container(0, 0).setDepth(1000);
    const bl = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive();
    c.add(bl);
    c.add(panel(this, W / 2 - 330, 110, 660, 560, { fill: C.cream }));
    c.add(T(this, W / 2, 150, '重访篇章 · 选择一段灯火', 22, '#9a0078', { bold: true }));
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
      ['画灯 · 寄下心愿', () => { G.lampCrafted = true; return ['Workshop']; }],
      ['尾声 · 灯与人', () => { G.lampCrafted = true; G.blessingText = '平安'; G.lampPattern = 'tiger'; return ['Ending']; }],
      ['市集(备用)', () => { G.healedTiger = G.healedDragon = true; G.bookOpened = true; G.foragePos = 14; return ['Market']; }]
    ];
    items.forEach(([label, fn], i) => {
      const b = button(this, W / 2 - 150 + (i % 2) * 300, 195 + Math.floor(i / 2) * 52, label, () => { G.reset(); const [k, d] = fn(); goTo(this, k, d); }, { w: 270, h: 42, size: 17, fill: i % 2 ? C.blue : C.magenta, edge: i % 2 ? 0x00248a : 0x9a0078 });
      c.add(b);
    });
    c.add(button(this, W / 2, 625, '关闭', () => { c.destroy(); this.dbgOpen = false; this.el.style.visibility = 'visible'; }, { w: 140, h: 42, size: 18, fill: C.gray, edge: 0x555560 }));
  }
}
