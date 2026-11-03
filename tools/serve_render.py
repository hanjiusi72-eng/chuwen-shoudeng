"""Local-only static server with HTTP byte ranges for accurate film seeking."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
import os,re,sys
class RangeHandler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def send_head(self):
  self.remaining=None
  p=Path(self.translate_path(self.path))
  if not p.is_file():return super().send_head()
  f=p.open('rb');n=p.stat().st_size;rg=self.headers.get('Range');start=0;end=n-1
  if rg:
   m=re.fullmatch(r'bytes=(\d+)-(\d*)',rg)
   if not m:f.close();self.send_error(416);return None
   start=int(m[1]);end=min(int(m[2]) if m[2] else n-1,n-1)
   if start>end:f.close();self.send_error(416);return None
   self.send_response(206);self.send_header('Content-Range',f'bytes {start}-{end}/{n}')
  else:self.send_response(200)
  self.send_header('Content-Type',self.guess_type(str(p)));self.send_header('Accept-Ranges','bytes');self.send_header('Content-Length',str(end-start+1));self.send_header('Cache-Control','no-cache');self.end_headers();f.seek(start);self.remaining=end-start+1;return f
 def copyfile(self,source,outputfile):
  if self.remaining is None:return super().copyfile(source,outputfile)
  try:
   while self.remaining:
    data=source.read(min(65536,self.remaining))
    if not data:break
    outputfile.write(data);self.remaining-=len(data)
  except (BrokenPipeError,ConnectionResetError):pass
if __name__=='__main__':
 root=sys.argv[1] if len(sys.argv)>1 else '/workspace/scratch/chuwen-revision/render';port=int(sys.argv[2]) if len(sys.argv)>2 else 8688
 os.chdir(root);print('Local film server',port,flush=True);ThreadingHTTPServer(('127.0.0.1',port),RangeHandler).serve_forever()
