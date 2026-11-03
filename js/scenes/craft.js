/* 交互 2C：木匠家 · 引导式装配一盏素灯 */
class CraftScene extends Phaser.Scene {
  constructor() { super('Craft'); }
  create() {
    fadeIn(this, ['bub']);
    BGM.setMode('festive');
    this.step = 0; this.frameParts = new Set(); this.busy = false;
    this.hud = hud(this, '交互 2C · 木匠家学艺', '跟着木匠，亲手扎一盏素灯');
    // 延续视频中的粉色纹样、立姿木匠与悬空制灯区。
    this.add.image(W / 2, H / 2, 'bg_pattern').setDisplaySize(W, H);
    this.carp = this.add.image(174, H + 25, 'char_elder').setOrigin(0.5, 1);
    this.carp.setScale(610 / this.carp.height);
    this.stepPanel();
    const halo = this.add.image(660, 390, 'glow').setTint(C.cream).setScale(3).setAlpha(0.18);
    this.tweens.add({ targets: halo, alpha: 0.28, duration: 2200, yoyo: true, repeat: -1 });
    T(this, 660, 124, '一篾一纸，扎起一盏光', 24, '#fff8d0', { bold: true });
    this.LX = 660; this.LY = 400;
    this.lampG = this.add.graphics();
    this.guideG = this.add.graphics();
    this.drawLamp();
    // 材料托盘
    panel(this, 970, 96, 346, 600, { fill: C.cream, alpha: 0.90, stroke: C.magenta, lw: 3 });
    T(this, 1143, 126, '材 料 托 盘', 20, '#9a0078', { bold: true });
    const parts = [
      { id: 'ring', key: 'part_ring', name: '竹篾圈架', step: 0, sc: 0.8 },
      { id: 'ribs', key: 'part_ribs', name: '竹篾竖骨', step: 0, sc: 0.45 },
      { id: 'paper', key: 'part_paper', name: '素白棉纸', step: 1, sc: 0.7 },
      { id: 'wick', key: 'part_wick', name: '灯芯', step: 2, sc: 1 },
      { id: 'oil', key: 'part_oil', name: '油壶', step: 3, sc: 0.85 }
    ];
    this.parts = {};
    parts.forEach((p, i) => {
      const x = i < 4 ? 1060 + (i % 2) * 168 : 1143, y = i < 4 ? 220 + Math.floor(i / 2) * 170 : 560;
      const bg = this.add.graphics(); bg.fillStyle(0xffffff, 0.48); bg.fillRoundedRect(x - 72, y - 66, 144, 136, 14);
      const c = this.add.container(x, y);
      const im = this.add.image(0, -10, p.key).setScale(p.sc);
      const nm = T(this, 0, 50, p.name, 17, '#2a1030', { bold: true });
      c.add([im, nm]); c.setSize(140, 130);
      c.setInteractive({ draggable: true, useHandCursor: true }); this.input.setDraggable(c);
      Object.assign(c, { p, home: { x, y }, im, bg });
      this.parts[p.id] = c;
    });
    this.input.on('dragstart', (ptr, o) => { o.setDepth(1000); this.tweens.add({ targets: o, scale: 1.08, duration: 80 }); this.drawGuide(true); });
    this.input.on('drag', (ptr, o, x, y) => { o.x = x; o.y = y; });
    this.input.on('dragend', (ptr, o) => { this.drawGuide(false); this.dropPart(o, ptr); });
    muteButton(this);
    this.refresh();
    this.time.delayedCall(400, () => dialog(this, [
      { who: 'carp', text: '扎灯是祖上传下来的手艺，不难——分四步：扎骨架、糊灯面、装灯芯、添灯油。' },
      { who: 'carp', text: '材料都在右边托盘里，拖到中间虚线的位置就行。慢一点，我做给你看。' }
    ]));
  }
  stepPanel() {
    this.stepC = this.add.container(30, 86);
    const g = this.add.graphics(); g.fillStyle(C.cream, 0.96); g.fillRoundedRect(0, 0, 330, 188, 16); g.lineStyle(4, C.magenta, 1); g.strokeRoundedRect(0, 0, 330, 188, 16);
    this.stepC.add(g);
    this.stepTexts = ['① 扎骨架：圈架 + 竖骨', '② 糊灯面：素白棉纸', '③ 装灯芯：放进灯内底部', '④ 添灯油：油壶倒向灯芯']
      .map((s, i) => { const t = T(this, 22, 30 + i * 42, s, 19, '#2a1030', { ox: 0 }); this.stepC.add(t); return t; });
  }
  refresh() {
    this.stepTexts.forEach((t, i) => {
      t.setColor(i < this.step ? '#118a5a' : (i === this.step ? '#e8007a' : '#8a8a96'));
      t.setFontStyle(i === this.step ? 'bold' : 'normal');
      t.setText((i < this.step ? '✔ ' : '') + t.text.replace('✔ ', ''));
    });
    const obj = ['把竹篾圈架和竖骨拖到虚线轮廓上', '把素白棉纸拖到灯框上', '把灯芯拖进灯内底部的虚线框', '把油壶拖到灯芯上，添上灯油', '素灯做好了！'][this.step];
    this.hud.setObjective(obj); this.hud.setStep(`步骤 ${Math.min(this.step + 1, 4)} / 4`);
    this.drawGuide(false);
  }
  drawLamp() {
    const g = this.lampG, x = this.LX, y = this.LY; g.clear();
    const fp = this.frameParts;
    if (this.step >= 2) {
      g.fillStyle(0x000000, 0.12); g.fillEllipse(x + 8, y + 10, 230, 270);
      g.fillStyle(0xffffff, 1); g.fillEllipse(x, y, 230, 270);
      g.lineStyle(3, 0xbfae8e, 1); g.strokeEllipse(x, y, 230, 270);
      g.lineStyle(2, 0xe4dccb, 1); g.strokeEllipse(x, y, 230, 270); g.strokeEllipse(x, y, 140, 270); g.strokeEllipse(x, y, 50, 270);
    }
    if (fp.has('ribs')) {
      g.lineStyle(this.step >= 2 ? 2 : 6, C.green, this.step >= 2 ? 0.35 : 1);
      [230, 140, 50].forEach(w => g.strokeEllipse(x, y, w, 270));
    }
    if (fp.has('ring')) {
      g.lineStyle(8, 0x39b99e, 1); g.strokeEllipse(x, y - 128, 120, 20); g.strokeEllipse(x, y + 128, 120, 20);
      g.fillStyle(C.red, 1); g.fillRoundedRect(x - 60, y - 150, 120, 18, 5); g.fillRoundedRect(x - 60, y + 132, 120, 18, 5);
      g.lineStyle(3, 0x7a3a10, 1); g.lineBetween(x, y - 150, x, y - 190);
    }
    if (this.step >= 3) { g.fillStyle(0x7a3a10, 1); g.fillEllipse(x, y + 100, 60, 18); g.fillStyle(0xe8d8b0, 1); g.fillRect(x - 4, y + 66, 8, 34); g.lineStyle(2, 0x7a3a10, 1); g.strokeRect(x - 4, y + 66, 8, 34); g.fillStyle(C.ink, 1); g.fillRect(x - 4, y + 60, 8, 7); }
    if (this.step >= 4) { g.fillStyle(C.orange, 0.85); g.fillEllipse(x, y + 100, 52, 12); }
  }
  zoneFor(step) {
    const x = this.LX, y = this.LY;
    if (step === 2) return new Phaser.Geom.Rectangle(x - 60, y + 50, 120, 80);
    if (step === 3) return new Phaser.Geom.Rectangle(x - 80, y + 30, 160, 110);
    return new Phaser.Geom.Rectangle(x - 140, y - 200, 280, 400);
  }
  drawGuide(active) {
    const g = this.guideG, x = this.LX, y = this.LY; g.clear();
    if (this.step > 3) return;
    g.lineStyle(active ? 4 : 3, active ? C.blue : C.magenta, 1);
    if (this.step === 0) {
      if (!this.frameParts.has('ring')) { dashedRect(g, x - 62, y - 140, 124, 24, 8, 6); dashedRect(g, x - 62, y + 116, 124, 24, 8, 6); }
      if (!this.frameParts.has('ribs')) { for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2, a2 = (k + 0.5) / 18 * Math.PI * 2; g.lineBetween(x + Math.cos(a) * 115, y + Math.sin(a) * 135, x + Math.cos(a2) * 115, y + Math.sin(a2) * 135); } }
    } else if (this.step === 1) { for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, a2 = (k + 0.5) / 24 * Math.PI * 2; g.lineBetween(x + Math.cos(a) * 122, y + Math.sin(a) * 142, x + Math.cos(a2) * 122, y + Math.sin(a2) * 142); } }
    else { const r = this.zoneFor(this.step); dashedRect(g, r.x, r.y, r.width, r.height); }
    if (active) { g.fillStyle(C.cyan, 0.1); const r = this.zoneFor(this.step); g.fillRect(r.x, r.y, r.width, r.height); }
  }
  back(o) { this.tweens.killTweensOf(o); this.tweens.add({ targets: o, x: o.home.x, y: o.home.y, scale: 1, duration: 260, ease: 'Back.out', onComplete: () => o.setDepth(0) }); }
  say(text) {
    if (this.bub) this.bub.destroy();
    this.bub = bubble(this, 236, 360, text, { w: 250, edge: C.blue });
    const b = this.bub; this.time.delayedCall(3000, () => b.active && b.destroy());
  }
  dropPart(o, ptr) {
    const p = o.p;
    const zone = this.zoneFor(this.step);
    const hit = zone.contains(ptr.x, ptr.y) || zone.contains(o.x, o.y);
    if (this.busy || this.dlgOpen()) return this.back(o);
    if (p.step !== this.step) {
      if (hit || this.zoneFor(0).contains(ptr.x, ptr.y)) {
        SFX.bad();
        this.say(p.step < this.step ? '这一步已经做好啦。' : ['先扎骨架：把圈架和竖骨放上去。', '现在该糊灯面了，拿素白棉纸。', '现在装灯芯，放进灯内底部。', '最后添灯油。'][this.step]);
      }
      return this.back(o);
    }
    if (!hit) { if (this.step >= 2) this.say(this.step === 2 ? '灯芯要装在灯内底部的虚线框里。' : '把油壶对准灯芯再松手。'); return this.back(o); }
    SFX.drop();
    this.tweens.killTweensOf(o);
    o.disableInteractive();
    this.tweens.add({ targets: o, x: this.LX, y: this.step === 3 ? this.LY + 40 : this.LY, scale: 0.6, alpha: this.step === 3 ? 1 : 0, duration: 260, onComplete: () => {
      if (this.step === 3) return this.pourOil(o);
      o.setVisible(false); o.bg.setAlpha(0.35);
      if (this.step === 0) {
        this.frameParts.add(p.id);
        this.drawLamp(); sparkle(this, this.LX, this.LY, C.green, 10);
        if (this.frameParts.size === 2) this.next('骨架扎好了，圈架和竖骨撑起了灯框。');
        else { this.drawGuide(false); this.say(p.id === 'ring' ? '圈架就位，再把竖骨放上去。' : '竖骨就位，再把圈架放上去。'); }
      } else this.next(this.step === 1 ? '灯面糊好了，一盏白灯有模样了。' : '灯芯装好了，最后添灯油。');
    } });
  }
  pourOil(o) {
    this.busy = true;
    this.tweens.add({ targets: o, angle: -50, duration: 400, onComplete: () => {
      for (let i = 0; i < 8; i++) { const d = this.add.circle(this.LX + 30, this.LY + 50, 4, C.orange).setDepth(1001); this.tweens.add({ targets: d, x: this.LX + 2, y: this.LY + 98, duration: 300, delay: i * 90, onComplete: () => d.destroy() }); }
      this.time.delayedCall(1000, () => { this.tweens.add({ targets: o, alpha: 0, duration: 300 }); o.bg.setAlpha(0.35); this.busy = false; this.next('灯油添好了——这就是一盏能用的素灯！'); });
    } });
  }
  next(msg) {
    this.step++; SFX.ok(); this.drawLamp(); this.refresh(); this.say(msg);
    if (this.step === 4) {
      G.lampCrafted = true;
      sparkle(this, this.LX, this.LY, C.yellow, 30);
      this.time.delayedCall(1600, () => dialog(this, [
        { who: 'carp', text: '好手艺！灯面先留白——等这一夜过去，再画上龙虎，题上心愿。' },
        { who: 'carp', text: '乡亲们！照着这盏灯扎起来，家家门前都挂一盏！' }
      ], () => goTo(this, 'Story', { id: 'C' })));
    }
  }
  dlgOpen() { return this.children.list.some(o => o.depth === 1200); }
}
