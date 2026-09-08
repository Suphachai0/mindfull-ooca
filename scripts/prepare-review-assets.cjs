// Preserve original artwork bytes; derive per-image SVG clipping boundaries.
// These paper SVGs contain the original raster detail, not vector redraws.
const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('playwright-core/lib/utilsBundle');
const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'public/assets');
function group(svg, id) {
  const start = svg.indexOf(`<g id="${id}"`);
  if (start < 0) throw new Error(`Missing SVG group: ${id}`);
  const tags = /<g\b[^>]*>|<\/g>/g; tags.lastIndex = start;
  let depth = 0, match;
  while ((match = tags.exec(svg))) {
    depth += match[0].startsWith('</') ? -1 : 1;
    if (!depth) return svg.slice(start, tags.lastIndex);
  }
  throw new Error(`Unclosed SVG group: ${id}`);
}
function isolate(file, id, output = file, viewBox) {
  const svg = fs.readFileSync(path.join(assets, file), 'utf8');
  const header = viewBox ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">` : svg.match(/<svg[^>]*>/)[0];
  const defs = svg.match(/<defs>[\s\S]*?<\/defs>/)?.[0] || '';
  fs.writeFileSync(path.join(assets, output), `${header}\n${group(svg, id)}\n${defs}\n</svg>\n`);
}
isolate('jar.svg', 'Star-jar SVG [Vectorized]');
isolate('jar-companion.svg', 'Mooca=Happy Mooca with Sunny, Size=M');
isolate('sky-foreground.svg', 'OOCA', 'sky-companion.svg', '0 0 180 145');

const source = { tired: 3, gloomy: 4, lonely: 5, heavy: 7, unsure: 6, okay: 7 };
for (const [emotion, number] of Object.entries(source)) {
  let svg = fs.readFileSync(path.join(root, `star-paper-svg/image ${number}.svg`), 'utf8');
  if (emotion === 'okay') svg = svg.replaceAll('#d8f7e5', '#d8f7f3').replaceAll('#a9e5c9', '#a9e5df').replaceAll('#8ed5b5', '#8ed5d0');
  fs.writeFileSync(path.join(assets, `star-${emotion}.svg`), svg);
  for (let step = 0; step <= 3; step++) {
    const bytes = fs.readFileSync(path.join(assets, `star-${emotion}-${step}.png`));
    const { width, height, data } = PNG.sync.read(bytes);
    const visited = new Uint8Array(width * height);
    let largest = [];
    const colored = (p) => {
      const i=p*4, min=Math.min(data[i],data[i+1],data[i+2]), max=Math.max(data[i],data[i+1],data[i+2]);
      return data[i+3]>0 && max-min>16 && min<242;
    };
    for(let p=0;p<visited.length;p++) {
      if(visited[p] || !colored(p))continue;
      const component=[p];visited[p]=1;
      for(let head=0;head<component.length;head++) {
        const q=component[head], x=q%width;
        for(const n of [x>0?q-1:-1,x<width-1?q+1:-1,q-width,q+width]) {
          if(n>=0 && n<visited.length && !visited[n] && colored(n)){visited[n]=1;component.push(n);}
        }
      }
      if(component.length>largest.length)largest=component;
    }
    const subject=new Uint8Array(width*height);for(const p of largest)subject[p]=1;
    const outside=new Uint8Array(width*height), queue=[];
    for(let p=0;p<outside.length;p++)if(p<width || p>=width*(height-1) || p%width===0 || p%width===width-1){outside[p]=1;queue.push(p);}
    for(let head=0;head<queue.length;head++){
      const p=queue[head],x=p%width;
      for(const n of [x>0?p-1:-1,x<width-1?p+1:-1,p-width,p+width])if(n>=0&&n<outside.length&&!outside[n]&&!subject[n]){outside[n]=1;queue.push(n);}
    }
    let outline='';
    for (let y = 0; y < height; y++) {
      for(let x=0;x<width;x++){
        if(outside[y*width+x])continue;
        const first=x;
        while(x+1<width&&!outside[y*width+x+1])x++;
        outline+=`M${first} ${y}h${x-first+1}v1H${first}Z`;
      }
    }
    if(outside[125*width+125])throw new Error(`Open paper outline: ${emotion}/${step}`);
    fs.writeFileSync(path.join(assets, `paper-${emotion}-${step}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><clipPath id="paper"><path d="${outline}"/></clipPath></defs><image width="${width}" height="${height}" clip-path="url(#paper)" href="data:image/png;base64,${bytes.toString('base64')}"/></svg>\n`);
  }
}
console.log('Prepared jar, companions, six vector stars and 24 individually clipped paper stages.');
