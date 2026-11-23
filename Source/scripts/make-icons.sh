#!/bin/sh
# Renders launcher icons from src/img/logo.svg (needs rsvg-convert, e.g. apt install librsvg2-bin).
set -e
cd "$(dirname "$0")/.."
RES=android/app/src/main/res
python3 - <<'PY'
import re
s=open('src/img/logo.svg',encoding='utf8').read()
defs=re.search(r'<defs>.*?</defs>',s,re.S).group(0)
body=s.split('</defs>')[1].replace('</svg>','')
# drop the two background rects (first two <rect .../> lines)
body=re.sub(r'\s*<rect x="16" y="16"[^>]*/>','',body)
open('src/img/icon-fg.svg','w',encoding='utf8').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'+defs+'<g transform="translate(97.5 97.5) scale(.62)">'+body+'</g></svg>')
# round icon source: logo clipped to a circle
rd=s.replace('<rect x="16" y="16" width="480" height="480" rx="112" fill="url(#bg)"/>','<circle cx="256" cy="256" r="240" fill="url(#bg)"/>').replace('<rect x="16" y="16" width="480" height="480" rx="112" fill="none" stroke="#2D6BFF" stroke-opacity=".5" stroke-width="6"/>','')
open('src/img/icon-round.svg','w',encoding='utf8').write(rd)
PY
for spec in mdpi:48:108 hdpi:72:162 xhdpi:96:216 xxhdpi:144:324 xxxhdpi:192:432; do
  d=${spec%%:*}; r=${spec#*:}; leg=${r%%:*}; fg=${r#*:}
  mkdir -p $RES/mipmap-$d
  rsvg-convert -w $leg -h $leg src/img/logo.svg -o $RES/mipmap-$d/ic_launcher.png
  rsvg-convert -w $leg -h $leg src/img/icon-round.svg -o $RES/mipmap-$d/ic_launcher_round.png
  rsvg-convert -w $fg -h $fg src/img/icon-fg.svg -o $RES/mipmap-$d/ic_launcher_foreground.png
done
echo "icons done"
