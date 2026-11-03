/* 幕间界面：第一幕～第四幕 */
class ActScene extends Phaser.Scene {
  constructor() { super('Act'); }
  init(data) { this.A = ACTS[data.act] || ACTS[1]; }
  create() {
    fadeIn(this, ['done']);
    BGM.setMode('festive');
    const A = this.A;
    this.add.image(W / 2, H / 2, 'bg_pattern').setDisplaySize(W, H);
    const fig = this.add.image(-40, H + 6, A.fig).setOrigin(0, 1);
    fig.setScale(Math.min(706 / fig.height, 560 / fig.width));
    const fx = 10;
    fig.x = fx - 260; fig.setAlpha(0);
    this.tweens.add({ targets: fig, x: fx, alpha: 1, duration: 900, ease: 'Cubic.out' });

    const cx = Math.max(fig.displayWidth + 40, 560) + (W - Math.max(fig.displayWidth + 40, 560)) / 2;
    const title = T(this, cx, 210, A.title, 84, '#2ef0f6', { bold: true, stroke: '#8a005e', strokeThickness: 8 }).setAlpha(0);
    const sub = T(this, cx, 284, '— ' + A.sub + ' —', 26, '#fff4fb', { stroke: '#8a005e', strokeThickness: 5 }).setAlpha(0);
    const p1 = T(this, cx, 396, A.poem[0], 46, '#ffffff', { stroke: '#8a005e', strokeThickness: 6 }).setAlpha(0);
    const p2 = T(this, cx, 468, A.poem[1], 46, '#ffffff', { stroke: '#8a005e', strokeThickness: 6 }).setAlpha(0);
    [title, sub, p1, p2].forEach((t, i) => this.tweens.add({ targets: t, alpha: 1, y: t.y - 8, duration: 700, delay: 500 + i * 380 }));
    const more = T(this, W - 64, H - 24, '点击继续 ▸', 18, '#ffffff', { ox: 1, sans: true, stroke: '#8a005e', strokeThickness: 4 }).setAlpha(0);
    this.tweens.add({ targets: more, alpha: 1, duration: 400, delay: 2000, onComplete: () => this.tweens.add({ targets: more, alpha: 0.35, yoyo: true, repeat: -1, duration: 600 }) });
    SFX.drum();
    const go = () => { if (this.done) return; this.done = true; const [k, d] = A.next; goTo(this, k, d); };
    this.time.delayedCall(700, () => this.input.on('pointerup', p => { if (!(p.x > W - 70 && p.y > H - 50)) go(); }));
    this.time.delayedCall(9000, go);
    muteButton(this);
  }
}
