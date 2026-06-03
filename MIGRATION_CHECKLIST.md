# ⚡ CineMatrix → Supabase Migration Checklist

## ✅ What's Been Done

- [x] Created `.env` file with Supabase placeholders
- [x] Updated `index.html` to use Supabase instead of CSV files
- [x] Created `migrate_to_supabase.py` to import CSV data
- [x] Created `test_supabase.py` to verify connection
- [x] Created API helper module for data operations
- [x] Updated `package.json` with dependencies

## 🚀 What You Need To Do

### Step 1: Get Supabase Keys (5 min)
1. Go to https://app.supabase.com
2. Click "Settings" → "API" in the left sidebar
3. Copy **Project URL** and **anon public key**
4. Also copy **Service Role Key** (for migrations)

### Step 2: Update `.env` File (2 min)
Edit the `.env` file and add your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project-xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-key...
SUPABASE_URL=https://your-project-xxx.supabase.co
SUPABASE_KEY=eyJ...your-service-role-key...
```

### Step 3: Create Database Tables (5 min)
1. In Supabase dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy the entire SQL from `SUPABASE_SETUP.md`
4. Run it (Ctrl+Enter)

### Step 4: Install Dependencies (2 min)
```bash
pip install supabase python-dotenv
```

### Step 5: Test Connection (1 min)
```bash
python test_supabase.py
```

Should output: ✅ Supabase connection is working!

### Step 6: Migrate CSV Data (2-5 min)
```bash
python migrate_to_supabase.py
```

Watch for checkmarks (✓) next to each table.

### Step 7: Update HTML Config (1 min)
In `index.html`, find these lines (around line 1982):
```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_KEY = 'your-anon-key-here';
```

Update with your values from Step 1.

### Step 8: Start Server (1 min)
```bash
python -m http.server 8080
```

Visit: http://localhost:8080

## 🔄 For Vercel Deployment

1. Push code to GitHub
2. Connect to Vercel (already done)
3. Go to **Settings → Environment Variables**
4. Add all 4 variables from your `.env`
5. Redeploy

## 📝 File Reference

| File | Purpose |
|------|---------|
| `.env` | Configuration (don't commit!) |
| `SUPABASE_SETUP.md` | Full SQL schema |
| `migrate_to_supabase.py` | Import CSV → Supabase |
| `test_supabase.py` | Verify connection |
| `index.html` | Updated to load from Supabase |
| `api/supabase_helper.py` | API utilities |

## 🆘 Troubleshooting

### "ModuleNotFoundError: No module named 'supabase'"
```bash
pip install supabase
```

### "Connection refused / Cannot reach Supabase"
- Check `.env` values are correct
- Verify project is running on Supabase dashboard
- Check internet connection

### "Table 'xyz' not found"
- Run the SQL schema creation again in Supabase
- Check table names in dashboard

### "Still loading CSV instead of Supabase"
- Hard refresh browser (Ctrl+Shift+R)
- Check that `SUPABASE_URL` and `SUPABASE_KEY` are set in `index.html`
- Open developer console (F12) to see errors

## 📞 Support Resources

- Supabase Docs: https://supabase.com/docs
- JavaScript Client: https://supabase.com/docs/reference/javascript
- Python Migration: https://supabase.com/docs/guides/migrations
- GitHub: https://github.com/supabase/supabase

---

**Time to complete**: ~20-30 minutes total  
**Difficulty**: Easy (just copy-paste steps)

Good luck! 🚀
