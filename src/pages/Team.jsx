import { TECHNICIANS, PRODUCT_GROUP_MAP, COMMISSIONING_TICKETS } from '../data/ticketData'
import { Mail, Award, Cpu, Calendar, TrendingUp } from 'lucide-react'

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500',
]

const PRODUCT_COLORS = {
  inverter: 'bg-blue-100 text-blue-700',
  optimizer: 'bg-purple-100 text-purple-700',
  rapidShutdown: 'bg-orange-100 text-orange-700',
  logger: 'bg-teal-100 text-teal-700',
  meter: 'bg-green-100 text-green-700',
}

const PRODUCT_COLOR_DEFAULT = 'bg-gray-100 text-gray-600'

function getProductCategory(product) {
  return PRODUCT_GROUP_MAP[product] || 'other'
}

function productBadge(product) {
  const cat = getProductCategory(product)
  const color = PRODUCT_COLORS[cat] || PRODUCT_COLOR_DEFAULT
  return (
    <span key={product} className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {product}
    </span>
  )
}

export default function Team() {
  const totalTickets = TECHNICIANS.reduce((s, t) => s + t.commissioningCount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ทีม Technical Support</h1>
        <p className="text-gray-500 text-sm mt-1">รายละเอียดช่างเทคนิคและผลงาน Commissioning Service</p>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
            <Award className="text-blue-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{TECHNICIANS.length}</div>
          <div className="text-sm font-medium text-gray-700 mt-0.5">ช่างเทคนิค</div>
          <div className="text-xs text-gray-400 mt-0.5">Technical Support</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalTickets}</div>
          <div className="text-sm font-medium text-gray-700 mt-0.5">Commissioning Tickets</div>
          <div className="text-xs text-gray-400 mt-0.5">รวมทุกช่าง ปี 2025-2026</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
            <Cpu className="text-amber-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {[...new Set(COMMISSIONING_TICKETS.map(t => t.product).filter(Boolean))].length}
          </div>
          <div className="text-sm font-medium text-gray-700 mt-0.5">Product Groups</div>
          <div className="text-xs text-gray-400 mt-0.5">ประเภทสินค้าที่ให้บริการ</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
            <Calendar className="text-purple-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-gray-900">100%</div>
          <div className="text-sm font-medium text-gray-700 mt-0.5">Resolved Rate</div>
          <div className="text-xs text-gray-400 mt-0.5">Commissioning เสร็จสิ้น</div>
        </div>
      </div>

      {/* Technician Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {TECHNICIANS.map((tech, idx) => (
          <TechCard key={tech.name} tech={tech} color={AVATAR_COLORS[idx % AVATAR_COLORS.length]} />
        ))}
      </div>

      {/* Workload comparison bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">เปรียบเทียบปริมาณงาน Commissioning</h2>
        <div className="space-y-4">
          {[...TECHNICIANS].sort((a, b) => b.commissioningCount - a.commissioningCount).map((tech, idx) => {
            const pct = Math.round((tech.commissioningCount / Math.max(...TECHNICIANS.map(t => t.commissioningCount))) * 100)
            const barColors = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500']
            return (
              <div key={tech.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-800">{tech.nick} <span className="text-gray-400 text-xs font-normal">({tech.name})</span></span>
                  <span className="text-gray-500 text-xs">{tech.commissioningCount} tickets</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${barColors[idx % barColors.length]} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TechCard({ tech, color }) {
  const initials = tech.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 ${color} rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-900 text-lg leading-tight">{tech.name}</div>
          <div className="text-gray-400 text-sm">"{tech.nick}" · {tech.dept}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <Mail size={12} className="text-gray-400" />
            <a href={`mailto:${tech.email}`} className="text-xs text-blue-600 hover:underline truncate">{tech.email}</a>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-bold text-gray-900">{tech.commissioningCount}</div>
          <div className="text-xs text-gray-400">tickets</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-400 mb-1">งานแรก</div>
          <div className="text-sm font-medium text-gray-700">{tech.firstDate || '-'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-400 mb-1">งานล่าสุด</div>
          <div className="text-sm font-medium text-gray-700">{tech.lastDate || '-'}</div>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-xs text-gray-400 mb-2">Product Groups ที่ดูแล</div>
        <div className="flex flex-wrap gap-1.5">
          {tech.products.map(p => productBadge(p))}
        </div>
      </div>
    </div>
  )
}
