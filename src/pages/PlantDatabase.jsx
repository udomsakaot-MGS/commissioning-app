import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Search, Cloud, Package, Zap, X, ChevronLeft, ChevronRight,
  RefreshCw, ChevronDown, ChevronUp, Layers, FolderOpen, Calendar,
} from 'lucide-react'
import { TICKET_PROJECTS } from '../data/ticketData'

// ---- Ticket iSC lookup ----
const TICKET_ISC_MAP = new Map()
TICKET_PROJECTS.forEach(p => {
  if (p.iSolarCloud && p.iSolarCloudName)
    TICKET_ISC_MAP.set(p.iSolarCloudName.trim().toLowerCase(), p)
})

// ---- SN Database constants ----
const DB_GROUPS = [
  'M-INVERTER', 'M-OPTIMIZER', 'M-RAPID SHUTDOWN',
  'M-DATA LOGGER', 'M-ENERGY METER', 'M-BATTERY', 'M-ENERGY STORAGE',
]
const DB_GROUP_CFG = {
  'M-INVERTER':       { short: 'Inverter',  color: 'bg-blue-100 text-blue-700',    bar: 'bg-blue-500' },
  'M-OPTIMIZER':      { short: 'Optimizer', color: 'bg-purple-100 text-purple-700', bar: 'bg-purple-500' },
  'M-RAPID SHUTDOWN': { short: 'RSD',       color: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500' },
  'M-DATA LOGGER':    { short: 'Logger',    color: 'bg-teal-100 text-teal-700',     bar: 'bg-teal-500' },
  'M-ENERGY METER':   { short: 'Meter',     color: 'bg-green-100 text-green-700',   bar: 'bg-green-500' },
  'M-BATTERY':        { short: 'Battery',   color: 'bg-amber-100 text-amber-700',   bar: 'bg-amber-500' },
  'M-ENERGY STORAGE': { short: 'ESS',       color: 'bg-rose-100 text-rose-700',     bar: 'bg-rose-500' },
}
const SN_IDX = { sn: 0, item: 1, desc: 2, date: 3, isc: 4 }
const SN_PAGE_SIZE = 50
const ISC_PAGE_SIZE = 50

// Extract Sungrow model name from desc (everything before first comma)
// e.g. "SG350HX,SUNGROW INVERTER 350HX,..." → "SG350HX"
//      "SG125CX-P2,Sungrow Inverter 125kVA,..." → "SG125CX-P2"
function getModel(desc) {
  if (!desc) return '—'
  return desc.split(',')[0].trim()
}

// Extract detail text after model name
function getDescDetail(desc) {
  if (!desc) return ''
  const idx = desc.indexOf(',')
  return idx >= 0 ? desc.slice(idx + 1).trim() : ''
}

// Normalize date string: convert Thai BE (>2500) → CE
// "2565-08-06" → "2022-08-06"  |  "2025-12-23" → "2025-12-23"
function normalizeDate(dateStr) {
  if (!dateStr) return ''
  const year = parseInt(dateStr.slice(0, 4), 10)
  if (year > 2500) return (year - 543) + dateStr.slice(4)
  return dateStr
}

const MONTH_NAMES = ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                     'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

export default function PlantDatabase() {
  const [tab, setTab] = useState('isc')          // 'isc' | 'db' | 'combined'

  // ISC data
  const [iscData, setIscData] = useState(null)
  const [iscLoading, setIscLoading] = useState(true)
  const [iscError, setIscError] = useState('')

  // SN DB data (lazy)
  const [snData, setSnData] = useState(null)
  const [snLoading, setSnLoading] = useState(false)
  const [snError, setSnError] = useState('')

  // SN lookup map (built once when snData loads)
  const [snMap, setSnMap] = useState(null)

  // ISC view state
  const [iscSearch, setIscSearch] = useState('')
  const [iscFilterSource, setIscFilterSource] = useState('all')
  const [iscFilterTicket, setIscFilterTicket] = useState(false)
  const [iscPage, setIscPage] = useState(1)
  const [iscExpanded, setIscExpanded] = useState(null)

  // SN DB view state
  const [dbSearch, setDbSearch] = useState('')
  const [dbFilterGroup, setDbFilterGroup] = useState('all')
  const [dbFilterISC, setDbFilterISC] = useState('all')
  const [dbExpanded, setDbExpanded] = useState(null)
  const [dbSnPages, setDbSnPages] = useState({})

  // Load iSC on mount
  const loadISC = useCallback(() => {
    setIscLoading(true); setIscError('')
    fetch('/isc-plants.json')
      .then(r => { if (!r.ok) throw new Error('โหลด iSC ไม่สำเร็จ'); return r.json() })
      .then(d => { setIscData(d); setIscLoading(false) })
      .catch(e => { setIscError(e.message); setIscLoading(false) })
  }, [])

  useEffect(() => { loadISC() }, [loadISC])

  // Load SN DB lazily
  const loadSN = useCallback(() => {
    if (snData || snLoading) return
    setSnLoading(true); setSnError('')
    fetch('/sn-data.json')
      .then(r => { if (!r.ok) throw new Error('โหลด SN DB ไม่สำเร็จ'); return r.json() })
      .then(d => {
        // Build SN lookup map
        const map = new Map()
        d.projects.forEach(p => {
          Object.entries(p.groups).forEach(([g, arr]) => {
            arr.forEach(item => {
              map.set(String(item[SN_IDX.sn]).toUpperCase(), { item: item[SN_IDX.item], desc: item[SN_IDX.desc], date: item[SN_IDX.date], isc: item[SN_IDX.isc], group: g })
            })
          })
        })
        setSnData(d); setSnMap(map); setSnLoading(false)
      })
      .catch(e => { setSnError(e.message); setSnLoading(false) })
  }, [snData, snLoading])

  const handleTabChange = (t) => {
    setTab(t)
    if (t === 'db' || t === 'combined') loadSN()
  }

  // Augment iSC plants with ticket info
  const iscPlants = useMemo(() => {
    if (!iscData) return []
    return iscData.plants.map(p => {
      const nl = p.plant.trim().toLowerCase()
      let ticketProject = TICKET_ISC_MAP.get(nl)
      if (!ticketProject) {
        for (const [k, v] of TICKET_ISC_MAP) {
          if (k && (nl.includes(k) || (k.length > 5 && k.includes(nl)))) { ticketProject = v; break }
        }
      }
      return { ...p, ticketProject }
    })
  }, [iscData])

  // KPI (combined)
  const mglobalCount = useMemo(() => iscPlants.filter(p => p.mglobal).length, [iscPlants])
  const ticketCount  = useMemo(() => iscPlants.filter(p => p.ticketProject).length, [iscPlants])

  // ---- Combined reconciliation: union of iSolarCloud plants + MGlobal DB projects ----
  const combined = useMemo(() => {
    // Names of MGlobal projects that are already referenced by some iSC plant
    const matchedProjectNames = new Set()
    iscPlants.forEach(p => (p.dbProjects || []).forEach(n => matchedProjectNames.add(n.trim().toLowerCase())))

    // Rows from the iSolarCloud side (each plant, flagged if also in MGlobal)
    const iscRows = iscPlants.map(p => ({
      key: 'isc-' + p.plant,
      name: p.plant,
      power: p.power || 0,
      date: p.date,
      inISC: true,
      inMGlobal: !!p.mglobal,
      snCount: p.sns ? p.sns.length : 0,
      dbProjects: p.dbProjects || [],
      ticket: !!p.ticketProject,
      source: p.mglobal ? 'both' : 'isc',
    }))

    // Rows from the MGlobal side that no iSC plant referenced (only-MGlobal projects)
    let mgOnlyRows = []
    if (snData) {
      mgOnlyRows = snData.projects
        .filter(pr => pr.project && pr.project !== '(ไม่ระบุโครงการ)'
          && !matchedProjectNames.has(pr.project.trim().toLowerCase()))
        .map(pr => ({
          key: 'mg-' + pr.project,
          name: pr.project,
          customer: pr.customer,
          power: 0,
          date: '',
          inISC: false,
          inMGlobal: true,
          snCount: Object.values(pr.groups).reduce((s, a) => s + a.length, 0),
          iscCount: pr.iscCount || 0,
          dbProjects: [pr.project],
          ticket: false,
          source: 'mglobal',
        }))
    }

    const rows = [...iscRows, ...mgOnlyRows]
    return {
      rows,
      counts: {
        total: rows.length,
        both: rows.filter(r => r.source === 'both').length,
        iscOnly: rows.filter(r => r.source === 'isc').length,
        mglobalOnly: rows.filter(r => r.source === 'mglobal').length,
      },
    }
  }, [iscPlants, snData])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Cloud size={22} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">iSolarCloud & MGlobal</h1>
          </div>
          <p className="text-gray-400 text-sm mt-0.5">ข้อมูลโรงไฟฟ้าจาก iSolarCloud · เทียบกับฐานข้อมูล SN ของ MGlobal</p>
        </div>
        <button onClick={() => tab === 'isc' ? loadISC() : loadSN()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw size={14} /> รีโหลด
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Cloud size={20} className="text-blue-600" />} bg="bg-blue-50"
          value={iscData ? iscData.summary.totalPlants.toLocaleString() : '—'}
          label="iSolarCloud Plants" sub={iscData ? Math.round(iscData.summary.totalPowerKWp / 1000) + ' MWp' : 'กำลังโหลด...'} />
        <KpiCard icon={<Package size={20} className="text-emerald-600" />} bg="bg-emerald-50"
          value={mglobalCount.toLocaleString()}
          label="MGlobal" sub={iscData ? mglobalCount + ' / ' + iscData.summary.totalPlants + ' โรงไฟฟ้า' : '—'} />
        <KpiCard icon={<Layers size={20} className="text-gray-600" />} bg="bg-gray-100"
          value={snData ? snData.totalSN.toLocaleString() : (snLoading ? '...' : '—')}
          label="SN ในฐานข้อมูล" sub={snData ? snData.projects.length + ' โครงการ' : 'คลิก "MGlobal DB" เพื่อโหลด'} />
        <KpiCard icon={<Zap size={20} className="text-orange-600" />} bg="bg-orange-50"
          value={ticketCount.toLocaleString()}
          label="มี Commissioning" sub="บันทึกในระบบ Service" />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <TabBtn active={tab === 'isc'} onClick={() => handleTabChange('isc')}
            icon={<Cloud size={15} />} label="iSolarCloud Plants"
            count={iscData ? iscData.summary.totalPlants : null} />
          <TabBtn active={tab === 'db'} onClick={() => handleTabChange('db')}
            icon={<Layers size={15} />} label="MGlobal DB"
            count={snData ? snData.projects.length : null}
            badge={!snData && !snLoading ? 'โหลดเมื่อคลิก' : snLoading ? 'กำลังโหลด...' : null} />
          <TabBtn active={tab === 'combined'} onClick={() => handleTabChange('combined')}
            icon={<FolderOpen size={15} />} label="รวมข้อมูล (iSC + MGlobal)"
            count={tab === 'combined' && snData ? combined.counts.total : null}
            badge={!snData && !snLoading ? 'รวม 2 Excel' : snLoading ? 'กำลังโหลด...' : null} />
        </div>

        <div className="p-5">
          {tab === 'isc' && (
            <ISCView
              plants={iscPlants} loading={iscLoading} error={iscError}
              snMap={snMap}
              search={iscSearch} setSearch={setIscSearch}
              filterSource={iscFilterSource} setFilterSource={setIscFilterSource}
              filterTicket={iscFilterTicket} setFilterTicket={setIscFilterTicket}
              page={iscPage} setPage={setIscPage}
              expanded={iscExpanded} setExpanded={setIscExpanded}
              onLoadSN={loadSN} snLoading={snLoading}
            />
          )}
          {tab === 'db' && (
            <SNView
              data={snData} loading={snLoading} error={snError}
              search={dbSearch} setSearch={setDbSearch}
              filterGroup={dbFilterGroup} setFilterGroup={setDbFilterGroup}
              filterISC={dbFilterISC} setFilterISC={setDbFilterISC}
              expanded={dbExpanded} setExpanded={setDbExpanded}
              snPages={dbSnPages} setSnPages={setDbSnPages}
            />
          )}
          {tab === 'combined' && (
            <CombinedView data={combined} snReady={!!snData} loading={snLoading} />
          )}
        </div>
      </div>
    </div>
  )
}

// ---- ISC View ----
const KWP_RANGES = [
  { value: 'all',      label: 'ทุกขนาด' },
  { value: 'lt500',    label: '< 500 kWp' },
  { value: '500-2000', label: '500–2,000 kWp' },
  { value: '2k-5k',   label: '2,000–5,000 kWp' },
  { value: 'gt5k',    label: '> 5,000 kWp' },
]

function ISCView({ plants, loading, error, snMap, search, setSearch, filterSource, setFilterSource,
                   filterTicket, setFilterTicket, page, setPage, expanded, setExpanded, onLoadSN, snLoading }) {
  // All hooks must be declared before any conditional return (React rules of hooks)
  const [filterYear, setFilterYear] = useState('all')
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterKwp, setFilterKwp] = useState('all')
  const [filterGroup, setFilterGroup] = useState('all')
  const [filterModel, setFilterModel] = useState('all')

  // Augment each plant with model/group sets derived from snMap (expensive but memoised)
  const plantsAug = useMemo(() => {
    if (!snMap) return plants.map(p => ({ ...p, _models: null, _groups: null }))
    return plants.map(p => {
      const _models = new Set()
      const _groups = new Set()
      p.sns.forEach(sn => {
        const entry = snMap.get(sn.toUpperCase())
        if (entry) {
          _groups.add(entry.group)
          if (entry.group === 'M-INVERTER') _models.add(getModel(entry.desc))
        }
      })
      return { ...p, _models, _groups }
    })
  }, [plants, snMap])

  // Unique CE years from iSC date field (normalize BE → CE)
  const allYears = useMemo(() => {
    const y = new Set()
    plants.forEach(p => { if (p.date) y.add(normalizeDate(p.date).slice(0, 4)) })
    return [...y].sort().reverse()
  }, [plants])

  // Unique months that exist in the currently selected year
  const allMonths = useMemo(() => {
    const m = new Set()
    plants.forEach(p => {
      if (!p.date) return
      const nd = normalizeDate(p.date)
      if (filterYear !== 'all' && !nd.startsWith(filterYear)) return
      m.add(nd.slice(5, 7))
    })
    return [...m].sort()
  }, [plants, filterYear])

  // Unique models (only when snMap loaded)
  const allModels = useMemo(() => {
    if (!snMap) return []
    const m = new Set()
    plantsAug.forEach(p => p._models?.forEach(mo => m.add(mo)))
    return [...m].sort()
  }, [plantsAug, snMap])

  // Unique product groups (only when snMap loaded)
  const allGroups = useMemo(() => {
    if (!snMap) return []
    const g = new Set()
    plantsAug.forEach(p => p._groups?.forEach(gr => g.add(gr)))
    return [...g].filter(gr => DB_GROUP_CFG[gr])
  }, [plantsAug, snMap])

  // Group counts per plant (for chip badges)
  const groupPlantCount = useMemo(() => {
    if (!snMap) return {}
    const cnt = {}
    plantsAug.forEach(p => { p._groups?.forEach(gr => { cnt[gr] = (cnt[gr] || 0) + 1 }) })
    return cnt
  }, [plantsAug, snMap])

  const hasExtraFilter = filterYear !== 'all' || filterMonth !== 'all' || filterKwp !== 'all' || filterGroup !== 'all' || filterModel !== 'all'

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return plantsAug.filter(p => {
      if (filterSource === 'mglobal' && !p.mglobal) return false
      if (filterSource === 'no-mglobal' && p.mglobal) return false
      if (filterTicket && !p.ticketProject) return false
      // Year + Month — compare against CE-normalized date
      if (filterYear !== 'all' || filterMonth !== 'all') {
        const nd = normalizeDate(p.date)
        if (filterYear !== 'all' && !nd.startsWith(filterYear)) return false
        if (filterMonth !== 'all' && nd.slice(5, 7) !== filterMonth) return false
      }
      // kWp range
      if (filterKwp !== 'all') {
        const pw = p.power || 0
        if (filterKwp === 'lt500'    && pw >= 500)                 return false
        if (filterKwp === '500-2000' && (pw < 500 || pw >= 2000))  return false
        if (filterKwp === '2k-5k'   && (pw < 2000 || pw >= 5000)) return false
        if (filterKwp === 'gt5k'    && pw < 5000)                  return false
      }
      // Product group (requires snMap)
      if (snMap && filterGroup !== 'all' && !p._groups?.has(filterGroup)) return false
      // Model (requires snMap)
      if (snMap && filterModel !== 'all' && !p._models?.has(filterModel)) return false
      if (q && !p.plant.toLowerCase().includes(q) && !(p.address||'').toLowerCase().includes(q) &&
          !p.dbProjects.join(' ').toLowerCase().includes(q)) return false
      return true
    })
  }, [plantsAug, search, filterSource, filterTicket, filterYear, filterMonth, filterKwp, filterGroup, filterModel, snMap])

  if (loading) return <LoadingSpinner label="กำลังโหลด iSolarCloud Plants..." />
  if (error) return <ErrorState msg={error} />

  const totalPages = Math.max(1, Math.ceil(filtered.length / ISC_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagePlants = filtered.slice((safePage - 1) * ISC_PAGE_SIZE, safePage * ISC_PAGE_SIZE)

  const setFilter = (fn) => { fn(); setPage(1) }
  const clearAll = () => {
    setSearch(''); setFilterSource('all'); setFilterTicket(false)
    setFilterYear('all'); setFilterMonth('all'); setFilterKwp('all'); setFilterGroup('all'); setFilterModel('all')
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Source legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500 pb-3 border-b border-gray-100">
        <span className="flex items-center gap-1"><Cloud size={11} className="text-blue-500" /> iSolarCloud (หลัก)</span>
        <span className="flex items-center gap-1.5">
          <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">MGlobal</span>
          SN อยู่ในระบบของเรา
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">Service</span>
          มี Commissioning Ticket
        </span>
      </div>

      {/* Row 1: Search + Source + Commissioning */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ค้นหาชื่อโรงไฟฟ้า, ที่อยู่..."
            value={search} onChange={e => setFilter(() => setSearch(e.target.value))} />
        </div>
        <select value={filterSource} onChange={e => setFilter(() => setFilterSource(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">ทุกแหล่ง</option>
          <option value="mglobal">เฉพาะ MGlobal</option>
          <option value="no-mglobal">ไม่มีใน MGlobal</option>
        </select>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 select-none">
          <input type="checkbox" checked={filterTicket} onChange={e => setFilter(() => setFilterTicket(e.target.checked))}
            className="rounded border-gray-300 text-blue-600" />
          มี Commissioning
        </label>
        {(search || filterSource !== 'all' || filterTicket || hasExtraFilter) && (
          <button onClick={clearAll}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
            <X size={12} /> ล้างทั้งหมด
          </button>
        )}
        <span className="text-sm text-gray-400 ml-auto">{filtered.length.toLocaleString()} โรงไฟฟ้า</span>
      </div>

      {/* Row 2: Year + kWp + Product group + Model */}
      <div className="flex flex-wrap gap-2 items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
        {/* Year */}
        <select value={filterYear}
          onChange={e => { setFilterYear(e.target.value); setFilterMonth('all'); setPage(1) }}
          className={`px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${filterYear !== 'all' ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>
          <option value="all">ทุกปี</option>
          {allYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Month — only meaningful when year selected */}
        <select value={filterMonth} onChange={e => setFilter(() => setFilterMonth(e.target.value))}
          className={`px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${filterMonth !== 'all' ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>
          <option value="all">ทุกเดือน</option>
          {allMonths.map(m => (
            <option key={m} value={m}>{MONTH_NAMES[parseInt(m, 10)]} ({m})</option>
          ))}
        </select>

        {/* kWp range */}
        <select value={filterKwp} onChange={e => setFilter(() => setFilterKwp(e.target.value))}
          className={`px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${filterKwp !== 'all' ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>
          {KWP_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>

        <div className="w-px h-5 bg-gray-200" />

        {/* Product group chips */}
        {!snMap ? (
          <span className="text-xs text-gray-400 italic flex items-center gap-1">
            <Layers size={11} /> ประเภทสินค้า / Model — โหลด MGlobal DB เพื่อใช้งาน
          </span>
        ) : (
          <>
            {allGroups.map(g => {
              const cfg = DB_GROUP_CFG[g]
              const active = filterGroup === g
              return (
                <button key={g}
                  onClick={() => setFilter(() => setFilterGroup(active ? 'all' : g))}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border transition-all ${active ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.bar}`} />
                  {cfg.short}
                  <span className={`text-xs ${active ? 'text-blue-500' : 'text-gray-400'}`}>
                    {groupPlantCount[g] || 0}
                  </span>
                </button>
              )
            })}

            <div className="w-px h-5 bg-gray-200" />

            {/* Model dropdown */}
            <select value={filterModel} onChange={e => setFilter(() => setFilterModel(e.target.value))}
              className={`px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${filterModel !== 'all' ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}>
              <option value="all">ทุก Model</option>
              {allModels.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </>
        )}
      </div>

      {/* Pagination */}
      <Pagination page={safePage} totalPages={totalPages} total={filtered.length} pageSize={ISC_PAGE_SIZE} onPage={setPage} />

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium">
            <tr className="text-left">
              <th className="px-4 py-2.5">#</th>
              <th className="px-3 py-2.5">ชื่อโรงไฟฟ้า</th>
              <th className="px-3 py-2.5 text-right">kWp</th>
              <th className="px-3 py-2.5">วันจ่ายไฟ</th>
              <th className="px-3 py-2.5">แหล่งข้อมูล</th>
              <th className="px-3 py-2.5">โครงการใน DB</th>
              <th className="px-2 py-2.5 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {pagePlants.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">ไม่พบโรงไฟฟ้า</td></tr>
            ) : pagePlants.map((p, i) => {
              const rowNum = (safePage - 1) * ISC_PAGE_SIZE + i + 1
              const isExpanded = expanded === (p.plant + i)
              const canExpand = p.mglobal
              return (
                <ISCRow key={p.plant + i} plant={p} rowNum={rowNum}
                  expanded={isExpanded}
                  onToggle={() => {
                    if (canExpand) {
                      if (!snMap) onLoadSN()
                      setExpanded(isExpanded ? null : p.plant + i)
                    }
                  }}
                  canExpand={canExpand} snMap={snMap} snLoading={snLoading} />
              )
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={safePage} totalPages={totalPages} total={filtered.length} pageSize={ISC_PAGE_SIZE} onPage={setPage} compact />
    </div>
  )
}

function ISCRow({ plant: p, rowNum, expanded, onToggle, canExpand, snMap, snLoading }) {
  // Get SN details from snMap
  const snDetails = useMemo(() => {
    if (!expanded || !snMap) return []
    return p.sns
      .map(sn => ({ sn, ...snMap.get(sn.toUpperCase()) }))
      .filter(r => r.group) // only those found in DB
  }, [expanded, snMap, p.sns])

  // SNs from iSC that are NOT in our DB
  const missingSNs = useMemo(() => {
    if (!expanded || !snMap) return []
    return p.sns.filter(sn => !snMap.has(sn.toUpperCase()))
  }, [expanded, snMap, p.sns])

  // Group by device type
  const grouped = useMemo(() => {
    const g = {}
    snDetails.forEach(r => { if (!g[r.group]) g[r.group] = []; g[r.group].push(r) })
    return g
  }, [snDetails])

  return (
    <>
      <tr className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${expanded ? 'bg-blue-50' : ''}`}>
        <td className="px-4 py-2.5 text-xs text-gray-400 tabular-nums">{rowNum.toLocaleString()}</td>
        <td className="px-3 py-2.5">
          <div className="font-medium text-gray-800 leading-snug text-sm">{p.plant}</div>
          {p.address && <div className="text-xs text-gray-400 truncate max-w-72 mt-0.5" title={p.address}>{p.address}</div>}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums text-sm text-gray-700">
          {p.power ? p.power.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—'}
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{normalizeDate(p.date) || '—'}</td>
        <td className="px-3 py-2.5">
          <div className="flex flex-wrap gap-1">
            <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
              <Cloud size={8} />iSC
            </span>
            {p.mglobal && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${p.mglobalPartial ? 'bg-yellow-50 text-yellow-700' : 'bg-emerald-50 text-emerald-700'}`}>
                MGlobal{p.mglobalPartial ? '*' : ''}
              </span>
            )}
            {p.ticketProject && (
              <span className="inline-flex items-center gap-0.5 bg-orange-50 text-orange-700 text-xs px-1.5 py-0.5 rounded-full font-medium">
                <Zap size={8} />Service
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-500 max-w-48">
          {p.dbProjects.slice(0, 2).map((proj, i) => (
            <div key={i} className="truncate text-blue-700" title={proj}>{proj}</div>
          ))}
          {p.dbProjects.length > 2 && <div className="text-gray-400">+{p.dbProjects.length - 2}</div>}
          {p.ticketProject && (
            <div className="text-orange-600 truncate mt-0.5" title={p.ticketProject.project}>✓ {p.ticketProject.project}</div>
          )}
        </td>
        <td className="px-2 py-2.5 text-center">
          {canExpand && (
            <button onClick={onToggle} className="text-gray-400 hover:text-gray-600 p-0.5 rounded">
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-gray-100 bg-blue-50">
          <td colSpan={7} className="px-6 pb-4 pt-2">
            {snLoading && !snMap ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                กำลังโหลด SN database...
              </div>
            ) : snDetails.length === 0 ? (
              <div className="text-sm text-gray-400 py-2">
                {snMap ? 'SN ของโรงไฟฟ้านี้ไม่อยู่ใน SN Database' : 'ไม่พบข้อมูล'}
              </div>
            ) : (
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
                  <Package size={12} />
                  SN ที่ MGlobal จัดหา ({snDetails.length} รายการ) · โรงไฟฟ้า {p.power ? p.power + ' kWp' : ''}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs bg-white rounded-lg overflow-hidden border border-gray-100">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                      <tr>
                        <th className="px-4 py-2 font-medium text-left">ประเภท</th>
                        <th className="px-3 py-2 font-medium text-left">Serial Number</th>
                        <th className="px-3 py-2 font-medium text-left">Model</th>
                        <th className="px-3 py-2 font-medium text-left">รายละเอียด</th>
                        <th className="px-3 py-2 font-medium text-left">วันส่งมอบ</th>
                        <th className="px-3 py-2 font-medium">iSC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {snDetails.map((r, i) => {
                        const cfg = DB_GROUP_CFG[r.group] || { short: r.group, color: 'bg-gray-100 text-gray-600' }
                        return (
                          <tr key={r.sn + i} className="hover:bg-blue-50">
                            <td className="px-4 py-1.5">
                              <span className={`px-1.5 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.short}</span>
                            </td>
                            <td className="px-3 py-1.5 font-mono text-gray-800">{r.sn}</td>
                            <td className="px-3 py-1.5">
                              <div className="font-medium text-gray-800">{getModel(r.desc)}</div>
                              <div className="text-gray-400 text-xs">{r.item}</div>
                            </td>
                            <td className="px-3 py-1.5 text-gray-500 max-w-56 truncate" title={r.desc}>{getDescDetail(r.desc)}</td>
                            <td className="px-3 py-1.5 text-gray-400">{r.date || '—'}</td>
                            <td className="px-3 py-1.5 text-center">
                              {r.isc ? <Cloud size={11} className="text-teal-600 mx-auto" /> : <span className="text-gray-200">—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {/* SNs in iSC but NOT in DB */}
                {missingSNs.length > 0 && (
                  <div className="mt-3 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-xs font-semibold text-yellow-700 mb-1.5">
                      ⚠ {missingSNs.length} SN จาก iSolarCloud ไม่พบในฐานข้อมูล MGlobal:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {missingSNs.map(sn => (
                        <span key={sn} className="font-mono text-xs bg-white border border-yellow-300 text-yellow-800 px-2 py-0.5 rounded">
                          {sn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

// ---- SN DB View ----
function SNView({ data, loading, error, search, setSearch, filterGroup, setFilterGroup,
                  filterISC, setFilterISC, expanded, setExpanded, snPages, setSnPages }) {
  if (loading) return <LoadingSpinner label="กำลังโหลด MGlobal DB (17MB)..." />
  if (error) return <ErrorState msg={error} />
  if (!data) return (
    <div className="text-center py-16 text-gray-400 text-sm">
      <Layers size={40} className="mx-auto mb-3 opacity-20" />
      คลิก tab "MGlobal DB" เพื่อโหลดข้อมูล
    </div>
  )

  const { groupTotals, totalSN } = data

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.projects.filter(p => {
      if (filterGroup !== 'all' && !(p.groups[filterGroup]?.length)) return false
      if (filterISC === 'yes' && p.iscCount === 0) return false
      if (filterISC === 'no' && p.iscCount > 0) return false
      if (q && !p.project.toLowerCase().includes(q) && !p.customer.toLowerCase().includes(q)) return false
      return true
    })
  }, [data, search, filterGroup, filterISC])

  const topGroups = Object.entries(DB_GROUP_CFG).filter(([g]) => (groupTotals[g] || 0) > 0).map(([g]) => g)

  const setFilter = (fn) => { fn() }

  return (
    <div className="space-y-4">
      {/* Mini bar chart */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {topGroups.map(g => {
          const cfg = DB_GROUP_CFG[g]
          const count = groupTotals[g] || 0
          const pct = totalSN > 0 ? Math.round(count / totalSN * 100) : 0
          const active = filterGroup === g
          return (
            <div key={g} className={`p-2.5 rounded-lg border cursor-pointer transition-all ${active ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
              onClick={() => setFilter(() => setFilterGroup(active ? 'all' : g))}>
              <div className={`text-xs font-medium mb-1 ${active ? 'text-blue-700' : 'text-gray-600'}`}>{cfg.short}</div>
              <div className="text-sm font-bold text-gray-800">{count.toLocaleString()}</div>
              <div className={`h-1 rounded-full mt-1 ${active ? 'bg-blue-100' : 'bg-gray-200'}`}>
                <div className={`h-full ${cfg.bar} rounded-full`} style={{ width: `${Math.max(2, pct)}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ค้นหาโครงการ, ลูกค้า..."
            value={search} onChange={e => setFilter(() => setSearch(e.target.value))} />
        </div>
        <select value={filterGroup} onChange={e => setFilter(() => setFilterGroup(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">ทุกประเภท</option>
          {Object.entries(DB_GROUP_CFG).map(([g, c]) => <option key={g} value={g}>{c.short} ({g})</option>)}
        </select>
        <select value={filterISC} onChange={e => setFilter(() => setFilterISC(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">iSolarCloud ทั้งหมด</option>
          <option value="yes">มี iSolarCloud</option>
          <option value="no">ยังไม่มี</option>
        </select>
        {(search || filterGroup !== 'all' || filterISC !== 'all') && (
          <button onClick={() => { setSearch(''); setFilterGroup('all'); setFilterISC('all') }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
            <X size={12} /> ล้าง
          </button>
        )}
        <span className="text-sm text-gray-400 ml-auto">{filteredProjects.length.toLocaleString()} โครงการ</span>
      </div>

      {/* Project list */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">ไม่พบโครงการ</div>
        ) : filteredProjects.map(p => (
          <DBProjectCard key={p.project} p={p} filterGroup={filterGroup}
            expanded={expanded === p.project}
            onToggle={() => setExpanded(expanded === p.project ? null : p.project)}
            snPage={snPages[p.project] || 1}
            setSnPage={pg => setSnPages(prev => ({ ...prev, [p.project]: pg }))} />
        ))}
      </div>
    </div>
  )
}

function DBProjectCard({ p, filterGroup, expanded, onToggle, snPage, setSnPage }) {
  const displayGroups = filterGroup === 'all'
    ? Object.keys(DB_GROUP_CFG).filter(g => p.groups[g]?.length)
    : Object.keys(DB_GROUP_CFG).filter(g => g === filterGroup && p.groups[g]?.length)

  const displaySNs = filterGroup === 'all'
    ? Object.keys(DB_GROUP_CFG).flatMap(g => (p.groups[g] || []).map(s => ({ ...s, _g: g })))
    : (p.groups[filterGroup] || []).map(s => ({ ...s, _g: filterGroup }))

  const totalPages = Math.max(1, Math.ceil(displaySNs.length / SN_PAGE_SIZE))
  const safePage = Math.min(snPage, totalPages)
  const pageSNs = displaySNs.slice((safePage - 1) * SN_PAGE_SIZE, safePage * SN_PAGE_SIZE)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button className="w-full text-left px-4 py-3 hover:bg-gray-50" onClick={onToggle}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 text-sm">
                {p.project === '(ไม่ระบุโครงการ)'
                  ? <span className="text-gray-400 italic font-normal">{p.project}</span>
                  : p.project}
              </span>
              {p.iscCount > 0 && (
                <span className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-full">
                  <Cloud size={9} />{p.iscCount}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{p.customer}</div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {displayGroups.map(g => {
                const cfg = DB_GROUP_CFG[g]
                return (
                  <span key={g} className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${cfg.color}`}>
                    {cfg.short} ×{(p.groups[g]?.length || 0).toLocaleString()}
                  </span>
                )
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <div className="text-lg font-bold text-blue-700">{displaySNs.length.toLocaleString()}</div>
              <div className="text-xs text-gray-400">SN</div>
            </div>
            {expanded ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-gray-100">
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
              <span>แสดง {((safePage-1)*SN_PAGE_SIZE)+1}–{Math.min(safePage*SN_PAGE_SIZE, displaySNs.length)} จาก {displaySNs.length.toLocaleString()}</span>
              <div className="flex gap-1">
                <button disabled={safePage<=1} onClick={()=>setSnPage(safePage-1)} className="px-1.5 py-0.5 rounded border border-gray-200 disabled:opacity-30">‹</button>
                <span className="px-1.5">{safePage}/{totalPages}</span>
                <button disabled={safePage>=totalPages} onClick={()=>setSnPage(safePage+1)} className="px-1.5 py-0.5 rounded border border-gray-200 disabled:opacity-30">›</button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
                <tr>
                  <th className="px-4 py-2 text-left">ประเภท</th>
                  <th className="px-3 py-2 text-left">Serial Number</th>
                  <th className="px-3 py-2 text-left">Model</th>
                  <th className="px-3 py-2 text-left">รายละเอียด</th>
                  <th className="px-3 py-2 text-left">วันส่งมอบ</th>
                  <th className="px-3 py-2">iSC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pageSNs.map((r, i) => {
                  const cfg = DB_GROUP_CFG[r._g] || { short: r._g, color: 'bg-gray-100 text-gray-600' }
                  return (
                    <tr key={`${r._g}-${r[SN_IDX.sn]}-${i}`} className="hover:bg-blue-50">
                      <td className="px-4 py-1.5"><span className={`px-1.5 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.short}</span></td>
                      <td className="px-3 py-1.5 font-mono text-gray-800">{r[SN_IDX.sn]}</td>
                      <td className="px-3 py-1.5">
                        <div className="font-medium text-gray-800">{getModel(r[SN_IDX.desc])}</div>
                        <div className="text-gray-400 text-xs">{r[SN_IDX.item]}</div>
                      </td>
                      <td className="px-3 py-1.5 text-gray-500 max-w-52 truncate" title={r[SN_IDX.desc]}>{getDescDetail(r[SN_IDX.desc])}</td>
                      <td className="px-3 py-1.5 text-gray-400">{r[SN_IDX.date] || '—'}</td>
                      <td className="px-3 py-1.5 text-center">
                        {r[SN_IDX.isc] ? <Cloud size={10} className="text-teal-600 mx-auto" /> : <span className="text-gray-200">—</span>}
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

// ---- Combined View (reconciliation of iSC + MGlobal) ----
const COMBINED_PAGE_SIZE = 50
const SOURCE_CFG = {
  both:    { label: 'ทั้ง iSC + MGlobal', cls: 'bg-emerald-100 text-emerald-700' },
  isc:     { label: 'เฉพาะ iSolarCloud',  cls: 'bg-blue-100 text-blue-700' },
  mglobal: { label: 'เฉพาะ MGlobal',       cls: 'bg-amber-100 text-amber-700' },
}

function CombinedView({ data, snReady, loading }) {
  const [search, setSearch] = useState('')
  const [filterSource, setFilterSource] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.rows.filter(r => {
      if (filterSource !== 'all' && r.source !== filterSource) return false
      if (q && !r.name.toLowerCase().includes(q) &&
          !(r.customer || '').toLowerCase().includes(q) &&
          !r.dbProjects.join(' ').toLowerCase().includes(q)) return false
      return true
    }).sort((a, b) => (b.power || 0) - (a.power || 0) || a.name.localeCompare(b.name))
  }, [data.rows, search, filterSource])

  const setF = (fn) => { fn(); setPage(1) }

  if (loading && !snReady) return <LoadingSpinner label="กำลังรวมข้อมูล 2 Excel (iSC + MGlobal DB)..." />

  const c = data.counts
  const totalPages = Math.max(1, Math.ceil(filtered.length / COMBINED_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * COMBINED_PAGE_SIZE, safePage * COMBINED_PAGE_SIZE)

  return (
    <div className="space-y-4">
      {!snReady && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          กำลังรอโหลด MGlobal DB — โครงการที่อยู่เฉพาะใน MGlobal จะแสดงเมื่อโหลดเสร็จ
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <CombinedStat label="รวมทั้งหมด"        value={c.total}       cls="text-gray-800"   onClick={() => setF(() => setFilterSource('all'))}     active={filterSource === 'all'} />
        <CombinedStat label="ทั้ง iSC + MGlobal" value={c.both}        cls="text-emerald-600" onClick={() => setF(() => setFilterSource('both'))}    active={filterSource === 'both'} />
        <CombinedStat label="เฉพาะ iSolarCloud"  value={c.iscOnly}     cls="text-blue-600"    onClick={() => setF(() => setFilterSource('isc'))}     active={filterSource === 'isc'} />
        <CombinedStat label="เฉพาะ MGlobal"       value={c.mglobalOnly} cls="text-amber-600"   onClick={() => setF(() => setFilterSource('mglobal'))} active={filterSource === 'mglobal'} />
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ค้นหาชื่อโรงไฟฟ้า / โครงการ / ลูกค้า..."
            value={search} onChange={e => setF(() => setSearch(e.target.value))} />
        </div>
        <select value={filterSource} onChange={e => setF(() => setFilterSource(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">ทุกแหล่ง</option>
          <option value="both">ทั้ง iSC + MGlobal</option>
          <option value="isc">เฉพาะ iSolarCloud</option>
          <option value="mglobal">เฉพาะ MGlobal</option>
        </select>
        <span className="text-sm text-gray-400 ml-auto">{filtered.length.toLocaleString()} รายการ</span>
      </div>

      <Pagination page={safePage} totalPages={totalPages} total={filtered.length} pageSize={COMBINED_PAGE_SIZE} onPage={setPage} />

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 font-medium text-left">
            <tr>
              <th className="px-4 py-2.5">#</th>
              <th className="px-3 py-2.5">ชื่อ / โครงการ</th>
              <th className="px-3 py-2.5 text-right">kWp</th>
              <th className="px-3 py-2.5">วันจ่ายไฟ</th>
              <th className="px-3 py-2.5">แหล่งข้อมูล</th>
              <th className="px-3 py-2.5 text-right">SN</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">ไม่พบข้อมูล</td></tr>
            ) : pageRows.map((r, i) => {
              const cfg = SOURCE_CFG[r.source]
              return (
                <tr key={r.key} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-400 tabular-nums">{(safePage - 1) * COMBINED_PAGE_SIZE + i + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-gray-800 leading-snug">{r.name}</div>
                    {r.customer && <div className="text-xs text-gray-400 truncate max-w-64">{r.customer}</div>}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                    {r.power ? r.power.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap">{normalizeDate(r.date) || '—'}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${cfg.cls}`}>{cfg.label}</span>
                      {r.ticket && (
                        <span className="inline-flex items-center gap-0.5 bg-orange-50 text-orange-700 text-xs px-1.5 py-0.5 rounded-full font-medium">
                          <Zap size={8} />Service
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-600">{r.snCount ? r.snCount.toLocaleString() : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={safePage} totalPages={totalPages} total={filtered.length} pageSize={COMBINED_PAGE_SIZE} onPage={setPage} compact />
    </div>
  )
}

function CombinedStat({ label, value, cls, onClick, active }) {
  return (
    <button onClick={onClick}
      className={`text-left rounded-xl border p-4 transition-all ${active ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}>
      <div className={`text-2xl font-bold ${cls}`}>{value.toLocaleString()}</div>
      <div className="text-sm font-medium text-gray-600 mt-0.5">{label}</div>
    </button>
  )
}

// ---- Shared components ----
function TabBtn({ active, onClick, icon, label, count, badge }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
        active ? 'border-blue-600 text-blue-700 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}>
      {icon}
      {label}
      {count != null && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
          {count.toLocaleString()}
        </span>
      )}
      {badge && <span className="text-xs text-gray-400 font-normal">({badge})</span>}
    </button>
  )
}

function Pagination({ page, totalPages, total, pageSize, onPage, compact }) {
  if (totalPages <= 1) return null
  return (
    <div className={`flex items-center justify-between text-xs text-gray-500 ${compact ? 'pt-2' : ''}`}>
      <span>{((page-1)*pageSize)+1}–{Math.min(page*pageSize, total)} จาก {total.toLocaleString()}</span>
      <div className="flex items-center gap-1">
        <button disabled={page<=1} onClick={()=>onPage(1)} className="px-1.5 py-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50">«</button>
        <button disabled={page<=1} onClick={()=>onPage(page-1)} className="p-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"><ChevronLeft size={12}/></button>
        <span className="px-2">{page} / {totalPages}</span>
        <button disabled={page>=totalPages} onClick={()=>onPage(page+1)} className="p-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"><ChevronRight size={12}/></button>
        <button disabled={page>=totalPages} onClick={()=>onPage(totalPages)} className="px-1.5 py-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50">»</button>
      </div>
    </div>
  )
}

function LoadingSpinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-3">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">{label}</p>
    </div>
  )
}

function ErrorState({ msg }) {
  return (
    <div className="text-center py-12 text-red-500 text-sm">{msg}</div>
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
