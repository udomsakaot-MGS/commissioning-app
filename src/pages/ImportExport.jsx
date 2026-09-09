import { useState, useRef, Fragment, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { jobs as initialJobs, technicians, customers, inverterModels, PROJECTS } from '../data/mockData'
import {
  Plus, Eye, Download, Upload, CheckCircle2, ChevronRight,
  AlertTriangle, Pencil, Trash2, X, FileSpreadsheet, RotateCcw, Check, AlertCircle
} from 'lucide-react'

const TICKET_STORAGE_KEY = 'commissioning_workflow_tickets'

// Extract iSolarCloud devices for verification
function getIolarCloudDevices() {
  const devices = {}
  PROJECTS.forEach(proj => {
    Object.values(proj.devices).forEach(deviceArray => {
      if (Array.isArray(deviceArray)) {
        deviceArray.forEach(device => {
          if (device.sn) devices[device.sn] = { ...device, project: proj.projectRef }
        })
      }
    })
  })
  return devices
}

// Helper: Extract brand from model (SG25RT → SG, OP4000 → OP)
function extractBrand(model) {
  if (!model) return ''
  const match = String(model).match(/^([A-Z]+)/)
  return match ? match[1] : ''
}

// Helper: Estimate capacity from model
function guessCapacity(model) {
  if (!model) return 10
  const match = String(model).match(/\d+/)
  if (!match) return 10
  const num = parseInt(match[0])
  return num > 100 ? num / 1000 : num
}

// Helper: Load tickets from localStorage
function loadTickets() {
  try { return JSON.parse(localStorage.getItem(TICKET_STORAGE_KEY) || '[]') }
  catch { return [] }
}

// Convert ticket to job format
function ticketToJob(ticket, index) {
  const year = new Date().getFullYear()
  const firstSN = ticket.snDetails?.[0] || {}

  return {
    id: `JOB-${year}-${String(index).padStart(3, '0')}`,
    type: 'commissioning',
    status: 'scheduled',
    priority: 'medium',

    site: ticket.project || '',
    customerName: ticket.customer || '',
    address: '',

    serialNo: firstSN.sn || '',
    inverterBrand: extractBrand(firstSN.model),
    inverterModel: firstSN.model || '',
    capacity: guessCapacity(firstSN.model),

    scheduledDate: ticket.estimatedDate || '',
    technicianName: null,

    notes: `นำเข้าจาก Excel${ticket.soNumber ? ` · SO ${ticket.soNumber}` : ''}`,
    documents: [],

    // Metadata for tracking
    _fromTicket: true,
    _ticketId: ticket.id
  }
}

// ========= constants =========
const EMPTY_FORM = {
  id: '', type: 'commissioning', status: 'scheduled', priority: 'medium',
  customerName: '', site: '', address: '', scheduledDate: '', technicianName: '',
  inverterBrand: '', inverterModel: '', serialNo: '', capacity: '',
  notes: '',
}

const TYPE_OPTS = [
  { value: 'commissioning', label: 'Commissioning' },
  { value: 'inspection', label: 'ตรวจสอบ' },
  { value: 'maintenance', label: 'PM' },
]
const STATUS_OPTS = [
  { value: 'scheduled', label: 'มีกำหนด' },
  { value: 'pending', label: 'รอดำเนินการ' },
  { value: 'in_progress', label: 'กำลังดำเนินการ' },
  { value: 'completed', label: 'เสร็จสิ้น' },
  { value: 'cancelled', label: 'ยกเลิก' },
]
const PRIORITY_OPTS = [
  { value: 'urgent', label: 'เร่งด่วนมาก' },
  { value: 'high', label: 'สูง' },
  { value: 'medium', label: 'ปกติ' },
  { value: 'low', label: 'ต่ำ' },
]

// diff row styling
const rowStyle = {
  added:   'bg-green-50 border-l-4 border-green-500',
  edited:  'bg-amber-50 border-l-4 border-amber-400',
  deleted: 'bg-red-50  border-l-4 border-red-400 opacity-70 line-through',
  base:    'bg-white',
}
const rowBadge = {
  added:   <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-green-100 text-green-700">ใหม่</span>,
  edited:  <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-700">แก้ไข</span>,
  deleted: <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-red-100 text-red-700">ลบ</span>,
  base:    null,
}

const statusLabel = { completed:'เสร็จ', in_progress:'กำลังทำ', scheduled:'กำหนด', pending:'รอ', cancelled:'ยกเลิก' }
const typeLabel   = { commissioning:'Commissioning', inspection:'ตรวจสอบ', maintenance:'PM' }
const priorityLabel = { urgent:'🔴', high:'🟠', medium:'🔵', low:'⚪' }

function generateId(existing) {
  const year = new Date().getFullYear()
  const nums = existing
    .map(j => parseInt(j.id.split('-')[2] || 0))
    .filter(n => !isNaN(n))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `JOB-${year}-${String(next).padStart(3, '0')}`
}

// ========= MAIN COMPONENT =========
export default function ImportExport() {
  const [searchParams] = useSearchParams()
  const ticketId = searchParams.get('ticket')

  const [baseJobs, setBaseJobs]   = useState(() => {
    // Load initial jobs + converted tickets on mount
    const tickets = loadTickets()
    const convertedJobs = tickets.map((t, i) => ticketToJob(t, i))

    // Merge with base jobs, remove duplicates by ID
    const merged = [...initialJobs, ...convertedJobs]
    const unique = Array.from(
      new Map(merged.map(j => [j.id, j])).values()
    )

    // Sort newest first
    return unique.sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate))
  })

  const [changes, setChanges]     = useState([])            // pending changes [{kind, data, origId?}]
  const [step, setStep]           = useState('list')        // 'list' | 'form' | 'verify' | 'preview' | 'confirm'
  const [formData, setFormData]   = useState(EMPTY_FORM)
  const [editTarget, setEditTarget] = useState(null)        // id ของแถวที่กำลัง edit
  const [deleteQueue, setDeleteQueue] = useState([])        // ids to delete
  const [errors, setErrors]       = useState({})
  const [verifyResult, setVerifyResult] = useState(null)    // verification results
  const [showConfirmDialog, setShowConfirmDialog] = useState(false) // confirmation before final save
  const fileRef = useRef()
  const iolarCloudDevices = getIolarCloudDevices()

  // Auto-fill form from ticket if ?ticket param present
  useEffect(() => {
    if (ticketId) {
      const tickets = loadTickets()
      const ticket = tickets.find(t => t.id === ticketId)
      if (ticket && ticket.snDetails && ticket.snDetails.length > 0) {
        const firstSN = ticket.snDetails[0]
        const brand = extractBrand(firstSN.model)

        // Auto-fill the form
        setFormData(prev => ({
          ...prev,
          site: ticket.project,
          customerName: ticket.customer,
          serialNo: firstSN.sn,
          inverterBrand: brand,
          inverterModel: firstSN.model,
          address: '',
          scheduledDate: ticket.estimatedDate || '',
          technicianName: ticket.technician || null,
          notes: ticket.note || '',
        }))

        // Go to form step
        setStep('form')
      }
    }
  }, [ticketId])

  // ---- derived ----
  const allBrands = inverterModels.map(i => i.brand)
  const modelsForBrand = (brand) => inverterModels.find(i => i.brand === brand)?.models || []

  // build preview rows: base + pending
  const previewRows = (() => {
    const rows = []
    baseJobs.forEach(j => {
      if (deleteQueue.includes(j.id)) {
        rows.push({ kind: 'deleted', data: j })
        return
      }
      const ch = changes.find(c => c.origId === j.id)
      if (ch) rows.push({ kind: 'edited', data: ch.data, orig: j })
      else     rows.push({ kind: 'base',  data: j })
    })
    changes.filter(c => c.kind === 'added').forEach(c => {
      rows.push({ kind: 'added', data: c.data })
    })
    return rows
  })()

  const summary = {
    total: previewRows.filter(r => r.kind !== 'deleted').length,
    added:   previewRows.filter(r => r.kind === 'added').length,
    edited:  previewRows.filter(r => r.kind === 'edited').length,
    deleted: deleteQueue.length,
    unchanged: previewRows.filter(r => r.kind === 'base').length,
  }

  // ---- form handlers ----
  function openAddForm() {
    setFormData({ ...EMPTY_FORM, id: generateId([...baseJobs, ...changes.map(c => c.data)]) })
    setEditTarget(null)
    setErrors({})
    setStep('form')
  }

  function openEditForm(job) {
    setFormData({ ...job, capacity: String(job.capacity) })
    setEditTarget(job.id)
    setErrors({})
    setStep('form')
  }

  function handleField(k, v) {
    setFormData(f => ({ ...f, [k]: v, ...(k === 'inverterBrand' ? { inverterModel: '' } : {}) }))
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n })
  }

  function validate() {
    const e = {}
    if (!formData.id.trim())           e.id = 'กรุณาระบุ Job ID'
    if (!formData.site.trim())         e.site = 'กรุณาระบุชื่อไซต์'
    if (!formData.customerName.trim()) e.customerName = 'กรุณาระบุชื่อลูกค้า'
    if (!formData.scheduledDate)       e.scheduledDate = 'กรุณาระบุวันที่'
    if (!formData.inverterBrand)       e.inverterBrand = 'กรุณาเลือกยี่ห้อ'
    if (!formData.capacity || isNaN(Number(formData.capacity)) || Number(formData.capacity) <= 0)
                                       e.capacity = 'กรุณาระบุกำลัง (kW) ที่ถูกต้อง'
    return e
  }

  function handleSaveForm() {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const data = { ...formData, capacity: Number(formData.capacity) }

    if (editTarget) {
      // check if really changed vs base
      const orig = baseJobs.find(j => j.id === editTarget)
      setChanges(cs => {
        const without = cs.filter(c => c.origId !== editTarget)
        if (!orig) return [...without, { kind: 'added', data }]
        return [...without, { kind: 'edited', origId: editTarget, data }]
      })
    } else {
      setChanges(cs => [...cs, { kind: 'added', data }])
    }
    setStep('preview')
  }

  function markDelete(id) {
    setDeleteQueue(q => q.includes(id) ? q.filter(i => i !== id) : [...q, id])
  }

  function removeChange(ch) {
    if (ch.kind === 'added') setChanges(cs => cs.filter(c => c !== ch))
    else if (ch.kind === 'edited') setChanges(cs => cs.filter(c => c.origId !== ch.origId))
  }

  function resetAll() {
    setChanges([])
    setDeleteQueue([])
    setVerifyResult(null)
    setStep('list')
  }

  // Verify against iSolarCloud data
  function verifyWithiSolarCloud() {
    const result = {
      matched: [],
      unmatched: [],
      duplicates: []
    }
    const seenSNs = new Set()

    previewRows.forEach((row, idx) => {
      if (row.kind === 'deleted') return

      const sn = row.data.serialNo?.trim()
      if (!sn) {
        result.unmatched.push({ ...row, reason: 'ไม่มี Serial No.' })
        return
      }

      if (seenSNs.has(sn)) {
        result.duplicates.push({ ...row, sn })
        return
      }
      seenSNs.add(sn)

      const device = iolarCloudDevices[sn]
      if (device) {
        result.matched.push({ ...row, iolarCloudData: device })
      } else {
        result.unmatched.push({ ...row, reason: 'ไม่พบใน iSolarCloud' })
      }
    })

    setVerifyResult(result)
    setStep('verify')
  }

  // ---- Excel export ----
  function exportExcel() {
    const finalRows = previewRows
      .filter(r => r.kind !== 'deleted')
      .map((r, i) => ({
        'ลำดับ': i + 1,
        'Job ID': r.data.id,
        'ประเภท': typeLabel[r.data.type] || r.data.type,
        'สถานะ': statusLabel[r.data.status] || r.data.status,
        'ความสำคัญ': priorityLabel[r.data.priority] || '',
        'ชื่อไซต์': r.data.site,
        'ลูกค้า': r.data.customerName,
        'ที่อยู่': r.data.address,
        'วันที่นัดหมาย': r.data.scheduledDate,
        'ช่างเทคนิค': r.data.technicianName || '',
        'ยี่ห้ออินเวอร์เตอร์': r.data.inverterBrand,
        'รุ่น': r.data.inverterModel,
        'Serial No.': r.data.serialNo,
        'กำลัง (kW)': r.data.capacity,
        'หมายเหตุ': r.data.notes || '',
        'การเปลี่ยนแปลง': r.kind === 'added' ? 'ใหม่' : r.kind === 'edited' ? 'แก้ไข' : '',
      }))

    const ws = XLSX.utils.json_to_sheet(finalRows)

    // column widths
    ws['!cols'] = [
      {wch:6},{wch:16},{wch:16},{wch:16},{wch:10},{wch:28},{wch:30},{wch:30},
      {wch:14},{wch:22},{wch:18},{wch:18},{wch:22},{wch:10},{wch:30},{wch:10},
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Commissioning Jobs')

    // meta sheet
    const metaData = [
      ['ส่งออกเมื่อ', new Date().toLocaleString('th-TH')],
      ['จำนวนงานทั้งหมด', summary.total],
      ['งานใหม่', summary.added],
      ['งานที่แก้ไข', summary.edited],
      ['งานที่ลบ', summary.deleted],
    ]
    const metaWs = XLSX.utils.aoa_to_sheet(metaData)
    XLSX.utils.book_append_sheet(wb, metaWs, 'สรุปการเปลี่ยนแปลง')

    XLSX.writeFile(wb, `Commissioning_Jobs_${new Date().toISOString().slice(0,10)}.xlsx`)

    // commit changes to baseJobs (simulate "saved")
    const committed = previewRows
      .filter(r => r.kind !== 'deleted')
      .map(r => r.data)
    setBaseJobs(committed)
    setChanges([])
    setDeleteQueue([])
    setStep('list')
  }

  // ---- Excel import ----
  function handleFileImport(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'binary' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws)
      const imported = rows.map(r => ({
        id:            r['Job ID'] || '',
        type:          Object.entries(typeLabel).find(([,v]) => v === r['ประเภท'])?.[0] || 'commissioning',
        status:        Object.entries(statusLabel).find(([,v]) => v === r['สถานะ'])?.[0] || 'scheduled',
        priority:      'medium',
        customerName:  r['ลูกค้า'] || '',
        site:          r['ชื่อไซต์'] || '',
        address:       r['ที่อยู่'] || '',
        scheduledDate: r['วันที่นัดหมาย'] || '',
        technicianName: r['ช่างเทคนิค'] || null,
        inverterBrand: r['ยี่ห้ออินเวอร์เตอร์'] || '',
        inverterModel: r['รุ่น'] || '',
        serialNo:      r['Serial No.'] || '',
        capacity:      Number(r['กำลัง (kW)']) || 0,
        notes:         r['หมายเหตุ'] || '',
        documents:     [],
      })).sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate)) // sort newest first

      // diff vs current baseJobs
      const newChanges = []
      imported.forEach(imp => {
        const existing = baseJobs.find(b => b.id === imp.id)
        if (!existing) newChanges.push({ kind: 'added', data: imp })
        else {
          const changed = JSON.stringify(existing) !== JSON.stringify({ ...existing, ...imp, id: existing.id })
          if (changed) newChanges.push({ kind: 'edited', origId: existing.id, data: imp })
        }
      })
      setChanges(newChanges)
      setStep('verify')  // Go to verification step instead of preview
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  // ========= RENDER =========
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">นำเข้า / ส่งออกข้อมูล Excel</h1>
          <p className="text-gray-500 text-sm mt-1">
            จัดการข้อมูลผ่านไฟล์ Excel — กรอกฟอร์ม ตรวจสอบ แล้วยืนยันบันทึก
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {step === 'list' && (
            <>
              <input type="file" accept=".xlsx,.xlsb,.xls" ref={fileRef} className="hidden" onChange={handleFileImport} />
              <button
                onClick={() => fileRef.current.click()}
                className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <Upload size={16} /> นำเข้า Excel
              </button>
              <button
                onClick={openAddForm}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} /> เพิ่มข้อมูลใหม่
              </button>
            </>
          )}
          {(step === 'preview' || step === 'verify') && (
            <>
              <button onClick={resetAll} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                <RotateCcw size={15} /> ยกเลิกทั้งหมด
              </button>
              <button onClick={openAddForm} className="flex items-center gap-2 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors">
                <Plus size={15} /> เพิ่มอีก
              </button>
              {step === 'preview' && (
                <button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={summary.added + summary.edited + summary.deleted === 0}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Download size={16} /> ยืนยัน & ดาวน์โหลด Excel
                </button>
              )}
            </>
          )}
          {step === 'form' && (
            <button onClick={() => setStep(changes.length ? 'preview' : 'list')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
              <X size={15} /> ยกเลิก
            </button>
          )}
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm overflow-x-auto">
        {[
          { key: 'list',    label: '1. ข้อมูลปัจจุบัน' },
          { key: 'form',    label: '2. กรอกข้อมูล' },
          { key: 'verify',  label: '3. ตรวจสอบ' },
          { key: 'preview', label: '4. สรุป & ยืนยัน' },
        ].map((s, i, arr) => (
          <div key={s.key} className="flex items-center gap-2 flex-shrink-0">
            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${step === s.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {s.label}
            </span>
            {i < arr.length - 1 && <ChevronRight size={14} className="text-gray-300" />}
          </div>
        ))}
      </div>

      {/* ===== STEP: LIST ===== */}
      {step === 'list' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <FileSpreadsheet size={18} className="text-green-600" />
            <div>
              <span className="font-semibold text-gray-900">ข้อมูลงานใน Excel ปัจจุบัน</span>
              <span className="ml-2 text-sm text-gray-500">{baseJobs.length} แถว</span>
            </div>
          </div>
          <DataTable rows={baseJobs.map(j => ({ kind: 'base', data: j }))} onEdit={openEditForm} onDelete={markDelete} deleteQueue={deleteQueue} showActions />
          {deleteQueue.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-red-50">
              <span className="text-sm text-red-700">🗑 กำหนดลบ {deleteQueue.length} แถว — จะมีผลเมื่อดาวน์โหลด Excel</span>
              <button onClick={() => setStep('preview')} className="text-sm text-blue-700 font-medium hover:underline flex items-center gap-1">
                <Eye size={14} /> ดูตัวอย่าง
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== STEP: FORM ===== */}
      {step === 'form' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
            {editTarget ? <Pencil size={16} className="text-amber-500" /> : <Plus size={16} className="text-blue-500" />}
            {editTarget ? `แก้ไขงาน ${editTarget}` : 'เพิ่มงานใหม่'}
          </h2>
          <JobForm formData={formData} onChange={handleField} errors={errors}
            allBrands={allBrands} modelsForBrand={modelsForBrand}
            technicians={technicians} customers={customers} />
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={handleSaveForm}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Eye size={15} /> บันทึก & ดูตัวอย่าง
            </button>
            <button onClick={() => setStep(changes.length ? 'preview' : 'list')} className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
              ยกเลิก
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP: VERIFY ===== */}
      {step === 'verify' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <AlertCircle size={18} className="text-blue-500" />
              ตรวจสอบข้อมูล Serial No. กับ iSolarCloud
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              ระบบจะตรวจสอบเลขซีเรียล (Serial No.) ของข้อมูลที่นำเข้าเทียบกับฐานข้อมูล iSolarCloud เพื่อยืนยันความถูกต้อง
            </p>

            <button
              onClick={verifyWithiSolarCloud}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Check size={16} /> เริ่มการตรวจสอบ
            </button>
          </div>

          {verifyResult && (
            <div className="space-y-4">
              {/* Verification Summary */}
              <div className="grid grid-cols-3 gap-3">
                <VerifySummaryCard
                  label="ตรงกับ iSolarCloud"
                  value={verifyResult.matched.length}
                  color="text-green-700"
                  bg="bg-green-50"
                  icon={<Check size={16} className="text-green-600" />}
                />
                <VerifySummaryCard
                  label="ไม่พบใน iSolarCloud"
                  value={verifyResult.unmatched.length}
                  color="text-amber-700"
                  bg="bg-amber-50"
                  icon={<AlertTriangle size={16} className="text-amber-600" />}
                />
                <VerifySummaryCard
                  label="SN ซ้ำ"
                  value={verifyResult.duplicates.length}
                  color="text-red-700"
                  bg="bg-red-50"
                  icon={<AlertTriangle size={16} className="text-red-600" />}
                />
              </div>

              {/* Matched devices */}
              {verifyResult.matched.length > 0 && (
                <div className="bg-white rounded-xl border border-green-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-green-100 flex items-center gap-2 bg-green-50">
                    <Check size={16} className="text-green-600" />
                    <span className="font-semibold text-green-900">ข้อมูลที่ตรงกับ iSolarCloud ({verifyResult.matched.length})</span>
                  </div>
                  <VerifyTable rows={verifyResult.matched} />
                </div>
              )}

              {/* Unmatched devices */}
              {verifyResult.unmatched.length > 0 && (
                <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-amber-100 flex items-center gap-2 bg-amber-50">
                    <AlertTriangle size={16} className="text-amber-600" />
                    <span className="font-semibold text-amber-900">ข้อมูลที่ไม่พบหรือไม่มี Serial No. ({verifyResult.unmatched.length})</span>
                  </div>
                  <VerifyTable rows={verifyResult.unmatched} />
                </div>
              )}

              {/* Duplicate SNs */}
              {verifyResult.duplicates.length > 0 && (
                <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-red-100 flex items-center gap-2 bg-red-50">
                    <AlertTriangle size={16} className="text-red-600" />
                    <span className="font-semibold text-red-900">Serial No. ที่ซ้ำในข้อมูลนำเข้า ({verifyResult.duplicates.length})</span>
                  </div>
                  <VerifyTable rows={verifyResult.duplicates} />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={resetAll}
                  className="flex items-center gap-2 border border-gray-200 text-gray-600 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw size={15} /> ยกเลิก
                </button>
                <button
                  onClick={() => setStep('preview')}
                  disabled={verifyResult.duplicates.length > 0}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={15} /> ดำเนินการต่อ
                </button>
              </div>
              {verifyResult.duplicates.length > 0 && (
                <p className="text-sm text-red-600">⚠️ ต้องแก้ไข Serial No. ที่ซ้ำก่อนดำเนินการต่อ</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== STEP: PREVIEW ===== */}
      {step === 'preview' && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="ทั้งหมด" value={summary.total} color="text-gray-900" bg="bg-gray-50" />
            <SummaryCard label="ใหม่" value={summary.added} color="text-green-700" bg="bg-green-50" dot="bg-green-500" />
            <SummaryCard label="แก้ไข" value={summary.edited} color="text-amber-700" bg="bg-amber-50" dot="bg-amber-500" />
            <SummaryCard label="ลบ" value={summary.deleted} color="text-red-700" bg="bg-red-50" dot="bg-red-500" />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-200 border-l-2 border-green-500 inline-block" />แถวใหม่</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-100 border-l-2 border-amber-400 inline-block" />แก้ไข</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-50 border-l-2 border-red-400 inline-block" />กำหนดลบ</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-white border border-gray-200 inline-block" />ไม่เปลี่ยนแปลง</span>
          </div>

          {/* Diff alert */}
          {summary.added + summary.edited + summary.deleted === 0 ? (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500">
              <AlertTriangle size={15} /> ไม่มีการเปลี่ยนแปลง — เพิ่มหรือแก้ไขข้อมูลก่อนดาวน์โหลด
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
              <CheckCircle2 size={15} /> ตรวจสอบข้อมูลด้านล่าง แล้วกด "ยืนยัน & ดาวน์โหลด Excel" เพื่อบันทึก
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-900">ตารางข้อมูล Excel (Preview)</span>
              <span className="text-sm text-gray-500">{previewRows.length} แถว</span>
            </div>
            <DataTable
              rows={previewRows}
              onEdit={(job) => openEditForm(job)}
              onRemoveChange={removeChange}
              onDelete={markDelete}
              deleteQueue={deleteQueue}
              showDiff
              showActions
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle size={20} className="text-amber-500" />
              ยืนยันการนำเข้าข้อมูล
            </h3>
            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-600">
                คุณกำลังจะยืนยันการนำเข้าข้อมูลดังนี้:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                {summary.added > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">เพิ่มใหม่:</span>
                    <span className="font-semibold text-green-700">{summary.added} แถว</span>
                  </div>
                )}
                {summary.edited > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">แก้ไข:</span>
                    <span className="font-semibold text-amber-700">{summary.edited} แถว</span>
                  </div>
                )}
                {summary.deleted > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ลบ:</span>
                    <span className="font-semibold text-red-700">{summary.deleted} แถว</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="text-gray-700 font-medium">รวม:</span>
                  <span className="font-bold text-gray-900">{summary.total} แถว</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                ⚠️ หลังจากยืนยันแล้ว ข้อมูลจะถูกบันทึกและไฟล์ Excel จะถูกดาวน์โหลด
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  setShowConfirmDialog(false)
                  exportExcel()
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <Check size={16} /> ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ========= DATA TABLE =========
function DataTable({ rows, onEdit, onRemoveChange, onDelete, deleteQueue, showDiff, showActions }) {
  const [expandedId, setExpandedId] = useState(null)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {showDiff && <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-16">สถานะ</th>}
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-36">Job ID</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">ชื่อไซต์</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">ลูกค้า</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-28">ประเภท</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-28">สถานะงาน</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">อินเวอร์เตอร์</th>
            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 w-20">kW</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-28">วันที่</th>
            <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 w-28">ช่าง</th>
            {showActions && <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500 w-20">จัดการ</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => {
            const { kind, data, orig } = row
            const isDeleted = deleteQueue?.includes(data.id)
            const effectiveKind = isDeleted ? 'deleted' : kind
            const rowId = data.id + '-' + i

            return (
              <Fragment key={rowId}>
                <tr
                  className={`transition-colors cursor-pointer ${rowStyle[effectiveKind]} hover:brightness-95`}
                  onClick={() => setExpandedId(expandedId === rowId ? null : rowId)}
                >
                  {showDiff && (
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        {rowBadge[effectiveKind]}
                        {data._fromTicket && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-bold bg-blue-100 text-blue-700" title="มาจาก Tickets">📋</span>
                        )}
                      </div>
                    </td>
                  )}
                  <td className="px-3 py-2.5 font-mono text-xs text-gray-600 font-medium">{data.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-gray-900 truncate max-w-44">{data.site}</div>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 truncate max-w-36">
                    {data.customerName.replace('บริษัท ', '').replace(' จำกัด', '')}
                  </td>
                  <td className="px-3 py-2.5">
                    <TypeBadge type={data.type} />
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={data.status} />
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 text-xs">
                    <DiffCell cur={data.inverterBrand + ' ' + data.inverterModel} orig={orig ? orig.inverterBrand + ' ' + orig.inverterModel : null} />
                  </td>
                  <td className="px-3 py-2.5 text-center font-medium text-gray-900">
                    <DiffCell cur={data.capacity} orig={orig?.capacity} />
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500">
                    <DiffCell cur={data.scheduledDate} orig={orig?.scheduledDate} />
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 truncate max-w-24">
                    <DiffCell cur={data.technicianName || '—'} orig={orig?.technicianName || '—'} />
                  </td>
                  {showActions && (
                    <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        {effectiveKind !== 'deleted' && (
                          <button onClick={() => onEdit(data)} className="p-1.5 rounded hover:bg-amber-100 text-amber-600 transition-colors" title="แก้ไข">
                            <Pencil size={13} />
                          </button>
                        )}
                        {(kind === 'added' || kind === 'edited') && onRemoveChange && (
                          <button onClick={() => onRemoveChange(row)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors" title="ยกเลิกการเปลี่ยนแปลง">
                            <RotateCcw size={13} />
                          </button>
                        )}
                        {kind !== 'added' && onDelete && (
                          <button onClick={() => onDelete(data.id)} className={`p-1.5 rounded transition-colors ${isDeleted ? 'bg-red-100 text-red-600' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`} title={isDeleted ? 'ยกเลิกการลบ' : 'กำหนดลบ'}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
                {expandedId === rowId && (
                  <tr className={effectiveKind !== 'base' ? rowStyle[effectiveKind] : 'bg-blue-50/40'}>
                    <td colSpan={showActions ? (showDiff ? 11 : 10) : (showDiff ? 10 : 9)} className="px-6 py-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                        <InfoMini label="Serial No." cur={data.serialNo} orig={orig?.serialNo} />
                        <InfoMini label="ความสำคัญ" cur={PRIORITY_OPTS.find(p => p.value === data.priority)?.label} orig={orig ? PRIORITY_OPTS.find(p => p.value === orig.priority)?.label : null} />
                        <InfoMini label="ที่อยู่" cur={data.address} orig={orig?.address} />
                        <InfoMini label="หมายเหตุ" cur={data.notes || '—'} orig={orig?.notes || '—'} />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ========= SUB-COMPONENTS =========

function DiffCell({ cur, orig }) {
  if (orig === undefined || orig === null || String(orig) === String(cur)) {
    return <span>{cur}</span>
  }
  return (
    <div className="space-y-0.5">
      <div className="line-through text-red-400 text-xs">{String(orig)}</div>
      <div className="text-green-700 font-medium">{String(cur)}</div>
    </div>
  )
}

function InfoMini({ label, cur, orig }) {
  const changed = orig !== undefined && orig !== null && String(orig) !== String(cur)
  return (
    <div>
      <div className="text-gray-400 mb-0.5">{label}</div>
      {changed ? (
        <div>
          <div className="line-through text-red-400">{String(orig)}</div>
          <div className="text-green-700 font-medium">{String(cur)}</div>
        </div>
      ) : (
        <div className="text-gray-700">{cur || '—'}</div>
      )}
    </div>
  )
}

function TypeBadge({ type }) {
  const c = { commissioning: 'bg-blue-100 text-blue-700', inspection: 'bg-green-100 text-green-700', maintenance: 'bg-amber-100 text-amber-700' }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c[type] || 'bg-gray-100 text-gray-600'}`}>{typeLabel[type] || type}</span>
}

function StatusBadge({ status }) {
  const c = { completed:'bg-green-100 text-green-700', in_progress:'bg-blue-100 text-blue-700', scheduled:'bg-purple-100 text-purple-700', pending:'bg-amber-100 text-amber-700', cancelled:'bg-red-100 text-red-700' }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c[status] || 'bg-gray-100 text-gray-600'}`}>{statusLabel[status] || status}</span>
}

function SummaryCard({ label, value, color, bg, dot }) {
  return (
    <div className={`rounded-xl border border-gray-200 p-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-1">
        {dot && <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />}
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  )
}

function VerifySummaryCard({ label, value, color, bg, icon }) {
  return (
    <div className={`rounded-xl border border-gray-200 p-4 ${bg}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-gray-600 font-medium">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  )
}

function VerifyTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-28">Job ID</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">ไซต์</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Serial No.</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-32">โครงการ (iSolarCloud)</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-20">รุ่น</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-28">สถานะ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{row.data.id}</td>
              <td className="px-4 py-2.5 text-gray-900 truncate max-w-32">{row.data.site}</td>
              <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{row.data.serialNo || '—'}</td>
              <td className="px-4 py-2.5 text-xs text-gray-600">
                {row.iolarCloudData ? (
                  <span className="text-green-700 font-medium">{row.iolarCloudData.project}</span>
                ) : row.reason ? (
                  <span className="text-amber-600">{row.reason}</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-xs text-gray-600">
                {row.iolarCloudData?.model || row.data.inverterModel || '—'}
              </td>
              <td className="px-4 py-2.5">
                {row.kind === 'added' && <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">ใหม่</span>}
                {row.kind === 'edited' && <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">แก้ไข</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ========= JOB FORM =========
function JobForm({ formData, onChange, errors, allBrands, modelsForBrand, technicians, customers }) {
  const F = ({ label, name, required, children }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
    </div>
  )
  const inputCls = (name) => `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors[name] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`

  const knownCustomers = customers.map(c => c.name)
  const knownTechs = technicians.map(t => t.name)

  return (
    <div className="space-y-6">
      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <F label="Job ID" name="id" required>
          <input value={formData.id} onChange={e => onChange('id', e.target.value)} className={inputCls('id')} placeholder="JOB-2024-007" />
        </F>
        <F label="ประเภทงาน" name="type" required>
          <select value={formData.type} onChange={e => onChange('type', e.target.value)} className={inputCls('type')}>
            {TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </F>
        <F label="ความสำคัญ" name="priority">
          <select value={formData.priority} onChange={e => onChange('priority', e.target.value)} className={inputCls('priority')}>
            {PRIORITY_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </F>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <F label="ลูกค้า" name="customerName" required>
          <input list="customers-list" value={formData.customerName} onChange={e => onChange('customerName', e.target.value)} className={inputCls('customerName')} placeholder="ชื่อบริษัท / ลูกค้า" />
          <datalist id="customers-list">{knownCustomers.map(n => <option key={n} value={n} />)}</datalist>
        </F>
        <F label="ชื่อไซต์ / สถานที่ติดตั้ง" name="site" required>
          <input value={formData.site} onChange={e => onChange('site', e.target.value)} className={inputCls('site')} placeholder="เช่น โรงงาน WHA ระยอง" />
        </F>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <F label="ที่อยู่" name="address">
          <input value={formData.address} onChange={e => onChange('address', e.target.value)} className={inputCls('address')} placeholder="ที่อยู่เต็ม" />
        </F>
        <F label="วันที่กำหนด" name="scheduledDate" required>
          <input type="date" value={formData.scheduledDate} onChange={e => onChange('scheduledDate', e.target.value)} className={inputCls('scheduledDate')} />
        </F>
      </div>

      <hr className="border-gray-100" />
      <h3 className="text-sm font-semibold text-gray-700">ข้อมูลอินเวอร์เตอร์</h3>

      {/* Row 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <F label="ยี่ห้อ" name="inverterBrand" required>
          <select value={formData.inverterBrand} onChange={e => onChange('inverterBrand', e.target.value)} className={inputCls('inverterBrand')}>
            <option value="">-- เลือกยี่ห้อ --</option>
            {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </F>
        <F label="รุ่น" name="inverterModel">
          <select value={formData.inverterModel} onChange={e => onChange('inverterModel', e.target.value)} className={inputCls('inverterModel')} disabled={!formData.inverterBrand}>
            <option value="">-- เลือกรุ่น --</option>
            {modelsForBrand(formData.inverterBrand).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </F>
        <F label="กำลัง (kW)" name="capacity" required>
          <input type="number" min="1" value={formData.capacity} onChange={e => onChange('capacity', e.target.value)} className={inputCls('capacity')} placeholder="เช่น 250" />
        </F>
      </div>

      {/* Row 5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <F label="Serial No." name="serialNo">
          <input value={formData.serialNo} onChange={e => onChange('serialNo', e.target.value)} className={inputCls('serialNo')} placeholder="หมายเลขซีเรียล" />
        </F>
        <F label="สถานะงาน" name="status">
          <select value={formData.status} onChange={e => onChange('status', e.target.value)} className={inputCls('status')}>
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </F>
      </div>

      <hr className="border-gray-100" />
      <h3 className="text-sm font-semibold text-gray-700">ช่างเทคนิค & หมายเหตุ</h3>

      {/* Row 6 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <F label="ช่างเทคนิค" name="technicianName">
          <input list="tech-list" value={formData.technicianName || ''} onChange={e => onChange('technicianName', e.target.value)} className={inputCls('technicianName')} placeholder="เลือกหรือพิมพ์ชื่อช่าง" />
          <datalist id="tech-list">{knownTechs.map(n => <option key={n} value={n} />)}</datalist>
        </F>
        <F label="หมายเหตุ" name="notes">
          <textarea value={formData.notes} onChange={e => onChange('notes', e.target.value)} className={`${inputCls('notes')} resize-none`} rows={2} placeholder="หมายเหตุเพิ่มเติม" />
        </F>
      </div>
    </div>
  )
}
