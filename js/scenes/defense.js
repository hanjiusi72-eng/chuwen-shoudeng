/* 交互 3：守灯 · 引路灯 / 疫鬼路径 / 长按救灯 / 随机鼓点 / 龙雨净化 */
const GHOST_PATHS = [
  [[-40, 345], [150, 415], [330, 408], [470, 345], [640, 315], [760, 330], [900, 365], [1100, 352], [1380, 345]],
  [[935, -40], [900, 90], [760, 190], [612, 246], [470, 318], [300, 332], [150, 420], [-40, 352]],
  [[660, 800], [640, 600], [590, 505], [700, 468], [842, 518], [1000, 452], [1380, 348]],
  [[1380, 345], [1080, 322], [890, 278], [742, 270], [600, 222], [420, 175], [260, 120], [120, -40]]
];
const DRUM_SPOTS = [{ x: 228, y: 398 }, { x: 470, y: 268 }, { x: 905, y: 330 }, { x: 430, y: 470 }, { x: 990, y: 520 }];

class DefenseScene extends Phaser.Scene {
  constructor() { super('Defense'); }
  create() {
    fadeIn(this, ['ov', 'tut', 'markTw', 'rainDrag', 'drum', 'fog']);
    this.add.image(W / 2, H / 2, 'bg_village_night').setDisplaySize(W, H);
    this.hud = hud(this, '交互 3 · 守灯', '守到天明：保护全村户灯');
    this.dawnG = this.add.graphics().setDepth(901);
    this.fx = this.add.container(0, 0).setDepth(300);
    this.buildLamps();
    this.buildGuide();
    this.buildRain();
    this.ghosts = []; this.drum = null; this.fog = null;
    this.mode = 'idle';
    this.setupInput();
    muteButton(this);
    this.resetNight();
    if (!G.tutorialSeen) this.startTutorial();
    else this.showStartPanel('守夜开始前', '准备好了就开始守夜（60 秒）。');
  }

  /* ---------- 构建 ---------- */
  buildLamps() {
    this.lamps = VILLAGE_LAMPS.map((p, i) => {
      const L = { i, x: p.x, y: p.y };
      L.glow = this.add.image(p.x, p.y, 'glow').setTint(0xffc030).setBlendMode(Phaser.BlendModes.ADD).setScale(0.95).setDepth(10);
      L.g = this.add.graphics().setDepth(20);
      L.icon = this.add.image(p.x, p.y - 2, 'lantern_lit').setScale(0.3).setDepth(21);
      L.label = T(this, p.x, p.y + 46, '', 14, '#ffffff', { sans: true, bold: true, stroke: '#14164a', strokeThickness: 4 }).setDepth(30);
      L.zone = this.add.zone(p.x, p.y, 76, 76).setInteractive({ useHandCursor: true }).setDepth(23);
      L.zone.on('pointerdown', ptr => this.lampDown(L, ptr));
      L.zone.on('pointerout', ptr => { if (L.holdPtr === ptr.id) this.lampRelease(L); });
      L.zone.on('pointerup', ptr => { if (L.holdPtr === ptr.id) this.lampRelease(L); });
      return L;
    });
  }
  buildGuide() {
    this.guideRing = this.add.graphics().setDepth(30);
    this.guideGlow = this.add.image(0, 0, 'glow').setTint(0xffe080).setBlendMode(Phaser.BlendModes.ADD).setScale(1.6).setAlpha(0.7).setDepth(29);
    this.guide = this.add.image(0, 0, 'guide').setDepth(400).setScale(0.8);
    this.guide.setInteractive(new Phaser.Geom.Circle(45, 66, 46), Phaser.Geom.Circle.Contains);
    this.input.setDraggable(this.guide);
    this.guide.input.cursor = 'grab';
    this.guideTag = T(this, 0, 0, '引路灯', 14, '#fbf5a2', { sans: true, bold: true, stroke: '#14164a', strokeThickness: 4 }).setDepth(401);
  }
  placeGuide(x, y) {
    this.guide.setPosition(x, y); this.guideGlow.setPosition(x, y + 10); this.guideTag.setPosition(x, y + 56);
    this.guideRing.clear(); this.guideRing.fillStyle(0xffe080, 0.12); this.guideRing.fillCircle(x, y + 10, NIGHT.guideRadius);
    this.guideRing.lineStyle(3, 0xffe080, 0.85); dashedCircle(this.guideRing, x, y + 10, NIGHT.guideRadius, 30);
  }
  buildRain() {
    const x = 92, y = 650;
    this.rainG = this.add.graphics().setDepth(500);
    this.rainIcon = this.add.image(x, y - 4, 'cloud').setScale(0.62).setDepth(501);
    this.rainHead = this.add.image(x - 36, y - 30, 'head_dragon').setDepth(502); this.rainHead.setScale(46 / this.rainHead.height);
    this.rainTxt = T(this, x, y + 50, '龙雨', 16, '#fbf5a2', { bold: true, stroke: '#14164a', strokeThickness: 4 }).setDepth(503);
    this.rainZone = this.add.zone(x, y, 120, 110).setInteractive({ useHandCursor: true }).setDepth(504);
    this.rainZone.on('pointerdown', ptr => this.rainDown(ptr));
    this.rainPos = { x, y };
    this.cloud = this.add.image(0, 0, 'cloud').setDepth(700).setVisible(false).setAlpha(0.9);
    this.cloudRing = this.add.graphics().setDepth(699);
  }
  setupInput() {
    this.input.on('dragstart', (p, o) => { if (o === this.guide) { this.guide.input.cursor = 'grabbing'; this.tweens.add({ targets: this.guide, scale: 0.9, duration: 80 }); } });
    this.input.on('drag', (p, o, x, y) => { if (o === this.guide) this.placeGuide(Phaser.Math.Clamp(x, 40, W - 40), Phaser.Math.Clamp(y, 90, H - 60)); });
    this.input.on('dragend', (p, o) => { if (o === this.guide) { this.guide.input.cursor = 'grab'; this.tweens.add({ targets: this.guide, scale: 0.8, duration: 80 }); } });
    this.input.on('pointermove', p => { if (this.rainDrag && this.rainDrag.id === p.id) this.moveCloud(p.x, p.y); });
    this.input.on('pointerup', p => { if (this.rainDrag && this.rainDrag.id === p.id) this.rainUp(p); this.lamps.forEach(L => { if (L.holdPtr === p.id) this.lampRelease(L); }); });
    this.input.on('gameout', () => { if (this.rainDrag) this.cancelRain(); this.lamps.forEach(L => L.holdPtr != null && this.lampRelease(L)); });
  }

  /* ---------- 重置一夜 ---------- */
  resetNight() {
    this.elapsed = 0; this.nextSpawn = 1.5; this.lastPath = -1;
    this.ghosts.forEach(g => g.s.destroy()); this.ghosts = [];
    if (this.drum) { this.drum.c.destroy(); this.drum = null; }
    if (this.fog) this.clearFog(true);
    this.nextDrum = this.rand(NIGHT.drumMin, NIGHT.drumMax) * (G.assist ? 0.7 : 1);
    this.nextFog = 8; this.rainCd = 0; this.lastDrum = -1;
    this.lamps.forEach(L => { L.state = 'lit'; L.outT = 0; L.hold = 0; L.holdPtr = null; });
    this.placeGuide(660, 420);
    this.cancelRain();
    this.fx.removeAll(true);
    this.drawLamps(); this.drawRain(); this.drawDawn();
  }
  rand(a, b) { return a + Math.random() * (b - a); }

  /* ---------- 户灯 ---------- */
  lampDown(L, ptr) {
    if (!this.inputOk()) return;
    if (L.state === 'out') { L.holdPtr = ptr.id; L.hold = 0; }
    else if (L.state === 'fog') { toast(this, '这盏灯被重雾笼罩：先用龙雨净化，再长按救灯', { y: 120 }); SFX.bad(); }
    else if (L.state === 'dead') toast(this, '这盏灯已彻底熄灭，本轮不可再救', { y: 120 });
  }
  lampRelease(L) { L.holdPtr = null; L.hold = 0; }
  blowOut(L, by) {
    if (L.state !== 'lit') return;
    L.state = by === 'fog' ? 'fog' : 'out'; L.outT = 0; L.hold = 0;
    SFX.blow();
    for (let k = 0; k < 6; k++) {
      const d = this.add.image(L.x, L.y, 'dot').setTint(0xd8c8ff).setAlpha(0.8).setScale(0.6).setDepth(25);
      this.tweens.add({ targets: d, x: L.x + this.rand(-50, 50), y: L.y - this.rand(20, 60), alpha: 0, scale: 1.6, duration: 500, onComplete: () => d.destroy() });
    }
  }
  relight(L) {
    L.state = 'lit'; L.outT = 0; L.hold = 0; L.holdPtr = null;
    SFX.light(); sparkle(this, L.x, L.y, C.yellow, 12, 40);
  }
  perimeter(g, x, y, s, frac, color, width) {
    if (frac <= 0) return;
    const h = s / 2, pts = [[x, y - h], [x + h, y - h], [x + h, y + h], [x - h, y + h], [x - h, y - h], [x, y - h]];
    const lens = [h, s, s, s, h]; let left = frac * 4 * s;
    g.lineStyle(width, color, 1); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < 5 && left > 0; i++) {
      const t = Math.min(1, left / lens[i]);
      g.lineTo(pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t);
      left -= lens[i];
    }
    g.strokePath();
  }
  drawLamps() {
    this.lamps.forEach(L => {
      const g = L.g, s = 60, x = L.x, y = L.y; g.clear();
      const st = L.state;
      g.fillStyle(0x000000, 0.35); g.fillRoundedRect(x - s / 2 + 3, y - s / 2 + 4, s, s, 8);
      if (st === 'lit') {
        g.fillStyle(0xffd65a, 1); g.fillRoundedRect(x - s / 2, y - s / 2, s, s, 8);
        g.lineStyle(4, 0xff9a1f, 1); g.strokeRoundedRect(x - s / 2, y - s / 2, s, s, 8);
        L.icon.setTexture('lantern_lit').clearTint().setAlpha(1); L.glow.setVisible(true);
        L.label.setText('');
      } else if (st === 'dead') {
        g.fillStyle(0x6a0010, 1); g.fillRoundedRect(x - s / 2, y - s / 2, s, s, 8);
        g.lineStyle(4, 0xb0001a, 1); g.strokeRoundedRect(x - s / 2, y - s / 2, s, s, 8);
        g.lineStyle(6, 0xffffff, 0.9); g.lineBetween(x - 16, y - 16, x + 16, y + 16); g.lineBetween(x + 16, y - 16, x - 16, y + 16);
        L.icon.setAlpha(0); L.glow.setVisible(false);
        L.label.setText('✕ 已彻底熄灭');
      } else {
        g.fillStyle(0x8a8a96, 1); g.fillRoundedRect(x - s / 2, y - s / 2, s, s, 8);
        // 黄色救灯进度（内侧，自下而上）
        if (L.hold > 0) { const f = Math.min(1, L.hold / NIGHT.rescueHold), ih = (s - 12) * f; g.fillStyle(0xffe14a, 1); g.fillRect(x - s / 2 + 6, y + s / 2 - 6 - ih, s - 12, ih); }
        g.lineStyle(5, 0x5a5a66, 1); g.strokeRoundedRect(x - s / 2, y - s / 2, s, s, 8);
        // 红色彻底熄灭进度（外缘）
        this.perimeter(g, x, y, s + 2, Math.min(1, L.outT / NIGHT.deadline), 0xff2030, 6);
        L.icon.setTexture('lantern_white').setTint(0x9090a0).setAlpha(1); L.glow.setVisible(false);
        const left = Math.max(0, Math.ceil(NIGHT.deadline - L.outT));
        L.label.setText(st === 'fog' ? `☁ 需净化 ${left}s` : (L.hold > 0 ? '继续按住…' : `长按救灯 ${left}s`));
        L.label.setColor(st === 'fog' ? '#e0b8ff' : '#ffe14a');
      }
    });
  }

  /* ---------- 疫鬼 ---------- */
  spawnGhost(pathIdx) {
    let pi = pathIdx;
    if (pi == null) { do { pi = Math.floor(Math.random() * GHOST_PATHS.length); } while (pi === this.lastPath && GHOST_PATHS.length > 1); }
    this.lastPath = pi;
    const P = GHOST_PATHS[pi];
    const s = this.add.image(P[0][0], P[0][1], 'ghost').setDepth(200).setScale(0.3);
    const gh = { s, P, seg: 0, t: 0, blown: new Set(), speed: NIGHT.ghostSpeed * (1 + this.elapsed / NIGHT.duration * 0.35) * (G.assist ? 0.85 : 1), wob: Math.random() * 6 };
    this.ghosts.push(gh);
    return gh;
  }
  dispel(gh, fromX, fromY) {
    if (gh.dead) return; gh.dead = true;
    const a = Math.atan2(gh.s.y - fromY, gh.s.x - fromX);
    this.tweens.add({ targets: gh.s, x: gh.s.x + Math.cos(a) * 90, y: gh.s.y + Math.sin(a) * 90, alpha: 0, angle: 30, scale: 0.12, duration: 520, onComplete: () => gh.s.destroy() });
  }
  updateGhosts(dt) {
    const gx = this.guide.x, gy = this.guide.y + 10;
    this.ghosts.forEach(gh => {
      if (gh.dead) return;
      let move = gh.speed * dt;
      while (move > 0 && gh.seg < gh.P.length - 1) {
        const [x1, y1] = gh.P[gh.seg], [x2, y2] = gh.P[gh.seg + 1];
        const len = Math.hypot(x2 - x1, y2 - y1), rem = len * (1 - gh.t);
        if (move < rem) { gh.t += move / len; move = 0; }
        else { move -= rem; gh.seg++; gh.t = 0; }
      }
      if (gh.seg >= gh.P.length - 1) { gh.dead = true; gh.s.destroy(); return; }
      const [x1, y1] = gh.P[gh.seg], [x2, y2] = gh.P[gh.seg + 1];
      gh.s.x = x1 + (x2 - x1) * gh.t; gh.s.y = y1 + (y2 - y1) * gh.t + Math.sin(this.time.now / 300 + gh.wob) * 4;
      gh.s.setFlipX(x2 < x1);
      if (Phaser.Math.Distance.Between(gh.s.x, gh.s.y, gx, gy) < NIGHT.guideRadius) { this.dispel(gh, gx, gy); return; }
      this.lamps.forEach(L => {
        if (L.state === 'lit' && !gh.blown.has(L.i) && Phaser.Math.Distance.Between(gh.s.x, gh.s.y, L.x, L.y) < 44) {
          gh.blown.add(L.i); this.blowOut(L, 'ghost');
          this.tweens.add({ targets: gh.s, scaleX: 0.36, scaleY: 0.22, yoyo: true, duration: 120 });
        }
      });
    });
    this.ghosts = this.ghosts.filter(g => !g.dead || g.s.active);
  }

  /* ---------- 鼓 ---------- */
  spawnDrum(spot) {
    let i = spot;
    if (i == null) { do { i = Math.floor(Math.random() * DRUM_SPOTS.length); } while (i === this.lastDrum); }
    this.lastDrum = i;
    const p = DRUM_SPOTS[i];
    const c = this.add.container(p.x, p.y).setDepth(250);
    const im = this.add.image(0, 0, 'drum').setScale(0.7);
    const t = T(this, 0, -46, '敲鼓！', 16, '#ffe14a', { bold: true, stroke: '#e8202a', strokeThickness: 5 });
    const bar = this.add.graphics();
    c.add([im, t, bar]);
    c.setInteractive(new Phaser.Geom.Circle(0, 0, 38), Phaser.Geom.Circle.Contains); c.input.cursor = 'pointer';
    c.on('pointerdown', () => { if (this.inputOk()) this.hitDrum(); });
    c.setScale(0); this.tweens.add({ targets: c, scale: 1, duration: 300, ease: 'Back.out' });
    this.tweens.add({ targets: im, angle: { from: -6, to: 6 }, yoyo: true, repeat: -1, duration: 160 });
    this.drum = { c, bar, x: p.x, y: p.y, life: NIGHT.drumLife };
  }
  hitDrum() {
    const d = this.drum; if (!d) return; this.drum = null;
    SFX.drum(); this.time.delayedCall(120, () => SFX.roar());
    d.c.disableInteractive();
    this.tweens.add({ targets: d.c, scale: 1.3, alpha: 0, duration: 400, onComplete: () => d.c.destroy() });
    const ring = this.add.graphics().setDepth(240);
    const head = this.add.image(d.x + 50, d.y - 50, 'head_tiger').setDepth(260).setScale(0); 
    this.tweens.add({ targets: head, scale: 70 / head.height, duration: 200, yoyo: true, hold: 400, onComplete: () => head.destroy() });
    const tt = T(this, d.x, d.y - 70, '咚！吼——', 22, '#ffe14a', { bold: true, stroke: '#e8202a', strokeThickness: 6 }).setDepth(261);
    this.tweens.add({ targets: tt, y: d.y - 110, alpha: 0, duration: 900, onComplete: () => tt.destroy() });
    const o = { r: 10 };
    this.tweens.add({ targets: o, r: NIGHT.drumRadius, duration: 450, ease: 'Cubic.out',
      onUpdate: () => {
        ring.clear(); ring.lineStyle(8, 0xffe14a, 1 - o.r / NIGHT.drumRadius * 0.6); ring.strokeCircle(d.x, d.y, o.r);
        ring.lineStyle(3, 0xff00c8, 0.8); ring.strokeCircle(d.x, d.y, o.r * 0.8);
        this.ghosts.forEach(gh => { if (!gh.dead && Phaser.Math.Distance.Between(gh.s.x, gh.s.y, d.x, d.y) < o.r) this.dispel(gh, d.x, d.y); });
      },
      onComplete: () => this.tweens.add({ targets: ring, alpha: 0, duration: 200, onComplete: () => ring.destroy() }) });
    this.nextDrum = this.elapsed + this.rand(NIGHT.drumMin, NIGHT.drumMax) * (G.assist ? 0.7 : 1);
  }
  updateDrum(dt) {
    if (this.drum) {
      const d = this.drum; d.life -= dt;
      d.bar.clear(); d.bar.fillStyle(0x000000, 0.5); d.bar.fillRect(-30, 30, 60, 6); d.bar.fillStyle(0xffe14a, 1); d.bar.fillRect(-30, 30, 60 * Math.max(0, d.life / NIGHT.drumLife), 6);
      if (d.life <= 0) {
        this.drum = null; d.c.disableInteractive();
        this.tweens.add({ targets: d.c, alpha: 0, scale: 0.5, duration: 300, onComplete: () => d.c.destroy() });
        this.nextDrum = this.elapsed + this.rand(NIGHT.drumMin, NIGHT.drumMax) * (G.assist ? 0.7 : 1);
      }
    } else if (this.elapsed >= this.nextDrum) this.spawnDrum();
  }

  /* ---------- 重雾 / 瘟神 ---------- */
  startFog(lampIdx) {
    let L = lampIdx != null ? this.lamps[lampIdx] : null;
    if (!L) {
      const lit = this.lamps.filter(l => l.state === 'lit');
      if (!lit.length) { this.nextFog = this.elapsed + 4; return; }
      L = lit[Math.floor(Math.random() * lit.length)];
    }
    const god = this.add.image(L.x + 70, L.y - 20, 'wenshen').setOrigin(0.5, 1).setScale(0.15).setAlpha(0).setDepth(260);
    const warn = this.add.graphics().setDepth(255);
    const wt = T(this, L.x - 40, L.y - 70, '瘟神要吹重雾！', 16, '#e0b8ff', { bold: true, stroke: '#14164a', strokeThickness: 5 }).setDepth(262);
    this.tweens.add({ targets: god, alpha: 1, y: L.y - 40, duration: 600 });
    this.fog = { L, phase: 'warn', t: NIGHT.fogWarn, god, warn, wt, sprites: [] };
  }
  updateFog(dt) {
    const f = this.fog;
    if (!f) { if (this.elapsed >= this.nextFog) this.startFog(); return; }
    if (f.phase === 'warn') {
      f.t -= dt;
      f.warn.clear(); f.warn.lineStyle(4, 0xb98cff, 0.5 + 0.5 * Math.sin(this.time.now / 80)); dashedCircle(f.warn, f.L.x, f.L.y, 70, 20);
      if (f.t <= 0) {
        f.phase = 'fog'; f.warn.clear(); f.wt.destroy();
        this.tweens.add({ targets: f.god, alpha: 0, y: f.L.y - 160, duration: 800, delay: 400 });
        if (f.L.state === 'lit') this.blowOut(f.L, 'fog');
        else if (f.L.state === 'out') { f.L.state = 'fog'; f.L.hold = 0; f.L.holdPtr = null; }
        for (let k = 0; k < 3; k++) {
          const s = this.add.image(f.L.x + (k - 1) * 34, f.L.y - 6 + (k % 2) * 14, 'fog').setDepth(26).setScale(0).setAlpha(0.92);
          this.tweens.add({ targets: s, scale: 0.75, duration: 500, delay: k * 120 });
          this.tweens.add({ targets: s, angle: { from: -6, to: 6 }, yoyo: true, repeat: -1, duration: 900 + k * 200 });
          f.sprites.push(s);
        }
      }
    } else if (f.L.state === 'dead') this.clearFog(false);
  }
  clearFog(instant) {
    const f = this.fog; if (!f) return; this.fog = null;
    [f.god, f.warn, f.wt].forEach(o => o && o.active && o.destroy());
    f.sprites.forEach(s => instant ? s.destroy() : this.tweens.add({ targets: s, alpha: 0, scale: 1.2, duration: 700, onComplete: () => s.destroy() }));
    this.nextFog = Math.max(this.elapsed + this.rand(...NIGHT.fogEvery), this.elapsed + this.rainCd + 2);
  }

  /* ---------- 龙雨 ---------- */
  rainDown(ptr) {
    if (!this.inputOk()) return;
    if (this.rainCd > 0) { toast(this, `龙雨冷却中，还需 ${Math.ceil(this.rainCd)} 秒`, { y: 600 }); return; }
    this.rainDrag = { id: ptr.id };
    this.cloud.setVisible(true); this.moveCloud(ptr.x, ptr.y);
  }
  moveCloud(x, y) {
    this.cloud.setPosition(x, y - 10);
    this.cloudRing.clear(); this.cloudRing.fillStyle(C.cyan, 0.15); this.cloudRing.fillCircle(x, y, NIGHT.rainRadius);
    this.cloudRing.lineStyle(3, C.cyan, 0.9); dashedCircle(this.cloudRing, x, y, NIGHT.rainRadius, 26);
  }
  cancelRain() {
    this.rainDrag = null;
    if (this.cloud) { this.cloud.setVisible(false); this.cloudRing.clear(); }
  }
  rainUp(p) {
    const x = this.cloud.x, y = this.cloud.y + 10;
    this.cancelRain();
    const f = this.fog;
    if (!f || f.phase !== 'fog' || Phaser.Math.Distance.Between(x, y, f.L.x, f.L.y) > NIGHT.rainRadius + 20) {
      if (Phaser.Math.Distance.Between(x, y, this.rainPos.x, this.rainPos.y) > 70) toast(this, '雨云没有盖住重雾，龙雨未释放（不耗冷却）', { y: 600 });
      return;
    }
    this.castRain(f);
  }
  castRain(f) {
    this.rainCd = NIGHT.rainCooldown; SFX.rain();
    const L = f.L;
    const dragon = this.add.image(-200, 150, 'char_dragon').setAngle(-90).setScale(0.32).setDepth(650);
    this.tweens.add({ targets: dragon, x: W + 260, duration: 1300, ease: 'Sine.inOut', onComplete: () => dragon.destroy() });
    const rain = this.add.graphics().setDepth(640);
    let n = 0;
    const ev = this.time.addEvent({ delay: 40, repeat: 25, callback: () => {
      n++; rain.clear(); rain.lineStyle(3, C.cyan, 0.85);
      for (let k = 0; k < 26; k++) { const rx = L.x + this.rand(-110, 110), ry = L.y - 120 + ((k * 37 + n * 23) % 200); rain.lineBetween(rx, ry, rx - 6, ry + 22); }
      if (n >= 25) rain.destroy();
    } });
    this.time.delayedCall(700, () => {
      if (L.state === 'fog') { L.state = 'out'; L.hold = 0; }
      this.clearFog(false); SFX.ok();
      toast(this, '重雾散了！趁倒计时没结束，长按这盏灯救亮它', { y: 120 });
    });
  }
  drawRain() {
    const g = this.rainG, { x, y } = this.rainPos; g.clear();
    g.fillStyle(0x061a70, 0.9); g.fillCircle(x, y, 54); g.lineStyle(4, this.rainCd > 0 ? C.gray : C.cyan, 1); g.strokeCircle(x, y, 54);
    if (this.rainCd > 0) {
      g.fillStyle(0x000000, 0.55); g.slice(x, y, 54, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (this.rainCd / NIGHT.rainCooldown), false); g.fillPath();
      this.rainTxt.setText(`冷却 ${Math.ceil(this.rainCd)}s`);
    } else this.rainTxt.setText('龙雨 · 按住拖动');
  }

  /* ---------- 天明进度 ---------- */
  drawDawn() {
    const g = this.dawnG; g.clear();
    const x = 360, y = 76, w = 614, f = Math.min(1, this.elapsed / NIGHT.duration);
    g.fillStyle(C.ink, 0.85); g.fillRoundedRect(x - 6, y - 4, w + 12, 22, 11);
    g.fillStyle(0x2a3a9a, 1); g.fillRoundedRect(x, y, w, 14, 7);
    if (f > 0) { g.fillStyle(0xffb030, 1); g.fillRoundedRect(x, y, Math.max(14, w * f), 14, 7); }
    g.fillStyle(0xfbf5a2, 1); g.fillCircle(x, y + 7, 9); g.fillStyle(0x2a3a9a, 1); g.fillCircle(x + 4, y + 4, 7);
    g.fillStyle(0xff9a1f, 1); g.fillCircle(x + w, y + 7, 10);
    const lit = this.lamps.filter(l => l.state === 'lit').length, alive = this.lamps.filter(l => l.state !== 'dead').length;
    this.hud.setStep(`天明还有 ${Math.max(0, Math.ceil(NIGHT.duration - this.elapsed))} 秒 · 亮灯 ${lit}/${this.lamps.length} · 可救 ${alive}`);
  }

  /* ---------- 主循环 ---------- */
  inputOk() { return this.mode === 'run' || this.mode === 'tut'; }
  update(time, delta) {
    if (this.mode !== 'run' && this.mode !== 'tut') return;
    const dt = Math.min(0.05, delta / 1000);
    const run = this.mode === 'run';
    if (run) this.elapsed += dt;
    if (this.rainCd > 0) this.rainCd = Math.max(0, this.rainCd - dt);
    // 户灯
    this.lamps.forEach(L => {
      if (L.state === 'out' || L.state === 'fog') {
        L.outT += dt;
        if (!run) L.outT = Math.min(L.outT, 6.5);
        if (L.state === 'out' && L.holdPtr != null) {
          L.hold += dt;
          if (L.hold >= NIGHT.rescueHold) { this.relight(L); return; }
        }
        if (L.outT >= NIGHT.deadline) { L.state = 'dead'; L.hold = 0; L.holdPtr = null; SFX.dead(); }
      }
      if (L.state === 'lit') L.glow.setScale(0.9 + Math.sin(time / 260 + L.i) * 0.05);
    });
    this.updateGhosts(dt);
    if (run) {
      const interval = Phaser.Math.Linear(NIGHT.spawnEarly, NIGHT.spawnLate, Math.min(1, this.elapsed / NIGHT.duration)) * (G.assist ? 1.4 : 1);
      const max = G.assist ? 3 : NIGHT.ghostMax;
      if (this.elapsed >= this.nextSpawn) {
        if (this.ghosts.filter(g => !g.dead).length < max) this.spawnGhost();
        this.nextSpawn = this.elapsed + interval;
      }
      this.updateDrum(dt);
      this.updateFog(dt);
    } else {
      if (this.drum) { this.drum.life = Math.max(this.drum.life - dt, 1); }
      if (this.fog) this.updateFogTut(dt);
    }
    this.drawLamps(); this.drawRain(); this.drawDawn();
    if (run) {
      if (this.lamps.every(L => L.state === 'dead')) return this.fail();
      if (this.elapsed >= NIGHT.duration) return this.win();
    }
  }
  updateFogTut(dt) { const keep = this.elapsed; this.updateFog(dt); this.elapsed = keep; }

  /* ---------- 开始 / 失败 / 胜利 ---------- */
  overlay(title, body, buttons) {
    if (this.ov) this.ov.destroy();
    const c = this.add.container(0, 0).setDepth(1300);
    c.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5).setInteractive());
    c.add(panel(this, W / 2 - 300, 200, 600, 330, { fill: C.cream, stroke: C.magenta, lw: 6, r: 26 }));
    c.add(T(this, W / 2, 252, title, 32, '#9a0078', { bold: true }));
    c.add(T(this, W / 2, 340, body, 19, '#2a1030', { wrap: 520, align: 'center', lineSpacing: 8 }));
    buttons.forEach(([label, fn, opt], i) => c.add(button(this, W / 2 + (i - (buttons.length - 1) / 2) * 230, 460, label, () => { c.destroy(); this.ov = null; fn(); }, Object.assign({ w: 210, h: 56, size: 21 }, opt))));
    this.ov = c;
  }
  showStartPanel(title, body) {
    this.mode = 'idle';
    this.overlay(title, body + (G.assist ? '\n（已开启辅助模式：疫鬼更少、鼓点更多）' : ''), [
      ['开始守夜', () => this.begin()],
      ['重看演示', () => this.startTutorial(), { fill: C.blue, edge: 0x00248a }]
    ]);
  }
  begin() {
    this.resetNight(); this.mode = 'run';
    this.hud.setObjective('守到天明：拖引路灯驱鬼 · 长按熄灯救亮 · 敲鼓 · 龙雨净化');
    toast(this, '守夜开始！', { y: 140 });
  }
  fail() {
    this.mode = 'over'; G.nightRetries++;
    if (G.nightRetries >= 2) G.assist = true;
    this.cancelRain();
    this.overlay('这一阵风太急', '全村的灯都彻底熄灭了。别灰心——再守一次！\n药房、采购和扎灯的进度都还在。' + (G.assist ? '\n（已为你开启辅助模式）' : ''), [
      ['开始重试', () => this.begin()],
      ['重看演示', () => this.startTutorial(), { fill: C.blue, edge: 0x00248a }]
    ]);
  }
  win() {
    this.mode = 'over'; this.cancelRain();
    this.ghosts.forEach(gh => this.dispel(gh, W / 2, -200));
    if (this.drum) { this.drum.c.destroy(); this.drum = null; }
    const sun = this.add.rectangle(W / 2, H / 2, W, H, 0xffd080, 0).setDepth(1250);
    this.tweens.add({ targets: sun, fillAlpha: 0.45, duration: 1500 });
    const t = T(this, W / 2, H / 2, '守 到 天 明 ！', 64, '#fbf5a2', { bold: true, stroke: '#ff00c8', strokeThickness: 12 }).setDepth(1260).setScale(0);
    this.tweens.add({ targets: t, scale: 1, duration: 600, ease: 'Back.out' });
    SFX.ok();
    this.time.delayedCall(900, () => {
      if (this.fog) this.clearFog(false);
      this.lamps.forEach((L, i) => this.time.delayedCall(i * 200, () => { if (L.state !== 'lit') this.relight(L); this.drawLamps(); }));
    });
    this.time.delayedCall(3000, () => goTo(this, 'Story', { id: 'D' }));
  }

  /* ---------- 教学演示（可跳过） ---------- */
  startTutorial() {
    this.resetNight(); this.mode = 'tut'; this.tutStep = -1;
    this.hud.setObjective('守灯演示（可随时跳过）');
    const c = this.add.container(0, 0).setDepth(1280);
    const g = this.add.graphics();
    const txt = T(this, 0, 0, '', 20, '#2a1030', { wrap: 560, ox: 0, oy: 0, lineSpacing: 6 });
    const nextB = button(this, 0, 0, '下一步 ▸', () => this.tutNext(), { w: 150, h: 48, size: 19 });
    const skipB = button(this, 0, 0, '跳过演示', () => this.tutEnd(), { w: 150, h: 48, size: 19, fill: C.gray, edge: 0x555560 });
    const mark = this.add.graphics();
    c.add([mark, g, txt, nextB, skipB]);
    this.tut = { c, g, txt, nextB, skipB, mark };
    this.tutNext();
  }
  tutNext() {
    this.tutStep++;
    const S = [
      { text: '① 引路灯：按住灯体拖动它。疫鬼走进光圈就会退散。\n（点击空地不会移动引路灯）', at: () => [this.guide.x, this.guide.y + 10, 110], act: () => {} },
      { text: '② 疫鬼只沿道路前进，不会追灯；经过哪盏亮灯就吹灭哪盏，然后继续走。', at: () => [this.lamps[0].x, this.lamps[0].y, 60], act: () => { this.placeGuide(1150, 600); this.spawnGhost(0).speed = 140; } },
      { text: '③ 熄灭的灯：直接长按 2 秒救亮（内侧黄色填满）。外缘红色是 10 秒抢救期限，红满就彻底熄灭。试着长按它！', at: () => [this.lamps[0].x, this.lamps[0].y, 60], act: () => { if (this.lamps[0].state === 'lit') this.blowOut(this.lamps[0], 'ghost'); } },
      { text: '④ 鼓会不定时出现在居民家门口。点击鼓，才会发出一圈声浪，赶走附近的疫鬼。', at: () => [DRUM_SPOTS[2].x, DRUM_SPOTS[2].y, 70], act: () => { this.spawnDrum(2); const gh = this.spawnGhost(3); gh.t = 0.55; gh.speed = 90; } },
      { text: '⑤ 瘟神会吹出紫黑重雾，灯被污染。按住左下角“龙雨”拖到重雾上松手净化——净化后还要在剩余时间内长按救灯。', at: () => [this.lamps[3].x, this.lamps[3].y, 80], act: () => { this.startFog(3); this.fog.t = 0.3; } },
      { text: '⑥ 所有灯都彻底熄灭才需要重来。坚持 60 秒，守到天明！', at: () => [W / 2, 76, 0], act: () => {} }
    ];
    if (this.tutStep >= S.length) return this.tutEnd();
    const s = S[this.tutStep]; s.act();
    const { c, g, txt, nextB, skipB, mark } = this.tut;
    const [mx, my, mr] = s.at();
    const top = my > H / 2 ? 96 : H - 210;
    g.clear(); g.fillStyle(C.cream, 0.97); g.fillRoundedRect(W / 2 - 400, top, 800, 140, 18); g.lineStyle(5, C.magenta, 1); g.strokeRoundedRect(W / 2 - 400, top, 800, 140, 18);
    txt.setPosition(W / 2 - 376, top + 18).setText(s.text);
    nextB.setPosition(W / 2 + 310, top + 46); skipB.setPosition(W / 2 + 310, top + 104);
    nextB.label.setText(this.tutStep === S.length - 1 ? '开始守夜' : '下一步 ▸');
    mark.clear(); if (this.markTw) this.markTw.remove();
    if (mr) { mark.lineStyle(5, C.yellow, 1); mark.strokeCircle(mx, my, mr); this.markTw = this.tweens.add({ targets: mark, alpha: 0.3, yoyo: true, repeat: -1, duration: 450 }); }
  }
  tutEnd() {
    if (this.markTw) this.markTw.remove();
    if (this.tut) { this.tut.c.destroy(); this.tut = null; }
    G.tutorialSeen = true; if (this.tutStep < 5) G.tutorialSkipped = true;
    this.resetNight();
    this.begin();
  }
}
