import { customers, jobs } from '../data/mockData'
import { Building2, Phone, Mail, MapPin, ClipboardList, Plus } from 'lucide-react'

export default function Customers() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ลูกค้า</h1>
          <p className="text-gray-500 text-sm mt-1">จัดการข้อมูลลูกค้า {customers.length} ราย</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          เพิ่มลูกค้า
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {customers.map(c => {
          const customerJobs = jobs.filter(j => j.customerId === c.id)
          const completed = customerJobs.filter(j => j.status === 'completed').length
          return (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} className="text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{c.name}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{c.contact}</p>
                  <span className="text-xs font-mono text-gray-400">{c.id}</span>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Phone size={12} className="flex-shrink-0" />{c.phone}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail size={12} className="flex-shrink-0" />{c.email}
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <MapPin size={12} className="flex-shrink-0 mt-0.5" />{c.address}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <ClipboardList size={13} />
                  {customerJobs.length} งาน
                </div>
                <div className="text-xs text-green-600 font-medium">✓ เสร็จสิ้น {completed} งาน</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
