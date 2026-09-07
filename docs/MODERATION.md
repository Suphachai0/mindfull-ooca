# ตรวจข้อความผ่าน Supabase Dashboard

ใช้ขั้นตอนนี้ชั่วคราวระหว่างที่ระบบ Login ยังปิดอยู่ ห้ามแก้ `stars.status` ตรงใน Table Editor เพราะจะไม่มี audit log และรายงานจะไม่ถูกปิดพร้อมกัน

1. เปิด Supabase → SQL Editor ในโปรเจ็กต์ production
2. ดูข้อความรอตรวจด้วย `select * from public.dashboard_pending_messages;`
3. ดูรายงานที่ยังไม่ปิดด้วย `select * from public.dashboard_open_reports;`
4. อ่านเนื้อหาและ emotion แล้วเรียกคำสั่งเดียวต่อข้อความ โดยใส่ UUID, ผล และเหตุผลจริง:

```sql
select public.dashboard_review_star(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'approved'::public.star_status,
  'ข้อความให้กำลังใจทั่วไป ไม่มีข้อมูลส่วนตัว'
);
```

ผลที่ใช้ได้คือ `approved`, `rejected`, `hidden` เท่านั้น ทุกครั้งจะบันทึกเหตุผลใน `moderation_log` และปิดรายงานที่เกี่ยวข้องใน transaction เดียว

ข้อความชุมชนใหม่เริ่มที่ `pending` และจะไม่ถูกสุ่มก่อนอนุมัติ ข้อความ pending/rejected เกิน 30 วันจะถูกลบอัตโนมัติ รายงานกับ audit log เก็บ 365 วัน และข้อมูลป้องกันส่งถี่เก็บ 1 วัน
