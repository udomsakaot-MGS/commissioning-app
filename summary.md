# สรุปโครงสร้างและโค้ด — Sungrow Commissioning Service App

อัปเดตล่าสุด: 2026-09-09

แอปจัดการงาน commissioning อินเวอร์เตอร์/ระบบพลังงานแสงอาทิตย์ ของ MGlobal (ตัวแทน Sungrow)
สร้างด้วย **React 19 + React Router v7 + Tailwind CSS v4 (Vite)**

---

## 1. แหล่งข้อมูล (สำคัญ — ตอบคำถามที่ถามไว้)

มี Excel 2 ไฟล์ที่ถูกแปลงเป็น JSON ใน `public/`:

| ไฟล์ JSON | ที่มา (Excel) | เนื้อหา |
|-----------|--------------|---------|
| `public/sn-data.json` (~17MB) | **MGlobal DB** | รายการ Serial Number ที่ MGlobal ส่งมอบ แยกตามโครงการ (604 โครงการ, ~168,000 SN) |
| `public/isc-plants.json` | **iSolarCloud Plants** | โรงไฟฟ้าที่ลงทะเบียนบน iSolarCloud (2,821 plants) |
| `src/data/ticketData.js` | Tickets.xlsx | ประวัติ Service Ticket + รายชื่อช่าง (TECHNICIANS) |

> **คำถาม: "โครงการ SN" มาจากการรวม 2 Excel หรือไม่?**
> **ตอบ: ไม่** — หน้า **โครงการ SN** (`Projects.jsx`) โหลดจาก `sn-data.json` (MGlobal DB) **อย่างเดียว**
> การรวม 2 Excel เกิดขึ้นเฉพาะในหน้า **iSC & MGlobal** (`PlantDatabase.jsx`) ซึ่งตอนนี้มีแท็บ **"รวมข้อมูล (iSC + MGlobal)"** โดยเฉพาะ

โครงสร้างแต่ละ SN ใน `sn-data.json`: array `[sn, item, desc, date, isc]`
ค่าคงที่อ้างอิง: `const SN_IDX = { sn: 0, item: 1, desc: 2, date: 3, isc: 4 }`

---

## 2. โครงสร้าง Navigation (หลังปรับปรุง)

กำหนดใน `src/components/Layout.jsx` — เมนูรองรับกลุ่มแบบ dropdown ผ่าน field `children`:

```
iSC & MGlobal            → /plant-database
แผนที่โรงไฟฟ้า            → /map
ปฏิทิน Commissioning      → /calendar
โครงการ SN               → /projects   (มีแท็บย่อย: โครงการ | ค้นหา SN)
Technical Service ▾       (dropdown)
   ├── Commissioning Tickets → /tickets
   └── ทีม                   → /team
นำเข้า Excel             → /import
```

**เปลี่ยนแปลงจากเดิม:**
- ❌ ตัด **แดชบอร์ด** และ **รายงาน** ออกจากเมนู (ไฟล์ `Dashboard.jsx`/`Reports.jsx` ยังอยู่ แต่ไม่ได้ route — Dashboard จะทำใหม่ภายหลัง)
- ❌ ตัด **ค้นหา SN** ออกจากเมนูหลัก → ย้ายเข้าไปเป็นแท็บใน "โครงการ SN"
- ✅ รวม **Commissioning Tickets + ทีม** เป็น dropdown **"Technical Service"**
- Route `/` redirect ไป `/projects`, และ `*` (ไม่พบ) redirect ไป `/projects`

State ของ dropdown: `serviceOpen` (เปิดอัตโนมัติเมื่ออยู่ในหน้าลูก), toggle ด้วยปุ่มกลุ่ม

---

## 3. หน้า โครงการ SN (`src/pages/Projects.jsx`)

### 3.1 แท็บ (view state: `'projects' | 'sn'`)
- **โครงการ** — การ์ดโครงการ + KPI + ตัวกรองสถานะ
- **ค้นหา SN** — component `SNSearchPanel` ค้นหา SN/Item/Model ข้ามทุกโครงการ (จำกัด 200 ผลลัพธ์แรกเพื่อ performance) คลิกแล้วไปหน้ารายละเอียดโครงการ

### 3.2 กติกาสถานะอัตโนมัติ (ตามที่ร้องขอ)
```js
const COMPLETE_CUTOFF = '2026-07-31'
function getAutoStatus(project) {
  const latest = project._latestDate?.slice(0, 10) || ''
  if (latest && latest <= COMPLETE_CUTOFF) return 'done'   // ส่งมอบ ≤ ก.ค. 2026 = ขึ้นโครงการเสร็จ
  if (invStats.total > 0 && onIsc === total) return 'done' // iSC ครบ = เสร็จ
  return 'unset'
}
```
> **ทุกโครงการที่ส่งมอบภายในเดือน 7 ปี 2026 ถือว่า "ขึ้นโครงการเสร็จแล้ว"** โดยอัตโนมัติ

### 3.3 แยกกลุ่ม เสร็จ มี/ไม่มี iSolarCloud
- `projectHasISC(p)` = มีอย่างน้อย 1 inverter รายงานเข้า iSC (`_invStats.onIsc > 0`)
- KPI แยกเป็น **เสร็จ · มี iSC** และ **เสร็จ · ไม่มี iSC**
- ตัวกรองเสมือน (virtual filter) `done_isc` / `done_noisc` ผ่าน `matchesStatusFilter()`
- ผลปัจจุบัน: 604 โครงการ → 156 เสร็จมี iSC · 438 เสร็จไม่มี iSC · 10 ยังไม่ระบุ

สถานะที่ผู้ใช้ตั้งเองถูกเก็บใน `localStorage['commissioning_project_data']` (override อัตโนมัติได้)

---

## 4. หน้า iSC & MGlobal (`src/pages/PlantDatabase.jsx`)

3 แท็บ (tab state: `'isc' | 'db' | 'combined'`):

1. **iSolarCloud Plants** — ตาราง 2,821 plants + ระบุว่ามีใน MGlobal / มี Service Ticket
2. **MGlobal DB** — 604 โครงการจาก `sn-data.json` (โหลดแบบ lazy เมื่อคลิก)
3. **รวมข้อมูล (iSC + MGlobal)** — *(ใหม่)* reconciliation รวม 2 Excel

### แท็บ "รวมข้อมูล" — logic (`combined` memo + `CombinedView`)
รวม union ของทั้ง 2 แหล่ง แล้วจัดหมวด `source`:
- **both** — plant ที่อยู่ทั้ง iSC และมี SN ใน MGlobal
- **isc** — อยู่เฉพาะ iSolarCloud (ไม่มี SN ใน MGlobal)
- **mglobal** — โครงการใน MGlobal ที่ไม่ถูกอ้างอิงโดย plant iSC ใด ๆ

ผลปัจจุบัน: **3,160 รายการ** = 1,670 ทั้งสอง + 1,151 เฉพาะ iSC + 339 เฉพาะ MGlobal
มี summary cards (คลิกกรองได้), ค้นหา, และ pagination (50/หน้า)

---

## 5. หน้า Commissioning Tickets (`src/pages/CommissioningTickets.jsx`) — เขียนใหม่ทั้งหมด

**Kanban board เวิร์กโฟลว์ 3 ระดับ** ตามที่ร้องขอ:

| ระดับ | stage key | ข้อมูลที่บันทึก |
|------|-----------|----------------|
| 1. วางแผน | `planning` | ชื่อโครงการ, ตำแหน่งติดตั้ง, ผู้ติดต่อ/เบอร์, **วันนัด (ประมาณการ)**, ช่าง, อุปกรณ์ |
| 2. ติดตั้งเสร็จ | `installed` | + **วันนัด (แน่นอน)** — ได้เมื่อหน้างานติดตั้งอุปกรณ์เสร็จ |
| 3. Commissioned | `commissioned` | + **รายละเอียด SN** (sn/model/type) เหมือนหน้าโครงการ SN |

**การทำงาน:**
- ปุ่ม **"ติดตั้งเสร็จ →"** / **"Commission เสร็จ →"** เลื่อน ticket ไปขั้นถัดไป (`advance`) — เลื่อนย้อนได้ (`regress`)
- ปุ่ม **"+ เพิ่ม Ticket"** เปิด modal สร้างใหม่ (form ปรับ field ตาม stage: confirmed date โผล่ที่ระดับ 2, ตาราง SN โผล่ที่ระดับ 3)
- แก้ไข/ลบผ่าน modal เดียวกัน · กรองด้วยช่าง/คำค้น
- Persist ทั้งหมดใน `localStorage['commissioning_workflow_tickets']` (seed ตัวอย่าง 5 ticket ครั้งแรก)
- ช่างดึงจาก `TECHNICIANS` ใน `ticketData.js` (Aoy/Sand/Boom/Tat)

---

## 6. ไฟล์สำคัญ

```
src/
├── App.jsx                      # Routes + DataContext (mock — ไม่ใช้กับ Projects แล้ว)
├── components/
│   ├── Layout.jsx               # Sidebar + Technical Service dropdown + header
│   └── KpiCard.jsx              # การ์ด KPI ที่ใช้ร่วม
├── pages/
│   ├── Projects.jsx             # โครงการ SN + แท็บค้นหา SN + auto-complete logic
│   ├── ProjectDetail.jsx        # รายละเอียดโครงการ (แก้สถานะราย SN)
│   ├── PlantDatabase.jsx        # iSC & MGlobal (3 แท็บ + รวมข้อมูล)
│   ├── CommissioningTickets.jsx # เวิร์กโฟลว์ 3 ระดับ (เขียนใหม่)
│   ├── CommissioningCalendar.jsx# ปฏิทิน 3 สัปดาห์
│   ├── ThailandMap.jsx          # แผนที่ bubble โรงไฟฟ้า
│   ├── Team.jsx                 # ทีมช่าง
│   ├── ExcelImport.jsx          # นำเข้า Excel
│   ├── Dashboard.jsx  (unrouted — จะทำใหม่)
│   ├── Reports.jsx    (unrouted — ตัดออก)
│   └── SNSearch.jsx   (unrouted — ย้ายเข้า Projects แล้ว)
└── data/
    ├── ticketData.js            # TECHNICIANS, TICKET_PROJECTS, PRODUCT_GROUP_MAP
    └── mockData.js              # ข้อมูลจำลอง (legacy)
public/  sn-data.json · isc-plants.json
```

## 7. รันโปรเจกต์
```bash
npm run dev -- --port 5174
```

## 8. หมายเหตุ / งานต่อไป
- **Dashboard** ถูกตัด route ชั่วคราว — รอออกแบบใหม่
- ข้อมูล workflow ticket และสถานะโครงการเก็บใน `localStorage` (ยังไม่มี backend)
- การเชื่อม SN ที่บันทึกในระดับ 3 ของ ticket เข้ากับ `sn-data.json` จริง ยังเป็นการกรอกมือ (จุดต่อยอด)
