<div align="center">

<img src="./img/origin-os.png" width="120" alt="Origin OS logo">

# Origin OS — START.md

![Last Commit](https://img.shields.io/github/last-commit/courthub74/origin-os)
![Commit Activity](https://img.shields.io/github/commit-activity/m/courthub74/origin-os)
![Repo Size](https://img.shields.io/github/repo-size/courthub74/origin-os)
![Top Language](https://img.shields.io/github/languages/top/courthub74/origin-os)
![Stack](https://img.shields.io/badge/stack-Node.js%20%7C%20Express%20%7C%20MongoDB-green)

</div>

A modular creative operating system for autonomous creators.

This file is the **single source of truth** for booting, running, and understanding the Origin OS development environment.

If Origin OS feels like a machine, this is the ignition manual.

---

# 🧭 What Is Origin OS?

Origin OS is a modular creative operating system built for artists, technologists, writers and autonomous brands.

**Frontend:** Static HTML / CSS / JavaScript (Origin OS Shell)  
**Backend:** Node.js + Express API with MongoDB  
**Auth:** JWT + HTTP-only cookies  
**Current Mode:** Local development (non-Docker, Docker-ready)

---

# ⚙️ Core Systems

Origin OS currently operates on several foundational systems.

### JWT Authentication

Secure session handling using access and refresh tokens with HTTP-only cookies.

### Persistent Draft System

Artwork creation maintains draft state across sessions.

### Async Image Generation Pipeline

Images are generated through an asynchronous API process that stores the result in the database and media layer.

### Media Storage Pipeline

Image generation, storage, and retrieval handled through API endpoints and database references.

### Dynamic Dashboard Rendering

User dashboards hydrate from live backend data instead of static placeholders.

### Secure Media Retrieval

Generated images are retrieved through protected API routes rather than direct file access.

---

# 📁 Project Structure

origin_os/
│
├─ css/ # UI styles (per module)
├─ js/ # Frontend logic & shell
├─ img/ # Icons, avatars, branding
├─ md/ # Notes & internal docs
│
├─ origin-os-api/ # Backend API (Express + MongoDB)
│ ├─ src/
│ │ ├─ routes/ # API routes
│ │ ├─ models/ # MongoDB models
│ │ ├─ middleware/ # Auth + guards
│ │ ├─ utils/ # JWT, cookies, helpers
│ │ └─ server.js # API entry point
│ └─ package.json
│
├─ \*.html # Frontend pages (dashboard, create, etc.)
├─ Dockerfile
├─ docker-compose.yml
└─ package.json # Root tooling / future scripts

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
