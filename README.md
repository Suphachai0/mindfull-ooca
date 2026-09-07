# Mindfull-OOCA by suphachai_chaichang

เว็บอ่านและฝากข้อความให้กำลังใจ ออกแบบจาก Mobile ก่อนและรองรับ tablet/desktop สร้างด้วย React, TypeScript, Vite, Supabase และ Cloudflare Turnstile

## ทดลองในเครื่อง

ต้องมี Node.js 22 และ npm

```sh
npm ci
npm run dev
```

เปิด http://127.0.0.1:5173 เมื่อไม่มีค่า Supabase เว็บจะใช้โหมดทดลองในเครื่อง มีแถบแจ้งชัดเจนและไม่ส่งข้อมูลถึงผู้ใช้อื่น

- อ่านดาว → เลือกความรู้สึก → เลือกดาว → เปิดอ่าน → เก็บในเบราว์เซอร์
- เขียนดาว → เลือกความรู้สึก → เขียนไม่เกิน 120 ตัวอักษร → ดูตัวอย่าง → ยืนยัน Turnstile → พับและส่ง
- Production เก็บข้อความใหม่เป็น `pending`; ผู้ดูแลตรวจผ่าน Supabase Dashboard ตาม [คู่มือตรวจข้อความ](docs/MODERATION.md)

## ตรวจงาน

```sh
npm test
npm run build
npm run test:e2e
npm run test:production
```

Browser tests ใช้ Chrome ทดสอบ 320, 390, 834 และ 1280 px รวม production configuration ที่จำลอง Supabase และ Turnstile

## Production

- Cloudflare Pages: Node 22, build `npm run build`, output `dist`
- Environment variables: ดู `.env.example`
- Database และ Edge Function: อยู่ใน `supabase/`
- ห้ามใส่ Supabase secret key, Turnstile secret, GitHub token หรือ Cloudflare token ลง repository

ดู [คู่มือตั้งค่า](docs/SETUP.md), [คู่มือตรวจข้อความ](docs/MODERATION.md) และ [รายการตรวจความพร้อม](docs/READINESS.md)
