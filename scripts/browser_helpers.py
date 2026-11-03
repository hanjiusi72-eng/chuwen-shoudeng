from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
URL='http://127.0.0.1:8686/'
ARGS=['--no-sandbox','--disable-webgl','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']
def scene(page):return page.evaluate('game.scene.getScenes(true)[0]?.scene.key')
def wait_scene(page,key):page.wait_for_function('(key)=>window.game?.scene?.isActive(key)',arg=key,timeout=60000)
def point(page,x,y):
    box=page.locator('canvas').bounding_box()
    return box['x']+x/1334*box['width'],box['y']+y/750*box['height']
def click(page,x,y):page.mouse.click(*point(page,x,y))
def drag(page,x,y,tx,ty,duration=0):
    page.mouse.move(*point(page,x,y));page.mouse.down();page.wait_for_timeout(80)
    page.mouse.move(*point(page,tx,ty),steps=20)
    if duration:page.wait_for_timeout(duration)
    page.mouse.up();page.wait_for_timeout(320)
def text_point(page,text):
    return page.evaluate('''(text)=>{const s=game.scene.getScenes(true)[0];let found;const walk=(o)=>{if(o.text===text&&o.visible&&o.alpha>0&&(!o.parentContainer||o.parentContainer.visible)){const b=o.getBounds();found={x:b.centerX,y:b.centerY};}if(o.list)o.list.forEach(walk);};s.children.list.forEach(walk);return found;}''',text)
def click_text(page,text):
    xy=text_point(page,text);assert xy,f'Text not found: {text} in {scene(page)}';click(page,xy['x'],xy['y']);page.wait_for_timeout(160)
def dismiss(page):
    # Use the actual dialogue blocker, including its two-click typewriter behavior.
    for _ in range(40):
        if not page.evaluate('game.scene.getScenes(true)[0].children.list.some(o=>o.depth===1200)'):return
        click(page,1190,665);page.wait_for_timeout(100)
    raise AssertionError('Dialogue did not close')
def start_scene(page,key,data=None):
    page.evaluate('''([key,data])=>{game.scene.getScenes(true).forEach(s=>game.scene.stop(s.scene.key));game.scene.start(key,data||{});}''',[key,data])
    wait_scene(page,key);page.wait_for_timeout(850)
def new_game(browser,**kwargs):
    ctx=browser.new_context(viewport={'width':1334,'height':750},device_scale_factor=1,**kwargs)
    page=ctx.new_page();page.goto(URL);wait_scene(page,'Title');page.wait_for_timeout(800)
    return ctx,page
