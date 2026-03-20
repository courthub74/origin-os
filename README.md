<div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
  <img src="./img/origin-os.png" width="100" alt="Origin OS logo">

# Origin OS — START.md

![Last Commit](https://img.shields.io/github/last-commit/courthub74/origin-os?color=3a9df7)
![Commit Activity](https://img.shields.io/github/commit-activity/m/courthub74/origin-os?color=3a9df7)
![Stack](https://img.shields.io/badge/stack-Node.js%20%7C%20Express%20%7C%20MongoDB-2c3e50)
![Issues](https://img.shields.io/github/issues/courthub74/origin-os?color=3a9df7)

</div>

This file is the **single source of truth** for booting, running, and understanding the Origin OS development environment.

See the [CHANGELOG](CHANGELOG.md) for release history.

---

## 🧭 What Is Origin OS?

## What is Origin OS?

Origin OS is a modular platform for creating, managing, and publishing digital artwork through a structured creative pipeline.

It combines a **dashboard-based creative interface**, a **Node.js + MongoDB backend**, and an **AI-powered generation system** to help creators produce and distribute digital work from a single environment.

Origin OS is designed to function as a **creative operating system** rather than a single-purpose application.

---

## ⚙️ Core Capabilities

Origin OS currently provides several foundational systems:

### JWT Authentication

Secure session handling using access and refresh tokens with HTTP-only cookies.

### Persistent Draft System

Artwork creation automatically saves draft state so creative sessions can continue across logins.

### AI Generation Pipeline

Images are generated through the backend API and stored through the media pipeline.

### Dynamic Dashboard

User dashboards hydrate from live backend data rather than static placeholders.

### Modular Creative Tools

Origin OS is designed to support multiple creator workflows including artwork generation, collections, publishing, and branding.

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

## Technology Stack

**Frontend**

- HTML
- CSS
- JavaScript
- Live Server (development)

**Backend**

- Node.js
- Express

**Database**

- MongoDB

**Authentication**

- JWT
- HTTP-only cookies

**Future Platform**

- React / Vite
- Cloudflare Pages
- Docker deployment

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

## 🌐 Website Content Management

Origin OS functions as a **headless CMS** and **publishing engine** for creators like Dream Agent.

This means Dream Agent website content can be updated through Origin OS without directly editing the website codebase itself.

### What this includes

- Artwork publishing
- Collection updates
- Release descriptions
- Website content updates
- Future creative asset management

### Technical role

Origin OS serves as the **content management layer** between internal creator workflows and the external Dream Agent website.

## Documentation

Project documentation is organized as follows:

| File                | Purpose                                 |
| ------------------- | --------------------------------------- |
| **README.md**       | Project overview                        |
| **DEVELOPMENT.md**  | Local development setup                 |
| **ARCHITECTURE.md** | System architecture and internal design |

---

## Current Development Focus

Active development is currently focused on:

• asynchronous AI artwork generation  
• modular dashboard systems  
• persistent creative workflows  
• scalable media pipelines

---

## Roadmap

Upcoming evolutions include:

- React / Vite frontend
- Async generation worker pipeline
- Plugin-style module architecture
- Cloud deployment
- creator publishing workflows
- collection systems

---

## Repository

GitHub

https://github.com/courthub74/origin-os

---

## 🧱 Philosophy

Origin OS is intentionally:

- Modular
- Inspectable
- Evolvable

---

## 🧭 Project Status

Origin OS is currently in **active development**.

Core authentication, image generation workflows, and modular dashboard architecture are functional.  
Future iterations will expand the platform toward a full creative operating system for digital creators.

---

## 🚀 Planned Evolutions

Origin OS is designed as a modular system and will continue evolving.  
Upcoming architecture improvements include:

- React / Vite frontend
- Cloudflare Pages deployment
- API versioning strategy
- Role-based dashboards
- Plugin-style module system

---

## 📜 Project Contract

If something breaks → **start with this README.**  
If something grows → **update this README.**

This file defines the current architecture and development expectations for Origin OS.

---

## 🧠 Powered By

<p>
  <img src="./img/neo_logo_white.png" width="120" alt="CourDevelops logo">
</p>
