import { useParams, useNavigate } from 'react-router-dom'
import { jobs } from '../data/mockData'
import { ArrowLeft, MapPin, User, Zap, Calendar, FileText, Hash, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

const statusConfig = {
  completed: { label: 'เสร็จสิ้น', color: 'text-green-700 bg-green-100', icon: <CheckCircle2 size={16} className="text-green-600" /> },
  in_progress: { label: 'กำลังดำเนินการ', color: 'text-blue-700 bg-blue-100', icon: <Clock size={16} className="text-blue-600" /> },
  scheduled: { label: 'มีกำหนด', color: 'text-purple-700 bg-purple-100', icon: <Calendar size={16} className="text-purple-600" /> },
  pending: { label: 'รอดำเนินการ', color: 'text-amber-700 bg-amber-100', icon: <AlertCircle size={16} className="text-amber-600" /> },
  cancelled: { label: 'ยกเลิก', color: 'text-red-700 bg-red-100', icon: <AlertCircle size={16} className="text-red-600" /> },
}

const typeLabel = { commissioning: 'Commissioning', inspection: 'ตรวจสอบ', maintenance: 'บำรุงรักษา' }

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const job = jobs.find(j => j.id === id)

  if (!job) return (
    <div className="text-center py-20 text-gray-400">
      ไม่พบงาน <button onClick={() => navigate('/jobs')} className="text-blue-600 hover:underline ml-2">กลับ</button>
    </div>
  )

  const s = statusConfig[job.status]

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/jobs')} className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm">
        <ArrowLeft size={16} /> กลับไปรายการงาน
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-mono text-gray-400 font-medium">{job.id}</span>
              <span className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-full font-medium ${s.color}`}>
                {s.icon}{s.label}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{job.site}</h1>
            <p className="text-gray-500 mt-1">{job.customerName}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">ประเภทงาน</div>
            <div className="font-semibold text-blue-700 mt-0.5">{typeLabel[job.type]}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Job Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">รายละเอียดงาน</h2>
          <InfoField icon={<MapPin size={16} />} label="สถานที่" value={job.address} />
          <InfoField icon={<Calendar size={16} />} label="วันที่กำหนด" value={job.scheduledDate} />
          {job.completedDate && <InfoField icon={<CheckCircle2 size={16} />} label="วันที่เสร็จ" value={job.completedDate} />}
          <InfoField icon={<User size={16} />} label="ช่างเทคนิค" value={job.technicianName || (
            <span className="text-amber-600">ยังไม่ได้กำหนดช่าง</span>
          )} />
          <InfoField icon={<AlertCircle size={16} />} label="ความสำคัญ" value={
            { urgent: '🔴 เร่งด่วนมาก', high: '🟠 สูง', medium: '🔵 ปกติ', low: '⚪ ต่ำ' }[job.priority]
          } />
        </div>

        {/* Equipment Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 border-b border-gray-100 pb-3">ข้อมูลอินเวอร์เตอร์</h2>
          <InfoField icon={<Zap size={16} />} label="ยี่ห้อ" value={job.inverterBrand} />
          <InfoField icon={<Zap size={16} />} label="รุ่น" value={job.inverterModel} />
          <InfoField icon={<Hash size={16} />} label="Serial No." value={<span className="font-mono text-sm">{job.serialNo}</span>} />
          <InfoField icon={<Zap size={16} />} label="กำลังไฟฟ้า" value={`${job.capacity} kW`} />
        </div>
      </div>

      {/* Notes */}
      {job.notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-3">หมายเหตุ</h2>
          <p className="text-gray-700 bg-gray-50 rounded-lg p-4 text-sm leading-relaxed">{job.notes}</p>
        </div>
      )}

      {/* Documents */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">เอกสารประกอบ</h2>
        {job.documents.length > 0 ? (
          <div className="space-y-2">
            {job.documents.map(doc => (
              <div key={doc} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer group">
                <FileText size={16} className="text-blue-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 group-hover:text-blue-700 flex-1">{doc}</span>
                <span className="text-xs text-gray-400 group-hover:text-blue-500">ดาวน์โหลด</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-400 text-sm">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            ยังไม่มีเอกสาร
          </div>
        )}
        <button className="mt-4 w-full border-2 border-dashed border-gray-200 rounded-lg py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
          + อัพโหลดเอกสาร
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {job.status === 'pending' && (
          <button className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            กำหนดช่าง & เริ่มงาน
          </button>
        )}
        {job.status === 'scheduled' && (
          <button className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            เริ่มดำเนินการ
          </button>
        )}
        {job.status === 'in_progress' && (
          <button className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            บันทึกผลสำเร็จ
          </button>
        )}
        <button className="px-6 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          แก้ไข
        </button>
        {!['completed', 'cancelled'].includes(job.status) && (
          <button className="px-6 border border-red-200 text-red-600 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
            ยกเลิก
          </button>
        )}
      </div>
    </div>
  )
}

function InfoField({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
        <div className="text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  )
}
