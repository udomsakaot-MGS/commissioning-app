# Troubleshooting Guide

## 🔴 Common Issues & Solutions

### 1. "CORS Error" or "Cannot fetch from Sheets"

**Error Message:**
```
Access to XMLHttpRequest at 'https://sheets.googleapis.com/v4/...' 
has been blocked by CORS policy
```

**Fix:**
1. Google Cloud Console → APIs & Services → Credentials
2. Click on API Key
3. Scroll to "API restrictions"
4. Add HTTP referrer:
   ```
   https://commissioning-app-*.vercel.app/*
   http://localhost:*/*
   ```
5. Save and wait 5 minutes

---

### 2. "No data from sheets" (blank page)

**Cause:** Sheet ID หรือ API Key ผิด

**Fix:**
1. Verify Environment Variables ใน Vercel:
   - Settings → Environment Variables
   - Check `VITE_GOOGLE_SHEET_ID` value
   - Check `VITE_GOOGLE_API_KEY` value
2. Verify Google Sheets:
   - Sheet ต้อง share เป็น "Anyone with the link"
   - Sheet ต้องมี "Combined" sheet
3. Check browser Console (F12 → Console):
   ```
   Look for error messages
   ```

---

### 3. "Invalid API Key" Error

**Cause:** API Key invalid หรือ not activated

**Fix:**
1. Google Cloud Console → APIs & Services → Credentials
2. Delete old API Key
3. Create NEW API Key
4. Enable "Google Sheets API" for that project
5. Copy new key
6. Update Vercel Environment Variables
7. Redeploy

---

### 4. "Google Sheets API not enabled"

**Fix:**
1. Google Cloud Console → APIs & Services
2. Search "Google Sheets API"
3. Click Enable
4. Wait 2-3 minutes for activation

---

### 5. App loads but no data appears

**Check:**
```
1. Open browser DevTools (F12)
2. Network tab:
   - Look for requests to sheets.googleapis.com
   - Check response status: should be 200
   - Check response data: should have sheet values
3. Console tab:
   - Look for any error messages
4. Application tab:
   - Check localStorage
```

**If sheet request fails (403/404):**
- Sheet ID ผิด
- API Key ผิด
- Sheet not shared publicly
- API Key not activated

---

### 6. "Build Failed" on Vercel

**Common causes:**
- Node.js version too old
- Missing environment variables during build
- Syntax error in code

**Fix:**
1. Check Vercel Build Logs:
   - Deployments → Latest → View Build Logs
2. Ensure Node.js >= 18:
   - Settings → General → Node.js Version
3. Check for errors in code:
   ```bash
   npm run build  # locally
   ```

---

### 7. "404 Page Not Found" on Vercel

**Cause:** Routing issue (SPA not configured correctly)

**Check vercel.json:**
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Should already be configured. If not, file issue.

---

### 8. "Data not syncing back to Sheets"

**This is expected behavior currently:**
- App reads from Sheets ✅
- App caches data locally ✅
- Changes don't auto-sync to Sheets ❌

**Workaround:**
- Manually export data from app
- Update Google Sheets manually
- Or: Ask about setting up Google Apps Script integration

---

### 9. "Sheet loads but with wrong/old data"

**Fix:**
1. Clear browser cache:
   - F12 → Application → Storage → Clear Site Data
2. Refresh page (Ctrl+F5)
3. Check Google Sheet data is correct
4. Wait 5 minutes for API cache to clear

---

### 10. "LocalStorage full" or "Storage quota exceeded"

**Cause:** Too much data cached

**Fix:**
1. Browser → Settings → Clear Cache/Cookies
2. Or: Open DevTools → Application → Storage → Clear Site Data

---

## 🔍 Debugging Tips

### Enable Debug Logging
Edit `src/services/googleSheetsService.js`:
```javascript
// Add this at top
const DEBUG = true

// In functions, add:
if (DEBUG) console.log('Fetching:', url)
if (DEBUG) console.log('Response:', data)
```

### Check Network Requests
1. Open DevTools (F12)
2. Network tab
3. Reload page
4. Look for `sheets.googleapis.com` requests
5. Click each and check:
   - Status (should be 200)
   - Response Preview (should show sheet data)

### Test API Key Directly
Paste in browser:
```
https://sheets.googleapis.com/v4/spreadsheets/[SHEET_ID]/values/Combined!A1:Z?key=[API_KEY]
```

Should return JSON with sheet data.

---

## 📋 Verification Checklist

Before reporting issue, verify:

- [ ] Google Sheet exists and is shared
- [ ] "Combined" sheet exists with data
- [ ] Google Sheets API is enabled
- [ ] API Key is correct
- [ ] Vercel env vars are set correctly
- [ ] Vercel is redeployed after changing env vars
- [ ] Browser cache cleared (Ctrl+F5)
- [ ] No errors in browser console (F12)
- [ ] API Key HTTP referrer is configured

---

## 🆘 Still Not Working?

1. Take screenshot of:
   - Google Sheet (both sheets)
   - Vercel Environment Variables
   - Browser Console errors
2. Share error message exactly as written
3. Contact: udomsak.aot@mglobalsourcing.net

---

## 📚 More Help

- Google Sheets API Docs: https://developers.google.com/sheets/api
- Vercel Docs: https://vercel.com/docs
- Network Tab Guide: https://developer.chrome.com/docs/devtools/network/
