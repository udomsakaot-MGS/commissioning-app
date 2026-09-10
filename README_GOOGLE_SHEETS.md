# Sungrow Commissioning App - Google Sheets Integration

## 📋 สรุปไฟล์ที่สร้างใหม่

### 🔧 Core Integration Files
```
src/
├── services/
│   └── googleSheetsService.js    # Google Sheets API integration
├── hooks/
│   └── useProjectsWithSheets.js  # React hook for data sync
└── utils/
    └── setupHelper.js            # Setup utilities
```

### 📚 Documentation Files
```
├── GOOGLE_SHEETS_SETUP.md        # ขั้นตอนตั้งค่า Google Sheets
├── DEPLOY_GUIDE.md               # ขั้นตอนการ Deploy ไป Vercel
├── QUICKSTART.md                 # Quick start (5 นาที)
└── .env.example                  # Template environment variables
```

### 🔄 Modified Files
```
├── src/App.jsx                   # Updated to use Google Sheets
├── vercel.json                   # Added env variables for Vercel
└── package.json                  # (unchanged, all deps already installed)
```

---

## 🚀 การ Deploy (แบบรวดเร็ว)

### Step 1: เตรียม Google Sheets
ทำตามใน `QUICKSTART.md` หรือ `GOOGLE_SHEETS_SETUP.md`

### Step 2: Deploy ไป Vercel

#### Option A: ใช้ Vercel CLI
```bash
npm install -g vercel
cd "D:\AI_Claude\Claude Code\commissioning-app"
vercel --prod
```

#### Option B: ใช้ Vercel Web Dashboard
1. ไปที่ https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. เลือก Repository: `udomsak-aot-MGS/commissioning-app`
4. ตั้งค่า:
   - Framework: Vite
   - Root Directory: `commissioning-app`
5. Environment Variables:
   - `VITE_GOOGLE_SHEET_ID` = [your sheet id]
   - `VITE_GOOGLE_API_KEY` = [your api key]
6. Deploy!

### Step 3: แชร์ URL
เปิด App ได้ที่ URL ที่ Vercel ให้มา

---

## 🔑 Environment Variables

ต้องตั้งค่า 2 ตัวแปรใน Vercel Project Settings:

| Variable | ค่า |
|----------|-----|
| `VITE_GOOGLE_SHEET_ID` | Sheet ID จาก Google Sheets URL |
| `VITE_GOOGLE_API_KEY` | API Key จาก Google Cloud Console |

### How to get SHEET_ID:
```
URL: https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f/edit
SHEET_ID: 1a2b3c4d5e6f
```

### How to get API_KEY:
1. Google Cloud Console → APIs & Services → Credentials
2. Create API Key
3. Copy the key

---

## 📊 ข้อมูล Google Sheets Structure

### Combined Sheet Layout:
```
Column:   A          B          C          D        E           F
         projectId  projectRef customer   soNumber deliveryDate commissioningDate
         P001       โครงการ 1  บริษัท A   SO-001   2025-05-19   2025-06-01
         P001       โครงการ 1  บริษัท A   SO-001   2025-05-19   2025-06-01

Column:   G        H           I            J       K           L
         status   technician  iSolarCloud  notes   deviceType  sn
         in_prog  นายสมชาย   Sermsang    ติดตั้ง  inverter    A2532428413
         in_prog  นายสมชาย   Sermsang    ติดตั้ง  logger      A2471738282
```

---

## ✅ Checklist สำหรับ Deploy

- [ ] สร้าง Google Sheet ที่มี "Combined" sheet
- [ ] เพิ่มข้อมูลอย่างน้อย 1 project + devices
- [ ] สร้าง Google Cloud Project
- [ ] Enable Google Sheets API
- [ ] สร้าง API Key
- [ ] Share Google Sheet (Anyone with link)
- [ ] Deploy ไป Vercel (CLI หรือ Web)
- [ ] ตั้งค่า Environment Variables
- [ ] Redeploy project
- [ ] ทดสอบ: เปิด URL และตรวจสอบ data

---

## 🔗 URLs ที่ต้องจำ

```
Google Cloud Console:  https://console.cloud.google.com
Google Sheets:         https://sheets.google.com
Vercel Dashboard:      https://vercel.com/dashboard
Your App:              https://commissioning-app-[random].vercel.app
```

---

## 📞 Support

- ❓ Questions? อ่าน: `QUICKSTART.md` → `DEPLOY_GUIDE.md` → `GOOGLE_SHEETS_SETUP.md`
- 📧 Contact: udomsak.aot@mglobalsourcing.net

---

## 🎯 Next Steps

1. สร้าง Google Sheet และ API Key
2. Deploy ไป Vercel
3. ตั้งค่า Environment Variables
4. Redeploy
5. เปิด App และแชร์ URL ไปให้เพื่อน/ทีม

💡 **Pro Tip**: Save SHEET_ID และ API_KEY ไว้ซ่อนๆ ให้ดี ห้ามแชร์แบบสาธารณะ
