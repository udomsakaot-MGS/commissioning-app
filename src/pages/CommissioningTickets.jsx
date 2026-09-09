import { useState, useEffect, useMemo } from 'react'
import { TECHNICIANS } from '../data/ticketData'
import {
  Plus, MapPin, User, Phone, Calendar, CheckCircle2, Wrench, ClipboardList,
  X, ChevronRight, ChevronLeft, Trash2, Cloud, CloudOff, Cpu, Search, Pencil,
} from 'lucide-react'

const STORAGE_KEY = 'commissioning_workflow_tickets'

// ─── Workflow stages (3 levels) ─────────────────────────────────────────────
const STAGES = [
  {
    key: 'planning',
    label: 'วางแผน',
    sub: 'ข้อมูลโครงการ + วันนัด (ประมาณการ)',
    icon: ClipboardList,
    dot: 'bg-amber-400',
    head: 'text-amber-700',
    ring: 'border-amber-200 bg-amber-50/50',
  },
  {
    key: 'installed',
    label: 'ติดตั้งเสร็จ',
    sub: 'อุปกรณ์ติดตั้งเสร็จ + วันนัด (แน่นอน)',
    icon: Wrench,
    dot: 'bg-blue-400',
    head: 'text-blue-700',
    ring: 'border-blue-200 bg-blue-50/50',
  },
  {
    key: 'commissioned',
    label: 'Commissioned',
    sub: 'Commission เสร็จ + บันทึก SN',
    icon: CheckCircle2,
    dot: 'bg-green-500',
    head: 'text-green-700',
    ring: 'border-green-200 bg-green-50/50',
  },
]
const STAGE_ORDER = STAGES.map(s => s.key)
const stageCfg = k => STAGES.find(s => s.key === k) || STAGES[0]

const PRODUCT_OPTIONS = [
  'SG50CX-P2', 'SG110CX', 'SG125CX-P2', 'SG150CX', 'SG350HX', 'SG15RT',
  'OptimizerSP600S', 'RSDSR20D', 'Logger1000', 'Logger4000',
  'SH25T', 'SG5.0RS', 'PowerStack255CS', 'ESSLiquidCooling',
]

const TECH_NICKS = TECHNICIANS.map(t => ({ name: t.name, nick: t.nick }))
const nickOf = name => TECH_NICKS.find(t => t.name === name)?.nick || name

// ─── Seed data (first run only) ─────────────────────────────────────────────
function seedTickets() {
  const now = Date.now()
  const mk = (o, i) => ({
    id: `WT${now}-${i}`,
    project: '', customer: '', location: '', contact: '', phone: '',
    estimatedDate: '', confirmedDate: '', technician: '', products: [],
    iSolarCloud: false, note: '', snDetails: [], createdAt: now, updatedAt: now,
    ...o,
  })
  return [
    mk({
      project: 'Solar Rooftop โรงงาน ABC', customer: 'ABC Industry', location: 'นิคมอุตสาหกรรมอมตะซิตี้ ชลบุรี',
      contact: 'คุณสมชาย', phone: '081-234-5678', estimatedDate: '2026-09-20',
      technician: 'Udomsak Aotphon', products: ['SG125CX-P2', 'OptimizerSP600S'], stage: 'planning',
    }, 1),
    mk({
      project: 'BESS ฟาร์มพลังงาน XYZ', customer: 'XYZ Energy', location: 'อ.เมือง จ.นครราชสีมา',
      contact: 'คุณวิภา', phone: '089-876-5432', estimatedDate: '2026-09-25',
      technician: 'Tasa Khanthong', products: ['ESSLiquidCooling', 'PowerStack255CS'], stage: 'planning', iSolarCloud: true,
    }, 2),
    mk({
      project: 'Ground Mount 5MW ลพบุรี', customer: 'Green Power Co.', location: 'อ.พัฒนานิคม จ.ลพบุรี',
      contact: 'คุณธนา', phone: '086-111-2222', estimatedDate: '2026-09-18', confirmedDate: '2026-09-22',
      technician: 'Bunyaphon Bualuang', products: ['SG350HX', 'RSDSR20D'], stage: 'installed', iSolarCloud: true,
    }, 3),
    mk({
      project: 'Carport Solar ห้างสรรพสินค้า', customer: 'Retail Mall', location: 'เขตบางนา กรุงเทพฯ',
      contact: 'คุณนภา', phone: '082-333-4444', estimatedDate: '2026-09-15', confirmedDate: '2026-09-19',
      technician: 'Tanatat Pornthepsiripong', products: ['SG110CX', 'Logger1000'], stage: 'installed',
    }, 4),
    mk({
      project: 'บ้านพักอาศัย 108 kWp', customer: 'IRR', location: 'อ.หาดใหญ่ จ.สงขลา',
      contact: 'คุณอนันต์', phone: '084-555-6666', estimatedDate: '2026-09-05', confirmedDate: '2026-09-08',
      technician: 'Tasa Khanthong', products: ['SG50CX-P2'], stage: 'commissioned', iSolarCloud: true,
      snDetails: [
        { sn: 'A2540123456', model: 'SG50CX-P2', type: 'Inverter' },
        { sn: 'B1230987654', model: 'Logger1000', type: 'Logger' },
      ],
    }, 5),
  ]
}

function loadTickets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const seeded = seedTickets()
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)) } catch { /* ignore */ }
  return seeded
}

const THAI_MONTHS_SHORT = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${parseInt(day, 10)} ${THAI_MONTHS_SHORT[parseInt(m, 10)]} ${parseInt(y, 10) + 543}`
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function CommissioningTickets() {
  const [tickets, setTickets] = useState(loadTickets)
  const [search, setSearch] = useState('')
  const [filterTech, setFilterTech] = useState('all')
  const [editing, setEditing] = useState(null) // ticket object or {} for new

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets)) } catch { /* ignore */ }
  }, [tickets])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tickets.filter(t => {
      if (filterTech !== 'all' && t.technician !== filterTech) return false
      if (q && !t.project.toLowerCase().includes(q) && !t.customer.toLowerCase().includes(q)
          && !(t.location || '').toLowerCase().includes(q)) return false
      return true
    })
  }, [tickets, search, filterTech])

  const byStage = useMemo(() => {
    const map = { planning: [], installed: [], commissioned: [] }
    filtered.forEach(t => { (map[t.stage] || map.planning).push(t) })
    // Sort each column by the most relevant date
    map.planning.sort((a, b) => (a.estimatedDate || '').localeCompare(b.estimatedDate || ''))
    map.installed.sort((a, b) => (a.confirmedDate || '').localeCompare(b.confirmedDate || ''))
    map.commissioned.sort((a, b) => (b.confirmedDate || '').localeCompare(a.confirmedDate || ''))
    return map
  }, [filtered])

  function saveTicket(data) {
    setTickets(prev => {
      if (data.id && prev.some(t => t.id === data.id)) {
        return prev.map(t => t.id === data.id ? { ...data, updatedAt: Date.now() } : t)
      }
      const now = Date.now()
      return [...prev, { ...data, id: `WT${now}`, stage: data.stage || 'planning', createdAt: now, updatedAt: now }]
    })
    setEditing(null)
  }

  function deleteTicket(id) {
    setTickets(prev => prev.filter(t => t.id !== id))
    setEditing(null)
  }

  function advance(id) {
    setTickets(prev => prev.map(t => {
      if (t.id !== id) return t
      const idx = STAGE_ORDER.indexOf(t.stage)
      if (idx >= STAGE_ORDER.length - 1) return t
      const nextStage = STAGE_ORDER[idx + 1]
      const patch = { ...t, stage: nextStage, updatedAt: Date.now() }
      // When confirming installation, default the confirmed date to the estimate
      if (nextStage === 'installed' && !patch.confirmedDate) patch.confirmedDate = t.estimatedDate || ''
      return patch
    }))
  }

  function regress(id) {
    setTickets(prev => prev.map(t => {
      if (t.id !== id) return t
      const idx = STAGE_ORDER.indexOf(t.stage)
      if (idx <= 0) return t
      return { ...t, stage: STAGE_ORDER[idx - 1], updatedAt: Date.now() }
    }))
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commissioning Tickets</h1>
          <p className="text-gray-500 text-sm mt-1">
            เวิร์กโฟลว์ 3 ระดับ: วางแผน → ติดตั้งเสร็จ → Commissioned
          </p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> เพิ่ม Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="ค้นหาโครงการ / ลูกค้า / สถานที่..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={filterTech} onChange={e => setFilterTech(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="all">ช่างทุกคน</option>
          {TECH_NICKS.map(t => <option key={t.name} value={t.name}>{t.nick} ({t.name})</option>)}
        </select>
        <span className="text-sm text-gray-400">{filtered.length} ticket</span>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {STAGES.map((stage, sIdx) => {
          const Icon = stage.icon
          const items = byStage[stage.key] || []
          return (
            <div key={stage.key} className={`rounded-xl border ${stage.ring} flex flex-col`}>
              <div className="px-4 py-3 border-b border-gray-200/70">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`} />
                  <Icon size={16} className={stage.head} />
                  <span className={`font-semibold text-sm ${stage.head}`}>ระดับ {sIdx + 1}: {stage.label}</span>
                  <span className="ml-auto text-xs font-medium text-gray-500 bg-white/80 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1 pl-5">{stage.sub}</p>
              </div>

              <div className="p-3 space-y-3 flex-1 min-h-24">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-300">— ไม่มี ticket —</div>
                ) : items.map(t => (
                  <TicketCard
                    key={t.id} ticket={t} stageIdx={sIdx}
                    onAdvance={() => advance(t.id)}
                    onRegress={() => regress(t.id)}
                    onEdit={() => setEditing(t)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {editing && (
        <TicketModal
          ticket={editing}
          onSave={saveTicket}
          onDelete={deleteTicket}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────
function TicketCard({ ticket: t, stageIdx, onAdvance, onRegress, onEdit }) {
  const isLast = stageIdx === STAGES.length - 1
  const primaryDate = t.stage === 'planning' ? t.estimatedDate : t.confirmedDate
  const dateLabel = t.stage === 'planning' ? 'นัด (ประมาณ)' : 'นัด (แน่นอน)'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-gray-900 text-sm leading-snug">{t.project || '(ไม่ระบุชื่อ)'}</div>
          <div className="text-xs text-gray-500 truncate">{t.customer}</div>
        </div>
        <button onClick={onEdit} className="text-gray-300 hover:text-blue-600 flex-shrink-0 p-0.5">
          <Pencil size={13} />
        </button>
      </div>

      <div className="mt-2 space-y-1 text-xs text-gray-500">
        {t.location && (
          <div className="flex items-start gap-1.5"><MapPin size={12} className="mt-0.5 flex-shrink-0 text-gray-400" /><span className="truncate">{t.location}</span></div>
        )}
        {t.contact && (
          <div className="flex items-center gap-1.5"><User size={12} className="text-gray-400" /><span>{t.contact}</span>
            {t.phone && <span className="text-gray-400">· {t.phone}</span>}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-gray-400" />
          <span className="text-gray-400">{dateLabel}:</span>
          <span className={`font-medium ${primaryDate ? 'text-gray-700' : 'text-gray-300'}`}>{fmtDate(primaryDate)}</span>
        </div>
      </div>

      {/* Products + iSC */}
      <div className="flex flex-wrap gap-1 mt-2">
        {t.iSolarCloud
          ? <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium"><Cloud size={9} /> iSC</span>
          : <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium"><CloudOff size={9} /> ไม่มี iSC</span>}
        {(t.products || []).slice(0, 3).map(p => (
          <span key={p} className="text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{p}</span>
        ))}
        {(t.products || []).length > 3 && <span className="text-xs text-gray-400">+{t.products.length - 3}</span>}
      </div>

      {/* Technician + SN count (stage 3) */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          {t.technician ? <span className="inline-flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center">{nickOf(t.technician).slice(0, 1)}</span>{nickOf(t.technician)}</span> : <span className="text-gray-300">ยังไม่มอบหมาย</span>}
        </span>
        {t.stage === 'commissioned' && (
          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium"><Cpu size={11} /> {(t.snDetails || []).length} SN</span>
        )}
      </div>

      {/* Stage controls */}
      <div className="flex items-center gap-1.5 mt-2.5">
        {stageIdx > 0 && (
          <button onClick={onRegress}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50" title="ย้อนกลับ">
            <ChevronLeft size={14} />
          </button>
        )}
        {!isLast ? (
          <button onClick={onAdvance}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors">
            {stageIdx === 0 ? 'ติดตั้งเสร็จ' : 'Commission เสร็จ'} <ChevronRight size={13} />
          </button>
        ) : (
          <button onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-medium hover:bg-green-100 transition-colors">
            <Cpu size={12} /> บันทึก SN
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Ticket Modal (create / edit) ─────────────────────────────────────────────
function TicketModal({ ticket, onSave, onDelete, onClose }) {
  const isNew = !ticket.id
  const [form, setForm] = useState(() => ({
    project: '', customer: '', location: '', contact: '', phone: '',
    estimatedDate: '', confirmedDate: '', technician: '', products: [],
    iSolarCloud: false, note: '', snDetails: [], stage: 'planning',
    ...ticket,
  }))

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleProduct = (p) => setForm(f => ({
    ...f, products: f.products.includes(p) ? f.products.filter(x => x !== p) : [...f.products, p],
  }))

  const addSN = () => setForm(f => ({ ...f, snDetails: [...f.snDetails, { sn: '', model: '', type: 'Inverter' }] }))
  const setSN = (i, k, v) => setForm(f => ({ ...f, snDetails: f.snDetails.map((s, j) => j === i ? { ...s, [k]: v } : s) }))
  const rmSN = (i) => setForm(f => ({ ...f, snDetails: f.snDetails.filter((_, j) => j !== i) }))

  const showConfirmed = form.stage !== 'planning'
  const showSN = form.stage === 'commissioned'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">{isNew ? 'สร้าง Ticket ใหม่' : 'แก้ไข Ticket'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Stage selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">ระดับเวิร์กโฟลว์</label>
            <div className="flex gap-2">
              {STAGES.map((s, i) => (
                <button key={s.key} onClick={() => set('stage', s.key)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                    form.stage === s.key ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  {i + 1}. {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Level 1: Project info */}
          <SectionTitle n={1} title="ข้อมูลโครงการ" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="ชื่อโครงการ *" value={form.project} onChange={v => set('project', v)} placeholder="เช่น Solar Rooftop โรงงาน ABC" />
            <Field label="ลูกค้า" value={form.customer} onChange={v => set('customer', v)} />
            <Field label="ตำแหน่งที่ติดตั้ง" value={form.location} onChange={v => set('location', v)} icon={<MapPin size={13} />} full />
            <Field label="ผู้ติดต่อ" value={form.contact} onChange={v => set('contact', v)} icon={<User size={13} />} />
            <Field label="เบอร์โทร" value={form.phone} onChange={v => set('phone', v)} icon={<Phone size={13} />} />
            <Field label="วันที่ Commissioning (ประมาณการ)" type="date" value={form.estimatedDate} onChange={v => set('estimatedDate', v)} />
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">ช่างผู้รับผิดชอบ</label>
              <select value={form.technician} onChange={e => set('technician', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— ยังไม่มอบหมาย —</option>
                {TECH_NICKS.map(t => <option key={t.name} value={t.name}>{t.nick} ({t.name})</option>)}
              </select>
            </div>
          </div>

          {/* Products */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">อุปกรณ์ในโครงการ</label>
            <div className="flex flex-wrap gap-1.5">
              {PRODUCT_OPTIONS.map(p => (
                <button key={p} onClick={() => toggleProduct(p)}
                  className={`text-xs px-2 py-1 rounded-lg border font-medium transition-all ${
                    form.products.includes(p) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none">
            <input type="checkbox" checked={form.iSolarCloud} onChange={e => set('iSolarCloud', e.target.checked)}
              className="rounded border-gray-300 text-blue-600" />
            <Cloud size={14} className="text-teal-600" /> อยู่ในระบบ iSolarCloud
          </label>

          {/* Level 2: Confirmed date */}
          {showConfirmed && (
            <>
              <SectionTitle n={2} title="ติดตั้งเสร็จ — วันนัดที่แน่นอน" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="วันที่ Commissioning (แน่นอน)" type="date" value={form.confirmedDate} onChange={v => set('confirmedDate', v)} />
              </div>
            </>
          )}

          {/* Level 3: SN details */}
          {showSN && (
            <>
              <SectionTitle n={3} title="Commissioned — บันทึกรายละเอียด SN" />
              <div className="space-y-2">
                {form.snDetails.length === 0 && (
                  <p className="text-xs text-gray-400">ยังไม่มี SN — กด "เพิ่ม SN" เพื่อบันทึก</p>
                )}
                {form.snDetails.map((s, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={s.sn} onChange={e => setSN(i, 'sn', e.target.value)} placeholder="Serial Number"
                      className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input value={s.model} onChange={e => setSN(i, 'model', e.target.value)} placeholder="Model"
                      className="w-32 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <select value={s.type} onChange={e => setSN(i, 'type', e.target.value)}
                      className="w-28 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['Inverter', 'Optimizer', 'RSD', 'Logger', 'Meter', 'Battery', 'ESS'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <button onClick={() => rmSN(i)} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                  </div>
                ))}
                <button onClick={addSN} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                  <Plus size={13} /> เพิ่ม SN
                </button>
              </div>
            </>
          )}

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">หมายเหตุ</label>
            <textarea value={form.note} onChange={e => set('note', e.target.value)} rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-2xl">
          {!isNew ? (
            <button onClick={() => onDelete(ticket.id)}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium">
              <Trash2 size={15} /> ลบ
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
            <button
              onClick={() => { if (form.project.trim()) onSave(form) }}
              disabled={!form.project.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ n, title }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{n}</span>
      <span className="text-sm font-semibold text-gray-700">{title}</span>
      <span className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', icon, full }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          className={`w-full ${icon ? 'pl-8' : 'pl-3'} pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
      </div>
    </div>
  )
}
