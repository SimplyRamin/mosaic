# ماکان+ (Makan+)
**سامانه منابع انسانی · گروه صنعتی طبیعت ماکان**

HR People Directory for Tabiat Makan Industrial Group — a mobile-first PWA for searching, identifying and viewing employee information across all subsidiaries and holdings.

---

## Features

- Persian (RTL) mobile-first interface
- Full-text employee search
- Voice search (Persian — requires internet)
- Camera-based face identification (Phase 2)
- Role-based access control (RBAC)
- Offline support via service worker
- PWA — installable on iPhone home screen

---

## Project Structure
```makan-plus/
├── frontend/               ← PWA (HTML, CSS, JS)
│   ├── index.html          ← Login screen
│   ├── manifest.json       ← PWA manifest
│   ├── sw.js               ← Service worker
│   ├── version.json        ← Version for update detection
│   ├── serve.py            ← Local HTTPS dev server
│   ├── screens/            ← App screens
│   │   ├── home.html
│   │   ├── search.html
│   │   ├── profile.html
│   │   ├── camera.html
│   │   └── forgot-password.html
│   ├── css/                ← Stylesheets
│   ├── js/                 ← JavaScript
│   └── assets/             ← Fonts, icons, images
├── backend/                ← FastAPI (Python, UV)
└── docs/                   ← Database specs, design files
```
---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JS (PWA) |
| Backend | Python, FastAPI, UV |
| Database (app) | Microsoft SQL Server — MakanApp |
| Database (data) | Microsoft SQL Server — MakanDWH |
| Data source | Microsoft Analysis Services (DAX) |
| Font | Vazirmatn |

---

## Local Development

### Frontend (HTTP — PC browser only)

```bash
cd frontend
python -m http.server 8000
```

Open `http://localhost:8000`

### Frontend (HTTPS — required for iPhone camera and PWA testing)

Requires mkcert certificate files in `frontend/` — see `docs/` for setup guide.

```bash
cd frontend
python serve.py
```

Open `https://localhost:8443` on PC or `https://YOUR_LOCAL_IP:8443` on iPhone.

### Backend

```bash
cd backend
uv run uvicorn main:app --reload
```

---

## Deployment

When deploying new code, increment `version.json` to trigger update notification on installed PWAs:

```json
{ "version": "1.0.1" }
```

---

## Database

Two SQL Server databases:

- **MakanDWH** — read-only data warehouse, populated via ETL from Analysis Services. Owned by data team.
- **MakanApp** — operational tables for auth, RBAC, sessions and audit log. Owned by backend team.

See `docs/database/` for full schema specifications.

---

## Access Levels

| Role | Description |
|---|---|
| `employee` | Basic access — general info only |
| `manager` | Team data — salary, attendance, contact |
| `hr_specialist` | Department data — full HR details |
| `hr_admin` | All employees — full access + user management |
| `executive` | All employees — aggregates only for salary |

> Current PoC scope: all users are `hr_admin` or `manager` level — full access to all employees.

---

## Known Limitations

- Voice search requires internet (Apple speech servers) — blocked in Iran without VPN
- Camera search requires HTTPS
- Face recognition (camera search) is PoC only — requires employee photo database for full deployment
- Org chart disabled — direct manager hierarchy not yet available in source data

---

## Backlog

- [ ] Dark mode
- [ ] OTP / two-factor login
- [ ] RBAC enforcement (waiting for clean org hierarchy data)
- [ ] Org chart screen
- [ ] Face recognition at scale (requires employee photos)
- [ ] Export to Excel

---

*Tabiat Makan Industrial Group · Planning & Systems Development Department*