import { createContext, useContext, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PROJECTS } from './data/mockData'
import Layout from './components/Layout'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import ExcelManagement from './pages/ExcelManagement'
import Team from './pages/Team'
import CommissioningTickets from './pages/CommissioningTickets'
import PlantDatabase from './pages/PlantDatabase'
import ThailandMap from './pages/ThailandMap'
import CommissioningCalendar from './pages/CommissioningCalendar'

export const DataContext = createContext(null)
export const useData = () => useContext(DataContext)

export default function App() {
  const [projects, setProjects] = useState(PROJECTS)

  function updateDeviceStatus(projectId, deviceType, sn, newStatus) {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p
      return {
        ...p,
        devices: {
          ...p.devices,
          [deviceType]: p.devices[deviceType].map(d =>
            d.sn === sn ? { ...d, commissionStatus: newStatus } : d
          ),
        },
      }
    }))
  }

  function toggleISolarCloud(projectId, deviceType, sn) {
    setProjects(prev => prev.map(p => {
      if (p.id !== projectId) return p
      return {
        ...p,
        devices: {
          ...p.devices,
          [deviceType]: p.devices[deviceType].map(d =>
            d.sn === sn ? { ...d, iSolarCloud: !d.iSolarCloud } : d
          ),
        },
      }
    }))
  }

  function updateProjectStatus(projectId, status) {
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, status } : p
    ))
  }

  function importProjects(incoming) {
    setProjects(prev => {
      const updated = [...prev]
      incoming.forEach(np => {
        const idx = updated.findIndex(p => p.projectRef === np.projectRef)
        if (idx >= 0) {
          const existing = updated[idx]
          const merged = { ...existing, ...np }
          Object.keys(np.devices).forEach(type => {
            if (!existing.devices[type]) return
            const existingSNs = new Set(existing.devices[type].map(d => d.sn))
            const newDevices = np.devices[type].filter(d => !existingSNs.has(d.sn))
            merged.devices[type] = [...existing.devices[type], ...newDevices]
          })
          updated[idx] = merged
        } else {
          updated.push({ ...np, id: `P${Date.now()}` })
        }
      })
      return updated
    })
  }

  return (
    <DataContext.Provider value={{ projects, updateDeviceStatus, toggleISolarCloud, updateProjectStatus, importProjects }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/projects" replace />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id" element={<ProjectDetail />} />
            <Route path="import" element={<ExcelManagement />} />
            <Route path="team" element={<Team />} />
            <Route path="tickets" element={<CommissioningTickets />} />
            <Route path="plant-database" element={<PlantDatabase />} />
            <Route path="map" element={<ThailandMap />} />
            <Route path="calendar" element={<CommissioningCalendar />} />
            <Route path="*" element={<Navigate to="/projects" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataContext.Provider>
  )
}
