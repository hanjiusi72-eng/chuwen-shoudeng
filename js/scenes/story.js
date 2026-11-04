/* 剧情场景：分镜 + 字幕 + 继续/跳过（跳过也会写入该节点的状态变化） */
const VILLAGE_LAMPS = [
  { x: 365, y: 372 }, { x: 600, y: 240 }, { x: 742, y: 292 }, { x: 580, y: 482 }, { x: 842, y: 500 }
];

function actor(scene, key, x, y, h, enter, delay = 0) {
  const a = scene.add.image(x, y, key).setOrigin(0.5, 1);
  a.setScale(h / a.height);
  if (enter === 'left') { a.x = -300; scene.tweens.add({ targets: a, x, duration: 900, delay, ease: 'Cubic.out' }); }
  else if (enter === 'right') { a.x = W + 300; scene.tweens.add({ targets: a, x, duration: 900, delay, ease: 'Cubic.out' }); }
  else if (enter === 'up') { a.y = y + h; scene.tweens.add({ targets: a, y, duration: 1000, delay, ease: 'Cubic.out' }); }
  else if (enter === 'fade') { a.setAlpha(0); scene.tweens.add({ targets: a, alpha: 1, duration: 700, delay }); }
  return a;
}
function bobbing(scene, obj, amp = 8, dur = 1600) { scene.tweens.add({ targets: obj, y: obj.y - amp, yoyo: true, repeat: -1, duration: dur, ease: 'Sine.inOut' }); }

const STORIES = {
  prologue: {
    title: '序章 · 灯与药香',
    shots: [
      // 与修订稿一致：满幅粉红几何纹样，保生大帝居中近景。
      { bg: 'bg_pattern', build(s) { actor(s, 'char_baosheng', W / 2, H, H, 'up'); },
        lines: [{ who: 'wu', text: '徒儿，你看村里屋檐下的灯，都暗了。暑气不退，病气却一家一家地传……' },
                { who: 'wu', text: '药庐里的存药快见底了。备好药囊，随我上山采药去。听说山路不太平，路上多留心。' }] },
      // 保留原画的亮黄地面与蓝黄格纹，不再叠加暗色蒙版。
      { bg: 'bg_village',
        lines: [{ who: 'narr', text: '山下的村子，家家闭户。老人们在门后咳嗽，孩子们烧得小脸通红，都在等一锅热热的汤药。' },
                { who: 'me', text: '师父，咱们快些走！' }] }
    ],
    next: ['Forage']
  },
  A: {
    title: '剧情 A · 龙虎随行',
    shots: [
      { bg: 'bg_village', build(s) {
          s.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.18);
          actor(s, 'char_dragon', 300, H + 40, 600, 'left'); actor(s, 'char_tiger', W - 320, H + 40, 600, 'right');
        },
        lines: [{ who: 'tiger', text: '小学徒，你的药真灵！这份情，白额虎记下了——山下村子有难，我们随你下山！' },
                { who: 'dragon', text: '一路同行，恩义在心。村里等药的人还多，咱们把山上的草药，先送回药庐。' }] },
      { bg: 'bg_pattern', build(s) {
          const glow = s.add.image(W / 2, 330, 'glow').setScale(2.2).setTint(0xfff3b0).setAlpha(0);
          const l = s.add.image(W / 2, 330, 'lantern_white').setScale(1.6).setAlpha(0);
          s.tweens.add({ targets: [l, glow], alpha: 1, duration: 800 });
          for (let i = 0; i < 5; i++) {
            const a = i / 5 * Math.PI * 2, gh = s.add.image(W / 2 + Math.cos(a) * 200, 330 + Math.sin(a) * 160, 'ghost').setScale(0.4).setAlpha(0.95);
            s.tweens.add({ targets: gh, x: W / 2 + Math.cos(a) * 520, y: 330 + Math.sin(a) * 380, alpha: 0, duration: 1600, delay: 1600 + i * 120, ease: 'Cubic.in' });
          }
          s.time.delayedCall(1500, () => { SFX.drum(); s.tweens.add({ targets: glow, scale: 3.2, duration: 500, yoyo: true }); });
          actor(s, 'head_dragon', 170, H - 170, 260, 'left'); actor(s, 'head_tiger', W - 190, H - 170, 260, 'right');
        },
        lines: [{ who: 'dragon', text: '再送你一盏素灯。灯面先空着——等村里的灯都亮起来，再好好装点它。' },
                { who: 'tiger', text: '记住：灯光亮，锣鼓响，瘟神疫鬼就不敢近身！' }] }
    ],
    next: ['Medicine', { mode: 'effects' }]
  },
  B: {
    title: '剧情 B · 灯下传艺',
    apply() { G.carpenterRescued = true; G.craftUnlocked = true; },
    shots: [
      { bg: 'bg_village', build(s) {
          s.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.18);
          // 只保留木匠一人，始终站立
          const cp = actor(s, 'char_elder', W / 2 + 40, H + 20, 560, 'fade', 200);
          const gd = s.add.image(W - 330, 330, 'gourd').setScale(1.2).setAlpha(0);
          s.tweens.add({ targets: gd, alpha: 1, duration: 300, delay: 1400 });
          s.tweens.add({ targets: gd, x: W / 2 + 40, y: 430, duration: 900, delay: 1800, ease: 'Quad.inOut', onComplete: () => {
            gd.destroy(); sparkle(s, W / 2 + 40, 430, C.yellow, 20); SFX.ok();
            bobbing(s, cp, 4);
          } });
        },
        lines: [{ who: 'narr', text: '药香先到了最需要的人家。一碗温热的汤药递到木匠手里，他苍白的脸，慢慢有了血色。' },
                { who: 'carp', text: '身子一下子轻快了……小友，这碗药，是救命的恩情，木匠记在心里。' }] },
      { bg: 'bg_pattern', build(s) {
          actor(s, 'char_elder', 360, H + 40, 640, 'left');
          const glow = s.add.image(W - 380, 320, 'glow').setScale(2).setTint(0xfff3b0); s.add.image(W - 380, 320, 'lantern_white').setScale(1.5);
          s.tweens.add({ targets: glow, alpha: 0.5, yoyo: true, repeat: -1, duration: 900 });
        },
        lines: [{ who: 'carp', text: '我这双做了一辈子木工的手，也想为大家做点事。这盏素灯真好——可一盏不够哇。' },
                { who: 'carp', text: '走，到我家去。竹篾棉纸都齐了，我教你扎灯，让家家户户门前都亮一盏！' }] }
    ],
    next: ['Craft']
  },
  C: {
    title: '剧情 C · 千灯初上',
    apply() { G.lampCrafted = true; },
    shots: [
      { bg: 'bg_village', build(s) {
          VILLAGE_LAMPS.forEach((p, i) => {
            const gl = s.add.image(p.x, p.y, 'glow').setTint(0xffd040).setScale(0).setAlpha(0.7);
            const off = s.add.image(p.x, p.y, 'lantern_white').setScale(0.42);
            const gd = s.add.image(W / 2, H + 60, 'gourd').setScale(0.6);
            s.tweens.add({ targets: gd, x: p.x, y: p.y - 70, duration: 700, delay: 300 + i * 450, ease: 'Quad.out', onComplete: () => {
              gd.destroy(); off.setTexture('lantern_lit'); SFX.light();
              s.tweens.add({ targets: gl, scale: 0.9, duration: 500 });
            } });
          });
        },
        lines: [{ who: 'narr', text: '汤药一碗碗送进各家，门前的素灯一盏接一盏地亮——像有人把星星，摘到了屋檐下。' }] },
      { bg: 'bg_village', build(s) {
          const night = s.add.image(W / 2, H / 2, 'bg_village_night').setDisplaySize(W, H).setAlpha(0);
          s.tweens.add({ targets: night, alpha: 1, duration: 1500 });
          VILLAGE_LAMPS.forEach(p => { const gl = s.add.image(p.x, p.y, 'glow').setTint(0xffd040).setScale(0.9).setAlpha(0.85); s.add.image(p.x, p.y, 'lantern_lit').setScale(0.42); s.tweens.add({ targets: gl, alpha: 0.4, yoyo: true, repeat: -1, duration: 300 + Math.random() * 400 }); });
          const god = s.add.image(W / 2 + 260, H + 40, 'wenshen').setOrigin(0.5, 1).setScale(680 / 1484).setAlpha(0);
          s.tweens.add({ targets: god, alpha: 1, y: H + 20, duration: 1400, delay: 800, ease: 'Cubic.out' });
          s.tweens.add({ targets: god, angle: { from: -1.5, to: 1.5 }, yoyo: true, repeat: -1, duration: 1300, delay: 2200 });
          for (let i = 0; i < 6; i++) { const gh = s.add.image(-60, 200 + i * 70, 'ghost').setScale(0.32); s.tweens.add({ targets: gh, x: W + 80, duration: 5000, delay: 1200 + i * 500 }); }
        },
        lines: [{ who: 'narr', text: '入夜，风变了调。瘟神带着疫鬼进村，阴风所过，灯火一盏盏发抖……' },
                { who: 'tiger', text: '别怕！守住灯，就是守住家。我们陪你守到天明！' }] }
    ],
    next: ['Defense']
  },
  D: {
    title: '剧情 D · 天明',
    shots: [
      { bg: 'bg_village', build(s) {
          const night = s.add.image(W / 2, H / 2, 'bg_village_night').setDisplaySize(W, H);
          s.tweens.add({ targets: night, alpha: 0, duration: 2600 });
          VILLAGE_LAMPS.forEach(p => { s.add.image(p.x, p.y, 'glow').setTint(0xffd040).setScale(0.9).setAlpha(0.6); s.add.image(p.x, p.y, 'lantern_lit').setScale(0.42); });
          const god = s.add.image(W / 2 + 260, H + 20, 'wenshen').setOrigin(0.5, 1).setScale(680 / 1484);
          s.tweens.add({ targets: god, y: -40, alpha: 0, duration: 2200, delay: 400, ease: 'Cubic.in' });
          for (let i = 0; i < 5; i++) { const gh = s.add.image(400 + i * 120, 300 + (i % 2) * 80, 'ghost').setScale(0.38); s.tweens.add({ targets: gh, y: -120, alpha: 0, duration: 1600, delay: 300 + i * 150, ease: 'Cubic.in' }); }
        },
        lines: [{ who: 'narr', text: '鸡鸣三遍，天光爬上屋脊。疫鬼散了，瘟神退了。乡亲们推开家门，把熄了的灯，重新点亮。' }] },
      { bg: 'bg_pattern', build(s) {
          actor(s, 'char_elder', W / 2, H + 40, 600, 'up');
          actor(s, 'char_dragon', 200, H + 40, 560, 'left'); actor(s, 'char_tiger', W - 200, H + 40, 560, 'right');
        },
        lines: [{ who: 'carp', text: '这一夜，是大家把灯守住的。这份情义，村里人一辈子记得。' },
                { who: 'dragon', text: '在素灯上画上我们龙虎的纹样，再题一句吉语——把这一夜的光，留在灯上，也留在心里。' }] }
    ],
    next: ['Workshop']
  }
};


/* 镜头管理：切镜时终止上一镜所有补间与定时器，并清理其对象（包括回调里后生成的对象） */
function shotDirector(scene) {
  const persist = new Set(scene.children.list), events = [];
  const originalAdd = scene.time.addEvent;
  const trackedAdd = cfg => { const e = originalAdd.call(scene.time, cfg); events.push(e); return e; };
  scene.time.addEvent = trackedAdd;
  let busy = false, first = true, serial = 0, alive = true;
  scene.events.once('shutdown', () => { alive = false; if (scene.time.addEvent === trackedAdd) scene.time.addEvent = originalAdd; });
  const killDeep = o => { scene.tweens.killTweensOf(o); if (o.list) o.list.forEach(killDeep); };
  const clean = () => scene.children.list.filter(o => !persist.has(o) && o.depth < 1100).forEach(o => { killDeep(o); o.destroy(); });
  return {
    get busy() { return busy; },
    keep(o) { persist.add(o); return o; },
    cut(build, done) {
      if (busy) return;
      busy = true;
      events.splice(0).forEach(e => e.remove(false));
      let committed = false;
      const replace = image => {
        if (committed || !alive) return;
        committed = true;
        clean(); build();
        if (!image) { busy = false; done && done(); return; }
        const key = `shot-${scene.sys.settings.key}-${Date.now()}-${serial++}`;
        scene.textures.addImage(key, image);
        const still = scene.add.image(W / 2, H / 2, key).setDisplaySize(W, H).setDepth(1340);
        persist.add(still);
        const release = () => { persist.delete(still); still.destroy(); scene.textures.remove(key); };
        scene.events.once('shutdown', release);
        scene.tweens.add({ targets: still, alpha: 0, duration: 750, ease: 'Sine.inOut', onComplete: () => {
          scene.events.off('shutdown', release); release(); busy = false; done && done();
        } });
      };
      if (first) { first = false; replace(null); }
      else {
        try { scene.game.renderer.snapshot(replace); } catch (_) { replace(null); }
        setTimeout(() => replace(null), 400);
      }
    }
  };
}

class StoryScene extends Phaser.Scene {
  constructor() { super('Story'); }
  init(data) { this.story = STORIES[data.id]; this.shot = -1; this.applied = false; }
  create() {
    fadeIn(this, ['dlg']);
    BGM.setMode(this.story === STORIES.D ? 'reflective' : 'festive');
    this.layer = null;
    const top = this.add.container(0, 0).setDepth(1400);
    const g = this.add.graphics(); g.fillStyle(C.ink, 0.8); g.fillRoundedRect(16, 14, this.story.title.length * 22 + 36, 42, 21);
    top.add([g, T(this, 34, 35, this.story.title, 21, '#fbf5a2', { ox: 0, bold: true })]);
    top.add(button(this, W - 110, 36, '跳过本段 ▸▸', () => this.finish(), { w: 180, h: 46, size: 18, fill: C.ink, edge: 0x000000, line: C.magenta }));
    muteButton(this);
    this.director = shotDirector(this);
    this.nextShot();
  }
  nextShot() {
    if (this.director.busy) return;
    this.shot++;
    if (this.shot >= this.story.shots.length) return this.finish();
    const S = this.story.shots[this.shot];
    this.director.cut(() => {
      this.add.image(W / 2, H / 2, S.bg).setDisplaySize(W, H).setDepth(-10);
      S.build && S.build(this);
    }, () => {
      this.time.delayedCall(S.wait ?? 450, () => { if (!this._leaving) this.dlg = dialog(this, S.lines, () => this.nextShot()); });
    });
  }
  finish() {
    if (this._leaving) return;
    if (!this.applied) { this.applied = true; this.story.apply && this.story.apply(); }
    const [k, d] = this.story.next; goTo(this, k, d);
  }
}
