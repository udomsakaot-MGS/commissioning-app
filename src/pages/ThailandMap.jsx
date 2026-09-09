import { useState, useEffect, useMemo } from 'react'
import { MapPin, Cloud, Package, Search, RefreshCw, Info } from 'lucide-react'

// Province coordinate data (approximate centroid, Thai name, region)
const PROVINCE_DATA = {
  'Bangkok':               { lat: 13.75, lon: 100.52, th: 'กรุงเทพฯ',           region: 'กลาง' },
  'Chon Buri':             { lat: 13.36, lon: 100.98, th: 'ชลบุรี',             region: 'ตะวันออก' },
  'Nonthaburi':            { lat: 13.86, lon: 100.52, th: 'นนทบุรี',            region: 'กลาง' },
  'Pathum Thani':          { lat: 14.01, lon: 100.52, th: 'ปทุมธานี',           region: 'กลาง' },
  'Samut Prakan':          { lat: 13.60, lon: 100.60, th: 'สมุทรปราการ',        region: 'กลาง' },
  'Samut Sakhon':          { lat: 13.53, lon: 100.27, th: 'สมุทรสาคร',         region: 'กลาง' },
  'Rayong':                { lat: 12.68, lon: 101.28, th: 'ระยอง',              region: 'ตะวันออก' },
  'Nakhon Pathom':         { lat: 13.82, lon: 100.04, th: 'นครปฐม',            region: 'กลาง' },
  'Nakhon Ratchasima':     { lat: 14.97, lon: 102.10, th: 'นครราชสีมา',        region: 'ตะวันออกเฉียงเหนือ' },
  'Saraburi':              { lat: 14.53, lon: 100.91, th: 'สระบุรี',            region: 'กลาง' },
  'Chachoengsao':          { lat: 13.69, lon: 101.07, th: 'ฉะเชิงเทรา',        region: 'ตะวันออก' },
  'Khon Kaen':             { lat: 16.43, lon: 102.84, th: 'ขอนแก่น',           region: 'ตะวันออกเฉียงเหนือ' },
  'Ayutthaya':             { lat: 14.36, lon: 100.58, th: 'พระนครศรีอยุธยา',   region: 'กลาง' },
  'Chiang Mai':            { lat: 18.79, lon: 98.98,  th: 'เชียงใหม่',          region: 'เหนือ' },
  'Nakhon Si Thammarat':   { lat: 8.43,  lon: 100.00, th: 'นครศรีธรรมราช',     region: 'ใต้' },
  'Surat Thani':           { lat: 9.14,  lon: 99.33,  th: 'สุราษฎร์ธานี',      region: 'ใต้' },
  'Songkhla':              { lat: 7.19,  lon: 100.61, th: 'สงขลา',              region: 'ใต้' },
  'Phuket':                { lat: 7.98,  lon: 98.37,  th: 'ภูเก็ต',             region: 'ใต้' },
  'Lopburi':               { lat: 14.80, lon: 100.65, th: 'ลพบุรี',             region: 'กลาง' },
  'Suphanburi':            { lat: 14.47, lon: 100.13, th: 'สุพรรณบุรี',         region: 'กลาง' },
  'Suphan Buri':           { lat: 14.47, lon: 100.13, th: 'สุพรรณบุรี',         region: 'กลาง' },
  'Kanchanaburi':          { lat: 14.00, lon: 99.54,  th: 'กาญจนบุรี',          region: 'ตะวันตก' },
  'Ratchaburi':            { lat: 13.54, lon: 99.81,  th: 'ราชบุรี',            region: 'ตะวันตก' },
  'Phetchaburi':           { lat: 13.11, lon: 99.94,  th: 'เพชรบุรี',           region: 'ตะวันตก' },
  'Prachuap Khiri Khan':   { lat: 11.82, lon: 99.80,  th: 'ประจวบคีรีขันธ์',   region: 'ตะวันตก' },
  'Chumphon':              { lat: 10.49, lon: 99.18,  th: 'ชุมพร',              region: 'ใต้' },
  'Udon Thani':            { lat: 17.41, lon: 102.79, th: 'อุดรธานี',           region: 'ตะวันออกเฉียงเหนือ' },
  'Ubon Ratchathani':      { lat: 15.23, lon: 104.85, th: 'อุบลราชธานี',        region: 'ตะวันออกเฉียงเหนือ' },
  'Buriram':               { lat: 14.99, lon: 103.10, th: 'บุรีรัมย์',          region: 'ตะวันออกเฉียงเหนือ' },
  'Surin':                 { lat: 14.88, lon: 103.49, th: 'สุรินทร์',           region: 'ตะวันออกเฉียงเหนือ' },
  'Mukdahan':              { lat: 16.54, lon: 104.72, th: 'มุกดาหาร',           region: 'ตะวันออกเฉียงเหนือ' },
  'Chaiyaphum':            { lat: 15.80, lon: 102.03, th: 'ชัยภูมิ',            region: 'ตะวันออกเฉียงเหนือ' },
  'Roi Et':                { lat: 16.05, lon: 103.65, th: 'ร้อยเอ็ด',           region: 'ตะวันออกเฉียงเหนือ' },
  'Kalasin':               { lat: 16.43, lon: 103.51, th: 'กาฬสินธุ์',          region: 'ตะวันออกเฉียงเหนือ' },
  'Phitsanulok':           { lat: 16.82, lon: 100.27, th: 'พิษณุโลก',          region: 'เหนือ' },
  'Phetchabun':            { lat: 16.42, lon: 101.16, th: 'เพชรบูรณ์',          region: 'เหนือ' },
  'Nakhon Sawan':          { lat: 15.70, lon: 100.13, th: 'นครสวรรค์',          region: 'กลาง' },
  'Chiang Rai':            { lat: 19.91, lon: 99.83,  th: 'เชียงราย',           region: 'เหนือ' },
  'Lampang':               { lat: 18.29, lon: 99.49,  th: 'ลำปาง',              region: 'เหนือ' },
  'Sa Kaeo':               { lat: 13.82, lon: 102.06, th: 'สระแก้ว',            region: 'ตะวันออก' },
  'Chanthaburi':           { lat: 12.60, lon: 102.10, th: 'จันทบุรี',           region: 'ตะวันออก' },
  'Prachin Buri':          { lat: 14.05, lon: 101.37, th: 'ปราจีนบุรี',         region: 'ตะวันออก' },
  'Samut Songkhram':       { lat: 13.41, lon: 100.00, th: 'สมุทรสงคราม',       region: 'กลาง' },
  'Ang Thong':             { lat: 14.59, lon: 100.46, th: 'อ่างทอง',            region: 'กลาง' },
  'Sing Buri':             { lat: 14.89, lon: 100.40, th: 'สิงห์บุรี',          region: 'กลาง' },
  'Chainat':               { lat: 15.19, lon: 100.13, th: 'ชัยนาท',             region: 'กลาง' },
  'Nakhon Nayok':          { lat: 14.20, lon: 101.22, th: 'นครนายก',           region: 'กลาง' },
  'Trang':                 { lat: 7.56,  lon: 99.61,  th: 'ตรัง',               region: 'ใต้' },
  'Phatthalung':           { lat: 7.62,  lon: 100.07, th: 'พัทลุง',             region: 'ใต้' },
  'Krabi':                 { lat: 8.06,  lon: 98.91,  th: 'กระบี่',              region: 'ใต้' },
  'Phang Nga':             { lat: 8.45,  lon: 98.53,  th: 'พังงา',              region: 'ใต้' },
  'Ranong':                { lat: 9.98,  lon: 98.63,  th: 'ระนอง',              region: 'ใต้' },
  'Maha Sarakham':         { lat: 16.18, lon: 103.30, th: 'มหาสารคาม',          region: 'ตะวันออกเฉียงเหนือ' },
  'Nong Khai':             { lat: 17.88, lon: 102.74, th: 'หนองคาย',            region: 'ตะวันออกเฉียงเหนือ' },
  'Loei':                  { lat: 17.49, lon: 101.73, th: 'เลย',                region: 'ตะวันออกเฉียงเหนือ' },
  'Uttaradit':             { lat: 17.62, lon: 100.10, th: 'อุตรดิตถ์',          region: 'เหนือ' },
  'Sukhothai':             { lat: 17.01, lon: 99.83,  th: 'สุโขทัย',            region: 'เหนือ' },
  'Tak':                   { lat: 16.88, lon: 99.13,  th: 'ตาก',                region: 'เหนือ' },
  'Kamphaeng Phet':        { lat: 16.48, lon: 99.52,  th: 'กำแพงเพชร',          region: 'เหนือ' },
  'Uthai Thani':           { lat: 15.38, lon: 100.03, th: 'อุทัยธานี',          region: 'กลาง' },
  'Nakhon Phanom':         { lat: 17.39, lon: 104.78, th: 'นครพนม',             region: 'ตะวันออกเฉียงเหนือ' },
  'Sakon Nakhon':          { lat: 17.16, lon: 104.13, th: 'สกลนคร',             region: 'ตะวันออกเฉียงเหนือ' },
  'Yasothon':              { lat: 15.80, lon: 104.14, th: 'ยโสธร',              region: 'ตะวันออกเฉียงเหนือ' },
  'Amnat Charoen':         { lat: 15.87, lon: 104.63, th: 'อำนาจเจริญ',         region: 'ตะวันออกเฉียงเหนือ' },
  'Sisaket':               { lat: 15.12, lon: 104.33, th: 'ศรีสะเกษ',           region: 'ตะวันออกเฉียงเหนือ' },
  'Nong Bua Lamphu':       { lat: 17.20, lon: 102.44, th: 'หนองบัวลำภู',        region: 'ตะวันออกเฉียงเหนือ' },
  'Phichit':               { lat: 16.44, lon: 100.35, th: 'พิจิตร',             region: 'เหนือ' },
  'Nan':                   { lat: 18.78, lon: 100.78, th: 'น่าน',                region: 'เหนือ' },
  'Phrae':                 { lat: 18.15, lon: 100.14, th: 'แพร่',               region: 'เหนือ' },
  'Phayao':                { lat: 19.17, lon: 100.20, th: 'พะเยา',              region: 'เหนือ' },
  'Lamphun':               { lat: 18.57, lon: 99.02,  th: 'ลำพูน',              region: 'เหนือ' },
  'Mae Hong Son':          { lat: 19.30, lon: 97.97,  th: 'แม่ฮ่องสอน',         region: 'เหนือ' },
  'Narathiwat':            { lat: 6.43,  lon: 101.82, th: 'นราธิวาส',           region: 'ใต้' },
  'Pattani':               { lat: 6.87,  lon: 101.24, th: 'ปัตตานี',            region: 'ใต้' },
  'Yala':                  { lat: 6.54,  lon: 101.28, th: 'ยะลา',               region: 'ใต้' },
  'Satun':                 { lat: 6.62,  lon: 100.07, th: 'สตูล',               region: 'ใต้' },
}

// Thailand bounding box for SVG coordinate mapping
const LAT_MIN = 5.3, LAT_MAX = 20.7, LON_MIN = 97.2, LON_MAX = 106.0
const SVG_W = 340, SVG_H = 680

function toSVG(lat, lon) {
  return {
    x: Math.round(((lon - LON_MIN) / (LON_MAX - LON_MIN)) * SVG_W),
    y: Math.round(((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * SVG_H),
  }
}

function normalizeProvince(raw) {
  if (!raw) return null
  return raw
    .replace(/^Chang\s+Wat\s+/i, '')
    .replace(/^Changwat\s+/i, '')
    .replace('Krung Thep Maha Nakhon', 'Bangkok')
    .replace('Phra Nakhon Si Ayutthaya', 'Ayutthaya')
    .replace('Suphan Buri', 'Suphanburi')
    .trim()
}

function extractProvince(address) {
  if (!address) return null
  const match = address.match(/,\s*([^,\d]+?)\s+\d{5},\s*Thailand/i)
  if (!match) return null
  return normalizeProvince(match[1].trim())
}

const REGION_COLORS = {
  'กลาง': '#3b82f6',
  'ตะวันออก': '#8b5cf6',
  'ตะวันออกเฉียงเหนือ': '#f59e0b',
  'เหนือ': '#10b981',
  'ใต้': '#ef4444',
  'ตะวันตก': '#06b6d4',
}

export default function ThailandMap() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [filterRegion, setFilterRegion] = useState('all')
  const [sortBy, setSortBy] = useState('count')

  useEffect(() => {
    fetch('/isc-plants.json')
      .then(r => { if (!r.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ'); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const provinceCounts = useMemo(() => {
    if (!data) return {}
    const counts = {}
    data.plants.forEach(p => {
      const prov = extractProvince(p.address)
      if (!prov) return
      if (!counts[prov]) counts[prov] = { total: 0, mglobal: 0, power: 0, plants: [] }
      counts[prov].total++
      if (p.mglobal) counts[prov].mglobal++
      counts[prov].power += p.power || 0
      if (counts[prov].plants.length < 3) counts[prov].plants.push(p.plant)
    })
    return counts
  }, [data])

  const maxCount = useMemo(
    () => Math.max(...Object.values(provinceCounts).map(c => c.total), 1),
    [provinceCounts]
  )

  const filteredProvinces = useMemo(() => {
    const q = search.trim().toLowerCase()
    return Object.entries(provinceCounts)
      .filter(([name, c]) => {
        if (q && !name.toLowerCase().includes(q) && !(PROVINCE_DATA[name]?.th || '').includes(q)) return false
        if (filterRegion !== 'all' && PROVINCE_DATA[name]?.region !== filterRegion) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'count') return b[1].total - a[1].total
        if (sortBy === 'power') return b[1].power - a[1].power
        return (a[0]).localeCompare(b[0])
      })
  }, [provinceCounts, search, filterRegion, sortBy])

  const totalKwp = useMemo(
    () => Object.values(provinceCounts).reduce((s, c) => s + c.power, 0),
    [provinceCounts]
  )

  const unknownCount = useMemo(() => {
    if (!data) return 0
    return data.plants.filter(p => !extractProvince(p.address)).length
  }, [data])

  const regions = useMemo(
    () => [...new Set(Object.values(PROVINCE_DATA).map(p => p.region))].sort(),
    []
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 gap-3">
      <RefreshCw size={20} className="animate-spin" />
      <span>กำลังโหลดข้อมูลโรงไฟฟ้า...</span>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-64 text-red-500 gap-2">
      <Info size={18} /> {error}
    </div>
  )

  const selectedData = selected ? { name: selected, ...provinceCounts[selected], ...(PROVINCE_DATA[selected] || {}) } : null

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MapPin size={22} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">แผนที่โรงไฟฟ้า Solar</h1>
        </div>
        <p className="text-gray-400 text-sm">การกระจายตัวของโรงไฟฟ้าจาก iSolarCloud ทั่วประเทศไทย</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Cloud size={20} className="text-blue-600" />, bg: 'bg-blue-50', value: data.plants.length.toLocaleString(), label: 'โรงไฟฟ้าทั้งหมด', sub: `${Object.keys(provinceCounts).length} จังหวัด` },
          { icon: <MapPin size={20} className="text-purple-600" />, bg: 'bg-purple-50', value: Object.keys(provinceCounts).length, label: 'จังหวัดที่มีโครงการ', sub: `ใน ${regions.length} ภาค` },
          { icon: <Package size={20} className="text-emerald-600" />, bg: 'bg-emerald-50', value: data.plants.filter(p => p.mglobal).length.toLocaleString(), label: 'MGlobal ดูแล', sub: `${Math.round(data.plants.filter(p => p.mglobal).length / data.plants.length * 100)}% ของทั้งหมด` },
          { icon: <Cloud size={20} className="text-amber-600" />, bg: 'bg-amber-50', value: `${Math.round(totalKwp / 1000).toLocaleString()} MWp`, label: 'กำลังผลิตรวม', sub: `เฉลี่ย ${Math.round(totalKwp / data.plants.length)} kWp / โรง` },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center mb-3`}>{k.icon}</div>
            <div className="text-2xl font-bold text-gray-900 leading-none">{k.value}</div>
            <div className="text-sm font-medium text-gray-700 mt-1">{k.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Map + List */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        {/* SVG Bubble Map */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">แผนที่ฟองอากาศ</span>
            <span className="text-xs text-gray-400">ขนาด = จำนวนโรงไฟฟ้า</span>
          </div>
          <div className="relative">
            <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-auto" style={{ maxHeight: 560 }}>
              {/* Background grid lines for visual reference */}
              <rect width={SVG_W} height={SVG_H} fill="#f8fafc" rx="8" />
              {/* Region labels at approximate positions */}
              <text x="90" y="60" fontSize="9" fill="#94a3b8" textAnchor="middle">เหนือ</text>
              <text x="230" y="200" fontSize="9" fill="#94a3b8" textAnchor="middle">อีสาน</text>
              <text x="165" y="370" fontSize="9" fill="#94a3b8" textAnchor="middle">กลาง</text>
              <text x="240" y="360" fontSize="9" fill="#94a3b8" textAnchor="middle">ตะวันออก</text>
              <text x="80" y="520" fontSize="9" fill="#94a3b8" textAnchor="middle">ใต้</text>

              {/* Province bubbles */}
              {Object.entries(provinceCounts).map(([name, counts]) => {
                const info = PROVINCE_DATA[name]
                if (!info) return null
                const { x, y } = toSVG(info.lat, info.lon)
                const r = Math.max(5, Math.sqrt(counts.total / maxCount) * 32)
                const color = REGION_COLORS[info.region] || '#6b7280'
                const isSelected = selected === name
                const isFiltered = filterRegion !== 'all' && info.region !== filterRegion
                return (
                  <g key={name} onClick={() => setSelected(isSelected ? null : name)}
                    style={{ cursor: 'pointer' }}>
                    <circle cx={x} cy={y} r={r + 3}
                      fill={isSelected ? color : 'transparent'}
                      stroke={isSelected ? color : 'transparent'}
                      fillOpacity={0.15} />
                    <circle cx={x} cy={y} r={r}
                      fill={color}
                      fillOpacity={isFiltered ? 0.15 : (isSelected ? 0.9 : 0.65)}
                      stroke="white"
                      strokeWidth={isSelected ? 2 : 1} />
                    {r >= 12 && (
                      <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="middle"
                        fontSize={Math.min(10, r * 0.65)} fill="white" fontWeight="700">
                        {counts.total}
                      </text>
                    )}
                    <title>{`${info.th || name}: ${counts.total} โรง (MGlobal: ${counts.mglobal})`}</title>
                  </g>
                )
              })}
            </svg>
          </div>
          {/* Legend */}
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(REGION_COLORS).map(([region, color]) => (
              <div key={region} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                {region}
              </div>
            ))}
          </div>
        </div>

        {/* Province List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          {/* Filters */}
          <div className="px-5 py-3 border-b border-gray-100 flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-36">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ค้นหาจังหวัด..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">ทุกภาค</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="count">เรียงตามจำนวน</option>
              <option value="power">เรียงตาม kWp</option>
              <option value="name">เรียงตามชื่อ</option>
            </select>
            <span className="text-xs text-gray-400 ml-auto">{filteredProvinces.length} จังหวัด</span>
          </div>

          {/* Selected province detail */}
          {selectedData && (
            <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-blue-900">{selectedData.th || selectedData.name}</span>
                  {selectedData.region && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                      style={{ backgroundColor: REGION_COLORS[selectedData.region] || '#6b7280' }}>
                      ภาค{selectedData.region}
                    </span>
                  )}
                </div>
                <div className="text-sm text-blue-700 mt-0.5">
                  {selectedData.total} โรง · MGlobal {selectedData.mglobal} · {Math.round((selectedData.power || 0) / 1000)} MWp
                </div>
                {selectedData.plants?.length > 0 && (
                  <div className="text-xs text-blue-500 mt-1 truncate">
                    ตัวอย่าง: {selectedData.plants.join(' · ')}
                  </div>
                )}
              </div>
              <button onClick={() => setSelected(null)} className="text-blue-400 hover:text-blue-600 text-xs">ปิด ✕</button>
            </div>
          )}

          {/* Province rows */}
          <div className="overflow-auto flex-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs text-gray-500 font-medium">#</th>
                  <th className="text-left px-3 py-2.5 text-xs text-gray-500 font-medium">จังหวัด</th>
                  <th className="text-left px-3 py-2.5 text-xs text-gray-500 font-medium">ภาค</th>
                  <th className="text-right px-3 py-2.5 text-xs text-gray-500 font-medium">โรงไฟฟ้า</th>
                  <th className="text-right px-3 py-2.5 text-xs text-gray-500 font-medium">MGlobal</th>
                  <th className="text-right px-5 py-2.5 text-xs text-gray-500 font-medium">MWp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredProvinces.map(([name, counts], idx) => {
                  const info = PROVINCE_DATA[name]
                  const color = REGION_COLORS[info?.region] || '#6b7280'
                  const pct = counts.total / maxCount
                  const isSelected = selected === name
                  return (
                    <tr key={name}
                      onClick={() => setSelected(isSelected ? null : name)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                      <td className="px-5 py-2.5 text-xs text-gray-400">{idx + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="font-medium text-gray-800">{info?.th || name}</span>
                          {!info && <span className="text-xs text-gray-400 italic">{name}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{info?.region || '—'}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, backgroundColor: color }} />
                          </div>
                          <span className="font-semibold text-gray-900 w-8 text-right">{counts.total}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={counts.mglobal > 0 ? 'text-emerald-600 font-medium' : 'text-gray-300'}>
                          {counts.mglobal || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right text-gray-500">
                        {Math.round((counts.power || 0) / 1000).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {unknownCount > 0 && (
              <div className="px-5 py-3 text-xs text-gray-400 border-t border-gray-50 bg-gray-50">
                หมายเหตุ: {unknownCount} โรงไฟฟ้าไม่สามารถระบุจังหวัดได้จากที่อยู่
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
