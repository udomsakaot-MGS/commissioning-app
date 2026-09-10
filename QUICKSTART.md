# Quick Start - Google Sheets + Vercel

## ✨ 5 นาที Setup

### 1️⃣ สร้าง Google Sheet (2 นาที)

```
1. ไปที่ https://sheets.google.com
2. สร้าง Spreadsheet ใหม่
3. Rename sheet แรก เป็น "Combined"
4. เพิ่ม columns ตามนี้:
   projectId | projectRef | customer | soNumber | deliveryDate | 
   commissioningDate | status | technician | iSolarCloudName | notes | 
   deviceType | sn | itemNo | model | iSolarCloud | commissionStatus
5. เพิ่มข้อมูล 1-2 rows
6. Share → "Anyone with link" → Copy URL
```

**Copy Sheet ID จาก URL:**
```
https://docs.google.com/spreadsheets/d/[THIS_IS_YOUR_SHEET_ID]/edit
```

### 2️⃣ สร้าง Google API Key (1 นาที)

```
1. ไปที่ https://console.cloud.google.com
2. Create new project
3. Search "Sheets API" → Enable
4. Go to Credentials → Create "API Key"
5. Copy API Key
```

### 3️⃣ Deploy ไป Vercel (2 นาที)

```bash
# Clone repo
git clone https://github.com/udomsak-aot-MGS/commissioning-app.git
cd commissioning-app

# Deploy
npm install -g vercel
vercel

# ระหว่าง vercel setup ให้ตอบคำถาม:
# - Link to existing project? No
# - Project name? commissioning-app
# - Detected framework? Vite
```

### 4️⃣ ตั้งค่า Environment Variables

เมื่อ Vercel deployment เสร็จ:

```
1. ไปที่ Vercel Dashboard → Project Settings
2. Environment Variables
3. เพิ่ม 2 ตัวแปร:
   VITE_GOOGLE_SHEET_ID = [your_sheet_id]
   VITE_GOOGLE_API_KEY = [your_api_key]
4. Redeploy (Settings → Deployments → Redeploy)
```

### ✅ เสร็จ!

เปิด https://commissioning-app-[random].vercel.app ได้แล้ว 🎉

---

## 🔧 Local Development

```bash
# สร้าง .env ในโฟลเดอร์ root
VITE_GOOGLE_SHEET_ID=your_sheet_id
VITE_GOOGLE_API_KEY=your_api_key

# Start
npm install
npm run dev

# Build
npm run build
npm run preview
```

---

## 📝 Data Structure

### Combined Sheet Format:
```
| projectId | projectRef | customer | soNumber | ... | deviceType | sn | ... |
|-----------|-----------|----------|----------|-----|------------|----|----|
| P001 | โครงการ 1 | บริษัท A | SO-001 | ... | inverter | A123 | ... |
| P001 | โครงการ 1 | บริษัท A | SO-001 | ... | logger | A456 | ... |
```

### Device Types:
- `inverter` - อินเวอร์เตอร์
- `optimizer` - ออปทิไมเซอร์
- `rapidShutdown` - Rapid Shutdown
- `logger` - Data Logger
- `meter` - Energy Meter
- `mounting` - Mounting

### Status Values:
- `pending` - รอดำเนินการ
- `in_progress` - กำลังดำเนินการ
- `completed` - เสร็จสิ้น
- `issue` - มีปัญหา

---

## 🔗 Share URL

หลังจาก Deploy ให้แชร์ URL:
```
https://commissioning-app-[random].vercel.app
```

---

## ❓ Help

- 📖 Full Guide: `GOOGLE_SHEETS_SETUP.md`
- 🚀 Deploy Guide: `DEPLOY_GUIDE.md`
- 📧 Contact: udomsak.aot@mglobalsourcing.net
