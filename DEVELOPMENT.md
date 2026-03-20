# Origin OS Development Guide

If Origin OS feels like a machine, this is the ignition manual.

This document explains how to run the Origin OS development environment locally.

## Requirements

Make sure the following tools are installed before starting:

- Node.js (v18+ recommended)
- npm
- MongoDB (local instance or MongoDB Compass)
- VS Code (recommended)
- Live Server extension for VS Code

---

## Quick Start

Start the backend:

### 1. Navigate to the API Folder

```bash
cd origin-os-api
```

---

### 2. Install dependencies (first time or after pulling)

```bash
npm install
```

### 3. Configure environment variables

Ensure `origin-os-api/.env` exists:

```env
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/origin_os
JWT_ACCESS_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
```

### 4. Start the API server

```bash
npm run dev
```

Expected output:

```
✅ API running on http://localhost:4000
✅ MongoDB connected
```

Leave this terminal running.

---

## 🖥️ Frontend — Origin OS Shell

The frontend is **static HTML/CSS/JS**.
No build step. No bundler (yet).

### Recommended Method: VS Code Live Server

1. Open the **origin_os root folder** in VS Code
2. Locate `index.html`
3. Right-click → **Open with Live Server**

The app opens at:

```
http://127.0.0.1:5500/
```

✔ Loads all CSS + JS correctly
✔ Communicates with backend at `localhost:4000`
✔ Supports auth cookies

---

## 🔁 Normal Development Workflow

**Terminal 1 — Backend**

```bash
cd origin-os-api
npm run dev
```

**Frontend**

- Live Server → `index.html`
- Refresh browser as needed

Backend auto-restarts on change.
Frontend reloads on save.

---

## 🔐 Authentication Notes

- Auth uses **HTTP-only cookies**
- Tokens are issued by `/auth/login`
- Protected pages rely on:
  - `auth-guard.js`
  - `/auth/me` validation

⚠️ Always run frontend on a server (Live Server).
Opening files directly (`file://`) will break auth.

---

## ⚠️ Common Pitfalls

### ❌ CSS Not Loading

- Live Server started inside `/html` or another subfolder
- Fix: Start Live Server from **project root**

### ❌ MongoDB Connection Error

```text
ECONNREFUSED 127.0.0.1:27017
```

Fix:

- Start MongoDB service
- Or open MongoDB Compass → Connect

### ❌ Auth Not Persisting

- Frontend not served via HTTP
- Cookies blocked

---

## 🐳 Docker (Optional / Later Phase)

Docker is **present but optional**.
Not required for daily development.

When ready:

```bash
docker compose up --build
```

Use Docker when:

- Onboarding collaborators
- Standardizing environments
- Preparing production builds

---
