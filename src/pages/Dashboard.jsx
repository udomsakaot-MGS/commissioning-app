import { Link } from 'react-router-dom'
import { useData } from '../App'
import {
  getProjectStats, getDeviceList,
  DEVICE_TYPES, PROJECT_STATUS_BADGE, PROJECT_STATUS_LABEL,
} from '../data/mockData'
import { TICKET_PROJECTS, TECHNICIANS, PRODUCT_GROUP_MAP } from '../data/ticketData'
import { FolderOpen, Cloud, AlertTriangle, Layers, TrendingUp, CalendarDays, Wrench, CheckCircle } from 'lucide-react'

// ---- Commissioning calendar helpers ----
function isoDate(d) { return d.toISOString().slice(0, 10) }

const NICK_MAP = Object.fromEntries(TECHNICIANS.map(t => [t.name, t.nick]))

const PRODUCT_COLOR = {
  inverter:      'bg-blue-100 text-blue-700',
  optimizer:     'bg-purple-100 text-purple-700',
  rapidShutdown: 'bg-orange-100 text-orange-700',
  logger:        'bg-teal-100 text-teal-700',
  meter:         'bg-green-100 text-green-700',
}

// Build date → projects map (each project appears on every day from startDate to endDate)
const COMM_DATE_MAP = (() => {
  const map = new Map()
  TICKET_PROJECTS.forEach(p => {
    if (!p.startDate) return
    const end = p.endDate ? new Date(p.endDate) : new Date(p.startDate)
    for (const d = new Date(p.startDate); d <= end; d.setDate(d.getDate() + 1)) {
      const key = isoDate(d)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(p)
    }
  })
  return map
})()

const THAI_DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const THAI_MONTHS_SHORT = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

export default function Dashboard() {
  const { projects } = useData()

  const allDevices = projects.flatMap(p => getDeviceList(p))
  const totalSNs = allDevices.length
  const totalCommissioned = allDevices.filter(d => d.commissionStatus === 'completed').length
  const totalISolarCloud = allDevices.filter(d => d.iSolarCloud).length
  const totalIssues = allDevices.filter(d => d.commissionStatus === 'issue').length

  const issueDevices = projects.flatMap(p =>
    Object.entries(p.devices).flatMap(([type, devices]) =>
      Array.isArray(devices)
        ? devices.filter(d => d.commissionStatus === 'issue').map(d => ({ ...d, type, projectId: p.id, projectRef: p.projectRef }))
        : []
    )
  )

  const deviceSummary = Object.keys(DEVICE_TYPES).map(type => {
    const list = projects.flatMap(p => p.devices[type] || []).filter(d => d?.sn)
    const completed = list.filter(d => d.commissionStatus === 'completed').length
    return { type, label: DEVICE_TYPES[type].label, total: list.length, completed }
  }).filter(s => s.total > 0)

  const sortedProjects = [...projects].sort((a, b) => getProjectStats(a).percent - getProjectStats(b).percent)
  const overallPct = totalSNs > 0 ? Math.round((totalCommissioned / totalSNs) * 100) : 0
  const iscPct = totalSNs > 0 ? Math.round((totalISolarCloud / totalSNs) * 100) : 0

  const BAR_COLORS = {
    inverter: 'bg-blue-500', optimizer: 'bg-purple-500',
    rapidShutdown: 'bg-orange-500', logger: 'bg-teal-500',
    meter: 'bg-green-500', mounting: 'bg-gray-400',
  }

  return (
    <div className="space-y-4">
      {/* Header + stat strip */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">แดชบอร์ด</h1>
          <p className="text-gray-400 text-xs mt-0.5">ภาพรวม Commissioning Service · Sungrow</p>
        </div>
        <Link to="/reports" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
          <TrendingUp size={13} /> รายงานเต็ม
        </Link>
      </div>

      {/* Compact KPI strip — 4 inline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatStrip icon={<FolderOpen size={16} className="text-blue-500" />} bg="bg-blue-50"
          value={projects.length} label="โครงการ"
          sub={`${projects.filter(p => p.status === 'in_progress').length} กำลังดำเนินการ`} />
        <StatStrip icon={<Layers size={16} className="text-gray-500" />} bg="bg-gray-100"
          value={totalSNs} label="SN ทั้งหมด"
          sub={`${Object.keys(DEVICE_TYPES).length} ประเภท`} />
        <StatStrip icon={<CheckCircle size={16} className="text-green-500" />} bg="bg-green-50"
          value={`${overallPct}%`} label="Commissioned"
          sub={`${totalCommissioned} / ${totalSNs} รายการ`}
          bar={overallPct} barColor="bg-green-400" />
        <StatStrip icon={<Cloud size={16} className="text-amber-500" />} bg="bg-amber-50"
          value={`${iscPct}%`} label="iSolarCloud"
          sub={`${totalISolarCloud} / ${totalSNs} รายการ`}
          bar={iscPct} barColor="bg-amber-400" />
      </div>

      {/* Alert — inline compact */}
      {issueDevices.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 flex items-start gap-3">
          <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-red-700">พบอุปกรณ์มีปัญหา {issueDevices.length} รายการ</span>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              {issueDevices.map(d => (
                <span key={d.sn} className="text-xs text-red-600 font-mono">
                  {d.sn} <span className="text-red-400 font-sans">· {d.projectRef}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Project list — compact table style */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">ความคืบหน้าโครงการ</h2>
            <Link to="/projects" className="text-xs text-blue-600 hover:underline">ดูทั้งหมด →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {sortedProjects.map(p => {
              const s = getProjectStats(p)
              return (
                <div key={p.id} className="px-4 py-2.5 hover:bg-gray-50/70 transition-colors">
                  <div className="flex items-center gap-3">
                    {/* Progress ring indicator */}
                    <div className="flex-shrink-0 relative w-8 h-8">
                      <svg viewBox="0 0 32 32" className="w-8 h-8 -rotate-90">
                        <circle cx="16" cy="16" r="13" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                        <circle cx="16" cy="16" r="13" fill="none"
                          stroke={s.percent === 100 ? '#22c55e' : s.issues > 0 ? '#f87171' : '#3b82f6'}
                          strokeWidth="3"
                          strokeDasharray={`${s.percent * 0.816} 81.6`}
                          strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-gray-600">
                        {s.percent}
                      </span>
                    </div>

                    {/* Project info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800 truncate">{p.projectRef}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium leading-none ${PROJECT_STATUS_BADGE[p.status]}`}>
                          {PROJECT_STATUS_LABEL[p.status]}
                        </span>
                        {s.issues > 0 && (
                          <span className="text-xs text-red-500 flex items-center gap-0.5">
                            <AlertTriangle size={10} />{s.issues}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{p.customer}</div>
                    </div>

                    {/* Stats */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-gray-800">{s.completed}<span className="text-gray-400 font-normal text-xs">/{s.total}</span></div>
                      <div className="text-xs text-gray-400">SN</div>
                    </div>
                  </div>

                  {/* Thin progress bar */}
                  <div className="mt-2 ml-11 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all
                      ${s.percent === 100 ? 'bg-green-400' : s.issues > 0 ? 'bg-red-300' : 'bg-blue-400'}`}
                      style={{ width: `${s.percent}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Device type breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">ประเภทอุปกรณ์</h2>
            <div className="space-y-2.5">
              {deviceSummary.map(s => {
                const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0
                return (
                  <div key={s.type}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-gray-600">{s.label}</span>
                      <span className="text-gray-500 tabular-nums">{s.completed}/{s.total}
                        <span className="text-gray-300 ml-1">{pct}%</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${BAR_COLORS[s.type] || 'bg-gray-400'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Project status + issue summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">สถานะโครงการ</h2>
            <div className="space-y-1.5">
              {['completed', 'in_progress', 'pending'].map(status => {
                const count = projects.filter(p => p.status === status).length
                if (!count) return null
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROJECT_STATUS_BADGE[status]}`}>
                      {PROJECT_STATUS_LABEL[status]}
                    </span>
                    <span className="text-sm font-bold text-gray-700">{count}</span>
                  </div>
                )
              })}
            </div>

            {totalIssues > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle size={11} /> อุปกรณ์มีปัญหา
                </span>
                <span className="text-sm font-bold text-red-600">{totalIssues}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Commissioning Calendar widget ── */}
      <MiniCalendar />
    </div>
  )
}

// ---- Mini Commissioning Calendar ----
function MiniCalendar() {
  const today = new Date()

  // Build 14-day window: 7 days back + today + 6 days forward
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - 7 + i)
    return d
  })

  // Recent jobs (sorted desc by startDate, show last 6)
  const recentJobs = [...TICKET_PROJECTS]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 6)

  // Upcoming: first job with startDate >= today
  const todayKey = isoDate(today)
  const upcomingJobs = [...TICKET_PROJECTS]
    .filter(p => p.startDate >= todayKey)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 3)

  const displayJobs = upcomingJobs.length > 0 ? upcomingJobs : recentJobs

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-blue-500" />
          <h2 className="text-sm font-semibold text-gray-800">ปฏิทิน Commissioning</h2>
          {upcomingJobs.length === 0 && (
            <span className="text-xs text-gray-400 italic">(แสดงล่าสุด)</span>
          )}
        </div>
        <Link to="/calendar" className="text-xs text-blue-600 hover:underline">ปฏิทินเต็ม →</Link>
      </div>

      <div className="p-4 space-y-4">
        {/* 14-day strip */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {days.map(d => {
            const key = isoDate(d)
            const evts = COMM_DATE_MAP.get(key) || []
            const isToday = key === todayKey
            const isPast = key < todayKey
            const dow = d.getDay()
            const isWeekend = dow === 0 || dow === 6

            return (
              <div key={key}
                className={`flex-shrink-0 w-10 rounded-lg text-center py-2 px-1 border transition-colors
                  ${isToday ? 'bg-blue-600 border-blue-600 text-white' :
                    evts.length ? 'bg-blue-50 border-blue-200' :
                    isWeekend ? 'bg-gray-50 border-gray-100 text-gray-300' :
                    'bg-gray-50 border-gray-100'}`}>
                <div className={`text-xs leading-none mb-1 ${isToday ? 'text-blue-200' : isWeekend && !evts.length ? 'text-gray-300' : 'text-gray-400'}`}>
                  {THAI_DAYS[dow]}
                </div>
                <div className={`text-sm font-bold leading-none ${isPast && !isToday ? 'text-gray-400' : ''}`}>
                  {d.getDate()}
                </div>
                {evts.length > 0 && (
                  <div className={`mt-1 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center mx-auto
                    ${isToday ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'}`}>
                    {evts.length}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Job list */}
        <div className="space-y-1.5">
          {displayJobs.map(p => {
            const isPast = p.startDate < todayKey
            return (
              <div key={p.project + p.startDate}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs
                  ${isPast ? 'bg-gray-50' : 'bg-blue-50/60'}`}>
                {/* Date pill */}
                <div className={`text-center flex-shrink-0 w-14 ${isPast ? 'text-gray-400' : 'text-blue-700'}`}>
                  <div className="font-bold leading-tight">{p.startDate.slice(8)}</div>
                  <div className="leading-tight">{THAI_MONTHS_SHORT[parseInt(p.startDate.slice(5, 7)) - 1]}</div>
                </div>

                {/* Project info */}
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold truncate ${isPast ? 'text-gray-600' : 'text-gray-800'}`}>{p.project}</div>
                  <div className="text-gray-400 truncate">{p.customer}</div>
                </div>

                {/* Techs */}
                <div className="flex gap-1 flex-shrink-0">
                  {p.techs.slice(0, 2).map(t => (
                    <span key={t} className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-xs font-medium">
                      {NICK_MAP[t] || t}
                    </span>
                  ))}
                </div>

                {/* Products */}
                <div className="flex gap-1 flex-shrink-0">
                  {p.products.slice(0, 2).map(pr => {
                    const cat = PRODUCT_GROUP_MAP[pr] || 'other'
                    const cls = PRODUCT_COLOR[cat] || 'bg-gray-100 text-gray-500'
                    return (
                      <span key={pr} className={`px-1.5 py-0.5 rounded-full font-medium ${cls}`}>
                        {pr.replace('Optimizer', 'Opt.').replace('Logger', 'Log.')}
                      </span>
                    )
                  })}
                  {p.products.length > 2 && (
                    <span className="text-gray-400">+{p.products.length - 2}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatStrip({ icon, bg, value, label, sub, bar, barColor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center`}>{icon}</div>
        <span className="text-xl font-bold text-gray-900 leading-none">{value}</span>
      </div>
      <div className="text-xs font-medium text-gray-600">{label}</div>
      <div className="text-xs text-gray-400">{sub}</div>
      {bar !== undefined && (
        <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${bar}%` }} />
        </div>
      )}
    </div>
  )
}
