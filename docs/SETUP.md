# คู่มือตั้งค่าในขั้นถัดไป

ระบบ Login ยังพักไว้ การเปิด production รอบนี้ใช้ Supabase สำหรับดาวส่วนกลาง, Cloudflare Turnstile และโถดาวใน browser

## 1. ทดลองและตรวจเนื้อหา
เปิดตาม README ใช้บัญชีทดลองและหน้าตรวจข้อความเพื่อลองอนุมัติ/ซ่อน ข้อมูลทั้งหมดอยู่ในเครื่อง ตรวจข้อความทีมใน src/seeds.ts ก่อนนำไปใช้จริง ไม่มี seed ที่อนุมัติถูกส่งเข้าฐานข้อมูลจริงอัตโนมัติ

## 2. Supabase
โปรเจ็กต์ที่ผู้ใช้ส่ง: https://jrtxrrghyutwbbujtubt.supabase.co
- ใช้ Supabase CLI login ผ่านเครื่องตนเอง แล้ว link โปรเจ็กต์ ตรวจ SQL ทั้งสองไฟล์ใน supabase/migrations ก่อน db push
- deploy function star-api ด้วย config ที่ให้มา verify_jwt=false รองรับ guest แต่ function ตรวจ user token เองทุกครั้งที่มี Authorization
- ตั้ง secrets ของ function: ALLOWED_ORIGINS (origin ที่อนุญาตคั่นด้วย comma), TURNSTILE_SECRET_KEY, RATE_LIMIT_SALT (ค่าสุ่มลับยาว) ส่วน SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY เป็นค่าที่ runtime Supabase จัดให้
- ช่วงที่ปิด Login ให้ตรวจข้อความผ่าน SQL Editor ตาม `docs/MODERATION.md`
- ทุกตารางเปิด RLS และไม่ให้ anon/authenticated เข้าถึงโดยตรง ใช้ Edge Function เป็นทางเข้า
- อย่าแชร์ database password, service role, Google client secret หรือ Turnstile secret ในแชท/โค้ด/GitHub

## 3. การลงชื่อเข้าใช้ (พักไว้)
กลับมาทำ Google OAuth หลัง flow หลักผ่านการตรวจ: Google Auth Platform → consent screen/audience/client → ใส่ callback จาก Supabase → ใส่ client ID/secret ใน Google provider ของ Supabase → ตั้ง site URL และ redirect allowlist ของเว็บ staging/production → ทดสอบกลับมาเก็บดาวดวงเดิมหลัง login รวมทั้ง logout/session expiry

## 4. GitHub และ Cloudflare
- สร้าง repository แล้วอัปโหลด source โดยไม่รวม .env, node_modules และข้อมูลผู้ใช้
- เชื่อม repository กับ Cloudflare Pages ใช้ build command `npm run build`, output `dist`, Node 22
- ตั้ง VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_TURNSTILE_SITE_KEY, VITE_AUTH_ENABLED=false, VITE_PREVIEW_MODE=false และ VITE_FEEDBACK_URL ผ่านหน้าตั้งค่าของโฮสต์
- Publishable key ใช้ใน browser ได้ แต่ service role และ secret ห้ามใช้ตัวแปรขึ้นต้น VITE_
- ให้ VITE_PREVIEW_MODE=false สำหรับบริการจริง; หากไม่มี backend เว็บต้องไม่แสดงข้อมูลทดลองเป็นข้อมูลจริง
- Turnstile ใช้ action `submit` และ `report` ให้ตรงกับ Edge Function
- ทดสอบ staging ตาม READINESS แล้วจึงเปิด production ไม่กด deploy เพื่อถือว่าผ่านการทดสอบ

Production URL ที่ตั้งใจใช้คือ `https://mindfull-ooca.pages.dev` และ fallback คือ `https://mindfull-ooca-suphachai.pages.dev`
