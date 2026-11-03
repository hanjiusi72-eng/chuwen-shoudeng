/* 参考影片的开场与灯坊合入同一页面；音乐沿用全局 BGM，不创建第二条音轨。 */
function mountJourney(scene, html, className) {
  const el = document.createElement('section');
  el.className = 'journey ' + className;
  el.innerHTML = html;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('is-visible'));
  const sound = document.createElement('button');
  sound.className = 'sound'; sound.type = 'button';
  const updateSound = () => {
    sound.textContent = AUDIO.muted ? '♪ ×' : '♪';
    sound.setAttribute('aria-label', AUDIO.muted ? '开启声音' : '关闭声音');
    sound.setAttribute('aria-pressed', String(!AUDIO.muted));
  };
  sound.addEventListener('click', () => { BGM.ensure(); AUDIO.toggleMuted(); updateSound(); });
  updateSound(); el.appendChild(sound);
  if (!window.__OFFLINE_ASSETS) {
    const download = document.createElement('a'); download.className = 'package-link'; download.href = 'download.html'; download.textContent = '下载离线版'; el.appendChild(download);
  }
  scene.events.once('shutdown', () => el.remove());
  return el;
}

function journeyDelay(scene, fn, ms) {
  const cleanup = () => clearTimeout(timer);
  const timer = setTimeout(() => { scene.events.off('shutdown', cleanup); if (scene.sys.isActive()) fn(); }, ms);
  scene.events.once('shutdown', cleanup);
}

class PrologueScene extends Phaser.Scene {
  constructor(key = 'Prologue') { super(key); }
  create() {
    fadeIn(this); BGM.setMode('festive');
    this.add.image(W / 2, H / 2, 'bg_pattern').setDisplaySize(W, H);
    this.page = 0; this.changing = false;
    this.pages = PROLOGUE_PAGES.map(([a, b]) => [a, b]);
    this.el = mountJourney(this, `<button class="quiet skip" type="button">跳过序言 →</button><div class="intro-content"><p class="eyebrow">光亮 · 龙虎灯</p><div class="intro-copy"><h1></h1><p class="verse"></p></div><button class="primary continue" type="button">翻开故事 →</button><p class="progress" aria-live="polite"></p></div><p class="footer">竹篾为骨 · 纸上生光 · 灯火相传</p>`, 'intro');
    this.el.querySelector('.skip').onclick = () => this.begin();
    this.el.querySelector('.continue').onclick = () => this.advance();
    this.showPage();
  }
  showPage() {
    this.el.querySelector('h1').textContent = this.pages[this.page][0];
    this.el.querySelector('.verse').textContent = this.pages[this.page][1];
    this.el.querySelector('.progress').textContent = `0${this.page + 1} / 0${this.pages.length}`;
    this.el.querySelector('.continue').textContent = this.page === this.pages.length - 1 ? '背起药囊，入山去 →' : '继续 →';
  }
  advance() {
    if (this.changing || this._leaving) return;
    BGM.ensure();
    if (this.page === this.pages.length - 1) return this.begin();
    this.changing = true;
    const copy = this.el.querySelector('.intro-copy'); copy.classList.add('changing');
    journeyDelay(this, () => {
      this.page++; this.showPage(); copy.classList.remove('changing'); this.changing = false;
    }, 450);
  }
  begin() {
    if (this._leaving) return;
    this.el.classList.remove('is-visible');
    this.el.style.pointerEvents = 'none';
    journeyDelay(this, () => goTo(this, 'Story', { id: 'prologue' }), 650);
  }
}

class WorkshopScene extends Phaser.Scene {
  constructor() { super('Workshop'); }
  init(data) { this.initialStep = data?.step || 0; }
  create() {
    fadeIn(this); BGM.setMode('reflective');
    this.add.rectangle(W / 2, H / 2, W, H, 0x11130f);
    this.wish = '平安顺遂'; this.ink = '#9d3b32'; this.drawMode = false;
    this.marked = false; this.lit = false; this.turn = 0; this.disposed = false;
    this.el = mountJourney(this, `<header><p class="eyebrow">第五章 · 画灯</p><h1>为这盏灯，落下你的心愿</h1><p class="subhead">同安龙虎灯 · 亲手添彩</p></header><button class="quiet return" type="button">回到故事</button><div class="lantern-stage" role="img" aria-label="可拖动旋转的三维纸灯笼"><div class="lantern-glow"></div></div><article class="chapter-copy"><span class="number"></span><h2></h2><p class="body-copy"></p><div class="craft-list">01 选竹　02 编织　03 裱纸<br>04 绘图寄字　05 添灯油　06 祝福</div></article><div class="controls"></div><nav class="steps" aria-label="画灯步骤"></nav><span class="drag-hint">拖动灯身，慢慢转一圈</span><p class="status" role="status" aria-live="polite"></p>`, 'workshop');
    this.el.querySelector('.return').onclick = () => this.leave();
    const nav = this.el.querySelector('.steps');
    ['走进灯坊', '绘上龙虎', '落下心愿', '灯火相传'].forEach((name, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'step';
      b.innerHTML = `<span>0${i + 1}</span>${name}`;
      b.onclick = () => this.setStep(i); nav.appendChild(b);
    });
    this.makePaper(); this.makeLantern(); this.bindLantern();
    this.setStep(this.initialStep);
    if (this.initialStep === 3) this.stamp('dragon');
    this.events.once('shutdown', () => this.disposeLantern());
  }
  leave() {
    if (this._leaving || this.exiting) return;
    this.exiting = true; this.el.classList.remove('is-visible'); this.el.style.pointerEvents = 'none';
    journeyDelay(this, () => goTo(this, 'Title'), 700);
  }
  makePaper() {
    this.paper = document.createElement('canvas'); this.paper.width = 2048; this.paper.height = 1024;
    this.inkLayer = document.createElement('canvas'); this.inkLayer.width = 2048; this.inkLayer.height = 1024;
    this.paperBase = document.createElement('canvas'); this.paperBase.width = 2048; this.paperBase.height = 1024;
    const c = this.paperBase.getContext('2d'); c.fillStyle = '#ede5c7'; c.fillRect(0, 0, 2048, 1024);
    // 固定种子的纤维纹理，避免刷新后纸面噪点闪烁。
    let seed = 17; const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 15000; i++) {
      c.strokeStyle = random() > .5 ? '#b7a78214' : '#fffdf02b'; c.lineWidth = random() * 1.3 + .2;
      const x = random() * 2048, y = random() * 1024;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + random() * 11, y + random() * 5); c.stroke();
    }
    for (let x = 0; x < 2048; x += 2048 / 24) {
      c.fillStyle = '#b0a07830'; c.fillRect(x, 0, 3, 1024); c.fillStyle = '#fff6d477'; c.fillRect(x + 3, 0, 2, 1024);
    }
    this.refreshPaper();
  }
  refreshPaper() {
    const c = this.paper.getContext('2d'); c.clearRect(0, 0, 2048, 1024); c.drawImage(this.paperBase, 0, 0); c.drawImage(this.inkLayer, 0, 0);
    if (this.step >= 2) {
      c.fillStyle = '#9b302b'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 74px "Songti SC", "Noto Serif CJK SC", serif';
      const chars = Array.from(this.wish || '平安顺遂');
      const size = Math.min(76, 570 / chars.length); c.font = `bold ${size}px "Songti SC", "Noto Serif CJK SC", serif`;
      chars.forEach((ch, i) => c.fillText(ch, 1024, 512 + (i - (chars.length - 1) / 2) * (size + 12)));
      c.strokeStyle = '#9b302b'; c.lineWidth = 3; c.strokeRect(990, 820, 68, 68); c.font = '30px serif'; c.fillText('平安', 1024, 854);
    }
    if (this.paperTexture) this.paperTexture.needsUpdate = true;
  }
  makeLantern() {
    const host = this.el.querySelector('.lantern-stage');
    try {
      const T3 = window.THREE; if (!T3) throw Error('3D runtime unavailable');
      this.lanternRenderer = new T3.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
      this.lanternRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      this.lanternRenderer.outputColorSpace = T3.SRGBColorSpace;
      this.lanternRenderer.setClearColor(0x000000, 0);
      this.world = new T3.Scene(); this.camera3 = new T3.PerspectiveCamera(33, 1, .1, 50); this.camera3.position.set(0, .0, 8.6);
      this.world.add(new T3.AmbientLight(0xf6edcf, 1.6));
      const key = new T3.DirectionalLight(0xffefd2, 2.3); key.position.set(-3, 4, 5); this.world.add(key);
      const rim = new T3.DirectionalLight(0x9eaf9c, 1.1); rim.position.set(3, 1, -2); this.world.add(rim);
      this.group = new T3.Group(); this.group.rotation.y = Math.PI; this.world.add(this.group);
      const points = [];
      // 竹骨撑起的近圆筒灯身：饱满而非光滑球体。
      for (let i = 0; i <= 48; i++) {
        const y = -1.38 + i / 48 * 2.76;
        const r = .57 + .31 * Math.pow(Math.max(0, Math.sin(i / 48 * Math.PI)), .45);
        points.push(new T3.Vector2(r, y));
      }
      this.paperTexture = new T3.CanvasTexture(this.paper); this.paperTexture.colorSpace = T3.SRGBColorSpace;
      this.paperTexture.anisotropy = Math.min(4, this.lanternRenderer.capabilities.getMaxAnisotropy());
      this.paperMaterial = new T3.MeshStandardMaterial({ map: this.paperTexture, roughness: 1, side: T3.DoubleSide, emissive: 0xffd37b, emissiveIntensity: 0 });
      this.bodyMesh = new T3.Mesh(new T3.LatheGeometry(points, 96), this.paperMaterial); this.group.add(this.bodyMesh);
      const bamboo = new T3.MeshStandardMaterial({ color: 0x61704a, roughness: .8 });
      [-1.39, 1.39].forEach(y => {
        const ring = new T3.Mesh(new T3.CylinderGeometry(.58, .58, .085, 48), bamboo); ring.position.y = y; this.group.add(ring);
      });
      const cord = new T3.Mesh(new T3.CylinderGeometry(.014, .014, .25, 8), new T3.MeshStandardMaterial({ color: 0x8f6f35 }));
      cord.position.y = 1.55; this.group.add(cord);
      const loop = new T3.Mesh(new T3.TorusGeometry(.12, .013, 8, 32), bamboo); loop.position.y = 1.72; this.group.add(loop);
      const tassel = new T3.Group(); tassel.position.y = -1.44;
      const gold = new T3.LineBasicMaterial({ color: 0xcaa138, transparent: true, opacity: .92 });
      for (let i = 0; i < 78; i++) {
        const a = i * 2.39996, r = Math.sqrt(i / 78) * .39, x = Math.cos(a) * r, z = Math.sin(a) * r;
        const line = new T3.Line(new T3.BufferGeometry().setFromPoints([new T3.Vector3(x * .66, 0, z * .66), new T3.Vector3(x, -.63 - .08 * Math.sin(i * 1.7), z)]), gold);
        tassel.add(line);
      }
      this.group.add(tassel); this.tassel = tassel;
      this.ray = new T3.Raycaster(); this.pointer3 = new T3.Vector2();
      host.appendChild(this.lanternRenderer.domElement);
    } catch (e) {
      this.lanternRenderer?.dispose(); this.lanternRenderer = null;
      this.fallback = document.createElement('canvas'); host.appendChild(this.fallback);
      this.el.querySelector('.status').textContent = '当前设备使用平面纸灯模式，绘纹、题字和保存仍可使用。';
    }
    this.resizeLantern = () => {
      const r = host.getBoundingClientRect();
      if (this.lanternRenderer) { this.lanternRenderer.setSize(r.width, r.height); this.camera3.aspect = r.width / r.height; this.camera3.updateProjectionMatrix(); }
      else { this.fallback.width = Math.round(r.width * 1.5); this.fallback.height = Math.round(r.height * 1.5); }
    };
    this.observer = new ResizeObserver(this.resizeLantern); this.observer.observe(host); this.resizeLantern();
    this.lastFrame = 0;
    const animate = now => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(animate);
      if (now - this.lastFrame < 32 || document.hidden || !this.sys.isActive()) return;
      this.lastFrame = now;
      if (this.lanternRenderer) {
        this.group.rotation.y = Math.PI + this.turn;
        this.group.rotation.z = Math.sin(now * .00055) * .018;
        this.group.position.y = Math.sin(now * .0007) * .026 + .12;
        this.tassel.rotation.z = Math.sin(now * .0008) * .027;
        this.lanternRenderer.render(this.world, this.camera3);
      } else this.renderFlat();
    };
    this.raf = requestAnimationFrame(animate);
  }
  renderFlat() {
    const c = this.fallback.getContext('2d'), w = this.fallback.width, h = this.fallback.height;
    c.clearRect(0, 0, w, h); const x = w / 2, y = h * .46, rw = Math.min(w * .29, h * .16), rh = h * .30;
    c.save(); c.beginPath(); c.roundRect(x - rw, y - rh, rw * 2, rh * 2, rw * .65); c.clip();
    c.drawImage(this.paper, 650, 0, 748, 1024, x - rw, y - rh, rw * 2, rh * 2);
    const shade = c.createLinearGradient(x - rw, 0, x + rw, 0); shade.addColorStop(0, '#40351a77'); shade.addColorStop(.4, '#fff4cf22'); shade.addColorStop(1, '#40351a88'); c.fillStyle = shade; c.fillRect(x - rw, y - rh, rw * 2, rh * 2);
    if (this.lit) { c.fillStyle = '#ffd36733'; c.fillRect(x - rw, y - rh, rw * 2, rh * 2); }
    c.restore(); c.fillStyle = '#657047'; c.fillRect(x - rw * .6, y - rh - 4, rw * 1.2, 7); c.fillRect(x - rw * .6, y + rh - 3, rw * 1.2, 7);
    c.strokeStyle = '#c6a140'; c.lineWidth = 1;
    for (let i = -30; i <= 30; i++) { c.beginPath(); c.moveTo(x + i * rw / 65, y + rh + 7); c.lineTo(x + i * rw / 50, y + rh + h * .14); c.stroke(); }
  }
  uvAt(event) {
    const canvas = this.lanternRenderer?.domElement || this.fallback, r = canvas.getBoundingClientRect();
    const x = (event.clientX - r.left) / r.width, y = (event.clientY - r.top) / r.height;
    if (this.lanternRenderer) {
      this.pointer3.set(x * 2 - 1, 1 - y * 2); this.ray.setFromCamera(this.pointer3, this.camera3);
      const hit = this.ray.intersectObject(this.bodyMesh)[0];
      return hit ? { x: hit.uv.x * 2048, y: (1 - hit.uv.y) * 1024 } : null;
    }
    // 平面回退采用与 renderFlat 相同的灯身边界，避免在空白区域落笔。
    const w = r.width, h = r.height, rw = Math.min(w * .29, h * .16), rh = h * .30;
    const px = event.clientX - r.left, py = event.clientY - r.top;
    return Math.abs(px - w / 2) <= rw && Math.abs(py - h * .46) <= rh ? { x: 650 + (px - (w / 2 - rw)) / (rw * 2) * 748, y: (py - (h * .46 - rh)) / (rh * 2) * 1024 } : null;
  }
  bindLantern() {
    const host = this.el.querySelector('.lantern-stage'); let down = false, lastX = 0, lastUV = null;
    host.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      down = true; lastX = e.clientX; lastUV = null; host.setPointerCapture(e.pointerId);
      if (this.drawMode && this.step === 1) { lastUV = this.uvAt(e); if (lastUV) this.stroke(lastUV, lastUV); }
    });
    host.addEventListener('pointermove', e => {
      if (!down) return;
      if (this.drawMode && this.step === 1) {
        const uv = this.uvAt(e); if (uv && lastUV && Math.abs(uv.x - lastUV.x) < 350) this.stroke(lastUV, uv); lastUV = uv;
      } else { this.turn += (e.clientX - lastX) * .009; lastX = e.clientX; }
    });
    const end = () => { down = false; lastUV = null; };
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => host.addEventListener(ev, end));
    const canvas = this.lanternRenderer?.domElement || this.fallback; canvas.tabIndex = 0; canvas.setAttribute('aria-label', '灯笼；左右方向键旋转');
    canvas.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); this.turn += e.key === 'ArrowLeft' ? -.18 : .18; } });
  }
  stroke(from, to) {
    const c = this.inkLayer.getContext('2d'); c.strokeStyle = this.ink; c.lineWidth = 9; c.lineCap = 'round';
    c.beginPath(); c.moveTo(from.x, from.y); c.lineTo(to.x + .01, to.y + .01); c.stroke();
    this.marked = true; this.refreshPaper(); this.updateNext();
  }
  stamp(kind) {
    const image = this.textures.get('pattern_' + kind).getSourceImage();
    const c = this.inkLayer.getContext('2d');
    const h = 550, w = Math.min(390, h * image.width / image.height), x = kind === 'dragon' ? 745 : 1303;
    c.drawImage(image, x - w / 2, 220, w, h); this.marked = true; this.refreshPaper(); this.updateNext();
    this.message(kind === 'dragon' ? '龙纹已落在灯面，转一转看看。' : '虎纹已落在灯面，愿它为你守住平安。');
  }
  message(text) { this.el.querySelector('.status').textContent = text; }
  setStep(step) {
    if (step > 1 && !this.marked && this.initialStep !== 3) { this.message('先绘一笔，或选择一幅龙虎纹样。'); return; }
    this.step = Math.max(0, Math.min(3, step)); this.drawMode = false;
    this.el.querySelector('.lantern-stage').classList.remove('drawing'); this.turn = 0;
    const copy = [
      ['从故事，走进灯坊', '村巷里的守灯故事，到了天明告一段落。今日同安的灯坊里，匠人仍以一根竹篾、一张棉纸，将灯做成。现在，轮到你为它添彩。'],
      ['一笔龙虎，一纸心意', '龙虎是守护，也是祝愿。选一幅传统纹样落在灯面，或换上画笔留下自己的线条。拖动旋转，看纸面与竹骨如何相依。'],
      ['把牵挂，写进灯里', '想起一个人、一户人家，或一个小小的愿望。为这盏灯写下八个字以内的心愿，让它随灯火一起留下。'],
      ['灯火相传，岁岁常安', '从采药救人，到守灯护村，一盏灯把人与人连在一起。龙虎护平安，灯火记人情。愿这份手上的温度，在每一次点亮时继续传下去。']
    ][this.step];
    this.el.querySelector('.number').textContent = `0${this.step + 1} / 04`;
    this.el.querySelector('h2').textContent = copy[0]; this.el.querySelector('.body-copy').textContent = copy[1];
    this.el.querySelector('h1').textContent = this.step === 3 ? '灯已成，手艺仍在继续' : '为这盏灯，落下你的心愿';
    this.el.querySelectorAll('.step').forEach((b, i) => { if (i === this.step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    const controls = this.el.querySelector('.controls');
    const next = '<button type="button" class="primary next"></button>';
    if (this.step === 0) controls.innerHTML = '<p class="control-title">一盏灯 · 六道手艺</p><p class="hint">竹篾撑起形，棉纸托住光。<br>把鼠标或手指放在灯上，拖动转一圈。</p>' + next;
    if (this.step === 1) controls.innerHTML = '<p class="control-title">在纸上，留下你的笔迹</p><div class="tools"><button type="button" class="tool" data-stamp="dragon">落下龙纹</button><button type="button" class="tool" data-stamp="tiger">落下虎纹</button></div><div class="tools"><button type="button" class="tool mode" data-mode="rotate" aria-pressed="true">旋转</button><button type="button" class="tool mode" data-mode="draw" aria-pressed="false">画笔</button><button type="button" class="tool clear">重画</button></div><p class="hint">选择纹样，或切换画笔直接画在灯面。<br>至少留下一笔，再继续题字。</p>' + next;
    if (this.step === 2) controls.innerHTML = '<label for="lamp-wish">把一句心愿，留在灯上</label><input id="lamp-wish" type="text" maxlength="8" autocomplete="off" spellcheck="false" aria-label="灯上心愿，最多八个字"><div class="tools" style="margin-top:16px"><button type="button" class="tool" data-wish="平安顺遂">平安顺遂</button><button type="button" class="tool" data-wish="长乐安康">长乐安康</button><button type="button" class="tool" data-wish="灯火长明">灯火长明</button></div><p class="hint">八字以内，写给自己，也写给惦记的人。</p>' + next;
    if (this.step === 3) controls.innerHTML = '<p class="control-title">这盏灯，属于你</p><p class="final-wish"></p><button type="button" class="primary save">保存我的灯 ↓</button><button type="button" class="tool light-toggle" aria-pressed="true">熄灯看看</button><br><button type="button" class="quiet back">再添几笔 →</button><p class="credits">传统纹样，新的心愿。<br>愿每一次点亮，都有人记得，有人等你回家。</p>';
    controls.querySelectorAll('[data-stamp]').forEach(b => b.onclick = () => this.stamp(b.dataset.stamp));
    controls.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => {
      this.drawMode = b.dataset.mode === 'draw'; this.el.querySelector('.lantern-stage').classList.toggle('drawing', this.drawMode);
      controls.querySelectorAll('[data-mode]').forEach(t => t.setAttribute('aria-pressed', String(t === b)));
      this.el.querySelector('.drag-hint').textContent = this.drawMode ? '在灯面上按住描画 · 旋转模式可换面' : '拖动灯身，慢慢转一圈';
    });
    const clear = controls.querySelector('.clear'); if (clear) clear.onclick = () => { this.inkLayer.getContext('2d').clearRect(0, 0, 2048, 1024); this.marked = false; this.refreshPaper(); this.updateNext(); this.message('纸面已清空，重新落笔吧。'); };
    const input = controls.querySelector('input');
    const changeWish = value => { this.wish = Array.from(value).slice(0, 8).join(''); input.value = this.wish; this.refreshPaper(); };
    if (input) { input.value = this.wish; input.addEventListener('input', () => { if (Array.from(input.value).length <= 8) { this.wish = input.value; this.refreshPaper(); } }); input.addEventListener('blur', () => changeWish(input.value)); }
    controls.querySelectorAll('[data-wish]').forEach(b => b.onclick = () => changeWish(b.dataset.wish));
    const advance = controls.querySelector('.next'); if (advance) advance.onclick = () => this.setStep(this.step + 1);
    const save = controls.querySelector('.save'); if (save) save.onclick = () => this.saveLamp();
    const back = controls.querySelector('.back'); if (back) back.onclick = () => this.setStep(1);
    const light = controls.querySelector('.light-toggle'); if (light) light.onclick = () => {
      this.setLit(!this.lit); light.textContent = this.lit ? '熄灯看看' : '点亮这盏灯'; light.setAttribute('aria-pressed', String(this.lit));
    };
    const finalWish = controls.querySelector('.final-wish'); if (finalWish) finalWish.textContent = '「' + (this.wish || '平安顺遂') + '」';
    this.setLit(this.step === 3); this.refreshPaper(); this.updateNext();
    this.el.querySelector('.drag-hint').textContent = '拖动灯身，慢慢转一圈';
    this.message('');
  }
  setLit(on) { this.lit = on; this.el.classList.toggle('lit', on); if (this.paperMaterial) this.paperMaterial.emissiveIntensity = on ? .48 : 0; }
  updateNext() {
    const next = this.el?.querySelector('.next'); if (!next) return;
    next.textContent = ['开始画灯 →', '为灯题字 →', '点亮这盏灯 →'][this.step];
    next.disabled = this.step === 1 && !this.marked;
  }
  saveLamp() {
    try {
      if (this.lanternRenderer) this.lanternRenderer.render(this.world, this.camera3); else this.renderFlat();
      const out = document.createElement('canvas'); out.width = 1600; out.height = 1200;
      const c = out.getContext('2d'), gradient = c.createRadialGradient(800, 500, 20, 800, 500, 850);
      gradient.addColorStop(0, '#343527'); gradient.addColorStop(1, '#10130f'); c.fillStyle = gradient; c.fillRect(0, 0, 1600, 1200);
      const source = this.lanternRenderer?.domElement || this.fallback, h = 920, w = source.width / source.height * h;
      c.drawImage(source, 800 - w / 2, 55, w, h); c.textAlign = 'center'; c.fillStyle = '#ead7a3';
      c.font = '42px "Songti SC", serif'; c.fillText('「' + (this.wish || '平安顺遂') + '」', 800, 1050);
      c.font = '19px "Songti SC", serif'; c.fillStyle = '#afa78c'; c.fillText('光亮 · 龙虎灯    一盏灯，照见人间', 800, 1112);
      const a = document.createElement('a'); a.download = '我的龙虎灯.png'; a.href = out.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove();
      this.message('灯已存成一张图片，愿这份心意常在。');
    } catch (_) { this.message('当前浏览器未能保存图片，请换用 Chrome 或 Safari 再试。'); }
  }
  disposeLantern() {
    this.disposed = true; cancelAnimationFrame(this.raf); this.observer?.disconnect();
    if (this.world) {
      const materials = new Set();
      this.world.traverse(o => { o.geometry?.dispose(); if (o.material) materials.add(o.material); });
      materials.forEach(m => m.dispose());
    }
    this.paperTexture?.dispose(); this.lanternRenderer?.dispose(); this.lanternRenderer?.forceContextLoss();
  }
}
