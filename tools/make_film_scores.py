"""Original stereo scores for the three films; no third-party recordings."""
from pathlib import Path
import math,wave
import numpy as np
OUT=Path('/workspace/scratch/chuwen-revision/film');OUT.mkdir(parents=True,exist_ok=True)
SR=48000
for style,dur,bpm in [(1,36,116),(2,44,78),(3,60,88)]:
 rng=np.random.default_rng(7300+style);n=SR*dur;mix=np.zeros((n,2),np.float64)
 def put(sig,start,amp=1,pan=0,echo=True):
  for dt,a,p in [(0,amp,pan),(.23,amp*.15,-pan),(.46,amp*.09,pan)] if echo else [(0,amp,pan)]:
   k=int(start*SR+dt*SR);m=min(len(sig),n-k)
   if m<=0 or k<0:continue
   p=max(-.9,min(.9,p));mix[k:k+m,0]+=sig[:m]*a*math.sqrt((1-p)/2);mix[k:k+m,1]+=sig[:m]*a*math.sqrt((1+p)/2)
 def pluck(start,midi,length=2.8,amp=.14,pan=0,soft=False):
  t=np.arange(int(length*SR))/SR;f=440*2**((midi-69)/12)
  env=(1-np.exp(-t/(.025 if soft else .006)))*np.exp(-t/(2.1 if soft else .85))*np.minimum((length-t)/.2,1)
  sig=(np.sin(TAU*f*t)+.24*np.sin(TAU*f*2.003*t)*np.exp(-t/.7)+.10*np.sin(TAU*f*3*t)*np.exp(-t/.25))*env
  put(sig,start,amp,pan)
 def pad(start,midi,length=9,amp=.05):
  t=np.arange(int(length*SR))/SR;f=440*2**((midi-69)/12);env=np.minimum(t/2.0,1)*np.minimum((length-t)/2.6,1)
  sig=(np.sin(TAU*f*t)+.3*np.sin(TAU*f*1.002*t)+.12*np.sin(TAU*f*2*t))*env
  put(sig,start,amp,math.sin(midi)*.25)
 def kick(start,amp=.18):
  t=np.arange(int(.4*SR))/SR;phase=TAU*(48*t+(90-48)*.045*(1-np.exp(-t/.045)))
  put(np.sin(phase)*np.exp(-t*14),start,amp,0,False)
 def tick(start,amp=.035,pan=.3):
  t=np.arange(int(.055*SR))/SR;noise=rng.uniform(-1,1,len(t));sig=np.diff(noise,prepend=noise[0])*np.exp(-t*90)
  put(sig,start,amp,pan,False)
 TAU=2*np.pi;beat=60/bpm
 melody=[0,4,7,9,7,4,2,0,2,4,7,12,9,7,4,2]
 if style==1:
  for i,t in enumerate(np.arange(.0,dur-.6,beat)):
   kick(float(t),.20 if i%4==0 else .13)
   if i%2:tick(float(t),.035,-.3)
   tick(float(t+beat*.5),.025,.45)
   if i%2==0:pluck(float(t),48+[0,0,5,7][(i//8)%4],1.0,.10,-.15)
  for i,t in enumerate(np.arange(.25,dur-1,beat*.75)):
   pluck(float(t),60+melody[i%16],1.9,.13 if i%4 else .17,math.sin(i*1.2)*.45)
  for t in [0,9.5,19.5,29]:
   for m in [48,55,60]:pad(t,m,9,.035)
 elif style==2:
  for i,t in enumerate([0,10,20,30]):
   for m in ([48,55,64] if i%2==0 else [45,52,60]):pad(t,m,13,.045)
  for i,t in enumerate(np.arange(1,dur-2,beat*1.8)):
   pluck(float(t),72+melody[(i*3)%16],4.2,.105,math.sin(i)*.65,True)
   if i%3==0:pluck(float(t+beat*.6),60+melody[(i*3+2)%16],4,.06,-.4,True)
  for i,t in enumerate(np.arange(0,dur,beat*4)):kick(float(t),.07)
 else:
  for i,t in enumerate([0,8,16,24,32,40,48,55]):
   chord=[48,55,60] if i not in [4,5] else [45,52,60]
   for m in chord:pad(t,m,11,.045)
  for i,t in enumerate(np.arange(.8,dur-1,beat*1.5)):
   semi=melody[i%16];pluck(float(t),60+semi,3.5,.12,math.sin(i*.9)*.4,True)
   if i%4==0:pluck(float(t+.15),48+semi%12,4,.08,-.2,True)
  for i,t in enumerate(np.arange(30,45,beat)):
   if i%2==0:kick(float(t),.14)
   tick(float(t),.023,(-1)**i*.3)
  for j,t in enumerate([51,53,55,57]):pluck(t,72+[0,4,7,12][j],4,.09,.3,True)
 # Soft, short editorial swooshes on chapter changes.
 cuts={1:[5,9.5,15,19.5,24,29],2:[6,10,17,24,30,36],3:[6,11,15,22,30,37,44,51,56]}[style]
 for t0 in cuts:
  t=np.arange(int(.35*SR))/SR;noise=rng.normal(0,1,len(t));kernel=np.ones(25)/25
  sw=np.convolve(noise,kernel,mode='same')*np.sin(np.pi*t/.35)**2;put(sw,t0-.18,.13 if style==1 else .055,-.4,False)
 fade=np.minimum(np.arange(n)/SR/1.0,1)*np.minimum((n-1-np.arange(n))/SR/(2.5 if style!=1 else 1.6),1)
 mix*=fade[:,None];mix*=.78/max(np.max(np.abs(mix)),.001)
 target=OUT/f'score-{style}.wav'
 with wave.open(str(target),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((mix*32767).astype('<i2').tobytes())
 print(target,flush=True)
