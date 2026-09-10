// Google Sheets API Service
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'

export async function fetchSheetData(sheetId, range) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  if (!apiKey) {
    console.warn('Google API Key not configured')
    return null
  }

  try {
    const url = `${SHEETS_API}/${sheetId}/values/${range}?key=${apiKey}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    return data.values || []
  } catch (error) {
    console.error('Error fetching sheet data:', error)
    return null
  }
}

export async function updateSheetData(sheetId, range, values) {
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  if (!apiKey) {
    console.warn('Google API Key not configured for updates')
    return false
  }

  try {
    const url = `${SHEETS_API}/${sheetId}/values/${range}?key=${apiKey}&valueInputOption=USER_ENTERED`
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return true
  } catch (error) {
    console.error('Error updating sheet data:', error)
    return false
  }
}

// Parse Projects from Sheet 2 (Combined Data)
export function parseProjectsFromSheet(rows) {
  if (!rows || rows.length < 2) return []

  const headers = rows[0]
  const projectRows = rows.slice(1)
  const projects = []
  const projectMap = {}

  // First pass: create project objects
  projectRows.forEach((row) => {
    const projectRef = row[headers.indexOf('projectRef')]
    const projectId = row[headers.indexOf('projectId')]

    if (!projectId || !projectRef) return
    if (projectMap[projectId]) return

    projectMap[projectId] = {
      id: projectId,
      projectRef,
      iSolarCloudName: row[headers.indexOf('iSolarCloudName')] || '',
      customer: row[headers.indexOf('customer')] || '',
      soNumber: row[headers.indexOf('soNumber')] || '',
      deliveryDate: row[headers.indexOf('deliveryDate')] || '',
      commissioningDate: row[headers.indexOf('commissioningDate')] || '',
      status: row[headers.indexOf('status')] || 'pending',
      technician: row[headers.indexOf('technician')] || '',
      notes: row[headers.indexOf('notes')] || '',
      devices: {
        inverter: [],
        optimizer: [],
        rapidShutdown: [],
        logger: [],
        meter: [],
        mounting: [],
      },
    }
  })

  // Second pass: add devices
  projectRows.forEach((row) => {
    const projectId = row[headers.indexOf('projectId')]
    if (!projectMap[projectId]) return

    const deviceType = row[headers.indexOf('deviceType')]
    if (!deviceType || !projectMap[projectId].devices[deviceType]) return

    const sn = row[headers.indexOf('sn')]
    if (!sn) return

    const device = {
      sn,
      itemNo: row[headers.indexOf('itemNo')] || '',
      model: row[headers.indexOf('model')] || '',
      iSolarCloud: row[headers.indexOf('iSolarCloud')] === 'TRUE',
      commissionStatus: row[headers.indexOf('commissionStatus')] || 'pending',
    }

    projectMap[projectId].devices[deviceType].push(device)
  })

  return Object.values(projectMap)
}

// Convert projects to Sheet format
export function projectsToSheetRows(projects) {
  const headers = [
    'projectId', 'projectRef', 'customer', 'soNumber', 'deliveryDate',
    'commissioningDate', 'status', 'technician', 'iSolarCloudName', 'notes',
    'deviceType', 'sn', 'itemNo', 'model', 'iSolarCloud', 'commissionStatus'
  ]

  const rows = [headers]

  projects.forEach((project) => {
    const baseRow = [
      project.id, project.projectRef, project.customer, project.soNumber,
      project.deliveryDate, project.commissioningDate, project.status,
      project.technician, project.iSolarCloudName, project.notes
    ]

    // Add device rows
    let hasDevices = false
    Object.entries(project.devices).forEach(([deviceType, devices]) => {
      if (!devices || devices.length === 0) return
      hasDevices = true
      devices.forEach((device) => {
        const row = [
          ...baseRow,
          deviceType,
          device.sn,
          device.itemNo,
          device.model,
          device.iSolarCloud ? 'TRUE' : 'FALSE',
          device.commissionStatus,
        ]
        rows.push(row)
      })
    })

    // Add project row even without devices
    if (!hasDevices) {
      const row = [...baseRow, '', '', '', '', '', '']
      rows.push(row)
    }
  })

  return rows
}
