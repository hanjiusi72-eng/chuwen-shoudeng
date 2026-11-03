from pathlib import Path
import json
from playwright.sync_api import sync_playwright
out=Path('/tmp/chuwen-medicine-validation');out.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
 page=b.new_page(viewport={'width':1334,'height':750});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8686/')
 page.wait_for_function('window.game?.scene.isActive("Title")')
 page.evaluate('game.scene.stop("Title");game.scene.start("Medicine",{mode:"effects"})')
 page.wait_for_function('game.scene.isActive("Medicine")')
 page.wait_for_timeout(700)
 for _ in range(5):page.mouse.click(700,680);page.wait_for_timeout(180)
 for recipe in range(2):
  cards=page.evaluate('(()=>{const s=game.scene.getScene("Medicine");return s.fxR().herbs.map(id=>({x:s.rack[id].home.x,y:s.rack[id].home.y}));})()')
  for c in cards:
   page.mouse.move(c['x'],c['y']);page.mouse.down();page.mouse.move(800,565,steps=20);page.mouse.up();page.wait_for_timeout(550)
  page.wait_for_function('game.scene.getScene("Medicine").fxPhase==="mud"')
  page.wait_for_timeout(850)
  state=page.evaluate('(()=>{const s=game.scene.getScene("Medicine"),m=s.mud;return {texture:m.texture.key,w:m.displayWidth,h:m.displayHeight,x:m.x,y:m.y,enabled:m.input.enabled,draggable:m.input.draggable}})()')
  assert state['texture']=='medicine_pearl' and state['w']==state['h']==128 and state['enabled'] and state['draggable'],state
  page.screenshot(path=str(out/f'medicine-pearl-{recipe+1}.png'))
  page.mouse.move(state['x'],state['y']);page.mouse.down();page.mouse.move(470,560,steps=25);page.mouse.up()
  page.wait_for_function(f'G.effectsDone.size==={recipe+1}')
  if recipe==0:
   page.wait_for_function('game.scene.getScene("Medicine").fxCurrent==="E2"')
   page.wait_for_timeout(650)
 assert not errors,errors
 report={'checks':['E1 four herbs dragged into mortar','Warm apricot round medicine pearl renders','Pearl drag into kettle completes E1','E2 repeats at full round size with draggable enabled','E2 brewing completes','No uncaught browser errors'],'errors':errors}
 (out/'medicine-result.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False))
 b.close()
