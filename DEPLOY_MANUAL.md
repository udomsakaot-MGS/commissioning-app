# Manual Deployment to Vercel - Step by Step

## โปรเจกต์พร้อม Deploy แล้ว! ✅

Build files อยู่ใน `dist/` folder และพร้อมสำหรับ production

---

## 📋 Option A: Deploy ผ่าน Vercel Web Dashboard (ง่ายที่สุด)

### Step 1: เข้า Vercel Dashboard
```
1. ไปที่ https://vercel.com/dashboard
2. Log in ด้วย GitHub account ของคุณ
3. (หรือสมัครใหม่ถ้ายังไม่มี account)
```

### Step 2: Import Project
```
1. Click "Add New" → "Project"
2. เลือก "Import Git Repository"
3. ค้นหา: udomsak-aot-MGS/commissioning-app
4. Click Import
```

### Step 3: ตั้งค่า Project
```
Framework: Vite (auto-detected)
Root Directory: commissioning-app
Build Command: npm run build (default OK)
Output Directory: dist (default OK)
```

### Step 4: เพิ่ม Environment Variables
```
1. ไปที่ Settings → Environment Variables
2. Click "Add New"
3. เพิ่มตัวแปร 2 อัน:

   Variable: VITE_GOOGLE_SHEET_ID
   Value: [your_sheet_id]
   
   Variable: VITE_GOOGLE_API_KEY
   Value: [your_api_key]

4. Click Save
```

### Step 5: Deploy
```
1. Click "Deploy"
2. รอ 2-3 นาที
3. เปิด URL ที่ได้ (เช่น https://commissioning-app-xyz.vercel.app)
4. ✅ เสร็จ!
```

---

## 🖥️ Option B: Deploy ผ่าน Vercel CLI (สำหรับผู้ที่ชอบ Terminal)

### Step 1: Login ไป Vercel
```bash
npx vercel login
# หรือ
npm install -g vercel && vercel login
```

ระบบจะเปิด browser ให้ authorize

### Step 2: Link Project
```bash
cd "D:\AI_Claude\Claude Code\commissioning-app"
npx vercel link
```

ตอบคำถาม:
```
Set up and deploy "commissioning-app"? (Y/n) → Y
Which scope should contain your project? → Your account
Link to existing project? → N
What's your project's name? → commissioning-app
In which directory is your code located? → .
```

### Step 3: ตั้งค่า Environment Variables
```bash
npx vercel env add VITE_GOOGLE_SHEET_ID
# ใส่ Sheet ID แล้ว Enter

npx vercel env add VITE_GOOGLE_API_KEY
# ใส่ API Key แล้ว Enter
```

### Step 4: Deploy
```bash
npx vercel --prod
```

รอ 2-3 นาที → ✅ Deploy สำเร็จ!

---

## 📲 Option C: Deploy ผ่าน GitHub Actions (Auto-Deploy)

### Step 1: Push to GitHub
```bash
git push origin main
```

### Step 2: Connect Vercel
```
1. https://vercel.com/dashboard
2. Import commissioning-app repo
3. ตั้งค่า Environment Variables
4. Deploy
```

### Step 3: Auto-Deploy Setup
จากนี้ไป ทุกครั้ง push ไปที่ GitHub main branch = auto deploy ไป Vercel

---

## ✅ Verification After Deploy

เมื่อ Deploy สำเร็จ ให้ตรวจสอบ:

### 1. เปิด URL
```
https://commissioning-app-[random].vercel.app
```

### 2. ตรวจสอบในหน้า App
- [ ] ✅ หน้าโหลด (ไม่มี error page)
- [ ] ✅ เห็นข้อมูล Projects
- [ ] ✅ คลิก project ได้
- [ ] ✅ สามารถแก้ไข status ได้

### 3. Check Browser Console
```
1. Press F12 → Console tab
2. ไม่มี error ใน console
3. Check Network:
   - sheets.googleapis.com requests = 200 (success)
```

### 4. ถ้า Data ไม่ขึ้น
```
1. ตรวจสอบ Environment Variables ใน Vercel
2. ตรวจสอบ Google Sheet sharing
3. Redeploy: Settings → Deployments → Latest → Redeploy
```

---

## 🔗 Share URL

Deploy สำเร็จแล้ว? Share URL นี้ไปให้เพื่อน/ทีม:

```
https://commissioning-app-[random].vercel.app
```

---

## ❓ Troubleshooting

### ❌ "Cannot find module" error
```
Fix: npm install locally first
npm install
npm run build
```

### ❌ "Environment variables not found"
```
Fix:
1. Check Vercel Settings → Environment Variables
2. Redeploy: Click "Redeploy" button
3. Wait 3-5 minutes
```

### ❌ "No data showing"
```
Fix:
1. Check console (F12)
2. Verify Google Sheets ID correct
3. Verify Google Sheets shared publicly
4. Verify API Key activated
5. Redeploy
```

### ❌ "CORS error"
```
Fix:
1. Google Cloud Console
2. APIs & Services → Credentials
3. Click API Key
4. Under "API restrictions":
   - Add HTTP referrer: https://commissioning-app-*.vercel.app/*
5. Wait 5 minutes
6. Refresh browser (Ctrl+F5)
```

---

## 📊 Project Information

```
Repository: https://github.com/udomsak-aot-MGS/commissioning-app
Framework: React + Vite
Build: npm run build → dist/
API: Google Sheets API
Hosting: Vercel
```

---

## 🎯 What's Next

1. ✅ Deploy successful → Share URL
2. 📊 Monitor logs: Vercel Dashboard → Analytics
3. 📝 Edit data: Google Sheets
4. 🔄 Auto-refresh: App checks Sheets periodically
5. 💾 Save changes: Stored in browser (LocalStorage)

---

## 💡 Tips & Tricks

**Auto-Deploy on Push:**
- Deploy method: GitHub integration
- Auto: Every push to main = Deploy
- Environment: Prod

**Staging Deployments:**
- Create branch: `git checkout -b staging`
- Deploy: Gets automatic staging URL
- Test before pushing to main

**Monitor Performance:**
- Vercel Dashboard → Analytics
- Check load times & errors
- View logs if deployment fails

---

## 🆘 Still Need Help?

1. Read: TROUBLESHOOTING.md
2. Check: Browser Console (F12)
3. Contact: udomsak.aot@mglobalsourcing.net

---

## ⏰ Timeline

```
Step 1-5:  ~5-10 minutes
Build:     ~2-3 minutes
Deploy:    ~2-3 minutes
Total:     ~15 minutes
```

**งานนี้คุณทำได้เอง! 💪**
