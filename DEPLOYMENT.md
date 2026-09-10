# Commissioning App — Deployment Guide

## ข้อมูล

**Repository**: Sungrow Commissioning Service Application  
**Framework**: React 19 + Vite 8 + TailwindCSS 4  
**Build Output**: `dist/` directory  
**Node Version**: 18+ recommended  

---

## Deploy ไป Vercel (Recommended)

### 1. Create Vercel Account
- ไปที่ https://vercel.com
- สมัครด้วย GitHub, GitLab, Bitbucket หรือ Email
- (ถ้ามี GitHub account ให้ใช้ GitHub login เพื่อ auto-import repo)

### 2. Install Vercel CLI
```bash
npm install -g vercel
```

### 3. Login
```bash
vercel login
```
- Browser จะเปิด → ยืนยันและ authorize

### 4. Deploy
```bash
cd commissioning-app
vercel --prod
```

**คำถามที่อาจจะถาม:**
- `Set up and deploy "D:/AI_Claude/Claude Code/commissioning-app"?` → **y**
- `Which scope?` → เลือก personal account
- `Link to existing project?` → **n** (ครั้งแรก)
- `What's your project's name?` → `commissioning-app` (default ✓)
- `In which directory is your code located?` → `.` (default ✓)
- `Detected existing `vercel.json`. Continuing with automation.` → ✓

### 5. ✅ Deploy Complete
```
✓ Deployed to https://commissioning-app-xxx.vercel.app [in XXs]
```
**ลิงก์นั้นแหละที่ใคร ๆ เข้าถึงได้!**

---

## Deploy ไป GitHub + Auto-Deploy

### ถ้ายังไม่มี GitHub repo:
```bash
cd commissioning-app
git init
git add .
git commit -m "Initial commit: Commissioning App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/commissioning-app.git
git push -u origin main
```

### ใน Vercel Dashboard:
1. **Add New Project** → **Import Git Repository**
2. **Search** `commissioning-app` → **Import**
3. **Configure Project**:
   - Framework Preset: **Vite** ✓
   - Build Command: `npm run build` ✓
   - Output Directory: `dist` ✓
4. **Deploy**

**ทุกครั้งที่ push ไป main → Vercel จะ auto-deploy 🚀**

---

## Environment Variables (ถ้าจำเป็น)

ใน Vercel Dashboard → **Settings** → **Environment Variables**:

```
VITE_API_URL=https://api.example.com
```

จากนั้น build จะใช้มันได้ใน code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL
```

---

## Performance Tips

### Bundle Size Warning ⚠️
Current JS bundle: **959.84 kB** (gzip: 279.51 kB)

**สามารถปรับได้:**
1. **Code Splitting** — ใช้ dynamic imports:
   ```javascript
   const Projects = lazy(() => import('./pages/Projects'))
   ```

2. **Remove unused libraries** — ตรวจสอบ dependencies

3. **Lazy load JSON data** — sn-data.json (18.6 MB) ค่อนข้างใหญ่

### Caching Strategy ✓
`vercel.json` ตั้งค่าแล้ว:
- Static assets (JS/CSS): **1 year** immutable
- index.html: **no-cache** (เสมอ fetch latest)
- JSON data: **1 hour** cache

---

## Troubleshooting

### Build Error: "Cannot find module"
```
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Deploy Error: "ArrowRight has already been declared"
- ✅ **Fixed** ใน `ExcelImport.jsx` (duplicate import removed)

### Data ไม่โหลด
- ตรวจสอบว่า public files (`.json`) ถูก upload:
  ```
  public/
  ├── sn-data.json
  ├── isc-plants.json
  └── isc-compare.json
  ```

### Routes ไม่ทำงาน (404 on refresh)
- ✅ **Fixed** ใน `vercel.json` — rewrite ทั้ง route ไป `/index.html`

---

## Commands Reference

```bash
# Development
npm run dev          # Start dev server (port 5174)

# Build
npm run build        # Production build → dist/
npm run preview      # Preview production build locally

# Linting
npm run lint         # Run oxlint checks

# Deploy
vercel --prod        # Deploy to Vercel production
vercel               # Deploy preview (staging)
vercel logs          # View deployment logs
```

---

## File Structure
```
commissioning-app/
├── src/
│   ├── pages/        # Route components
│   ├── components/   # Reusable components
│   ├── data/         # Mock data
│   ├── App.jsx       # Main app + routing
│   └── index.css     # Global styles
├── public/           # Static files (JSON data)
├── dist/             # Build output (Vercel serves this)
├── vite.config.js    # Vite configuration
├── tailwind.config.js (ถ้ามี)
├── vercel.json       # Vercel deployment config ✓
├── .vercelignore     # Files to ignore ✓
└── package.json
```

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vite.dev
- **React Router**: https://reactrouter.com
- **TailwindCSS**: https://tailwindcss.com

---

**Last Updated**: 2026-09-10  
**Status**: ✅ Ready for Production
