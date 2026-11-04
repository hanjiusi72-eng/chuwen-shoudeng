/* 交互 0：掷骰子采药棋盘（15 格蛇形山路；第 8 格遇虎、13 格遇龙、14 格出山） */
const FORAGE_SX = W / 1440 * 0.94;
const FORAGE_DX = 60, FORAGE_DY = 14;
const cellPos = n => {                            // 参考稿坐标：x=254+col*232.5, y=[227,449,675]
  const row = Math.floor(n / 5), col = row === 1 ? 4 - n % 5 : n % 5;
  return { x: (254 + col * 232.5) * FORAGE_SX + FORAGE_DX, y: ([227, 449, 675][row] - 60) * FORAGE_SX + FORAGE_DY };
};
/* 轻量状态胶囊：参考稿为满屏棋盘，不用整条顶栏，只留左上目标 + 右上计数 */
function forageChip(scene) {
  const g = scene.add.graphics().setDepth(900);
  const label = T(scene, 30, 34, '', 20, '#fff8d0', { ox: 0, bold: true }).setDepth(901);
  const step = T(scene, W - 26, 34, '', 18, '#fbf5a2', { ox: 1, bold: true, stroke: '#8a005e', strokeThickness: 4 }).setDepth(901);
  const draw = () => {
    g.clear();
    const w = Math.min(W - 300, label.width + 36);
    g.fillStyle(C.ink, 0.82); g.fillRoundedRect(14, 12, w, 44, 22);
    g.lineStyle(3, C.magenta, 1); g.strokeRoundedRect(14, 12, w, 44, 22);
    const sw = step.width + 30;
    g.fillStyle(C.ink, 0.82); g.fillRoundedRect(W - sw - 14, 12, sw, 44, 22);
    g.lineStyle(3, C.yellow, 1); g.strokeRoundedRect(W - sw - 14, 12, sw, 44, 22);
  };
  return {
    setObjective(s) { label.setText(s); draw(); scene.tweens.add({ targets: label, alpha: { from: 0.25, to: 1 }, duration: 300 }); },
    setStep(s) { step.setText(s); draw(); }
  };
}
class ForageScene extends Phaser.Scene {
  constructor() { super('Forage'); }
  create() {
    fadeIn(this, ['walking']);
    BGM.setMode('festive');
    const bg = this.add.tileSprite(W / 2, H / 2, W, H, 'forage_pattern');
    bg.setTileScale(136 / 300, 236 / 520);
    // 给棋盘四周留出参考稿中的三角纹样边框，15 格始终完整可见。
    this.add.image(695, 367, 'forage_base').setDisplaySize(1104, 642);

    // 蛇形山路（粉色路线）：画在棋盘格图的下层，穿过格子的部分被格子遮住，只在格间露出
    const rt = this.add.graphics();
    const yT = cellPos(0).y, yM = cellPos(5).y, yB = cellPos(10).y;
    const xL = cellPos(0).x, xR = cellPos(4).x, cR = 1370 * FORAGE_SX + FORAGE_DX, cL = 70 * FORAGE_SX + FORAGE_DX;
    const cubic = (p0, c1, c2, p1) => { rt.beginPath(); rt.moveTo(p0.x, p0.y); for (let i = 1; i <= 26; i++) { const t = i / 26, u = 1 - t; rt.lineTo(u ** 3 * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t ** 3 * p1.x, u ** 3 * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t ** 3 * p1.y); } rt.strokePath(); };
    rt.lineStyle(7, 0xff39b5, 0.95);
    rt.beginPath(); rt.moveTo(xL, yT); rt.lineTo(xR, yT); rt.strokePath();
    rt.beginPath(); rt.moveTo(xR, yM); rt.lineTo(xL, yM); rt.strokePath();
    rt.beginPath(); rt.moveTo(xL, yB); rt.lineTo(xR, yB); rt.strokePath();
    cubic({ x: xR, y: yT }, { x: cR, y: yT }, { x: cR, y: yM }, { x: xR, y: yM });
    cubic({ x: xL, y: yM }, { x: cL, y: yM }, { x: cL, y: yB }, { x: xL, y: yB });
    this.add.image(W / 2 * 0.94 + FORAGE_DX, H / 2 * 0.94 + FORAGE_DY, 'forage_cells').setDisplaySize(W * 0.94, H * 0.94);

    // 格子内容
    Object.entries(FORAGE_HERB_AT).forEach(([n, id]) => {
      const p = cellPos(+n);
      const got = G.forageGot.includes(id);
      const im = this.add.image(p.x, p.y - 6, 'board_' + id).setScale(102 / Math.max(80, this.textures.get('board_' + id).getSourceImage().height));
      im.setAlpha(got ? 0.25 : 1);
      if (got) { T(this, p.x, p.y + 52, HERB[id].name, 16, '#118a5a', { bold: true }); const k = this.add.image(p.x, p.y - 6, 'spark').setScale(1.1); k.setTint(0x118a5a); }
    });
    const markGate = (n, key, ok) => {
      const p = cellPos(n);
      if (ok) { const gl = this.add.image(p.x, p.y, 'glow').setTint(0xffd040).setScale(0.55).setAlpha(0.8); this.tweens.add({ targets: gl, alpha: 0.4, yoyo: true, repeat: -1, duration: 700 }); }
      const im = this.add.image(p.x, p.y - 4, key).setScale(132 / this.textures.get(key).getSourceImage().height);
      if (ok) { im.setTint(0xffe9b0); T(this, p.x, p.y + 56, '已相逢 ✔', 16, '#b8860b', { bold: true }); }
      return im;
    };
    markGate(FORAGE_TIGER_CELL, 'node_tiger', G.healedTiger);
    markGate(FORAGE_DRAGON_CELL, 'node_dragon', G.healedDragon);

    // 保生大帝棋子
    const p0 = cellPos(G.foragePos);
    this.token = this.add.image(p0.x, p0.y + 38, 'token_god').setOrigin(0.5, 1).setDisplaySize(100, 148).setDepth(50);
    this.tweens.add({ targets: this.token, y: p0.y + 32, yoyo: true, repeat: -1, duration: 1500, ease: 'Sine.inOut' });

    // 骰子
    this.diceVal = 5;
    this.dice = this.add.image(1220, 668, 'vdice5').setDisplaySize(118, 118).setDepth(60).setInteractive({ useHandCursor: true });
    this.diceS = this.dice.scale;
    this.dice.on('pointerup', () => this.roll());
    this.tweens.add({ targets: this.dice, angle: { from: -4, to: 4 }, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.inOut' });
    this.diceHint = T(this, 1220, 736, '点骰子出发', 14, '#fff8d0', { bold: true, stroke: '#8a005e', strokeThickness: 4 });
    T(this, 84, 722, '掷骰前进 · 路过采药 · 遇见龙虎停下相助', 16, '#fff8d0', { sans: true, stroke: '#8a005e', strokeThickness: 4, ox: 0 });

    this.hud = forageChip(this);
    muteButton(this);
    this.refresh();
    this.walking = false;

    if (!G.foragePos && !G.forageGot.length && !this._intro) {
      this._intro = true;
      // 说明留在底边，不再弹出遮挡第三行棋盘与骰子的对白。
      this.diceHint.setText('点骰子出发');
    }
    if (G.debugRescue) {
      const m = G.debugRescue; G.debugRescue = null;
      this.time.delayedCall(400, () => m === 'tiger' ? openTigerRescue(this, () => this.rescueDone('tiger')) : openDragonRescue(this, () => this.rescueDone('dragon')));
    }
  }
  refresh() {
    const got = G.forageGot.length;
    const obj = !G.healedTiger ? '掷骰子前进 · 山中似乎有虎啸……'
      : !G.healedDragon ? '掷骰子前进 · 云雾深处有龙吟……'
      : '掷骰子走到山路口，下山救村民！';
    this.hud.setObjective(obj);
    this.hud.setStep(`已采 ${got} / 12 味`);
  }
  roll() {
    if (this.walking || this._leaving) return;
    this.walking = true; this.dice.disableInteractive();
    SFX.dice();
    let k = 0;
    const shake = this.time.addEvent({ delay: 90, repeat: 8, callback: () => {
      this.diceVal = 1 + Math.floor(Math.random() * 6);
      this.dice.setTexture('vdice' + this.diceVal).setScale(this.diceS * 0.92);
      k++;
      if (k > 8) {
        shake.remove();
        const val = 1 + Math.floor(Math.random() * 6);
        this.diceVal = val; this.dice.setTexture('vdice' + val).setScale(this.diceS);
        this.tweens.add({ targets: this.dice, scale: this.diceS * 1.15, duration: 140, yoyo: true, ease: 'Quad.out' });
        // 目标格：上限 14；未救治时在 8 / 13 格提前停下
        let target = Math.min(FORAGE_EXIT_CELL, G.foragePos + val);
        const path = [];
        for (let i = G.foragePos + 1; i <= target; i++) { path.push(i); if ((i === FORAGE_TIGER_CELL && !G.healedTiger) || (i === FORAGE_DRAGON_CELL && !G.healedDragon)) break; }
        this.walk(path);
      }
    } });
  }
  walk(path) {
    if (!path.length) {
      this.walking = false;
      this.dice.setInteractive({ useHandCursor: true });
      this.diceHint.setText('点骰子出发');
      return;
    }
    const n = path.shift();
    const p = cellPos(n);
    this.tweens.killTweensOf(this.token);
    this.tweens.add({ targets: this.token, x: p.x, y: p.y + 38, duration: 430, ease: 'Sine.inOut',
      onUpdate: () => { if (Math.random() < 0.12) SFX.step(); },
      onComplete: () => {
        G.foragePos = n;
        const herb = FORAGE_HERB_AT[n];
        if (herb && !G.forageGot.includes(herb)) {
          G.forageGot.push(herb);
          SFX.pick(); sparkle(this, p.x, p.y - 10, C.green, 10);
          const t = T(this, p.x, p.y - 66, HERB[herb].name + ' 采到了！', 19, '#fff8d0', { bold: true, stroke: '#118a5a', strokeThickness: 5 }).setDepth(80).setAlpha(0);
          this.tweens.add({ targets: t, alpha: 1, y: p.y - 92, duration: 300, onComplete: () => this.tweens.add({ targets: t, alpha: 0, y: p.y - 120, duration: 500, delay: 600, onComplete: () => t.destroy() }) });
          this.refresh();
        }
        const stop = (n === FORAGE_TIGER_CELL && !G.healedTiger) || (n === FORAGE_DRAGON_CELL && !G.healedDragon) || n === FORAGE_EXIT_CELL;
        if (stop) return this.arrive(n);
        this.walk(path);
      } });
  }
  /* 救治完成后在棋盘上补画「已相逢」标记 */
  showHealedGate(n, key) {
    const p = cellPos(n);
    const gl = this.add.image(p.x, p.y, 'glow').setTint(0xffd040).setScale(0.55).setAlpha(0.8).setDepth(1);
    this.tweens.add({ targets: gl, alpha: 0.4, yoyo: true, repeat: -1, duration: 700 });
    const im = this.add.image(p.x, p.y - 4, key).setScale(132 / this.textures.get(key).getSourceImage().height).setDepth(2);
    im.setTint(0xffe9b0);
    T(this, p.x, p.y + 56, '已相逢 ✔', 16, '#fff8d0', { bold: true, stroke: '#b8860b', strokeThickness: 3 }).setDepth(3);
  }
  /* 卡片救治完成：恢复骰子、刷新目标 */
  rescueDone(which) {
    this.showHealedGate(which === 'tiger' ? FORAGE_TIGER_CELL : FORAGE_DRAGON_CELL, which === 'tiger' ? 'node_tiger' : 'node_dragon');
    this.refresh();
    this.walking = false;
    this.dice.setInteractive({ useHandCursor: true });
    this.diceHint.setText('点骰子出发');
  }
  arrive(n) {
    this.tweens.add({ targets: this.token, y: this.token.y - 8, yoyo: true, repeat: 2, duration: 160, onComplete: () => {
      if (n === FORAGE_TIGER_CELL) {
        this.hud.setObjective('山路遇虎 · 按符纸化符水为它顺喉');
        dialog(this, [{ who: 'tiger', text: '吼……别怕。我喉咙里卡了东西，咽不下也吐不出，实在没力气伤人……' },
                      { who: 'wu', text: '虎兄莫慌。就在这山石上摊开符纸，按住它化一道符水，为虎兄顺喉。' }],
          () => openTigerRescue(this, () => this.rescueDone('tiger')));
      } else if (n === FORAGE_DRAGON_CELL) {
        this.hud.setObjective('云雾遇龙 · 调药贴为它敷眼');
        dialog(this, [{ who: 'dragon', text: '是保生大帝吗……我的双眼像蒙了雾，连脚下的山路都快看不清了。' },
                      { who: 'wu', text: '龙兄受苦了。取金银花、薄荷、菊花三味入罐调成药贴，为龙兄敷眼。' }],
          () => openDragonRescue(this, () => this.rescueDone('dragon')));
      } else {
        this.hud.setObjective('药囊满了，下山！');
        dialog(this, [{ who: 'narr', text: '药囊满了！山风送来草木的清香，山下村子的炊烟已经在望。' },
                      { who: 'tiger', text: '走，随我们下山！这一路的药，要变成一锅锅救人的汤药。' },
                      { who: 'dragon', text: '村里等着的人还多——脚步快些，再快些。' }],
          () => goTo(this, 'Story', { id: 'A' }));
      }
    } });
  }
}
