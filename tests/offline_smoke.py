"""Validate the delivered single-file game with no external asset dependencies.
The cloud browser blocks file:// navigation by policy; serve this same file locally for validation."""
from pathlib import Path
import json,sys
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1];target=Path(sys.argv[1]) if len(sys.argv)>1 else root/'showcase/downloads/guangliang-offline.html'
out=Path('/workspace/scratch/chuwen-revision/offline-check');out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1334,'height':750});errors=[];network=[];checks=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:network.append(r.url) if r.url.startswith(('http://','https://')) and not r.url.endswith('/showcase/downloads/guangliang-offline.html') else None)
 page.goto('http://127.0.0.1:8686/showcase/downloads/guangliang-offline.html');page.wait_for_function('window.game?.scene.isActive("Title")',timeout=60000);page.wait_for_timeout(800)
 assert page.title()=='光亮 · 龙虎灯';checks.append('单文件HTML标题与画面正常，无外部脚本或素材依赖')
 page.mouse.click(667,585);page.wait_for_timeout(250);page.mouse.click(517,205);page.wait_for_function('game.scene.isActive("Forage")');page.wait_for_timeout(1000)
 page.mouse.click(1220,668);page.wait_for_function('G.foragePos>0 && !game.scene.getScene("Forage").walking');assert page.evaluate('G.forageGot.length')>0;checks.append('离线版真实掷骰、移动与采药成功')
 page.evaluate('game.scene.stop("Forage");G.reset();game.scene.start("Medicine",{mode:"effects"})');page.wait_for_timeout(1200)
 for _ in range(5):page.mouse.click(700,680);page.wait_for_timeout(180)
 state=page.evaluate('(()=>{const s=game.scene.getScene("Medicine"),id=s.fxR().herbs[0];return s.rack[id].home})()')
 page.mouse.move(state['x'],state['y']);page.mouse.down();page.mouse.move(800,565,steps=14);page.mouse.up();page.wait_for_timeout(700)
 assert page.evaluate('game.scene.getScene("Medicine").fxSelected.length')==1;checks.append('离线版药庐素材与拖药交互成功')
 assert page.evaluate('game.textures.exists("medicine_pearl")');checks.append('离线版新圆球药泥贴图已生成')
 page.screenshot(path=str(out/'offline-medicine.png'))
 for scene,data in [('Defense',{}),('Decorate',{}),('Finish',{})]:
  page.evaluate('({k,d})=>{game.scene.getScenes(true).forEach(s=>game.scene.stop(s.scene.key));game.scene.start(k,d)}',{'k':scene,'d':data});page.wait_for_function('(k)=>game.scene.isActive(k)',arg=scene);page.wait_for_timeout(650)
 checks.append('守灯、画灯、完成页均可离线进入')
 page.evaluate('game.scene.getScenes(true).forEach(s=>game.scene.stop(s.scene.key));game.scene.start("Workshop")');page.wait_for_function('game.scene.isActive("Workshop")');page.wait_for_timeout(1000)
 page.locator('.next').click();page.locator('[data-stamp=dragon]').click();page.locator('.next').click();page.locator('#lamp-wish').fill('灯火长明');page.locator('.next').click()
 assert page.evaluate('game.scene.getScene("Workshop").lit && game.scene.getScene("Workshop").wish==="灯火长明"')
 checks.append('新灯坊可离线绘纹、题写心愿并点亮')
 assert not network,network;assert not errors,errors
 checks+=['除HTML文档本身外无HTTP网络请求','无未捕获浏览器异常']
 (out/'result.json').write_text(json.dumps({'checks':checks,'network':network,'errors':errors},ensure_ascii=False,indent=2));print(json.dumps(checks,ensure_ascii=False),flush=True);b.close()
