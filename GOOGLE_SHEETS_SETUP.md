# Google Sheets Setup Guide

## การตั้งค่า Google Sheets สำหรับ Commissioning App

### ขั้นตอนที่ 1: สร้าง Google Sheet

1. ไปที่ [Google Sheets](https://sheets.google.com)
2. สร้าง Spreadsheet ใหม่
3. สร้าง 2 sheets:
   - **Sheet ที่ 1**: ตั้งชื่อ "Input" - สำหรับข้อมูลเบื้องต้น
   - **Sheet ที่ 2**: ตั้งชื่อ "Combined" - สำหรับข้อมูลที่รวมและแก้ไข

### ขั้นตอนที่ 2: ตั้งค่า Combined Sheet

สร้างโครงสร้าง columns ตามนี้:

**Header Row:**
```
projectId | projectRef | customer | soNumber | deliveryDate | commissioningDate | status | technician | iSolarCloudName | notes | deviceType | sn | itemNo | model | iSolarCloud | commissionStatus
```

**ตัวอย่างข้อมูล:**
```
P001 | โครงการ Sermsang 35MW | บริษัท เสริมสร้างพลังงาน | SO-2025-0891 | 2025-05-19 | 2025-06-01 | in_progress | นายสมชาย ใจดี | Sermsang_35MW | ติดตั้ง 4 zones | inverter | A2532428413 | MINV-SG125CX-P210-01 | SG125CX-P2 | TRUE | completed
```

### ขั้นตอนที่ 3: ความเป็นส่วนตัว (Share Settings)

1. คลิก Share (มุมบนขวา)
2. เปลี่ยนเป็น "Anyone with the link can view"
3. คัดลอก URL และเก็บ Sheet ID (ตัวเลขใน URL)

### ขั้นตอนที่ 4: ตั้งค่า Google Sheets API

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com)
2. สร้าง Project ใหม่
3. Enable "Google Sheets API"
4. สร้าง "API Key" ใน Credentials
5. บันทึก API Key

### ขั้นตอนที่ 5: ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ในโฟลเดอร์ root:

```env
VITE_GOOGLE_SHEET_ID=your_sheet_id_from_url
VITE_GOOGLE_API_KEY=your_api_key_from_google_cloud
```

ตัวอย่าง:
```env
VITE_GOOGLE_SHEET_ID=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
VITE_GOOGLE_API_KEY=AIzaSyDwKNjDo7Z8X9Y0Z1a2b3c4d5e6f7g8h9i0
```

### ขั้นตอนที่ 6: ทดสอบและใช้งาน

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## โครงสร้างข้อมูล

### Input Sheet
เก็บข้อมูลดิบที่ input เข้ามา (ไม่ใช้ในขณะนี้ แต่เตรียมไว้สำหรับอนาคต)

### Combined Sheet
เก็บข้อมูลรวมทั้งหมด และสามารถแก้ไขได้ใน app:
- **Projects**: ข้อมูลโครงการ (projectRef, customer, soNumber, etc.)
- **Devices**: อุปกรณ์ (inverter, optimizer, logger, meter, etc.)

## Status Values

### Device Commission Status
- `pending` - รอดำเนินการ
- `in_progress` - กำลังดำเนินการ
- `completed` - เสร็จสิ้น
- `issue` - มีปัญหา

### Project Status
- `pending` - รอดำเนินการ
- `in_progress` - กำลังดำเนินการ
- `completed` - เสร็จสิ้น

## การแก้ไขข้อมูล

### ผ่าน App
- เปิด app แล้วแก้ไขตรงในหน้าจออ
- ข้อมูลจะ sync กลับไปยัง Google Sheets

### ผ่าน Google Sheets โดยตรง
- แก้ไขใน Google Sheets
- กด F5 ใน app เพื่อ refresh ข้อมูล

## คำเตือน

⚠️ **สำคัญ**: 
- Google Sheets อ่านเท่านั้น (Read-only) ขณะนี้ - การแก้ไขในเซッสชั่นปัจจุบันจะเก็บในหน่วยความจำเท่านั้น
- สำหรับการ sync แบบ 2 ทาง ต้องการ setup เพิ่มเติม (Google Apps Script หรือ Backend)
- ข้อมูลจะไม่หายหากปิด app (เก็บใน LocalStorage)

## Troubleshooting

| ปัญหา | วิธีแก้ไข |
|-------|---------|
| "Error loading data from sheets" | ตรวจสอบ SHEET_ID และ API_KEY ใน .env |
| "No data from sheets" | ตรวจสอบว่า Share settings ถูกต้อง |
| "CORS Error" | API Key ต้องมี "HTTP referrers" ที่อนุญาต |

## ติดต่อ

หากมีปัญหา ติดต่อ: udomsak.aot@mglobalsourcing.net
