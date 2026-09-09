import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jobs } from '../data/mockData'
import { Search, Filter, Plus, ChevronRight, Zap, MapPin, User, Calendar } from 'lucide-react'

const statusConfig = {
  completed: { label: 'เสร็จสิ้น', color: 'text-green-700 bg-green-100', dot: 'bg-green-500' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'text-blue-700 bg-blue-100', dot: 'bg-blue-500' },
  scheduled: { label: 'มีกำหนด', color: 'text-purple-700 bg-purple-100', dot: 'bg-purple-500' },
  pending: { label: 'รอดำเนินการ', color: 'text-amber-700 bg-amber-100', dot: 'bg-amber-500' },
  cancelled: { label: 'ยกเลิก', color: 'text-red-700 bg-red-100', dot: 'bg-red-400' },
}

const typeConfig = {
  commissioning: { label: 'Commissioning', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  inspection: { label: 'ตรวจสอบ', color: 'text-green-700 bg-green-50 border-green-200' },
  maintenance: { label: 'PM', color: 'text-amber-700 bg-amber-50 border-amber-200' },
}

const priorityDot = {
  urgent: 'bg-red-500',
  high: 'bg-orange-400',
  medium: 'bg-blue-400',
  low: 'bg-gray-300',
}

export default function Jobs() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const filtered = jobs.filter(j => {
    const matchSearch = !search ||
      j.id.toLowerCase().includes(search.toLowerCase()) ||
      j.site.toLowerCase().includes(search) ||
      j.customerName.toLowerCase().includes(search) ||
      j.inverterBrand.toLowerCase().includes(search)
    const matchStatus = statusFilter === 'all' || j.status === statusFilter
    const matchType = typeFilter === 'all' || j.type === typeFilter
    return matchSearch && matchStatus && matchType
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">งาน Commissioning</h1>
          <p className="text-gray-500 text-sm mt-1">จัดการงานทั้งหมด {jobs.length} งาน</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          สร้างงานใหม่
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหา ID, ชื่อไซต์, ลูกค้า, อินเวอร์เตอร์..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">ทุกสถานะ</option>
          <option value="scheduled">มีกำหนด</option>
          <option value="in_progress">กำลังดำเนินการ</option>
          <option value="pending">รอดำเนินการ</option>
          <option value="completed">เสร็จสิ้น</option>
          <option value="cancelled">ยกเลิก</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">ทุกประเภท</option>
          <option value="commissioning">Commissioning</option>
          <option value="inspection">ตรวจสอบ</option>
          <option value="maintenance">PM</option>
        </select>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Filter size={14} />
        แสดง {filtered.length} จาก {jobs.length} งาน
      </div>

      {/* Job Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            ไม่พบงานที่ตรงกับเงื่อนไข
          </div>
        ) : filtered.map(job => {
          const s = statusConfig[job.status]
          const t = typeConfig[job.type]
          return (
            <div
              key={job.id}
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-gray-400 font-medium">{job.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${t.color}`}>{t.label}</span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${priorityDot[job.priority]} ml-1`} title={job.priority} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{job.site}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{job.customerName}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin size={12} />{job.address}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Zap size={12} />{job.inverterBrand} {job.inverterModel} ({job.capacity} kW)
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <User size={12} />{job.technicianName || <span className="text-amber-500">ยังไม่ได้กำหนด</span>}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={12} />{job.scheduledDate}
                    </span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-1" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
