import { useState, useMemo, useEffect } from 'react'
import {
  Search, Cloud, Package, ChevronDown, ChevronUp,
  X, Cpu, FolderOpen, Layers, RefreshCw,
} from 'lucide-react'

const TARGET_GROUPS = [
  'M-INVERTER', 'M-OPTIMIZER', 'M-RAPID SHUTDOWN',
  'M-DATA LOGGER', 'M-ENERGY METER', 'M-BATTERY', 'M-ENERGY STORAGE',
]

const GROUP_CONFIG = {
  'M-INVERTER':       { label: 'อินเวอร์เตอร์',  short: 'Inverter',  color: 'bg-blue-100 text-blue-700',    bar: 'bg-blue-500' },
  'M-OPTIMIZER':      { label: 'ออปทิไมเซอร์',   short: 'Optimizer', color: 'bg-purple-100 text-purple-700', bar: 'bg-purple-500' },
  'M-RAPID SHUTDOWN': { label: 'Rapid Shutdown',  short: 'RSD',       color: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500' },
  'M-DATA LOGGER':    { label: 'Data Logger',     short: 'Logger',    color: 'bg-teal-100 text-teal-700',     bar: 'bg-teal-500' },
  'M-ENERGY METER':   { label: 'Energy Meter',    short: 'Meter',     color: 'bg-green-100 text-green-700',   bar: 'bg-green-500' },
  'M-BATTERY':        { label: 'Battery',         short: 'Battery',   color: 'bg-amber-100 text-amber-700',   bar: 'bg-amber-500' },
  'M-ENERGY STORAGE': { label: 'Energy Storage',  short: 'ESS',       color: 'bg-rose-100 text-rose-700',     bar: 'bg-rose-500' },
}

// SN array format: [sn, item, desc, date, isc]
const SN = { sn: 0, item: 1, desc: 2, date: 3, isc: 4 }

export default function SNDatabase() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterISC, setFilterISC] = useState('all')
  const [expandedProject, setExpandedProject] = useState(null)
  const [snPages, setSnPages] = useState({})

  const fetchData = () => {
    setLoading(true); setError(''); setData(null)
    fetch('/sn-data.json')
      .then(r => { if (!r.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ'); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [])

  const filteredProjects = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    return data.projects.filter(p => {
      if (filterGroup !== 'all' && !(p.groups[filterGroup]?.length)) return false
      if (filterISC === 'yes' && p.iscCount === 0) return false
      if (filterISC === 'no' && p.iscCount > 0) return false
      if (q && !p.project.toLowerCase().includes(q) && !p.customer.toLowerCase().includes(q)) return false
      return true
    })
  }, [data, search, filterGroup, filterISC])

  // ---- LOADING ----
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-5">
        <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-700 font-medium text-lg">กำลังโหลดข้อมูล SN...</p>
        <p className="text-gray-400 text-sm">ไฟล์ใหญ่ รอสักครู่</p>
      </div>
    )
  }

  // ---- ERROR ----
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Package size={48} className="text-gray-200" />
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-gray-400 text-sm text-center max-w-sm">
          ไม่พบไฟล์ข้อมูล กรุณาตรวจสอบว่า sn-data.json อยู่ใน public/
        </p>
        <button onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <RefreshCw size={14} /> ลองใหม่
        </button>
      </div>
    )
  }

  const { groupTotals, totalSN } = data
  const totalISC = data.projects.reduce((s, p) => s + p.iscCount, 0)
  const totalProjects = data.projects.length
  const topGroups = TARGET_GROUPS.filter(g => (groupTotals[g] || 0) > 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ฐานข้อมูล SN อุปกรณ์</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {totalSN.toLocaleString()} SN · {totalProjects.toLocaleString()} โครงการ
            <span className="ml-2 text-xs text-gray-300">
              อัพเดต {data.generatedAt ? new Date(data.generatedAt).toLocaleDateString('th-TH') : ''}
            </span>
          </p>
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw size={14} /> รีโหลด
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<FolderOpen size={20} className="text-blue-600" />} bg="bg-blue-50"
          value={totalProjects.toLocaleString()} label="โครงการทั้งหมด" sub="ที่มีอุปกรณ์" />
        <KpiCard icon={<Layers size={20} className="text-gray-600" />} bg="bg-gray-100"
          value={totalSN.toLocaleString()} label="SN ทั้งหมด" sub={`${topGroups.length} ประเภทสินค้า`} />
        <KpiCard icon={<Cpu size={20} className="text-purple-600" />} bg="bg-purple-50"
          value={((groupTotals['M-OPTIMIZER'] || 0) + (groupTotals['M-RAPID SHUTDOWN'] || 0)).toLocaleString()}
          label="Optimizer + RSD" sub="SN รวม" />
        <KpiCard icon={<Cloud size={20} className="text-teal-600" />} bg="bg-teal-50"
          value={totalISC.toLocaleString()} label="iSolarCloud" sub={`${totalSN > 0 ? Math.round(totalISC / totalSN * 100) : 0}% ของทั้งหมด`} />
      </div>

      {/* Device type summary bars */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 text-sm">สรุปตามประเภทสินค้า — คลิกแถบเพื่อกรอง</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {topGroups.map(g => {
            const cfg = GROUP_CONFIG[g]
            const count = groupTotals[g] || 0
            const pct = totalSN > 0 ? Math.round(count / totalSN * 100) : 0
            const active = filterGroup === g
            return (
              <div key={g} className="cursor-pointer" onClick={() => setFilterGroup(active ? 'all' : g)}>
                <div className="flex justify-between text-sm mb-1">
                  <span className={`font-medium ${active ? 'text-blue-700' : 'text-gray-700'}`}>
                    {cfg.label} {active && '✓'}
                  </span>
                  <span className="text-gray-500 text-xs">{count.toLocaleString()} SN ({pct}%)</span>
                </div>
                <div className={`h-2.5 rounded-full overflow-hidden ${active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <div className={`h-full ${cfg.bar} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-52 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ค้นหาชื่อโครงการ, ลูกค้า..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">ทุกประเภทสินค้า</option>
          {TARGET_GROUPS.map(g => <option key={g} value={g}>{GROUP_CONFIG[g].label}</option>)}
        </select>
        <select value={filterISC} onChange={e => setFilterISC(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">iSolarCloud ทั้งหมด</option>
          <option value="yes">มี iSolarCloud</option>
          <option value="no">ยังไม่มี</option>
        </select>
        {(search || filterGroup !== 'all' || filterISC !== 'all') && (
          <button onClick={() => { setSearch(''); setFilterGroup('all'); setFilterISC('all') }}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
            <X size={14} /> ล้าง
          </button>
        )}
        <span className="text-sm text-gray-400 ml-auto">
          {filteredProjects.length.toLocaleString()} โครงการ
        </span>
      </div>

      {/* Project Cards */}
      <div className="space-y-2">
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-20" />
            <p>ไม่พบโครงการที่ตรงกับเงื่อนไข</p>
          </div>
        ) : filteredProjects.map(p => (
          <ProjectCard
            key={p.project}
            p={p}
            filterGroup={filterGroup}
            expanded={expandedProject === p.project}
            onToggle={() => setExpandedProject(expandedProject === p.project ? null : p.project)}
            snPage={snPages[p.project] || 1}
            setSnPage={pg => setSnPages(prev => ({ ...prev, [p.project]: pg }))}
          />
        ))}
      </div>
    </div>
  )
}

const SN_PAGE_SIZE = 50

function ProjectCard({ p, filterGroup, expanded, onToggle, snPage, setSnPage }) {
  const displayGroups = filterGroup === 'all'
    ? TARGET_GROUPS.filter(g => p.groups[g]?.length)
    : TARGET_GROUPS.filter(g => g === filterGroup && p.groups[g]?.length)

  const displaySNs = filterGroup === 'all'
    ? TARGET_GROUPS.flatMap(g => (p.groups[g] || []).map(s => ({ ...s, _group: g })))
    : (p.groups[filterGroup] || []).map(s => ({ ...s, _group: filterGroup }))

  const totalPages = Math.max(1, Math.ceil(displaySNs.length / SN_PAGE_SIZE))
  const safePage = Math.min(snPage, totalPages)
  const pageSNs = displaySNs.slice((safePage - 1) * SN_PAGE_SIZE, safePage * SN_PAGE_SIZE)

  const totalDisplayed = displaySNs.length

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors" onClick={onToggle}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm">
                {p.project === '(ไม่ระบุโครงการ)'
                  ? <span className="text-gray-400 italic font-normal">{p.project}</span>
                  : p.project}
              </span>
              {p.iscCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                  <Cloud size={9} />{p.iscCount} iSolarCloud
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{p.customer}</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {displayGroups.map(g => {
                const cfg = GROUP_CONFIG[g]
                const cnt = p.groups[g]?.length || 0
                return (
                  <span key={g} className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                    {cfg.short} ×{cnt.toLocaleString()}
                  </span>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-xl font-bold text-blue-700">{totalDisplayed.toLocaleString()}</div>
              <div className="text-xs text-gray-400">SN</div>
            </div>
            {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100">
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
              <span>
                แสดง {((safePage - 1) * SN_PAGE_SIZE) + 1}–{Math.min(safePage * SN_PAGE_SIZE, totalDisplayed)} จาก {totalDisplayed.toLocaleString()} SN
              </span>
              <div className="flex gap-1">
                <button disabled={safePage <= 1} onClick={() => setSnPage(safePage - 1)}
                  className="px-2 py-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-100">‹</button>
                <span className="px-2 py-1">{safePage} / {totalPages}</span>
                <button disabled={safePage >= totalPages} onClick={() => setSnPage(safePage + 1)}
                  className="px-2 py-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-100">›</button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-gray-500">
                  <th className="px-5 py-2 font-medium">ประเภท</th>
                  <th className="px-3 py-2 font-medium">Serial Number</th>
                  <th className="px-3 py-2 font-medium">Item No.</th>
                  <th className="px-3 py-2 font-medium">รายละเอียด</th>
                  <th className="px-3 py-2 font-medium">วันส่งมอบ</th>
                  <th className="px-3 py-2 font-medium">iSolarCloud</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageSNs.map((r, i) => {
                  const g = r._group
                  const cfg = GROUP_CONFIG[g] || { short: g, color: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={`${g}-${r[SN.sn]}-${i}`} className="hover:bg-blue-50 transition-colors">
                      <td className="px-5 py-2">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.short}</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-gray-800">{r[SN.sn]}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{r[SN.item]}</td>
                      <td className="px-3 py-2 text-gray-500 max-w-60">
                        <div className="truncate" title={r[SN.desc]}>{r[SN.desc]}</div>
                      </td>
                      <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{r[SN.date] || '—'}</td>
                      <td className="px-3 py-2">
                        {r[SN.isc]
                          ? <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full"><Cloud size={9} />Yes</span>
                          : <span className="text-gray-200">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ icon, bg, value, label, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </div>
  )
}
