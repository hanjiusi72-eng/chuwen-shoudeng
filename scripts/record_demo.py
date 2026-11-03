"""Capture actual gameplay chapters with pointer input for the edited demo.
Chapter fixtures isolate the relevant scenes; timings are saved for make_film.py.
"""
from pathlib import Path
import json,time,os,shutil
import playwright
# Reuse the trusted system FFmpeg rather than fetching another binary.
registry=json.loads((Path(playwright.__file__).parent/"driver/package/browsers.json").read_text())
revision=next(b["revision"] for b in registry["browsers"] if b["name"]=="ffmpeg")
cache=Path(__file__).resolve().parents[1]/".cache/playwright"
ff=cache/("ffmpeg-"+revision)/"ffmpeg-linux"
ff.parent.mkdir(parents=True,exist_ok=True)
if not ff.exists():ff.symlink_to(shutil.which("ffmpeg"))
os.environ["PLAYWRIGHT_BROWSERS_PATH"]=str(cache)
from browser_helpers import *
BUILD=ROOT/'deliverables/film-build';BUILD.mkdir(parents=True,exist_ok=True)
shots=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=ARGS)
    ctx=browser.new_context(viewport={'width':1334,'height':750},device_scale_factor=1,record_video_dir=str(BUILD/'raw'),record_video_size={'width':1334,'height':750})
    origin=time.monotonic();page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(URL);wait_scene(page,'Title');page.wait_for_timeout(1100)
    # Export the actual game lantern texture for title-card art.
    import base64
    tex=page.evaluate("game.textures.get('lantern_lit').getSourceImage().toDataURL('image/png')")
    (BUILD/'lantern.png').write_bytes(base64.b64decode(tex.split(',')[1]))
    # Subtle physical pointer indicator, only in the recording layer.
    page.evaluate('''()=>{const c=document.createElement('div');c.id='record-pointer';c.style.cssText='position:fixed;width:16px;height:16px;border:2px solid #fff5da;border-radius:50%;box-shadow:0 0 8px #5a1e49;pointer-events:none;z-index:999;transform:translate(-50%,-50%);opacity:0';document.body.append(c);document.addEventListener('pointermove',e=>{c.style.left=e.clientX+'px';c.style.top=e.clientY+'px';c.style.opacity='.85'});document.addEventListener('pointerdown',()=>{c.style.background='#fff3b199';c.style.scale='1.6'});document.addEventListener('pointerup',()=>{c.style.background='transparent';c.style.scale='1'});}''')
    def await_intro():
        page.wait_for_function('game.scene.getScenes(true)[0].children.list.some(o=>o.depth===1200)',timeout=30000)
        dismiss(page)
    def shot(key,duration,title,subtitle,action):
        start=time.monotonic()-origin
        action()
        elapsed=time.monotonic()-origin-start
        if elapsed<duration:page.wait_for_timeout((duration-elapsed)*1000)
        shots.append({'key':key,'start':start,'duration':duration,'sourceDuration':time.monotonic()-origin-start,'title':title,'subtitle':subtitle})
        page.screenshot(path=str(BUILD/f'{key}.png'))
        print('RECORDED',key,'action',round(elapsed,2),'s',flush=True)
    start_scene(page,'Gather');await_intro()
    def gather():
        for _ in range(2):
            click_text(page,'掷骰子');page.wait_for_function('game.scene.getScene("Gather").busy');page.wait_for_function('!game.scene.getScene("Gather").busy',timeout=60000)
    shot('gather',10,'山间寻香','山路虽远，一味草木，也值得为你走一趟。',gather)
    start_scene(page,'Medicine',{'mode':'effects'});await_intro()
    def medicine():
        click_text(page,'银翘散')
        for x,y in [(1144,464),(1258,330),(1030,196),(1030,598)]:drag(page,x,y,645,352)
        page.wait_for_function('G.effectsDone.has("E1")');page.wait_for_timeout(600)
    shot('medicine',10,'一炉药香','你照着药书慢慢煎，我陪你看火。',medicine)
    start_scene(page,'Story',{'id':'B'});page.wait_for_function('game.scene.getScene("Story").children.list.some(o=>o.depth===1200)');page.wait_for_timeout(3300)
    def carpenter():
        page.wait_for_timeout(2600);dismiss(page)
        page.wait_for_timeout(1600)
    shot('carpenter',7,'陈伯的家','你送我一炉暖，我也教你扎一盏灯。',carpenter)
    start_scene(page,'Craft');await_intro()
    def craft():
        for x,y,tx,ty in [(1060,220,660,400),(1228,220,660,400),(1060,390,660,400),(1228,390,660,500),(1143,560,660,480)]:
            drag(page,x,y,tx,ty);page.wait_for_timeout(450)
    shot('craft',8,'竹篾有情','弯竹篾，糊棉纸。把这份暖，送到每一家门前。',craft)
    page.evaluate('G.tutorialSeen=true');start_scene(page,'Defense');click_text(page,'开始守夜')
    def defense():
        drag(page,660,420,520,390);page.wait_for_timeout(700)
        # Isolated relighting demonstration using the game's normal extinguish rule.
        page.evaluate('''()=>{const s=game.scene.getScene('Defense');s.blowOut(s.lamps[0],'ghost');}''')
        page.mouse.move(*point(page,365,372));page.mouse.down();page.wait_for_timeout(2350);page.mouse.up()
        drag(page,520,390,790,320);page.wait_for_timeout(500)
    shot('defense',10,'长夜相守','你护灯，我敲鼓。谁也不落下。',defense)
    start_scene(page,'Decorate');await_intro()
    def decorate():
        for kind in ['dragon','tiger']:
            page.wait_for_function('(k)=>game.scene.getScene("Decorate").stage===k',arg=kind)
            for row in range(260,540,30):
                page.mouse.move(*point(page,510,row));page.mouse.down();page.mouse.move(*point(page,820,row),steps=26);page.mouse.up()
                if page.evaluate('game.scene.getScene("Decorate").done'):break
            page.wait_for_timeout(1300)
        page.wait_for_function('game.scene.getScene("Decorate").stage==="bless"');page.wait_for_timeout(500);click_text(page,'同心守望')
    shot('decorate',9,'落笔祈愿','把愿望写在灯上，把今夜的光，留给来年。',decorate)
    # Keep the last chapter's real drawing and chosen blessing in the ending.
    start_scene(page,'Ending');page.wait_for_timeout(600)
    def ending():
        page.wait_for_timeout(2100);click(page,950,420);page.wait_for_timeout(3400);click(page,950,420)
    shot('ending',8,'灯火归人','一扇门，一盏灯。整条巷子，都接住了你手里的光。',ending)
    assert not errors,errors
    video=page.video
    ctx.close();path=video.path();browser.close()
meta={'video':str(path),'shots':shots,'renderer':'Phaser Canvas (actual browser capture)','notes':'Chapter fixtures used for montage. Pointer actions are real. Defense relighting condition is staged using the normal extinguish rule.'}
(BUILD/'capture.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
print('CAPTURE SAVED',path,flush=True)
