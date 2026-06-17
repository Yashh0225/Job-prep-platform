# PrepVault v2 — AI-Powered Job Preparation Platform

Full-stack job preparation platform with AI-powered resume analysis, personalized roadmaps, and multi-format mock interviews.

## Features

- 🔍 **Resume Analyzer** — AI skill gap analysis (resume vs job description)
- 🗺️ **Smart Roadmap** — Personalized study plans with task tracking
- 🎤 **Mock Interviews** — 4 types:
  - 💻 DSA / Coding (LeetCode-style with code editor)
  - 🔧 Technical (text/audio responses)
  - 🤝 HR / Behavioral (text/audio)
  - 📚 CS Fundamentals (MCQ + descriptive)
- 🎯 **AI Evaluation** — Per-question scoring and hire recommendation
- 📊 **History** — All sessions saved for reference

## Tech Stack

- **Frontend**: React 19 + Vite + Monaco Editor
- **Backend**: Express.js + MongoDB + Mongoose
- **AI**: Google Gemini 2.5 Flash
- **Auth**: JWT + Google OAuth + OTP email verification
- **Deployment**: Vercel (frontend) + Render (backend)

## Setup

### 1. Clone & Install

```bash
# Frontend
cd client && npm install

# Backend
cd server && npm install
```

### 2. Configure Environment

```bash
cp server/.env.example server/.env
# Fill in your MongoDB URI, JWT secret, Gemini API key, Google OAuth credentials
```

### 3. Run Locally

```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

- Frontend: https://job-prep-platform.vercel.app/
- Backend: https://job-prep-platform.onrender.com

## Deployment

### Frontend (Vercel)
1. Import `client/` directory to Vercel
2. Set `VITE_API_URL` env var to your Render backend URL

### Backend (Render)
1. Create a Web Service from `server/` directory
2. Set all `.env` variables in Render dashboard
3. Set `CLIENT_URL` to your Vercel frontend URL
