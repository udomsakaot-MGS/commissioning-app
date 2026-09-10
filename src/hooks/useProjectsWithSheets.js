import { useState, useEffect } from 'react'
import { fetchSheetData, parseProjectsFromSheet, projectsToSheetRows } from '../services/googleSheetsService'
import { PROJECTS as mockProjects } from '../data/mockData'

export function useProjectsWithSheets() {
  const [projects, setProjects] = useState(mockProjects)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [useSheets, setUseSheets] = useState(false)

  const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID
  const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL
  const hasSheetConfig = !!scriptUrl || !!sheetId

  // Load projects from Google Apps Script
  useEffect(() => {
    if (!hasSheetConfig) {
      setLoading(false)
      return
    }

    const loadFromSheets = async () => {
      try {
        setLoading(true)
        const data = await fetchSheetData(sheetId, 'Combined!A:Q')
        if (data && data.length > 0) {
          const parsedProjects = parseProjectsFromSheet(data)
          setProjects(parsedProjects)
          setUseSheets(true)
        } else {
          console.log('No data from sheets, using mock data')
        }
      } catch (err) {
        console.error('Failed to load from sheets:', err)
        setError(err.message)
        // Fall back to mock data
      } finally {
        setLoading(false)
      }
    }

    loadFromSheets()
  }, [scriptUrl, hasSheetConfig])

  const updateProjects = (newProjects) => {
    setProjects(newProjects)

    // Sync to Google Sheets if available
    if (useSheets && hasSheetConfig) {
      const rows = projectsToSheetRows(newProjects)
      // In a real implementation, you'd call updateSheetData here
      // For now, we just update local state
      console.log('Would sync to sheets:', rows)
    }
  }

  return {
    projects,
    setProjects: updateProjects,
    loading,
    error,
    useSheets,
    hasSheetConfig,
  }
}
