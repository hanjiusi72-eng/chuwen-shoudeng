/* 交互 1A / 1B：棋盘上的「山中相遇」任务卡片（不切场景，音乐不断）
   救虎：长按符纸 → 符纹显现 → 符水拖给猛虎
   救龙：金银花/薄荷/菊花三味拖入药罐 → 调成两张药贴 → 依次拖给龙眼 */

function rescueTextures(scene) {
  if (scene.textures.exists('rz_talisman_on')) return;
  /* 符纸（未显现） */
  let g = scene.make.graphics({ add: false });
  g.fillStyle(0xf2b93a, 1); g.fillRoundedRect(0, 0, 96, 196, 10);
  g.lineStyle(4, 0xd23a20, 1); g.strokeRoundedRect(6, 6, 84, 184, 8);
  g.lineStyle(2, 0xc98a12, 0.9);
  [[16, 20], [80, 20], [16, 176], [80, 176]].forEach(([x, y]) => { g.strokeCircle(x, y, 5); });
  g.fillStyle(0xc98a12, 0.35);
  for (let i = 0; i < 5; i++) g.fillTriangle(48, 46 + i * 26, 34, 62 + i * 26, 62, 62 + i * 26);
  g.generateTexture('rz_talisman', 96, 196); g.destroy();
  /* 符纸（符纹显现） */
  g = scene.make.graphics({ add: false });
  g.fillStyle(0xf2b93a, 1); g.fillRoundedRect(0, 0, 96, 196, 10);
  g.lineStyle(4, 0xd23a20, 1); g.strokeRoundedRect(6, 6, 84, 184, 8);
  g.lineStyle(3, 0xff00c8, 1);
  g.strokeCircle(48, 34, 15);
  g.strokeTriangle(48, 58, 30, 92, 66, 92);
  g.strokeTriangle(48, 84, 30, 118, 66, 118);
  g.lineStyle(2, 0xff00c8, 1);
  for (let i = 0; i < 3; i++) { g.strokeCircle(28, 138 + i * 16, 6); g.strokeCircle(68, 138 + i * 16, 6); }
  g.lineStyle(3, 0xd23a20, 0.9);
  g.lineBetween(20, 24, 20, 172); g.lineBetween(76, 24, 76, 172);
  g.generateTexture('rz_talisman_on', 96, 196); g.destroy();
  /* 符水碗 */
  g = scene.make.graphics({ add: false });
  g.fillStyle(0x3a8a72, 1); g.fillRoundedRect(12, 26, 156, 62, { tl: 4, tr: 4, bl: 26, br: 26 });
  g.fillStyle(0x5aa88f, 1); g.fillRoundedRect(20, 26, 140, 54, { tl: 2, tr: 2, bl: 22, br: 22 });
  g.fillStyle(0xe8e2cf, 1); g.fillRoundedRect(48, 84, 84, 12, 5);
  g.fillStyle(0x7fc9b0, 1); g.fillEllipse(90, 26, 176, 42);
  g.fillStyle(0x2bbf98, 1); g.fillEllipse(90, 25, 158, 32);
  g.fillStyle(0xaef0da, 1); g.fillEllipse(90, 23, 146, 24);
  g.fillStyle(0x8fe8cc, 1); g.fillEllipse(76, 20, 40, 8);
  g.generateTexture('rz_bowl', 180, 100); g.destroy();
  /* 药罐（玫红药碗） */
  g = scene.make.graphics({ add: false });
  g.fillStyle(0x2ad4f0, 1); g.fillEllipse(90, 22, 176, 40);
  g.fillStyle(0xff00c8, 1); g.fillRoundedRect(14, 18, 152, 118, 20);
  g.fillStyle(0xe800b4, 1); g.fillRoundedRect(14, 96, 152, 40, 18);
  g.fillStyle(0x2ad4f0, 1); g.fillRoundedRect(58, 136, 64, 14, 6);
  g.fillStyle(0xd40920, 1); g.fillEllipse(90, 22, 150, 28);
  g.generateTexture('rz_pot', 180, 150); g.destroy();
  /* 药贴 */
  g = scene.make.graphics({ add: false });
  g.fillStyle(0x004dfc, 1); g.fillRoundedRect(0, 0, 104, 96, 16);
  g.fillStyle(0xfbf5a2, 1); g.fillRoundedRect(7, 7, 90, 82, 12);
  g.lineStyle(2, 0xff00c8, 0.85);
  g.strokeCircle(52, 46, 22);
  g.lineStyle(3, 0xe83a8c, 0.9);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + 0.4;
    g.lineBetween(52 + Math.cos(a) * 10, 46 + Math.sin(a) * 10, 52 + Math.cos(a) * 24, 46 + Math.sin(a) * 24);
  }
  g.generateTexture('rz_patch', 104, 96); g.destroy();
}

/* 卡片外壳：压暗棋盘 + 米白卡片 + 标题区 + 底部提示 */
function rescueCard(scene, title, sub) {
  const cx = W / 2, cy = H / 2, cw = 790, ch = 540;
  const c = scene.add.container(0, 0).setDepth(1500);
  const dim = scene.add.rectangle(cx, cy, W, H, 0x1c0518, 0.45).setInteractive();
  const cardG = scene.add.graphics();
  cardG.fillStyle(0xf7f3e8, 1); cardG.fillRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 20);
  cardG.lineStyle(2, 0xd8d2c0, 1); cardG.strokeRoundedRect(cx - cw / 2 + 6, cy - ch / 2 + 6, cw - 12, ch - 12, 16);
  c.add([dim, cardG]);
  c.add(T(scene, cx, cy - ch / 2 + 42, '山 中 相 遇', 15, '#9a938a', { sans: true }));
  c.add(T(scene, cx, cy - ch / 2 + 80, title, 30, '#1a0a30', { bold: true }));
  c.add(T(scene, cx, cy - ch / 2 + 114, sub, 17, '#8a8378', { sans: true }));
  const hint = T(scene, cx, cy + ch / 2 - 42, '', 19, '#1a0a30', { bold: true }).setAlpha(0);
  c.add(hint);
  const setHint = s => { hint.setText(s); scene.tweens.add({ targets: hint, alpha: 1, duration: 250 }); };
  cardG.setScale(0.85);
  scene.tweens.add({ targets: cardG, scale: 1, duration: 260, ease: 'Back.out' });
  scene.tweens.add({ targets: c, alpha: { from: 0, to: 1 }, duration: 200 });
  return { c, cx, cy, setHint };
}

function rescueFinish(scene, ov, artX, artY, doneLines, after) {
  SFX.ok();
  const glow = scene.add.image(artX, artY, 'glow').setTint(0xffd040).setScale(1.15).setAlpha(0).setDepth(1490);
  scene.tweens.add({ targets: glow, alpha: 0.85, duration: 350, yoyo: true, repeat: 1 });
  sparkle(scene, artX, artY, 0xffd040, 22, 1510);
  scene.time.delayedCall(650, () => {
    dialog(scene, doneLines, () => {
      ov.c.destroy();
      after();
    }, { depth: 1520 });
  });
}

/* 统一手动拖拽（不依赖 Phaser 拖拽管理器，容器内对象拖动更稳） */
const rescueDragBound = {};
function rescueBindMove(scene) {
  if (rescueDragBound.move) return;
  rescueDragBound.move = true;
  scene.input.on('pointermove', p => {
    const o = scene._rzDrag;
    if (o) { o.x = p.x; o.y = p.y; }
  });
}
function rescuePick(scene, o, flag) {
  o.rz = true;
  o.setInteractive({ useHandCursor: true });
  o.on('pointerdown', p => {
    scene._rzDrag = o; o[flag] = true; o.setDepth(1515); SFX.pick();
    o.x = p.x; o.y = p.y;
  });
}

/* ============ 交互 1A · 猛虎求助 ============ */
function openTigerRescue(scene, onDone) {
  rescueTextures(scene);
  const ov = rescueCard(scene, '猛虎求助', '猛虎喉间受困，伏地向大帝求救。');
  const { cx, cy } = ov;
  const artX = cx - 210, artY = cy + 40;
  const tiger = scene.add.image(artX, artY, 'pattern_tiger').setDepth(1505);
  const ts = 320 / Math.max(tiger.width, tiger.height);
  tiger.setScale(ts);
  ov.c.add(tiger);

  /* 第一步：长按符纸，符纹显现 */
  ov.setHint('按住符纸，直到符纹显现。');
  const tx = cx + 165, ty = cy - 20;
  const talisman = scene.add.image(tx, ty, 'rz_talisman').setDepth(1505).setInteractive({ useHandCursor: true });
  talisman.rz = true;
  ov.c.add(talisman);
  const ring = scene.add.graphics().setDepth(1510);
  let holdT = null, prog = 0, pressing = false, revealed = false, bowl = null;
  const drawRing = (x, y, pr) => {
    ring.clear();
    ring.lineStyle(5, 0x222222, 0.9);
    ring.strokeCircle(x, y, 30);
    ring.lineStyle(6, 0xffffff, 0.95);
    ring.beginPath(); ring.arc(x, y, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pr); ring.strokePath();
  };
  const stopHold = () => {
    pressing = false;
    if (holdT) { holdT.remove(); holdT = null; }
    ring.clear();
    if (!revealed) prog = 0;
  };
  talisman.on('pointerdown', p => {
    if (revealed) return;
    pressing = true; prog = 0;
    drawRing(p.x, p.y, 0);
    SFX.pick();
    holdT = scene.time.addEvent({ delay: 50, loop: true, callback: () => {
      if (!pressing) return stopHold();
      prog += 0.034;
      drawRing(scene.input.activePointer.x, scene.input.activePointer.y, Math.min(1, prog));
      if (prog >= 1) {
        revealed = true; stopHold();
        SFX.light();
        talisman.disableInteractive();
        talisman.setTexture('rz_talisman_on');
        scene.tweens.add({ targets: talisman, scale: 0.8, x: tx + 100, y: ty - 70, duration: 320, ease: 'Quad.out' });
        /* 第二步：符水出现，拖给猛虎 */
        ov.setHint('将符水拖给猛虎。');
        bowl = scene.add.image(tx - 20, ty + 110, 'rz_bowl').setDepth(1506).setScale(0.95).setAlpha(0);
        bowl.rz = true;
        ov.c.add(bowl);
        bowl.homeX = tx - 20; bowl.homeY = ty + 120;
        scene.tweens.add({ targets: bowl, alpha: 1, y: ty + 120, duration: 320, ease: 'Back.out' });
        rescueBindMove(scene);
        rescuePick(scene, bowl, 'dragging');
      }
    } });
  });
  talisman.on('pointerup', stopHold);
  talisman.on('pointerout', stopHold);

  scene.input.on('pointerup', (p) => {
    const o = scene._rzDrag;
    if (o !== bowl || !o.dragging) return;
    scene._rzDrag = null;
    o.dragging = false; o.setDepth(1506);
    if (Phaser.Math.Distance.Between(o.x, o.y, artX, artY) < 185) {
      o.disableInteractive();
      scene.tweens.add({ targets: o, x: artX, y: artY + 30, scale: 0.4, alpha: 0, duration: 420, ease: 'Quad.in',
        onComplete: () => {
          G.healedTiger = true;
          rescueFinish(scene, ov, artX, artY, [
            { who: 'tiger', text: '呼——舒服多了！符水入喉，卡着的东西顺下去了。小友，这份恩情，白额虎记下了！' },
            { who: 'wu', text: '好身手。歇口气，我们继续赶路——前面的路上，好像还有人在等我们。' }
          ], onDone);
        } });
    } else {
      scene.tweens.add({ targets: o, x: o.homeX, y: o.homeY, duration: 260, ease: 'Back.out' });
    }
  });
}

/* 素材 pattern_dragon 的眼睛框是透明镂空（像戴了眼罩）。生成“无框”版：镂空处填卡片底色，并按参考稿补上粉色圆眼 */
function makeCleanDragon(scene) {
  if (scene.textures.exists('pattern_dragon_clean')) return;
  const src = scene.textures.get('pattern_dragon').getSourceImage();
  const ct = scene.textures.createCanvas('pattern_dragon_clean', src.width, src.height);
  const ctx = ct.getContext();
  ctx.drawImage(src, 0, 0);
  const fill = (x0, y0, x1, y1) => {
    const r = 24;
    ctx.fillStyle = '#f7f3e8';
    ctx.beginPath();
    ctx.moveTo(x0 + r, y0);
    ctx.arcTo(x1, y0, x1, y1, r); ctx.arcTo(x1, y1, x0, y1, r);
    ctx.arcTo(x0, y1, x0, y0, r); ctx.arcTo(x0, y0, x1, y0, r);
    ctx.closePath(); ctx.fill();
  };
  fill(2, 105, 158, 236);
  fill(195, 105, 348, 236);
  const eye = (ex, ey) => {
    ctx.fillStyle = '#ff2aa8';
    ctx.beginPath(); ctx.arc(ex, ey, 23, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(ex - 7, ey - 8, 6, 0, Math.PI * 2); ctx.fill();
  };
  eye(82, 168); eye(271, 168);
  ct.refresh();
}

function openDragonRescue(scene, onDone) {
  rescueTextures(scene);
  makeCleanDragon(scene);
  const ov = rescueCard(scene, '神龙求医', '神龙双目不清，前来请大帝相助。');
  const { cx, cy } = ov;
  const artX = cx - 210, artY = cy + 40;
  const dragon = scene.add.image(artX, artY, 'pattern_dragon_clean').setDepth(1505);
  const ds = 320 / Math.max(dragon.width, dragon.height);
  dragon.setScale(ds);
  ov.c.add(dragon);

  /* 药罐（玫红药碗） */
  const potX = cx + 165, potY = cy + 60;
  const pot = scene.add.image(potX, potY, 'rz_pot').setDepth(1504).setScale(1.05);
  ov.c.add(pot);
  const potZone = new Phaser.Geom.Rectangle(potX - 100, potY - 70, 200, 160);

  /* 第一步：三味药草拖入药罐 */
  ov.setHint('将三味药草拖入药罐，调成药贴。');
  const HERBS3 = [
    { id: 'jinyinhua', name: '金银花', tip: '清热解毒' },
    { id: 'bohe', name: '薄荷', tip: '疏散风热 · 清利头目' },
    { id: 'juhua', name: '菊花', tip: '散风清热 · 平肝明目' }
  ];
  const inPot = [], eyes = [];
  let patchDone = 0;
  const tip = scene.add.container(0, 0).setDepth(1520).setVisible(false);
  const tipG = scene.add.graphics();
  tipG.fillStyle(0xfbf5a2, 0.96); tipG.fillRoundedRect(-105, -32, 210, 64, 12);
  tipG.lineStyle(2, 0xb0487c, 1); tipG.strokeRoundedRect(-105, -32, 210, 64, 12);
  const tipT1 = T(scene, 0, -11, '', 18, '#1a0a30', { bold: true });
  const tipT2 = T(scene, 0, 13, '', 14, '#8a5a2a', { sans: true });
  tip.add([tipG, tipT1, tipT2]);
  ov.c.add(tip);

  HERBS3.forEach((h, i) => {
    const hx = cx + 45 + i * 115, hy = cy - 65;
    const card = scene.add.container(hx, hy);
    const art = scene.add.image(0, 0, 'med_' + h.id).setDisplaySize(62, 62);
    const nm = T(scene, 0, 44, h.name, 16, '#b0487c', { bold: true });
    card.add([art, nm]); card.setSize(96, 104);
    card.rz = true; card.herb = h.id; card.home = { x: hx, y: hy };
    card.on('pointerover', () => { tipT1.setText(h.name); tipT2.setText(h.tip); tip.setPosition(card.x, card.y - 84).setVisible(true); });
    card.on('pointerout', () => tip.setVisible(false));
    ov.c.add(card);
    rescueBindMove(scene);
    rescuePick(scene, card, 'draggingHerb');
  });

  let allIn = false;
  const makePatches = () => {
    allIn = true;
    ov.setHint('将药贴拖给神龙。');
    const eyeOff = [[-84, -7], [88, -7]];
    eyeOff.forEach(([ex, ey], k) => {
      const z = scene.add.circle(artX + ex, artY + ey, 20, 0xffe62a, 0).setStrokeStyle(3, 0xffe62a, 0.9).setDepth(1507);
      scene.tweens.add({ targets: z, scale: 1.25, alpha: 0.5, yoyo: true, repeat: -1, duration: 450, delay: k * 220 });
      ov.c.add(z);
      eyes.push({ x: artX + ex, y: artY + ey, z, filled: false });
    });
    [0, 1].forEach(k => {
      const pg = scene.add.image(cx + 128 + k * 92, artY - 7, 'rz_patch').setDepth(1508).setScale(0.72);
      pg.rz = true; pg.isPatch = true; pg.homeX = pg.x; pg.homeY = pg.y;
      pg.homeX = pg.x; pg.homeY = pg.y;
      rescueBindMove(scene);
      rescuePick(scene, pg, 'dragging');
      ov.c.add(pg);
    });
  };

  scene.input.on('pointerup', (p) => {
    const o = scene._rzDrag;
    if (!o || !o.rz) return;
    scene._rzDrag = null;
    tip.setVisible(false);
    if (o.herb && o.draggingHerb) {
      o.draggingHerb = false; o.setDepth(0);
      const hit = potZone.contains(p.x, p.y) || potZone.contains(o.x, o.y);
      if (!hit || allIn) return scene.tweens.add({ targets: o, x: o.home.x, y: o.home.y, duration: 260, ease: 'Back.out' });
      o.used = true; o.disableInteractive();
      o.setPosition(o.home.x, o.home.y).setScale(1).setAlpha(0.3);
      inPot.push(o.herb); SFX.drop();
      const fly = scene.add.image(o.x, o.y, 'med_' + o.herb).setDisplaySize(56, 56).setDepth(1510);
      scene.tweens.add({ targets: fly, x: potX, y: potY - 10, displayWidth: 14, displayHeight: 14, angle: 200, duration: 320, ease: 'Quad.in',
        onComplete: () => { fly.destroy(); sparkle(scene, potX, potY - 20, 0xffb0e0, 6, 1511); } });
      scene.tweens.add({ targets: pot, scaleX: 1.12, duration: 120, yoyo: true });
      if (inPot.length >= 3) scene.time.delayedCall(420, makePatches);
    } else if (o.isPatch) {
      o.setDepth(1508);
      const hitEye = eyes.find(e => !e.filled && Phaser.Math.Distance.Between(o.x, o.y, e.x, e.y) < 60);
      if (!hitEye) return scene.tweens.add({ targets: o, x: o.homeX, y: o.homeY, duration: 260, ease: 'Back.out' });
      hitEye.filled = true; patchDone++;
      o.disableInteractive();
      hitEye.z.destroy();
      scene.tweens.add({ targets: o, x: hitEye.x, y: hitEye.y, scale: 0.62, duration: 300, ease: 'Quad.out' });
      SFX.light(); sparkle(scene, hitEye.x, hitEye.y, 0xffe62a, 10, 1511);
      if (patchDone >= 2) {
        scene.time.delayedCall(500, () => {
          G.healedDragon = true;
          rescueFinish(scene, ov, artX, artY, [
            { who: 'dragon', text: '我看见了！山是青的，云是白的，你的脸也是亮堂的。多谢你，小学徒！' },
            { who: 'tiger', text: '龙兄的恩了了，咱们的药还没采齐——走，回山路上去！' }
          ], onDone);
        });
      }
    }
  });
}
