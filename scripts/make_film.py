"""Edit actual browser capture into an 80-second, 1080p scored demo.
Run record_demo.py first. No UI mockups are substituted for interaction footage.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import subprocess,json
ROOT=Path(__file__).resolve().parents[1];BUILD=ROOT/'deliverables/film-build';BUILD.mkdir(exist_ok=True,parents=True)
FONT='/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'
BOLD='/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
W,H=1920,1080;INK='#130f1b';CREAM='#fff0c7';GOLD='#d6b678';PINK='#d76ba7'
def f(size,bold=False):return ImageFont.truetype(BOLD if bold else FONT,size,index=2)
def center(d,y,text,size,color=CREAM,bold=False):
    d.text((W/2,y),text,font=f(size,bold),fill=color,anchor='mt')
def run(cmd):subprocess.run(cmd,check=True)
def card(kind):
    im=Image.new('RGB',(W,H),INK)
    # Soft warm halo, fine concentric rings and a single hanging lantern.
    glow=Image.new('RGB',(W,H),'black');gd=ImageDraw.Draw(glow)
    gd.ellipse((620,-220,1300,500),fill='#4b292b');glow=glow.filter(ImageFilter.GaussianBlur(100))
    from PIL import ImageChops
    im=ImageChops.add(im,glow);d=ImageDraw.Draw(im)
    d.line((90,80,W-90,80),fill='#534135',width=1);d.line((90,H-80,W-90,H-80),fill='#534135',width=1)
    d.text((92,43),'CHANG MING   /   AN INTERACTIVE FOLKTALE',font=f(17),fill=GOLD)
    d.text((W-92,43),'闽南 · 龙虎灯',font=f(19),fill=GOLD,anchor='ra')
    if kind=='opening':
        lamp=Image.open(BUILD/'lantern.png').convert('RGBA');lamp.thumbnail((130,170));im.paste(lamp,(W//2-lamp.width//2,155),lamp);d=ImageDraw.Draw(im)
        center(d,360,'长  明',132,bold=True)
        center(d,554,'一 盏 灯 ， 照 见 人 间',34,GOLD)
        center(d,692,'有人递来一炉药，有人陪你守一夜。',25)
        center(d,872,'民俗互动叙事  /  网页实录',19,'#9e8d91')
    elif kind=='bridge':
        center(d,330,'风 起 了 。',78,bold=True)
        center(d,495,'灯 还 亮 着 。',78,bold=True)
        center(d,735,'只要还有一盏亮着，我们就找得到彼此。',26,GOLD)
    else:
        center(d,270,'原来长明的，',52)
        center(d,385,'不只是一盏灯。',74,bold=True)
        center(d,585,'是有人记得你，有人等你回家。',32,GOLD)
        center(d,790,'长 明',42,bold=True)
        center(d,870,'一盏灯，照见人间',23,'#b5a3a5')
        center(d,953,'网页实录 · 原创五声音阶配乐 · 108 BPM',17,'#8b7c80')
    path=BUILD/f'{kind}.png';im.save(path)
    return path

def overlay(title,sub,num):
    im=Image.new('RGBA',(W,H),(0,0,0,0));d=ImageDraw.Draw(im)
    d.line((92,89,1828,89),fill='#594735',width=1)
    d.text((92,45),'长 明   /   '+title,font=f(27,True),fill=CREAM)
    d.text((1828,50),f'{num:02d}  /  07',font=f(20),fill=GOLD,anchor='ra')
    d.line((92,982,1828,982),fill='#594735',width=1)
    center(d,1000,sub,26,CREAM)
    path=BUILD/f'overlay-{num}.png';im.save(path);return path

# Capture a lantern sprite from the actual generated game texture, saved by recorder.
meta=json.loads((BUILD/'capture.json').read_text())
clips=[]
def still(kind,duration):
    p=card(kind);out=BUILD/f'{kind}.mp4'
    run(['ffmpeg','-y','-v','error','-threads','2','-loop','1','-i',str(p),'-vf',f"scale=1940:1092,crop=1920:1080:(iw-ow)/2:(ih-oh)/2,fade=t=in:st=0:d=0.8,fade=t=out:st={duration-.6}:d=0.6,format=yuv420p",'-t',str(duration),'-r','30','-an','-c:v','libx264','-preset','fast','-crf','18','-threads','2',str(out)])
    clips.append(out)
def footage(item,num):
    ov=overlay(item['title'],item['subtitle'],num);out=BUILD/f'shot-{num}.mp4'
    # Full viewport retained inside a cinematic matte: no cropped controls/subtitles.
    ratio=item['duration']/item.get('sourceDuration',item['duration'])
    filt=f"[0:v]setpts={ratio}*(PTS-STARTPTS),fps=30,scale=1510:849:flags=lanczos,eq=saturation=.94:contrast=1.025:brightness=.008,pad=1920:1080:(ow-iw)/2:116:color=0x130f1b[game];[game][1:v]overlay=0:0,fade=t=in:st=0:d=0.25,fade=t=out:st={item['duration']-.3}:d=0.3,format=yuv420p[v]"
    run(['ffmpeg','-y','-v','error','-ss',str(item['start']),'-i',item.get('video',meta['video']),'-loop','1','-i',str(ov),'-filter_complex',filt,'-map','[v]','-t',str(item['duration']),'-an','-c:v','libx264','-preset','fast','-crf','18','-threads','2',str(out)])
    clips.append(out)
still('opening',7)
for i,it in enumerate(meta['shots'],1):
    footage(it,i)
    if i==4:still('bridge',4)
still('closing',7)
concat=BUILD/'concat.txt';concat.write_text(''.join(f"file '{p}'\n" for p in clips))
final=ROOT/'deliverables/长明_电影感交互Demo.mp4'
run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',str(concat),'-i',str(ROOT/'deliverables/长明_原创民俗配乐.wav'),'-map','0:v','-map','1:a','-c:v','copy','-af','loudnorm=I=-16:TP=-1.5:LRA=10','-c:a','aac','-b:a','256k','-ar','48000','-t','80','-movflags','+faststart',str(final)])
# Shareable poster.
poster=Image.open(BUILD/'opening.png');poster.save(ROOT/'deliverables/长明_海报.jpg',quality=95)
print(final,flush=True)
