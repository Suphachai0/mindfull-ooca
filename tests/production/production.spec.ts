import { expect, test } from '@playwright/test';

const star = { id: '00000000-0000-4000-8000-000000000001', content: 'พักก่อนได้นะ ไม่ต้องรีบตลอดก็ได้', emotion: 'tired', source: 'team', status: 'approved', created_at: '2026-09-08T00:00:00Z' };

test.beforeEach(async ({ page }) => {
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', route => route.fulfill({
    contentType: 'text/javascript',
    body: `window.turnstile={render:(el,o)=>{el.textContent='ยืนยันแล้ว';queueMicrotask(()=>o.callback('test-token'));return 'widget'},remove:()=>{},reset:()=>{}}`,
  }));
  await page.route('https://jrtxrrghyutwbbujtubt.supabase.co/functions/v1/star-api', async route => {
    const body = route.request().postDataJSON();
    if (body.action === 'pool') return route.fulfill({ json: Array.from({ length: 6 }, (_, index) => ({ ...star, id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}` })) });
    if (body.action === 'star') return route.fulfill({ json: star });
    if (body.action === 'submit') return route.fulfill({ json: { ...star, id: '10000000-0000-4000-8000-000000000001', content: body.content, source: 'community', status: 'pending' } });
    if (body.action === 'report') return route.fulfill({ json: { ok: true } });
    return route.fulfill({ status: 400, json: { error: 'unexpected action' } });
  });
});

test('production guest can send with Turnstile and use a local-only jar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('กำลังทดลองในเครื่องนี้')).toHaveCount(0);
  await page.getByRole('button', { name: 'ลองเลือกความรู้สึก' }).click();
  await page.getByRole('button', { name: 'เหนื่อยมาก', exact: true }).click();
  await page.getByRole('button', { name: 'เลือกดาวดวงที่ 1' }).click();
  await page.getByRole('button', { name: 'เปิดดาวดวงนี้' }).click();
  await page.getByRole('button', { name: 'เก็บดาวไว้ในโถ' }).click();
  await expect(page.getByText('เก็บไว้แล้ว 1 ดวง')).toBeVisible();
  await expect(page.getByText(/เฉพาะในเบราว์เซอร์นี้/)).toBeVisible();
  await page.getByRole('button', { name: 'ฝากดาวให้ใครบางคน' }).click();
  await page.getByRole('button', { name: 'เหนื่อยมาก', exact: true }).click();
  await page.getByLabel('ถ้าเขารู้สึกแบบนี้').fill('พักก่อนได้นะ');
  await page.getByRole('button', { name: 'ดูตัวอย่างดาว' }).click();
  await expect(page.getByRole('button', { name: 'พับแล้วส่งดาว' })).toBeEnabled();
  await page.getByRole('button', { name: 'พับแล้วส่งดาว' }).click();
  await expect(page.getByRole('heading', { name: 'ส่งดาวแล้ว' })).toBeVisible();
});

test('production menu hides account history and exposes policy pages', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'เปิดเมนู' }).click();
  await expect(page.getByRole('button', { name: 'ดาวที่เคยเขียน' })).toHaveCount(0);
  await page.getByRole('button', { name: 'ความเป็นส่วนตัว' }).click();
  await expect(page.getByRole('heading', { name: 'ความเป็นส่วนตัว' })).toBeVisible();
  await page.getByRole('button', { name: 'เปิดเมนู' }).click();
  await page.getByRole('button', { name: 'ข้อตกลงการใช้งาน' }).click();
  await expect(page.getByText(/ไม่ใช่บริการฉุกเฉิน/)).toBeVisible();
});
