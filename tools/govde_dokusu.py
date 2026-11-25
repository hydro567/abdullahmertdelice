# Game Boy govde dokusunu (textures/body.jpg) ureten betik.
# Gerekenler: Snokke/game-boy-challenge reposu (MIT) ../game-boy-challenge altinda klonlu,
# ve ekran ic duvari UV ucgenleri /tmp/wall_uv.npy (modelden cikarilir; bkz. CLAUDE.md).
# Calistir: python3 tools/govde_dokusu.py  (repo kok dizininden)
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from scipy import ndimage as nd
import os
P=os.environ.get('SNOKKE','../game-boy-challenge')+'/public/'
TEAL=np.array([0.20,0.78,0.78])
def teal_of(a):
    lum=a.mean(2); return np.clip(TEAL*(lum/0.74)[...,None],0,1)
def neutral_w(a):
    mx=a.max(2); mn=a.min(2); sat=(mx-mn)/(mx+1e-5)
    w=np.clip((0.18-sat)/0.06,0,1)
    return nd.gaussian_filter(w,1.0)
im=np.asarray(Image.open(P+'textures/baked-game-boy.jpg').convert('RGB')).astype(np.float32)/255
H,W,_=im.shape; yy,xx=np.mgrid[0:H,0:W]
lum=im.mean(2)
rect=(xx>110)&(xx<770)&(yy>830)&(yy<1320)
raw=rect&((im[...,2]-im[...,0])>0.006)&(lum<0.62)
m=nd.binary_opening(raw,iterations=2); m=nd.binary_closing(m,iterations=6); m=nd.binary_fill_holes(m)
lab,n=nd.label(m); 
if n: sizes=nd.sum(m,lab,range(1,n+1)); m=lab==(np.argmax(sizes)+1)
m=nd.gaussian_filter(m.astype(np.float32),4)>0.5
m=nd.binary_dilation(m,iterations=3)
# ekran ic duvarlari (modelden bulunan UV ucgenleri)
from PIL import ImageDraw as _D
wm=Image.new('L',(W,H),0); _d=_D.Draw(wm)
for tri in np.load('/tmp/wall_uv.npy'): _d.polygon([(float(u*W),float(v*H)) for u,v in tri],fill=255)
wm=nd.binary_dilation(np.asarray(wm)>0,iterations=3)
m=m|wm
bez=nd.gaussian_filter(m.astype(np.float32),1.2)
buttons=((xx<760)&(yy<740)&~((yy<60)&(xx>380))).astype(np.float32)
w=neutral_w(im)*(1-buttons)*(1-bez)
out=im*(1-w[...,None])+teal_of(im)*w[...,None]
# cerceve: koyu antrasit, yazi ve cizgiler korunur
mx=im.max(2); mn=im.min(2); sat=(mx-mn)/(mx+1e-5)
txtzone=((yy>860)&(yy<910))|((xx>120)&(xx<222)&(yy>1000)&(yy<1090))
keep=nd.gaussian_filter(((sat>0.25)|((lum>0.55)&txtzone)).astype(np.float32),0.8)
dark=im*0.22
out=out*(1-bez[...,None])+(dark*(1-keep[...,None])+im*keep[...,None])*bez[...,None]
img=Image.fromarray((np.clip(out,0,1)*255).astype(np.uint8))
d=ImageDraw.Draw(img)
patch=img.crop((90,1408,620,1452)); img.paste(patch,(90,1322)); img.paste(patch,(90,1364))
F=ImageFont.truetype(P+'fonts/dogicapixel.ttf',40)
x=104; d.text((x,1340),'GAME BOY',font=F,fill=(245,245,250),stroke_width=2,stroke_fill=(20,60,70))
x+=d.textlength('GAME BOY ',font=F)
for ch,c in zip('COLOR',[(255,59,59),(166,91,255),(41,199,111),(255,204,51),(47,140,255)]):
    d.text((x,1340),ch,font=F,fill=c,stroke_width=2,stroke_fill=(20,60,70)); x+=d.textlength(ch,font=F)
img.save('textures/body.jpg',quality=92)
img.crop((0,780,820,1500)).save('/home/claude/prev_bezel.jpg')
img.resize((1024,1024)).save('/home/claude/prev_body.jpg')
for f in ['baked-cartridge-pocket.jpg','baked-cartridge-pocket-with-cartridge.jpg']:
    a=np.asarray(Image.open(P+'textures/'+f).convert('RGB')).astype(np.float32)/255
    w=neutral_w(a); o=a*(1-w[...,None])+teal_of(a)*w[...,None]
    Image.fromarray((np.clip(o,0,1)*255).astype(np.uint8)).save('textures/'+f,quality=92)
