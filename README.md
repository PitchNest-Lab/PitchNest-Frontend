<p align="center">
  <img src="logo.svg" alt="PitchNest Logo" width="100" />
</p>

<h1 align="center">PitchNest Frontend</h1>

<p align="center">
  <strong>The Official Web SPA for PitchNest — Real-Time Voice Pitch Simulation for Startup Founders</strong>
</p>

<p align="center">
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://vite.dev"><img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite 6" /></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://vercel.com"><img src="https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel&logoColor=white" alt="Vercel" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="License" /></a>
</p>

---

## 🚀 Overview

**PitchNest Frontend** is the browser application powering the PitchNest platform. It gives founders an interactive, high-stakes venture boardroom experience directly on the web:
* Streams founder microphone audio over secure WebSockets directly into the Azure AI speech pipeline.
* Renders real-time AI panel personas (Marcus, Sarah, Chen, Riley) with synchronized audio playback and visual feedback.
* Handles slide-by-slide PDF pitch deck presentation and dynamic slide sync.
* Renders comprehensive post-pitch evaluation dashboards, scoring analytics, strengths & risks, SWOT analysis, and investor Q&A prep.

---

## ✨ Features

- **🎙️ Live Voice Pitch Room**: Low-latency 16 kHz PCM audio streaming via Web Audio API, interruption handling ("barge-in"), and speech synthesis playback.
- **📑 Deck Viewer & Navigation**: High-fidelity PDF slide viewer allowing founders to navigate slides in sync with the AI panel.
- **📊 Comprehensive Readiness Analytics**: Visual scoring charts with Recharts, category score breakdowns (Clarity, Delivery, Scalability, Investor Readiness), and sentiment metrics.
- **📄 Downloadable PDF Reports**: Founders can generate, preview, and download full readiness reports.
- **🔐 Secure Authentication**: JWT-based sign up, login, Google Sign-In, 6-digit OTP email verification, and password reset flows.
- **💳 Monetization & Billing UI**: Subscription management, plan switching (Prep vs. Pro), and hosted checkout integration.
- **🌓 Adaptive Theme**: Sleek dark and light modes with custom modern typography and glassmorphism UI.

---

## 🛠️ Project Structure

```text
PitchNest-Frontend/
├── public/                # Static assets, favicon, logo
├── src/
│   ├── components/        # Reusable UI components (Modals, Logo, DeckViewer, etc.)
│   ├── contexts/          # React Contexts (AuthContext, SocketContext, ThemeContext)
│   ├── hooks/             # Custom hooks (useAudioRecorder, useWindowSize, etc.)
│   ├── lib/               # Utility functions and API helpers
│   ├── pages/             # Route pages (LivePitchRoom, Dashboard, Signup, Settings, etc.)
│   ├── App.tsx            # Main application root and routing
│   ├── index.css          # Core Tailwind CSS design system tokens
│   └── main.tsx           # Application entry point
├── .cert/                 # Localhost HTTPS certificates (for local dev)
├── index.html             # HTML entry point with SEO metadata
├── package.json           # Frontend dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── vercel.json            # Vercel deployment & API rewrite configuration
└── vite.config.ts         # Vite bundler configuration
```

---

## 🏁 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or later (v20+ recommended)
* **npm**: v9.0.0 or later

### Installation

```bash
# Clone the repository
git clone https://github.com/PitchNest-Lab/PitchNest-Frontend.git
cd PitchNest-Frontend

# Install dependencies
npm install
```

### Running Locally

```bash
npm run dev
```

The Vite dev server will start at `https://localhost:5174/`. 

> [!NOTE]
> During local development, Vite automatically proxies `/api/*` and `/ws/*` requests to your local backend running on `http://127.0.0.1:3000`.

### Production Build

```bash
npm run build
npm run preview
```

---

## 🌐 Deployment (Vercel)

This repository includes a turnkey [vercel.json](vercel.json) that automatically:
1. Rewrites all `/api/*` calls to the live production backend: `https://pitchnest-live.onrender.com/api/*`.
2. Directs all SPA routes `/(.*)` to `/index.html` to eliminate 404s on browser reloads.
3. Applies strict security headers (`X-Frame-Options`, `Content-Security-Policy`, `HSTS`).

---

## 🔗 Related Repositories

| Repository | Description |
| :--- | :--- |
| **[PitchNest-Backend](https://github.com/PitchNest-Lab/PitchNest-Backend)** | Express & WebSocket API server, Azure AI/Speech engine, Supabase integration |
| **[PitchNest-Mobile](https://github.com/PitchNest-Lab/PitchNest-Mobile)** | Native iOS & Android companion mobile app (React Native / Expo) |

---

## 📄 License

This project is licensed under the MIT License.
