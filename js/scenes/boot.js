/* 素材版本号：替换素材后改这里，避免浏览器读到旧缓存 */
const ASSET_VERSION = 3;
/* 载入素材 + 生成程序化贴图 */
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    const g = this.add.graphics();
    const t = T(this, W / 2, H / 2 - 40, '龙虎灯 · 载入中', 28, '#fbf5a2');
    this.load.on('progress', p => { g.clear(); g.fillStyle(C.ink, 1); g.fillRoundedRect(W / 2 - 200, H / 2, 400, 18, 9); g.fillStyle(C.magenta, 1); g.fillRoundedRect(W / 2 - 200, H / 2, 400 * p, 18, 9); });
    const A = 'assets/', V = '?v=' + ASSET_VERSION;
    ['bg_pharmacy', 'bg_pattern', 'bg_village', 'bg_village_dim', 'bg_village_night', 'bg_board'].forEach(k => this.load.image(k, A + k + '.jpg' + V));
    ['char_dragon', 'char_elder', 'char_tiger', 'char_baosheng', 'head_dragon', 'head_elder', 'head_tiger', 'head_baosheng',
      'book_slips', 'scrolls', 'fan', 'stove', 'mortar', 'pattern_dragon', 'pattern_tiger', 'card_dragon', 'card_tiger',
      'ghost', 'wenshen', 'fig_dragon', 'fig_tiger', 'fig_carp']
      .forEach(k => this.load.image(k, A + k + '.png' + V));
    for (let i = 1; i <= 6; i++) this.load.image('dice' + i, A + 'dice' + i + '.png' + V);
    for (let i = 1; i <= 8; i++) this.load.image('circle' + i, A + 'circle' + i + '.png' + V);
    HERBS.forEach(h => { this.load.image('herb_' + h.id, A + 'herb_' + h.id + '.png' + V); this.load.image('plant_' + h.id, A + 'plant_' + h.id + '.png' + V); });
  }
  create() {
    document.getElementById('loading').style.display = 'none';
    this.makeTextures();
    this.scene.start('Title');
  }
  tex(key, w, h, draw) { const g = this.make.graphics({ x: 0, y: 0, add: false }); draw(g); g.generateTexture(key, w, h); g.destroy(); }
  makeTextures() {
    // 闪光
    this.tex('spark', 32, 32, g => { g.fillStyle(0xffffff, 1); g.fillTriangle(16, 0, 20, 16, 12, 16); g.fillTriangle(16, 32, 20, 16, 12, 16); g.fillTriangle(0, 16, 16, 12, 16, 20); g.fillTriangle(32, 16, 16, 12, 16, 20); g.fillCircle(16, 16, 4); });
    // 柔光
    this.tex('glow', 256, 256, g => { for (let r = 128; r > 0; r -= 4) { g.fillStyle(0xffffff, 0.035 + (1 - r / 128) * 0.05); g.fillCircle(128, 128, r); } });
    this.tex('dot', 16, 16, g => { g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 8); });
    // 成药葫芦
    this.tex('gourd', 64, 92, g => {
      g.fillStyle(0x9a3a00, 1); g.fillCircle(32, 64, 26); g.fillCircle(32, 30, 17);
      g.fillStyle(0xff8a00, 1); g.fillCircle(32, 62, 24); g.fillCircle(32, 29, 15);
      g.fillStyle(0xffc070, 1); g.fillCircle(24, 56, 7); g.fillCircle(27, 25, 4);
      g.fillStyle(0xe8202a, 1); g.fillRect(24, 42, 16, 5); g.fillStyle(0x2bbf98, 1); g.fillRect(28, 6, 8, 10); g.fillStyle(0x7a3a10, 1); g.fillRect(30, 2, 4, 6);
    });
    // 发簪
    this.tex('hairpin', 120, 34, g => {
      g.fillStyle(0xd09a10, 1); g.fillRect(20, 14, 96, 6); g.fillTriangle(116, 14, 116, 20, 120, 17);
      g.fillStyle(0xffe62a, 1); g.fillRect(20, 14, 96, 3);
      g.fillStyle(0xff00c8, 1); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.fillCircle(17 + Math.cos(a) * 9, 17 + Math.sin(a) * 9, 7); }
      g.fillStyle(0xffe62a, 1); g.fillCircle(17, 17, 6);
    });
    // 点眼笔
    this.tex('dropper', 40, 110, g => {
      g.fillStyle(0x2ad4f0, 1); g.fillRoundedRect(12, 0, 16, 34, 6); g.fillStyle(0xffffff, 0.8); g.fillRect(16, 4, 4, 24);
      g.fillStyle(0xfbf5a2, 1); g.fillRect(14, 32, 12, 54); g.lineStyle(2, 0xff00c8, 1); g.strokeRect(14, 32, 12, 54);
      g.fillStyle(0x7fe0c8, 1); g.fillTriangle(14, 86, 26, 86, 20, 108);
    });
    // 鼓
    this.tex('drum', 96, 84, g => {
      g.fillStyle(0x8a0010, 1); g.fillRoundedRect(8, 20, 80, 52, 10);
      g.fillStyle(0xe8202a, 1); g.fillRoundedRect(10, 20, 76, 48, 10);
      g.fillStyle(0xffe62a, 1); for (let i = 0; i < 7; i++) { g.fillCircle(16 + i * 11, 26, 3); g.fillCircle(16 + i * 11, 62, 3); }
      g.fillStyle(0xfbf5a2, 1); g.fillEllipse(48, 20, 80, 22); g.lineStyle(3, 0xff9a1f, 1); g.strokeEllipse(48, 20, 80, 22);
      g.fillStyle(0xff00c8, 1); g.fillCircle(48, 20, 6);
      g.lineStyle(5, 0x7a3a10, 1); g.lineBetween(70, 4, 90, 0); g.fillStyle(0xff00c8, 1); g.fillCircle(68, 5, 6);
    });
    // 素灯（白）与亮灯
    const lantern = (key, body, glow) => this.tex(key, 130, 170, g => {
      if (glow) { for (let r = 64; r > 30; r -= 4) { g.fillStyle(0xffd040, 0.05); g.fillCircle(65, 88, r); } }
      g.lineStyle(3, 0x7a3a10, 1); g.lineBetween(65, 0, 65, 18);
      g.fillStyle(0xe8202a, 1); g.fillRoundedRect(40, 16, 50, 14, 4); g.fillRoundedRect(40, 140, 50, 14, 4);
      g.fillStyle(body, 1); g.fillEllipse(65, 85, 100, 118);
      g.lineStyle(2, glow ? 0xff9a1f : 0xd8d0c0, 1);
      g.strokeEllipse(65, 85, 100, 118); g.strokeEllipse(65, 85, 64, 118); g.strokeEllipse(65, 85, 24, 118);
      g.fillStyle(0xffe62a, 1); g.fillRect(44, 28, 42, 3); g.fillRect(44, 139, 42, 3);
      g.fillStyle(0xff00c8, 1); g.fillRect(62, 154, 6, 8); g.fillTriangle(56, 170, 74, 170, 65, 158);
    });
    lantern('lantern_white', 0xfffdf4, false);
    lantern('lantern_lit', 0xffd65a, true);
    // 引路灯（提灯）
    this.tex('guide', 90, 120, g => {
      g.lineStyle(5, 0x7a3a10, 1); g.lineBetween(10, 6, 45, 6); g.lineBetween(45, 6, 45, 30);
      g.fillStyle(0xe8202a, 1); g.fillRoundedRect(25, 28, 40, 10, 3); g.fillRoundedRect(25, 102, 40, 10, 3);
      g.fillStyle(0xffe62a, 1); g.fillEllipse(45, 70, 66, 70); g.lineStyle(2, 0xff9a1f, 1); g.strokeEllipse(45, 70, 66, 70); g.strokeEllipse(45, 70, 30, 70);
      g.fillStyle(0xffffff, 0.8); g.fillEllipse(36, 60, 10, 22);
      g.fillStyle(0xff00c8, 1); g.fillTriangle(38, 120, 52, 120, 45, 110);
    });
    // 雨云
    this.tex('cloud', 170, 100, g => {
      g.fillStyle(0x0a3ab0, 1); [[40, 60, 32], [80, 46, 40], [124, 58, 34], [100, 72, 28], [60, 74, 26]].forEach(([x, y, r]) => g.fillCircle(x, y + 3, r));
      g.fillStyle(0x2ad4f0, 1); [[40, 58, 30], [80, 44, 38], [124, 56, 32], [100, 70, 26], [60, 72, 24]].forEach(([x, y, r]) => g.fillCircle(x, y, r));
      g.fillStyle(0xffffff, 0.75); g.fillCircle(70, 34, 12); g.fillCircle(110, 44, 8);
    });
    // 重雾
    this.tex('fog', 140, 120, g => {
      [[40, 70, 34], [74, 52, 40], [104, 72, 32], [70, 86, 30], [30, 90, 22], [112, 94, 22]].forEach(([x, y, r]) => { g.fillStyle(0x1a0624, 0.85); g.fillCircle(x, y, r); });
      [[44, 64, 22], [76, 46, 26], [100, 66, 20]].forEach(([x, y, r]) => { g.fillStyle(0x6a2a9a, 0.9); g.fillCircle(x, y, r); });
      g.lineStyle(3, 0xb98cff, 0.9); g.beginPath(); g.arc(70, 60, 14, 0, Math.PI * 1.5); g.strokePath(); g.beginPath(); g.arc(42, 74, 9, Math.PI, Math.PI * 2.4); g.strokePath();
    });
    // 王船
    this.tex('boat', 340, 230, g => {
      g.fillStyle(0x7a3a10, 1); g.fillRect(150, 20, 8, 150); g.fillRect(230, 50, 6, 120);
      g.fillStyle(0xfbf5a2, 1); g.fillTriangle(158, 24, 158, 150, 225, 150); g.fillStyle(0xff9cd4, 1); g.fillTriangle(236, 54, 236, 150, 290, 150);
      g.fillStyle(0xe8202a, 1); g.fillTriangle(158, 20, 158, 40, 190, 30);
      g.fillStyle(0xe8202a, 1); g.beginPath(); g.moveTo(10, 150); g.lineTo(330, 150); g.lineTo(290, 210); g.lineTo(50, 210); g.closePath(); g.fillPath();
      g.fillStyle(0xffe62a, 1); g.fillRect(40, 160, 270, 10); g.fillStyle(0x004dfc, 1); for (let i = 0; i < 8; i++) g.fillCircle(70 + i * 30, 188, 7);
      g.fillStyle(0xffe62a, 1); g.fillCircle(30, 150, 12);
    });
    // 市集货物
    this.tex('bun', 64, 44, g => { g.fillStyle(0xfff8e8, 1); g.fillEllipse(32, 28, 60, 34); g.lineStyle(2, 0xe0c8a0, 1); g.strokeEllipse(32, 28, 60, 34); g.fillStyle(0xe8202a, 1); g.fillCircle(32, 18, 4); });
    this.tex('jar', 56, 70, g => { g.fillStyle(0x9a3a00, 1); g.fillEllipse(28, 42, 52, 52); g.fillStyle(0xff9a1f, 1); g.fillEllipse(28, 40, 48, 48); g.fillStyle(0x7a3a10, 1); g.fillRect(18, 6, 20, 14); g.fillStyle(0xe8202a, 1); g.fillRect(14, 4, 28, 6); g.fillStyle(0xfbf5a2, 1); g.fillRect(18, 30, 20, 20); });
    this.tex('paperstack', 80, 60, g => { for (let i = 0; i < 4; i++) { g.fillStyle(i % 2 ? 0xffffff : 0xf4eee0, 1); g.fillRect(6 + i * 3, 30 - i * 7, 62, 26); g.lineStyle(1, 0xc8bca8, 1); g.strokeRect(6 + i * 3, 30 - i * 7, 62, 26); } });
    this.tex('bamboo', 90, 60, g => { for (let i = 0; i < 6; i++) { g.lineStyle(5, i % 2 ? 0x2bbf98 : 0x1d9a78, 1); g.lineBetween(4, 50 - i * 4, 86, 18 + i * 3); } g.lineStyle(4, 0xe8202a, 1); g.lineBetween(40, 20, 44, 52); g.lineStyle(4, 0x2bbf98, 1); g.strokeCircle(70, 40, 16); });
    // 灯骨架部件
    this.tex('part_ring', 170, 60, g => { g.lineStyle(7, 0x1d9a78, 1); g.strokeEllipse(85, 14, 150, 20); g.strokeEllipse(85, 46, 150, 20); g.lineStyle(2, 0xfbf5a2, 1); g.strokeEllipse(85, 14, 150, 20); g.strokeEllipse(85, 46, 150, 20); });
    this.tex('part_ribs', 170, 180, g => { g.lineStyle(6, 0x2bbf98, 1); for (let i = 0; i < 5; i++) { const x = 25 + i * 30; g.beginPath(); g.moveTo(85, 6); g.lineTo(x, 90); g.lineTo(85, 174); g.strokePath(); } });
    this.tex('part_paper', 150, 120, g => { g.fillStyle(0xffffff, 1); g.fillRoundedRect(6, 6, 138, 108, 10); g.lineStyle(2, 0xd8d0c0, 1); g.strokeRoundedRect(6, 6, 138, 108, 10); g.lineStyle(1, 0xece4d4, 1); for (let i = 0; i < 6; i++) g.lineBetween(14, 20 + i * 16, 136, 22 + i * 16); });
    this.tex('part_wick', 70, 70, g => { g.fillStyle(0x7a3a10, 1); g.fillEllipse(35, 56, 56, 18); g.fillStyle(0xfbf5a2, 1); g.fillEllipse(35, 52, 50, 14); g.fillStyle(0xffffff, 1); g.fillRect(31, 18, 8, 34); g.fillStyle(0x2a1030, 1); g.fillRect(31, 14, 8, 6); });
    this.tex('part_oil', 100, 80, g => { g.fillStyle(0x9a3a00, 1); g.fillEllipse(44, 48, 64, 52); g.fillStyle(0xff9a1f, 1); g.fillEllipse(44, 46, 60, 48); g.lineStyle(7, 0xff9a1f, 1); g.lineBetween(70, 36, 96, 18); g.lineStyle(5, 0x7a3a10, 1); g.beginPath(); g.arc(30, 44, 22, Math.PI * 0.6, Math.PI * 1.4); g.strokePath(); g.fillStyle(0xe8202a, 1); g.fillRect(34, 16, 20, 8); });
  }
}
