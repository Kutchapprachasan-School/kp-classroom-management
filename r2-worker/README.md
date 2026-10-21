# Cloudflare R2 Storage Worker (Kutchapprachasan School)
ระบบจัดเก็บและเสิร์ฟไฟล์ผลงานนักเรียนและเอกสารโรงเรียนผ่าน Cloudflare R2 (Zero Egress Fee)
ตามกฎสถาปัตยกรรม **Pillar 6: R2-Only Storage for All Assets & Documents**

---

## 🚀 ขั้นตอนการติดตั้งและ Deploy ผ่าน Terminal

### 1. เข้าโฟลเดอร์ Worker และล็อกอิน Cloudflare
```bash
cd r2-worker
npx wrangler login
```

### 2. สั่งสร้าง R2 Bucket
*(หากยังไม่ได้เปิดใช้งาน R2 ในหน้า Cloudflare Dashboard ให้กด Enable R2 ในหน้าเว็บก่อน 1 ครั้ง)*
```bash
npx wrangler r2 bucket create kp-classroom-submissions
```

### 3. ตั้งรหัสผ่าน Secret และ Deploy Worker
```bash
npx wrangler secret put UPLOAD_SECRET
# พิมพ์รหัสผ่านลับ เช่น your-secure-secret-key แล้วกด Enter

npx wrangler deploy
```
เมื่อ Deploy เสร็จ Terminal จะแสดง URL เช่น: `https://kps-r2-storage.<subdomain>.workers.dev`

---

## 🌐 การผูกโดเมน storage.kps.ac.th บน Cloudflare

### รูปแบบที่ 1: ผูก Custom Domain เข้ากับ Worker โดยตรง (แนะนำที่สุด ⭐)
ทำให้ URL เดียวรองรับทั้งการอัปโหลด (`PUT`), ลบ (`DELETE`) และเปิดดูภาพ (`GET`)
1. เข้าไปที่ Cloudflare Dashboard → **Workers & Pages** → เลือก `kps-r2-storage`
2. ไปที่แท็บ **Settings** → **Domains & Routes**
3. คลิก **Add** → **Custom domain** → พิมพ์ `storage.kps.ac.th` → กด **Add Custom Domain**
4. ตั้งค่าใน `.env` ของโปรเจกต์เว็บโรงเรียน:
```env
VITE_R2_WORKER_URL="https://storage.kps.ac.th"
VITE_R2_PUBLIC_URL="https://storage.kps.ac.th"
VITE_R2_UPLOAD_SECRET="รหัสผ่านที่ตั้งใน wrangler secret"
```

---

### รูปแบบที่ 2: ผูกโดเมนเข้ากับ R2 Bucket โดยตรง (Read-Only)
เสิร์ฟไฟล์ภาพผ่าน `storage.kps.ac.th` ส่วนอัปโหลดวิ่งผ่าน `workers.dev`
1. เข้า Cloudflare Dashboard → **R2 Object Storage** → คลิก Bucket `kp-classroom-submissions`
2. แท็บ **Settings** → **Public Development URL / Custom Domains** → คลิก **Connect Domain**
3. พิมพ์ `storage.kps.ac.th` และกด Connect
4. ตั้งค่าใน `.env`:
```env
VITE_R2_WORKER_URL="https://kps-r2-storage.<subdomain>.workers.dev"
VITE_R2_PUBLIC_URL="https://storage.kps.ac.th"
VITE_R2_UPLOAD_SECRET="รหัสผ่านที่ตั้งใน wrangler secret"
```

---

### 💡 กรณีที่โดเมน kps.ac.th ยังไม่ได้ย้ายมา Cloudflare
สามารถใช้ URL ของ Worker ทั้ง 2 ช่องได้ทันที ใช้งานข้ามเครื่องได้จริง 100%:
```env
VITE_R2_WORKER_URL="https://kps-r2-storage.<subdomain>.workers.dev"
VITE_R2_PUBLIC_URL="https://kps-r2-storage.<subdomain>.workers.dev"
VITE_R2_UPLOAD_SECRET="รหัสผ่านที่ตั้งใน wrangler secret"
```
