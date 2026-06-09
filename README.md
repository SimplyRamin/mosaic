---
title: Mosaic
emoji: 🏢
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
---

# Mosaic — HR People Directory

A mobile-first Persian RTL Progressive Web App (PWA) for searching and viewing employee profiles across a large industrial holding group.

Built as a production system for a conglomerate with 8 holding companies, 35 subsidiaries, and ~100,000 employees.

**Live Demo:** [mosaic-a5t.pages.dev](https://mosaic-a5t.pages.dev)  
**Demo credentials:** Employee code `1` · Password `demo1234`

---

## Screenshots

> Persian RTL mobile-first interface with JWT auth, real-time search, and detailed employee profiles including compensation and decree history.


---

## Features

- Persian (RTL) mobile-first PWA — installable on iPhone/Android home screen
- Full-text employee search across 100k+ records
- Voice search — Persian speech recognition via Whisper (CPU-only, runs locally)
- Employee profiles with compensation, decree history, and attendance data
- JWT authentication with refresh tokens, account lockout, and session management
- Home dashboard — active headcount, gender ratio, avg age, avg tenure, top departments
- Offline support via service worker
- Update detection and notification system

---

## Project Structure
```
mosaic/
├── frontend/               ← PWA (HTML, CSS, Vanilla JS)
│   ├── index.html          ← Login screen
│   ├── manifest.json       ← PWA manifest
│   ├── sw.js               ← Service worker
│   ├── version.json        ← Version-based update detection
│   ├── screens/            ← App screens (home, search, profile, camera)
│   ├── css/                ← Stylesheets
│   ├── js/                 ← JavaScript modules
│   └── assets/             ← Vazirmatn font, SVG sprites, icons
├── backend/                ← FastAPI (Python, UV)
│   ├── main.py             ← App entry point, lifespan events
│   ├── routers/            ← employees, auth, stats, speech
│   ├── core/               ← database, auth, config, whisper, name cache
│   └── queries/            ← DAX query files (original hr-cube queries)
├── scripts/
│   └── anonymize.py        ← Data anonymization + Postgres loading pipeline
├── docs/                   ← Database specs, data catalogue
└── Dockerfile              ← HF Spaces deployment
```
---

## Architecture
Cloudflare Pages          Hugging Face Spaces        Neon (PostgreSQL)
(Static PWA)      ──────► (FastAPI Docker)    ──────► (Frankfurt, EU)
mosaic-a5t.pages.dev      ramool-mosaic.hf.space      ~100k employees
~913k salary rows
~111k decree rows

--- 

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript — PWA, no frameworks |
| Backend | Python, FastAPI, UV |
| Database | PostgreSQL (Neon serverless) |
| Voice Search | faster-whisper (medium model, CPU-only) + rapidfuzz fuzzy matching |
| Auth | JWT (HS256), bcrypt, refresh token rotation |
| Frontend Hosting | Cloudflare Pages |
| Backend Hosting | Hugging Face Spaces (Docker) |


---

## Local Development

### Prerequisites
- Python 3.11+
- UV package manager
- mkcert (for HTTPS — required for PWA and microphone access)

### Setup

```bash
# Clone the repo
git clone https://github.com/SimplyRamin/mosaic.git
cd mosaic

# Set up backend environment
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and SECRET_KEY
uv sync

# Run both frontend and backend
cd ..
python start.py
```

Open `https://localhost:8443`

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon (or any Postgres) connection string |
| `SECRET_KEY` | JWT signing secret |
| `ENABLE_WHISPER` | Set to `true` to enable voice search (requires ~2GB RAM) |

---

## Data Pipeline

The `scripts/anonymize.py` script handles the full data pipeline:

1. Reads 5 CSV exports from the original HR data warehouse
2. Anonymizes personal data — names replaced with fake Persian names via Faker, national IDs and mobile numbers replaced with fake values, employee IDs remapped sequentially
3. Loads anonymized data into PostgreSQL via psycopg2 with chunked inserts

```bash
cd scripts
pip install pandas faker psycopg2-binary
python anonymize.py           # full run
python anonymize.py --load-only  # skip anonymization, just load to DB
```

---

## Voice Search

Voice search uses [faster-whisper](https://github.com/guillaumekln/faster-whisper) (medium model, CPU-only) for Persian speech recognition, combined with rapidfuzz fuzzy matching against an in-memory cache of all employee names loaded at startup.

Disabled on the hosted demo due to memory constraints. Set `ENABLE_WHISPER=true` locally to enable.

---

## Notable Technical Decisions

- **Vanilla JS, no frameworks** — intentional choice to understand every line of the codebase
- **Persian RTL** — full right-to-left layout with Vazirmatn font, safe area support for iPhone notch
- **CPU-only Whisper** — no GPU available on the production server; faster-whisper with int8 quantization made it feasible
- **DAX queries** — original version connected to Microsoft Analysis Services via pywin32/ADO; portfolio version uses PostgreSQL
- **Connection pooling** — psycopg2 SimpleConnectionPool to avoid per-request connection overhead

---

## Background

This project was built as a production HR directory for a large Iranian industrial conglomerate. The project was cancelled mid-development. This portfolio version uses anonymized data and a public PostgreSQL database.

The original system connected to Microsoft Analysis Services (`hr-cube`) via DAX queries for all HR data, with a separate SQL Server database for authentication. The DAX query files are preserved in `backend/queries/` for reference.

---

*Built by Ramin Ferdos · [simplyramin.github.io](https://simplyramin.github.io)*
