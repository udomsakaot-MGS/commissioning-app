# ค้นหา Deployment URL

## หากคุณ Deploy แล้ว:

### 1. ตรวจสอบ .vercel/project.json
```bash
cat .vercel/project.json
```
จะได้ URL และ Project ID

### 2. ตรวจสอบจาก Vercel Dashboard
```
1. ไปที่ https://vercel.com/dashboard
2. เลือก commissioning-app
3. ดู URL ที่ด้านบน (Deployments)
```

### 3. ตรวจสอบจาก Git History
```bash
git log --grep="Vercel" --oneline
```

### 4. URL Format
```
https://commissioning-app-[random-string].vercel.app
```

### ตัวอย่าง URL:
```
https://commissioning-app-abc123xyz.vercel.app
https://commissioning-app-7k9m2n5p.vercel.app
https://commissioning-app-production.vercel.app
```

---

## หากยังไม่ Deploy:

ทำตามขั้นตอนใน `DEPLOY_MANUAL.md` เพื่อได้ URL

---

ต้องการ URL หลังจาก Deploy ขึ้นมา?
✅ ให้ผมอัปเดต URL ที่นี่
