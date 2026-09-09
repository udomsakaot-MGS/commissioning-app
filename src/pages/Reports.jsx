import * as XLSX from 'xlsx'
import { useData } from '../App'
import {
  getProjectStats, getDeviceList, DEVICE_TYPES,
  STATUS_LABEL, PROJECT_STATUS_LABEL, PROJECT_STATUS_BADGE,
  STATUS_BADGE,
} from '../data/mockData'
import { Download, Cloud, CheckCircle, AlertTriangle, Layers, FolderOpen } from 'lucide-react'

export default function Reports() {
  const { projects } = useData()

  const allDevices = projects.flatMap(p => getDeviceList(p))
  const totalSNs = allDevices.length
  const totalCommissioned = allDevices.filter(d => d.commissionStatus === 'completed').length
  const totalIssues = allDevices.filter(d => d.commissionStatus === 'issue').length
  const totalISolarCloud = allDevices.filter(d => d.iSolarCloud).length

  function exportToExcel() {
    const wb = XLSX.utils.book_new()

    const summary = projects.map(p => {
      const s = getProjectStats(p)
      const deviceBreakdown = Object.entries(DEVICE_TYPES)
        .map(([type, cfg]) => `${cfg.label}: ${(p.devices[type] || []).length}`)
        .filter(x => !x.endsWith(': 0'))
        .join(', ')
      return {
        'โครงการ': p.projectRef,
        'ลูกค้า': p.customer,
        'SO Number': p.soNumber,
        'สถานะ': PROJECT_STATUS_LABEL[p.status],
        'วันส่งมอบ': p.deliveryDate,
        'วัน Commissioning': p.commissioningDate,
        'ช่างเทคนิค': p.technician,
        'SN ทั้งหมด': s.total,
        'เสร็จสิ้น': s.completed,
        'กำลังดำเนินการ': s.inProgress,
        'รอดำเนินการ': s.pending,
        'มีปัญหา': s.issues,
        'iSolarCloud': s.iSolarCloudCount,
        'ความคืบหน้า (%)': s.percent,
        'อุปกรณ์': deviceBreakdown,
      }
    })

    const summaryWs = XLSX.utils.json_to_sheet(summary)
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

    projects.forEach(p => {
      const rows = []
      Object.entries(DEVICE_TYPES).forEach(([type, cfg]) => {
        const devs = p.devices[type] || []
        devs.forEach(d => {
          if (!d.sn) return
          rows.push({
            'ประเภท': cfg.label,
            'Serial No.': d.sn,
            'Item No.': d.itemNo,
            'Model': d.model,
            'iSolarCloud': d.iSolarCloud ? 'Yes' : 'No',
            'สถานะ Commissioning': STATUS_LABEL[d.commissionStatus],
          })
        })
      })
      if (rows.length === 0) return
      const ws = XLSX.utils.json_to_sheet(rows)
      const name = p.projectRef.replace(/[:\\/\[\]*?]/g, '_').slice(0, 31)
      XLSX.utils.book_append_sheet(wb, ws, name)
    })

    XLSX.writeFile(wb, `Commissioning_Report_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">รายงาน</h1>
          <p className="text-gray-500 text-sm mt-1">สรุปผลการดำเนินการ Commissioning ทุกโครงการ</p>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Download size={16} />
          ส่งออก Excel
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportKPI icon={<FolderOpen className="text-blue-600" size={20} />} bg="bg-blue-50" value={projects.length} label="โครงการทั้งหมด" unit="โครงการ" />
        <ReportKPI icon={<Layers className="text-gray-600" size={20} />} bg="bg-gray-100" value={totalSNs} label="SN ทั้งหมด" unit="รายการ" />
        <ReportKPI icon={<CheckCircle className="text-green-600" size={20} />} bg="bg-green-50" value={totalCommissioned} label="Commissioned แล้ว" unit="รายการ" />
        <ReportKPI icon={<Cloud className="text-amber-600" size={20} />} bg="bg-amber-50" value={totalISolarCloud} label="iSolarCloud แล้ว" unit="รายการ" />
      </div>

      {totalIssues > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 flex items-center gap-2 text-red-700 text-sm">
          <AlertTriangle size={16} />
          <span>มีอุปกรณ์รายงานปัญหา <strong>{totalIssues}</strong> รายการ — กรุณาตรวจสอบในหน้าโครงการ</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">สรุปรายโครงการ</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                {['โครงการ', 'ลูกค้า', 'สถานะ', 'SN ทั้งหมด', 'เสร็จ', 'กำลังทำ', 'รอ', 'ปัญหา', 'iSolarCloud', 'ความคืบหน้า'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs text-gray-500 font-medium whitespace-nowrap first:pl-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {projects.map(p => {
                const s = getProjectStats(p)
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 pl-5">
                      <span className="font-medium text-gray-800 text-sm">{p.projectRef}</span>
                      <div className="text-xs text-gray-400 mt-0.5">{p.technician || '-'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-40">
                      <div className="truncate">{p.customer}</div>
                      <div className="text-gray-400 mt-0.5">{p.soNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PROJECT_STATUS_BADGE[p.status]}`}>
                        {PROJECT_STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-gray-800">{s.total}</td>
                    <td className="px-4 py-3 text-center text-green-600 font-medium">{s.completed}</td>
                    <td className="px-4 py-3 text-center text-blue-600 font-medium">{s.inProgress}</td>
                    <td className="px-4 py-3 text-center text-amber-600 font-medium">{s.pending}</td>
                    <td className="px-4 py-3 text-center">
                      {s.issues > 0
                        ? <span className="text-red-600 font-medium flex items-center justify-center gap-1"><AlertTriangle size={12} />{s.issues}</span>
                        : <span className="text-gray-300">-</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-medium ${s.iSolarCloudCount > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {s.iSolarCloudCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-24">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${s.percent === 100 ? 'bg-green-500' : s.issues > 0 ? 'bg-red-400' : 'bg-blue-500'}`}
                            style={{ width: `${s.percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600 w-8 text-right">{s.percent}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50 border-t-2 border-blue-200 font-medium">
                <td className="px-4 py-3 pl-5 font-bold text-blue-900">รวม</td>
                <td className="px-4 py-3 text-xs text-gray-500">{projects.length} โครงการ</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-center font-bold text-gray-900">{totalSNs}</td>
                <td className="px-4 py-3 text-center font-bold text-green-700">{totalCommissioned}</td>
                <td className="px-4 py-3 text-center font-bold text-blue-700">{allDevices.filter(d => d.commissionStatus === 'in_progress').length}</td>
                <td className="px-4 py-3 text-center font-bold text-amber-700">{allDevices.filter(d => d.commissionStatus === 'pending').length}</td>
                <td className="px-4 py-3 text-center font-bold text-red-700">{totalIssues}</td>
                <td className="px-4 py-3 text-center font-bold text-amber-700">{totalISolarCloud}</td>
                <td className="px-4 py-3 text-sm font-bold text-blue-900">
                  {totalSNs > 0 ? Math.round((totalCommissioned / totalSNs) * 100) : 0}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">สรุปตามประเภทอุปกรณ์</h2>
          <div className="space-y-4">
            {Object.entries(DEVICE_TYPES).map(([type, cfg]) => {
              const all = projects.flatMap(p => p.devices[type] || [])
              if (all.length === 0) return null
              const snDevices = all.filter(d => d.sn)
              const completed = snDevices.filter(d => d.commissionStatus === 'completed').length
              const pct = snDevices.length > 0 ? Math.round((completed / snDevices.length) * 100) : 0
              const barColor = { inverter: 'bg-blue-500', optimizer: 'bg-purple-500', rapidShutdown: 'bg-orange-500', logger: 'bg-teal-500', meter: 'bg-green-500', mounting: 'bg-gray-400' }[type]
              return (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-700">{cfg.label}</span>
                    <span className="text-gray-500 text-xs">{completed}/{snDevices.length} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">อุปกรณ์ที่มีปัญหา</h2>
          {totalIssues === 0 ? (
            <div className="text-center py-8 text-gray-300">
              <CheckCircle size={36} className="mx-auto mb-2" />
              <p className="text-sm text-gray-400">ไม่มีอุปกรณ์ที่รายงานปัญหา</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.flatMap(p =>
                Object.entries(p.devices).flatMap(([type, devs]) =>
                  Array.isArray(devs)
                    ? devs.filter(d => d.commissionStatus === 'issue').map(d => (
                        <div key={d.sn} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2 text-xs border border-red-100">
                          <div>
                            <span className="font-mono text-gray-700">{d.sn}</span>
                            <span className="text-gray-400 mx-2">·</span>
                            <span className="text-gray-600">{d.model}</span>
                          </div>
                          <span className="text-gray-600">{p.projectRef.replace('โครงการ ', '')}</span>
                        </div>
                      ))
                    : []
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ReportKPI({ icon, bg, value, label, unit }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-400">{unit}</div>
      <div className="text-sm text-gray-600 mt-0.5">{label}</div>
    </div>
  )
}
