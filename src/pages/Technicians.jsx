import { technicians, jobs } from '../data/mockData'
import { Phone, Wrench, CheckCircle, Clock, Plus } from 'lucide-react'

const skillLabel = {
  commissioning: 'Commissioning',
  maintenance: 'PM',
  testing: 'Testing',
  installation: 'ติดตั้ง',
  inspection: 'ตรวจสอบ',
}

const colors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-green-100 text-green-700', 'bg-amber-100 text-amber-700', 'bg-pink-100 text-pink-700']

export default function Technicians() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ช่างเทคนิค</h1>
          <p className="text-gray-500 text-sm mt-1">ทีมช่าง {technicians.length} คน</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          เพิ่มช่าง
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {technicians.map((t, i) => {
          const techJobs = jobs.filter(j => j.technicianId === t.id)
          const completedJobs = techJobs.filter(j => j.status === 'completed').length
          const activeJobs = techJobs.filter(j => ['in_progress', 'scheduled'].includes(j.status))
          return (
            <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0 ${colors[i % colors.length]}`}>
                  {t.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-sm">{t.name}</h3>
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${t.available ? 'bg-green-400' : 'bg-gray-300'}`} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{t.id}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <Phone size={11} />{t.phone}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className={`text-xs px-3 py-1.5 rounded-lg font-medium mb-4 flex items-center gap-1.5 ${t.available ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                {t.available ? <CheckCircle size={13} /> : <Clock size={13} />}
                {t.available ? 'พร้อมรับงาน' : 'ไม่ว่าง'}
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {t.skills.map(skill => (
                  <span key={skill} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                    {skillLabel[skill] || skill}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 text-center">
                <div>
                  <div className="font-bold text-gray-900 text-lg">{techJobs.length}</div>
                  <div className="text-xs text-gray-400">ทั้งหมด</div>
                </div>
                <div>
                  <div className="font-bold text-green-600 text-lg">{completedJobs}</div>
                  <div className="text-xs text-gray-400">เสร็จ</div>
                </div>
                <div>
                  <div className="font-bold text-blue-600 text-lg">{activeJobs.length}</div>
                  <div className="text-xs text-gray-400">กำลังทำ</div>
                </div>
              </div>

              {/* Active jobs */}
              {activeJobs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2 font-medium">งานที่กำลังรับผิดชอบ:</p>
                  {activeJobs.map(j => (
                    <div key={j.id} className="text-xs text-gray-600 flex items-center gap-1.5 py-1">
                      <Wrench size={11} className="text-blue-400 flex-shrink-0" />
                      <span className="truncate">{j.site}</span>
                      <span className="text-gray-400 flex-shrink-0">{j.scheduledDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
