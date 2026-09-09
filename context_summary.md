# Commissioning App — Context Summary

อัพเดต: 2026-08-18  
Dev server: `npm run dev` → **http://localhost:5174**

---

## Tech Stack

| เครื่องมือ | เวอร์ชัน / รายละเอียด |
|---|---|
| React | 18 + Vite 8 |
| Tailwind CSS | v4 (`@tailwindcss/vite` plugin) |
| React Router | DOM v7 (BrowserRouter) |
| SheetJS | xlsx v0.18.5 (อ่าน .xlsx / .xlsb) |
| Lucide React | icons |
| Node.js | pre-processing scripts (ไม่ใช่ backend จริง) |

`vite.config.js` กำหนด `server: { port: 5174 }` เพื่อให้ตรงกับ `.claude/launch.json`

---

## แหล่งข้อมูล (3 Sources)

| # | ที่มา | ไฟล์ต้นทาง | สร้าง JSON |
|---|---|---|---|
| 1 | **iSolarCloud** (หลัก) | `Isolarcloud.xlsx` | `public/isc-plants.json` |
| 2 | **ฐานข้อมูล SN / MGlobal** | `Update sell for Technical(1).xlsb` | `public/sn-data.json` |
| 3 | **Service Tickets** | `Tickets.xlsx` | `src/data/ticketData.js` |

> ข้อมูลจาก Excel ถูก pre-process ด้วย Node.js scripts แล้วบันทึกเป็น static JSON ใน `public/`  
> Browser fetch JSON ตอน runtime — **ไม่มี backend server**

---

## โครงสร้างไฟล์สำคัญ

```
commissioning-app/
├── public/
│   ├── sn-data.json        # 17.8MB — SN DB (168,464 SN, 604 projects)
│   ├── isc-plants.json     # 1.2MB  — iSolarCloud plants (2,821 plants)
│   └── isc-compare.json    # 0.3MB  — ผลเทียบ iSC vs DB (reference)
│
├── src/
│   ├── App.jsx             # Routes + DataContext
│   ├── main.jsx
│   ├── components/
│   │   └── Layout.jsx      # Sidebar nav + header
│   ├── data/
│   │   ├── ticketData.js   # ~82KB — export TECHNICIANS, TICKET_PROJECTS, COMMISSIONING_TICKETS
│   │   └── mockData.js     # mock data เดิม (ยังใช้ใน /projects)
│   └── pages/
│       ├── PlantDatabase.jsx       # ★ หน้าหลัก: iSC + SN DB รวมกัน (2 tabs)
│       ├── CommissioningTickets.jsx # Ticket 190 ใบ, 126 projects
│       ├── Team.jsx                # 4 technicians, KPI, workload chart
│       ├── SNDatabase.jsx          # (ยังมีอยู่ แต่ไม่ได้อยู่ใน nav แล้ว)
│       ├── ISCPlants.jsx           # (ยังมีอยู่ แต่ถูกรวมเข้า PlantDatabase)
│       ├── Dashboard.jsx
│       ├── Projects.jsx / ProjectDetail.jsx
│       ├── SNSearch.jsx
│       ├── ExcelImport.jsx
│       └── Reports.jsx
│
├── vite.config.js          # port: 5174
└── .claude/launch.json     # commissioning-app → port 5174
```

---

## Routes & Navigation

```
/ → redirect /dashboard

/dashboard          แดชบอร์ด
/plant-database  ★  iSC & ฐานข้อมูล SN  ← หน้าใหม่รวม 2 หน้าเดิม
/projects           โครงการ SN (mock data)
/tickets            Commissioning Tickets
/team               ทีม
/sn-search          ค้นหา SN
/import             นำเข้า Excel
/reports            รายงาน
```

---

## หน้าหลัก: PlantDatabase (`/plant-database`)

### โครงสร้างการโหลดข้อมูล

```
mount → fetch /isc-plants.json (1.2MB, เร็ว)
คลิก tab "ฐานข้อมูล SN" → fetch /sn-data.json (17.8MB, lazy)
                           → build snMap: Map<SN_uppercase → { item, desc, date, isc, group }>
```

### Tab 1: iSolarCloud Plants

- แสดง 2,821 โรงไฟฟ้าจาก iSC เรียงตาม MGlobal ก่อน จากนั้น power desc
- **badge** ต่อแถว:
  - `iSC` (น้ำเงิน) — ทุกแถว
  - `MGlobal` (เขียว) / `MGlobal*` (เหลือง = partial) — SN อยู่ใน sn-data.json
  - `Service` (ส้ม) — ชื่อตรงกับ `TICKET_PROJECTS[].iSolarCloudName`
- **Expand row** (คลิก chevron) → ดึง SNs จาก snMap แสดงตาราง:
  ประเภท | Serial Number | **Model** | รายละเอียด | วันส่งมอบ | iSC
  - Model = `desc.split(',')[0]` = ชื่อรุ่น Sungrow จริง (เช่น `SG350HX`, `SG125CX-P2`)
  - Item No. แสดงเป็น text เล็กสีเทาใต้ Model (เช่น `MINV-SG350HX15`)
  - รายละเอียด = `desc` หลัง comma แรก (ตัด model prefix ออก)

### Tab 2: ฐานข้อมูล SN

- Mini bar chart 7 ประเภทสินค้า (คลิกกรอง)
- 604 project cards → expand → SN table (pagination 50/หน้า), ใช้ column **Model** เดียวกับ Tab 1
- `max-h-[60vh] overflow-y-auto` เพื่อไม่ให้ scroll ทั้งหน้า

### KPI row (อัพเดตตาม data ที่โหลด)

| Card | ค่า |
|---|---|
| iSolarCloud Plants | 2,821 · 521 MWp |
| MGlobal | 1,670 (59%) |
| SN ในฐานข้อมูล | 168,464 · 604 projects (โหลด lazy) |
| มี Commissioning | 38 plants |

---

## รูปแบบ JSON สำคัญ

### `public/sn-data.json`

```json
{
  "projects": [
    {
      "project": "ชื่อโครงการ",
      "customer": "ชื่อลูกค้า",
      "groups": {
        "M-INVERTER": [[sn, item, desc, date, isc], ...],
        "M-OPTIMIZER": [...],
        "M-RAPID SHUTDOWN": [...],
        ...
      },
      "iscCount": 13934,
      "total": 14086
    }
  ],
  "groupTotals": {
    "M-INVERTER": 5948,
    "M-OPTIMIZER": 44331,
    "M-RAPID SHUTDOWN": 116077,
    "M-DATA LOGGER": 403,
    "M-ENERGY METER": 1684,
    "M-BATTERY": 8,
    "M-ENERGY STORAGE": 13
  },
  "totalSN": 168464,
  "generatedAt": "ISO string"
}
```

> SN เก็บเป็น compact array: `[sn, item, desc, date, isc]`  
> index: `SN_IDX = { sn:0, item:1, desc:2, date:3, isc:4 }`  
> `isc` = 0 หรือ 1 (ไม่ใช่ boolean เพื่อประหยัดขนาด)

### `public/isc-plants.json`

```json
{
  "summary": {
    "totalPlants": 2821,
    "totalSNs": 5672,
    "totalPowerKWp": 521400.1,
    "mglobalPlants": 1670,
    "mglobalPct": 59
  },
  "plants": [
    {
      "plant": "ชื่อโรงไฟฟ้าใน iSC",
      "power": 11640,
      "date": "2025-12-23",
      "address": "...",
      "sns": ["A2472902648", ...],
      "snCount": 30,
      "mglobal": true,
      "mglobalPartial": true,
      "mglobalSNCount": 29,
      "dbProjects": ["โครงการ SKW5"],
      "dbCustomers": ["..."]
    }
  ]
}
```

> เรียงลำดับ: MGlobal ก่อน → power desc  
> `mglobalPartial = true` = บาง SN ไม่อยู่ใน DB (badge เหลือง)

### `src/data/ticketData.js` (ES module)

```js
export const TECHNICIANS       // 4 คน: name, nick, dept, email, commissioningCount, products, firstDate, lastDate
export const TICKET_PROJECTS   // 126 projects: project, customer, tickets[], techs[], iSolarCloud, iSolarCloudName, gridDate
export const COMMISSIONING_TICKETS  // 190 tickets: id(8char), customer, project, product, tech, dateStart, dateResolved
export const PRODUCT_GROUP_MAP // { productName: 'inverter'|'optimizer'|'rapidShutdown'|'logger'|'meter' }
```

---

## Pre-processing Scripts (Scratchpad)

| Script | สร้างจาก | ผลลัพธ์ |
|---|---|---|
| *(run once ใน session ก่อน)* | `Update sell for Technical(1).xlsb` | `public/sn-data.json` |
| `build_isc_plants.js` | `Isolarcloud.xlsx` + `sn-data.json` | `public/isc-plants.json` |
| `compare_isc.js` | `Isolarcloud.xlsx` + `sn-data.json` | `public/isc-compare.json` |

Script อยู่ที่: `C:\Users\udomsak.aot\AppData\Local\Temp\claude\...\scratchpad\`

**ถ้าต้องอัพเดต data:**
1. แทนที่ไฟล์ Excel ต้นทาง
2. รัน Node.js script เพื่อ regenerate JSON
3. Vite serve ไฟล์ใหม่อัตโนมัติ (hot reload ไม่ทำงานกับ public files — ต้อง reload browser)

---

## ผลการเทียบ iSolarCloud vs MGlobal DB

| | จำนวน |
|---|---|
| iSC Plants ทั้งหมด | 2,821 |
| ครบทุก SN อยู่ใน DB | 1,574 (55.8%) |
| บาง SN อยู่ใน DB | 96 (3.4%) |
| ไม่มี SN ใดอยู่ใน DB | 1,149 (40.8%) |

> 1,149 plants ที่ไม่พบส่วนใหญ่เป็น inverter รุ่นเก่า (prefix A22x, A19x, A18x)  
> ไม่อยู่ใน Excel ชุดปัจจุบัน — ไม่ใช่ข้อผิดพลาด

---

## Team & Tickets

### Technicians (4 คน)
| ชื่อ | ชื่อเล่น | Tickets |
|---|---|---|
| Udomsak Aotphon | Sand | 60 |
| Nalinee Khanthong | Aoy | 49 |
| Bunyaphon Bualuang | Boom | 49 |
| Tanatat Pornthepsiripong | Tat | 32 |

### Commissioning Tickets
- 190 tickets · 126 projects · iSolarCloud 49% · 100% resolved
- ช่วงเวลา: ปี 2025–2026

---

## Helper Functions (PlantDatabase.jsx)

```js
// แปลง desc → Sungrow Model name (ก่อน comma แรก)
function getModel(desc)      // "SG125CX-P2,..." → "SG125CX-P2"
function getDescDetail(desc) // "SG125CX-P2,..." → "Sungrow Inverter 125kVA, ..."
```
> Model name ใช้เป็น primary display แทน Item No. ทั้ง 2 tabs  
> Item No. (เช่น `MINV-SG125CX-P205`) แสดงเป็น text เล็ก/เทาใต้ Model เพื่อ reference

---

## ประเด็นที่ทราบ / Known Issues

1. **ticket cross-reference** ใน PlantDatabase ใช้ชื่อ (`iSolarCloudName`) match กับชื่อ plant — ถ้าชื่อต่างกันเล็กน้อยจะไม่ match → 38 plants (อาจต่ำกว่าความเป็นจริง)
2. **sn-data.json** โหลด lazy เฉพาะเมื่อคลิก tab "ฐานข้อมูล SN" — ครั้งแรกอาจช้า (~2-3 วิ บน localhost)
3. หน้า `SNDatabase.jsx` และ `ISCPlants.jsx` ยังมีอยู่ใน codebase แต่ไม่ได้อยู่ใน nav หรือ routes แล้ว (ถูกรวมเข้า PlantDatabase)
4. `/projects` ยังใช้ `mockData.js` อยู่ — ยังไม่ได้เชื่อมกับข้อมูลจริง
