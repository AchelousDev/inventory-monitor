# Inventory Monitor

## Overview

**Inventory Monitor** is a full-stack monitoring application that tracks resource state changes, maintains history, and generates notifications.

The current implementation focuses on inventory-style resources (product URLs and stock states), but the architecture is designed to support monitoring other resource types (e.g. uptime, APIs, pricing) with minimal changes.

The system uses a mock checking mechanism to simulate real-world monitoring workflows, including scheduled checks, change detection, and alert generation.

The “monitoring” layer is **mocked**: status checks use random outcomes rather than scraping real storefronts. That keeps the project easy to run and extend while demonstrating how production-style systems separate **UI**, **API**, **persistence**, **polling**, and **alerts**.

## Why I Built This

I wanted to build a project that demonstrates end-to-end system design, not just UI development.

This project showcases how a monitoring system works in practice: tracking resources, detecting changes over time, and triggering notifications. Inventory monitoring was used as a concrete use case, but the same architecture applies to uptime monitoring, API health checks, or price tracking systems.

Key capabilities of the system:
## Features

- **Dashboard** — Dark-themed UI listing monitored products with status badges, last-checked time, change hints, and recent check history (per product).
- **Add / delete products** — Name and URL captured in the UI; data persisted in MongoDB.
- **Manual mock checks** — “Check Status” triggers the same server logic as the scheduler.
- **Scheduled mock checks** — `node-cron` runs a full pass **every minute** on all products (shared logic with manual checks).
- **Stock states** — In Stock, Out of Stock, Limited Stock, Unknown.
- **History** — Each check appends an entry (previous → new status, timestamp).
- **Change detection** — Flags when the latest check produced a different status than before.
- **Notifications** — Separate collection and **GET /notifications** feed; rows created **only when status changes** (manual or cron).
- **Dashboard notifications panel** — Shows recent alerts; client uses `fetch` only (no axios).
- **Client-side search & filter** — Filter products by name (case-insensitive) and by status on the dashboard.

## Tech Stack

| Layer        | Technologies |
| ------------ | ------------ |
| Frontend     | React 18 (JavaScript), Vite, React Router |
| Backend      | Node.js, Express, CORS |
| Database     | MongoDB, Mongoose |
| Scheduling   | node-cron |
| Config       | dotenv (backend) |

## Architecture / How It Works

1. **Frontend** (`frontend/`) talks to the **API** over HTTP (`fetch`). Product and notification calls live in small **service modules** under `src/services/`.
2. **Backend** (`backend/`) exposes REST routes, connects to MongoDB via `config/db.js`, and defines **Product** and **Notification** models.
3. **Mock check logic** is centralized in `services/mockInventoryCheck.js` so **PATCH** (manual) and the **cron job** never diverge.
4. **Cron** loads all products, runs the shared check on each, logs counts, and creates notifications only on **status transitions**.
5. The UI does **not** use WebSockets; to see cron-driven updates, refresh the page or trigger actions that refetch data.

At a high level, the system follows a simple data flow:

- The frontend triggers actions (manual checks or CRUD operations)
- The backend processes requests and updates MongoDB
- A scheduled cron job performs periodic checks
- Notifications are generated when state changes occur

## Project Structure

```
inventory-monitor/
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── app.css
│       ├── components/       # Navbar, ProductCard, …
│       ├── pages/            # Dashboard, AddProduct
│       └── services/         # productService.js, notificationService.js
├── backend/
│   ├── server.js             # Express app, routes, cron registration
│   ├── package.json
│   ├── .env.example          # Template for local env (copy to .env)
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── models/
│   │   ├── Product.js
│   │   └── Notification.js
│   └── services/
│       └── mockInventoryCheck.js
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** (v18+ recommended; v20+ matches typical local setups)
- A **MongoDB** instance (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas) or local `mongod`)

### Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with a real `MONGODB_URI` and optional `PORT` (default **3001**).

```bash
npm install
npm run dev
```

You should see the API listening (e.g. `http://localhost:3001`) and a log line that mock checks are scheduled every minute.

### Frontend

In a **second** terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (typically **http://localhost:5173**).

The frontend defaults to `http://localhost:3001` for API calls. If your API runs elsewhere, set:

```bash
# frontend/.env.local (optional)
VITE_API_URL=http://localhost:YOUR_PORT
```

Then restart `npm run dev`.

### Production build (frontend only)

```bash
cd frontend
npm run build
npm run preview
```

## Environment Variables

| Variable        | Where      | Description |
| --------------- | ---------- | ----------- |
| `MONGODB_URI`   | `backend/.env` | MongoDB connection string (**required**) |
| `PORT`          | `backend/.env` | API port (defaults to `3001`) |
| `VITE_API_URL`  | `frontend/.env*` | Optional override for API base URL |

Never commit real secrets. `.env` under `backend/` should stay local (see `.gitignore`).

## Available API Endpoints

Base URL: `http://localhost:3001` (or your `PORT` / `VITE_API_URL`).

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/` | Plain-text health message |
| `GET` | `/products` | List all products (newest first) |
| `POST` | `/products` | Create product — JSON body: `{ "name", "url" }` |
| `PATCH` | `/products/:id/check` | Run one mock check on a product; returns updated document |
| `DELETE` | `/products/:id` | Delete product by MongoDB id |
| `GET` | `/notifications` | Latest notifications (up to **10**, newest first) |

**Errors** are JSON when applicable (`{ "error": "..." }`) with appropriate HTTP status codes.

## Future Improvements

- Replace random mock checks with **real fetch/scrape** or vendor APIs (with rate limits and legal compliance).
- **WebSockets** or **SSE** for live dashboard updates without full page refresh.
- **Email/push** delivery using stored notifications as the outbox.
- **Authentication** and per-user monitored resources.
- **Pagination** and server-side search when product counts grow.
- **Automated tests** (API + UI) and CI.

## Screenshots

_Add screenshots of the Dashboard and Add Product flow here (e.g. `docs/screenshots/dashboard.png`)._

## Author

## Author

Richard Fan  
GitHub: https://github.com/AchelousDev 
Portfolio: https://achelous.dev

---

### Assumptions noted in this README

- **Author** is left as a placeholder for you to personalize.
- **Screenshots** are optional placeholders; no image files are included in the repo by default.
- Default ports **3001** (API) and **5173** (Vite) match the project configuration; your environment may differ.
- MongoDB must be reachable before the backend will start successfully; the app does not ship with an embedded database.
