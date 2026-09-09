import { useState, useMemo, useEffect } from 'react'
import { Search, Cloud, Zap, Calendar, X, ChevronLeft, ChevronRight, RefreshCw, Package } from 'lucide-react'
import { TICKET_PROJECTS } from '../data/ticketData'

// Build iSolarCloud name → ticket project lookup at module level
const TICKET_ISC_MAP = new Map()
TICKET_PROJECTS.forEach(p => {
  if (p.iSolarCloud && p.iSolarCloudName) {
    TICKET_ISC_MAP.set(p.iSolarCloudName.trim().toLowerCase(), p)
  }
})

const PAGE_SIZE = 50

export default function ISCPlants() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [filterSource, setFilterSource] = useState('all') // all | mglobal | no-mglobal
  const [filterTicket, setFilterTicket] = useState(false)
  const [page, setPage] = useState(1)

  const fetchData = () => {
    setLoading(true); setError('')
    fetch('/isc-plants.json')
      .then(r => { if (!r.ok) throw new Error('โหลดไม่สำเร็จ'); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [])

  // Augment with ticket info at runtime
  const plants = useMemo(() => {
    if (!data) return []
    return data.plants.map(p => {
      const nameLower = p.plant.trim().toLowerCase()
      // Direct match or partial match on ticket iSC name
      let ticketProject = TICKET_ISC_MAP.get(nameLower)
      if (!ticketProject) {
        for (const [k, v] of TICKET_ISC_MAP) {
          if (k && nameLower.includes(k) || (k && k.length > 5 && k.includes(nameLower))) {
            ticketProject = v; break
          }
        }
      }
      return { ...p, ticketProject }
    })
  }, [data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return plants.filter(p => {
      if (filterSource === 'mglobal' && !p.mglobal) return false
      if (filterSource === 'no-mglobal' && p.mglobal) return false
      if (filterTicket && !p.ticketProject) return false
      if (q && !p.plant.toLowerCase().includes(q) && !p.address.toLowerCase().includes(q) &&
          !p.dbProjects.join(' ').toLowerCase().includes(q)) return false
      return true
    })
  }, [plants, search, filterSource, filterTicket])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagePlants = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Reset page on filter change
  const setFilter = (fn) => { fn(); setPage(1) }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">กำลังโหลด iSolarCloud Plants...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Package size={40} className="text-gray-200" />
        <p className="text-red-600">{error}</p>
        <button onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <RefreshCw size={14} /> ลองใหม่
        </button>
      </div>
    )
  }

  const { summary } = data
  const mglobalPlants = plants.filter(p => p.mglobal).length
  const ticketPlants = plants.filter(p => p.ticketProject).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Cloud size={22} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">iSolarCloud Plants</h1>
          </div>
          <p className="text-gray-400 text-sm mt-0.5">
            {summary.totalPlants.toLocaleString()} โรงไฟฟ้า · {Math.round(summary.totalPowerKWp / 1000)} MWp ·
            อัพเดต {data.generatedAt ? new Date(data.generatedAt).toLocaleDateString('th-TH') : ''}
          </p>
        </div>
        <button onClick={fetchData}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw size={14} /> รีโหลด
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard value={summary.totalPlants.toLocaleString()} label="โรงไฟฟ้าทั้งหมด"
          sub="ใน iSolarCloud" color="bg-blue-50" textColor="text-blue-600"
          icon={<Cloud size={20} className="text-blue-600" />} />
        <KpiCard value={mglobalPlants.toLocaleString()} label="MGlobal"
          sub={`${Math.round(mglobalPlants / summary.totalPlants * 100)}% ที่เราจัดหา`}
          color="bg-emerald-50" textColor="text-emerald-700"
          icon={<Package size={20} className="text-emerald-600" />} />
        <KpiCard value={ticketPlants.toLocaleString()} label="มี Commissioning"
          sub="บันทึกใน Service Ticket"
          color="bg-orange-50" textColor="text-orange-700"
          icon={<Zap size={20} className="text-orange-600" />} />
        <KpiCard value={Math.round(summary.totalPowerKWp / 1000) + ' MWp'} label="กำลังติดตั้งรวม"
          sub={`${summary.totalSNs.toLocaleString()} อินเวอร์เตอร์`}
          color="bg-purple-50" textColor="text-purple-700"
          icon={<Calendar size={20} className="text-purple-600" />} />
      </div>

      {/* Source legend */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 flex flex-wrap gap-4 text-sm text-gray-600">
        <span className="font-medium text-gray-700">แหล่งข้อมูล:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <Cloud size={12} className="text-blue-500" /> iSolarCloud (หลัก)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">MGlobal</span>
          อยู่ในระบบ SN ของเรา (เราจัดหาอุปกรณ์)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">Service</span>
          มี Commissioning Ticket ในระบบ
        </span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ค้นหาชื่อโรงไฟฟ้า, ที่อยู่, โครงการ..."
            value={search} onChange={e => setFilter(() => setSearch(e.target.value))} />
        </div>
        <select value={filterSource}
          onChange={e => setFilter(() => setFilterSource(e.target.value))}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">แหล่งข้อมูลทั้งหมด</option>
          <option value="mglobal">เฉพาะ MGlobal</option>
          <option value="no-mglobal">ไม่มีใน MGlobal</option>
        </select>
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600">
          <input type="checkbox" checked={filterTicket}
            onChange={e => setFilter(() => setFilterTicket(e.target.checked))}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          มี Commissioning
        </label>
        {(search || filterSource !== 'all' || filterTicket) && (
          <button onClick={() => { setSearch(''); setFilterSource('all'); setFilterTicket(false); setPage(1) }}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
            <X size={14} /> ล้าง
          </button>
        )}
        <span className="text-sm text-gray-400 ml-auto">{filtered.length.toLocaleString()} โรงไฟฟ้า</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Pagination top */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 text-sm text-gray-500">
            <span>แสดง {((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} จาก {filtered.length.toLocaleString()}</span>
            <div className="flex items-center gap-1">
              <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}
                className="p-1.5 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50">
                <ChevronLeft size={14} />
              </button>
              <span className="px-3">{safePage} / {totalPages}</span>
              <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}
                className="p-1.5 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-500 font-medium">
                <th className="px-5 py-3">#</th>
                <th className="px-3 py-3">ชื่อโรงไฟฟ้า (iSolarCloud)</th>
                <th className="px-3 py-3 text-right">กำลัง (kWp)</th>
                <th className="px-3 py-3">วันจ่ายไฟ</th>
                <th className="px-3 py-3">อินเวอร์เตอร์</th>
                <th className="px-3 py-3">แหล่งข้อมูล</th>
                <th className="px-3 py-3">โครงการใน DB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pagePlants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    <Package size={32} className="mx-auto mb-2 opacity-20" />
                    ไม่พบโรงไฟฟ้าที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : pagePlants.map((p, i) => (
                <PlantRow key={p.plant + i} plant={p} rowNum={(safePage - 1) * PAGE_SIZE + i + 1} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination bottom */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end px-5 py-3 border-t border-gray-100 gap-1">
            <button disabled={safePage <= 1} onClick={() => setPage(1)}
              className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50">«</button>
            <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}
              className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50">‹</button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pn = Math.max(1, Math.min(totalPages - 4, safePage - 2)) + i
              return pn <= totalPages ? (
                <button key={pn} onClick={() => setPage(pn)}
                  className={`px-2 py-1 text-xs rounded border ${pn === safePage ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-50'}`}>
                  {pn}
                </button>
              ) : null
            })}
            <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}
              className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50">›</button>
            <button disabled={safePage >= totalPages} onClick={() => setPage(totalPages)}
              className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50">»</button>
          </div>
        )}
      </div>
    </div>
  )
}

function PlantRow({ plant: p, rowNum }) {
  const hasTicket = !!p.ticketProject
  const partial = p.mglobalPartial

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-5 py-3 text-gray-400 text-xs tabular-nums">{rowNum.toLocaleString()}</td>
      <td className="px-3 py-3">
        <div className="font-medium text-gray-800 leading-snug">{p.plant}</div>
        {p.address && (
          <div className="text-xs text-gray-400 mt-0.5 truncate max-w-80" title={p.address}>{p.address}</div>
        )}
      </td>
      <td className="px-3 py-3 text-right tabular-nums font-medium text-gray-700">
        {p.power ? p.power.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
      </td>
      <td className="px-3 py-3 text-gray-500 whitespace-nowrap text-xs">{p.date || '—'}</td>
      <td className="px-3 py-3 text-gray-500 text-xs tabular-nums">{p.snCount}</td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-1">
          {/* iSolarCloud always */}
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
            <Cloud size={9} />iSC
          </span>
          {/* MGlobal badge */}
          {p.mglobal && (
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${partial ? 'bg-yellow-50 text-yellow-700' : 'bg-emerald-50 text-emerald-700'}`}>
              <Package size={9} />MGlobal{partial ? ' (บางส่วน)' : ''}
            </span>
          )}
          {/* Service / Ticket badge */}
          {hasTicket && (
            <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">
              <Zap size={9} />Service
            </span>
          )}
        </div>
      </td>
      <td className="px-3 py-3 text-xs text-gray-500 max-w-52">
        {p.dbProjects.length > 0 ? (
          <div className="space-y-0.5">
            {p.dbProjects.slice(0, 2).map((proj, i) => (
              <div key={i} className="truncate text-blue-700" title={proj}>{proj}</div>
            ))}
            {p.dbProjects.length > 2 && (
              <div className="text-gray-400">+{p.dbProjects.length - 2} โครงการ</div>
            )}
          </div>
        ) : (
          <span className="text-gray-300">—</span>
        )}
        {hasTicket && p.ticketProject && (
          <div className="text-orange-600 mt-0.5 truncate" title={p.ticketProject.project}>
            ✓ {p.ticketProject.project}
          </div>
        )}
      </td>
    </tr>
  )
}

function KpiCard({ value, label, sub, color, textColor, icon }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>{icon}</div>
      <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
      <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </div>
  )
}
