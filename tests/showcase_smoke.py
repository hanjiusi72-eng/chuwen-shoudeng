"""Check the viewing/download page with actual browser playback and downloads."""
from pathlib import Path
import json,hashlib,zipfile
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=Path('/workspace/scratch/chuwen-revision/showcase-check');OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required'])
 context=b.new_context(viewport={'width':1440,'height':1100},accept_downloads=True);page=context.new_page();errors=[];failed=[];checks=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:failed.append({'status':r.status,'url':r.url}) if r.status>=400 else None)
 page.goto('http://127.0.0.1:8689/showcase/');assert page.locator('video').count()==3
 for i,duration in enumerate([36,44,60]):
  page.locator('video').nth(i).evaluate('(v)=>{v.muted=true;v.currentTime=1;v.play()}')
  page.wait_for_function('i=>document.querySelectorAll("video")[i].currentTime>2',arg=i)
  assert abs(page.locator('video').nth(i).evaluate('v=>v.duration')-duration)<.15
  if i>0:assert page.locator('video').nth(i-1).evaluate('v=>v.paused')
 checks+=['三个MP4均可在浏览器播放，时长为36/44/60秒','播放新影片会自动暂停其他影片']
 for selector,local,label in [('a[download$=".mp4"]',ROOT/'showcase/downloads/01-pop-play.mp4','单部MP4下载'),('a[href="downloads/guangliang-complete.zip"]',ROOT/'showcase/downloads/guangliang-complete.zip','完整包下载')]:
  with page.expect_download(timeout=60000) as info:page.locator(selector).first.click()
  d=info.value;target=OUT/d.suggested_filename;d.save_as(target)
  assert target.stat().st_size==local.stat().st_size
  assert hashlib.sha256(target.read_bytes()).digest()==hashlib.sha256(local.read_bytes()).digest()
  if target.suffix=='.zip':
   with zipfile.ZipFile(target) as z:
    assert z.testzip() is None
    assert len([n for n in z.namelist() if n.endswith('.mp4')])==3
    assert any(n.endswith('/打开这里.html') for n in z.namelist())
  checks.append(label+'成功，大小与SHA256一致')
 with page.expect_popup() as pop:page.get_by_role('link',name='打开交互网页 ↗',exact=True).click()
 game=pop.value;game.wait_for_function('window.game?.scene?.isActive?.("Title")');assert game.title()=='光亮 · 龙虎灯';checks.append('交互网页入口能正常打开新版游戏');game.close()
 page.locator('video').evaluate_all('vs=>vs.forEach(v=>v.pause())');page.evaluate('scrollTo(0,0)');page.screenshot(path=str(OUT/'desktop.png'),full_page=True)
 phone=b.new_page(viewport={'width':390,'height':844});phone.goto('http://127.0.0.1:8689/showcase/');assert phone.evaluate('document.documentElement.scrollWidth<=innerWidth');checks.append('390px手机宽度无横向溢出');phone.close()
 assert not errors,errors;assert not failed,failed
 checks.append('观看下载页无浏览器异常或HTTP素材错误')
 (OUT/'result.json').write_text(json.dumps({'checks':checks,'errors':errors,'httpFailures':failed},ensure_ascii=False,indent=2));print(json.dumps(checks,ensure_ascii=False),flush=True);b.close()
