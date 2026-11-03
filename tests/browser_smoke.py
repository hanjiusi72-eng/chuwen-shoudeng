"""Regression checks for 长明. Run with the static server on port 8686.
Outputs stay in deliverables/validation; chapter fixture setup uses existing scenes.
All interaction assertions use actual pointer/touch input.
"""
import sys,json,time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from browser_helpers import *
OUT=ROOT/'deliverables/validation';OUT.mkdir(parents=True,exist_ok=True)
results=[]
def passed(text):results.append(text);print('PASS',text,flush=True)
with sync_playwright() as pw:
    browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=ARGS)
    ctx,page=new_game(browser);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    assert page.title()=='长明 · 一盏灯，照见人间'
    assert page.evaluate('document.fonts.check(\'22px "Changming Hei"\')')
    assert page.evaluate('FONT.includes("Changming Hei") && FONT===FONT_SANS')
    page.screenshot(path=str(OUT/'01-title.png'));passed('new title and bundled local Hei font load')
    click_text(page,'走进灯火');wait_scene(page,'Story');page.wait_for_timeout(900)
    assert page.evaluate('BGM.audio.currentTime>0 && !BGM.audio.paused && BGM.audio.loop')
    click_text(page,'乐声 · 开');assert page.evaluate('SFX.muted && BGM.audio.paused')
    click_text(page,'乐声 · 关');page.wait_for_timeout(200);assert page.evaluate('!SFX.muted && !BGM.audio.paused')
    passed('original music plays after gesture; persistent sound toggle pauses/resumes')
    click_text(page,'跳过本段 ▸▸');wait_scene(page,'Act');page.wait_for_timeout(900);click(page,900,600);wait_scene(page,'Gather');page.wait_for_timeout(1000);dismiss(page)
    assert page.evaluate('!G.gatheringDone && G.gathered.size===0')
    click_text(page,'回药房');assert scene(page)=='Gather';passed('normal story route reaches gathering before tiger; exit is gated')
    rolls=0
    while not page.evaluate('G.gatheringDone'):
        click_text(page,'掷骰子');click_text(page,'掷骰子')
        page.wait_for_function('game.scene.getScene("Gather").busy',timeout=10000)
        page.wait_for_function('!game.scene.getScene("Gather").busy',timeout=30000)
        assert page.evaluate('game.scene.getScene("Gather").lastRoll>=1 && game.scene.getScene("Gather").lastRoll<=6')
        rolls+=1;assert rolls<=14
    assert page.evaluate('G.gathered.size===12 && G.gatherPosition===14')
    page.screenshot(path=str(OUT/'02-gather.png'));passed('dice traversal collects all 12 herbs exactly once, clamps finish and blocks duplicate rolls')
    click_text(page,'回药房');wait_scene(page,'Medicine');page.wait_for_timeout(900);dismiss(page)
    # Closed book rejects dosing, then opens through actual UI.
    drag(page,1030,196,645,352)
    assert page.evaluate('game.scene.getScene("Medicine").pot.length===0')
    click(page,186,392);page.wait_for_timeout(1000)
    assert page.evaluate('G.bookOpened')
    for x,y in [(1030,196),(1144,196),(1258,196)]:drag(page,x,y,645,352)
    page.wait_for_timeout(1500);assert page.evaluate('game.scene.getScene("Medicine").pot.length===0 && !game.scene.getScene("Medicine").busy')
    passed('medicine rejects closed-book and incorrect recipes with recoverable state')
    for x,y in [(1030,598),(1030,196),(1258,464)]:drag(page,x,y,645,352)
    page.wait_for_function('game.scene.getScene("Medicine").phase==="deliver"');page.wait_for_timeout(500)
    drag(page,645,455,515,188);page.wait_for_timeout(1000);click(page,525,232)
    page.wait_for_timeout(1400);dismiss(page);wait_scene(page,'Medicine')
    page.wait_for_function('game.scene.getScene("Medicine").mode==="dragon"');page.wait_for_timeout(900);dismiss(page)
    assert page.evaluate('G.healedTiger');passed('actual herb drags, brewing, gourd delivery and pin removal heal tiger')
    for x,y in [(1144,598),(1144,464),(1030,598)]:drag(page,x,y,645,352)
    page.wait_for_function('game.scene.getScene("Medicine").phase==="deliver"');page.wait_for_timeout(600)
    drag(page,645,455,505,188);page.wait_for_timeout(1300)
    eyes=page.evaluate('game.scene.getScene("Medicine").eyes.map(e=>({x:e.x,y:e.y}))')
    for e in eyes:click(page,e['x'],e['y']);page.wait_for_timeout(550)
    page.wait_for_timeout(1000);dismiss(page)
    assert page.evaluate('G.healedDragon');passed('dragon recipe, delivery and two-eye interaction work after scene restart')
    # Separate chapter fixture: no symptom cards or patients in village brewing page.
    start_scene(page,'Medicine',{'mode':'effects'});dismiss(page)
    assert not page.evaluate('game.scene.getScene("Medicine").children.list.some(o=>o.text?.includes("症状"))')
    assert not page.evaluate('game.scene.getScene("Medicine").taskCards')
    assert page.evaluate('game.scene.getScene("Medicine").book && G.bookOpened')
    for label,coords in [('银翘散',[(1144,464),(1258,330),(1030,196),(1030,598)]),('麦门冬汤',[(1144,196),(1030,464),(1258,196),(1030,598)]),('藿香正气散',[(1258,598),(1144,330),(1258,464),(1030,330)])]:
        click_text(page,label)
        for x,y in coords:drag(page,x,y,645,352)
        page.wait_for_function('(id)=>G.effectsDone.has(id)',arg={'银翘散':'E1','麦门冬汤':'E2','藿香正气散':'E3'}[label]);page.wait_for_timeout(300)
    assert page.evaluate('G.effectsDone.size===3');page.screenshot(path=str(OUT/'03-pharmacy.png'));passed('clean pharmacy has no symptom cards; all three named prescriptions brew and persist')
    page.wait_for_timeout(1800);dismiss(page);wait_scene(page,'Story');page.wait_for_timeout(1200)
    for _ in range(3):
        assert page.evaluate('''()=>{const s=game.scene.getScene('Story');const chars=s.children.list.filter(o=>o.texture?.key?.startsWith('char_'));return chars.length===1&&chars[0].texture.key==='char_elder'&&chars[0].angle===0&&chars[0].name==='standing-carpenter';}''')
        page.wait_for_timeout(600)
    assert not page.evaluate('game.scene.getScene("Story").children.list.some(o=>o.list?.some(k=>k.visible&&k.texture?.key==="head_tiger"))')
    page.screenshot(path=str(OUT/'04-carpenter.png'));passed('rescue scene contains only an upright carpenter, including during animation and dialogue')
    click_text(page,'跳过本段 ▸▸');wait_scene(page,'Craft');page.wait_for_timeout(950);dismiss(page)
    drag(page,1143,560,660,480);assert page.evaluate('game.scene.getScene("Craft").step===0')
    for x,y,tx,ty in [(1060,220,660,400),(1228,220,660,400),(1060,390,660,400),(1228,390,660,500),(1143,560,660,480)]:drag(page,x,y,tx,ty);page.wait_for_timeout(550)
    page.wait_for_timeout(1300);assert page.evaluate('G.lampCrafted && game.scene.getScene("Craft").step===4')
    passed('carpenter crafting rejects wrong order and completes all five material drags')
    page.evaluate('G.tutorialSeen=true');start_scene(page,'Defense');click_text(page,'开始守夜')
    page.wait_for_timeout(1600)
    assert page.evaluate('game.scene.getScene("Defense").mode==="run"')
    # Set up an extinguished lamp, then rescue by real long press.
    page.evaluate('''()=>{const s=game.scene.getScene('Defense');s.blowOut(s.lamps[0],'ghost');}''')
    page.mouse.move(*point(page,365,372));page.mouse.down();page.wait_for_timeout(2400);page.mouse.up()
    assert page.evaluate('game.scene.getScene("Defense").lamps[0].state==="lit"')
    passed('night defense starts and real long press relights an extinguished lamp')
    start_scene(page,'Decorate');dismiss(page)
    for kind in ['dragon','tiger']:
        page.wait_for_function('(kind)=>game.scene.getScene("Decorate").stage===kind',arg=kind)
        pts=page.evaluate('game.scene.getScene("Decorate").pts.map(p=>({x:p.x,y:p.y}))')
        # Real pen strokes across sampled artwork, not forced completion.
        for row in range(260,540,30):
            page.mouse.move(*point(page,510,row));page.mouse.down();page.mouse.move(*point(page,820,row),steps=40);page.mouse.up()
            if page.evaluate('game.scene.getScene("Decorate").done'):break
        page.wait_for_function('game.scene.getScene("Decorate").done',timeout=5000);page.wait_for_timeout(1400)
    page.wait_for_function('game.scene.getScene("Decorate").stage==="bless"');page.wait_for_timeout(600)
    click_text(page,'同心守望');assert page.evaluate('G.blessingId==="b2"')
    click_text(page,'岁岁安宁');assert page.evaluate('G.blessingId==="b3"')
    page.screenshot(path=str(OUT/'05-blessing.png'));click_text(page,'完成这盏灯 ✔');wait_scene(page,'Ending')
    passed('real drawing completes both patterns; blessing can change and ending starts')
    assert not errors,errors;passed('no uncaught JavaScript errors throughout tested chapters')
    ctx.close()
    mobile=browser.new_context(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=1)
    q=mobile.new_page();q.goto(URL);wait_scene(q,'Title');q.wait_for_timeout(800)
    xy=text_point(q,'走进灯火');q.touchscreen.tap(*point(q,xy['x'],xy['y']));wait_scene(q,'Story')
    assert q.evaluate('document.documentElement.scrollWidth<=innerWidth')
    q.set_viewport_size({'width':390,'height':844});q.wait_for_timeout(450);assert q.locator('#rotate').is_visible()
    q.set_viewport_size({'width':844,'height':390});q.wait_for_timeout(500);assert not q.locator('#rotate').is_visible()
    mobile.close();passed('mobile touch starts story; portrait guard pauses and landscape resumes')
    browser.close()
(OUT/'results.json').write_text(json.dumps({'passed':results,'count':len(results),'limitations':['Physical phone speaker quality and subjective music taste require listening on the user device.','Physical camera is not part of this game.','Night defense checks cover relighting, not every stochastic win/loss path.']},ensure_ascii=False,indent=2))
print('TOTAL',len(results),'checks passed',flush=True)
