"""Package the current standalone static website, without old demo films or Git data."""
from pathlib import Path
import zipfile
ROOT=Path(__file__).resolve().parents[1]
output=ROOT/'showcase/downloads/guangliang-web.zip'
files=[]
for name in ['index.html','download.html','journey.css','README.md','THIRD_PARTY_NOTICES.md','start.command']:
 files.append(ROOT/name)
for dirname in ['js','assets','lib','tests','tools']:
 files.extend(p for p in (ROOT/dirname).rglob('*') if p.is_file() and '__pycache__' not in p.parts)
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for path in sorted(files):z.write(path,'guangliang-web/'+str(path.relative_to(ROOT)))
 z.writestr('guangliang-web/使用说明.txt','光亮·龙虎灯｜视频参考融合版\n\n在该目录运行 python3 -m http.server 8686，随后用浏览器打开服务。macOS 可双击 start.command。\n无需开发工具的版本请下载 game-offline-mac.zip，解压后直接打开内含单文件 HTML。\n源码包不重复打包大型离线文件；根目录 download.html 中的在线下载相对链接需在正式网站使用。\n')
print({'sourceZip':str(output),'files':len(files),'bytes':output.stat().st_size})
