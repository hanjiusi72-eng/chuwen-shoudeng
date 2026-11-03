"""Original pentatonic score for 长明. No external samples or licensed recordings.
Dizi-like breath synthesis, plucked strings, sheng-like reeds, ceremonial drums/gong.
"""
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.signal import lfilter
import subprocess
ROOT=Path(__file__).resolve().parents[1]
SR=44100;DURATION=80;BEAT=60/108
rng=np.random.default_rng(20261103)
mix=np.zeros((int((DURATION+3)*SR),2),dtype=np.float32)
def add(sound,at,gain=1,pan=0):
    start=int(at*SR)
    if start<0:return
    length=min(len(sound),len(mix)-start)
    if length<=0:return
    sound=sound[:length]*gain
    mix[start:start+length,0]+=sound*np.sqrt((1-pan)/2)
    mix[start:start+length,1]+=sound*np.sqrt((1+pan)/2)
def hz(midi):return 440*2**((midi-69)/12)
def pluck(midi,dur=1.8):
    t=np.arange(int(SR*dur))/SR;f=hz(midi)
    s=np.zeros_like(t)
    for k in range(1,12):
        s+=np.sin(2*np.pi*f*k*(1+0.00012*k*k)*t+0.19*k)*np.exp(-t*(1.8+k*.7))/(k**1.25)
    s*=np.minimum(t/.006,1)*np.minimum((dur-t)/.09,1)
    return s

def flute(midi,dur):
    t=np.arange(int(SR*dur))/SR;f=hz(midi)
    vibr=.0022*np.sin(2*np.pi*5.2*t)*np.minimum(t/.3,1)
    phase=2*np.pi*np.cumsum(f*(1+vibr))/SR
    s=np.sin(phase)+.23*np.sin(phase*2)+.11*np.sin(phase*3)+.035*np.sin(phase*5)
    breath=lfilter([.1],[1,-.9],rng.normal(0,1,len(t)))
    env=np.minimum(t/.07,1)*np.minimum((dur-t)/.16,1)*(.88+.12*np.sin(np.pi*t/dur))
    return (s*.6+breath*.1)*env

def pad(notes,dur):
    t=np.arange(int(SR*dur))/SR;s=np.zeros_like(t)
    for n in notes:
        for det in [-.0012,.0012]:
            f=hz(n)*(1+det);s+=np.sin(2*np.pi*f*t)+.18*np.sin(4*np.pi*f*t)+.06*np.sin(6*np.pi*f*t)
    return s/len(notes)*np.minimum(t/.6,1)*np.minimum((dur-t)/.7,1)

def drum(big=True):
    d=1.1 if big else .3;t=np.arange(int(SR*d))/SR
    phase=2*np.pi*((55 if big else 140)*t+(45 if big else 80)*(.045)*(1-np.exp(-t/.045)))
    tonal=np.sin(phase)*np.exp(-t/(.28 if big else .07))
    n=lfilter([.2],[1,-.8],rng.normal(0,1,len(t)))
    return (tonal*.85+n*.35*np.exp(-t/.035))*np.minimum(t/.002,1)

def gong(dur=4,small=False):
    t=np.arange(int(SR*dur))/SR;s=np.zeros_like(t);f=380 if small else 92
    for k,ratio in enumerate([1,1.47,2.09,2.56,3.62,4.97,5.61,7.13]):
        s+=np.sin(2*np.pi*f*ratio*t+.4*np.sin(2*np.pi*2.3*t))*np.exp(-t*(.8+k*.16))/(1+k*.45)
    return s*np.minimum(t/.013,1)*.4

# Two composed eight-bar phrases, D-major pentatonic.
melody=[74,78,81,83,81,78,76,74, 76,78,81,78,76,74,71,69,
        74,76,78,81,83,86,83,81, 78,81,78,76,74,71,74,74]
answer=[81,83,86,83,81,78,81,83, 86,88,86,83,81,78,76,74,
        78,81,83,81,78,76,74,71, 74,78,76,74,71,69,74,74]
chords=[[50,57,62],[47,54,59],[43,50,57],[45,52,57]]
for bar in range(36):
    at=bar*4*BEAT
    if at>77:break
    chord=chords[(bar//2)%4]
    swell=0.055 if at<8 else .10 if at<45 else .13
    add(pad(chord,4*BEAT+.5),at,swell,.05)
    # guzheng-like flowing accompaniment, accent downbeat
    for step in range(8):
        n=chord[[0,1,2,1,2,1,0,1][step]]+12+(12 if step==4 else 0)
        add(pluck(n),at+step*BEAT/2,.11 if step%4 else .17,-.35+.1*(step%4))
    if at<6:continue
    phrase=melody if bar<12 or bar>=28 else answer
    for q in range(4):
        beat=bar*4+q;t0=beat*BEAT
        if t0>=77:continue
        n=phrase[(beat-12)%len(phrase)]
        # last beat in each phrase breathes; no constant mechanical note stream
        if beat%16==15:continue
        dur=BEAT*(1.7 if beat%8==6 else .88)
        add(flute(n,dur),t0,.135 if at<46 else .16,.18)
        if 48<at<74:add(pluck(n-12),t0,.085,-.3)
    if at>=8:
        intensity=.21 if at<46 else .35
        for b in [0,2]:add(drum(),at+b*BEAT,intensity,-.12)
        for b in [1,3]:add(drum(False),at+b*BEAT,intensity*.6,.3)
        if at>46:
            for b in [2.5,3.5]:add(drum(False),at+b*BEAT,intensity*.35,.4)
            if bar%4==3:
                for b in [3,3.25,3.5,3.75]:add(drum(False),at+b*BEAT,.14,.2)
    if bar in [0,4,12,20,24,28,32]:add(gong(),at,.28 if bar>=20 else .18,-.1)
    if bar%4==2 and at>8:add(gong(1.8,True),at,.09,.45)
# Warm closing cadence, spacious gong tail.
for n,t in [(78,76.5),(76,77),(74,77.6)]:add(flute(n,1.6),t,.17,.12)
add(pluck(50,3),77.5,.35,-.2);add(pad([50,57,62,66],2.5),77.5,.12);add(gong(2.5),77.5,.15)
# Stereo room reflection and long hall tail; keep attack clear.
dry=mix.copy()
for delay,g in [(.047,.13),(.091,.1),(.173,.12),(.283,.085),(.431,.07),(.683,.045)]:
    k=int(delay*SR);mix[k:]+=dry[:-k,::-1]*g
mix=mix[:int(DURATION*SR)]
fadein=np.minimum(np.arange(len(mix))/SR/1.1,1)
fadeout=np.minimum((len(mix)-1-np.arange(len(mix)))/SR/1.8,1)
mix*=np.minimum(fadein,fadeout)[:,None]
mix=np.tanh(mix*.9);mix*=.91/max(abs(mix).max(),.01)
out=ROOT/'deliverables';out.mkdir(exist_ok=True)
wavfile.write(out/'长明_原创民俗配乐.wav',SR,(mix*32767).astype(np.int16))
subprocess.run(['ffmpeg','-y','-v','error','-i',str(out/'长明_原创民俗配乐.wav'),'-af','loudnorm=I=-16:TP=-1.5:LRA=10','-c:a','libmp3lame','-b:a','192k',str(ROOT/'assets/changming-festival.mp3')],check=True)
print('Original stereo score written: 80s / 108 BPM / D pentatonic')
