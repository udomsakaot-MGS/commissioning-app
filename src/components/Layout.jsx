import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  FolderOpen, FileSpreadsheet, Wrench,
  Zap, Menu, X, ChevronRight, ChevronDown, Bell, Users, Ticket, Cloud, MapPin, CalendarDays,
} from 'lucide-react'

const navItems = [
  { path: '/plant-database', icon: Cloud,        label: 'iSC & MGlobal' },
  { path: '/map',            icon: MapPin,       label: 'แผนที่โรงไฟฟ้า' },
  { path: '/calendar',       icon: CalendarDays, label: 'ปฏิทิน Commissioning' },
  { path: '/projects',       icon: FolderOpen,   label: 'โครงการ SN' },
  {
    label: 'Technical Service',
    icon: Wrench,
    children: [
      { path: '/tickets', icon: Ticket, label: 'Commissioning Tickets' },
      { path: '/team',    icon: Users,  label: 'ทีม' },
    ],
  },
  { path: '/import', icon: FileSpreadsheet, label: 'นำเข้า Excel' },
]

function flattenNav(items) {
  return items.flatMap(i => (i.children ? i.children : [i]))
}

const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
  'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']

function thaiDate() {
  const d = new Date()
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const flatNav = flattenNav(navItems)
  const currentPage = flatNav.find(i => location.pathname.startsWith(i.path))?.label || 'ระบบ Commissioning'
  const serviceActive = navItems
    .find(i => i.children)?.children
    .some(c => location.pathname.startsWith(c.path))
  const [serviceOpen, setServiceOpen] = useState(serviceActive ?? false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-blue-900 text-white flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="flex items-center gap-3 p-4 border-b border-blue-800">
          <div className="bg-amber-400 rounded-lg p-2 flex-shrink-0">
            <Zap size={20} className="text-blue-900" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="font-bold text-sm leading-tight">Sungrow</div>
              <div className="text-blue-300 text-xs">Commissioning Service</div>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => {
            const { path, icon: Icon, label, children } = item

            if (children) {
              const groupActive = children.some(c => location.pathname.startsWith(c.path))
              return (
                <div key={label}>
                  <button
                    onClick={() => (sidebarOpen ? setServiceOpen(o => !o) : setSidebarOpen(true))}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      groupActive ? 'text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                    }`}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="text-sm font-medium flex-1 text-left">{label}</span>
                        <ChevronDown
                          size={16}
                          className={`flex-shrink-0 transition-transform ${serviceOpen ? 'rotate-180' : ''}`}
                        />
                      </>
                    )}
                  </button>
                  {sidebarOpen && serviceOpen && (
                    <div className="mt-1 ml-3 pl-3 border-l border-blue-800 space-y-1">
                      {children.map(({ path: cPath, icon: CIcon, label: cLabel }) => (
                        <NavLink
                          key={cPath}
                          to={cPath}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                              isActive
                                ? 'bg-blue-700 text-white'
                                : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                            }`
                          }
                        >
                          <CIcon size={17} className="flex-shrink-0" />
                          <span className="text-sm font-medium">{cLabel}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                  }`
                }
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {sidebarOpen && (
          <div className="p-4 border-t border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center text-blue-900 font-bold text-sm flex-shrink-0">
                A
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-medium truncate">Admin</div>
                <div className="text-blue-300 text-xs">ผู้ดูแลระบบ</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Sungrow Commissioning</span>
              <ChevronRight size={14} />
              <span className="text-gray-900 font-medium">{currentPage}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell size={20} className="text-gray-500 cursor-pointer hover:text-blue-600" />
            </div>
            <div className="text-sm text-gray-500">{thaiDate()}</div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
