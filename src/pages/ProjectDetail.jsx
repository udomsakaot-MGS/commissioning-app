import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Cloud, CloudOff, AlertTriangle, CheckCircle,
  Building2, User, Calendar, StickyNote, Pencil, Check, X,
  ShoppingBag, Tag, Loader2,
} from 'lucide-react'

const SN_IDX = { sn: 0, item: 1, desc: 2, date: 3, isc: 4 }

const LS_PROJECT = 'commissioning_project_data'
const LS_SN      = 'commissioning_sn_data'

const GROUP_ORDER = [
  'M-INVERTER', 'M-RAPID SHUTDOWN', 'M-OPTIMIZER',
  'M-DATA LOGGER', 'M-ENERGY METER', 'M-BATTERY', 'M-ENERGY STORAGE',
]

const GROUP_LABEL = {
  'M-INVERTER':       'อินเวอร์เตอร์',
  'M-OPTIMIZER':      'ออปทิไมเซอร์',
  'M-RAPID SHUTDOWN': 'Rapid Shutdown',
  'M-DATA LOGGER':    'Data Logger',
  'M-ENERGY METER':   'Energy Meter',
  'M-BATTERY':        'Battery',
  'M-ENERGY STORAGE': 'Energy Storage',
}

const PROJ_STATUS_OPTIONS = [
  { value: 'unset',       label: 'ยังไม่ระบุ' },
  { value: 'waiting',     label: 'รอ Commissioning' },
  { value: 'in_progress', label: 'กำลังดำเนินการ' },
  { value: 'done',        label: 'Commissioning เสร็จแล้ว' },
  { value: 'not_service', label: 'ไม่ใช่ขอบเขต Service' },
]

const ISC_MODE_OPTIONS = [
  { value: '',                    label: '— ยังไม่ระบุ —' },
  { value: 'iSolarCloud',         label: 'iSolarCloud' },
  { value: 'ไม่ขึ้น iSolarCloud', label: 'ไม่ขึ้น iSolarCloud' },
]

const SALES_OPTIONS = [
  { value: '',         label: '— ยังไม่ระบุ —' },
  { value: 'คุณนนท์', label: 'คุณนนท์' },
  { value: 'คุณแพร',  label: 'คุณแพร' },
  { value: 'คุณบอส',  label: 'คุณบอส' },
  { value: 'คุณก้อง', label: 'คุณก้อง' },
]

const PROJ_STATUS_BADGE = {
  unset:       'bg-gray-100 text-gray-500',
  waiting:     'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done:        'bg-green-100 text-green-700',
  not_service: 'bg-gray-100 text-gray-400',
}

const SN_STATUS = {
  waiting:     { label: 'รอดำเนินการ',   badgeCls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  in_progress: { label: 'กำลังดำเนินการ', badgeCls: 'bg-blue-100 text-blue-700',  dot: 'bg-blue-500'  },
  done:        { label: 'เสร็จสิ้น',      badgeCls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  issue:       { label: 'มีปัญหา',        badgeCls: 'bg-red-100 text-red-700',     dot: 'bg-red-500'   },
}

const PAGE_SIZE = 50

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getModel(desc) {
  return desc?.split(',')[0]?.trim() || '—'
}

function loadProjAnnotations(key) {
  try { return JSON.parse(localStorage.getItem(LS_PROJECT) || '{}')[key] || {} } catch { return {} }
}

function saveProjAnnotations(key, fields) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_PROJECT) || '{}')
    all[key] = { ...(all[key] || {}), ...fields }
    localStorage.setItem(LS_PROJECT, JSON.stringify(all))
  } catch {}
}

function loadSnStore() {
  try { return JSON.parse(localStorage.getItem(LS_SN) || '{}') } catch { return {} }
}

function saveSnStore(store) {
  try { localStorage.setItem(LS_SN, JSON.stringify(store)) } catch {}
}

function getEffectiveProjStatus(project, annotations) {
  const manual = annotations?.status
  if (manual && manual !== 'unset') return manual
  const inv = project?.groups?.['M-INVERTER'] || []
  if (inv.length > 0 && inv.every(sn => sn[SN_IDX.isc] === 1)) return 'done'
  return 'unset'
}

// ─── InfoField ────────────────────────────────────────────────────────────────
function InfoField({ icon, label, value, editMode, inputValue, onChange, type = 'text', mono, readOnly, options }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-0.5">
        {icon}
        <span>{label}</span>
      </div>
      {editMode && onChange && !readOnly ? (
        type === 'textarea' ? (
          <textarea
            value={inputValue ?? ''}
            onChange={e => onChange(e.target.value)}
            rows={2}
            className="w-full text-xs border border-gray-200 rounded px-2 py-1 resize-none outline-none focus:border-blue-400 bg-white"
          />
        ) : type === 'select' ? (
          <select
            value={inputValue ?? ''}
            onChange={e => onChange(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400 bg-white"
          >
            {(options || PROJ_STATUS_OPTIONS).map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={inputValue ?? ''}
            onChange={e => onChange(e.target.value)}
            className={`w-full text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400 bg-white ${mono ? 'font-mono' : ''}`}
          />
        )
      ) : (
        <div className={`text-sm font-medium text-gray-800 ${mono ? 'font-mono' : ''} ${!value || value === '-' || value === 'ยังไม่กำหนด' || value === '— ยังไม่ระบุ —' ? 'text-gray-400' : ''}`}>
          {value || '-'}
        </div>
      )}
    </div>
  )
}

// ─── Actions per SN ───────────────────────────────────────────────────────────
function ActionButtons({ status, snSerial, updateSnStatus }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {(status === 'waiting' || status === 'in_progress') && (
        <button
          onClick={() => updateSnStatus(snSerial, 'done')}
          className="flex items-center gap-0.5 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
        >
          <CheckCircle size={11} /> เสร็จ
        </button>
      )}
      {status === 'done' && (
        <button
          onClick={() => updateSnStatus(snSerial, 'waiting')}
          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 whitespace-nowrap"
        >
          ยกเลิก
        </button>
      )}
      {status !== 'issue' ? (
        <button
          onClick={() => updateSnStatus(snSerial, 'issue')}
          className="flex items-center gap-0.5 text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200 whitespace-nowrap"
        >
          <AlertTriangle size={11} /> ปัญหา
        </button>
      ) : (
        <>
          <button
            onClick={() => updateSnStatus(snSerial, 'done')}
            className="flex items-center gap-0.5 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
          >
            <CheckCircle size={11} /> เสร็จ
          </button>
          <button
            onClick={() => updateSnStatus(snSerial, 'waiting')}
            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 whitespace-nowrap"
          >
            ยกเลิก
          </button>
        </>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const projectIdx = parseInt(id, 10)

  const [project, setProject] = useState(null)
  const [projectKey, setProjectKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [annotations, setAnnotations] = useState({})
  const [snStore, setSnStore] = useState(loadSnStore)

  const [editMode, setEditMode] = useState(false)
  const [draft, setDraft] = useState({})

  const [activeGroup, setActiveGroup] = useState(null)
  const [snPage, setSnPage] = useState(0)

  const [selectedSNs, setSelectedSNs] = useState(new Set())

  // ── Load project data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (isNaN(projectIdx)) { setError('URL ไม่ถูกต้อง'); setLoading(false); return }
    fetch('/sn-data.json')
      .then(r => r.json())
      .then(data => {
        const found = data.projects[projectIdx]
        if (!found) { setError('ไม่พบโครงการ'); return }
        const key = `${found.project}__${found.customer}`
        found._key = key
        setProject(found)
        setProjectKey(key)
        setAnnotations(loadProjAnnotations(key))
        const firstGroup = GROUP_ORDER.find(g => (found.groups?.[g] || []).length > 0)
        setActiveGroup(firstGroup || null)
      })
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [projectIdx])

  // Clear selection on tab or page change
  useEffect(() => setSelectedSNs(new Set()), [activeGroup, snPage])

  // ── Available tabs ─────────────────────────────────────────────────────────
  const availableGroups = useMemo(() => {
    if (!project) return []
    return GROUP_ORDER.filter(g => (project.groups?.[g] || []).length > 0)
      .map(g => ({ group: g, label: GROUP_LABEL[g] || g, count: project.groups[g].length }))
  }, [project])

  // ── Current tab SNs ────────────────────────────────────────────────────────
  const tabSNs = useMemo(() => {
    if (!project || !activeGroup) return []
    return project.groups?.[activeGroup] || []
  }, [project, activeGroup])

  const tabSNsPage = tabSNs.slice(snPage * PAGE_SIZE, (snPage + 1) * PAGE_SIZE)
  const totalSnPages = Math.ceil(tabSNs.length / PAGE_SIZE)

  // ── Project-level stats (all groups) ──────────────────────────────────────
  const projectStats = useMemo(() => {
    if (!project) return { done: 0, inProgress: 0, waiting: 0, issue: 0, total: 0, iscCount: 0 }
    let done = 0, inProgress = 0, waiting = 0, issue = 0, total = 0, iscCount = 0
    Object.values(project.groups || {}).forEach(sns => {
      sns.forEach(sn => {
        total++
        const st = snStore[sn[SN_IDX.sn]]?.status || 'waiting'
        if (st === 'done') done++
        else if (st === 'in_progress') inProgress++
        else if (st === 'issue') issue++
        else waiting++
        const isc = snStore[sn[SN_IDX.sn]]?.iscOverride !== undefined
          ? snStore[sn[SN_IDX.sn]].iscOverride
          : sn[SN_IDX.isc]
        if (isc === 1) iscCount++
      })
    })
    return { done, inProgress, waiting, issue, total, iscCount }
  }, [project, snStore])

  // ── Tab stats ──────────────────────────────────────────────────────────────
  const tabStats = useMemo(() => {
    let done = 0, inProgress = 0, waiting = 0, iscCount = 0
    tabSNs.forEach(sn => {
      const st = snStore[sn[SN_IDX.sn]]?.status || 'waiting'
      if (st === 'done') done++
      else if (st === 'in_progress') inProgress++
      else waiting++
      const isc = snStore[sn[SN_IDX.sn]]?.iscOverride !== undefined
        ? snStore[sn[SN_IDX.sn]].iscOverride
        : sn[SN_IDX.isc]
      if (isc === 1) iscCount++
    })
    return { done, inProgress, waiting, iscCount }
  }, [tabSNs, snStore])

  // ── Inverter commissioned % (for header) ──────────────────────────────────
  const invStats = useMemo(() => {
    if (!project) return { done: 0, total: 0 }
    const inv = project.groups?.['M-INVERTER'] || []
    const done = inv.filter(sn => (snStore[sn[SN_IDX.sn]]?.status || 'waiting') === 'done').length
    return { done, total: inv.length }
  }, [project, snStore])

  // ── SN actions ────────────────────────────────────────────────────────────
  const updateSnStatus = useCallback((snSerial, status) => {
    setSnStore(prev => {
      const next = { ...prev, [snSerial]: { ...(prev[snSerial] || {}), status } }
      saveSnStore(next)
      return next
    })
  }, [])

  const toggleSnIsc = useCallback((snSerial, currentVal) => {
    setSnStore(prev => {
      const next = { ...prev, [snSerial]: { ...(prev[snSerial] || {}), iscOverride: currentVal === 1 ? 0 : 1 } }
      saveSnStore(next)
      return next
    })
  }, [])

  const bulkUpdateSnIsc = useCallback((serials, iscVal) => {
    setSnStore(prev => {
      const next = { ...prev }
      serials.forEach(serial => {
        next[serial] = { ...(next[serial] || {}), iscOverride: iscVal }
      })
      saveSnStore(next)
      return next
    })
  }, [])

  const bulkUpdateSnStatus = useCallback((serials, status) => {
    setSnStore(prev => {
      const next = { ...prev }
      serials.forEach(serial => {
        next[serial] = { ...(next[serial] || {}), status }
      })
      saveSnStore(next)
      return next
    })
  }, [])

  // ── Checkbox selection ─────────────────────────────────────────────────────
  const allPageSelected = tabSNsPage.length > 0 && tabSNsPage.every(sn => selectedSNs.has(sn[SN_IDX.sn]))
  const somePageSelected = tabSNsPage.some(sn => selectedSNs.has(sn[SN_IDX.sn]))

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedSNs(prev => {
        const next = new Set(prev)
        tabSNsPage.forEach(sn => next.delete(sn[SN_IDX.sn]))
        return next
      })
    } else {
      setSelectedSNs(prev => {
        const next = new Set(prev)
        tabSNsPage.forEach(sn => next.add(sn[SN_IDX.sn]))
        return next
      })
    }
  }

  const toggleSelectSN = useCallback((serial) => {
    setSelectedSNs(prev => {
      const next = new Set(prev)
      if (next.has(serial)) next.delete(serial)
      else next.add(serial)
      return next
    })
  }, [])

  // ── Edit project info ─────────────────────────────────────────────────────
  const startEdit = () => {
    setDraft({
      status:          annotations.status || 'unset',
      iSolarCloudName: annotations.iSolarCloudName || '',
      iscMode:         annotations.iscMode || '',
      customer:        annotations.customer || project?.customer || '',
      salesPerson:     annotations.salesPerson || '',
      technician:      annotations.technician || '',
      deliveryDate:    annotations.deliveryDate || '',
      commDate:        annotations.commDate || '',
      note:            annotations.note || '',
    })
    setEditMode(true)
  }

  const saveEdit = () => {
    const newAnno = { ...annotations, ...draft }
    setAnnotations(newAnno)
    saveProjAnnotations(projectKey, draft)

    // Bulk-set iSC for all SNs based on iscMode selection
    const iscMode = draft.iscMode
    if (iscMode === 'iSolarCloud' || iscMode === 'ไม่ขึ้น iSolarCloud') {
      const iscVal = iscMode === 'iSolarCloud' ? 1 : 0
      const allSerials = Object.values(project?.groups || {}).flat().map(sn => sn[SN_IDX.sn])
      setSnStore(prev => {
        const next = { ...prev }
        allSerials.forEach(serial => {
          next[serial] = { ...(next[serial] || {}), iscOverride: iscVal }
        })
        saveSnStore(next)
        return next
      })
    }

    setEditMode(false)
  }

  const cancelEdit = () => setEditMode(false)

  // ── Derived values ─────────────────────────────────────────────────────────
  const effectiveStatus = getEffectiveProjStatus(project, annotations)
  const pct = invStats.total > 0 ? Math.round(invStats.done / invStats.total * 100) : null
  const customerDisplay = annotations.customer || project?.customer || '-'

  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center py-32 text-gray-400">
      <Loader2 size={24} className="animate-spin mr-2" />
      <span>กำลังโหลดข้อมูล...</span>
    </div>
  )

  if (error || !project) return (
    <div className="text-center py-20 text-gray-400">
      <p className="text-lg">{error || 'ไม่พบโครงการ'}</p>
      <button onClick={() => navigate('/projects')} className="text-blue-600 hover:underline text-sm mt-2">
        ← กลับไปรายการโครงการ
      </button>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/projects')}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {project.project || '(ไม่ระบุโครงการ)'}
            </h1>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${PROJ_STATUS_BADGE[effectiveStatus]}`}>
              {PROJ_STATUS_OPTIONS.find(o => o.value === effectiveStatus)?.label || effectiveStatus}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">{customerDisplay}</p>
        </div>
        {pct !== null && (
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-bold text-blue-700">{pct}%</div>
            <div className="text-xs text-gray-400">{invStats.done}/{invStats.total} commissioned</div>
          </div>
        )}
      </div>

      {/* ── Info grid ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">รายละเอียดโครงการ</span>
          {!editMode ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Pencil size={12} /> แก้ไข
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="flex items-center gap-1 text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Check size={12} /> บันทึก
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1 text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
              >
                <X size={12} /> ยกเลิก
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
          <InfoField
            icon={<Cloud size={13} className="text-amber-500" />}
            label="iSolarCloud Name"
            value={annotations.iSolarCloudName || '-'}
            editMode={editMode} inputValue={draft.iSolarCloudName} mono
            onChange={v => setDraft(d => ({ ...d, iSolarCloudName: v }))}
          />
          <InfoField
            icon={<Cloud size={13} className="text-amber-500" />}
            label="iSolarCloud"
            value={annotations.iscMode || '-'}
            editMode={editMode} inputValue={draft.iscMode} type="select"
            options={ISC_MODE_OPTIONS}
            onChange={v => setDraft(d => ({ ...d, iscMode: v }))}
          />
          <InfoField
            icon={<Building2 size={13} className="text-gray-400" />}
            label="ลูกค้า"
            value={customerDisplay}
            editMode={editMode} inputValue={draft.customer}
            onChange={v => setDraft(d => ({ ...d, customer: v }))}
          />
          <InfoField
            icon={<ShoppingBag size={13} className="text-gray-400" />}
            label="ฝ่ายขาย"
            value={annotations.salesPerson || '-'}
            editMode={editMode} inputValue={draft.salesPerson} type="select"
            options={SALES_OPTIONS}
            onChange={v => setDraft(d => ({ ...d, salesPerson: v }))}
          />
          <InfoField
            icon={<User size={13} className="text-gray-400" />}
            label="ช่างเทคนิค"
            value={annotations.technician || '-'}
            editMode={editMode} inputValue={draft.technician}
            onChange={v => setDraft(d => ({ ...d, technician: v }))}
          />
          <InfoField
            icon={<Tag size={13} className="text-gray-400" />}
            label="ชื่อโครงการ MGlobal"
            value={project.project || '-'}
            editMode={false}
            readOnly
          />
          <InfoField
            icon={<Calendar size={13} className="text-gray-400" />}
            label="วันส่งมอบ"
            value={annotations.deliveryDate || '-'}
            editMode={editMode} inputValue={draft.deliveryDate} type="date"
            onChange={v => setDraft(d => ({ ...d, deliveryDate: v }))}
          />
          <InfoField
            icon={<Calendar size={13} className="text-green-500" />}
            label="วัน Commissioning"
            value={annotations.commDate || 'ยังไม่กำหนด'}
            editMode={editMode} inputValue={draft.commDate} type="date"
            onChange={v => setDraft(d => ({ ...d, commDate: v }))}
          />
          {editMode ? (
            <InfoField
              icon={<Tag size={13} className="text-blue-400" />}
              label="สถานะโครงการ"
              value=""
              editMode={editMode} inputValue={draft.status} type="select"
              onChange={v => setDraft(d => ({ ...d, status: v }))}
            />
          ) : (
            <div />
          )}
        </div>

        {/* Note — full width */}
        <div className="mt-4">
          <InfoField
            icon={<StickyNote size={13} className="text-gray-400" />}
            label="หมายเหตุ"
            value={annotations.note || '-'}
            editMode={editMode} inputValue={draft.note} type="textarea"
            onChange={v => setDraft(d => ({ ...d, note: v }))}
          />
        </div>

        {/* Stats row */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-sm">
          <StatDot dot="bg-green-500" label="เสร็จสิ้น"        count={projectStats.done} />
          <StatDot dot="bg-blue-500"  label="กำลังดำเนินการ"   count={projectStats.inProgress} />
          <StatDot dot="bg-amber-400" label="รอดำเนินการ"      count={projectStats.waiting} />
          {projectStats.issue > 0 && (
            <StatDot dot="bg-red-500" label="มีปัญหา" count={projectStats.issue} textCls="text-red-600" />
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            <Cloud size={14} className="text-amber-500" />
            <span className="text-gray-600">
              iSolarCloud <strong>{projectStats.iscCount}</strong>/{projectStats.total}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tabs + Table ─────────────────────────────────────────────────────── */}
      {availableGroups.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {availableGroups.map(({ group, label, count }) => (
              <button
                key={group}
                onClick={() => { setActiveGroup(group); setSnPage(0) }}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeGroup === group
                    ? 'border-blue-600 text-blue-700 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  activeGroup === group ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="p-4">
            {/* Tab summary bar */}
            <div className="flex items-center gap-4 mb-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              <span>ทั้งหมด <strong className="text-gray-700">{tabSNs.length}</strong> รายการ</span>
              <span>Commissioned <strong className="text-green-600">{tabStats.done}</strong></span>
              <span>iSolarCloud <strong className="text-amber-600">{tabStats.iscCount}</strong></span>
            </div>

            {/* Bulk action bar */}
            {selectedSNs.size > 0 && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 flex-wrap">
                <span className="text-xs font-medium text-blue-700">
                  เลือก {selectedSNs.size} รายการ
                </span>
                <div className="flex gap-1.5 ml-auto flex-wrap">
                  <button
                    onClick={() => bulkUpdateSnIsc([...selectedSNs], 1)}
                    className="flex items-center gap-0.5 text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200 whitespace-nowrap"
                  >
                    <Cloud size={11} /> iSC ทั้งหมด
                  </button>
                  <button
                    onClick={() => bulkUpdateSnIsc([...selectedSNs], 0)}
                    className="flex items-center gap-0.5 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 whitespace-nowrap"
                  >
                    <CloudOff size={11} /> ยกเลิก iSC
                  </button>
                  <span className="w-px bg-blue-200 self-stretch" />
                  <button
                    onClick={() => bulkUpdateSnStatus([...selectedSNs], 'done')}
                    className="flex items-center gap-0.5 text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 whitespace-nowrap"
                  >
                    <CheckCircle size={11} /> เสร็จ
                  </button>
                  <button
                    onClick={() => bulkUpdateSnStatus([...selectedSNs], 'issue')}
                    className="flex items-center gap-0.5 text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 whitespace-nowrap"
                  >
                    <AlertTriangle size={11} /> ปัญหา
                  </button>
                  <button
                    onClick={() => bulkUpdateSnStatus([...selectedSNs], 'waiting')}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 whitespace-nowrap"
                  >
                    ยกเลิก
                  </button>
                  <span className="w-px bg-blue-200 self-stretch" />
                  <button
                    onClick={() => setSelectedSNs(new Set())}
                    className="text-xs px-2 py-1 text-blue-400 hover:text-blue-600 whitespace-nowrap"
                  >
                    ✕ ล้าง
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-2 pr-3 w-8">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected }}
                        onChange={toggleSelectAll}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer"
                      />
                    </th>
                    <th className="pb-2 pr-4 text-xs text-gray-400 font-medium">Serial No.</th>
                    <th className="pb-2 pr-4 text-xs text-gray-400 font-medium">Item No.</th>
                    <th className="pb-2 pr-4 text-xs text-gray-400 font-medium">Model</th>
                    <th className="pb-2 pr-4 text-xs text-gray-400 font-medium text-center">iSolarCloud</th>
                    <th className="pb-2 pr-4 text-xs text-gray-400 font-medium">สถานะ</th>
                    <th className="pb-2 text-xs text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tabSNsPage.map(sn => {
                    const serial  = sn[SN_IDX.sn]
                    const snState = snStore[serial] || {}
                    const status  = snState.status || 'waiting'
                    const iscVal  = snState.iscOverride !== undefined
                      ? snState.iscOverride
                      : sn[SN_IDX.isc]
                    const stCfg   = SN_STATUS[status] || SN_STATUS.waiting
                    const isSelected = selectedSNs.has(serial)

                    return (
                      <tr
                        key={serial}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-blue-50'
                            : status === 'issue'
                              ? 'bg-red-50 hover:bg-red-50'
                              : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-2.5 pr-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectSN(serial)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className="font-mono text-xs text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                            {serial}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-xs text-gray-500">{sn[SN_IDX.item]}</td>
                        <td className="py-2.5 pr-4 text-xs font-medium text-gray-700">{getModel(sn[SN_IDX.desc])}</td>
                        <td className="py-2.5 pr-4 text-center">
                          <button
                            onClick={() => toggleSnIsc(serial, iscVal)}
                            title={iscVal ? 'อยู่บน iSC — คลิกเพื่อยกเลิก' : 'ไม่อยู่บน iSC — คลิกเพื่อลงทะเบียน'}
                            className="transition-transform hover:scale-110 active:scale-95"
                          >
                            {iscVal
                              ? <Cloud size={16} className="text-amber-500" />
                              : <CloudOff size={16} className="text-gray-300" />
                            }
                          </button>
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stCfg.badgeCls}`}>
                            {stCfg.label}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <ActionButtons
                            status={status}
                            snSerial={serial}
                            updateSnStatus={updateSnStatus}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalSnPages > 1 && (
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>
                  แสดง {snPage * PAGE_SIZE + 1}–{Math.min((snPage + 1) * PAGE_SIZE, tabSNs.length)} จาก {tabSNs.length}
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={snPage === 0}
                    onClick={() => setSnPage(p => p - 1)}
                    className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    ‹
                  </button>
                  {Array.from({ length: Math.min(totalSnPages, 7) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setSnPage(i)}
                      className={`px-2 py-1 rounded border text-xs ${
                        snPage === i
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    disabled={snPage >= totalSnPages - 1}
                    onClick={() => setSnPage(p => p + 1)}
                    className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatDot({ dot, label, count, textCls = 'text-gray-600' }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
      <span className={textCls}>{label} <strong>{count}</strong></span>
    </div>
  )
}
