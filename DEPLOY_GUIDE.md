# Deployment Guide - Sungrow Commissioning App

## ภาพรวม
Commissioning App พร้อมใช้งาน Google Sheets เป็น Database และสามารถ deploy ไป Vercel ได้

## ขั้นตอนการ Deploy

### ขั้นที่ 1: เตรียม Google Sheets

ทำตามขั้นตอนใน `GOOGLE_SHEETS_SETUP.md`:
1. สร้าง Google Sheet ใหม่
2. ตั้งค่า 2 sheets: "Input" และ "Combined"
3. คัดลอก Sheet ID และ API Key

**Sheet ID**: `https://docs.google.com/spreadsheets/d/[SHEET_ID_HERE]/edit`

### ขั้นที่ 2: สร้าง Vercel Project

#### Option A: ผ่าน Vercel CLI
```bash
npm install -g vercel
vercel login
cd commissioning-app
vercel
```

#### Option B: ผ่าน Vercel Website
1. ไปที่ https://vercel.com
2. Import จาก GitHub repo
3. เลือก `commissioning-app` folder

### ขั้นที่ 3: ตั้งค่า Environment Variables ใน Vercel

1. ไปที่ Project Settings → Environment Variables
2. เพิ่มตัวแปร:

```
VITE_GOOGLE_SHEET_ID = [your_sheet_id]
VITE_GOOGLE_API_KEY = [your_api_key]
```

### ขั้นที่ 4: Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch if using GitHub integration
git push origin main
```

## ตรวจสอบหลังจาก Deploy

1. เปิด URL ที่ Vercel ให้ (เช่น `https://commissioning-app.vercel.app`)
2. ตรวจสอบ:
   - ✅ ข้อมูล projects โหลดขึ้นมา
   - ✅ สามารถคลิก projects ได้
   - ✅ สามารถแก้ไข device status ได้
   - ✅ ไม่มี error ใน browser console

## URL ตัวอย่าง

หลังจาก deploy สำเร็จ:
```
https://commissioning-app-[random].vercel.app
```

## Troubleshooting

### ❌ "No data from sheets"
- ตรวจสอบ SHEET_ID ถูกต้อง
- ตรวจสอบ Google Sheets Share settings
- ตรวจสอบ API Key activation

### ❌ "CORS Error"
- Go to Google Cloud Console
- API Credentials → API Key
- Restriction → "HTTP referrers"
- Add `https://commissioning-app-*.vercel.app/*`

### ❌ Build fails
- ตรวจสอบ Node.js version >= 18
- ลบ node_modules และ package-lock.json
- Run `npm install` again

## การแก้ไขข้อมูล

### ใน App
1. เปิด project
2. แก้ไข device status หรือ project info
3. ข้อมูลเก็บใน browser (LocalStorage)

### ใน Google Sheets
1. แก้ไข Combined sheet
2. กลับไปที่ app กด F5 refresh
3. ข้อมูลจะโหลดใหม่

## Performance Tips

- ข้อมูลเก็บใน cache เพื่อลดการเรียก API
- ใช้ LocalStorage เพื่อลดการแสดง loading
- เฉพาะ "Combined" sheet ที่ใช้ใช้งาน

## Security Notes

⚠️ **สำคัญ**:
- Google API Key เป็น public key (ไม่มีความเสี่ยงตราบใดที่เก็บไว้เฉพาะ read-only)
- ห้ามใส่ API key แบบ service account ใน frontend
- หากต้อง write data กลับไป sheets ต้องมี backend

## Support

ติดต่อ: udomsak.aot@mglobalsourcing.net

## Useful Links

- [Vercel Docs](https://vercel.com/docs)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [React Documentation](https://react.dev)
