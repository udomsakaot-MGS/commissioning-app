import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../App'
import { DEVICE_TYPES, STATUS_BADGE, STATUS_LABEL } from '../data/mockData'
import { Search, Cloud, CloudOff, ArrowRight } from 'lucide-react'

export default function SNSearch() {
  const { projects } = useData()
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()

  const results = q.length < 2 ? [] : projects.flatMap(project =>
    Object.entries(project.devices).flatMap(([type, devices]) => {
      if (type === 'mounting' || !Array.isArray(devices)) return []
      return devices
        .filter(d =>
          d.sn.toLowerCase().includes(q) ||
          d.itemNo.toLowerCase().includes(q) ||
          d.model.toLowerCase().includes(q)
        )
        .map(d => ({
          ...d,
          type,
          typeLabel: DEVICE_TYPES[type]?.label || type,
          projectId: project.id,
          projectRef: project.projectRef,
          customer: project.customer,
        }))
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ค้นหา SN</h1>
        <p className="text-gray-500 text-sm mt-1">ค้นหา Serial Number, Item No. หรือ รุ่นอุปกรณ์ ทั่วทั้งระบบ</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="relative max-w-2xl mx-auto">
          <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            autoFocus
            placeholder="พิมพ์ SN, Item No. หรือ Model เช่น A2532428413, SG125CX-P2, MINV-..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          )}
        </div>
        {q.length > 0 && q.length < 2 && (
          <p className="text-center text-gray-400 text-sm mt-3">พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา</p>
        )}
      </div>

      {q.length >= 2 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              ผลการค้นหา "{query}"
            </span>
            <span className={`text-sm font-medium ${results.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
              พบ {results.length} รายการ
            </span>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Search size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">ไม่พบ SN หรืออุปกรณ์ที่ตรงกับ "{query}"</p>
              <p className="text-xs mt-1">ลองค้นหาด้วย SN ส่วนหนึ่ง หรือรุ่นอุปกรณ์</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    {['Serial No.', 'Item No.', 'Model', 'ประเภท', 'iSolarCloud', 'สถานะ', 'โครงการ'].map(h => (
                      <th key={h} className="pb-2 pt-3 px-4 text-xs text-gray-400 font-medium whitespace-nowrap first:pl-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {results.map((item, idx) => (
                    <tr key={`${item.sn}-${idx}`} className="hover:bg-blue-50 transition-colors">
                      <td className="py-3 pl-5 pr-4">
                        <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">{item.sn}</span>
                      </td>
                      <td className="py-3 pr-4 text-xs text-gray-600">{item.itemNo}</td>
                      <td className="py-3 pr-4 text-xs font-medium text-gray-700">{item.model}</td>
                      <td className="py-3 pr-4">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.typeLabel}</span>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        {item.iSolarCloud
                          ? <Cloud size={15} className="text-amber-500 mx-auto" />
                          : <CloudOff size={15} className="text-gray-300 mx-auto" />
                        }
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[item.commissionStatus]}`}>
                          {STATUS_LABEL[item.commissionStatus]}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <Link
                          to={`/projects/${item.projectId}`}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline whitespace-nowrap"
                        >
                          <span className="max-w-36 truncate">{item.projectRef}</span>
                          <ArrowRight size={11} />
                        </Link>
                        <div className="text-xs text-gray-400 truncate max-w-36">{item.customer}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!query && (
        <div className="text-center py-16 text-gray-300">
          <Search size={56} className="mx-auto mb-4 opacity-30" />
          <p className="text-base text-gray-400">ค้นหา SN หรืออุปกรณ์ที่ต้องการ</p>
          <p className="text-sm mt-1">รองรับการค้นหาด้วย Serial No., Item No. และ Model</p>
        </div>
      )}
    </div>
  )
}
