import ExcelImport from './ExcelImport'
import ImportExport from './ImportExport'

export default function ExcelManagement() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">นำเข้า / จัดการข้อมูล Excel</h1>
        <p className="text-gray-500 text-sm mt-1">
          ทำงานทั้งสองอย่างพร้อมกันได้ — นำเข้า Serial Numbers จาก DN และจัดการข้อมูล Commissioning Jobs
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Import Serial Numbers */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-1">📋 นำเข้า Serial Numbers จาก DN</h2>
          <p className="text-sm text-blue-700 mb-6">
            นำเข้าข้อมูลอุปกรณ์จากไฟล์ DN1 สร้าง Commissioning Tickets โดยอัตโนมัติ
          </p>
          <div className="bg-white rounded-lg p-4">
            <ExcelImport />
          </div>
        </div>

        {/* Right Column: Manage Jobs */}
        <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-200 p-6">
          <h2 className="text-lg font-semibold text-green-900 mb-1">🛠️ จัดการ Excel Jobs</h2>
          <p className="text-sm text-green-700 mb-6">
            นำเข้า/ส่งออกข้อมูล Commissioning Jobs ตรวจสอบกับ iSolarCloud ยืนยันก่อนบันทึก
          </p>
          <div className="bg-white rounded-lg p-4">
            <ImportExport />
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-900">
          💡 <strong>เคล็ดลับ:</strong> คุณสามารถนำเข้า Serial Numbers ทางซ้ายเพื่อสร้าง Tickets พร้อมกับจัดการข้อมูล Jobs ทางขวาได้ทันทีโดยไม่ต้องสลับแท็บ
        </p>
      </div>
    </div>
  )
}
