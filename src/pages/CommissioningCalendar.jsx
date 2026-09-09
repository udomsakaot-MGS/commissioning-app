import { useState, useMemo } from 'react'
import { TICKET_PROJECTS, TECHNICIANS } from '../data/ticketData'
import {
  CalendarDays, ChevronLeft, ChevronRight, Clock, Users,
  CheckCircle, AlertCircle, Zap, Info,
} from 'lucide-react'

const THAI_MONTHS = [
  'มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม',
]
const THAI_DAYS_SHORT = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.']

function formatThaiDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`
}

function isoDate(d) {
  return d.toISOString().slice(0, 10)
}

// Expand project date ranges into individual daily entries
function buildDateMap() {
  const map = new Map()
  TICKET_PROJECTS.forEach(p => {
    if (!p.startDate) return
    const start = new Date(p.startDate)
    const end = p.endDate ? new Date(p.endDate) : new Date(p.startDate)
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = isoDate(d)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(p)
    }
  })
  return map
}

const DATE_MAP = buildDateMap()

// Count how many technicians are busy on a given date
function techBusyOn(dateKey) {
  return new Set((DATE_MAP.get(dateKey) || []).flatMap(p => p.techs))
}

// Find the next N available weekday slots after the given date
function proposeSlots(afterDate, count = 3) {
  const slots = []
  const d = new Date(afterDate)
  d.setDate(d.getDate() + 1)

  while (slots.length < count) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) { // skip weekends
      const key = isoDate(d)
      const busyTechs = techBusyOn(key)
      const available = TECHNICIANS.filter(t => !busyTechs.has(t.name))
      if (available.length >= 1) {
        slots.push({
          date: key,
          available,
          existingCount: (DATE_MAP.get(key) || []).length,
          existingProjects: (DATE_MAP.get(key) || []).map(p => p.project).slice(0, 2),
        })
      }
    }
    d.setDate(d.getDate() + 1)
  }
  return slots
}

export default function CommissioningCalendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [projectName, setProjectName] = useState('')
  const [customer, setCustomer] = useState('')
  const [leadWeeks, setLeadWeeks] = useState(3)
  const [proposals, setProposals] = useState(null)
  const [techFilter, setTechFilter] = useState('all')
  const [confirmedSlot, setConfirmedSlot] = useState(null)

  // Calendar grid
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  // Filtered projects for selected date
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return []
    const evts = DATE_MAP.get(selectedDate) || []
    if (techFilter === 'all') return evts
    return evts.filter(p => p.techs.includes(techFilter))
  }, [selectedDate, techFilter])

  // Monthly event summary
  const monthEvents = useMemo(() => {
    const summary = {}
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const evts = DATE_MAP.get(key) || []
      if (evts.length) summary[d] = evts
    }
    return summary
  }, [year, month, daysInMonth])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function handlePropose() {
    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + leadWeeks * 7)
    setProposals(proposeSlots(targetDate, 3))
    setConfirmedSlot(null)
  }

  function confirmSlot(slot) {
    setConfirmedSlot(slot)
    // Navigate calendar to confirmed date
    const [y, m] = slot.date.split('-').map(Number)
    setYear(y)
    setMonth(m - 1)
    setSelectedDate(slot.date)
  }

  const todayKey = isoDate(today)

  // Compute busy level for calendar cell colouring
  function busyLevel(events) {
    if (!events || events.length === 0) return 0
    if (events.length === 1) return 1
    if (events.length <= 3) return 2
    return 3
  }

  const busyColor = ['', 'bg-blue-50 border-blue-100', 'bg-amber-50 border-amber-100', 'bg-red-50 border-red-100']
  const busyDot = ['', 'bg-blue-400', 'bg-amber-400', 'bg-red-400']

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays size={22} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">ปฏิทิน Commissioning</h1>
        </div>
        <p className="text-gray-400 text-sm">แผนงานรายเดือน · วางแผนนัดหมายโครงการใหม่ล่วงหน้า 3 สัปดาห์</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <CalendarDays size={20} className="text-blue-600" />, bg: 'bg-blue-50', value: TICKET_PROJECTS.length, label: 'โครงการทั้งหมด', sub: 'ใน Commissioning System' },
          { icon: <Clock size={20} className="text-amber-600" />, bg: 'bg-amber-50', value: Object.keys(monthEvents).length, label: `งานในเดือน ${THAI_MONTHS[month]}`, sub: `${year + 543}` },
          { icon: <Users size={20} className="text-emerald-600" />, bg: 'bg-emerald-50', value: TECHNICIANS.length, label: 'ช่างเทคนิค', sub: 'ในทีม' },
          { icon: <Zap size={20} className="text-purple-600" />, bg: 'bg-purple-50', value: `${leadWeeks} สัปดาห์`, label: 'Lead time มาตรฐาน', sub: 'ก่อนวันนัด Commissioning' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center mb-3`}>{k.icon}</div>
            <div className="text-2xl font-bold text-gray-900 leading-none">{k.value}</div>
            <div className="text-sm font-medium text-gray-700 mt-1">{k.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Calendar */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div className="text-center">
              <div className="font-semibold text-gray-900">{THAI_MONTHS[month]}</div>
              <div className="text-xs text-gray-400">{year + 543}</div>
            </div>
            <button onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {THAI_DAYS_SHORT.map((d, i) => (
              <div key={d} className={`text-center py-2 text-xs font-medium ${i === 0 || i === 6 ? 'text-red-400' : 'text-gray-400'}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (!day) return (
                <div key={`e-${idx}`} className="min-h-20 border-r border-b border-gray-50/80 bg-gray-50/30" />
              )
              const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const events = monthEvents[day] || []
              const isToday = key === todayKey
              const isSelected = key === selectedDate
              const isConfirmed = confirmedSlot?.date === key
              const dow = (firstDow + day - 1) % 7
              const isWeekend = dow === 0 || dow === 6
              const level = busyLevel(events)

              return (
                <div key={key}
                  onClick={() => setSelectedDate(isSelected ? null : key)}
                  className={`min-h-20 p-1.5 border-r border-b border-gray-50 cursor-pointer transition-colors relative
                    ${isSelected ? 'bg-blue-100/70 ring-1 ring-blue-300 ring-inset' : ''}
                    ${isConfirmed && !isSelected ? 'bg-emerald-50/80' : ''}
                    ${!isSelected && !isConfirmed && level > 0 ? busyColor[level] : ''}
                    ${isWeekend && !isSelected ? 'bg-gray-50/60' : ''}
                    hover:bg-blue-50/50`}>
                  <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1
                    ${isToday ? 'bg-blue-600 text-white' : isWeekend ? 'text-red-400' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  {isConfirmed && (
                    <div className="text-xs bg-emerald-100 text-emerald-700 rounded px-1 py-0.5 mb-0.5 truncate font-medium">
                      ✓ {projectName || 'นัดใหม่'}
                    </div>
                  )}
                  {events.slice(0, 2).map((e, i) => (
                    <div key={i} className="text-xs bg-blue-100 text-blue-700 rounded px-1 py-0.5 mb-0.5 truncate">
                      {e.project.slice(0, 14)}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div className="text-xs text-gray-400 pl-1">+{events.length - 2}</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> 1 โครงการ</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 2–3 โครงการ</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> มากกว่า 3</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> นัดหมายใหม่</span>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* New project scheduler */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <CalendarDays size={16} className="text-blue-500" />
              เสนอวันนัด Commissioning
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              ระบบจะเช็กตารางช่าง และเสนอวันว่างประมาณ <strong>{leadWeeks} สัปดาห์</strong> นับจากวันนี้
            </p>

            <div className="space-y-2.5 mb-4">
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ชื่อโครงการ *"
                value={projectName} onChange={e => setProjectName(e.target.value)} />
              <input
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ชื่อลูกค้า"
                value={customer} onChange={e => setCustomer(e.target.value)} />
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 whitespace-nowrap">Lead time</span>
                <input
                  type="range" min={1} max={6} value={leadWeeks}
                  onChange={e => setLeadWeeks(Number(e.target.value))}
                  className="flex-1 accent-blue-500" />
                <span className="text-xs font-semibold text-blue-700 w-16 text-right">{leadWeeks} สัปดาห์</span>
              </div>
            </div>

            <button
              onClick={handlePropose}
              disabled={!projectName.trim()}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors">
              ตรวจสอบและเสนอวันนัด
            </button>

            {/* Proposed slots */}
            {proposals && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-semibold text-gray-600 mb-2">วันที่แนะนำสำหรับ "{projectName}"</div>
                {proposals.map((p, i) => (
                  <div key={i}
                    onClick={() => confirmSlot(p)}
                    className={`rounded-lg p-3 border cursor-pointer transition-all hover:shadow-sm
                      ${confirmedSlot?.date === p.date
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-800">
                        ตัวเลือก {i + 1}: {formatThaiDate(p.date)}
                      </span>
                      {confirmedSlot?.date === p.date && (
                        <CheckCircle size={14} className="text-emerald-600" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {p.available.map(t => (
                        <span key={t.name} className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                          {t.nick}
                        </span>
                      ))}
                    </div>
                    {p.existingCount > 0 ? (
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <AlertCircle size={11} />
                        มีงานอื่น {p.existingCount} โครงการวันนี้
                        {p.existingProjects.length > 0 && <span className="text-gray-400 truncate"> · {p.existingProjects.join(', ')}</span>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle size={11} />
                        ไม่มีงานอื่นวันนี้
                      </div>
                    )}
                  </div>
                ))}
                {confirmedSlot && (
                  <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700">
                    <div className="font-semibold mb-0.5 flex items-center gap-1">
                      <CheckCircle size={12} /> เลือกวันนัด: {formatThaiDate(confirmedSlot.date)}
                    </div>
                    <div>ช่าง: {confirmedSlot.available.map(t => `${t.nick} (${t.name})`).join(', ')}</div>
                    {customer && <div className="mt-0.5">ลูกค้า: {customer}</div>}
                    <div className="mt-1 text-emerald-500 italic">วันที่ถูกเน้นบนปฏิทินแล้ว ✓</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected date detail */}
          {selectedDate && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{formatThaiDate(selectedDate)}</div>
                  <div className="text-xs text-gray-400">
                    {selectedEvents.length === 0 ? 'ไม่มีงาน' : `${selectedEvents.length} โครงการ`}
                  </div>
                </div>
                <select value={techFilter} onChange={e => setTechFilter(e.target.value)}
                  className="text-xs px-2 py-1 border border-gray-200 rounded-lg focus:outline-none">
                  <option value="all">ช่างทั้งหมด</option>
                  {TECHNICIANS.map(t => <option key={t.name} value={t.name}>{t.nick}</option>)}
                </select>
              </div>
              <div className="divide-y divide-gray-50 max-h-72 overflow-auto">
                {selectedEvents.length === 0 ? (
                  <div className="px-5 py-8 text-center text-gray-300">
                    <CalendarDays size={28} className="mx-auto mb-2" />
                    <p className="text-sm text-gray-400">ไม่มีงาน Commissioning วันนี้</p>
                  </div>
                ) : (
                  selectedEvents.map(p => (
                    <div key={p.project} className="px-5 py-3">
                      <div className="text-sm font-medium text-gray-800">{p.project}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.customer}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.techs.map(t => (
                          <span key={t} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                            {TECHNICIANS.find(tt => tt.name === t)?.nick || t}
                          </span>
                        ))}
                        {p.products?.slice(0, 2).map(pr => (
                          <span key={pr} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                            {pr}
                          </span>
                        ))}
                      </div>
                      {p.iSolarCloud && (
                        <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <Info size={10} /> {p.iSolarCloudName || 'iSolarCloud'}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Technician availability today */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-2">
              <Users size={14} className="text-gray-400" />
              ความพร้อมช่างวันนี้
            </h3>
            <div className="space-y-2">
              {TECHNICIANS.map(t => {
                const busyToday = techBusyOn(todayKey).has(t.name)
                const busyProjects = (DATE_MAP.get(todayKey) || []).filter(p => p.techs.includes(t.name))
                return (
                  <div key={t.name} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0
                      ${busyToday ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                      {t.nick[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-700 font-medium">{t.nick}</div>
                      {busyToday
                        ? <div className="text-xs text-amber-600 truncate">งาน: {busyProjects.map(p => p.project).join(', ')}</div>
                        : <div className="text-xs text-emerald-600">ว่าง</div>
                      }
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0
                      ${busyToday ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {busyToday ? 'ไม่ว่าง' : 'ว่าง'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
