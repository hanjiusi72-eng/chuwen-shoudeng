/* 交互 1A / 1B / 2B：药房制药（tiger | dragon 为药庐医患；effects 为「药庐济世」竹简药单界面） */
class MedicineScene extends Phaser.Scene {
  constructor() { super('Medicine'); }
  init(data) { this.mode = data.mode || 'tiger'; this.fromForage = !!data.from; }

  create() {
    fadeIn(this, ['ptHi', 'ptZone', 'pt', 'hiTween', 'flipping', 'gourd', 'gourdHint', 'eyes', 'eyesDone', 'redMark', 'dropper', 'closedBook', 'focusTask', 'taskCards', 'book', 'pageC', 'fxCards', 'fxRack', 'pestle', 'steam', 'stoveFx', 'mud', 'fxStatus']);
    BGM.setMode('festive');
    if (this.mode === 'effects') {
      this.add.image(W / 2, H / 2, 'medicine_bg').setDisplaySize(W, H);
      this.hud = hud(this, '交互 2B · 药庐济世', '照药单备齐三种药（顺序不限）');
      this.busy = false; this.streakKey = 'effects';
      G.errorStreak[this.streakKey] = G.errorStreak[this.streakKey] || 0;
      this.fxCurrent = this.fxCurrent || 'E1';
      this.buildForge();
      muteButton(this);
      this.updateStep();
      const intro = [
        { who: 'tiger', text: '村里的病人，症状各不相同：有人发热头痛，有人咳得整夜睡不着，还有人上吐下泻。' },
        { who: 'dragon', text: '所以要备三种药。竹简药单就摊在案上——照单子把四味药草拖进捣药罐，捣成泥、煎成药。先制哪一份都行。' }
      ];
      this.time.delayedCall(450, () => dialog(this, intro));
      return;
    }

    this.add.image(W / 2, H / 2, 'bg_pharmacy').setDisplaySize(W, H);
    const titles = {
      tiger: ['交互 1A · 山中遇虎', '查阅药书，为老虎配制治喉的药'],
      dragon: ['交互 1B · 云中救龙', '查阅药书，为青龙配制明目的药']
    };
    this.hud = hud(this, ...titles[this.mode]);
    this.pot = []; this.busy = false; this.phase = 'brew';
    this.streakKey = this.mode;
    G.errorStreak[this.streakKey] = G.errorStreak[this.streakKey] || 0;

    this.buildBackpack();
    this.buildPot();
    this.buildBook();
    this.buildPatient();
    this.bindDrag();
    muteButton(this);
    this.updateStep();

    const intro = {
      tiger: [{ who: 'tiger', text: '吼……不知卡了根什么骨头，咽不下，吐不出，一路疼得直冒汗……' },
              { who: 'wu', text: '别慌。这类急症，药书里有现成的方子。翻到治“喉中鲠物”的那页，把三味草药拖进药罐。' }],
      dragon: [{ who: 'dragon', text: '我的眼睛……像蒙了一层雾，连恩人的脸都瞧不真切了……' },
               { who: 'wu', text: '这是昏花之症。再翻翻药书，找到明目的方子——这一剂，和治虎的不同。' }]
    }[this.mode];
    this.time.delayedCall(450, () => dialog(this, intro, () => {
      if (!G.bookOpened) this.hud.setObjective('第一步：点击打开药书');
    }));
  }

  /* ================= 交互 2B · 药庐济世 ================= */
  buildForge() {
    this.fxPhase = 'select';
    this.fxSelected = [];
    T(this, 505, 88, '', 16, '#ffffff').setName('fxCount');
    this.fxName = T(this, 505, 372, '', 26, '#ffffff', { bold: true, stroke: '#b0487c', strokeThickness: 5 });
    // 三张竹简药单（当前展开居中，两侧卷起）
    this.cardC = this.add.container(0, 0);
    this.renderCards(true);
    // 右侧药草架（蓝底圆徽）
    this.rack = {};
    HERBS.forEach((h, i) => {
      const x = 1058 + (i % 2) * 148, y = 156 + Math.floor(i / 2) * 98;
      const c = this.add.container(x, y);
      const circ = this.add.image(0, 0, 'herb_circle').setDisplaySize(92, 92);
      const art = this.add.image(0, -2, 'med_' + h.id).setDisplaySize(54, 54);
      const nm = T(this, 0, 39, h.name, 15, '#fbf5a2', { bold: true, stroke: '#1a3ab0', strokeThickness: 4 });
      c.add([circ, art, nm]); c.setSize(100, 100);
      c.setInteractive({ draggable: true, useHandCursor: true });
      Object.assign(c, { kind: 'fxherb', herb: h.id, home: { x, y }, art, circ, nm });
      this.rack[h.id] = c;
    });
    // 煎药罐（左）+ 蒲扇
    this.stoveFx = this.add.image(470, 716, 'tool_stove').setDisplaySize(236, 227).setOrigin(0.5, 1).setVisible(false);
    this.kettle = this.add.image(470, 688, 'tool_kettle_open').setDisplaySize(300, 269).setOrigin(0.5, 1).setInteractive({ useHandCursor: true });
    this.kettleZone = new Phaser.Geom.Rectangle(320, 420, 300, 300);
    this.steam = this.add.image(470, 428, 'tool_steam').setDisplaySize(96, 150).setAlpha(0);
    this.fanFx = this.add.image(190, 620, 'tool_fan').setDisplaySize(200, 176);
    this.fanFx.setOrigin(0.1, 0.5);
    // 捣药罐（中下）
    this.mortarBack = this.add.image(800, 592, 'tool_mortar_back').setDisplaySize(260, 250);
    this.pestle = this.add.image(818, 490, 'tool_pestle').setDisplaySize(66, 100).setOrigin(0.5, 0.85).setAngle(-14);
    this.mortarFront = this.add.image(800, 592, 'tool_mortar_front').setDisplaySize(260, 250);
    this.mortarZone = new Phaser.Geom.Rectangle(660, 450, 290, 290);
    this.mortarHi = this.add.graphics();
    this.fxStatus = T(this, 800, 424, '', 18, '#ffffff', { bold: true, stroke: '#b0487c', strokeThickness: 4 });
    T(this, 560, 716, '', 18, '#ffffff', { stroke: '#b0487c', strokeThickness: 4 }).setName('fxHint');
    // 药泥（圆球）
    this.mud = this.add.image(800, 420, 'tool_mud').setDisplaySize(190, 127).setVisible(false).setAlpha(0).setDepth(50);
    this.mud.setInteractive({ draggable: true, useHandCursor: true });
    Object.assign(this.mud, { kind: 'fxmud', home: { x: 800, y: 420 } });
    this.input.setDraggable(this.mud);
    this.setForgeHint('按药单选取四味药草，拖入捣药罐');
    this.bindForgeDrag();
  }
  fxRecipes() { return RECIPES.filter(r => r.id[0] === 'E'); }
  fxR() { return RECIPE[this.fxCurrent]; }
  setForgeHint(s) { const h = this.children.getByName('fxHint'); if (h) h.setText(s); }
  setForgeStatus(s) { this.fxStatus.setText(s); }
  renderCards(unfurl) {
    if (this.cardC) this.cardC.removeAll(true);
    const R = this.fxR(), list = this.fxRecipes();
    const cur = list.findIndex(r => r.id === this.fxCurrent);
    const order = [list[(cur + 2) % 3], list[cur], list[(cur + 1) % 3]];
    order.forEach((r, i) => {
      const done = G.effectsDone.has(r.id), open = i === 1;
      const pos = open ? { x: 227, y: 104, w: 556, h: 240 } : { x: i === 0 ? 65 : 806, y: 104, w: 157, h: 228 };
      const c = this.add.container(pos.x + pos.w / 2, pos.y + pos.h / 2);
      let im;
      if (open) {
        im = this.add.image(0, 0, r.img).setDisplaySize(pos.w, pos.h);
        c.add(im);
        if (r.id !== this.fxCurrent || done) { /* 防御 */ }
      } else {
        im = this.add.image(0, 0, 'recipe_closed').setDisplaySize(pos.w * 0.42, pos.h);
        c.add(im);
        c.add(T(this, 0, pos.h / 2 + 30, r.name, 20, '#ffffff', { bold: true, stroke: '#b0487c', strokeThickness: 4 }));
        if (done) { im.setTint(0x9a9aa8); c.add(T(this, 0, -8, '已 制 好', 20, '#e8ffb0', { bold: true, stroke: '#118a5a', strokeThickness: 4 })); }
        c.setSize(pos.w, pos.h);
        c.setInteractive({ useHandCursor: true });
        c.on('pointerup', () => this.switchRecipe(r.id));
      }
      if (done && open) { im.setTint(0x9a9aa8); }
      c.im = im;
      this.cardC.add(c);
      if (open && unfurl) {
        im.scaleX = 0.06;
        this.tweens.add({ targets: im, displayWidth: pos.w, duration: 480, ease: 'Cubic.out' });
        SFX.page();
      }
    });
    const doneN = G.effectsDone.size;
    const cnt = this.children.getByName('fxCount');
    if (cnt) cnt.setText(`已制 ${doneN} / 3`);
    this.fxName.setText(R.name + (G.effectsDone.has(R.id) ? ' · 已制好' : ''));
  }
  switchRecipe(id) {
    if (this.busy || id === this.fxCurrent) return;
    this.fxCurrent = id;
    this.fxSelected = [];
    this.resetRack();
    this.fxPhase = 'select';
    this.tweens.killTweensOf(this.mud);
    this.mud.setVisible(false).setAlpha(0);
    this.setForgeStatus('');
    this.renderCards(true);
    this.updateStep();
  }
  resetRack() {
    Object.values(this.rack).forEach(c => { c.used = false; c.art.clearTint(); c.setAlpha(1); c.setInteractive({ draggable: true, useHandCursor: true }); this.input.setDraggable(c); });
  }
  bindForgeDrag() {
    Object.values(this.rack).forEach(c => this.input.setDraggable(c));
    this.input.on('dragstart', (p, o) => {
      this.tweens.killTweensOf(o);
      if (o.kind === 'fxherb' && !o.used) {
        o.setDepth(1000);
        this.tweens.add({ targets: o, scale: 1.1, duration: 90 });
        this.kettle.setAlpha(0.22); this.fanFx.setAlpha(0.22);
        this.showMortarHi(true);
        SFX.pick();
      } else if (o.kind === 'fxmud') { o.setDepth(1000); this.showKettleHi(true); }
    });
    this.input.on('drag', (p, o, x, y) => { o.x = x; o.y = y; });
    this.input.on('dragend', (p, o) => {
      this.kettle.setAlpha(1); this.fanFx.setAlpha(1);
      this.showMortarHi(false); this.showKettleHi(false);
      if (o.kind === 'fxherb') this.dropFxHerb(o, p);
      else if (o.kind === 'fxmud') this.dropFxMud(o, p);
    });
  }
  showMortarHi(on) {
    this.mortarHi.clear();
    if (!on) return;
    const r = this.mortarZone;
    this.mortarHi.lineStyle(4, 0xffffff, 1); dashedRect(this.mortarHi, r.x, r.y, r.width, r.height, 14, 8);
    this.mortarHi.fillStyle(0xffffff, 0.14); this.mortarHi.fillRoundedRect(r.x, r.y, r.width, r.height, 20);
  }
  showKettleHi(on) {
    this.mortarHi.clear();
    if (!on) return;
    const r = this.kettleZone;
    this.mortarHi.lineStyle(4, 0xffe62a, 1); dashedRect(this.mortarHi, r.x, r.y, r.width, r.height, 14, 8);
    this.mortarHi.fillStyle(0xffe62a, 0.16); this.mortarHi.fillRoundedRect(r.x, r.y, r.width, r.height, 20);
  }
  dropFxHerb(card, p) {
    const R = this.fxR();
    const hit = this.mortarZone.contains(p.x, p.y) || this.mortarZone.contains(card.x, card.y);
    if (!hit) return this.backFx(card);
    if (this.busy) { toast(this, '正在捣药、煎煮，稍候片刻'); return this.backFx(card); }
    if (G.effectsDone.has(R.id)) { toast(this, '这份药已制好，换一张竹简药单吧'); return this.backFx(card); }
    if (this.fxPhase !== 'select') { toast(this, '这一锅正在制，先把药泥煎好'); return this.backFx(card); }
    if (!R.herbs.includes(card.herb)) {
      SFX.bad();
      G.errorStreak[this.streakKey]++;
      toast(this, '这味药不在「' + R.name + '」的药单里——照竹简上的药名再看看');
      if (G.errorStreak[this.streakKey] >= 2) this.time.delayedCall(1200, () => toast(this, '提示：竹简上写着配方，一味一味对照着拿。', { ms: 3000, fill: 0x1a3ab0, edge: C.cream }));
      return this.backFx(card);
    }
    if (this.fxSelected.includes(card.herb)) return this.backFx(card);
    SFX.drop();
    this.fxSelected.push(card.herb);
    const fly = this.add.image(card.x, card.y, 'med_' + card.herb).setDisplaySize(56, 56).setDepth(1001);
    this.tweens.killTweensOf(card);
    card.setPosition(card.home.x, card.home.y).setScale(1).setDepth(0);
    card.used = true; card.art.setTint(0x777788); card.setAlpha(0.4); card.disableInteractive();
    this.tweens.add({ targets: fly, x: 800, y: 565, displayWidth: 10, displayHeight: 10, angle: 180, duration: 340, ease: 'Quad.in', onComplete: () => { fly.destroy(); sparkle(this, 800, 565, 0xfff3b0, 6, 1002); } });
    this.setForgeStatus(`已配齐 ${this.fxSelected.length} / 4 味`);
    if (this.fxSelected.length >= 4) this.time.delayedCall(360, () => this.startGrind());
  }
  backFx(o) {
    this.tweens.killTweensOf(o);
    const tw = { targets: o, x: o.home.x, y: o.home.y, duration: 260, ease: 'Back.out', onComplete: () => o.setDepth(o.kind === 'fxmud' ? 50 : 0) };
    if (o.kind === 'fxherb') tw.scale = 1;
    this.tweens.add(tw);
  }
  startGrind() {
    this.busy = true; this.fxPhase = 'grinding';
    this.setForgeStatus(''); this.setForgeHint('药味已齐——捣药！');
    SFX.grind();
    this.tweens.add({ targets: this.pestle, angle: { from: -30, to: 14 }, y: 520, duration: 200, yoyo: true, repeat: 7, ease: 'Quad.inOut',
      onComplete: () => { this.pestle.setAngle(-14); this.pestle.y = 490; } });
    const g = this.time.addEvent({ delay: 300, repeat: 5, callback: () => SFX.grind() });
    this.time.delayedCall(2000, () => {
      g.remove();
      this.fxPhase = 'mud';
      this.mud.setVisible(true).setPosition(800, 540).setAlpha(0);
      this.tweens.add({ targets: this.mud, y: 420, alpha: 1, duration: 700, ease: 'Quad.out', onComplete: () => {
        this.tweens.add({ targets: this.mud, y: 408, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.inOut' });
      } });
      this.setForgeHint('把药泥拖进左边的煎药罐');
      this.busy = false;
    });
  }
  dropFxMud(mud, p) {
    const hit = this.kettleZone.contains(p.x, p.y) || this.kettleZone.contains(mud.x, mud.y);
    if (!hit) return this.backFx(mud);
    if (this.fxPhase !== 'mud') return this.backFx(mud);
    this.busy = true; this.fxPhase = 'brewing';
    SFX.drop();
    mud.disableInteractive();
    this.tweens.add({ targets: mud, x: 470, y: 590, displayWidth: 40, displayHeight: 26, alpha: 0, duration: 500, ease: 'Quad.in', onComplete: () => mud.setVisible(false) });
    this.setForgeHint('正在煎煮，稍候片刻……');
    this.stoveFx.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.stoveFx, alpha: 1, duration: 400 });
    this.tweens.add({ targets: this.kettle, y: 600, duration: 400, ease: 'Back.out' });
    this.steam.y = 340;
    this.tweens.add({ targets: this.steam, alpha: 0.95, duration: 600 });
    this.tweens.add({ targets: this.steam, y: 310, alpha: 0.2, yoyo: true, repeat: -1, duration: 900 });
    this.tweens.add({ targets: this.fanFx, angle: { from: -26, to: 8 }, duration: 300, yoyo: true, repeat: 7, ease: 'Sine.inOut',
      onComplete: () => this.fanFx.setAngle(0) });
    SFX.brew();
    this.time.delayedCall(2400, () => this.finishBrew());
  }
  finishBrew() {
    this.tweens.killTweensOf(this.steam);
    this.tweens.add({ targets: [this.steam, this.stoveFx], alpha: 0, duration: 400, onComplete: () => { this.stoveFx.setVisible(false); this.steam.y = 428; } });
    this.tweens.add({ targets: this.kettle, y: 688, duration: 450, delay: 200, ease: 'Quad.inOut' });
    SFX.ok(); sparkle(this, 470, 540, this.fxR().color, 18);
    G.effectsDone.add(this.fxCurrent);
    G.errorStreak[this.streakKey] = 0;
    this.renderCards(false);
    this.setForgeStatus('');
    this.busy = false;
    this.updateStep();
    if (G.effectsDone.size >= 3) {
      this.setForgeHint('三种药都备齐了！');
      this.time.delayedCall(900, () => dialog(this, [
        { who: 'tiger', text: '三种药都备齐了！药香飘出老远——快，趁热送到病人手里！' },
        { who: 'dragon', text: '村里病得最重的人家，汤药要先送到。我们随你一起去。' }
      ], () => goTo(this, 'Story', { id: 'B' })));
    } else {
      const next = this.fxRecipes().find(r => !G.effectsDone.has(r.id));
      this.setForgeHint('「' + this.fxR().name + '」装进了药箱。换一张竹简，接着制药');
      this.time.delayedCall(1100, () => this.switchRecipe(next.id));
    }
  }

  /* ================= 交互 1A / 1B · 药庐医患 ================= */
  buildBackpack() {
    const g = this.add.graphics();
    g.fillStyle(0x061a70, 0.78); g.fillRoundedRect(966, 76, 356, 662, 22);
    g.lineStyle(4, C.cream, 1); g.strokeRoundedRect(966, 76, 356, 662, 22);
    T(this, 1144, 104, '药 材 背 包', 22, '#fbf5a2', { bold: true });
    T(this, 1144, 132, '按住药材，拖进药罐', 15, '#cfe0ff', { sans: true });
    this.cards = {};
    HERBS.forEach((h, i) => {
      const x = 1030 + (i % 3) * 114, y = 196 + Math.floor(i / 3) * 134;
      const c = this.add.container(x, y);
      const im = this.add.image(0, 0, 'herb_' + h.id).setDisplaySize(98, 98);
      const nm = T(this, 0, 60, h.name, 19, '#fff8d0', { bold: true });
      c.add([im, nm]); c.setSize(104, 128);
      c.setInteractive({ draggable: true, useHandCursor: true });
      Object.assign(c, { kind: 'herb', herb: h.id, home: { x, y }, im, nm });
      this.cards[h.id] = c;
    });
  }
  setCardUsed(c, used) {
    c.used = used;
    if (used) { c.im.setTint(0x777788); c.setAlpha(0.45); c.disableInteractive(); }
    else { c.im.clearTint(); c.setAlpha(1); c.setInteractive({ draggable: true, useHandCursor: true }); this.input.setDraggable(c); }
  }
  resetCards() { Object.values(this.cards).forEach(c => this.setCardUsed(c, false)); }

  buildPot() {
    this.add.image(468, 690, 'fan').setScale(0.42).setAngle(-12);
    this.fan = this.children.list[this.children.list.length - 1];
    this.add.image(826, 692, 'mortar').setScale(0.36);
    this.stove = this.add.image(645, 738, 'stove').setOrigin(0.5, 1).setScale(330 / 818);
    this.liquid = this.add.ellipse(645, 520, 92, 20, 0xffe62a, 0).setDepth(5);
    this.potZone = new Phaser.Geom.Rectangle(520, 300, 250, 440);
    this.potHi = this.add.graphics().setDepth(4);
    const n = 3;
    this.slotN = n;
    this.slotG = this.add.graphics();
    this.slotIcons = [];
    this.slotXY = i => ({ x: 645 + (i - (n - 1) / 2) * 66, y: 352 });
    this.drawSlots();
    T(this, 645, 316, '药 罐', 18, '#9a0078', { bold: true });
    this.status = T(this, 645, 396, '', 17, '#2a1030', { sans: true, wrap: 380, align: 'center' });
  }
  drawSlots() {
    const g = this.slotG; g.clear();
    for (let i = 0; i < this.slotN; i++) {
      const p = this.slotXY(i);
      g.fillStyle(C.white, 0.7); g.fillCircle(p.x, p.y, 27);
      g.lineStyle(3, C.magenta, 1); dashedCircle(g, p.x, p.y, 27, 16);
    }
  }
  showPotHi(on) {
    this.potHi.clear();
    if (this.hiTween) { this.hiTween.remove(); this.hiTween = null; this.potHi.setAlpha(1); }
    if (!on) return;
    const r = this.potZone;
    this.potHi.lineStyle(4, C.blue, 1); dashedRect(this.potHi, r.x, r.y, r.width, r.height, 14, 8);
    this.potHi.fillStyle(C.cyan, 0.12); this.potHi.fillRoundedRect(r.x, r.y, r.width, r.height, 20);
    this.hiTween = this.tweens.add({ targets: this.potHi, alpha: 0.4, yoyo: true, repeat: -1, duration: 420 });
  }
  setStatus(s) { this.status.setText(s); }

  buildBook() {
    this.bookX = 186; this.bookY = 392; this.bookW = 320; this.bookH = 470;
    T(this, this.bookX, 104, '药 书', 24, '#9a0078', { bold: true });
    this.pageTxt = T(this, this.bookX, 650, '', 15, '#6a0050', { sans: true });
    if (G.bookOpened) this.openBook(true); else this.showClosedBook();
  }
  showClosedBook() {
    const c = this.add.container(this.bookX, this.bookY);
    const im = this.add.image(0, -10, 'scrolls').setScale(0.46);
    const t = T(this, 0, 196, '点击打开药书', 22, '#fff8d0', { bold: true, stroke: '#9a0078', strokeThickness: 6 });
    const ring = this.add.graphics(); ring.lineStyle(5, C.yellow, 1); ring.strokeRoundedRect(-150, -180, 300, 340, 24);
    c.add([ring, im, t]); c.setSize(300, 420); c.setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: [ring, t], alpha: 0.35, yoyo: true, repeat: -1, duration: 600 });
    c.on('pointerup', () => {
      if (this.dlgOpen()) return;
      c.disableInteractive(); SFX.page();
      this.tweens.add({ targets: c, scaleX: 0.1, alpha: 0, duration: 380, ease: 'Cubic.in', onComplete: () => { c.destroy(); G.bookOpened = true; this.openBook(false); this.updateStep(); } });
    });
    this.closedBook = c;
  }
  dlgOpen() { return this.children.list.some(o => o.depth === 1200); }
  openBook(instant) {
    const { bookX: x, bookY: y, bookW: w, bookH: h } = this;
    const s = w / 1000;
    this.book = this.add.nineslice(x, y, 'book_slips', null, 1000, h / s, 8, 8, 80, 80).setScale(s);
    this.pageC = this.add.container(x, y);
    const mk = (dx, dir) => {
      const z = this.add.zone(x + dx, y, w / 2, h).setInteractive({ useHandCursor: true });
      z.on('pointerup', () => this.flip(dir));
      return z;
    };
    mk(-w / 4, -1); mk(w / 4, 1);
    this.add.text(x - w / 2 + 6, y + h / 2 - 6, '◀', { fontSize: '14px', color: '#9a0078', resolution: TEXT_RES }).setOrigin(0, 1);
    this.add.text(x + w / 2 - 6, y + h / 2 - 6, '▶', { fontSize: '14px', color: '#9a0078', resolution: TEXT_RES }).setOrigin(1, 1);
    this.renderPage();
    if (!instant) {
      this.book.scaleX = 0.02; this.pageC.setAlpha(0);
      this.tweens.add({ targets: this.book, scaleX: s, duration: 520, ease: 'Cubic.out' });
      this.tweens.add({ targets: this.pageC, alpha: 1, duration: 300, delay: 420 });
    }
  }
  renderPage() {
    const c = this.pageC; c.removeAll(true);
    const R = RECIPES[G.bookPageIndex];
    const sw = this.bookW / 14, colX = j => this.bookW / 2 - (j + 0.5) * sw; // j 从右往左
    const top = -this.bookH / 2 + 30;
    c.add(VT(this, (colX(0) + colX(1)) / 2, top, R.name, 30, '#1a0a30', { oy: 0, bold: true, ls: -2 }));
    const tag = this.add.graphics(); tag.fillStyle(C.magenta, 1); tag.fillRoundedRect(colX(2) - 12, top - 2, 24, 70, 6); c.add(tag);
    c.add(VT(this, colX(2), top + 4, R.tag, 19, '#fff8d0', { oy: 0, bold: true }));
    c.add(VT(this, colX(3), top + 86, '主治', 16, '#9a0078', { oy: 0, bold: true }));
    c.add(VT(this, colX(3), top + 136, R.desc[0], 20, '#1a0a30', { oy: 0 }));
    c.add(VT(this, colX(4), top + 136, R.desc[1], 20, '#1a0a30', { oy: 0 }));
    c.add(VT(this, colX(5), top, '配方', 16, '#9a0078', { oy: 0, bold: true }));
    R.herbs.forEach((id, k) => {
      const x = (colX(6 + 2 * k) + colX(7 + 2 * k)) / 2;
      const r = R.herbs.length > 3 ? 21 : 25;
      const bg = this.add.graphics(); bg.fillStyle(C.cream, 1); bg.fillCircle(x, top + 30, r); bg.lineStyle(2, C.magenta, 1); bg.strokeCircle(x, top + 30, r);
      const im = this.add.image(x, top + 30, 'plant_' + id); im.setScale((r * 2 - 6) / Math.max(im.width, im.height));
      c.add([bg, im, VT(this, x, top + 66, HERB[id].name, 24, '#1a0a30', { oy: 0, bold: true })]);
    });
    const sx = (colX(12) + colX(13)) / 2 + 10, sy = this.bookH / 2 - 70;
    const seal = this.add.graphics(); seal.fillStyle(C.red, 0.92); seal.fillRoundedRect(sx - 24, sy - 24, 48, 48, 6); c.add(seal);
    c.add(T(this, sx, sy, '保生\n药书', 14, '#fff3d0', { bold: true, align: 'center', lineSpacing: -2 }));
    this.pageTxt.setText(`第 ${G.bookPageIndex + 1} / ${RECIPES.length} 页 · 点击左右页翻页`);
  }
  flip(dir) {
    if (this.flipping || this.dlgOpen()) return;
    this.flipping = true; SFX.page();
    const { bookX: x, bookY: y, bookW: w, bookH: h } = this;
    const leaf = (side) => {
      const g = this.add.graphics().setDepth(50);
      const n = 7, sw = w / 14;
      for (let i = 0; i < n; i++) {
        const lx = side > 0 ? i * sw : -(i + 1) * sw;
        g.fillStyle(i % 2 ? 0x24a986 : 0x2bbf98, 1); g.fillRoundedRect(lx + 1, -h / 2 + 4, sw - 2, h - 8, 4);
        g.lineStyle(1.5, 0xffffff, 1); g.strokeRoundedRect(lx + 1, -h / 2 + 4, sw - 2, h - 8, 4);
      }
      g.fillStyle(0x000000, 0.12); g.fillRect(side > 0 ? 0 : -w / 2, -h / 2 + 4, w / 2, h - 8);
      g.setPosition(x, y);
      return g;
    };
    const a = leaf(dir > 0 ? 1 : -1);
    this.tweens.add({ targets: this.pageC, alpha: 0, duration: 140 });
    this.tweens.add({ targets: a, scaleX: 0, duration: 260, ease: 'Sine.in', onComplete: () => {
      a.destroy();
      G.bookPageIndex = (G.bookPageIndex + dir + RECIPES.length) % RECIPES.length;
      this.renderPage();
      const b = leaf(dir > 0 ? -1 : 1); b.scaleX = 0;
      this.tweens.add({ targets: b, scaleX: 1, duration: 260, ease: 'Sine.out', onComplete: () => {
        b.destroy(); this.tweens.add({ targets: this.pageC, alpha: 1, duration: 160, onComplete: () => { this.flipping = false; } });
      } });
    } });
  }

  /* 患者（交互 1） */
  buildPatient() {
    panel(this, 362, 78, 566, 218, { fill: C.cream, stroke: C.blue, lw: 4 });
    const isT = this.mode === 'tiger';
    this.pt = this.add.image(isT ? 515 : 505, 188, isT ? 'head_tiger' : 'head_dragon');
    this.pt.setScale(200 / this.pt.height).setDepth(20);
    this.ptZone = new Phaser.Geom.Rectangle(370, 84, 300, 206);
    T(this, 790, 108, isT ? '白额虎' : '青龙', 24, '#9a0078', { bold: true });
    T(this, 790, 140, isT ? '症状：喉中鲠物，吞咽作痛' : '症状：双目昏花，红肿畏光', 17, '#2a1030', { sans: true });
    this.ptStep = T(this, 790, 222, '', 18, '#004dfc', { bold: true, wrap: 250, align: 'center' });
    if (isT) {
      this.redMark = this.add.circle(this.pt.x, 232, 15, C.red, 0.0).setStrokeStyle(4, C.red).setDepth(21);
      this.tweens.add({ targets: this.redMark, scale: 1.3, alpha: 0.4, yoyo: true, repeat: -1, duration: 500 });
    } else {
      const s = this.pt.scale;
      this.eyes = [[152, 82], [198, 82]].map(([ex, ey]) => {
        const e = this.add.circle(this.pt.x + (ex - this.pt.width / 2) * s, this.pt.y + (ey - this.pt.height / 2) * s, 8, C.red, 0.55).setStrokeStyle(2, 0xffffff).setDepth(21);
        e.local = { ex, ey };
        this.tweens.add({ targets: e, scale: 1.35, yoyo: true, repeat: -1, duration: 450 });
        return e;
      });
    }
  }

  /* 拖拽（交互 1） */
  bindDrag() {
    Object.values(this.cards).forEach(c => this.input.setDraggable(c));
    this.input.on('dragstart', (p, o) => {
      o.setDepth(1000); o.dragging = true;
      this.tweens.add({ targets: o, scale: 1.12, duration: 90 });
      if (o.kind === 'herb') this.showPotHi(true);
      if (o.kind === 'gourd') this.showPatientHi(true);
    });
    this.input.on('drag', (p, o, dx, dy) => { o.x = dx; o.y = dy; });
    this.input.on('dragend', (p, o) => {
      o.dragging = false;
      this.showPotHi(false); this.showPatientHi(false);
      if (o.kind === 'herb') this.dropHerb(o, p);
      else if (o.kind === 'gourd') this.dropGourd(o, p);
      else if (o.kind === 'pin') this.dropPin(o, p);
    });
  }
  back(o, cb) {
    this.tweens.killTweensOf(o);
    this.tweens.add({ targets: o, x: o.home.x, y: o.home.y, scale: 1, duration: 260, ease: 'Back.out', onComplete: () => { o.setDepth(0); cb && cb(); } });
  }

  dropHerb(card, p) {
    const inZone = this.potZone.contains(p.x, p.y) || this.potZone.contains(card.x, card.y);
    if (!inZone) return this.back(card);
    if (!G.bookOpened) { toast(this, '先点击左边的药书，看清药方再配药'); return this.back(card); }
    if (this.busy) { toast(this, '正在熬药，稍等片刻'); return this.back(card); }
    if (this.phase !== 'brew') { toast(this, this.mode === 'tiger' ? '药已制好，先把药交给老虎' : '药已制好，先把药交给青龙'); return this.back(card); }
    if (this.pot.length >= this.slotN) { toast(this, '药罐已满，等它自动判定'); return this.back(card); }
    SFX.drop();
    const i = this.pot.length; this.pot.push(card.herb);
    const slot = this.slotXY(i);
    const icon = this.add.image(card.x, card.y, 'herb_' + card.herb).setDisplaySize(96, 96).setDepth(30);
    this.tweens.add({ targets: icon, x: slot.x, y: slot.y, displayWidth: 50, displayHeight: 50, duration: 220, ease: 'Quad.out' });
    this.slotIcons.push(icon);
    this.tweens.killTweensOf(card);
    card.x = card.home.x; card.y = card.home.y; card.setScale(1); card.setDepth(0);
    this.setCardUsed(card, true);
    this.liquid.setFillStyle(0xffe62a, 0.5);
    if (this.pot.length < this.slotN) this.setStatus(`已投入 ${this.pot.map(h => HERB[h].name).join('、')}`);
    else this.time.delayedCall(260, () => this.judge());
  }
  clearPot() {
    this.pot = [];
    this.slotIcons.forEach(ic => this.tweens.add({ targets: ic, alpha: 0, scale: 0, duration: 200, onComplete: () => ic.destroy() }));
    this.slotIcons = [];
    this.resetCards();
    this.liquid.setFillStyle(0xffe62a, 0);
  }
  sameSet(a, b) { return a.length === b.length && a.every(x => b.includes(x)); }
  judge() {
    const pot = this.pot.slice();
    const target = this.mode === 'tiger' ? RECIPE.R1 : RECIPE.R2;
    if (this.sameSet(pot, target.herbs)) return this.success(target);
    const other = this.mode === 'tiger' ? RECIPE.R2 : RECIPE.R1;
    if (this.sameSet(pot, other.herbs)) return this.fail(`这是${other.tag}的${other.name}，不对症哦，再看看药书`);
    this.fail('药罐轻晃……配方不对，再看看药书');
  }
  fail(msg, count = true) {
    this.busy = true; SFX.bad();
    this.tweens.add({ targets: this.stove, x: { from: 637, to: 653 }, yoyo: true, repeat: 4, duration: 50, onComplete: () => { this.stove.x = 645; } });
    this.liquid.setFillStyle(0x6a6a6a, 0.6);
    toast(this, msg, { y: 300 });
    this.setStatus('本锅已清空，所有药材重新亮起');
    if (count) G.errorStreak[this.streakKey]++;
    if (G.errorStreak[this.streakKey] >= 2) {
      const hint = { tiger: '提示：药书里写着“喉中鲠物”的那一页，就是治虎的药方。',
        dragon: '提示：找写着“双目昏花”的那一页，材料和治虎的不一样。' }[this.mode];
      this.time.delayedCall(1300, () => toast(this, hint, { y: 300, ms: 3200, fill: C.blue }));
    }
    this.time.delayedCall(700, () => { this.clearPot(); this.busy = false; });
  }
  success(r) {
    this.busy = true; G.errorStreak[this.streakKey] = 0;
    SFX.brew(); this.setStatus('药材齐了，熬药中……');
    this.liquid.setFillStyle(r.color, 0.95);
    this.tweens.add({ targets: this.fan, angle: { from: -24, to: 6 }, yoyo: true, repeat: 5, duration: 140 });
    this.tweens.add({ targets: this.stove, scaleY: this.stove.scaleY * 1.03, yoyo: true, repeat: 3, duration: 180 });
    for (let i = 0; i < 16; i++) {
      const s = this.add.image(645 + Phaser.Math.Between(-40, 40), 510, 'dot').setTint(i % 2 ? r.color : 0xffffff).setScale(0.6 + Math.random()).setDepth(40).setAlpha(0.9);
      this.tweens.add({ targets: s, y: 380 - Math.random() * 80, x: s.x + Phaser.Math.Between(-30, 30), alpha: 0, scale: 2.4, duration: 900 + Math.random() * 500, delay: i * 70, onComplete: () => s.destroy() });
    }
    this.time.delayedCall(1500, () => {
      SFX.ok(); sparkle(this, 645, 480, r.color, 18);
      this.clearPot();
      this.phase = 'deliver'; this.busy = false;
      this.makeGourd(r);
      this.setStatus(`${r.name}制成！`);
      this.updateStep();
    });
  }

  /* 施药收尾 */
  makeGourd(r) {
    const gd = this.add.image(645, 470, 'gourd').setTint(r.color).setScale(0);
    this.tweens.add({ targets: gd, scale: 1, y: 455, duration: 420, ease: 'Back.out' });
    gd.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(gd);
    Object.assign(gd, { kind: 'gourd', home: { x: 645, y: 455 } });
    this.gourd = gd;
    this.gourdHint = this.add.image(645, 455, 'glow').setTint(0xffd040).setScale(0.6).setDepth(-1);
    this.tweens.add({ targets: this.gourdHint, scale: 0.9, alpha: 0.3, yoyo: true, repeat: -1, duration: 500 });
  }
  showPatientHi(on) {
    if (!this.ptZone) return;
    if (!this.ptHi) this.ptHi = this.add.graphics().setDepth(19);
    this.ptHi.clear();
    if (on) { const r = this.ptZone; this.ptHi.lineStyle(4, C.magenta, 1); dashedRect(this.ptHi, r.x, r.y, r.width, r.height); }
  }
  dropGourd(gd, p) {
    if (!this.ptZone.contains(p.x, p.y)) { this.back(gd); return; }
    SFX.drop(); gd.disableInteractive(); this.gourdHint.destroy();
    this.tweens.add({ targets: gd, x: this.pt.x, y: this.pt.y + 30, scale: 0.2, alpha: 0, duration: 400, onComplete: () => gd.destroy() });
    this.tweens.add({ targets: this.pt, scale: this.pt.scale * 1.06, yoyo: true, repeat: 1, duration: 200 });
    sparkle(this, this.pt.x, this.pt.y, C.green, 16);
    if (this.mode === 'tiger') { this.phase = 'pin'; this.time.delayedCall(600, () => this.showPin()); }
    else { this.phase = 'eyes'; this.time.delayedCall(600, () => this.showDropper()); }
    this.updateStep();
  }
  showPin() {
    if (this.redMark) this.redMark.destroy();
    toast(this, '药力化开，老虎张开了嘴——喉中露出一支发簪！', { y: 330 });
    const pin = this.add.image(this.pt.x + 10, 232, 'hairpin').setScale(1.05).setAngle(-12).setDepth(25);
    pin.setInteractive({ draggable: true, useHandCursor: true }); this.input.setDraggable(pin);
    Object.assign(pin, { kind: 'pin', home: { x: pin.x, y: pin.y } });
    const ring = this.add.circle(pin.x, pin.y, 34).setStrokeStyle(4, C.yellow).setDepth(24);
    this.tweens.add({ targets: ring, scale: 1.4, alpha: 0, repeat: -1, duration: 800 });
    pin.ring = ring;
    pin.on('pointerup', () => { if (!pin.dragging && !pin.out) this.pullPin(pin); });
  }
  dropPin(pin, p) {
    if (Phaser.Math.Distance.Between(pin.x, pin.y, pin.home.x, pin.home.y) > 60) this.pullPin(pin);
    else this.back(pin);
  }
  pullPin(pin) {
    if (pin.out) return; pin.out = true;
    pin.disableInteractive(); pin.ring.destroy(); SFX.ok();
    this.tweens.add({ targets: pin, x: 820, y: 190, angle: 20, scale: 1, duration: 600, ease: 'Cubic.out' });
    sparkle(this, this.pt.x, 232, C.yellow, 20);
    G.healedTiger = true; this.phase = 'done'; this.updateStep();
    const lines = this.fromForage
      ? [{ who: 'tiger', text: '呼——舒服多了！原来是支发簪。小友，这份恩情，白额虎记下了！' },
         { who: 'wu', text: '好身手。歇口气，我们继续赶路——前面的路上，好像还有人在等我们。' }]
      : [{ who: 'tiger', text: '呼——舒服多了！原来是这支发簪卡住了喉咙。多谢小学徒！' },
         { who: 'wu', text: '做得好。青龙还等着呢，接着为它医眼吧。' }];
    const dest = this.fromForage ? ['Forage'] : ['Medicine', { mode: 'dragon' }];
    this.time.delayedCall(900, () => dialog(this, lines, () => goTo(this, dest[0], dest[1])));
  }
  showDropper() {
    this.tweens.add({ targets: this.pt, scale: 330 / this.pt.height, x: 520, y: 210, duration: 500, ease: 'Cubic.out',
      onUpdate: () => this.eyes.forEach(e => { const s = this.pt.scale; e.x = this.pt.x + (e.local.ex - this.pt.width / 2) * s; e.y = this.pt.y + (e.local.ey - this.pt.height / 2) * s; }),
      onComplete: () => this.eyes.forEach(e => { e.setRadius(14); e.setInteractive(new Phaser.Geom.Circle(14, 14, 24), Phaser.Geom.Circle.Contains); e.input.cursor = 'pointer'; e.on('pointerup', () => this.dropEye(e)); }) });
    this.dropper = this.add.image(820, 200, 'dropper').setDepth(40).setAngle(20);
    this.tweens.add({ targets: this.dropper, y: 190, yoyo: true, repeat: -1, duration: 600 });
    toast(this, '点眼笔已备好：依次点击青龙的两只眼睛', { y: 330 });
    this.eyesDone = 0;
  }
  dropEye(e) {
    if (e.healed) return; e.healed = true; e.disableInteractive();
    this.tweens.killTweensOf(this.dropper);
    this.tweens.add({ targets: this.dropper, x: e.x + 8, y: e.y - 56, angle: 0, duration: 220, yoyo: false, onComplete: () => {
      const d = this.add.circle(e.x, e.y - 20, 5, C.cyan).setDepth(45);
      this.tweens.add({ targets: d, y: e.y, duration: 200, onComplete: () => d.destroy() });
    } });
    this.tweens.killTweensOf(e);
    this.time.delayedCall(420, () => {
      SFX.light(); e.setFillStyle(C.cyan, 0.0).setStrokeStyle(3, C.green); e.setScale(1);
      sparkle(this, e.x, e.y, C.cyan, 10);
      this.tweens.add({ targets: e, alpha: 0, duration: 800, delay: 400 });
      this.eyesDone++; this.updateStep();
      if (this.eyesDone === 2) {
        G.healedDragon = true; this.phase = 'done';
        this.tweens.add({ targets: this.dropper, alpha: 0, duration: 300 });
        this.tweens.add({ targets: this.pt, scale: 200 / this.pt.height, x: 505, y: 188, duration: 600, delay: 500, ease: 'Cubic.inOut' });
        if (this.fromForage) {
          this.time.delayedCall(700, () => dialog(this, [
            { who: 'dragon', text: '我看见了！山是青的，云是白的，你的脸也是亮堂的。多谢你，小学徒！' },
            { who: 'tiger', text: '龙兄的恩了了，咱们的药还没采齐——走，回山路上去！' }
          ], () => goTo(this, 'Forage')));
        } else {
          this.time.delayedCall(700, () => dialog(this, [
            { who: 'dragon', text: '我看见了！天是蓝的，师父的胡子是黑的。多谢你！' },
            { who: 'tiger', text: '我们龙虎欠你一份情。跟我们来，山下有件要紧事……' }
          ], () => {
            this.updateStep();
            button(this, 645, 560, '进入剧情 ▸', () => goTo(this, 'Story', { id: 'A' }), { w: 220, h: 60, size: 24 }).setDepth(1100);
          }));
        }
      }
    });
  }

  /* 目标与步骤 */
  updateStep() {
    const H_ = this.hud;
    if (this.mode === 'effects') {
      const done = G.effectsDone.size;
      if (G.effectsDone.has(this.fxCurrent)) H_.setObjective('换一张竹简药单，接着制药');
      else if (this.fxPhase === 'select') H_.setObjective('照药单拖四味药入捣药罐，捣泥煎煮');
      else if (this.fxPhase === 'grinding') H_.setObjective('捣药中……');
      else if (this.fxPhase === 'mud') H_.setObjective('把药泥拖进煎药罐');
      else H_.setObjective('煎煮中……');
      H_.setStep(`已制 ${done} / 3`);
      return;
    }
    if (!G.bookOpened) { H_.setObjective('第一步：点击打开药书'); H_.setStep('药书合上时无法查方'); this.setStatus('先打开药书'); return; }
    const steps = {
      brew: ['翻到对症药方，把三味草药拖进药罐', '配满三味后自动判定'],
      deliver: [this.mode === 'tiger' ? '把药葫芦拖给老虎' : '把药葫芦拖给青龙', '成药已制好'],
      pin: ['点击或拖出老虎喉中的发簪', '取出异物'],
      eyes: [`依次点击两只龙眼（${this.eyesDone || 0}/2）`, '点眼'],
      done: [this.mode === 'tiger' ? '治虎完成！' : '医龙完成！', '完成']
    }[this.phase];
    H_.setObjective(steps[0]); H_.setStep(steps[1]);
    if (this.ptStep) this.ptStep.setText({ brew: '等待服药', deliver: '把药拖到我这儿', pin: '取出发簪', eyes: '点眼中', done: '已痊愈 ✔' }[this.phase]);
    if (this.phase === 'brew' && !this.busy && !this.pot.length) this.setStatus('配满三味药材后自动判定');
  }
}
