"""Exercise reference-film flow, live lantern tools, continuous audio and downloads."""
from pathlib import Path
import json, struct
from playwright.sync_api import sync_playwright
OUT=Path('/tmp/chuwen-journey-validation');OUT.mkdir(exist_ok=True)
checks=[]
def passed(label):
 checks.append(label);print('PASS',label,flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':1440,'height':900},accept_downloads=True)
 page=context.new_page();errors=[];bad=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('response',lambda r:bad.append(r.url) if r.status>=400 else None)
 page.goto('http://127.0.0.1:8686/');page.wait_for_function('window.game?.scene.isActive("Title")',timeout=60000)
 page.wait_for_timeout(900)
 # Click the actual start button in Phaser's fitted canvas.
 def click_game(x,y):
  r=page.locator('#game canvas').bounding_box();page.mouse.click(r['x']+x*r['width']/1334,r['y']+y*r['height']/750)
 page.wait_for_timeout(1100)
 assert page.locator('.intro h1').inner_text().startswith('同安老街')
 for n in (1,2,3):
  page.locator('.continue').click();page.wait_for_function('(n)=>game.scene.getScene("Title").page===n && !game.scene.getScene("Title").changing',arg=n)
 assert '晨雾' in page.locator('.intro h1').inner_text()
 page.screenshot(path=str(OUT/'intro.png'));passed('四段远端序言文案在粉色纹样上连续翻页')
 page.locator('.continue').click();page.wait_for_function('game.scene.isActive("Story")');page.wait_for_timeout(1200)
 click_game(1224,36);page.wait_for_function('game.scene.isActive("Forage")');page.wait_for_timeout(1200)
 assert page.locator('.intro').count()==0 and page.evaluate('!SceneBlend.active')
 passed('序言在同页叠化接入采药，转场遮罩自动清理')
 click_game(1220,668);page.wait_for_function('G.foragePos>0 && !game.scene.getScene("Forage").walking',timeout=30000)
 passed('真实掷骰、移动与采药仍可工作')
 assert page.evaluate('STORIES.A.next[0]==="Medicine" && STORIES.A.next[1].mode==="effects" && STORIES.D.next[0]==="Workshop"')
 passed('龙虎赠灯直连制药，天明直连同页灯坊')
 page.evaluate('window.__musicContext=AUDIO.ctx();window.__musicStart=BGM.snapshot.step;window.__meter=AUDIO.ctx().createAnalyser();AUDIO.music().connect(__meter)')
 page.evaluate('goTo(game.scene.getScene("Forage"),"Workshop")');page.wait_for_function('game.scene.isActive("Workshop")');page.wait_for_timeout(1600)
 assert page.evaluate('!!game.scene.getScene("Workshop").lanternRenderer')
 page.screenshot(path=str(OUT/'workshop.png'));passed('同页进入实时 WebGL 纸灯，灯坊背景及本地素材加载成功')
 stage=page.locator('.lantern-stage');r=stage.bounding_box();x=r['x']+r['width']*.5;y=r['y']+r['height']*.48
 before=page.evaluate('game.scene.getScene("Workshop").turn')
 page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+90,y,steps=12);page.mouse.up()
 assert page.evaluate('game.scene.getScene("Workshop").turn')>before+.5
 passed('真实拖动可旋转三维灯笼')
 page.locator('.next').click();assert page.locator('.next').is_disabled()
 page.locator('[data-mode=draw]').click()
 page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+22,y+22,steps=10);page.mouse.up()
 assert page.evaluate('game.scene.getScene("Workshop").marked') and page.locator('.next').is_enabled()
 passed('画笔通过射线命中纸灯表面，真实描画后才能继续')
 page.locator('.clear').click();assert page.locator('.next').is_disabled()
 page.locator('[data-stamp=dragon]').click();page.locator('[data-stamp=tiger]').click();assert page.locator('.next').is_enabled()
 passed('重画、龙纹和虎纹工具更新灯面纹理')
 page.locator('.next').click();page.locator('#lamp-wish').fill('岁岁常安')
 assert page.evaluate('game.scene.getScene("Workshop").wish')=='岁岁常安'
 page.locator('.next').click();page.wait_for_timeout(500)
 assert page.evaluate('game.scene.getScene("Workshop").lit') and '岁岁常安' in page.locator('.final-wish').inner_text()
 passed('自定义心愿实时题写，完成后暖光点亮')
 page.screenshot(path=str(OUT/'finished.png'))
 page.locator('.light-toggle').click();assert not page.evaluate('game.scene.getScene("Workshop").lit')
 page.locator('.light-toggle').click();assert page.evaluate('game.scene.getScene("Workshop").lit')
 passed('成灯后可独立切换点亮与熄灯')
 with page.expect_download() as d:page.locator('.save').click()
 path=OUT/'my-lantern.png';d.value.save_as(path);data=path.read_bytes()
 assert data[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',data[16:24])==(1600,1200) and len(data)>10000
 passed('保存我的灯实际下载有效的 1600×1200 PNG 图片')
 page.locator('.sound').click();assert page.evaluate('AUDIO.muted')
 page.locator('.sound').click();assert not page.evaluate('AUDIO.muted')
 passed('灯坊音量按钮控制同一个音乐与音效总线')
 page.wait_for_function('BGM.snapshot.mode==="reflective"',timeout=12000)
 energies=[]
 for _ in range(6):
  energies.append(page.evaluate('(()=>{const d=new Float32Array(__meter.fftSize);__meter.getFloatTimeDomainData(d);return d.reduce((s,v)=>s+v*v,0)/d.length})()'))
  page.wait_for_timeout(180)
 assert all(v>1e-9 for v in energies),energies
 assert page.evaluate('AUDIO.ctx()===__musicContext && BGM.snapshot.step>__musicStart && AUDIO.ctx().state==="running"')
 passed('跨采药和灯坊音频上下文不重建，小节递增，六次真实音频采样均非静音')
 page.locator('.return').click();page.wait_for_function('game.scene.isActive("Title")');page.wait_for_timeout(1100)
 assert page.locator('.workshop').count()==0
 assert page.evaluate('game.scene.getScene("Workshop").disposed')
 page.evaluate('goTo(game.scene.getScene("Title"),"Workshop")');page.wait_for_function('game.scene.isActive("Workshop")');page.wait_for_timeout(1100)
 assert page.locator('.workshop').count()==1 and page.evaluate('!!game.scene.getScene("Workshop").lanternRenderer')
 passed('退出释放渲染器和事件，重新进入不叠加灯坊或音轨')
 # Touch in the same landscape layout used by the game.
 mobile=browser.new_context(viewport={'width':844,'height':390},is_mobile=True,has_touch=True)
 q=mobile.new_page();q.on('pageerror',lambda e:errors.append(str(e)))
 q.goto('http://127.0.0.1:8686/');q.wait_for_function('window.game?.scene.isActive("Title")',timeout=60000)
 q.evaluate('game.scene.stop("Title");game.scene.start("Workshop")');q.wait_for_timeout(1100)
 q.locator('.next').tap();q.locator('[data-stamp=dragon]').tap();q.locator('.next').tap();q.locator('[data-wish="长乐安康"]').tap();q.locator('.next').tap()
 assert q.evaluate('game.scene.getScene("Workshop").lit && document.documentElement.scrollWidth<=innerWidth')
 q.screenshot(path=str(OUT/'mobile.png'));passed('844×390 触屏可完成绘纹题字点亮，无横向溢出')
 mobile.close()
 assert not errors,errors;assert not bad,bad
 passed('本轮浏览器无未捕获异常、无 HTTP 素材失败')
 (OUT/'result.json').write_text(json.dumps({'checks':checks,'errors':errors,'assetFailures':bad,'audioEnergy':energies},ensure_ascii=False,indent=2))
 browser.close()
