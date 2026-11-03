/* 掷骰采药：每次沿蛇形山路前行，沿途药材入篓；走到终点即可入药房。 */
class GatherScene extends Phaser.Scene {
  constructor() { super('Gather'); }
  create() {
    fadeIn(this);
    this.busy = false;
    this.position = G.gatherPosition;
    this.route = [null, ...HERBS.map(h => h.id), 'dragon', 'tiger'];
    this.add.image(W / 2, H / 2, 'bg_pattern').setDisplaySize(W, H);
    this.hud = hud(this, '山间寻香', '掷一枚骰子，让药香带我们找到回家的路');
    const g = this.add.graphics();
    g.fillStyle(C.cream); g.fillRoundedRect(28, 92, 1080, 590, 34);
    g.lineStyle(5, C.magenta); g.strokeRoundedRect(28, 92, 1080, 590, 34);
    g.fillStyle(C.blue); g.fillRoundedRect(43, 107, 1050, 560, 26);
    g.fillStyle(C.white, 0.85);
    for (let y = 120; y < 660; y += 19) for (let x = 58; x < 1090; x += 19) g.fillCircle(x, y, 2.7);
    this.points = this.route.map((_, i) => {
      const row = Math.floor(i / 5), col = row % 2 ? 4 - i % 5 : i % 5;
      return { x: 155 + col * 205, y: 205 + row * 180 };
    });
    g.lineStyle(9, C.pink); g.beginPath();
    this.points.forEach((p,i) => i ? g.lineTo(p.x,p.y) : g.moveTo(p.x,p.y)); g.strokePath();
    this.tileMarks = [];
    this.route.forEach((id, i) => {
      const p = this.points[i];
      panel(this, p.x - 68, p.y - 67, 136, 134, { fill: C.cream, stroke: C.magenta, lw: 4, r: 16, shadow: false });
      const key = !id ? 'char_baosheng' : (id === 'tiger' || id === 'dragon') ? 'card_' + id : 'plant_' + id;
      const im = this.add.image(p.x, p.y - 8, key); im.setScale(Math.min(105 / im.width, 94 / im.height));
      T(this,p.x,p.y+48, !id ? '白礁 · 出发' : HERB[id]?.name || (id === 'dragon' ? '青龙等候' : '药房到了'),15,'#9a0078',{bold:true});
      const mark = T(this,p.x+52,p.y-49,'✓',21,'#118a5a',{bold:true}).setVisible(G.gathered.has(id));
      this.tileMarks.push(mark);
    });
    panel(this,1128,94,184,588,{fill:C.ink,stroke:C.cream,lw:3,r:24});
    T(this,1220,132,'掷骰 · 寻香',21,'#fbf5a2',{bold:true});
    this.dice = this.add.image(1220,227,'dice1').setDisplaySize(112,112).setInteractive({useHandCursor:true});
    this.dice.on('pointerup',()=>this.roll());
    this.rollButton = button(this,1220,330,'掷骰子',()=>this.roll(),{w:154,h:54,size:21});
    this.count = T(this,1220,403,'',20,'#fbf5a2',{bold:true,wrap:158,align:'center'});
    this.hint = T(this,1220,469,'走过的草药\n都会收入药篓',16,'#ffffff',{wrap:154,align:'center',lineSpacing:10});
    this.nextButton = button(this,1220,601,'回药房',()=>this.finish(),{w:154,h:54,size:20,fill:C.green,edge:0x118a5a});
    this.marker = this.add.image(this.points[this.position].x,this.points[this.position].y-77,'lantern_lit').setDisplaySize(35,46).setDepth(30);
    this.ring = this.add.graphics().setDepth(25);
    T(this,568,712,'山路虽远，有人同行。一味一味采来的，是递给来客的安心。',19,'#fff8d0',{stroke:'#6a0050',strokeThickness:3});
    this.refresh(); muteButton(this);
    this.time.delayedCall(400,()=>dialog(this,[
      {who:'wu',text:'山里草木都有自己的时节。趁着晨露，陪我去采一篓药吧。'},
      {who:'wu',text:'点一下骰子，沿着山路走。经过的草药都替你收好，走到药房，就能给龙虎煎药了。'}
    ]));
  }
  refresh() {
    this.count.setText('药篓里的心意\n'+G.gathered.size+' / 12 味');
    const end=this.position===14;
    this.rollButton.setEnabled(!end&&!this.busy);
    this.nextButton.setEnabled(end&&!this.busy);
    this.dice.disableInteractive();
    if(!end&&!this.busy)this.dice.setInteractive({useHandCursor:true});
    const p=this.points[this.position];
    this.ring.clear().lineStyle(5,C.yellow).strokeRoundedRect(p.x-75,p.y-74,150,148,20);
    this.hud.setStep(end?'药香满篓':'山路 '+this.position+' / 14');
    if(end) { G.gatheringDone=true; this.hint.setText('药香装满了篓\n龙虎在药房等你');this.hud.setObjective('一篓草药，带回十二份山间的心意'); }
  }
  roll() {
    if(this.busy||this.position>=14||this.children.list.some(o=>o.depth===1200))return;
    this.busy=true;this.refresh();SFX.page();
    this.tweens.add({targets:this.dice,angle:360,scaleX:this.dice.scaleX*0.85,scaleY:this.dice.scaleY*0.85,duration:450,yoyo:true,onComplete:()=>this.dice.setAngle(0)});
    let frame=0;
    this.time.addEvent({delay:65,repeat:9,callback:()=>this.dice.setTexture('dice'+(frame++%6+1))});
    this.time.delayedCall(920,()=>{
      const n=Phaser.Math.Between(1,6);this.lastRoll=n;this.dice.setTexture('dice'+n);
      this.hint.setText('掷出 '+n+' 点\n沿山路向前走');SFX.drop();
      this.walk(Math.min(n,14-this.position));
    });
  }
  walk(left) {
    if(!left){this.busy=false;this.refresh();if(this.position===14){SFX.ok();sparkle(this,this.marker.x,this.marker.y,C.yellow,20);}return;}
    this.position++; G.gatherPosition=this.position;
    const p=this.points[this.position];
    this.tweens.add({targets:this.marker,x:p.x,y:p.y-77,duration:320,ease:'Sine.inOut',onComplete:()=>{
      const id=this.route[this.position];
      if(HERB[id]){G.gathered.add(id);this.tileMarks[this.position].setVisible(true);sparkle(this,p.x,p.y,C.yellow,6);SFX.drop();}
      this.refresh();this.time.delayedCall(160,()=>this.walk(left-1));
    }});
  }
  finish(){if(this.busy||!G.gatheringDone)return;goTo(this,'Medicine',{mode:'tiger'});}
}
