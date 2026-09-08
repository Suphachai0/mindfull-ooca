import { test, expect } from '@playwright/test';

const sizes = [320,390,430,768,834,1280];
test('background, cloud coverage, input focus and jar across responsive sizes', async ({page}) => {
  test.setTimeout(60000);
  for (const width of sizes) {
    await page.setViewportSize({width,height:844});
    await page.goto('/');
    await page.evaluate(()=>document.fonts.ready);
    const homeBackground = await page.locator('.app').evaluate(e=>getComputedStyle(e).backgroundImage);
    await page.getByRole('button',{name:'เริ่มทดสอบกันเลย'}).click();
    await page.getByRole('button',{name:'เหนื่อยมาก',exact:true}).click();
    await page.getByRole('button',{name:'เลือกดาวดวงที่ 4',exact:true}).click();
    await expect(page.locator('.app')).toHaveCSS('background-image', homeBackground);
    const bank = await page.locator('.cloud-bank').boundingBox();
    expect(bank!.x).toBeLessThanOrEqual(0);
    expect(bank!.x + bank!.width).toBeGreaterThanOrEqual(width);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({path:`output/background-review/sky-${width}.png`,fullPage:true,animations:'disabled'});
    await page.getByRole('button',{name:'เลือกดาวนี้',exact:true}).click();
    await expect(page.locator('.read-actions')).toBeVisible();
    await page.screenshot({path:`output/background-review/read-${width}.png`,fullPage:true,animations:'disabled'});
    await page.getByRole('button',{name:'เก็บไว้ในกล่องความทรงจำ'}).click();
    if (await page.getByRole('button',{name:'ใช้บัญชีทดลองในเครื่อง'}).isVisible()) await page.getByRole('button',{name:'ใช้บัญชีทดลองในเครื่อง'}).click();
    await expect(page.locator('.jar-image')).toHaveAttribute('src','/assets/jar.svg');
    await page.screenshot({path:`output/background-review/jar-${width}.png`,fullPage:true,animations:'disabled'});
    await page.getByRole('button',{name:'ฝากดาวให้ใครบางคน'}).click();
    await page.getByLabel('ถ้าเขารู้สึกแบบนี้').focus();
    await expect(page.locator('textarea')).toHaveCSS('outline-style','none');
    await expect(page.locator('.text-field')).toHaveCSS('border-top-color','rgb(51, 92, 179)');
    await page.screenshot({path:`output/background-review/write-${width}.png`,fullPage:true,animations:'disabled'});
  }
});

test('every paper stage has transparent corners and intact opaque center', async ({page}) => {
  await page.goto('/');
  const results=await page.evaluate(async()=>{
    const results=[];
    for(const emotion of ['tired','gloomy','lonely','heavy','unsure','okay'])for(let step=0;step<4;step++){
      const img=new Image();img.src=`/assets/paper-${emotion}-${step}.svg`;await img.decode();
      const canvas=document.createElement('canvas');canvas.width=canvas.height=250;
      const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0,250,250);
      results.push({emotion,step,corner:ctx.getImageData(0,0,1,1).data[3],center:ctx.getImageData(125,125,1,1).data[3]});
    }
    return results;
  });
  for(const result of results){expect(result.corner,JSON.stringify(result)).toBe(0);expect(result.center,JSON.stringify(result)).toBe(255);}
});

test('clouds complete two 30-second fade loops', async ({page}) => {
  test.setTimeout(75000);
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
  await expect(page.locator('.entry-cloud-left')).toHaveCSS('animation-duration','30s');
  const start=Date.now();
  const samples=[];
  while(Date.now()-start<61000){
    samples.push(await page.locator('.entry-cloud-left').evaluate(e=>({opacity:Number(getComputedStyle(e).opacity),time:e.getAnimations()[0]?.currentTime})));
    await page.waitForTimeout(1000);
  }
  expect(samples.filter(s=>s.opacity<.3).length).toBeGreaterThanOrEqual(2);
  expect(samples.filter(s=>s.opacity>.95).length).toBeGreaterThan(20);
  expect(Number(samples.at(-1)!.time)-Number(samples[0].time)).toBeGreaterThan(59000);
});
