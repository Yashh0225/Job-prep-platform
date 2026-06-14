# PrepVault — AI-Powered Job Preparation Platform

Build a premium, full-stack job preparation platform with AI-powered resume analysis, personalized roadmaps, and multi-format mock interviews that closely resemble real company interviews.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | **React 19 + Vite** | SPA with fast HMR |
| Styling | **Vanilla CSS** | Dark glassmorphism design system |
| Code Editor | **Monaco Editor** (`@monaco-editor/react`) | LeetCode-style DSA coding |
| Audio | **Web Speech API** (SpeechRecognition) | Voice input for interview responses |
| Backend | **Express.js + Node 20** | REST API server |
| Database | **MongoDB + Mongoose** | Data persistence |
| AI | **Google Gemini 2.5 Flash** | All AI features (analysis, questions, evaluation) |
| Auth | **Passport.js + JWT + bcrypt** | Google OAuth + email/password + OTP |
| Email | **Nodemailer** | OTP delivery |
| PDF | **pdf-parse** | Resume parsing |
| Deployment | **Vercel (frontend) + Render (backend)** | Production hosting |

---

## User Review Required

> [!IMPORTANT]
> **AI Provider**: The plan uses **Google Gemini 2.5 Flash** for all AI features. If you prefer OpenAI GPT-4 or another provider, let me know.

> [!IMPORTANT]
> **Code Execution**: The DSA code editor will support **client-side syntax highlighting and editing** via Monaco Editor. For actually **running/testing code against test cases**, I plan to use the **Judge0 API** (free tier, self-hostable). If you prefer a different approach (e.g., Piston API, or skip code execution entirely and only evaluate via AI), please confirm.

> [!IMPORTANT]
> **Audio Input**: I'll use the **Web Speech API** (browser-native, free, no API key needed) for speech-to-text. This works well in Chrome/Edge but has limited Safari support. Is that acceptable, or do you want a paid API like Deepgram/Whisper?

> [!WARNING]
> **Email OTP**: For email verification, a real SMTP provider (Gmail App Password, SendGrid, etc.) is needed. I'll set up the code with environment variables so you can plug in credentials. For local development, OTPs will be logged to the console.

---

## Open Questions

1. **Database Hosting**: Do you have a MongoDB Atlas cluster, or should I include setup instructions?
2. **Google OAuth Credentials**: Do you already have a Google Cloud project with OAuth 2.0 credentials configured?
3. **Domain**: Do you have a custom domain for deployment, or will Vercel/Render default URLs suffice?

---

## Proposed Changes

### Project Structure

```
Job Prep/
├── client/                          # React + Vite frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json                  # SPA routing
│   ├── public/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css                # Full design system
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   └── ToastContext.jsx
│       ├── services/
│       │   └── api.js               # Axios + JWT interceptor
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── Sidebar.jsx
│       │   ├── ProtectedRoute.jsx
│       │   ├── FileUpload.jsx
│       │   ├── LoadingScreen.jsx     # Premium skeleton/spinner
│       │   ├── CodeEditor.jsx        # Monaco Editor wrapper
│       │   ├── AudioRecorder.jsx     # Speech-to-text component
│       │   ├── MCQQuestion.jsx       # MCQ option cards
│       │   ├── InterviewTimer.jsx    # Countdown timer
│       │   └── SkillGauge.jsx        # Radial skill chart
│       └── pages/
│           ├── Landing.jsx
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── VerifyOTP.jsx
│           ├── AuthCallback.jsx      # Google OAuth handler
│           ├── Dashboard.jsx
│           ├── ResumeAnalyzer.jsx     # Feature 1: Skill gap analysis
│           ├── RoadmapGenerator.jsx   # Feature 2: Study roadmap
│           ├── RoadmapView.jsx        # Generated roadmap display
│           ├── MockSetup.jsx          # Feature 3: Mock interview config
│           ├── MockInterview.jsx      # Live mock interview
│           ├── MockResult.jsx         # Interview evaluation/feedback
│           ├── History.jsx            # Past sessions & interviews
│           └── SessionDetail.jsx      # Detailed session view
│
├── server/                          # Express.js backend
│   ├── package.json
│   ├── server.js                    # Entry point
│   ├── .env.example
│   ├── Dockerfile
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── passport.js              # Google OAuth strategy
│   ├── middleware/
│   │   └── auth.js                  # JWT verify + token gen
│   ├── models/
│   │   ├── User.js
│   │   ├── AnalysisSession.js       # Resume analysis results
│   │   ├── Roadmap.js               # Generated roadmaps
│   │   └── MockInterview.js         # Interview sessions & questions
│   ├── routes/
│   │   ├── auth.js                  # Register, login, OTP, Google OAuth
│   │   ├── analysis.js              # Resume analyzer endpoints
│   │   ├── roadmap.js               # Roadmap generation endpoints
│   │   └── interview.js             # Mock interview endpoints
│   └── services/
│       ├── gemini.js                # All AI interactions
│       └── email.js                 # OTP email sender
│
└── README.md
```

---

### Component 1: Design System & Core UI

#### [NEW] client/src/index.css
Premium dark-mode glassmorphism design system:
- **Color palette**: Deep navy (#0a0e1a) background, electric blue (#6366f1) to violet (#a855f7) gradient accents
- **Glass cards**: `backdrop-filter: blur(16px)` with subtle borders
- **Typography**: Inter font from Google Fonts
- **Animations**: Floating gradient orbs, shimmer loading skeletons, smooth transitions
- **Components**: Buttons, inputs, cards, modals, tabs, badges, progress bars, toast notifications
- **Responsive**: Mobile-first with breakpoints at 768px and 1024px

#### [NEW] client/src/components/LoadingScreen.jsx
Premium loading states:
- Full-page skeleton with animated shimmer
- Inline loading spinners with pulsing text
- Progress bar for multi-step operations
- "Analyzing with AI..." state with brain animation

#### [NEW] client/src/components/SkillGauge.jsx
SVG-based radial gauge for skill match percentage display.

---

### Component 2: Authentication System

#### [NEW] server/models/User.js
```javascript
{
  name: String,
  email: { type: String, unique: true },
  password: String,           // bcrypt hashed
  googleId: String,           // Google OAuth
  avatar: String,
  otp: String,
  otpExpires: Date,
  isVerified: Boolean,
  createdAt: Date
}
```

#### [NEW] server/routes/auth.js
| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Email + password registration, sends OTP |
| `/api/auth/verify-otp` | POST | Verify OTP and activate account |
| `/api/auth/resend-otp` | POST | Resend OTP email |
| `/api/auth/login` | POST | Email + password login, returns JWT |
| `/api/auth/google` | GET | Initiate Google OAuth flow |
| `/api/auth/google/callback` | GET | Google OAuth callback, returns JWT |
| `/api/auth/me` | GET | Get current user profile |

#### [NEW] client/src/context/AuthContext.jsx
React context providing `user`, `login()`, `logout()`, `loading` with JWT token persistence in localStorage and auto-refresh.

#### [NEW] client/src/pages/Login.jsx, Register.jsx, VerifyOTP.jsx, AuthCallback.jsx
Auth pages with Google OAuth button, email/password forms, and OTP input.

---

### Component 3: Resume Analyzer (Feature 1)

#### [NEW] server/models/AnalysisSession.js
```javascript
{
  userId: ObjectId,
  jobTitle: String,
  company: String,
  jobDescription: String,
  resumeText: String,
  resumeFileName: String,
  analysis: {
    overallMatch: Number,          // 0-100 percentage
    matchedSkills: [{ skill: String, level: String, evidence: String }],
    missingSkills: [{ skill: String, importance: String, suggestion: String }],
    strengthSummary: String,
    gapSummary: String,
    recommendations: [String]
  },
  status: String,                  // 'pending' | 'analyzing' | 'completed' | 'error'
  createdAt: Date
}
```

#### [NEW] server/routes/analysis.js
| Endpoint | Method | Description |
|---|---|---|
| `/api/analysis/analyze` | POST | Upload resume PDF + JD → AI analysis |
| `/api/analysis/sessions` | GET | List user's analysis sessions |
| `/api/analysis/sessions/:id` | GET | Get specific analysis detail |
| `/api/analysis/sessions/:id` | DELETE | Delete an analysis session |

#### [NEW] server/services/gemini.js → `analyzeResumeVsJob()`
Sends resume text + job description to Gemini with structured JSON output prompt:
- Extracts skills from both documents
- Calculates match percentage
- Identifies gaps with importance ranking
- Provides actionable recommendations

#### [NEW] client/src/pages/ResumeAnalyzer.jsx
Two-panel wizard:
1. **Left panel**: Job description input (paste text, upload PDF, or Quick Setup with title + company for AI-generated JD)
2. **Right panel**: Resume upload (drag & drop PDF)
3. **Results view**: Animated skill gauge, matched/missing skills cards, gap analysis with recommendations

---

### Component 4: Roadmap Generator (Feature 2)

#### [NEW] server/models/Roadmap.js
```javascript
{
  userId: ObjectId,
  analysisSessionId: ObjectId,     // optional link to analysis
  jobTitle: String,
  company: String,
  jobDescription: String,
  resumeText: String,
  daysAvailable: Number,
  inputMode: String,               // 'title_only' | 'title_company' | 'job_description'
  roadmap: {
    summary: String,
    phases: [{
      name: String,
      days: String,                // "Day 1-3"
      focus: String,
      tasks: [{
        title: String,
        description: String,
        resources: [String],
        estimatedHours: Number,
        priority: String           // 'critical' | 'high' | 'medium' | 'low'
      }]
    }],
    dailySchedule: [{
      day: Number,
      topics: [String],
      practiceProblems: Number,
      mockInterviewSuggested: Boolean
    }]
  },
  status: String,
  createdAt: Date
}
```

#### [NEW] server/routes/roadmap.js
| Endpoint | Method | Description |
|---|---|---|
| `/api/roadmap/generate` | POST | Generate personalized roadmap |
| `/api/roadmap/list` | GET | List user's roadmaps |
| `/api/roadmap/:id` | GET | Get specific roadmap |
| `/api/roadmap/:id` | DELETE | Delete a roadmap |

#### [NEW] server/services/gemini.js → `generateRoadmap()`
Accepts job title / company / JD + resume + days → generates phased study plan with daily breakdown.

#### [NEW] client/src/pages/RoadmapGenerator.jsx
Input form with three modes:
- **Role-specific**: Just job title (e.g., "Frontend Developer")
- **Company-specific**: Job title + company name (e.g., "SDE at Google")
- **JD-based**: Paste or upload full job description
Plus: days slider (1-90), optional resume upload for personalization.

#### [NEW] client/src/pages/RoadmapView.jsx
Timeline visualization with:
- Phase cards with progress indicators
- Daily task breakdown with checkboxes
- Resource links
- Priority color coding (critical = red, high = orange, medium = blue, low = gray)

---

### Component 5: Mock Interview System (Feature 3) — Core

This is the most complex feature. It supports **4 interview types** across **3 input modes**.

#### [NEW] server/models/MockInterview.js
```javascript
{
  userId: ObjectId,
  // Configuration
  companies: [String],             // ["Google", "Amazon"] or ["Custom"]
  jobTitle: String,
  jobDescription: String,          // real or AI-generated
  experience: String,              // 'fresher' | 'experienced'
  yearsOfExperience: Number,
  interviewParts: [String],        // ['dsa', 'technical', 'hr', 'cs_fundamentals']
  inputMode: String,               // 'company_name' | 'job_description' | 'ai_generated'
  
  // Interview State
  status: String,                  // 'setup' | 'in_progress' | 'completed' | 'abandoned'
  currentPart: String,             // Current interview section
  currentQuestionIndex: Number,
  
  // Questions & Responses per part
  parts: {
    dsa: {
      questions: [{
        id: String,
        title: String,
        description: String,
        difficulty: String,         // 'easy' | 'medium' | 'hard'
        constraints: [String],
        examples: [{ input: String, output: String, explanation: String }],
        testCases: [{ input: String, expectedOutput: String, isHidden: Boolean }],
        starterCode: {
          cpp: String,
          java: String,
          javascript: String,
          python: String
        },
        userCode: String,
        selectedLanguage: String,
        testResults: [{ passed: Boolean, input: String, expected: String, actual: String }],
        aiEvaluation: String,
        score: Number               // 0-10
      }],
      completed: Boolean
    },
    technical: {
      questions: [{
        id: String,
        question: String,
        expectedTopics: [String],
        responseType: String,       // 'text' | 'audio'
        userResponse: String,
        aiEvaluation: String,
        score: Number
      }],
      completed: Boolean
    },
    hr: {
      questions: [{
        id: String,
        question: String,
        category: String,           // 'behavioral' | 'situational' | 'motivational'
        responseType: String,       // 'text' | 'audio'
        userResponse: String,
        aiEvaluation: String,
        score: Number
      }],
      completed: Boolean
    },
    cs_fundamentals: {
      questions: [{
        id: String,
        question: String,
        type: String,               // 'mcq' | 'text' | 'audio'
        topic: String,              // 'OS' | 'DBMS' | 'Networks' | 'OOP'
        options: [String],          // for MCQ
        correctAnswer: String,      // for MCQ
        userAnswer: String,
        aiEvaluation: String,
        score: Number
      }],
      completed: Boolean
    }
  },
  
  // Final Evaluation
  evaluation: {
    overallScore: Number,
    partScores: { dsa: Number, technical: Number, hr: Number, cs_fundamentals: Number },
    strengths: [String],
    weaknesses: [String],
    detailedFeedback: String,
    hireRecommendation: String,     // 'strong_hire' | 'hire' | 'lean_hire' | 'no_hire'
    improvementAreas: [String]
  },
  
  startedAt: Date,
  completedAt: Date,
  createdAt: Date
}
```

#### [NEW] server/routes/interview.js
| Endpoint | Method | Description |
|---|---|---|
| `/api/interview/start` | POST | Create interview, generate all questions |
| `/api/interview/:id/question` | GET | Get current question |
| `/api/interview/:id/respond` | POST | Submit answer for current question |
| `/api/interview/:id/run-code` | POST | Execute DSA code against test cases |
| `/api/interview/:id/next` | POST | Move to next question/part |
| `/api/interview/:id/end` | POST | End interview, generate final evaluation |
| `/api/interview/history` | GET | List past interviews |
| `/api/interview/:id` | GET | Get interview details |
| `/api/interview/:id` | DELETE | Delete an interview |

#### [NEW] server/services/gemini.js — Interview AI Functions
- `generateDSAQuestions(company, role, experience)` → LeetCode-style problems with test cases & starter code
- `generateTechnicalQuestions(company, role, experience, jd)` → System design, architecture, framework questions
- `generateHRQuestions(company, role, experience)` → Behavioral/situational questions tailored to company culture
- `generateCSFundamentalsQuestions(topics)` → MCQ + descriptive questions on OS, DBMS, Networks, OOP
- `evaluateResponse(question, response, type)` → Score individual responses
- `generateFinalEvaluation(interview)` → Comprehensive hire/no-hire evaluation

---

### Component 5b: Mock Interview — Frontend Pages

#### [NEW] client/src/pages/MockSetup.jsx
Multi-step setup wizard:
1. **Company Selection**: Search & select one or multiple companies, or choose "Custom"
2. **Input Mode**: Company name-based / paste JD / AI-generated JD (based on company + role)
3. **Role & Experience**: Job title, fresher/experienced toggle, years of experience
4. **Interview Parts**: Checkbox selection of DSA, Technical, HR, CS Fundamentals
5. **Start Interview** button with estimated duration

#### [NEW] client/src/pages/MockInterview.jsx
Dynamic interview interface that changes based on current part:

**DSA Mode:**
- Split view: Problem description (left) + Monaco Code Editor (right)
- Language selector dropdown (C++, Java, JavaScript, Python)
- Auto-loaded boilerplate/starter code per language
- "Run" button to test against sample test cases
- "Submit" button to submit final solution
- Test case results panel (pass/fail with input/output diff)

**Technical Mode:**
- Question card with topic tags
- Toggle between text input (textarea) and audio input
- Audio: Record button → live waveform → transcribed text preview
- Submit button

**HR Mode:**
- Question with category badge (Behavioral/Situational/Motivational)
- Text or audio response (same as technical)
- Submit button

**CS Fundamentals Mode:**
- **MCQ**: Options displayed as clickable cards with radio selection
- **Text**: Textarea for descriptive answers
- **Audio**: Same audio recorder component
- Topic badge (OS/DBMS/Networks/OOP)

**Common UI:**
- Progress bar showing question X of Y
- Part navigation tabs (DSA → Technical → HR → CS Fund)
- Timer per question (optional)
- "Next Question" / "Skip" / "End Interview" controls

#### [NEW] client/src/pages/MockResult.jsx
Post-interview evaluation dashboard:
- Overall score with animated circular gauge
- Per-part score breakdown (bar chart or radar)
- Hire recommendation badge (Strong Hire / Hire / Lean Hire / No Hire)
- Expandable per-question feedback cards
- Strengths & weaknesses summary
- "Retry" and "Save" buttons

---

### Component 5c: Mock Interview — Reusable Components

#### [NEW] client/src/components/CodeEditor.jsx
Monaco Editor wrapper:
- Language selector (C++, Java, JS, Python)
- Syntax highlighting, auto-complete, bracket matching
- Theme: VS Code Dark+ theme
- Resizable panel
- Starter code injection per language
- Read-only mode for viewing past submissions

#### [NEW] client/src/components/AudioRecorder.jsx
Speech-to-text component:
- Record/Stop/Reset buttons with animated mic icon
- Live waveform visualization using Canvas API
- Real-time transcription preview
- Final text output for submission
- Fallback: Manual text input if browser doesn't support SpeechRecognition

#### [NEW] client/src/components/MCQQuestion.jsx
MCQ option cards:
- 4 options as glass cards
- Radio selection with highlight animation
- Correct/incorrect reveal animation (post-submit)
- Explanation tooltip

#### [NEW] client/src/components/InterviewTimer.jsx
Countdown timer:
- Circular progress indicator
- Warning state at < 2 minutes (turns amber)
- Critical state at < 30 seconds (turns red with pulse)

---

### Component 6: Dashboard & History

#### [NEW] client/src/pages/Dashboard.jsx
Main dashboard with:
- Welcome header with user name
- Stats cards: Total analyses, Active roadmaps, Mock interviews completed, Average score
- Recent activity feed (last 5 items from each feature)
- Quick-action cards: "New Analysis", "Generate Roadmap", "Start Mock Interview"

#### [NEW] client/src/pages/History.jsx
Unified history view with:
- Tab filters: All / Analyses / Roadmaps / Mock Interviews
- Search by company, role, date
- Sort by date, score
- Cards with status badges, scores, timestamps
- Click → detail view

---

### Component 7: Code Execution (DSA)

> [!IMPORTANT]
> For running user code against test cases, I'll use **Judge0 CE API** (free, open-source). The server will proxy requests to Judge0 to execute code in C++, Java, JavaScript, and Python sandboxes.

#### [MODIFY] server/routes/interview.js → `/run-code` endpoint
- Receives code + language + test cases
- Sends to Judge0 API (or fallback: AI-based evaluation without actual execution)
- Returns pass/fail for each test case with actual vs expected output

---

### Component 8: Deployment

#### [NEW] client/vercel.json
SPA routing configuration for Vercel deployment.

#### [NEW] server/Dockerfile
Production container for Render deployment.

#### [NEW] server/.env.example
All required environment variables with setup instructions:
```
MONGODB_URI=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GEMINI_API_KEY=
JUDGE0_API_KEY=            # Optional, for code execution
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
CLIENT_URL=
```

---

## Build Order

1. **Phase 1 — Foundation**: Project setup, design system, authentication
2. **Phase 2 — Resume Analyzer**: Upload + AI analysis + results display
3. **Phase 3 — Roadmap Generator**: Input modes + AI roadmap + timeline view
4. **Phase 4 — Mock Interview Core**: Setup wizard + question generation + basic text interview
5. **Phase 5 — Mock Interview Advanced**: Code editor (DSA) + audio input + MCQs + CS fundamentals
6. **Phase 6 — Evaluation & History**: Final scoring, feedback, history views
7. **Phase 7 — Polish & Deploy**: Loading states, animations, responsive, deployment configs

---

## Verification Plan

### Automated Tests
```bash
# Backend
cd server && npm run dev
# Test all API endpoints with curl/Postman

# Frontend
cd client && npm run build
# Verify zero build errors

# Full integration
npm run dev  # Both client + server
```

### Manual Verification
1. **Auth Flow**: Register → OTP → Login → Google OAuth → Protected routes
2. **Resume Analyzer**: Upload PDF + JD → AI analysis results with skill gauges
3. **Roadmap**: Generate for role-only, company+role, full JD → Timeline display
4. **Mock Interview DSA**: Start → Code editor → Run test cases → Submit → Score
5. **Mock Interview Technical**: Start → Text response → Audio response → Score
6. **Mock Interview HR**: Start → Behavioral questions → Text/audio → Score
7. **Mock Interview CS**: Start → MCQ selection → Text answers → Score
8. **Final Evaluation**: Complete mock → See overall scores & feedback
9. **History**: View past sessions, filter, search
10. **Loading States**: Verify skeleton screens during AI operations
11. **Responsive**: Test on mobile, tablet, desktop
12. **Deployment**: Verify Vercel + Render deployment
