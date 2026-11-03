from pathlib import Path
import json
from playwright.sync_api import sync_playwright
out=Path('/tmp/chuwen-revision-validation');out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
 page=b.new_page(viewport={'width':1334,'height':750});errors=[];failed=[];checks=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:failed.append({'status':r.status,'url':r.url}) if r.status>=400 else None)
 page.goto('http://127.0.0.1:8686/');page.wait_for_function('window.game?.scene.isActive("Title")');page.wait_for_timeout(900)
 page.evaluate('game.scene.stop("Title");game.scene.start("Story",{id:"prologue"})');page.wait_for_function('game.scene.isActive("Story")');page.wait_for_function('game.scene.getScene("Story").children.list.some(o=>o.texture?.key==="char_baosheng")')
 assert page.evaluate('STORIES.prologue.shots[0].bg')=='bg_pattern'
 assert page.evaluate('game.scene.getScene("Story").children.list.some(o=>o.texture?.key==="char_baosheng" && Math.abs(o.displayHeight-750)<1)')
 page.screenshot(path=str(out/'01-prologue.png'));checks.append('序章使用原始粉红几何纹样和满高人物')
 page.evaluate('game.scene.getScene("Story").nextShot()');page.wait_for_timeout(1300)
 assert page.evaluate('game.scene.getScene("Story").shot')==1
 assert page.evaluate('STORIES.prologue.shots[1].bg')=='bg_village'
 page.screenshot(path=str(out/'02-village.png'));checks.append('村庄使用原始明亮背景，无旧暗色蒙版')
 page.evaluate('game.scene.stop("Story");G.reset();game.scene.start("Forage")');page.wait_for_timeout(1400)
 assert not page.evaluate('game.scene.getScene("Forage").children.list.some(o=>o.depth===1200)')
 positions=page.evaluate('Array.from({length:15},(_,i)=>cellPos(i))')
 assert len(positions)==15 and all(80<p['x']<1250 and 80<p['y']<640 for p in positions)
 page.screenshot(path=str(out/'03-forage.png'));checks.append('采药棋盘15格完整，初次进入不弹遮挡棋盘的对白')
 page.mouse.click(1220,668);page.wait_for_function('G.foragePos>0 && !game.scene.getScene("Forage").walking')
 pos=page.evaluate('G.foragePos');assert 1<=pos<=6 and page.evaluate('G.forageGot.length')==pos
 checks.append('真实点击骰子后棋子按骰面前进并沿途采药')
 page.evaluate('(()=>{const s=game.scene.getScene("Forage"),p=cellPos(7);G.foragePos=7;s.token.setPosition(p.x,p.y+38)})()')
 page.mouse.click(1220,668);page.wait_for_function('G.foragePos===8');page.wait_for_timeout(1800)
 assert page.evaluate('game.scene.getScene("Forage").children.list.some(o=>o.depth===1200)');checks.append('第7格掷骰在第8格遇虎，保留剧情')
 assert not errors,errors
 assert not failed,failed
 checks+=['浏览器无未捕获异常','本地素材HTTP全部成功']
 (out/'web-checks.json').write_text(json.dumps({'checks':checks,'errors':errors,'assetFailures':failed},ensure_ascii=False,indent=2));print(json.dumps(checks,ensure_ascii=False));b.close()
