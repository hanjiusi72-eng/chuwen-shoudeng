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
    title: '序章 · 药香里的相逢',
    shots: [
      { bg: 'bg_pattern', build(s) { actor(s, 'char_baosheng', W / 2, H + 10, 640, 'up'); },
        lines: [{ who: 'narr', text: '白礁的清晨，总有一缕药香先醒来。医者吴夲守着这间小药房，谁敲门，他都应一声“来了”。后来，人们唤他保生大帝。' },
                { who: 'wu', text: '徒儿，把炉火拨暖些。今早的两位来客，走了好远的路。' }] },
      { bg: 'bg_pharmacy', build(s) {
          s.add.rectangle(W / 2, H / 2, W, H, 0x2a1030, 0.35);
          const t = actor(s, 'char_tiger', W - 300, H + 40, 640, 'right'); const d = actor(s, 'char_dragon', 280, H + 40, 640, 'left');
          s.time.delayedCall(1000, () => { bobbing(s, t, 6); bobbing(s, d, 6, 1900); });
        },
        lines: [{ who: 'narr', text: '门外的白额虎不敢作声，青龙扶着门框，眯眼寻找光亮。平日威风的他们，此刻也只是盼着有人帮一把的来客。' },
                { who: 'wu', text: '别急，先随我上山采药。药书里的每一味草木，到了手心，才有了温度。' },
                { who: 'me', text: '我去背药篓。两位别怕，我们很快就回来。' }] }
    ],
    next: ['Act', { act: 1 }]
  },
  A: {
    title: '山下 · 有人在等我们',
    shots: [
      { bg: 'bg_village', build(s) {
          s.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.18);
          actor(s, 'char_dragon', 300, H + 40, 600, 'left'); actor(s, 'char_tiger', W - 320, H + 40, 600, 'right');
        },
        lines: [{ who: 'tiger', text: '终于能好好说声谢谢了！等你好久，这句谢可把我憋坏了。' },
                { who: 'dragon', text: '我又看得见山下的路了。只是从前那条热闹的巷子，如今连炊烟都稀了。' },
                { who: 'tiger', text: '那里有人等着汤药，也等着一声问候。走吧，这回换我们陪你。' }] },
      { bg: 'bg_pattern', build(s) {
          s.add.rectangle(W / 2, H / 2, W, H, 0x14164a, 0.55);
          panel(s, 90, 90, 500, 400, { fill: C.cream, stroke: C.magenta, lw: 5 });
          T(s, 340, 124, '药 书', 24, '#9a0078', { bold: true });
          const b = s.add.image(340, 300, 'book_slips').setScale(0.44).setAlpha(0); s.tweens.add({ targets: b, alpha: 1, duration: 600 });
          VT(s, 340 + 190, 175, '舒喉化骨汤', 24, '#1a0a30', { oy: 0, bold: true });
          panel(s, 640, 90, 600, 400, { fill: C.cream, stroke: C.blue, lw: 5 });
          T(s, 940, 124, '采 购 线 索', 24, '#004dfc', { bold: true });
          [['herb_huoxiang', '草药', 0.5], ['bamboo', '竹篾', 1.3], ['paperstack', '棉纸', 1.2], ['jar', '灯油灯芯', 1.2]].forEach(([k, n, sc], i) => {
            const x = 720 + i * 147, y = 290;
            const im = s.add.image(x, y, k).setScale(sc).setAlpha(0);
            const t = T(s, x, y + 80, n, 20, '#2a1030', { bold: true }).setAlpha(0);
            s.tweens.add({ targets: [im, t], alpha: 1, duration: 500, delay: 400 + i * 250 });
          });
        },
        lines: [{ who: 'dragon', text: '这本药书贴身收好。到了村里，咱们一户一户去问，一炉一炉地煎。' },
                { who: 'tiger', text: '顺路去市集添些草药，再捎上竹篾、棉纸和灯油。别让乡亲们在黑里等。' }] },
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
        lines: [{ who: 'dragon', text: '这盏素灯，你先提着。夜路不好走，有一点亮，心就不慌。' },
                { who: 'tiger', text: '传说灯火和鼓声能赶走疫鬼。真起了风，我们就一起护着它，谁也不落下。' }] }
    ],
    next: ['Act', { act: 2 }]
  },
  B: {
    title: '陈伯家 · 把暖意送到门前',
    apply() { G.carpenterRescued = true; G.craftUnlocked = true; },
    shots: [
      { bg: 'bg_village', build(s) {
          s.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0.18);
          // 陈伯从出场到离场始终直立；本镜头不再出现龙虎、病症或倒地动画。
          const cp = actor(s, 'char_elder', W / 2, 568, 465, 'fade');
          cp.setName('standing-carpenter');
          const glow = s.add.image(W / 2, 570, 'glow').setTint(0xffd070).setScale(1.4).setAlpha(0.35).setDepth(-1);
          s.tweens.add({ targets: glow, alpha: 0.55, yoyo: true, repeat: -1, duration: 1600 });
        },
        lines: [{ who: 'narr', text: '陈伯的门虚掩着，没做完的灯架搁在窗边。你把温热的药送进屋，他站在门前，连声招呼你歇歇脚。' },
                { who: 'carp', text: '这一趟山路，辛苦你了。喝过药，身子舒坦多了。来，进屋坐，别总在风里站着。' }] },
      { bg: 'bg_pattern', build(s) {
          actor(s, 'char_elder', 360, H + 40, 640, 'left');
          const glow = s.add.image(W - 380, 320, 'glow').setScale(2).setTint(0xfff3b0); s.add.image(W - 380, 320, 'lantern_white').setScale(1.5);
          s.tweens.add({ targets: glow, alpha: 0.5, yoyo: true, repeat: -1, duration: 900 });
        },
        lines: [{ who: 'carp', text: '我做了一辈子木活，最爱看灯亮起来的那一下。你送我一炉暖，我也教你扎一盏灯。' },
                { who: 'carp', text: '灯架就在桌上。咱们慢慢来，把这份暖，送到每一家门前。' }] }
    ],
    next: ['Craft']
  },
  C: {
    title: '入夜 · 一家一盏灯',
    apply() { G.lampCrafted = true; },
    shots: [
      { bg: 'bg_pattern', build(s) {
          const main = s.add.image(W / 2, 300, 'lantern_white').setScale(1.4);
          for (let i = 0; i < 10; i++) {
            const x = 140 + (i % 5) * 262, y = i < 5 ? 150 : 520;
            const l = s.add.image(x, y, 'lantern_white').setScale(0).setAngle(Phaser.Math.Between(-8, 8));
            s.tweens.add({ targets: l, scale: 0.7, duration: 400, delay: 600 + i * 260, ease: 'Back.out' });
          }
          s.tweens.add({ targets: main, angle: { from: -3, to: 3 }, yoyo: true, repeat: -1, duration: 1200 });
        },
        lines: [{ who: 'narr', text: '陈伯的桌边渐渐坐满了人。有人递竹篾，有人抹浆糊，连平日怕生的孩子，也捧着棉纸来搭把手。' }] },
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
        lines: [{ who: 'narr', text: '药送进屋，灯挂上檐。巷口又响起了招呼声：“你家灯亮了？亮了，快进来喝口热的。”' }] },
      { bg: 'bg_village', build(s) {
          const night = s.add.image(W / 2, H / 2, 'bg_village_night').setDisplaySize(W, H).setAlpha(0);
          s.tweens.add({ targets: night, alpha: 1, duration: 1500 });
          VILLAGE_LAMPS.forEach(p => { const gl = s.add.image(p.x, p.y, 'glow').setTint(0xffd040).setScale(0.9).setAlpha(0.85); s.add.image(p.x, p.y, 'lantern_lit').setScale(0.42); s.tweens.add({ targets: gl, alpha: 0.4, yoyo: true, repeat: -1, duration: 300 + Math.random() * 400 }); });
          const god = s.add.image(W / 2 + 260, H + 40, 'wenshen').setOrigin(0.5, 1).setScale(680 / 1484).setAlpha(0);
          s.tweens.add({ targets: god, alpha: 1, y: H + 20, duration: 1400, delay: 800, ease: 'Cubic.out' });
          s.tweens.add({ targets: god, angle: { from: -1.5, to: 1.5 }, yoyo: true, repeat: -1, duration: 1300, delay: 2200 });
          for (let i = 0; i < 6; i++) { const gh = s.add.image(-60, 200 + i * 70, 'ghost').setScale(0.32); s.tweens.add({ targets: gh, x: W + 80, duration: 5000, delay: 1200 + i * 500 }); }
        },
        lines: [{ who: 'narr', text: '夜深了，风从山口压下来。传说中的疫鬼藏进雾里，一盏灯晃了晃，隔壁的门却立刻开了。' },
                { who: 'tiger', text: '我在这儿！你护灯，青龙拨开雾，我来敲鼓。只要还有一盏亮着，咱们就找得到彼此。' }] }
    ],
    next: ['Act', { act: 3 }]
  },
  D: {
    title: '天明 · 人间又逢春',
    shots: [
      { bg: 'bg_village', build(s) {
          const night = s.add.image(W / 2, H / 2, 'bg_village_night').setDisplaySize(W, H);
          s.tweens.add({ targets: night, alpha: 0, duration: 2600 });
          VILLAGE_LAMPS.forEach(p => { s.add.image(p.x, p.y, 'glow').setTint(0xffd040).setScale(0.9).setAlpha(0.6); s.add.image(p.x, p.y, 'lantern_lit').setScale(0.42); });
          const god = s.add.image(W / 2 + 260, H + 20, 'wenshen').setOrigin(0.5, 1).setScale(680 / 1484);
          s.tweens.add({ targets: god, y: -40, alpha: 0, duration: 2200, delay: 400, ease: 'Cubic.in' });
          for (let i = 0; i < 5; i++) { const gh = s.add.image(400 + i * 120, 300 + (i % 2) * 80, 'ghost').setScale(0.38); s.tweens.add({ targets: gh, y: -120, alpha: 0, duration: 1600, delay: 300 + i * 150, ease: 'Cubic.in' }); }
        },
        lines: [{ who: 'narr', text: '第一声鸡鸣穿过薄雾，天边泛起暖色。谁家的灯歪了，邻居就扶一扶；谁家还没开门，就有人轻轻喊一声。' }] },
      { bg: 'bg_pattern', build(s) {
          actor(s, 'char_elder', W / 2, H + 40, 600, 'up');
          actor(s, 'char_dragon', 200, H + 40, 560, 'left'); actor(s, 'char_tiger', W - 200, H + 40, 560, 'right');
        },
        lines: [{ who: 'carp', text: '守到天亮才知道，撑住这条巷子的，不只是灯架，是一双双没有松开的手。' },
                { who: 'dragon', text: '在灯上画些纹样吧，再写一句你最想留给大家的话。来年看到它，就会想起今夜。' }] }
    ],
    next: ['Act', { act: 4 }]
  }
};


/* 镜头管理：切镜时终止上一镜所有补间与定时器，并清理其对象（包括回调里后生成的对象） */
function shotDirector(scene) {
  const persist = new Set(scene.children.list);
  const events = [];
  const add = scene.time.addEvent.bind(scene.time);
  scene.time.addEvent = cfg => { const e = add(cfg); events.push(e); return e; };
  const cover = scene.add.rectangle(W / 2, H / 2, W, H, 0x14061c, 0).setDepth(1350);
  persist.add(cover);
  const killDeep = o => { scene.tweens.killTweensOf(o); if (o.list) o.list.forEach(killDeep); };
  return {
    keep(o) { persist.add(o); return o; },
    cut(build, done) {
      events.splice(0).forEach(e => e.remove(false));
      scene.tweens.add({ targets: cover, fillAlpha: 1, duration: 220, onComplete: () => {
        scene.children.list.filter(o => !persist.has(o) && o.depth < 1100).forEach(o => { killDeep(o); o.destroy(); });
        build();
        scene.tweens.add({ targets: cover, fillAlpha: 0, duration: 320, onComplete: () => done && done() });
      } });
    }
  };
}

class StoryScene extends Phaser.Scene {
  constructor() { super('Story'); }
  init(data) { this.story = STORIES[data.id]; this.shot = -1; this.applied = false; }
  create() {
    fadeIn(this, ['dlg']);
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
    this.shot++;
    if (this.shot >= this.story.shots.length) return this.finish();
    const S = this.story.shots[this.shot];
    this.director.cut(() => {
      this.add.image(W / 2, H / 2, S.bg).setDisplaySize(W, H).setDepth(-10);
      S.build && S.build(this);
    }, () => {
      this.time.delayedCall(S.wait ?? 450, () => { if (!this._leaving) this.dlg = dialog(this, S.lines, () => this.nextShot(), { portraits: this.story !== STORIES.B }); });
    });
  }
  finish() {
    if (this._leaving) return;
    if (!this.applied) { this.applied = true; this.story.apply && this.story.apply(); }
    const [k, d] = this.story.next; goTo(this, k, d);
  }
}
