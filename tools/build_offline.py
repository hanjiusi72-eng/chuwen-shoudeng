"""Build the game's standalone offline HTML without changing application sources."""
from pathlib import Path
import base64,json,mimetypes,re,sys,zipfile
ROOT=Path(__file__).resolve().parents[1]
out=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'showcase/downloads'
out.mkdir(parents=True,exist_ok=True)
assets={}
for f in sorted((ROOT/'assets').rglob('*')):
 if f.is_file() and f.suffix.lower() in ('.png','.jpg','.jpeg','.webp'):
  assets[f.relative_to(ROOT).as_posix()]='data:'+mimetypes.guess_type(f.name)[0]+';base64,'+base64.b64encode(f.read_bytes()).decode()
s=(ROOT/'index.html').read_text()
s=re.sub(r'<a class="download-link"[^>]*>.*?</a>', '', s)
s=re.sub(r'<link rel="stylesheet" href="journey.css[^"]*">',lambda _: '<style>'+(ROOT/'journey.css').read_text()+'</style>',s)
# The backdrop also uses a local image, so embed it directly.
s=re.sub(r'url\((assets/[^)]+)\)',lambda m:'url('+assets[m[1].split('?')[0]]+')',s)
loader='<script>window.__OFFLINE_ASSETS='+json.dumps(assets,separators=(',',':'))+';</script>'
seen=0
def inline(m):
 global seen
 name=m[1].split('?')[0];js='\n'.join(line.rstrip() for line in (ROOT/name).read_text().split('\n'))
 if name=='js/scenes/boot.js':
  js=js.replace('preload() {', '''preload() {
    const imageLoader=this.load.image.bind(this.load);
    this.load.image=(key,url,...rest)=>imageLoader(key,window.__OFFLINE_ASSETS[url.split('?')[0]]||url,...rest);''',1)
 tag='<script>'+js.replace('</script','<\\/script')+'</script>'
 if name=='lib/phaser.min.js':tag+=loader
 seen+=1;return tag
s=re.sub(r'<script src="([^"]+)"></script>',inline,s)
assert seen==18,seen
assert not re.search(r'<script[^>]+src=',s)
p=out/'guangliang-offline.html';p.write_text(s)
notes='光亮·龙虎灯｜离线交互版\n\n解压后双击 guangliang-offline.html，用 Safari 或 Chrome 打开即可游玩。\n无需安装、无需启动终端、无需联网。建议横屏。首次点击后浏览器才会播放声音。\n游戏进度仅保留在本次打开的页面中。\n\n本包为视频参考融合版：连续故事、纸灯绘纹、心愿题字与点亮保存。全部运行库和图片均已内嵌；首次点击后配乐开始，切换场景不会重新播放。\n'
(out/'Mac使用说明.txt').write_text(notes)
with zipfile.ZipFile(out/'game-offline-mac.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 z.write(p,p.name);z.writestr('Mac使用说明.txt',notes)
print(json.dumps({'html':str(p),'bytes':p.stat().st_size,'zipBytes':(out/'game-offline-mac.zip').stat().st_size,'scripts':seen,'embeddedAssets':len(assets)},ensure_ascii=False))
