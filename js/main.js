/* 启动 + 横竖屏检测（竖持暂停，横持恢复） */
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W, height: H,
  backgroundColor: '#2a0f2e',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 3 },
  render: { antialias: true, roundPixels: false },
  scene: [BootScene, TitleScene, PrologueScene, WorkshopScene, StoryScene, ActScene, ForageScene, MedicineScene, MarketScene, CraftScene, DefenseScene, DecorateScene, EndingScene, FinishScene]
});

window.game = game;

(function orientationGuard() {
  const el = document.getElementById('rotate');
  let paused = [];
  const isTouch = () => matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  const check = () => {
    const portrait = isTouch() && window.innerHeight > window.innerWidth;
    if (portrait && !paused.length) {
      el.style.display = 'flex';
      paused = game.scene.getScenes(true);
      paused.forEach(s => {
        s.input && s.input.manager && s.input.manager.pointers.forEach(p => p.isDown && s.input.emit('gameout'));
        s.scene.pause();
      });
    } else if (!portrait && paused.length) {
      el.style.display = 'none';
      paused.forEach(s => s.scene.resume());
      paused = [];
      setTimeout(() => game.scale.refresh(), 60);
    }
  };
  window.addEventListener('resize', check);
  window.addEventListener('orientationchange', () => setTimeout(check, 120));
  setTimeout(check, 300);
})();
