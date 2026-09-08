import { test, expect } from '@playwright/test';

test('review mobile layout and save sequence', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.entry-cta img')).toHaveCount(0);
  await page.screenshot({path:'test-results/review-home.png',fullPage:true});
  await page.getByRole('button',{name:'เริ่มทดสอบกันเลย'}).click();
  await page.getByRole('button',{name:'เหนื่อยมาก',exact:true}).click();
  await expect(page.locator('.floating-star')).toHaveCount(6);
  await page.screenshot({path:'test-results/review-sky.png',fullPage:true});
  await page.getByRole('button',{name:'เลือกดาวดวงที่ 4',exact:true}).click();
  await expect(page.getByRole('button',{name:'เลือกดาวนี้',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'ยกเลิก',exact:true}).click();
  await expect(page.getByRole('button',{name:'เลือกดาวนี้',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'เลือกดาวดวงที่ 4',exact:true}).click();
  await page.getByRole('button',{name:'เลือกดาวนี้',exact:true}).click();
  await expect(page.locator('.read-sequence')).toHaveAttribute('data-unfold-step','3');
  await expect(page.getByRole('button',{name:'เก็บไว้ในกล่องความทรงจำ'})).toBeVisible();
  await page.screenshot({path:'test-results/review-read.png',fullPage:true});
});

test('review success retains a readable star and accessible popup',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');
  await page.getByRole('button',{name:'ฝากดาวให้ใครบางคน ＋'}).click();
  await page.getByRole('button',{name:'โอเคอยู่',exact:true}).click();
  await page.getByLabel('ถ้าเขารู้สึกแบบนี้').fill('ค่อย ๆ ไปทีละก้าวนะ');
  await page.screenshot({path:'test-results/review-write.png',fullPage:true});
  await page.getByRole('button',{name:'ต่อไป',exact:true}).click();
  await page.getByRole('button',{name:'พับเป็นดาว'}).click();
  await expect(page.getByRole('heading',{name:'ส่งดาวของคุณแล้ว',exact:true})).toBeVisible();
  await expect(page.locator('.success-star')).toHaveCount(5);
  await page.screenshot({path:'test-results/review-success.png',fullPage:true});
  await page.getByRole('button',{name:'อ่านดาวที่เพิ่งส่ง'}).click();
  await expect(page.getByRole('dialog')).toContainText('ค่อย ๆ ไปทีละก้าวนะ');
  await page.screenshot({path:'test-results/review-popup.png',fullPage:true});
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'อ่านดาวที่เพิ่งส่ง'})).toBeFocused();
});
