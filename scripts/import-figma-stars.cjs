// Usage: node scripts/import-figma-stars.cjs /path/to/export-directory
// Input files: {emotion}-{step}.svg, exported from the nodes in star-sources.json.
// Keep the exact Figma vector group; remove ancestor frame backgrounds only.
const fs = require('node:fs');
const path = require('node:path');
const source = process.argv[2];
if (!source) throw new Error('Pass the directory containing the original Figma exports.');
const assets = path.resolve(__dirname, '../public/assets');
for(const emotion of ['tired','gloomy','lonely','heavy','unsure','okay']) {
  for(let step=0;step<4;step++) {
    const svg=fs.readFileSync(path.join(source,`${emotion}-${step}.svg`),'utf8');
    const start=svg.indexOf('<g id="Property 1=');
    if(start<0)throw new Error(`Missing variant group: ${emotion}/${step}`);
    const tags=/<g\b[^>]*>|<\/g>/g;tags.lastIndex=start;
    let depth=0,end=-1,match;
    while((match=tags.exec(svg))){depth+=match[0].startsWith('</')?-1:1;if(!depth){end=tags.lastIndex;break;}}
    if(end<0)throw new Error('Unclosed variant');
    const artwork=svg.slice(start,end);
    if(/<image\b|data:image|<foreignObject\b/.test(artwork))throw new Error(`Non-vector artwork: ${emotion}/${step}`);
    const box=svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
    const [, , width,height]=box;
    const defs=svg.match(/<defs>[\s\S]*?<\/defs>/)?.[0]||'';
    const result=`<svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 560 560"><g transform="translate(${(560-width)/2} ${(560-height)/2})">${artwork}</g>${defs}</svg>\n`;
    if(/data:image|<image\b/.test(result))throw new Error('Embedded bitmap in SVG');
    fs.writeFileSync(path.join(assets,`paper-${emotion}-${step}.svg`),result);
  }
}
console.log('Imported 24 vector-only Figma stars into a shared centered canvas.');
