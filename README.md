# 🎬 CinaMatrix — How to Run

## Folder Structure

```
cinamatrix_project/
├── index.html          ← Open this in browser (via server)
├── csv_output/         ← All data files (DO NOT rename or move)
│   ├── dynamic_new_releases.csv
│   ├── dynamic_top_rated.csv
│   ├── dynamic_reviews.csv
│   ├── static_movies_series.csv
│   ├── static_awards.csv
│   ├── static_movies_by_year.csv
│   ├── static_actors.csv
│   ├── recommendation_mood.csv
│   ├── recommendation_pool.csv
│   ├── static_cinema_galaxy.csv
│   ├── static_cinema_world.csv
│   ├── egypt_cinema_20260508_1117.csv
│   ├── analytics_genre_frequency.csv
│   ├── analytics_genre_cooccurrence.csv
│   └── analytics_point_cloud.csv
└── README.md
```

---

## ▶️ How to Open in VS Code

### Option 1 — Live Server Extension (Easiest)

1. Open the `cinamatrix_project` folder in VS Code
2. Install the **Live Server** extension by Ritwick Dey (if not installed)
3. Right-click `index.html` in the Explorer panel
4. Click **"Open with Live Server"**
5. Browser opens automatically at `http://127.0.0.1:5500`

### Option 2 — Python (No extensions needed)

Open a terminal in the `cinamatrix_project` folder and run:

```bash
# Python 3
python -m http.server 8080
```

Then open your browser at: **http://localhost:8080**

### Option 3 — Node.js

```bash
npx serve .
```

---

## ⚠️ Important: Do NOT open index.html directly

Double-clicking `index.html` opens it as `file://` which **blocks CSV loading** due to browser security (CORS). You MUST use a local server (any option above).

---

## 🔄 Refreshing Data

To get fresh data, run the `Cinema_Scrapers.ipynb` notebook in Google Colab:
- Part 1 (run weekly): updates `dynamic_*.csv` files
- Part 2 (run once): updates all `static_*.csv` files

Then replace the old CSVs in the `csv_output/` folder.

---

## 📰 Art News

The Art News page (`◉ Art News`) displays curated news cards defined in the `NEWS_DATA` array inside `index.html`. To add/edit news, open `index.html` in VS Code and find `const NEWS_DATA = [` (around line 1839) and update the array.
