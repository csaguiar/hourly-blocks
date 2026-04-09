# Hourly Blocks

Weekly time tracker for organizing hourly blocks by category. Built with React, Express, and SQLite.

## Setup

```bash
npm install
npm run db:setup
```

This creates the SQLite database at `data/hourly.db` and seeds default categories.

## Run (development)

```bash
npm run dev
```

Opens the app at [http://localhost:5173](http://localhost:5173). The API server runs on port 3001.

## Run (production)

```bash
npm run build
npm run start
```

This serves the built frontend and API together on port 3001.

See `DEPLOY.md` for a systemd setup.

## Backfill from Excel

```bash
npx tsx server/backfill.ts path/to/spreadsheet.xlsx
```

Requires Python 3 with `openpyxl` installed.

## Stack

- **Frontend:** React + TypeScript + Tailwind CSS (Vite)
- **Backend:** Express + better-sqlite3
- **Database:** SQLite (stored in `data/hourly.db`)
