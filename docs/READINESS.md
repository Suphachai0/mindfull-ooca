# สถานะ Production — 8 กันยายน 2026

ระบบ Beta เปิดใช้งานที่ `https://mindfull-ooca.pages.dev` และเชื่อม Repository สาธารณะ `Suphachai0/mindfull-ooca`

## พร้อมใช้งาน

- อ่านดาว approved ทั้ง 6 กลุ่มจาก Supabase และสุ่มไม่ซ้ำในชุด
- เขียน ดูตัวอย่าง พับ และส่งดาว Guest ผ่าน Turnstile; ข้อความใหม่เป็น pending เสมอ
- เก็บดาว approved ในเบราว์เซอร์ของผู้ใช้ พร้อมตรวจสถานะอีกครั้งก่อนเปิด
- รองรับมือถือ แท็บเล็ต และเดสก์ท็อปที่ 320, 390, 834 และ 1280 px รวม reduced motion
- Privacy, Terms, Beta และช่องแจ้งปัญหาผ่าน GitHub Issues
- RLS, rate limit, idempotency, moderation helper, audit log และงานล้างข้อมูลรายวัน
- GitHub Actions ตรวจ build, unit tests และ browser tests ทุก push; Cloudflare deploy จาก `main` อัตโนมัติ

## งานรอบถัดไป

1. เปิด Login เมื่อพร้อม พร้อมทดสอบ OAuth, session, ผู้ดูแล และสิทธิ์ข้ามบัญชีจริง
2. เพิ่ม pagination/ค้นหาให้คิวตรวจเมื่อมีข้อมูลมากกว่า 500 รายการ
3. เพิ่มการตรวจสถานะแบบ realtime หรือเมื่อแท็บกลับมา active สำหรับดาวที่เปิดค้างไว้
4. เพิ่ม Safari/Firefox, concurrency และ backup/restore drill
5. แบ่ง JavaScript bundle เพื่อให้โหลดครั้งแรกเร็วขึ้น
6. จัดเวรตรวจข้อความและรายงานตามคู่มือ `MODERATION.md`

กราฟิกและ motion ใช้จาก Figma เดิมโดยไม่ได้แก้ไฟล์ Figma โถดาวเป็น local-only และระบบ Login ยังปิดตามขอบเขต MVP
