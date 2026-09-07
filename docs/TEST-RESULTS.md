# ผลตรวจ 7 กันยายน 2026

- TypeScript และ production build: ผ่าน (ยังมีคำเตือน bundle เกิน 500 kB ต้องแบ่งโหลดภายหลัง)
- Vitest: ผ่าน 3 รายการ ตรวจร่างทีมครบ 6 กลุ่ม, ข้อความ/Unicode, pool ไม่ซ้ำและไม่แสดง hidden, guest ไม่ถูกย้ายเข้าประวัติบัญชี, submission idempotency, save ซ้ำ, moderation และสิทธิ์ผู้ดูแลใน preview
- Chrome Playwright: ผ่าน 10 รายการ อ่าน/เก็บบน 320,390,834,1280 px; ข้อความเต็ม 120 code points ไม่ล้นกระดาษทั้ง 4 ขนาด; guest เขียน→preview→fold→send และประวัติแยก; motion จริงพับ 6 วินาทีและ pause/resume ขณะเปิด modal
- ตรวจภาพ jar และ preview จอเล็กด้วยสายตา ปรับ blend ภาพพื้นขาวให้เข้ากับพื้นหลัง

ผลนี้ครอบคลุมโหมดในเครื่อง ไม่ได้ยืนยัน Supabase, Google OAuth, Turnstile, หลายผู้ใช้พร้อมกัน, Safari/Firefox หรือความตรงกับ Figma ทุกจุด ดู READINESS.md ก่อนเปิดบริการจริง
