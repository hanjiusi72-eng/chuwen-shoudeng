"""Package the three completed films and standalone game into web/offline delivery."""
from pathlib import Path
from PIL import Image
import json,zipfile,hashlib
ROOT=Path(__file__).resolve().parents[1];SHOW=ROOT/'showcase';DL=SHOW/'downloads';POST=SHOW/'posters';POST.mkdir(exist_ok=True)
WORK=Path('/workspace/scratch/chuwen-revision/film')
films=[
 {'n':'01','file':'01-pop-play.mp4','title':'撞色游艺','en':'POP / PLAY','dur':36,'color':'#ff75c7','desc':'高饱和撞色、角色贴纸与卡片快切。让采药、济世和守灯，成为一场有节奏的指尖冒险。','ref':'参考 1 · 撞色插画与快节奏浏览','preview':0},
 {'n':'02','file':'02-soft-orbits.mp4','title':'光的圆舞','en':'SOFT / ORBITS','dur':44,'color':'#ccebdd','desc':'浅色渐变、圆形草木纹样与柔和流动。从一味药到一盏灯，让光在画面里慢慢展开。','ref':'参考 2 · 浅色渐变与圆形动效','preview':2},
 {'n':'03','file':'03-lantern-story.mp4','title':'灯火长卷','en':'LIGHT / STORY','dur':60,'color':'#f1d7a3','desc':'以纸面漫画分镜串起医者、村庄和一夜灯火。实机交互与插画叙事，一同走向天明。','ref':'参考 3 · 漫画分镜与连续叙事','preview':4}
]
for f in films:
 p=DL/f['file'];assert p.exists(),p
 f['size']=round(p.stat().st_size/1048576,1)
 im=Image.open(WORK/f"preview-{f['preview']}.png").convert('RGB');im.save(POST/(f['n']+'.jpg'),quality=91,optimize=True)
base='''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>光亮 · 龙虎灯｜影片与互动</title><meta name="description" content="三部风格呈现影片与光亮·龙虎灯交互网页。在线播放，或下载到Mac离线观看和游玩。"><link rel="icon" href="data:,"><style>
:root{--paper:#faf5e9;--ink:#21192a;--pink:#f256ae;--muted:#736575}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans SC",sans-serif}a{color:inherit}header,main,footer{max-width:1260px;margin:auto;padding:0 32px}nav{display:flex;justify-content:space-between;align-items:center;padding:27px 0;border-bottom:1px solid #d8cbd0;font-size:13px;letter-spacing:.07em}.brand{font-weight:800;letter-spacing:.16em;text-decoration:none}nav div{display:flex;gap:25px}nav a{text-decoration:none}.hero{padding:80px 0 62px}.eyebrow{color:#8f5674;font-size:12px;letter-spacing:.22em;font-weight:700}.hero h1{font-size:clamp(42px,6.5vw,82px);font-weight:650;letter-spacing:.02em;line-height:1.25;margin:25px 0}.hero p{font-size:17px;line-height:1.9;color:var(--muted);max-width:700px}.buttons{display:flex;flex-wrap:wrap;gap:12px;margin-top:27px}.button{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;padding:14px 23px;border:1px solid var(--ink);border-radius:7px;font-size:14px;font-weight:600;min-height:48px;transition:transform .18s,box-shadow .18s}.button:hover{transform:translateY(-2px);box-shadow:0 5px 14px #29162a16}.button.primary{background:var(--ink);color:var(--paper)}.button.pink{background:#f9d7ea;border-color:#ceabc0}.intro-note{font-size:12px!important;margin-top:18px}.film{padding:42px 0 48px;border-top:1px solid #d8cbd0}.film-head{display:flex;gap:25px;align-items:baseline;justify-content:space-between;margin-bottom:20px}.title-wrap{display:flex;gap:22px;align-items:baseline}.no{font-size:38px;color:#ad668a;font-weight:400}.film h2{font-size:31px;margin:0;font-weight:650;letter-spacing:.03em}.meta{font-size:12px;color:var(--muted);letter-spacing:.04em}.player{background:#16151a;border-radius:12px;overflow:hidden;box-shadow:0 14px 36px #35202a14}video{display:block;width:100%;aspect-ratio:16/9;object-fit:contain;background:#17151c}.film-body{display:flex;justify-content:space-between;gap:35px;align-items:flex-start;margin-top:22px}.film-body p{max-width:720px;color:var(--muted);line-height:1.9;font-size:15px;margin:0}.ref{font-size:11px;color:#967689;display:block;margin-top:8px}.download-link{white-space:nowrap;display:inline-block;font-size:14px;font-weight:650;text-decoration:none;border-bottom:1px solid #9f6988;padding-bottom:6px;margin-top:8px}.game{margin:30px 0 50px;padding:40px;background:#e7eedb;border-radius:15px}.game h2{font-size:32px;letter-spacing:.04em;margin:0 0 18px}.game p{line-height:1.9;color:#52604e;max-width:850px}.game ol{padding-left:20px;font-size:14px;line-height:2.2;color:#52604e}.all{background:#efdfe8;border-radius:15px;padding:35px 40px;margin:0 0 55px}.all h2{font-size:26px;margin-top:0}.all p{font-size:14px;line-height:1.9;color:#725d6b}footer{padding-top:25px;padding-bottom:40px;border-top:1px solid #d8cbd0;color:#92838c;font-size:12px;line-height:1.9}.foot-row{display:flex;justify-content:space-between;gap:15px}button{font:inherit}@media(max-width:700px){header,main,footer{padding-left:20px;padding-right:20px}nav{font-size:11px}nav div{gap:12px}.hero{padding:50px 0 35px}.film-head{gap:12px;align-items:flex-start}.title-wrap{gap:13px}.no{font-size:27px}.film h2{font-size:24px}.meta{max-width:100px;text-align:right;line-height:1.8}.film-body{display:block}.download-link{margin-top:18px}.game,.all{padding:27px 22px}.game h2{font-size:26px}.foot-row{display:block}video{border-radius:0}}
</style></head><body><header><nav><a class="brand" href="#">光亮 · 龙虎灯</a><div><a href="#films">看影片</a><a href="#game">玩游戏</a><a href="#downloads">下载到 Mac</a></div></nav><section class="hero"><div class="eyebrow">GUANG LIANG / FILMS & INTERACTION</div><h1>把灯火，<br>带回指尖。</h1><p>三种风格，同一个关于相助与守望的故事。<br>在这里观看影片、进入交互，或把它们下载到电脑里。</p><div class="buttons"><a class="button primary" href="#films">观看三个版本 ↓</a><a class="button" href="GAME_LINK" target="_blank" rel="noopener">打开交互网页 ↗</a><a class="button pink" href="downloads/game-offline-mac.zip" download="光亮-龙虎灯-离线游戏-Mac.zip">下载离线游戏</a></div><p class="intro-note">影片为 MP4 · 1920 × 1080 · 含配乐。游戏离线版无需安装和启动服务器。</p></section></header><main><div id="films">'''
sections=[]
for f in films:
 sections.append(f'''<section class="film" id="film-{f['n']}"><div class="film-head"><div class="title-wrap"><span class="no">{f['n']}</span><h2>{f['title']}</h2></div><span class="meta">{f['en']}<br>{f['dur']} 秒 · {f['size']} MB</span></div><div class="player"><video controls playsinline preload="metadata" poster="posters/{f['n']}.jpg" aria-label="{f['title']}"><source src="downloads/{f['file']}" type="video/mp4">浏览器暂不支持在线播放，请使用下方下载按钮。</video></div><div class="film-body"><p>{f['desc']}<span class="ref">{f['ref']}</span></p><a class="download-link" href="downloads/{f['file']}" download="光亮-龙虎灯-{f['n']}-{f['title']}.mp4">下载此版 MP4 ↓</a></div></section>''')
tail='''</div><section class="game" id="game"><div class="eyebrow">PLAY THE STORY</div><h2>你来点亮，这盏龙虎灯。</h2><p>已按修改意见更新：完整的十五格采药棋盘、暖杏色圆球药泥、粉红纹样人物场景，以及明亮的村庄背景。鼠标与触屏均可参与，建议横屏体验。</p><div class="buttons"><a class="button primary" href="GAME_LINK" target="_blank" rel="noopener">现在进入交互 ↗</a><a class="button" href="downloads/game-offline-mac.zip" download="光亮-龙虎灯-离线游戏-Mac.zip">下载离线游戏包 ↓</a><a class="button" href="downloads/guangliang-offline.html" download="光亮-龙虎灯-离线版.html">直接下载 HTML ↓</a></div><ol><li>下载完成后，在访达的“下载”文件夹找到文件。</li><li>游戏 ZIP 解压后，双击 <strong>guangliang-offline.html</strong>，用 Safari 或 Chrome 打开。</li><li>无需安装、无需终端、无需联网；首次点击后开启声音。</li></ol></section><section class="all" id="downloads"><h2>一次下载，全部带走。</h2><p>三部 MP4 影片、离线交互网页和使用说明放在一个文件包里。解压后，双击“打开这里.html”即可选择观看或游玩。</p><a class="button primary" href="downloads/guangliang-complete.zip" download="光亮-龙虎灯-影片与交互-完整包.zip">下载完整文件包 ↓</a></section></main><footer><div class="foot-row"><span>光亮 · 龙虎灯 / 医者仁心，邻里同光。</span><span>实机交互与原作美术动效剪辑 · 部分片段加速 · 原创合成配乐</span></div></footer><script>document.querySelectorAll('video').forEach(v=>v.addEventListener('play',()=>document.querySelectorAll('video').forEach(o=>{if(o!==v)o.pause()})));</script></body></html>'''
web=(base+''.join(sections)+tail).replace('GAME_LINK','../')
(SHOW/'index.html').write_text(web)
# The offline gallery uses the same relative folders; its game link stays within the ZIP.
offline=web.replace('href="../"','href="downloads/guangliang-offline.html"')
offline=offline.replace('href="downloads/game-offline-mac.zip" download="光亮-龙虎灯-离线游戏-Mac.zip"','href="downloads/guangliang-offline.html"').replace('下载离线游戏包 ↓','打开离线游戏 ↗').replace('下载离线游戏</a>','打开离线游戏</a>')
# The all-in-one pack doesn't recursively include itself.
offline=offline.replace('<a class="button primary" href="downloads/guangliang-complete.zip" download="光亮-龙虎灯-影片与交互-完整包.zip">下载完整文件包 ↓</a>','<p>你已打开完整文件包。三个视频和离线游戏都在同一文件夹中，无需再次下载。</p>')
notes='''光亮·龙虎灯｜影片与交互完整包

1. 解压后，双击“打开这里.html”，即可观看三个版本或进入游戏。
2. 视频在 downloads 文件夹中，也可以直接用 QuickTime Player 打开三个 MP4。
3. 游戏是 downloads/guangliang-offline.html，双击用 Safari 或 Chrome 打开。
4. 无需安装、无需启动终端、无需联网。游戏首次点击后才能发声。
5. 游戏建议横屏体验。影片是实机与美术动效的剪辑，部分片段加速，不是完整通关实录。

三个版本分别对应参考视频的视觉与剪辑方向；没有直接使用参考视频画面或音乐。
'''
(DL/'Mac使用说明.txt').write_text(notes)
with zipfile.ZipFile(DL/'guangliang-complete.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 prefix=Path('光亮-龙虎灯')
 z.writestr(str(prefix/'打开这里.html'),offline)
 z.writestr(str(prefix/'Mac使用说明.txt'),notes)
 for f in films:z.write(DL/f['file'],prefix/'downloads'/f['file'])
 z.write(DL/'guangliang-offline.html',prefix/'downloads/guangliang-offline.html')
 for p in POST.glob('*.jpg'):z.write(p,prefix/'posters'/p.name)
with zipfile.ZipFile(DL/'guangliang-complete.zip') as z:assert z.testzip() is None
manifest=[]
for p in sorted(DL.glob('*')):
 if p.is_file():manifest.append({'file':p.name,'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(SHOW/'delivery-manifest.json').write_text(json.dumps({'films':films,'files':manifest},ensure_ascii=False,indent=2))
print(json.dumps(manifest,ensure_ascii=False,indent=2))
