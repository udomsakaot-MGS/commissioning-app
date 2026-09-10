import { createContext, useContext, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useProjectsWithSheets } from './hooks/useProjectsWithSheets'
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
  const { projects, setProjects, loading, error, hasSheetConfig } = useProjectsWithSheets()

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100 mb-4">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading data...</h2>
          {hasSheetConfig && <p className="text-sm text-gray-600">Connecting to Google Sheets</p>}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading data</h2>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    )
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
