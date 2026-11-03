"""Exercise the real WebGL-unavailable fallback rather than just its presence."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json
out=Path('/tmp/chuwen-fallback-validation');out.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 q=b.new_page(viewport={'width':1200,'height':800},accept_downloads=True);errors=[]
 q.on('pageerror',lambda e:errors.append(str(e)))
 q.add_init_script('''const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind.includes('webgl')?null:get.call(this,kind,...args)};''')
 q.goto('http://127.0.0.1:8686/');q.wait_for_function('window.game?.scene.isActive("Title")',timeout=60000)
 q.locator('.direct-lamp').click()
 try:q.wait_for_function('game.scene.isActive("Workshop")',timeout=10000)
 except Exception:
  print('ERRORS',errors,flush=True);print(q.evaluate('({scenes:game.scene.getScenes(true).map(s=>s.scene.key),state:game.scene.getScene("Title").sys.settings.status,leaving:game.scene.getScene("Title")._leaving,blend:SceneBlend.active})'),flush=True);raise
 q.wait_for_timeout(1200)
 assert q.evaluate('!game.scene.getScene("Workshop").lanternRenderer && !!game.scene.getScene("Workshop").fallback')
 q.locator('.next').click();q.locator('[data-stamp=tiger]').click();q.locator('.next').click();q.locator('#lamp-wish').fill('岁岁安康');q.locator('.next').click()
 assert q.evaluate('game.scene.getScene("Workshop").lit')
 with q.expect_download() as d:q.locator('.save').click()
 d.value.save_as(out/'flat-lantern.png');assert (out/'flat-lantern.png').stat().st_size>10000
 assert not errors,errors
 result={'checks':['WebGL unavailable selects 2D fallback','Pattern, custom wish and light work without WebGL','Fallback actually downloads a nonempty PNG','No uncaught browser exceptions']}
 (out/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result),flush=True)
 b.close()
