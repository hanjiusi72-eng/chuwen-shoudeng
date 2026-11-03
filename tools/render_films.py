"""Render three 1080p motion-design films from the revised game's real captures.
The private local render server serves tools/motion-film.html with assets/ and source/.
"""
from pathlib import Path
import argparse,base64,json,subprocess,time
from playwright.sync_api import sync_playwright
from PIL import Image,ImageOps,ImageDraw
parser=argparse.ArgumentParser();parser.add_argument('--preview-only',action='store_true');parser.add_argument('--styles',nargs='*',type=int,default=[1,2,3]);args=parser.parse_args()
root=Path(__file__).resolve().parents[1];work=Path('/workspace/scratch/chuwen-revision/film');work.mkdir(parents=True,exist_ok=True);dest=root/'showcase/downloads';dest.mkdir(parents=True,exist_ok=True)
names={1:'01-pop-play',2:'02-soft-orbits',3:'03-lantern-story'};lengths={1:36,2:44,3:60}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding'])
 q=b.new_page(viewport={'width':1920,'height':1080});errors=[];failed=[]
 q.on('pageerror',lambda e:errors.append(str(e)))
 q.on('response',lambda r:failed.append({'status':r.status,'url':r.url}) if r.status>=400 else None)
 q.goto('http://127.0.0.1:8688/');q.wait_for_function('window.__ready===true',timeout=60000);q.wait_for_timeout(400)
 if args.preview_only:
  shots=[]
  for i,(style,t) in enumerate([(1,2),(1,11),(2,2),(2,19),(3,3),(3,26)]):
   q.evaluate('([s,t])=>window.preview(s,t)',[style,t]);q.wait_for_timeout(500);q.evaluate('(t)=>render(t)',t);q.screenshot(path=str(work/f'preview-{i}.png'));print('PREVIEW STATE',style,t,q.evaluate('Object.fromEntries(Object.entries(vid).map(([k,v])=>[k,{t:v.currentTime,ready:v.readyState,seeking:v.seeking}]))'),flush=True);shots.append(work/f'preview-{i}.png')
  sheet=Image.new('RGB',(1600,3*480),'#151515');d=ImageDraw.Draw(sheet)
  for i,png in enumerate(shots):
   im=ImageOps.contain(Image.open(png),(800,450));x=i%2*800;y=i//2*480+24;sheet.paste(im,(x,y));d.text((x+8,y-20),f'Style {i//2+1} / '+('hero' if i%2==0 else 'gameplay'),fill='white')
  sheet.save(work/'preview-contact.jpg');print('PREVIEWS',work/'preview-contact.jpg',flush=True)
 else:
  report=[]
  for style in args.styles:
   q.evaluate('s=>{window.__done=false;window.__videoData=null;window.record(s).then(d=>{window.__videoData=d;window.__done=true}).catch(e=>{window.__renderError=String(e);window.__done=true})}',style)
   mark=0
   while not q.evaluate('window.__done'):
    q.wait_for_timeout(2000);progress=q.evaluate('window.__progress');t=progress['t']
    if t>mark+6:print('RENDER',style,round(t,1),progress.get('key') or progress['chapter'],flush=True);mark=t
    assert not q.evaluate('window.__renderError||null'),q.evaluate('window.__renderError')
   assert not errors,errors
   data=q.evaluate('window.__videoData');raw=work/(names[style]+'.webm');raw.write_bytes(base64.b64decode(data));q.evaluate('window.__videoData=null;window.__chunks=[]')
   print('CAPTURED',style,raw.stat().st_size,flush=True)
   target=dest/(names[style]+'.mp4')
   subprocess.run(['ffmpeg','-v','error','-y','-threads','2','-i',str(raw),'-i',str(work/f'score-{style}.wav'),'-map','0:v:0','-map','1:a:0','-vf','fps=24,tpad=stop_mode=clone:stop_duration=2,format=yuv420p','-t',str(lengths[style]),'-c:v','libx264','-preset','slow','-crf','19','-threads','2','-c:a','aac','-b:a','192k','-ar','48000','-af','loudnorm=I=-16:TP=-1.5:LRA=11','-movflags','+faststart',str(target)],check=True)
   meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(target)]))
   duration=float(meta['format']['duration']);assert abs(duration-lengths[style])<.15
   assert any(s['codec_type']=='video' and s['width']==1920 and s['height']==1080 and s['codec_name']=='h264' for s in meta['streams'])
   assert any(s['codec_type']=='audio' and s['codec_name']=='aac' for s in meta['streams'])
   report.append({'style':style,'path':str(target),'duration':duration,'bytes':target.stat().st_size,'width':1920,'height':1080,'fps':24,'videoCodec':'h264','audioCodec':'aac'})
   print('DONE',style,target,round(target.stat().st_size/1048576,2),'MiB',flush=True)
  assert not failed,failed
  (work/'render-report.json').write_text(json.dumps({'films':report,'browserErrors':errors,'httpFailures':failed,'referenceMapping':{'1':'撞色角色、卡片横移与快节奏剪辑','2':'浅色渐变、圆形草木纹样与柔和转场','3':'纸面漫画分镜与连续叙事'},'music':'Original synthesized stereo scores; no reference footage or reference music is included.'},ensure_ascii=False,indent=2))
 b.close()
