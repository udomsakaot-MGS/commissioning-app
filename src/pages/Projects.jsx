import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronRight, Cloud, Loader2, ChevronLeft, FolderOpen, ScanSearch, CloudOff } from 'lucide-react'

const SN_IDX = { sn: 0, item: 1, desc: 2, date: 3, isc: 4 }

// Completion cutoff: deliveries on/before this date are treated as fully commissioned
const COMPLETE_CUTOFF = '2026-07-31'

function getModel(desc) {
  if (!desc) return '—'
  return String(desc).split(',')[0].trim()
}

const GROUP_CONFIG = {
  'M-INVERTER':       { label: 'Inverter',      chipCls: 'bg-blue-100 text-blue-700 border-blue-200'        },
  'M-OPTIMIZER':      { label: 'Optimizer',      chipCls: 'bg-purple-100 text-purple-700 border-purple-200'  },
  'M-RAPID SHUTDOWN': { label: 'Rapid Shutdown', chipCls: 'bg-orange-100 text-orange-700 border-orange-200'  },
  'M-DATA LOGGER':    { label: 'Data Logger',    chipCls: 'bg-teal-100 text-teal-700 border-teal-200'        },
  'M-ENERGY METER':   { label: 'Energy Meter',   chipCls: 'bg-green-100 text-green-700 border-green-200'     },
  'M-BATTERY':        { label: 'Battery',        chipCls: 'bg-yellow-100 text-yellow-700 border-yellow-200'  },
  'M-ENERGY STORAGE': { label: 'Energy Storage', chipCls: 'bg-rose-100 text-rose-700 border-rose-200'        },
}

const SERVICE_STATUS = {
  unset:       { label: 'ยังไม่ระบุ',             badgeCls: 'bg-gray-100 text-gray-500 border-gray-200'   },
  waiting:     { label: 'รอ Commissioning',        badgeCls: 'bg-amber-100 text-amber-700 border-amber-200' },
  in_progress: { label: 'กำลังดำเนินการ',          badgeCls: 'bg-blue-100 text-blue-700 border-blue-200'   },
  done:        { label: 'Commissioning เสร็จแล้ว', badgeCls: 'bg-green-100 text-green-700 border-green-200' },
  not_service: { label: 'ไม่ใช่ขอบเขต Service',   badgeCls: 'bg-gray-100 text-gray-400 border-gray-200'   },
}

const STATUS_FILTER_OPTIONS = [
  { value: 'all',         label: 'ทั้งหมด' },
  { value: 'done_isc',    label: 'เสร็จ · มี iSC' },
  { value: 'done_noisc',  label: 'เสร็จ · ไม่มี iSC' },
  { value: 'waiting',     label: 'รอ Commissioning' },
  { value: 'in_progress', label: 'กำลังดำเนินการ' },
  { value: 'not_service', label: 'ไม่ใช่ขอบเขต' },
  { value: 'unset',       label: 'ยังไม่ระบุ' },
]

// Resolve whether a project matches a (possibly virtual) status filter
function matchesStatusFilter(project, filter, annotations) {
  if (filter === 'all') return true
  const st = getEffectiveStatus(project, annotations)
  if (filter === 'done_isc')   return st === 'done' && projectHasISC(project)
  if (filter === 'done_noisc') return st === 'done' && !projectHasISC(project)
  return st === filter
}

const PAGE_SIZE = 30
const STORAGE_KEY = 'commissioning_project_data'

function getLatestDate(project) {
  let latest = ''
  Object.values(project.groups).forEach(sns => {
    sns.forEach(sn => {
      const d = sn[SN_IDX.date]
      if (d && d > latest) latest = d
    })
  })
  return latest
}

function getInverterStats(project) {
  const inv = project.groups['M-INVERTER'] || []
  return { total: inv.length, onIsc: inv.filter(sn => sn[SN_IDX.isc] === 1).length }
}

// A project "has iSolarCloud" if at least one of its inverters reports to iSC
function projectHasISC(project) {
  return project._invStats.onIsc > 0
}

function getAutoStatus(project) {
  // Rule: any project delivered on/before the cutoff (July 2026) is considered
  // fully commissioned — the site work is done regardless of iSC coverage.
  const latest = project._latestDate ? project._latestDate.slice(0, 10) : ''
  if (latest && latest <= COMPLETE_CUTOFF) return 'done'
  // Otherwise, full iSC coverage on inverters also implies done.
  const s = project._invStats
  if (s.total > 0 && s.onIsc === s.total) return 'done'
  return 'unset'
}

function getEffectiveStatus(project, annotations) {
  const manual = annotations?.[project._key]?.status
  if (manual && manual !== 'unset') return manual
  return getAutoStatus(project)
}

function loadAnnotations() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-xl border p-4 text-left transition-all w-full ${
        active ? 'border-blue-400 ring-2 ring-blue-100 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </button>
  )
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, annotation, effectiveStatus, onNavigate }) {
  const sCfg = SERVICE_STATUS[effectiveStatus]
  const isAutoDone = effectiveStatus === 'done' && (!annotation?.status || annotation.status === 'unset')
  const { total: invTotal, onIsc: invOnIsc } = project._invStats
  const invPct = invTotal > 0 ? Math.round((invOnIsc / invTotal) * 100) : 0
  const hasISC = invOnIsc > 0

  const groupSummary = Object.entries(project.groups)
    .filter(([, sns]) => sns.length > 0)
    .sort(([a], [b]) => {
      const order = ['M-INVERTER','M-OPTIMIZER','M-RAPID SHUTDOWN','M-DATA LOGGER','M-ENERGY METER','M-BATTERY','M-ENERGY STORAGE']
      return order.indexOf(a) - order.indexOf(b)
    })

  return (
    <div
      onClick={onNavigate}
      className="bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-blue-100 cursor-pointer transition-all"
    >
      <div className="p-4">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {/* Status + auto-done hint */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sCfg.badgeCls}`}>
                {sCfg.label}
              </span>
              {effectiveStatus === 'done' && (
                hasISC ? (
                  <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
                    <Cloud size={10} /> มี iSC
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                    <CloudOff size={10} /> ไม่มี iSC
                  </span>
                )
              )}
              {isAutoDone && invTotal > 0 && (
                <span className="text-xs text-gray-400 font-mono">iSC {invOnIsc}/{invTotal}</span>
              )}
              {annotation?.commDate && (
                <span className="text-xs text-gray-400 font-mono">{annotation.commDate}</span>
              )}
            </div>

            <div className="font-semibold text-gray-900 text-sm leading-snug">{project.project}</div>
            <div className="text-xs text-gray-500 mt-0.5 truncate">{project.customer}</div>

            {/* Product group chips */}
            <div className="flex flex-wrap gap-1 mt-2">
              {groupSummary.map(([g, sns]) => {
                const cfg = GROUP_CONFIG[g] || { label: g, chipCls: 'bg-gray-100 text-gray-600 border-gray-200' }
                return (
                  <span key={g} className={`text-xs px-2 py-0.5 rounded border font-medium ${cfg.chipCls}`}>
                    {cfg.label}: {sns.length.toLocaleString()}
                  </span>
                )
              })}
            </div>

            {/* Inverter iSC progress bar */}
            {invTotal > 0 && (
              <div className="mt-2.5">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Cloud size={11} />
                    Inverter บน iSC
                  </span>
                  <span>{invOnIsc}/{invTotal}</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${invPct === 100 ? 'bg-green-400' : invPct > 0 ? 'bg-blue-400' : 'bg-gray-200'}`}
                    style={{ width: invPct === 0 ? '0%' : `${Math.max(invPct, 2)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>{project.total.toLocaleString()} SN รวม</span>
              {project._latestDate && <span>ส่งมอบ: {project._latestDate.slice(0, 10)}</span>}
            </div>

            {annotation?.note && (
              <div className="mt-1.5 text-xs text-gray-500 italic border-l-2 border-gray-200 pl-2 truncate">
                {annotation.note}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 self-center ml-1">
            <ChevronRight size={16} className="text-gray-300" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Projects() {
  const navigate = useNavigate()
  const [view, setView] = useState('projects') // 'projects' | 'sn'
  const [snData, setSnData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [annotations, setAnnotations] = useState(loadAnnotations)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    fetch('/sn-data.json')
      .then(r => r.json())
      .then(d => setSnData(d))
      .finally(() => setLoading(false))
  }, [])

  const projects = useMemo(() => {
    if (!snData) return []
    return snData.projects.map((p, i) => ({
      ...p,
      _key: `${p.project}__${p.customer}`,
      _idx: i,
      _invStats: getInverterStats(p),
      _latestDate: getLatestDate(p),
    }))
  }, [snData])

  const kpi = useMemo(() => {
    const counts = {
      total: projects.length,
      unset: 0, waiting: 0, in_progress: 0, done: 0, not_service: 0,
      done_isc: 0, done_noisc: 0,
    }
    projects.forEach(p => {
      const st = getEffectiveStatus(p, annotations)
      counts[st] = (counts[st] || 0) + 1
      if (st === 'done') {
        if (projectHasISC(p)) counts.done_isc += 1
        else counts.done_noisc += 1
      }
    })
    return counts
  }, [projects, annotations])

  const filtered = useMemo(() => {
    let list = projects
    if (statusFilter !== 'all') {
      list = list.filter(p => matchesStatusFilter(p, statusFilter, annotations))
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(p =>
        p.project.toLowerCase().includes(q) || p.customer.toLowerCase().includes(q)
      )
    }
    return list.slice().sort((a, b) => b._latestDate.localeCompare(a._latestDate))
  }, [projects, statusFilter, search, annotations])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageProjects = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleStatusFilter(v) { setStatusFilter(v); setPage(1) }
  function handleSearch(v) { setSearch(v); setPage(1) }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">โครงการ SN</h1>
        <p className="text-gray-500 text-sm mt-1">
          สินค้าที่ส่งไปหน้างานจาก MGlobal — ระบุสถานะ Commissioning แต่ละโครงการ
        </p>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <TabButton active={view === 'projects'} onClick={() => setView('projects')}
          icon={<FolderOpen size={15} />} label="โครงการ" count={snData ? projects.length : null} />
        <TabButton active={view === 'sn'} onClick={() => setView('sn')}
          icon={<ScanSearch size={15} />} label="ค้นหา SN" />
      </div>

      {view === 'sn' && (
        <SNSearchPanel projects={projects} loading={loading} onNavigate={i => navigate(`/projects/${i}`)} />
      )}

      {view === 'projects' && <>
      {/* KPI */}
      {snData ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="ทั้งหมด"          value={kpi.total}       sub="โครงการใน MGlobal DB"   color="text-blue-700"  onClick={() => handleStatusFilter('all')}         active={statusFilter === 'all'} />
          <KpiCard label="เสร็จ · มี iSC"    value={kpi.done_isc}    sub="ขึ้นโครงการ + iSolarCloud" color="text-green-600" onClick={() => handleStatusFilter('done_isc')}   active={statusFilter === 'done_isc'} />
          <KpiCard label="เสร็จ · ไม่มี iSC" value={kpi.done_noisc}  sub="ขึ้นโครงการ ไม่มี iSC"   color="text-teal-600"  onClick={() => handleStatusFilter('done_noisc')} active={statusFilter === 'done_noisc'} />
          <KpiCard label="รอ Commissioning"  value={kpi.waiting}     sub="ระบุโดย Service"         color="text-amber-600" onClick={() => handleStatusFilter('waiting')}     active={statusFilter === 'waiting'} />
          <KpiCard label="กำลังดำเนินการ"   value={kpi.in_progress} sub=""                        color="text-blue-600"  onClick={() => handleStatusFilter('in_progress')} active={statusFilter === 'in_progress'} />
          <KpiCard label="ยังไม่ระบุ"        value={kpi.unset}       sub="รอ Service ระบุสถานะ"   color="text-gray-400"  onClick={() => handleStatusFilter('unset')}       active={statusFilter === 'unset'} />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาโครงการ หรือ ลูกค้า..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTER_OPTIONS.map(opt => {
            const cnt = opt.value === 'all' ? kpi.total : (kpi[opt.value] ?? 0)
            return (
              <button
                key={opt.value}
                onClick={() => handleStatusFilter(opt.value)}
                disabled={!snData}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
                {snData && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    statusFilter === opt.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {cnt}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-gray-500">
          <Loader2 size={22} className="animate-spin text-blue-500" />
          <span>กำลังโหลดข้อมูล MGlobal...</span>
        </div>
      )}

      {/* Empty */}
      {!loading && snData && filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <Search size={40} className="mx-auto mb-3 opacity-40" />
          <p>ไม่พบโครงการที่ตรงกับเงื่อนไข</p>
        </div>
      )}

      {/* Pagination info */}
      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            แสดง {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} จาก {filtered.length} โครงการ
          </span>
          <Pagination page={page} totalPages={totalPages} onPage={p => setPage(p)} />
        </div>
      )}

      {/* Cards */}
      {!loading && pageProjects.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pageProjects.map(proj => (
            <ProjectCard
              key={proj._idx}
              project={proj}
              annotation={annotations[proj._key]}
              effectiveStatus={getEffectiveStatus(proj, annotations)}
              onNavigate={() => navigate(`/projects/${proj._idx}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination bottom */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div className="flex justify-center pt-2">
          <Pagination page={page} totalPages={totalPages} onPage={p => { setPage(p); window.scrollTo(0, 0) }} />
        </div>
      )}
      </>}
    </div>
  )
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabButton({ active, onClick, icon, label, count }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}>
      {icon}
      {label}
      {count != null && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
          {count.toLocaleString()}
        </span>
      )}
    </button>
  )
}

// ─── SN Search Panel ──────────────────────────────────────────────────────────
const SN_RESULT_LIMIT = 200

function SNSearchPanel({ projects, loading, onNavigate }) {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()

  const results = useMemo(() => {
    if (query.length < 2) return { rows: [], truncated: false }
    const rows = []
    for (const p of projects) {
      for (const [group, arr] of Object.entries(p.groups)) {
        for (const sn of arr) {
          const snStr = String(sn[SN_IDX.sn] || '')
          const item = String(sn[SN_IDX.item] || '')
          const desc = String(sn[SN_IDX.desc] || '')
          if (
            snStr.toLowerCase().includes(query) ||
            item.toLowerCase().includes(query) ||
            desc.toLowerCase().includes(query)
          ) {
            rows.push({
              sn: snStr,
              item,
              model: getModel(desc),
              group,
              date: sn[SN_IDX.date],
              isc: sn[SN_IDX.isc] === 1,
              project: p.project,
              customer: p.customer,
              idx: p._idx,
            })
            if (rows.length >= SN_RESULT_LIMIT) return { rows, truncated: true }
          }
        }
      }
    }
    return { rows, truncated: false }
  }, [projects, query])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          autoFocus
          placeholder="ค้นหา Serial Number, Item หรือ Model (อย่างน้อย 2 ตัวอักษร)..."
          value={q}
          onChange={e => setQ(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
          <Loader2 size={20} className="animate-spin text-blue-500" />
          <span>กำลังโหลดข้อมูล SN...</span>
        </div>
      )}

      {!loading && query.length < 2 && (
        <div className="text-center py-16 text-gray-400">
          <ScanSearch size={40} className="mx-auto mb-3 opacity-40" />
          <p>พิมพ์ Serial Number หรือ Model เพื่อค้นหาข้ามทุกโครงการ</p>
        </div>
      )}

      {!loading && query.length >= 2 && results.rows.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Search size={40} className="mx-auto mb-3 opacity-40" />
          <p>ไม่พบ SN ที่ตรงกับ "{q}"</p>
        </div>
      )}

      {!loading && results.rows.length > 0 && (
        <>
          <div className="text-sm text-gray-500">
            พบ {results.rows.length.toLocaleString()} รายการ
            {results.truncated && <span className="text-amber-600"> (แสดง {SN_RESULT_LIMIT} รายการแรก — พิมพ์ให้เจาะจงขึ้น)</span>}
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium text-left">
                <tr>
                  <th className="px-3 py-2.5">Serial Number</th>
                  <th className="px-3 py-2.5">Model / Item</th>
                  <th className="px-3 py-2.5">ประเภท</th>
                  <th className="px-3 py-2.5">โครงการ</th>
                  <th className="px-3 py-2.5">ส่งมอบ</th>
                  <th className="px-3 py-2.5 text-center">iSC</th>
                  <th className="px-2 py-2.5 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {results.rows.map((r, i) => {
                  const cfg = GROUP_CONFIG[r.group] || { label: r.group, chipCls: 'bg-gray-100 text-gray-600 border-gray-200' }
                  return (
                    <tr key={r.sn + i} onClick={() => onNavigate(r.idx)}
                      className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors">
                      <td className="px-3 py-2 font-mono text-gray-800">{r.sn}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-800">{r.model}</div>
                        <div className="text-xs text-gray-400">{r.item}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${cfg.chipCls}`}>{cfg.label}</span>
                      </td>
                      <td className="px-3 py-2 max-w-56">
                        <div className="text-gray-700 truncate" title={r.project}>{r.project}</div>
                        <div className="text-xs text-gray-400 truncate" title={r.customer}>{r.customer}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">{r.date ? r.date.slice(0, 10) : '—'}</td>
                      <td className="px-3 py-2 text-center">
                        {r.isc ? <Cloud size={13} className="text-teal-600 mx-auto" /> : <CloudOff size={13} className="text-gray-300 mx-auto" />}
                      </td>
                      <td className="px-2 py-2 text-center"><ChevronRight size={14} className="text-gray-300" /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Pagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null
  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onPage(page - 1)} disabled={page === 1}
        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
        <ChevronLeft size={16} />
      </button>
      {start > 1 && <>
        <button onClick={() => onPage(1)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">1</button>
        {start > 2 && <span className="text-gray-400 px-1">…</span>}
      </>}
      {pages.map(p => (
        <button key={p} onClick={() => onPage(p)}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
            p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}>
          {p}
        </button>
      ))}
      {end < totalPages && <>
        {end < totalPages - 1 && <span className="text-gray-400 px-1">…</span>}
        <button onClick={() => onPage(totalPages)} className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">{totalPages}</button>
      </>}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed">
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
