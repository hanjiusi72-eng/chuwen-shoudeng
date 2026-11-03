/* 交互 2A：市集 · 依提示选摊（无序、自动交付） */
class MarketScene extends Phaser.Scene {
  constructor() { super('Market'); }
  create() {
    fadeIn(this, ['goTween', 'bub']);
    this.busy = false;
    this.hud = hud(this, '村口 · 烟火相逢', '循着人声逛逛，为乡亲捎回药草和灯材');
    this.drawBackdrop();
    this.buildHints();
    this.stalls = {};
    STALLS.forEach((s, i) => this.buildStall(s, 132 + i * 214));
    this.buildChecklist();
    muteButton(this);
    this.refresh();
    this.time.delayedCall(400, () => dialog(this, [
      { who: 'dragon', text: '包子铺又冒热气了。咱们在这里添些草药，再给陈伯挑些扎灯的材料。' },
      { who: 'tiger', text: '竹篾、棉纸、灯油灯芯，别落下。点点摊位，慢慢挑，我陪你逛！' }
    ]));
  }
  drawBackdrop() {
    const g = this.add.graphics();
    g.fillStyle(C.cream, 1); g.fillRect(0, 0, W, H);
    g.fillStyle(0xff9cd4, 1);
    for (let x = 0; x < W; x += 28) { g.fillTriangle(x, 196, x + 14, 176, x + 28, 196); }
    g.fillStyle(C.blue, 1); g.fillRect(0, 560, W, H - 560);
    g.fillStyle(0xffffff, 1);
    for (let y = 578; y < H; y += 26) for (let x = (y / 26 % 2) * 13; x < W; x += 26) g.fillCircle(x, y, 6);
    g.fillStyle(C.magenta, 1); g.fillRect(0, 556, W, 8);
  }
  buildHints() {
    const g = this.add.graphics();
    g.fillStyle(C.ink, 0.06); g.fillRoundedRect(20, 72, W - 40, 100, 18);
    this.hDragon = this.add.image(70, 122, 'head_dragon'); this.hDragon.setScale(86 / this.hDragon.height);
    this.hTiger = this.add.image(W - 76, 122, 'head_tiger'); this.hTiger.setScale(80 / this.hTiger.height);
    this.chips = {};
    MARKET_HINTS.forEach((h, i) => {
      const x = 140 + (i % 2) * 535, y = 98 + Math.floor(i / 2) * 50;
      const c = this.add.container(x, y);
      const bg = this.add.graphics();
      const t = T(this, 34, 0, h.text, 17, '#2a1030', { ox: 0, sans: true });
      const ic = T(this, 14, 0, '○', 18, '#9a0078', { bold: true });
      c.add([bg, ic, t]);
      c.setInteractive(new Phaser.Geom.Rectangle(0, -21, 520, 42), Phaser.Geom.Rectangle.Contains);
      c.input.cursor = 'pointer';
      c.on('pointerup', () => this.speak(h.who, h.text));
      Object.assign(c, { bg, ic, h });
      this.chips[h.id] = c;
    });
    T(this, W / 2, 196 - 8, '点击提示可重看', 13, '#9a0078', { sans: true });
  }
  speak(who, text) {
    if (this.bub) this.bub.destroy();
    const head = who === 'tiger' ? this.hTiger : this.hDragon;
    this.tweens.add({ targets: head, y: 112, yoyo: true, duration: 140 });
    const x = who === 'tiger' ? W - 470 : 120;
    this.bub = bubble(this, x, 200, (who === 'tiger' ? '白额虎：' : '青龙：') + text, { w: 360, tail: 'none', edge: who === 'tiger' ? C.orange : C.green, depth: 700 });
    const b = this.bub;
    this.time.delayedCall(3600, () => { if (b.active) this.tweens.add({ targets: b, alpha: 0, duration: 300, onComplete: () => b.destroy() }); });
  }
  buildStall(s, cx) {
    const c = this.add.container(cx, 0);
    const g = this.add.graphics();
    // 立柱
    g.fillStyle(0x7a3a10, 1); g.fillRect(-92, 240, 10, 320); g.fillRect(82, 240, 10, 320);
    // 遮篷
    for (let k = 0; k < 8; k++) {
      g.fillStyle(k % 2 ? 0xffffff : s.color, 1); g.fillRect(-100 + k * 25, 214, 25, 44);
      g.fillCircle(-100 + k * 25 + 12.5, 258, 12.5);
    }
    g.lineStyle(3, C.ink, 0.6); g.lineBetween(-100, 214, 100, 214);
    // 柜台
    g.fillStyle(s.color, 1); g.fillRoundedRect(-98, 420, 196, 112, 8);
    g.fillStyle(0xffffff, 0.55); for (let k = 0; k < 6; k++) { const x = -80 + k * 32; g.fillTriangle(x, 476, x + 12, 458, x + 24, 476); g.fillTriangle(x, 476, x + 12, 494, x + 24, 476); }
    g.fillStyle(0x7a3a10, 1); g.fillRect(-104, 412, 208, 12);
    c.add(g);
    // 摊主
    const keeper = this.add.image(0, 414, 'head_elder').setOrigin(0.5, 1); keeper.setScale(122 / keeper.height);
    if (cx > W / 2) keeper.setFlipX(true);
    c.addAt(keeper, 0);
    // 招牌（挂在遮篷上）
    const sg = this.add.graphics();
    sg.fillStyle(C.ink, 1); sg.fillRoundedRect(-62, 218, 124, 42, 8);
    sg.lineStyle(3, C.yellow, 1); sg.strokeRoundedRect(-58, 222, 116, 34, 6);
    c.add(sg);
    c.add(T(this, 0, 239, s.name, 22, '#fbf5a2', { bold: true }));
    // 货物
    const goods = {
      herb: [['herb_huoxiang', -58, 0.27], ['herb_juhua', 0, 0.27], ['herb_bohe', 58, 0.27]],
      bamboo: [['bamboo', -42, 1], ['bamboo', 42, 1]],
      paper: [['paperstack', -44, 0.9], ['paperstack', 44, 0.9]],
      oil: [['jar', -60, 0.8], ['jar', 0, 0.9], ['jar', 60, 0.8]],
      food: [['bun', -56, 0.8], ['bun', 0, 0.8], ['bun', 56, 0.8]],
      misc: [['dice3', -56, 0.42], ['dice5', 0, 0.42], ['dice6', 56, 0.42]]
    }[s.id];
    goods.forEach(([k, x, sc]) => c.add(this.add.image(x, 452, k).setScale(sc).setOrigin(0.5, 0.8)));
    c.add(T(this, 0, 512, s.goods, 15, '#2a1030', { sans: true, bold: true }));
    // 已采购覆盖
    const done = this.add.container(0, 0).setVisible(false);
    const dg = this.add.graphics(); dg.fillStyle(0x444455, 0.45); dg.fillRoundedRect(-104, 210, 208, 330, 12);
    const stamp = T(this, 0, 380, '已采购', 30, '#ffffff', { bold: true, stroke: '#e8202a', strokeThickness: 8 }).setAngle(-12);
    done.add([dg, stamp]); c.add(done);
    c.setInteractive(new Phaser.Geom.Rectangle(-105, 210, 210, 340), Phaser.Geom.Rectangle.Contains);
    c.input.cursor = 'pointer';
    c.on('pointerup', () => this.pick(s));
    Object.assign(c, { keeper, done, s });
    this.stalls[s.id] = c;
  }
  buildChecklist() {
    panel(this, 30, 600, 900, 132, { fill: C.cream, stroke: C.magenta });
    T(this, 60, 622, '采购清单', 20, '#9a0078', { bold: true, ox: 0 });
    this.checks = {};
    STALLS.filter(s => s.need).forEach((s, i) => {
      const x = 60 + i * 218, y = 680;
      const c = this.add.container(x, y);
      const g = this.add.graphics();
      const nm = T(this, 50, -12, s.item, 18, '#2a1030', { ox: 0, bold: true });
      const st = T(this, 50, 14, '未找到', 15, '#8a8a96', { ox: 0, sans: true });
      c.add([g, nm, st]);
      Object.assign(c, { g, st, s });
      this.checks[s.id] = c;
    });
    this.goBtn = button(this, 1120, 666, '去药房制药 ▸', () => {
      const miss = STALLS.filter(s => s.need && !G.purchased.has(s.id)).map(s => s.name);
      if (miss.length) { toast(this, '还没找到：' + miss.join('、'), { y: 560 }); SFX.bad(); return; }
      goTo(this, 'Medicine', { mode: 'effects' });
    }, { w: 270, h: 64, size: 24 });
  }
  refresh() {
    Object.values(this.checks).forEach(c => {
      const ok = G.purchased.has(c.s.id);
      c.g.clear(); c.g.fillStyle(ok ? C.green : 0xffffff, 1); c.g.fillCircle(20, 0, 20);
      c.g.lineStyle(3, ok ? 0x118a5a : C.gray, 1); c.g.strokeCircle(20, 0, 20);
      if (ok) { c.g.lineStyle(5, 0xffffff, 1); c.g.lineBetween(10, 0, 18, 9); c.g.lineBetween(18, 9, 31, -8); }
      c.st.setText(ok ? '已找到 ✔' : '未找到'); c.st.setColor(ok ? '#118a5a' : '#8a8a96');
    });
    Object.values(this.chips).forEach(c => {
      const ok = G.purchased.has(c.h.id);
      c.bg.clear(); c.bg.fillStyle(ok ? 0xd8f5e0 : 0xffffff, 1); c.bg.fillRoundedRect(0, -20, 520, 40, 20);
      c.bg.lineStyle(2, ok ? C.green : (c.h.who === 'tiger' ? C.orange : C.green), 1); c.bg.strokeRoundedRect(0, -20, 520, 40, 20);
      c.ic.setText(ok ? '✔' : '○'); c.ic.setColor(ok ? '#118a5a' : '#9a0078');
    });
    Object.values(this.stalls).forEach(st => st.done.setVisible(G.purchased.has(st.s.id)));
    const all = STALLS.every(s => !s.need || G.purchased.has(s.id));
    this.goBtn.setAlpha(all ? 1 : 0.55);
    if (all && !this.goTween) {
      this.goTween = this.tweens.add({ targets: this.goBtn, scale: 1.08, yoyo: true, repeat: -1, duration: 500 });
      this.hud.setObjective('物资齐了，去药房制药！');
    }
    this.hud.setStep(`已找到 ${[...G.purchased].length} / 4`);
  }
  pick(s) {
    if (this.busy || this.dlgOpen()) return;
    const st = this.stalls[s.id];
    if (G.purchased.has(s.id)) { toast(this, `${s.name}的东西已经买好了`, { y: 560 }); return; }
    if (!s.need) {
      SFX.bad();
      this.tweens.add({ targets: st, x: { from: st.x - 6, to: st.x + 6 }, yoyo: true, repeat: 2, duration: 60, onComplete: () => st.x = 132 + STALLS.indexOf(s) * 214 });
      const left = MARKET_HINTS.filter(h => !G.purchased.has(h.id));
      const clue = left.length ? left[Math.floor(Math.random() * left.length)] : null;
      this.speak(s.id === 'food' ? 'tiger' : 'dragon', s.info + (clue ? '记得：' + clue.text : ''));
      G.errorStreak.market = (G.errorStreak.market || 0) + 1;
      return;
    }
    this.busy = true; SFX.ok();
    G.errorStreak.market = 0;
    this.tweens.add({ targets: st.keeper, y: 400, yoyo: true, repeat: 1, duration: 150 });
    const iconKey = { herb: 'herb_gancao', bamboo: 'bamboo', paper: 'paperstack', oil: 'jar' }[s.id];
    const it = this.add.image(st.x, 380, iconKey).setDepth(800).setScale(iconKey.startsWith('herb') ? 0.4 : 1.1);
    const chk = this.checks[s.id];
    sparkle(this, st.x, 380, s.color, 12);
    this.speak(MARKET_HINTS.find(h => h.id === s.id).who, `对，就是${s.name}！摊主把${s.item}交给了你。`);
    this.tweens.add({ targets: it, x: chk.x + 20, y: chk.y, scale: 0.3, duration: 800, ease: 'Cubic.inOut', onComplete: () => {
      it.destroy(); G.purchased.add(s.id); this.refresh(); this.busy = false;
      sparkle(this, chk.x + 20, chk.y, C.green, 10);
    } });
  }
  dlgOpen() { return this.children.list.some(o => o.depth === 1200); }
}
