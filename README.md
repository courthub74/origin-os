<div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
  <img src="./img/origin-os.png" width="100" alt="Origin OS logo">

# Origin OS — START.md

![Last Commit](https://img.shields.io/github/last-commit/courthub74/origin-os?color=3a9df7)
![Commit Activity](https://img.shields.io/github/commit-activity/m/courthub74/origin-os?color=3a9df7)
![Repo Size](https://img.shields.io/github/repo-size/courthub74/origin-os?color=3a9df7)
![Top Language](https://img.shields.io/github/languages/top/courthub74/origin-os?color=3a9df7)
![Stack](https://img.shields.io/badge/stack-Node.js%20%7C%20Express%20%7C%20MongoDB-3a9df7)

</div>

This file is the **single source of truth** for booting, running, and understanding the Origin OS development environment.

---

## 🧭 What Is Origin OS?

Origin OS is a modular creative operating system built for artists, technologists, and autonomous brands.

- **Frontend:** Static HTML / CSS / JavaScript (Origin OS Shell)
- **Backend:** Node.js + Express API with MongoDB
- **Auth:** JWT + HTTP-only cookies
- **Current Mode:** Local development (non-Docker, Docker-ready)

---

## ⚙️ Core Systems

Origin OS currently operates on several foundational systems:

- **JWT Authentication**  
  Secure session handling using access + refresh tokens with HTTP-only cookies.

- **Persistent Drafts**  
  Artwork creation automatically maintains draft state across sessions.

- **Media Storage Pipeline**  
  Image generation, storage, and retrieval managed through the API and database layer.

- **Dynamic Dashboard Rendering**  
  User dashboards hydrate from live backend data rather than static placeholders.

---

## 📁 Project Structure (High-Level)

```
origin_os/
│
├─ css/                # UI styles (per module)
├─ js/                 # Frontend logic & shell
├─ img/                # Icons, avatars, branding
├─ md/                 # Notes & internal docs
│
├─ origin-os-api/      # Backend API (Express + MongoDB)
│  ├─ src/
│  │  ├─ routes/       # API routes
│  │  ├─ models/       # MongoDB models
│  │  ├─ middleware/   # Auth + guards
│  │  ├─ Utils/        # JWT, cookies, helpers
│  │  └─ server.js     # API entry point
│  └─ package.json
│
├─ *.html              # Frontend pages (dashboard, create, etc.)
├─ Dockerfile
├─ docker-compose.yml
└─ package.json        # Root tooling / future scripts
```

---

# 🏗 System Architecture

Origin OS follows a layered architecture designed to keep the system modular, inspectable, and evolvable.

            ┌──────────────────────────┐
            │        Frontend          │
            │  Origin OS Shell (HTML)  │
            │  CSS + JavaScript UI     │
            └────────────┬─────────────┘
                         │
                         │ HTTP Requests
                         ▼
            ┌──────────────────────────┐
            │       Express API        │
            │   origin-os-api server   │
            │                          │
            │  Auth Routes             │
            │  Artwork Routes          │
            │  Image Routes            │
            │  Stats Routes            │
            └────────────┬─────────────┘
                         │
                         │ Middleware Layer
                         ▼
            ┌──────────────────────────┐
            │     Auth Middleware      │
            │ JWT verification         │
            │ Cookie handling          │
            │ Request guards           │
            └────────────┬─────────────┘
                         │
                         ▼
            ┌──────────────────────────┐
            │        Data Layer        │
            │                          │
            │ MongoDB Database         │
            │ Artwork documents        │
            │ User accounts            │
            │ Media file references    │
            └────────────┬─────────────┘
                         │
                         ▼
            ┌──────────────────────────┐
            │       Media Storage      │
            │ Generated images         │
            │ Stored assets            │
            └──────────────────────────┘

---

# 🎨 Image Generation Pipeline

Origin OS uses an asynchronous workflow for image generation and retrieval.

### Generation Flow

1. User requests image generation from the frontend
2. API creates or updates a draft artwork record
3. Image generation service produces the image
4. Image is stored in the media layer
5. Artwork record is updated with the image reference
6. Frontend retrieves the image through the protected media API

Example retrieval:

```javascript
const imgRes = await fetch(`${API_BASE}/api/images/${imageFileId}`, {
  headers: { Authorization: `Bearer ${token()}` },
  credentials: "include",
});

const blob = await imgRes.blob();
img.src = URL.createObjectURL(blob);
```

---

## 🔧 Requirements

Make sure these are installed **before starting**:

- **Node.js** (v18+ recommended)
- **npm** (comes with Node)
- **MongoDB** (local service or MongoDB Compass)
- **VS Code** (recommended)
- **Live Server extension** (VS Code)

---

## 🧠 Backend — API Startup

The backend powers:

- Authentication
- User accounts
- Artworks
- Stats
- Protected routes

### 1. Navigate to the API folder

```bash
cd origin-os-api
```

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

## 🧱 Philosophy

Origin OS is intentionally:

- Modular
- Inspectable
- Evolvable

No magic.
No locked doors.
Every system is legible.

---

## 🚀 Next Planned Evolutions

- React / Vite frontend
- Cloudflare Pages hosting
- API versioning
- Role-based dashboards
- Plugin-style modules

---

If something breaks, **read this file first**.
If something grows, **update this file**.

This is the contract.
