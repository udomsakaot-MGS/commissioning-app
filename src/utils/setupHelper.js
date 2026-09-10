// Helper to detect if Google Sheets is configured
export function isGoogleSheetsConfigured() {
  const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY
  return !!sheetId && !!apiKey
}

// Show setup warning if not configured
export function setupWarning() {
  if (!isGoogleSheetsConfigured()) {
    console.warn(
      'Google Sheets is not configured. To use Google Sheets:\n' +
      '1. Follow the setup guide: GOOGLE_SHEETS_SETUP.md\n' +
      '2. Create .env file with VITE_GOOGLE_SHEET_ID and VITE_GOOGLE_API_KEY\n' +
      '3. Restart the dev server'
    )
  }
}

// Generate example data for Google Sheets
export function generateSheetHeaders() {
  return [
    'projectId', 'projectRef', 'customer', 'soNumber', 'deliveryDate',
    'commissioningDate', 'status', 'technician', 'iSolarCloudName', 'notes',
    'deviceType', 'sn', 'itemNo', 'model', 'iSolarCloud', 'commissionStatus'
  ]
}

// Format status display
export const statusLabels = {
  pending: 'รอดำเนินการ',
  in_progress: 'กำลังดำเนินการ',
  completed: 'เสร็จสิ้น',
  issue: 'มีปัญหา',
}
