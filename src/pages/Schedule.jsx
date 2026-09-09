import { useState } from 'react'
import { jobs } from '../data/mockData'
import { ChevronLeft, ChevronRight, Plus, MapPin, User, Zap } from 'lucide-react'

const DAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
const MONTHS_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

const typeColor = {
  commissioning: 'bg-blue-500',
  inspection: 'bg-green-500',
  maintenance: 'bg-amber-500',
}
const typeLabel = { commissioning: 'COM', inspection: 'INS', maintenance: 'PM' }

const statusColor = {
  completed: 'opacity-60',
  in_progress: '',
  scheduled: '',
  pending: 'opacity-80',
  cancelled: 'opacity-40 line-through',
}

export default function Schedule() {
  const [year, setYear] = useState(2024)
  const [month, setMonth] = useState(7) // 0-indexed, 7 = August
  const [selected, setSelected] = useState(null)

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const getJobsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return jobs.filter(j => j.scheduledDate === dateStr)
  }

  const today = new Date()
  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const selectedJob = selected ? jobs.find(j => j.id === selected) : null

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const upcomingJobs = jobs
    .filter(j => ['scheduled', 'pending', 'in_progress'].includes(j.status))
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ตารางเวลา</h1>
          <p className="text-gray-500 text-sm mt-1">ปฏิทินงาน Commissioning Service</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          เพิ่มงานใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <button onClick={prev} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h2 className="font-semibold text-gray-900">
              {MONTHS_TH[month]} {year + 543}
            </h2>
            <button onClick={next} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Days of week */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="min-h-24 border-b border-r border-gray-50 bg-gray-50/30" />
              const dayJobs = getJobsForDay(day)
              const today_ = isToday(day)
              return (
                <div key={day} className="min-h-24 border-b border-r border-gray-100 p-1 hover:bg-blue-50/30 transition-colors">
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1 ${today_ ? 'bg-blue-600 text-white font-bold' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayJobs.slice(0, 3).map(job => (
                      <button
                        key={job.id}
                        onClick={() => setSelected(job.id === selected ? null : job.id)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-white text-xs truncate flex items-center gap-1 ${typeColor[job.type]} ${statusColor[job.status]} hover:opacity-90 transition-opacity`}
                      >
                        <span className="font-medium">{typeLabel[job.type]}</span>
                        <span className="opacity-90 truncate">{job.inverterBrand}</span>
                      </button>
                    ))}
                    {dayJobs.length > 3 && (
                      <div className="text-xs text-gray-500 px-1">+{dayJobs.length - 3} อื่น</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 p-4 border-t border-gray-100 text-xs text-gray-600">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block" />Commissioning</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" />ตรวจสอบ</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 inline-block" />บำรุงรักษา</span>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Job detail card */}
          {selectedJob ? (
            <div className="bg-white rounded-xl border border-blue-200 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-mono text-gray-400">{selectedJob.id}</div>
                  <div className="font-semibold text-gray-900 mt-0.5">{selectedJob.site}</div>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
              </div>
              <div className="space-y-2 text-sm">
                <InfoRow icon={<MapPin size={14} />} label={selectedJob.address} />
                <InfoRow icon={<Zap size={14} />} label={`${selectedJob.inverterBrand} ${selectedJob.inverterModel} (${selectedJob.capacity} kW)`} />
                <InfoRow icon={<User size={14} />} label={selectedJob.technicianName || 'ยังไม่ได้กำหนด'} />
              </div>
              <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 font-medium ${
                { commissioning: 'bg-blue-100 text-blue-700', inspection: 'bg-green-100 text-green-700', maintenance: 'bg-amber-100 text-amber-700' }[selectedJob.type]
              }`}>
                {selectedJob.type === 'commissioning' ? 'Commissioning' : selectedJob.type === 'inspection' ? 'ตรวจสอบ' : 'บำรุงรักษา'}
              </div>
              {selectedJob.notes && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded p-2">{selectedJob.notes}</p>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center text-gray-400 text-sm">
              คลิกที่งานในปฏิทิน<br />เพื่อดูรายละเอียด
            </div>
          )}

          {/* Upcoming */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-medium text-gray-900 text-sm">งานที่จะมาถึง</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {upcomingJobs.map(job => (
                <div key={job.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium text-white ${typeColor[job.type]}`}>
                      {typeLabel[job.type]}
                    </span>
                    <span className="text-xs text-gray-500">{job.scheduledDate}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900 truncate">{job.site}</div>
                  <div className="text-xs text-gray-500 truncate">{job.inverterBrand} · {job.capacity} kW</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label }) {
  return (
    <div className="flex items-start gap-2 text-gray-600">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <span className="text-xs">{label}</span>
    </div>
  )
}
