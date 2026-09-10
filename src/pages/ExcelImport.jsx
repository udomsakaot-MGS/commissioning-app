import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import * as XLSX from 'xlsx'
import { GROUP_NAME_MAP } from '../data/mockData'
import {
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, ChevronDown, ChevronUp,
  Ticket, Cpu, Search, Package,
} from 'lucide-react'

const TICKET_STORAGE_KEY = 'commissioning_workflow_tickets'

// Product type → display config (order matters for listing)
const TYPE_CFG = {
  inverter:      { label: 'Inverter',       ticketType: 'Inverter',  cls: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  optimizer:     { label: 'Optimizer',      ticketType: 'Optimizer', cls: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  rapidShutdown: { label: 'Rapid Shutdown', ticketType: 'RSD',       cls: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  logger:        { label: 'Data Logger',    ticketType: 'Logger',    cls: 'bg-teal-100 text-teal-700',     dot: 'bg-teal-500' },
  meter:         { label: 'Energy Meter',   ticketType: 'Meter',     cls: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  mounting:      { label: 'Mounting',       ticketType: 'Mounting',  cls: 'bg-gray-100 text-gray-600',     dot: 'bg-gray-400' },
}
const TYPE_ORDER = ['inverter', 'optimizer', 'rapidShutdown', 'logger', 'meter', 'mounting']

const firstToken = s => String(s || '').split(/[ ,]/)[0].trim()

// Format a delivery-date cell (Date object, Excel serial, or string) → YYYY-MM-DD
function fmtDeliveryDate(v) {
  if (!v) return ''
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10)
  if (typeof v === 'number') {
    const d = XLSX.SSF ? XLSX.SSF.parse_date_code(v) : null
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
  }
  const s = String(v).trim()
  // Normalize Thai BE year (>2500) → CE for the leading YYYY
  const m = s.match(/^(\d{4})([-/].*)$/)
  if (m && parseInt(m[1], 10) > 2500) return (parseInt(m[1], 10) - 543) + m[2].replace(/\//g, '-')
  return s.slice(0, 10)
}

// Detect file type: DN1 or M-Global CSV
function detectFileType(headers) {
  const headerStr = headers.map(h => String(h).toLowerCase()).join('|')

  // DN1 format: has "sn from dn", "project ref", "group name", "item/service description"
  if (headerStr.includes('project ref') && headerStr.includes('group name')) {
    return 'DN1'
  }

  // M-Global format: has "serial no", "project ref", "customer/vendor", "group name"
  if (headerStr.includes('serial') && headerStr.includes('customer') && headerStr.includes('group')) {
    return 'MGLOBAL'
  }

  return 'UNKNOWN'
}

// Parse M-Global CSV format
function parseExcelBufferMGlobal(buffer) {
  const data = new Uint8Array(buffer)
  const workbook = XLSX.read(data, { type: 'array', cellDates: true })
  const ws = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  if (rows.length < 2) return { projects: [], sheetName: workbook.SheetNames[0] }

  const headers = rows[0].map(h => String(h).toLowerCase().trim())
  const col = (keywords) => headers.findIndex(h => keywords.some(k => h.includes(k)))

  const colMap = {
    year:        col(['year']),
    soDocnum:    col(['sodocnum', 'so doc']),
    customer:    col(['customer/vendor name', 'customer name']),
    contact:     col(['contact person', 'contact']),
    groupName:   col(['group name', 'group']),
    itemNo:      col(['item no', 'item number']),
    itemDesc:    col(['item/service description', 'description']),
    projectRef:  col(['project ref', 'project']),
    deliveryDate: col(['วันที่ส่งมอบ', 'admission date', 'delivery date']),
    serialNo:    col(['serial no', 'serial number', 'serial']),
  }

  const get = (row, key) => (colMap[key] >= 0 ? String(row[colMap[key]] ?? '').trim() : '')
  const projectMap = {}

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const projectRef = get(row, 'projectRef')
    if (!projectRef) continue

    if (!projectMap[projectRef]) {
      projectMap[projectRef] = {
        projectRef,
        customer: get(row, 'customer'),
        contact: get(row, 'contact'),
        soNumber: get(row, 'soDocnum'),
        deliveryDate: get(row, 'deliveryDate') ? fmtDeliveryDate(row[colMap.deliveryDate]) : '',
        groups: {},
        total: 0,
      }
    }
    const p = projectMap[projectRef]

    const groupRaw = (get(row, 'groupName') || 'M-INVERTER').toUpperCase()
    const deviceType = GROUP_NAME_MAP[groupRaw] || 'inverter'

    if (deviceType === 'mounting') continue

    const desc = get(row, 'itemDesc')
    const itemNo = get(row, 'itemNo')
    const sn = get(row, 'serialNo') || `${itemNo || 'ITEM'}-${p.total + 1}`

    if (!p.groups[deviceType]) p.groups[deviceType] = []
    p.groups[deviceType].push({ sn, itemNo, desc, model: firstToken(desc) })
    p.total += 1

    if (get(row, 'deliveryDate')) {
      const d = fmtDeliveryDate(row[colMap.deliveryDate])
      if (d && d > p.deliveryDate) p.deliveryDate = d
    }
  }

  const result = Object.values(projectMap)
    .filter(p => p.total > 0)
    .sort((a, b) => (a.deliveryDate || '').localeCompare(b.deliveryDate || '') || a.projectRef.localeCompare(b.projectRef))

  return { projects: result, sheetName: workbook.SheetNames[0] }
}

function parseExcelBuffer(buffer) {
  const data = new Uint8Array(buffer)
  const workbook = XLSX.read(data, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames.find(n => /sn from dn/i.test(n)) || workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (rows.length < 2) return { projects: [], sheetName }

  const headers = rows[0].map(h => String(h).toLowerCase().trim())
  const col = (keywords) => headers.findIndex(h => keywords.some(k => h.includes(k)))

  const colMap = {
    soNumber:     col(['sodocnum', 'so doc', 'so number', 'so no']),
    customer:     col(['customer/vendor', 'customer', 'vendor name']),
    contact:      col(['contact person', 'contact']),
    groupName:    col(['group name', 'group']),
    itemNo:       col(['item no', 'item number']),
    itemDesc:     col(['item/service description', 'service description', 'description']),
    projectRef:   col(['project ref', 'project']),
    deliveryDate: col(['วันที่ส่งมอบ', 'ส่งมอบ', 'delivery date', 'delivery']),
    serialNo:     col(['serial no', 'serial number', 'serial', 's/n']),
  }

  const get = (row, key) => (colMap[key] >= 0 ? String(row[colMap[key]] ?? '').trim() : '')
  const projectMap = {}

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const projectRef = get(row, 'projectRef')
    if (!projectRef) continue

    if (!projectMap[projectRef]) {
      projectMap[projectRef] = {
        projectRef,
        customer: get(row, 'customer'),
        contact: get(row, 'contact'),
        soNumber: get(row, 'soNumber'),
        deliveryDate: colMap.deliveryDate >= 0 ? fmtDeliveryDate(row[colMap.deliveryDate]) : '',
        groups: {}, // deviceType → [{ sn, itemNo, desc, model }]
        total: 0,
      }
    }
    const p = projectMap[projectRef]

    const groupRaw = (get(row, 'groupName') || 'M-INVERTER').toUpperCase()
    const deviceType = GROUP_NAME_MAP[groupRaw] || 'inverter'

    // Skip Mounting and cable products — only active devices
    if (deviceType === 'mounting') continue

    const desc = get(row, 'itemDesc')
    const itemNo = get(row, 'itemNo')
    const sn = get(row, 'serialNo') || `${itemNo || 'ITEM'}-${p.total + 1}`

    if (!p.groups[deviceType]) p.groups[deviceType] = []
    p.groups[deviceType].push({ sn, itemNo, desc, model: firstToken(desc) })
    p.total += 1

    // Keep the latest delivery date seen for the project
    if (colMap.deliveryDate >= 0) {
      const d = fmtDeliveryDate(row[colMap.deliveryDate])
      if (d && d > p.deliveryDate) p.deliveryDate = d
    }
  }

  // Filter out projects with no devices (after skipping mounting), and sort by delivery date
  const result = Object.values(projectMap)
    .filter(p => p.total > 0)
    .sort((a, b) => (a.deliveryDate || '').localeCompare(b.deliveryDate || '') || a.projectRef.localeCompare(b.projectRef))

  return { projects: result, sheetName }
}

// ─── Ticket helpers (shared localStorage with CommissioningTickets) ───────────
function loadTickets() {
  try { return JSON.parse(localStorage.getItem(TICKET_STORAGE_KEY) || '[]') } catch { return [] }
}
function appendTicket(ticket) {
  const list = loadTickets()
  list.push(ticket)
  try { localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(list)) } catch { /* ignore */ }
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function ExcelImport() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [fileName, setFileName] = useState('')
  const [sheetName, setSheetName] = useState('')
  const [parsed, setParsed] = useState(null)   // array | null
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  const [existingNames, setExistingNames] = useState(null) // Set | null
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [ticketed, setTicketed] = useState({}) // projectRef → ticketId

  // Load existing project names from real MGlobal DB for old/new detection
  useEffect(() => {
    fetch('/sn-data.json')
      .then(r => r.json())
      .then(d => setExistingNames(new Set(d.projects.map(p => (p.project || '').trim().toLowerCase()))))
      .catch(() => setExistingNames(new Set()))
  }, [])

  async function processFile(file) {
    setError('')
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xlsb', 'xls', 'csv'].includes(ext)) {
      setError('รองรับเฉพาะไฟล์ .xlsx, .xlsb, .xls, .csv เท่านั้น')
      return
    }
    try {
      let projects = []
      let sheetName = ''

      if (ext === 'csv') {
        // Parse CSV file
        const text = await file.text()
        const lines = text.split('\n')
        const headers = lines[0].split(',').map(h => h.trim())
        const fileType = detectFileType(headers)

        if (fileType === 'MGLOBAL') {
          // Use M-Global parser
          const buffer = await file.arrayBuffer()
          const result = parseExcelBufferMGlobal(buffer)
          projects = result.projects
          sheetName = result.sheetName
        } else {
          setError('รูปแบบ CSV ไม่รู้จัก - ต้องเป็น DN1 หรือ M-Global')
          return
        }
      } else {
        // Parse Excel (XLSX, XLSB, XLS)
        const buffer = await file.arrayBuffer()
        const data = new Uint8Array(buffer)
        const workbook = XLSX.read(data, { type: 'array', cellDates: true })
        const ws = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

        if (rows.length < 2) {
          setError('ไฟล์ว่างเปล่าหรือไม่มี Header row')
          return
        }

        const headers = rows[0].map(h => String(h).toLowerCase().trim())
        const fileType = detectFileType(headers)

        if (fileType === 'DN1') {
          const result = parseExcelBuffer(buffer)
          projects = result.projects
          sheetName = result.sheetName
        } else if (fileType === 'MGLOBAL') {
          const result = parseExcelBufferMGlobal(buffer)
          projects = result.projects
          sheetName = result.sheetName
        } else {
          setError('ไม่สามารถจำแนกรูปแบบไฟล์ - ต้องเป็น DN1 หรือ M-Global')
          return
        }
      }

      if (projects.length === 0) {
        setError('ไม่พบข้อมูลโปรเจกต์ในไฟล์')
        return
      }

      setFileName(file.name)
      setSheetName(sheetName)
      setParsed(projects)
      setTicketed({})
      setExpanded(null)
    } catch (err) {
      console.error('Error:', err)
      setError('เกิดข้อผิดพลาดในการอ่านไฟล์: ' + err.message)
    }
  }

  const isOld = (p) => existingNames?.has((p.projectRef || '').trim().toLowerCase())

  const filtered = useMemo(() => {
    if (!parsed) return []
    const q = search.trim().toLowerCase()
    if (!q) return parsed
    return parsed.filter(p =>
      p.projectRef.toLowerCase().includes(q) || (p.customer || '').toLowerCase().includes(q))
  }, [parsed, search])

  const stats = useMemo(() => {
    if (!parsed) return { total: 0, old: 0, neu: 0 }
    let old = 0
    parsed.forEach(p => { if (isOld(p)) old += 1 })
    return { total: parsed.length, old, neu: parsed.length - old }
  }, [parsed, existingNames])

  function createTicket(p) {
    const now = Date.now()
    const products = [...new Set(
      TYPE_ORDER.flatMap(t => (p.groups[t] || []).map(d => d.model).filter(Boolean))
    )].slice(0, 12)
    const snDetails = TYPE_ORDER.flatMap(t =>
      (p.groups[t] || []).map(d => ({ sn: d.sn, model: d.model, type: TYPE_CFG[t].ticketType }))
    )
    const ticket = {
      id: `WT${now}`,
      project: p.projectRef,
      customer: p.customer || '',
      location: '',
      contact: p.contact || '',
      phone: '',
      estimatedDate: '',
      confirmedDate: '',
      technician: '',
      products,
      iSolarCloud: false,
      note: `นำเข้าจาก Excel${p.soNumber ? ` · SO ${p.soNumber}` : ''}${p.deliveryDate ? ` · ส่งมอบ ${p.deliveryDate}` : ''}`,
      snDetails,
      stage: 'planning',
      createdAt: now,
      updatedAt: now,
    }
    appendTicket(ticket)
    setTicketed(prev => ({ ...prev, [p.projectRef]: ticket.id }))
  }

  function goToJobWithTicket(p) {
    // Create ticket first if not already created
    if (!ticketed[p.projectRef]) {
      createTicket(p)
    }

    // Navigate to ImportExport with ticket data
    const ticket = ticketed[p.projectRef] ?
      loadTickets().find(t => t.id === ticketed[p.projectRef]) :
      loadTickets()[loadTickets().length - 1]

    if (ticket) {
      navigate(`/import?ticket=${ticket.id}`)
    }
  }

  function reset() {
    setParsed(null); setFileName(''); setSheetName(''); setError(''); setTicketed({}); setExpanded(null); setSearch('')
  }

  // ─── Upload screen ───
  if (!parsed) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">นำเข้า Excel</h1>
          <p className="text-gray-500 text-sm mt-1">นำเข้ารายการ Serial Number จากชีต "SN from DN 1" แยกตามโครงการ</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-5 text-red-700 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}
          <div
            onDrop={e => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]) }}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".xlsx,.xlsb,.xls,.csv" onChange={e => processFile(e.target.files[0])} className="hidden" />
            <FileSpreadsheet size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="font-medium text-gray-700 mb-1">ลากไฟล์มาวาง หรือคลิกเลือกไฟล์</p>
            <p className="text-sm text-gray-400">รองรับ .xlsx, .xlsb, .xls, .csv</p>
          </div>
          <div className="mt-5 p-4 bg-blue-50 rounded-lg text-sm text-blue-700 space-y-2">
            <div className="font-semibold">รูปแบบที่รองรับ:</div>
            <div>
              <strong>📋 DN1 Format:</strong> ชีต "SN from DN 1"
              <div className="text-xs mt-1">คอลัมน์: SODocnum, Customer, Contact, Group Name, Item No., Description, Project Ref, วันที่ส่งมอบ, Serial No.</div>
            </div>
            <div>
              <strong>📊 M-Global Format (CSV/Excel):</strong> M-Global Sales Data
              <div className="text-xs mt-1">คอลัมน์: Serial no, Project Ref, Customer/Vendor Name, Contact Person, Group Name, Item No., Description, Admission Date</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Review screen ───
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ตรวจสอบข้อมูลนำเข้า</h1>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2 flex-wrap">
            <FileSpreadsheet size={14} className="text-green-600" /> {fileName}
            <span className="text-gray-300">·</span> ชีต "{sheetName}"
            <span className="text-gray-300">·</span> {parsed.length} โครงการ
          </p>
        </div>
        <button onClick={reset} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          นำเข้าไฟล์ใหม่
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="ทั้งหมด" value={stats.total} cls="text-gray-800" />
        <StatCard label="โครงการเก่า (มีอยู่แล้ว)" value={stats.old} cls="text-amber-600" sub="อัปเดตข้อมูลเดิม" />
        <StatCard label="โครงการใหม่" value={stats.neu} cls="text-green-600" sub="ยังไม่เคยนำเข้า" />
      </div>

      {existingNames === null && (
        <div className="text-xs text-gray-400">กำลังโหลดฐานข้อมูลเดิมเพื่อเทียบเก่า/ใหม่...</div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาโครงการ / ลูกค้า..."
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
      </div>

      {/* Project list */}
      <div className="space-y-3">
        {filtered.map((p) => {
          const old = isOld(p)
          const isExpanded = expanded === p.projectRef
          const tId = ticketed[p.projectRef]
          const groupList = TYPE_ORDER.filter(t => (p.groups[t] || []).length > 0)
          return (
            <div key={p.projectRef} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${old ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {old ? 'โครงการเก่า' : 'โครงการใหม่'}
                      </span>
                      {p.deliveryDate && (
                        <span className="text-xs text-gray-400">ส่งมอบ: {p.deliveryDate}</span>
                      )}
                    </div>
                    <div className="font-semibold text-gray-900 text-sm leading-snug">{p.projectRef}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {p.customer || '—'}{p.contact ? ` · ผู้ติดต่อ: ${p.contact}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {tId ? (
                      <>
                        <button onClick={() => navigate('/tickets')}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100">
                          <CheckCircle size={15} /> Ticket สร้างแล้ว
                        </button>
                        <button onClick={() => goToJobWithTicket(p)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                          สร้าง Job <ArrowRight size={14} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => createTicket(p)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                        <Ticket size={15} /> สร้าง Ticket
                      </button>
                    )}
                  </div>
                </div>

                {/* Item count + product type chips (dropdown toggle) */}
                <button onClick={() => setExpanded(isExpanded ? null : p.projectRef)}
                  className="mt-3 w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Package size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{p.total.toLocaleString()} รายการ</span>
                    <span className="text-gray-300">·</span>
                    {groupList.map(t => {
                      const cfg = TYPE_CFG[t]
                      return (
                        <span key={t} className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${cfg.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label} {(p.groups[t] || []).length}
                        </span>
                      )
                    })}
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
              </div>

              {/* Expanded SN list grouped by product type */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3">
                  {groupList.map(t => (
                    <SNGroup key={t} type={t} items={p.groups[t]} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">ไม่พบโครงการที่ตรงกับคำค้น</div>
        )}
      </div>
    </div>
  )
}

// SN list for one product type (collapsible)
function SNGroup({ type, items }) {
  const [open, setOpen] = useState(false)
  const cfg = TYPE_CFG[type]
  return (
    <div className="bg-white rounded-lg border border-gray-100">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
          <span className="text-gray-400">{items.length} SN</span>
        </span>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && (
        <div className="border-t border-gray-100 max-h-56 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 sticky top-0">
              <tr className="text-left">
                <th className="px-3 py-1.5 font-medium">Serial Number</th>
                <th className="px-3 py-1.5 font-medium">Model</th>
                <th className="px-3 py-1.5 font-medium">Item No.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((d, i) => (
                <tr key={d.sn + i} className="hover:bg-blue-50">
                  <td className="px-3 py-1.5 font-mono text-gray-800">{d.sn}</td>
                  <td className="px-3 py-1.5 text-gray-700">{d.model || '—'}</td>
                  <td className="px-3 py-1.5 text-gray-400">{d.itemNo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, cls, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`text-2xl font-bold ${cls}`}>{value.toLocaleString()}</div>
      <div className="text-sm font-medium text-gray-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}
