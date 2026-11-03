/* 结尾动画（可跳过）+ 完成页 */
class EndingScene extends Phaser.Scene {
  constructor() { super('Ending'); }
  create() {
    fadeIn(this, ['lock', 'auto']);
    this.shot = -1; this.layer = null;
    const top = this.add.container(0, 0).setDepth(1400);
    top.add(button(this, W - 110, 36, '跳过动画 ▸▸', () => this.toFinish(), { w: 180, h: 46, size: 18, fill: C.ink, edge: 0x000000, line: C.magenta }));
    this.cap = T(this, W / 2, H - 70, '', 26, '#fff8d0', { bold: true, wrap: 1000, align: 'center', stroke: '#2a1030', strokeThickness: 7 }).setDepth(1300);
    this.tapZone = this.add.zone(W / 2, H / 2 + 40, W, H - 80).setInteractive().setDepth(1);
    this.tapZone.on('pointerup', () => this.next());
    const b = BLESSINGS.find(b => b.id === G.blessingId) || BLESSINGS[0];
    this.shots = [
      { cap: `这是你亲手扎、亲手画的龙虎灯——“${b.text}”。`, build: s => {
          s.add.image(W / 2, H / 2, 'bg_pattern').setDisplaySize(W, H);
          const l = drawFinalLamp(s, W / 2, 340, 1.05, { lit: true, glow: true }); l.setScale(0.6); s.tweens.add({ targets: l, scale: 1, duration: 1800, ease: 'Cubic.out' });
          s.tweens.add({ targets: l, angle: { from: -2, to: 2 }, yoyo: true, repeat: -1, duration: 1500 });
        } },
      { cap: '村民们把各自画好的龙虎灯挂在门前，灯火连成一片。', build: s => {
          s.add.image(W / 2, H / 2, 'bg_village').setDisplaySize(W, H);
          const dusk = s.add.image(W / 2, H / 2, 'bg_village_night').setDisplaySize(W, H).setAlpha(0); s.tweens.add({ targets: dusk, alpha: 0.9, duration: 1500 });
          const spots = VILLAGE_LAMPS.concat([{ x: 220, y: 300 }, { x: 980, y: 260 }, { x: 1080, y: 420 }, { x: 700, y: 560 }, { x: 330, y: 520 }]);
          spots.forEach((p, i) => s.time.delayedCall(500 + i * 220, () => {
            s.add.image(p.x, p.y, 'glow').setTint(0xffc040).setBlendMode(Phaser.BlendModes.ADD).setScale(0.9);
            const l = drawFinalLamp(s, p.x, p.y, 0.16, { lit: true, blessing: false }); l.setScale(0); s.tweens.add({ targets: l, scale: 1, duration: 400, ease: 'Back.out' }); SFX.light();
          }));
        } },
      { cap: '送王船出海，把瘟疫与灾厄一并送走。', build: s => {
          const g = s.add.graphics(); g.fillStyle(0xff9cd4, 1); g.fillRect(0, 0, W, H); g.fillStyle(0xffb030, 1); g.fillCircle(W - 260, 230, 110);
          g.fillStyle(C.blue, 1); g.fillRect(0, 430, W, H - 430);
          g.fillStyle(C.cyan, 1); for (let y = 450; y < H; y += 40) for (let x = (y / 40 % 2) * 40; x < W + 80; x += 80) { g.fillCircle(x, y, 26); }
          g.fillStyle(C.blue, 1); for (let y = 470; y < H; y += 40) for (let x = (y / 40 % 2) * 40; x < W + 80; x += 80) { g.fillCircle(x, y, 20); }
          const boat = s.add.image(-200, 420, 'boat').setScale(1.1); s.tweens.add({ targets: boat, x: W + 220, duration: 7000, ease: 'Sine.inOut' });
          s.tweens.add({ targets: boat, angle: { from: -3, to: 3 }, y: 428, yoyo: true, repeat: -1, duration: 900 });
          for (let i = 0; i < 4; i++) { const gh = s.add.image(-140 - i * 60, 330 - i * 20, 'ghost').setScale(0.26).setAlpha(0.9); s.tweens.add({ targets: gh, x: W + 160, duration: 7200, delay: 150, ease: 'Sine.inOut' }); }
        } },
      { cap: '医者仁心，龙虎相护，邻里同心——这盏灯的光，岁岁年年传下去。', build: s => {
          s.add.image(W / 2, H / 2, 'bg_pattern').setDisplaySize(W, H);
          actor(s, 'char_dragon', 230, H + 40, 600, 'left'); actor(s, 'char_baosheng', W / 2, H + 10, 520, 'up', 300); actor(s, 'char_tiger', W - 230, H + 40, 600, 'right');
          const l = drawFinalLamp(s, W / 2, 210, 0.42, { lit: true, glow: true });
          s.tweens.add({ targets: l, y: 200, yoyo: true, repeat: -1, duration: 1400 });
        } }
    ];
    muteButton(this);
    this.director = shotDirector(this);
    this.next();
  }
  next() {
    if (this.lock || this._leaving) return;
    this.lock = true;
    this.shot++;
    if (this.shot >= this.shots.length) return this.toFinish();
    const S = this.shots[this.shot];
    this.cap.setAlpha(0);
    this.director.cut(() => S.build(this), () => {
      this.lock = false;
      this.cap.setText(S.cap); this.tweens.add({ targets: this.cap, alpha: 1, duration: 500 });
      this.time.delayedCall(this.shot === 2 ? 7000 : 5200, () => this.next());
    });
  }
  toFinish() { goTo(this, 'Finish'); }
}

class FinishScene extends Phaser.Scene {
  constructor() { super('Finish'); }
  create() {
    fadeIn(this);
    this.add.image(W / 2, H / 2, 'bg_pattern').setDisplaySize(W, H);
    panel(this, 120, 70, W - 240, 610, { fill: C.blue, stroke: C.yellow, lw: 6, r: 30 });
    drawFinalLamp(this, 420, 380, 0.82, { lit: true, glow: true });
    T(this, 880, 170, '龙 虎 灯 · 完 成', 44, '#fbf5a2', { bold: true, stroke: '#ff00c8', strokeThickness: 8 });
    const b = BLESSINGS.find(b => b.id === G.blessingId);
    T(this, 880, 250, `你的吉语：“${b ? b.text : '—'}”`, 24, '#ffffff');
    T(this, 880, 330, '治虎取簪 · 医龙点眼 · 市集采购 · 功效制药\n救治木匠 · 扎制素灯 · 守灯到天明 · 画龙虎题吉语', 18, '#cfe0ff', { sans: true, align: 'center', lineSpacing: 10 });
    T(this, 880, 410, '游戏中的药方仅为互动内容，不作现实用药建议。', 14, '#ffd0ee', { sans: true });
    button(this, 760, 500, '重看结尾', () => goTo(this, 'Ending'), { w: 200, h: 60, size: 22, fill: C.green, edge: 0x118a5a });
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
