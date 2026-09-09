export const DEVICE_TYPES = {
  inverter: { label: 'อินเวอร์เตอร์', prefix: 'MINV-', color: 'blue' },
  optimizer: { label: 'ออปทิไมเซอร์', prefix: 'MOTM-', color: 'purple' },
  rapidShutdown: { label: 'Rapid Shutdown', prefix: 'MRSD-', color: 'orange' },
  logger: { label: 'Data Logger', prefix: 'MDLG-', color: 'teal' },
  meter: { label: 'Energy Meter', prefix: 'MEMT-', color: 'green' },
  mounting: { label: 'Mounting', prefix: 'MMNT-', color: 'gray' },
}

export const DEVICE_TAB_COLOR = {
  inverter: 'bg-blue-100 text-blue-700',
  optimizer: 'bg-purple-100 text-purple-700',
  rapidShutdown: 'bg-orange-100 text-orange-700',
  logger: 'bg-teal-100 text-teal-700',
  meter: 'bg-green-100 text-green-700',
  mounting: 'bg-gray-100 text-gray-700',
}

export const STATUS_LABEL = {
  pending: 'รอดำเนินการ',
  in_progress: 'กำลังดำเนินการ',
  completed: 'เสร็จสิ้น',
  issue: 'มีปัญหา',
}

export const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  issue: 'bg-red-100 text-red-700',
}

export const PROJECT_STATUS_LABEL = {
  pending: 'รอดำเนินการ',
  in_progress: 'กำลังดำเนินการ',
  completed: 'เสร็จสิ้น',
}

export const PROJECT_STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
}

export const GROUP_NAME_MAP = {
  'M-INVERTER': 'inverter',
  'M-OPTIMIZER': 'optimizer',
  'M-RAPID SHUTDOWN': 'rapidShutdown',
  'M-DATA LOGGER': 'logger',
  'M-ENERGY METER': 'meter',
  'M-MOUNTING': 'mounting',
}

export function getDeviceList(project) {
  return [
    ...project.devices.inverter,
    ...project.devices.optimizer,
    ...project.devices.rapidShutdown,
    ...project.devices.logger,
    ...project.devices.meter,
  ]
}

export function getProjectStats(project) {
  const all = getDeviceList(project)
  const total = all.length
  const completed = all.filter(d => d.commissionStatus === 'completed').length
  const pending = all.filter(d => d.commissionStatus === 'pending').length
  const inProgress = all.filter(d => d.commissionStatus === 'in_progress').length
  const issues = all.filter(d => d.commissionStatus === 'issue').length
  const iSolarCloudCount = all.filter(d => d.iSolarCloud).length
  return {
    total,
    completed,
    pending,
    inProgress,
    issues,
    iSolarCloudCount,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  }
}

// Mock data for Import/Export jobs management
export const inverterModels = [
  { brand: 'Sungrow', models: ['SG20RT', 'SG5.0RS', 'SG125CX-P2', 'SG250HX', 'SG3.0K-D'] },
  { brand: 'Huawei', models: ['SUN2000-5-10KTL-M0', 'SUN2000-25KTL-M0'] },
  { brand: 'SMA', models: ['Sunny Boy 5.0', 'Sunny Boy 10'] },
]

export const technicians = [
  { id: 1, name: 'นายสมชาย ใจดี' },
  { id: 2, name: 'นายวิชัย เก่งงาน' },
  { id: 3, name: 'นายประยุทธ์ สมาร์ท' },
  { id: 4, name: 'นายสุรชัย วิเชียร' },
  { id: 5, name: 'นางสาวมาลี รักงาน' },
]

export const customers = [
  { id: 1, name: 'บริษัท เสริมสร้างพลังงาน จำกัด' },
  { id: 2, name: 'บริษัท ซันฟู้ด อินเตอร์เนชั่นแนล จำกัด' },
  { id: 3, name: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)' },
  { id: 4, name: 'บริษัท อัลเทอร์วิม เอนเนอร์จี้ จำกัด' },
  { id: 5, name: 'คลินิก ฟิโอร่า สกิน' },
]

export const jobs = [
  {
    id: 'JOB-2024-001',
    type: 'commissioning',
    status: 'completed',
    priority: 'high',
    customerName: 'บริษัท เสริมสร้างพลังงาน จำกัด',
    site: 'โรงงาน WHA ระยอง',
    address: '123 หมู่ 5 ถนนสาย 3 ระยอง',
    scheduledDate: '2024-03-15',
    technicianName: 'นายสมชาย ใจดี',
    inverterBrand: 'Sungrow',
    inverterModel: 'SG125CX-P2',
    serialNo: 'A2532428413',
    capacity: 250,
    notes: 'เสร็จสิ้นสมบูรณ์',
  },
  {
    id: 'JOB-2024-002',
    type: 'commissioning',
    status: 'in_progress',
    priority: 'medium',
    customerName: 'บริษัท ซันฟู้ด อินเตอร์เนชั่นแนล จำกัด',
    site: 'โรงงาน 3 ชั้น',
    address: '456 ถนนประชาชื่น กรุงเทพ',
    scheduledDate: '2024-04-20',
    technicianName: 'นายวิชัย เก่งงาน',
    inverterBrand: 'Sungrow',
    inverterModel: 'SG20RT',
    serialNo: 'A2541209813',
    capacity: 50,
    notes: 'กำลังดำเนินการ',
  },
  {
    id: 'JOB-2024-003',
    type: 'inspection',
    status: 'scheduled',
    priority: 'medium',
    customerName: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
    site: 'สาขา 7-Eleven PH4',
    address: '789 ถนนสาย 5 ฉะเชิงเทรา',
    scheduledDate: '2024-05-10',
    technicianName: 'นายประยุทธ์ สมาร์ท',
    inverterBrand: 'Sungrow',
    inverterModel: 'SG5.0RS',
    serialNo: 'A2538147201',
    capacity: 15,
    notes: 'ตรวจสอบประจำปี',
  },
  {
    id: 'JOB-2024-004',
    type: 'maintenance',
    status: 'pending',
    priority: 'low',
    customerName: 'บริษัท อัลเทอร์วิม เอนเนอร์จี้ จำกัด',
    site: 'โรงไฟฟ้า 100MW',
    address: '111 จังหวัดชัยภูมิ',
    scheduledDate: '2024-06-05',
    technicianName: 'นายสุรชัย วิเชียร',
    inverterBrand: 'Sungrow',
    inverterModel: 'SG250HX',
    serialNo: 'A2564321001',
    capacity: 500,
    notes: 'PM ประจำปี',
  },
]

export const PROJECTS = [
  {
    id: 'P001',
    projectRef: 'โครงการ Sermsang 35MW',
    iSolarCloudName: 'Sermsang_35MW',
    customer: 'บริษัท เสริมสร้างพลังงาน จำกัด',
    soNumber: 'SO-2025-0891',
    deliveryDate: '2025-05-19',
    commissioningDate: '2025-06-01',
    status: 'in_progress',
    technician: 'นายสมชาย ใจดี',
    notes: 'ติดตั้งที่จังหวัดนครราชสีมา แบ่ง 4 zones',
    devices: {
      inverter: [
        { sn: 'A2532428413', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2532428341', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2532428312', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2532428299', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2532428271', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2532428254', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2532428237', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2532428218', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2532428203', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: 'A2532428189', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: 'A2532428175', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: 'A2532428162', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: 'A2532428148', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: 'A2532428133', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: 'A2532428119', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: 'A2532428104', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: false, commissionStatus: 'in_progress' },
        { sn: 'A2532428091', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: false, commissionStatus: 'in_progress' },
        { sn: 'A2532428078', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: false, commissionStatus: 'in_progress' },
        { sn: 'A2532428064', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: false, commissionStatus: 'pending' },
        { sn: 'A2532428051', itemNo: 'MINV-SG125CX-P210-01', model: 'SG125CX-P2', iSolarCloud: false, commissionStatus: 'pending' },
      ],
      optimizer: [],
      rapidShutdown: [],
      logger: [
        { sn: 'A2471738282', itemNo: 'MDLG-SGC10003', model: 'SGC1000-3', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2471738264', itemNo: 'MDLG-SGC10003', model: 'SGC1000-3', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2471738251', itemNo: 'MDLG-SGC10003', model: 'SGC1000-3', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2471738238', itemNo: 'MDLG-SGC10003', model: 'SGC1000-3', iSolarCloud: false, commissionStatus: 'pending' },
        { sn: 'A2471738217', itemNo: 'MDLG-SGC10003', model: 'SGC1000-3', iSolarCloud: false, commissionStatus: 'pending' },
      ],
      meter: [],
      mounting: [
        { id: 'm1', itemNo: 'MMNT-RAIL-4200', description: 'Aluminum Rail 4.2m', quantity: 500 },
        { id: 'm2', itemNo: 'MMNT-CLAMP-MID', description: 'Mid Clamp', quantity: 2000 },
        { id: 'm3', itemNo: 'MMNT-CLAMP-END', description: 'End Clamp', quantity: 500 },
        { id: 'm4', itemNo: 'MMNT-BOLT-M8', description: 'Bolt M8x30', quantity: 5000 },
      ],
    },
  },
  {
    id: 'P002',
    projectRef: 'โครงการ Sunfood',
    iSolarCloudName: 'Sunfood_Factory',
    customer: 'บริษัท ซันฟู้ด อินเตอร์เนชั่นแนล จำกัด',
    soNumber: 'SO-2025-0543',
    deliveryDate: '2025-03-10',
    commissioningDate: '2025-03-25',
    status: 'completed',
    technician: 'นายวิชัย เก่งงาน',
    notes: 'ติดตั้ง rooftop โรงงาน 3 ชั้น เสร็จสิ้นสมบูรณ์',
    devices: {
      inverter: [
        { sn: 'A2541209813', itemNo: 'MINV-SG20RT-01', model: 'SG20RT', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2541209798', itemNo: 'MINV-SG20RT-01', model: 'SG20RT', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2541209784', itemNo: 'MINV-SG20RT-01', model: 'SG20RT', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2541209771', itemNo: 'MINV-SG20RT-01', model: 'SG20RT', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2541209758', itemNo: 'MINV-SG20RT-01', model: 'SG20RT', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2541209744', itemNo: 'MINV-SG20RT-01', model: 'SG20RT', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2541209731', itemNo: 'MINV-SG20RT-01', model: 'SG20RT', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2541209718', itemNo: 'MINV-SG20RT-01', model: 'SG20RT', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2541209704', itemNo: 'MINV-SG20RT-01', model: 'SG20RT', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2541209691', itemNo: 'MINV-SG20RT-01', model: 'SG20RT', iSolarCloud: true, commissionStatus: 'completed' },
      ],
      optimizer: [],
      rapidShutdown: [
        { sn: '1291847301', itemNo: 'MRSD-SSD040-01', model: 'SSD040', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '1291847302', itemNo: 'MRSD-SSD040-01', model: 'SSD040', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '1291847303', itemNo: 'MRSD-SSD040-01', model: 'SSD040', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '1291847304', itemNo: 'MRSD-SSD040-01', model: 'SSD040', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '1291847305', itemNo: 'MRSD-SSD040-01', model: 'SSD040', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '1291847306', itemNo: 'MRSD-SSD040-01', model: 'SSD040', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '1291847307', itemNo: 'MRSD-SSD040-01', model: 'SSD040', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '1291847308', itemNo: 'MRSD-SSD040-01', model: 'SSD040', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '1291847309', itemNo: 'MRSD-SSD040-01', model: 'SSD040', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '1291847310', itemNo: 'MRSD-SSD040-01', model: 'SSD040', iSolarCloud: false, commissionStatus: 'completed' },
      ],
      logger: [],
      meter: [],
      mounting: [],
    },
  },
  {
    id: 'P003',
    projectRef: 'โครงการ Solar 7-Eleven PH4',
    iSolarCloudName: 'SEven_PH4_2025',
    customer: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
    soNumber: 'SO-2025-1024',
    deliveryDate: '2025-06-20',
    commissioningDate: '2025-07-05',
    status: 'in_progress',
    technician: 'นายประยุทธ์ สมาร์ท',
    notes: 'Phase 4 ครอบคลุม 15 สาขา มีอุปกรณ์บางชิ้นรอการตรวจสอบ',
    devices: {
      inverter: [
        { sn: 'A2538147201', itemNo: 'MINV-SG5RS-01', model: 'SG5.0RS', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2538147188', itemNo: 'MINV-SG5RS-01', model: 'SG5.0RS', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2538147175', itemNo: 'MINV-SG5RS-01', model: 'SG5.0RS', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2538147162', itemNo: 'MINV-SG5RS-01', model: 'SG5.0RS', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2538147149', itemNo: 'MINV-SG5RS-01', model: 'SG5.0RS', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2538147136', itemNo: 'MINV-SG5RS-01', model: 'SG5.0RS', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2538147123', itemNo: 'MINV-SG5RS-01', model: 'SG5.0RS', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: 'A2538147110', itemNo: 'MINV-SG5RS-01', model: 'SG5.0RS', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: 'A2538147097', itemNo: 'MINV-SG5RS-01', model: 'SG5.0RS', iSolarCloud: false, commissionStatus: 'in_progress' },
        { sn: 'A2538147084', itemNo: 'MINV-SG5RS-01', model: 'SG5.0RS', iSolarCloud: false, commissionStatus: 'in_progress' },
        { sn: 'A2538147071', itemNo: 'MINV-SG5RS-01', model: 'SG5.0RS', iSolarCloud: false, commissionStatus: 'in_progress' },
        { sn: 'A2538147058', itemNo: 'MINV-SG5RS-01', model: 'SG5.0RS', iSolarCloud: false, commissionStatus: 'in_progress' },
        { sn: 'A2538147045', itemNo: 'MINV-SG5RS-01', model: 'SG5.0RS', iSolarCloud: false, commissionStatus: 'issue' },
        { sn: 'A2538147032', itemNo: 'MINV-SG5RS-01', model: 'SG5.0RS', iSolarCloud: false, commissionStatus: 'pending' },
        { sn: 'A2538147019', itemNo: 'MINV-SG5RS-01', model: 'SG5.0RS', iSolarCloud: false, commissionStatus: 'pending' },
      ],
      optimizer: [],
      rapidShutdown: [],
      logger: [],
      meter: [
        { sn: '251876543210', itemNo: 'MEMT-DTSU666-01', model: 'DTSU666-H', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '251876543221', itemNo: 'MEMT-DTSU666-01', model: 'DTSU666-H', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '251876543232', itemNo: 'MEMT-DTSU666-01', model: 'DTSU666-H', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '251876543243', itemNo: 'MEMT-DTSU666-01', model: 'DTSU666-H', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '251876543254', itemNo: 'MEMT-DTSU666-01', model: 'DTSU666-H', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '251876543265', itemNo: 'MEMT-DTSU666-01', model: 'DTSU666-H', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '251876543276', itemNo: 'MEMT-DTSU666-01', model: 'DTSU666-H', iSolarCloud: false, commissionStatus: 'pending' },
        { sn: '251876543287', itemNo: 'MEMT-DTSU666-01', model: 'DTSU666-H', iSolarCloud: false, commissionStatus: 'pending' },
        { sn: '251876543298', itemNo: 'MEMT-DTSU666-01', model: 'DTSU666-H', iSolarCloud: false, commissionStatus: 'pending' },
        { sn: '251876543309', itemNo: 'MEMT-DTSU666-01', model: 'DTSU666-H', iSolarCloud: false, commissionStatus: 'pending' },
      ],
      mounting: [],
    },
  },
  {
    id: 'P004',
    projectRef: 'โครงการ Altervim 100MW',
    iSolarCloudName: 'Altervim_100MW',
    customer: 'บริษัท อัลเทอร์วิม เอนเนอร์จี้ จำกัด',
    soNumber: 'SO-2025-0287',
    deliveryDate: '2025-07-15',
    commissioningDate: '',
    status: 'pending',
    technician: 'นายสุรชัย วิเชียร',
    notes: 'Large scale 100MW ที่จังหวัดชัยภูมิ แบ่ง 8 zones กำลังเริ่มดำเนินการ',
    devices: {
      inverter: [
        { sn: 'A2564321001', itemNo: 'MINV-SG250HX-01', model: 'SG250HX', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2564321014', itemNo: 'MINV-SG250HX-01', model: 'SG250HX', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2564321027', itemNo: 'MINV-SG250HX-01', model: 'SG250HX', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: 'A2564321040', itemNo: 'MINV-SG250HX-01', model: 'SG250HX', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: 'A2564321053', itemNo: 'MINV-SG250HX-01', model: 'SG250HX', iSolarCloud: false, commissionStatus: 'in_progress' },
        { sn: 'A2564321066', itemNo: 'MINV-SG250HX-01', model: 'SG250HX', iSolarCloud: false, commissionStatus: 'in_progress' },
        { sn: 'A2564321079', itemNo: 'MINV-SG250HX-01', model: 'SG250HX', iSolarCloud: false, commissionStatus: 'in_progress' },
        { sn: 'A2564321082', itemNo: 'MINV-SG250HX-01', model: 'SG250HX', iSolarCloud: false, commissionStatus: 'in_progress' },
        { sn: 'A2564321095', itemNo: 'MINV-SG250HX-01', model: 'SG250HX', iSolarCloud: false, commissionStatus: 'pending' },
        { sn: 'A2564321108', itemNo: 'MINV-SG250HX-01', model: 'SG250HX', iSolarCloud: false, commissionStatus: 'pending' },
        { sn: 'A2564321121', itemNo: 'MINV-SG250HX-01', model: 'SG250HX', iSolarCloud: false, commissionStatus: 'pending' },
        { sn: 'A2564321134', itemNo: 'MINV-SG250HX-01', model: 'SG250HX', iSolarCloud: false, commissionStatus: 'pending' },
      ],
      optimizer: [],
      rapidShutdown: [],
      logger: [
        { sn: 'A2478192837', itemNo: 'MDLG-SGC10003', model: 'SGC1000-3', iSolarCloud: false, commissionStatus: 'pending' },
        { sn: 'A2478192850', itemNo: 'MDLG-SGC10003', model: 'SGC1000-3', iSolarCloud: false, commissionStatus: 'pending' },
        { sn: 'A2478192863', itemNo: 'MDLG-SGC10003', model: 'SGC1000-3', iSolarCloud: false, commissionStatus: 'pending' },
      ],
      meter: [
        { sn: '251923456789', itemNo: 'MEMT-DTSU666-01', model: 'DTSU666-H', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '251923456800', itemNo: 'MEMT-DTSU666-01', model: 'DTSU666-H', iSolarCloud: false, commissionStatus: 'completed' },
        { sn: '251923456811', itemNo: 'MEMT-DTSU666-01', model: 'DTSU666-H', iSolarCloud: false, commissionStatus: 'pending' },
        { sn: '251923456822', itemNo: 'MEMT-DTSU666-01', model: 'DTSU666-H', iSolarCloud: false, commissionStatus: 'pending' },
        { sn: '251923456833', itemNo: 'MEMT-DTSU666-01', model: 'DTSU666-H', iSolarCloud: false, commissionStatus: 'pending' },
      ],
      mounting: [
        { id: 'm1', itemNo: 'MMNT-RAIL-4200', description: 'Aluminum Rail 4.2m', quantity: 2000 },
        { id: 'm2', itemNo: 'MMNT-CLAMP-MID', description: 'Mid Clamp', quantity: 8000 },
        { id: 'm3', itemNo: 'MMNT-CLAMP-END', description: 'End Clamp', quantity: 2000 },
        { id: 'm4', itemNo: 'MMNT-BOLT-M8', description: 'Bolt M8x30', quantity: 20000 },
        { id: 'm5', itemNo: 'MMNT-GROUND-KIT', description: 'Grounding Kit', quantity: 800 },
      ],
    },
  },
  {
    id: 'P005',
    projectRef: 'โครงการ FIORA SKIN CLINIC',
    iSolarCloudName: 'Fiora_Clinic',
    customer: 'คลินิก ฟิโอร่า สกิน',
    soNumber: 'SO-2025-1287',
    deliveryDate: '2025-07-30',
    commissioningDate: '2025-08-05',
    status: 'completed',
    technician: 'นางสาวมาลี รักงาน',
    notes: 'ระบบ Solar ขนาดเล็กสำหรับคลินิกความงาม เสร็จสมบูรณ์',
    devices: {
      inverter: [
        { sn: 'A2537891234', itemNo: 'MINV-SG3K-01', model: 'SG3.0K-D', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2537891247', itemNo: 'MINV-SG3K-01', model: 'SG3.0K-D', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2537891260', itemNo: 'MINV-SG3K-01', model: 'SG3.0K-D', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2537891273', itemNo: 'MINV-SG3K-01', model: 'SG3.0K-D', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2537891286', itemNo: 'MINV-SG3K-01', model: 'SG3.0K-D', iSolarCloud: true, commissionStatus: 'completed' },
        { sn: 'A2537891299', itemNo: 'MINV-SG3K-01', model: 'SG3.0K-D', iSolarCloud: true, commissionStatus: 'completed' },
      ],
      optimizer: [],
      rapidShutdown: [],
      logger: [],
      meter: [],
      mounting: [],
    },
  },
]
