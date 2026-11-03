/* 交互 1A / 1B / 2B：药房制药（配置驱动：tiger | dragon | effects） */
class MedicineScene extends Phaser.Scene {
  constructor() { super('Medicine'); }
  init(data) { this.mode = data.mode || 'tiger'; }

  create() {
    fadeIn(this, ['ptHi', 'ptZone', 'pt', 'hiTween', 'flipping', 'gourd', 'gourdHint', 'eyes', 'eyesDone', 'redMark', 'dropper', 'closedBook', 'focusTask', 'taskCards', 'book', 'pageC']);
    this.add.image(W / 2, H / 2, 'bg_pharmacy').setDisplaySize(W, H);
    const titles = {
      tiger: ['交互 1A · 治虎', '查阅药书，为老虎配制治喉的药'],
      dragon: ['交互 1B · 医龙', '查阅药书，为青龙配制明目的药'],
      effects: ['交互 2B · 功效制药', '按龙虎的功效提示，备齐三种药（顺序不限）']
    };
    this.hud = hud(this, ...titles[this.mode]);
    this.pot = []; this.busy = false; this.phase = 'brew';
    this.streakKey = this.mode;
    G.errorStreak[this.streakKey] = G.errorStreak[this.streakKey] || 0;

    this.buildBackpack();
    this.buildPot();
    this.buildBook();
    if (this.mode === 'effects') this.buildTasks(); else this.buildPatient();
    this.bindDrag();
    muteButton(this);
    this.updateStep();

    const intro = {
      tiger: [{ who: 'tiger', text: '嗷……喉咙里卡着东西，咽也咽不下去……' },
              { who: 'wu', text: '药书里有治“喉中鲠物”的方子。先打开药书，再把方中的草药一味味拖进药罐。' }],
      dragon: [{ who: 'dragon', text: '我眼前一片模糊，连师父的脸都看不清了……' },
               { who: 'wu', text: '翻翻药书，找到明目的方子。这回的配方和治虎的不一样。' }],
      effects: [{ who: 'tiger', text: '村里的病人，有的发热、有的咳嗽、有的呕吐腹胀。' },
                { who: 'dragon', text: '三种药都要备好，先做哪一种都行。药材是从药草摊买来的，配错了也不会少。' }]
    }[this.mode];
    this.time.delayedCall(450, () => dialog(this, intro, () => {
      if (!G.bookOpened) this.hud.setObjective('第一步：点击打开药书');
    }));
  }

  /* ---------------- 背包 ---------------- */
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

  /* ---------------- 药罐 ---------------- */
  buildPot() {
    this.add.image(468, 690, 'fan').setScale(0.42).setAngle(-12);
    this.fan = this.children.list[this.children.list.length - 1];
    this.add.image(826, 692, 'mortar').setScale(0.36);
    this.stove = this.add.image(645, 738, 'stove').setOrigin(0.5, 1).setScale(330 / 818);
    this.liquid = this.add.ellipse(645, 520, 92, 20, 0xffe62a, 0).setDepth(5);
    this.potZone = new Phaser.Geom.Rectangle(520, 300, 250, 440);
    this.potHi = this.add.graphics().setDepth(4);
    const n = this.mode === 'effects' ? 4 : 3;
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

  /* ---------------- 药书 ---------------- */
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
    // 翻页热区
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
    // 方名
    c.add(VT(this, (colX(0) + colX(1)) / 2, top, R.name, 30, '#1a0a30', { oy: 0, bold: true, ls: -2 }));
    // 用途标签
    const tag = this.add.graphics(); tag.fillStyle(C.magenta, 1); tag.fillRoundedRect(colX(2) - 12, top - 2, 24, 70, 6); c.add(tag);
    c.add(VT(this, colX(2), top + 4, R.tag, 19, '#fff8d0', { oy: 0, bold: true }));
    // 主治
    c.add(VT(this, colX(3), top + 86, '主治', 16, '#9a0078', { oy: 0, bold: true }));
    c.add(VT(this, colX(3), top + 136, R.desc[0], 20, '#1a0a30', { oy: 0 }));
    c.add(VT(this, colX(4), top + 136, R.desc[1], 20, '#1a0a30', { oy: 0 }));
    c.add(VT(this, colX(5), top, '配方', 16, '#9a0078', { oy: 0, bold: true }));
    // 药材：每味占两片竹简
    R.herbs.forEach((id, k) => {
      const x = (colX(6 + 2 * k) + colX(7 + 2 * k)) / 2;
      const r = R.herbs.length > 3 ? 21 : 25;
      const bg = this.add.graphics(); bg.fillStyle(C.cream, 1); bg.fillCircle(x, top + 30, r); bg.lineStyle(2, C.magenta, 1); bg.strokeCircle(x, top + 30, r);
      const im = this.add.image(x, top + 30, 'plant_' + id); im.setScale((r * 2 - 6) / Math.max(im.width, im.height));
      c.add([bg, im, VT(this, x, top + 66, HERB[id].name, 24, '#1a0a30', { oy: 0, bold: true })]);
    });
    // 落款印章
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
    // 正向：右页翻起越过中缝落到左侧；反向相反
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

  /* ---------------- 患者（交互 1） ---------------- */
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

  /* ---------------- 功效任务（交互 2B） ---------------- */
  buildTasks() {
    this.taskCards = {};
    EFFECT_TASKS.forEach((tk, i) => {
      const x = 455 + i * 190, y = 140;
      const c = this.add.container(x, y);
      const g = this.add.graphics();
      const head = this.add.image(-64, -26, WHO[tk.who].head); head.setScale(40 / head.height);
      const t1 = T(this, 18, -26, tk.short, 20, '#9a0078', { bold: true });
      const t2 = T(this, 0, 14, tk.hint.replace(/。$/, ''), 14, '#2a1030', { sans: true, wrap: 164, align: 'center' });
      const st = T(this, 0, 52, '未完成', 14, '#6a6a7a', { sans: true });
      c.add([g, head, t1, t2, st]);
      c.setSize(176, 128); c.setInteractive({ useHandCursor: true });
      Object.assign(c, { g, st, tk, done: G.effectsDone.has(tk.id) });
      c.on('pointerup', () => { this.focusTask = tk.id; this.drawTasks(); SFX.click();
        toast(this, (tk.who === 'tiger' ? '白额虎：' : '青龙：') + '“' + tk.hint + '”', { y: 330, ms: 2200 }); });
      this.taskCards[tk.id] = c;
    });
    // 成药展示架
    const g = this.add.graphics();
    g.fillStyle(0x7a3a10, 1); g.fillRoundedRect(380, 268, 530, 12, 6);
    g.fillStyle(0xb06a2a, 1); g.fillRect(400, 280, 10, 22); g.fillRect(880, 280, 10, 22);
    T(this, 388, 246, '成药架', 15, '#7a3a10', { bold: true, ox: 0 });
    this.shelf = [];
    this.drawTasks();
    [...G.effectsDone].forEach(id => this.addToShelf(id, true));
  }
  drawTasks() {
    Object.values(this.taskCards).forEach(c => {
      const done = G.effectsDone.has(c.tk.id), foc = this.focusTask === c.tk.id;
      c.g.clear();
      c.g.fillStyle(done ? 0xd8f5e0 : C.cream, 1); c.g.fillRoundedRect(-88, -64, 176, 128, 14);
      c.g.lineStyle(foc ? 6 : 3, done ? C.green : (foc ? C.blue : C.magenta), 1); c.g.strokeRoundedRect(-88, -64, 176, 128, 14);
      c.st.setText(done ? '✔ 已备好 · ' + RECIPE[c.tk.id].name : (foc ? '◎ 正在关注' : '○ 未完成'));
      c.st.setColor(done ? '#118a5a' : (foc ? '#004dfc' : '#6a6a7a'));
    });
  }
  addToShelf(id, instant) {
    const i = EFFECT_TASKS.findIndex(t => t.id === id);
    const x = 470 + i * 175, y = 244;
    const gd = this.add.image(instant ? x : 645, instant ? y : 470, 'gourd').setScale(0.48).setTint(RECIPE[id].color);
    const lb = T(this, x, y + 50, RECIPE[id].name, 14, '#2a1030', { bold: true }).setAlpha(instant ? 1 : 0);
    if (!instant) this.tweens.add({ targets: gd, x, y, duration: 700, ease: 'Quad.inOut', onComplete: () => { lb.setAlpha(1); sparkle(this, x, y, C.green, 10); } });
  }

  /* ---------------- 拖拽 ---------------- */
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
    if (this.mode === 'effects') {
      const r = RECIPES.find(r => r.id[0] === 'E' && this.sameSet(pot, r.herbs));
      if (r && G.effectsDone.has(r.id)) return this.fail(`${r.name}已经备好了，这种药不用再做`, false);
      if (r) return this.success(r);
      return this.fail('这份配方与待制药物不符，再看看药书');
    }
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
        dragon: '提示：找写着“双目昏花”的那一页，材料和治虎的不一样。',
        effects: '提示：发热看“发热头痛”、咳嗽看“咳嗽气喘”、呕吐看“呕吐腹胀”。' }[this.mode];
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
      if (this.mode === 'effects') {
        G.effectsDone.add(r.id); G.prepared.push(r.id);
        this.addToShelf(r.id, false); this.drawTasks();
        toast(this, `${r.name}制成！已自动放上成药架`, { y: 330 });
        this.setStatus('');
        this.busy = false; this.updateStep();
        if (G.effectsDone.size === EFFECT_TASKS.length) {
          this.busy = true;
          this.time.delayedCall(1400, () => dialog(this, [{ who: 'tiger', text: '三种药都备好了！村里病得最重的是木匠，我们快去！' }], () => goTo(this, 'Story', { id: 'B' })));
        }
        return;
      }
      this.phase = 'deliver'; this.busy = false;
      this.makeGourd(r);
      this.setStatus(`${r.name}制成！`);
      this.updateStep();
    });
  }

  /* ---------------- 施药收尾 ---------------- */
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
    this.time.delayedCall(900, () => dialog(this, [
      { who: 'tiger', text: '呼——舒服多了！原来是这支发簪卡住了喉咙。多谢小学徒！' },
      { who: 'wu', text: '做得好。青龙还等着呢，接着为它医眼吧。' }
    ], () => goTo(this, 'Medicine', { mode: 'dragon' })));
  }
  showDropper() {
    // 点眼时拉近龙首
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
        this.time.delayedCall(700, () => dialog(this, [
          { who: 'dragon', text: '我看见了！天是蓝的，师父的胡子是黑的。多谢你！' },
          { who: 'tiger', text: '我们龙虎欠你一份情。跟我们来，山下有件要紧事……' }
        ], () => {
          this.updateStep();
          button(this, 645, 560, '进入剧情 ▸', () => goTo(this, 'Story', { id: 'A' }), { w: 220, h: 60, size: 24 }).setDepth(1100);
        }));
      }
    });
  }

  /* ---------------- 目标与步骤 ---------------- */
  updateStep() {
    const H_ = this.hud;
    if (!G.bookOpened) { H_.setObjective('第一步：点击打开药书'); H_.setStep('药书合上时无法查方'); this.setStatus('先打开药书'); return; }
    if (this.mode === 'effects') {
      const left = EFFECT_TASKS.filter(t => !G.effectsDone.has(t.id)).length;
      H_.setObjective(left ? '翻书比对功效，拖药入罐，配齐 4 味自动成药' : '三种药都备好了');
      H_.setStep(`已完成 ${EFFECT_TASKS.length - left} / ${EFFECT_TASKS.length}`);
      if (!this.busy && !this.pot.length) this.setStatus('配满四味药材后自动判定');
      return;
    }
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
