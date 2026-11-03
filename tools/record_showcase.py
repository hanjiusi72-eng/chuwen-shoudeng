"""Capture real revised-game interactions; output remains outside the checkout.
Requires an already running static server on port 8686 and Python Playwright.
Chapter jumps prepare scenes; all featured playing uses pointer events.
"""
from pathlib import Path
import base64,json
from playwright.sync_api import sync_playwright
OUT=Path('/workspace/scratch/chuwen-revision/capture');OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1334,'height':750});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8686/');page.wait_for_function('window.game?.scene.isActive("Title")');page.wait_for_timeout(900)
 def jump(scene,data=None,setup=''):
  page.evaluate('''({key,data,setup})=>{game.scene.getScenes(true).forEach(s=>game.scene.stop(s.scene.key));if(setup)(0,eval)(setup);game.scene.start(key,data||{});}''',{'key':scene,'data':data,'setup':setup})
  page.wait_for_function('(key)=>game.scene.isActive(key)',arg=scene);page.wait_for_timeout(1100)
 def begin():
  page.evaluate('''()=>{window.__chunks=[];const s=game.canvas.captureStream(24);window.__rec=new MediaRecorder(s,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:7000000});__rec.ondataavailable=e=>__chunks.push(e.data);__rec.start(500);
  const scene=game.scene.getScenes(true)[0];scene.input.on('pointerdown',p=>{const g=scene.add.graphics().setDepth(5000);g.lineStyle(3,0xfff8d0,1);g.strokeCircle(0,0,21);g.fillStyle(0xff00c8,.4);g.fillCircle(0,0,9);g.setPosition(p.x,p.y);scene.tweens.add({targets:g,scale:1.9,alpha:0,duration:650,onComplete:()=>g.destroy()})});}''')
 def end(name):
  d=page.evaluate('''async()=>{await new Promise(r=>{__rec.onstop=r;__rec.stop()});__rec.stream.getTracks().forEach(t=>t.stop());const blob=new Blob(__chunks,{type:'video/webm'});return await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result.split(',')[1]);f.readAsDataURL(blob)});}''')
  (OUT/(name+'.webm')).write_bytes(base64.b64decode(d));page.screenshot(path=str(OUT/(name+'.png')));print('CAPTURE',name,flush=True)
 def dismiss(n=5):
  for _ in range(n):page.mouse.click(760,680);page.wait_for_timeout(160)
 def drag(x,y,a,b,steps=24,wait=500):
  page.mouse.move(x,y);page.wait_for_timeout(120);page.mouse.down();page.mouse.move(a,b,steps=steps);page.wait_for_timeout(150);page.mouse.up();page.wait_for_timeout(wait)
 begin();page.wait_for_timeout(4000);end('title')
 jump('Story',{'id':'prologue'});begin();page.wait_for_timeout(4500);end('prologue')
 page.evaluate('game.scene.getScene("Story").nextShot()');page.wait_for_timeout(1400);begin();page.wait_for_timeout(3500);end('village')
 jump('Forage',setup='G.reset()');begin();page.mouse.click(1220,668);page.wait_for_timeout(4200);page.mouse.click(1220,668);page.wait_for_timeout(4200);end('forage')
 jump('Medicine',{'mode':'effects'},'G.reset()');dismiss();begin()
 cards=page.evaluate('(()=>{const s=game.scene.getScene("Medicine");return s.fxR().herbs.map(id=>s.rack[id].home)})()')
 for c in cards:drag(c['x'],c['y'],800,565)
 page.wait_for_function('game.scene.getScene("Medicine").fxPhase==="mud"');page.wait_for_timeout(1400)
 xy=page.evaluate('(()=>{const o=game.scene.getScene("Medicine").mud;return {x:o.x,y:o.y}})()')
 page.screenshot(path=str(OUT/'medicine-pearl.png'));drag(xy['x'],xy['y'],470,560);page.wait_for_function('G.effectsDone.size===1');page.wait_for_timeout(700);end('medicine')
 jump('Craft',setup='G.reset();G.carpenterRescued=G.craftUnlocked=true');dismiss();begin()
 for part in ['ring','ribs','paper','wick','oil']:
  state=page.evaluate('(id)=>{const s=game.scene.getScene("Craft"),o=s.parts[id];return {x:o.x,y:o.y,step:s.step}}',part)
  drag(state['x'],state['y'],660,420,wait=950 if part!='oil' else 2000)
 page.wait_for_timeout(600);end('craft')
 jump('Defense',setup='G.reset();G.lampCrafted=true;G.tutorialSeen=true');page.mouse.click(667,540);page.wait_for_timeout(500)
 # Start panel has its normal real pointer button; use UI position from scene text.
 if page.evaluate('game.scene.getScene("Defense").mode')!='run':
  pos=page.evaluate('(()=>{const s=game.scene.getScene("Defense");let out=null;const walk=o=>{if(o.text?.includes("开始守夜")){const b=o.getBounds();out={x:b.centerX,y:b.centerY}};o.list?.forEach(walk)};s.children.list.forEach(walk);return out})()')
  if pos:page.mouse.click(pos['x'],pos['y']);page.wait_for_timeout(400)
 begin();drag(660,420,370,375,wait=900);drag(370,375,740,290,wait=1200);drag(740,290,840,490,wait=1000);page.wait_for_timeout(1400);end('defense')
 assert not errors,errors
 (OUT/'recording.json').write_text(json.dumps({'pageErrors':errors,'capture':'Real revised Phaser game; chapter setup uses debug state; playing uses actual pointer events; edited montage, not an uninterrupted full playthrough.'},ensure_ascii=False,indent=2))
 b.close()
