"""Bundle only used glyphs from the system Noto Sans CJK SC font (SIL OFL)."""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
ROOT=Path(__file__).resolve().parents[1]
text=''.join(p.read_text() for p in [ROOT/'index.html',*ROOT.glob('js/**/*.js')])+''.join(chr(i) for i in range(32,127))+'✓▸—…◎○'
font=TTFont('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',fontNumber=2)
s=subset.Subsetter();s.populate(text=text);s.subset(font)
# Rename the modified subset rather than distributing it under the original family.
for record in font['name'].names:
    names={1:'Changming Hei',2:'Regular',3:'ChangmingHei-Regular-1.0',4:'Changming Hei Regular',6:'ChangmingHei-Regular',16:'Changming Hei',17:'Regular'}
    if record.nameID in names:record.string=names[record.nameID].encode(record.getEncoding(),errors='replace')
font.save(ROOT/'assets/changming-hei.otf')
print('Saved bundled Hei font')
