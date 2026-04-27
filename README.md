<div align="center">


  # TESTFLOW
  
  **Enterprise-Grade Online Assessment & Examination Platform**

  [![React](https://img.shields.io/badge/React-19.2.0-blue.svg?style=flat&logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg?style=flat&logo=nodedotjs)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?style=flat&logo=mongodb)](https://www.mongodb.com/)
  [![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D.svg?style=flat&logo=redis)](https://redis.io/)
  [![Swagger](https://img.shields.io/badge/Swagger-API_Docs-85EA2D.svg?style=flat&logo=swagger)](http://localhost:3006/api-docs)
</div>

<br />

## 📖 Overview

**TESTFLOW** is a highly scalable, multi-tenant assessment platform engineered to handle massive concurrent traffic for educational institutions and corporate environments. It transcends traditional CRUD applications by implementing complex distributed systems patterns, real-time bidirectional communication, and automated background processing.

Whether it's parsing unstructured PDFs into structured MCQs using AI/Regex or managing asynchronous test auto-submissions via distributed Redis queues, this platform is built to production-grade standards.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    classDef client fill:#1e293b,stroke:#38bdf8,color:#e2e8f0,stroke-width:2px
    classDef gateway fill:#0f172a,stroke:#818cf8,color:#e2e8f0,stroke-width:2px
    classDef middleware fill:#1e1b4b,stroke:#a78bfa,color:#e2e8f0,stroke-width:1px
    classDef controller fill:#172554,stroke:#60a5fa,color:#e2e8f0,stroke-width:1px
    classDef service fill:#0c4a6e,stroke:#38bdf8,color:#e2e8f0,stroke-width:1px
    classDef database fill:#14532d,stroke:#4ade80,color:#e2e8f0,stroke-width:2px
    classDef queue fill:#7c2d12,stroke:#fb923c,color:#e2e8f0,stroke-width:2px
    classDef infra fill:#1c1917,stroke:#a8a29e,color:#e2e8f0,stroke-width:1px

    subgraph BROWSER["🌐  Browser  (React 19 + Vite + Tailwind CSS)"]
        direction TB
        TQ["TanStack Query\nServer-State Cache"]:::client
        ZS["Zustand\nUI State Store"]:::client
        SC["Socket.io Client\nWSS Live Events"]:::client
        PAGES["Pages & Components\nStudent · Instructor · Admin"]:::client
        AX["Axios Interceptor\nJWT Auto-Refresh"]:::client
        PAGES --> TQ & ZS & SC
        TQ --> AX
    end

    subgraph SERVER["⚙️  Express API Server  (Node.js 18 + Express 5)"]
        direction TB

        subgraph MIDDLEWARES["Security Layer"]
            direction LR
            CORS["CORS\nOrigin Guard"]:::middleware
            HELMET["Helmet\nHTTP Headers"]:::middleware
            RL["Rate Limiter\n1000 req / 15 min"]:::middleware
            COMP["Compression\ngzip"]:::middleware
            AUTH["JWT Auth\nprotect()"]:::middleware
            RBAC["RBAC\ncheckPermission()"]:::middleware
        end

        subgraph CONTROLLERS["Controller Layer"]
            direction LR
            AUTHC["AuthController\nRegister · Login · OTP"]:::controller
            TESTC["TestController\nCRUD · Publish · Stats"]:::controller
            ATTEMPTC["AttemptController\nStart · Save · Submit"]:::controller
            USERC["UserController\nProfile · Members"]:::controller
            ADMINC["AdminController\nMetrics · Institutions"]:::controller
            AKC["AnswerKeyController\nPDF Upload"]:::controller
        end

        subgraph SERVICES["Service Layer (Business Logic)"]
            direction LR
            AUTHS["auth.service\nBcrypt · OTP · Tokens"]:::service
            TESTS["test.service\nPDF Parse · Aggregations"]:::service
            ATTEMPTS["attempt.service\nScore Calc · Auto-Submit"]:::service
            USERS["user.service\nRole Management"]:::service
        end

        subgraph UTILS["Utilities"]
            direction LR
            SOCKETS["Socket.io\nemitToInstitution()"]:::service
            PDFP["PDF Parser\nRegex MCQ Extractor"]:::service
            AUDIT["Audit Logger\nNon-blocking Writes"]:::service
            EMAIL["Nodemailer\nOTP · Reset · Welcome"]:::service
        end

        MIDDLEWARES --> CONTROLLERS
        CONTROLLERS --> SERVICES
        SERVICES --> UTILS
    end

    subgraph DATAPLANE["🗄️  Data & Infrastructure Plane"]
        direction TB

        subgraph MONGODB["MongoDB Atlas  (7 Collections)"]
            direction LR
            U[("users")]:::database
            I[("institutions")]:::database
            T[("tests")]:::database
            Q[("questions")]:::database
            ATT[("attempts")]:::database
            AK[("answerkeys")]:::database
            AL[("auditlogs")]:::database
        end

        subgraph REDISP["Redis Cloud  (Message Broker)"]
            direction LR
            BQ["BullMQ Queue\ntest-submission"]:::queue
            WORKER["BullMQ Worker\nAuto-Submit Processor"]:::queue
            BQ --> WORKER
        end

        subgraph EXTERNAL["External Services"]
            direction LR
            CDN["Cloudinary CDN\nProfile Images · PDF Keys"]:::infra
            SMTP2["Gmail SMTP\nTransactional Email"]:::infra
        end
    end

    AX -->|"REST  /api/*"| MIDDLEWARES
    SC <-->|"WSS  wss://*"| SOCKETS
    SERVICES <-->|"Mongoose ODM"| MONGODB
    ATTEMPTS -->|"scheduleAutoSubmit()"| BQ
    WORKER -->|"calculateScore() + save()"| ATT
    AKC -->|"multer-cloudinary"| CDN
    EMAIL --> SMTP2
    AUDIT --> AL
```

---

## ⚙️ Core Workflows & Engineering Optimizations

### 1. Resilient Test Auto-Submission (Distributed Queues)
**The Problem:** If a student's internet drops or they close their browser, their test timer expires, but the server never receives a "submit" request, leaving the test in a hanging state.
**The TESTFLOW Solution:**
- When a student starts an attempt, the `AttemptService` calculates the exact expiry timestamp.
- It pushes a delayed job to a **Redis Queue** using `BullMQ`.
- A standalone `worker.js` listens to this queue. If the time expires and the test isn't manually submitted, the worker independently calculates the score based on saved answers and marks it as `AUTO_SUBMITTED` directly in MongoDB.
- If the student submits manually *before* the time runs out, the API securely cancels the pending Redis job.

### 2. Automated Test Generation via PDF Parsing
**Workflow:**
- Instructors upload a standard question paper PDF.
- The `PDFParser` utility utilizes `pdf-parse` (with `tesseract.js` fallback hooks) to extract raw text.
- Complex Regular Expressions isolate the Question Text, Options (A-E), and the Correct Answer Key.
- The backend automatically calculates total marks, bundles the questions, and constructs a relational test entity in MongoDB.

### 3. Real-Time Dashboard Synchronization
**Workflow:**
- `Socket.io` is implemented with strict authentication and namespacing by `institutionId`.
- When an event occurs (e.g., a student starts a test, or an instructor publishes an answer key), the backend emits localized events.
- The React frontend captures these events and forcefully invalidates specific `TanStack Query` caches, triggering silent, instant background refetches. Result: Zero-reload, live-updating dashboards.

---

## 🛡️ Security & RBAC Implementation

Security is handled at both the gateway and controller levels.

1.  **Stateless Authentication:** Short-lived JWT Access Tokens combined with long-lived, securely stored Refresh Tokens prevent session hijacking.
2.  **Hierarchical RBAC Matrix:** 
    - `Super Admin`: Platform-wide metrics and institution suspension.
    - `Owner`: Institution-level control (add/remove students/instructors).
    - `Instructor`: Test creation, PDF uploading, analytics viewing.
    - `Student`: Read-only access to published tests and personal results.
3.  **Audit Logging:** Every critical action (Login, Delete, Update) triggers a non-blocking asynchronous database write to the `AuditLog` collection, tracking IP, User Agent, and Target IDs.

---

## 📂 Detailed Codebase Topography

<details>
<summary><b>Frontend Structure (React/Vite)</b></summary>

```text
client/src/
├── api/                # Axios interceptors (auto token refresh) & modular API hooks
├── components/         # Atomic UI components
│   ├── auth/           # RBAC Protected Route wrappers
│   ├── common/         # SearchBars, Pagination, ErrorBoundaries, Skeletons
│   └── modals/         # Confirmation & Profile Modals
├── context/            # Socket.io connection & Auth lifecycle providers
├── layouts/            # Dashboard layouts with responsive sidebars
├── pages/              
│   ├── admin/          # Super Admin & Institution Owner management panels
│   ├── dashboard/      # Instructor Analytics & Archival pages
│   └── tests/          # The core TestPlayer engine & Live Leaderboards
├── routes/             # Centralized routing logic
└── store/              # Zustand global state (Sidebar toggle, etc.)
```
</details>

<details>
<summary><b>Backend Structure (Node/Express)</b></summary>

```text
server/app/
├── config/             # DB, Redis, BullMQ Worker initialization, and Roles JSON
├── controllers/        # Request parsing and response formatting
├── middleware/         # Security (Helmet, Rate Limiter), Auth (JWT), Multer (File uploads)
├── models/             # Mongoose schemas with pre-save hooks (bcrypt)
├── routes/             # Express API route definitions
├── services/           # Heavy lifting (Analytics aggregation, Auto-submit logic)
└── utils/              # PDF Parsing, Socket.io emitters, Nodemailer, Cron Jobs
```
</details>

---

## 💻 Technical Stack

| Domain | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite | High-performance virtual DOM rendering with instant HMR dev experience. |
| **State & Caching** | Zustand + TanStack Query | Eliminates prop-drilling; Query handles race conditions and stale data automatically. |
| **Styling** | Tailwind CSS v4 | Utility-first, highly maintainable design system without CSS bloat. |
| **Backend Framework** | Node.js + Express 5 | Event-driven I/O model perfect for concurrent test-taking connections. |
| **Primary Database** | MongoDB Atlas | Flexible document model; crucial for complex nested aggregation pipelines (Analytics). |
| **Queue / Cache** | Redis + BullMQ | Highly reliable job scheduling for asynchronous tasks preventing event-loop blocks. |
| **Real-Time Comm.** | Socket.io | Reliable WebSocket fallbacks with built-in broadcasting/room capabilities. |

---

## 🚀 Getting Started

Follow these instructions to spin up the entire architecture locally.

### Prerequisites
- Node.js (v18+)
- Local or Cloud MongoDB Instance
- Local or Cloud Redis Server

### Environment Configuration
Create `.env` files in both `client` and `server` based on their respective `.env.example` templates.

**Crucial Server Variables:**
```env
MONGODB_URL=mongodb://localhost:27017/testflow
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/SubhradeepNathGit/TESTFLOW.git
   cd TESTFLOW
   ```

2. **Boot the Backend**
   ```bash
   cd server
   npm install
   npm run dev
   ```

3. **Boot the Frontend**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```

---

## 📖 API Documentation (Swagger)

The backend exposes an interactive **Swagger UI** containing schemas, endpoints, and authentication flows.
With the server running, access the docs at:  
👉 **[http://localhost:3006/api-docs](http://localhost:3006/api-docs)**

---

## 📄 License & Contact

This project is licensed under the ISC License.

<div align="center">
  <b>Architected & Developed by <a href="https://github.com/SubhradeepNathGit">Subhradeep Nath</a></b><br/>
  <i>Open to Full-Stack Software Engineering Opportunities</i>
</div>
