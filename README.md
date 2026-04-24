<div align="center">
  <img src="https://via.placeholder.com/150/000000/FFFFFF/?text=TESTFLOW" alt="TestFlow Logo" width="150" height="150">
  
  # 🚀 TESTFLOW: Enterprise-Grade Online Assessment Platform
  
  **The ultimate, production-ready, highly scalable test portal engine engineered for the modern web.**
  
  [![React](https://img.shields.io/badge/React-19.2.0-blue.svg?style=flat-square&logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
  [![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D.svg?style=flat-square&logo=redis)](https://redis.io/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.17-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
  [![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101.svg?style=flat-square&logo=socketdotio)](https://socket.io/)

  *Built with ❤️ by an aspiring Full-Stack Engineer ready to make an impact.*
</div>

---

## 🌟 Project Overview

**TESTFLOW** is a robust, multi-tenant B2B online assessment platform designed to handle thousands of concurrent users with zero latency. It empowers educational institutions to create, manage, and evaluate online tests seamlessly while offering students an immersive, real-time testing environment.

From **automated PDF test generation** using OCR/Parsing to **real-time WebSocket leaderboards**, distributed **Redis queues** for test auto-submission, and deep **TanStack Query** frontend caching, this platform is engineered following the highest industry standards.

---

## 🔥 Key Features & Optimizations

### 🛡️ Enterprise Architecture & Security
- **Multi-Tenant System:** Segregated data models using `institutionId` for complete data isolation.
- **Hierarchical RBAC (Role-Based Access Control):** 4 distinct roles (Super Admin, Owner/Institution Admin, Instructor, Student) with strict middleware enforcement.
- **Advanced Authentication:** JWT-based stateless auth, Refresh Tokens (rotated & securely handled), OTP email verification, and cryptographic password resets.
- **Rate Limiting & Security Headers:** Express-rate-limit and Helmet to prevent DDoS, Brute-force attacks, and XSS.

### ⚡ Performance & Scalability Optimizations
- **Redis & BullMQ:** Offloaded heavy tasks (auto-submission of expired tests) to background workers using Redis queues, preventing Node.js event-loop blocking.
- **Socket.io Real-Time Engine:** Live institution-scoped events for attempt tracking, live leaderboards, and instant dashboard updates without HTTP polling.
- **TanStack Query (React Query):** Implemented on the frontend for aggressive caching, request deduplication, background data synchronization, and optimistic UI updates.
- **Optimized MongoDB Queries:** Extensive use of MongoDB Aggregation Pipelines (e.g., `getTestStats`, `getGlobalLeaderboard`) to compute complex analytics at the database level rather than application level. Indexed fields (`studentId`, `testId`, `institutionId`) for rapid lookups.
- **Lazy Loading & Code Splitting:** React components are dynamically imported to reduce the initial JS bundle size.

### 🧠 Innovative Features
- **AI/Automated Test Creation:** Upload a PDF and the server parses it (`pdf-parse`, regex patterns) to automatically generate MCQs, options, and answers, accurately calculating total marks.
- **Automated Timers & Submission:** Real-time synchronized timers. If a student disconnects or time runs out, the Redis worker automatically submits the test accurately.
- **Analytics Dashboard:** Deep instructor insights showing standard deviation, pass rates, score bands (buckets), and per-question difficulty (accuracy rate) to analyze student performance.
- **Audit Logging:** Non-blocking tracking of critical user actions (logins, creates, deletes) for compliance and tracking.

---

## 🏗️ System Design & Architecture

### Backend (Node.js/Express)
The backend follows a strict **Controller-Service-Model** architecture:
- **Routes Layer:** Maps HTTP endpoints to controllers. Applies Auth and RBAC middleware.
- **Controller Layer:** Handles HTTP request/response formatting, status codes, and input validation.
- **Service Layer:** Contains the core business logic, database queries, and external integrations (Redis, Email).
- **Model Layer:** Mongoose schemas with strict validation, pre-save hooks (password hashing), and instance methods.

### Frontend (React/Vite)
- **State Management:** `Zustand` for lightweight global UI state (Sidebar), `React Query` for server state, `Context API` for Auth/Socket state.
- **Component Architecture:** Reusable, accessible UI components (Modals, Custom Selects, Data Tables) using `Lucide-React` icons and `Tailwind CSS`.
- **Routing:** Protected routing logic intercepting unauthorized access and redirecting based on user roles natively via `react-router-dom`.

---

## 📂 Detailed Codebase Breakdown

### 🖥️ Client (Frontend) Directory Structure
\`\`\`text
client/
├── public/                 # Static assets
├── src/
│   ├── api/                # Axios instance & API wrapper functions
│   │   ├── axiosInstance.js  # Configures base URL, headers, and JWT interceptors (auto-refresh logic)
│   │   ├── attemptApi.js     # Endpoints for starting, saving, submitting tests
│   │   ├── testApi.js        # Endpoints for test CRUD and analytics
│   │   └── answerKeyApi.js   # Endpoints for handling PDF answer keys
│   ├── components/         # Reusable UI building blocks
│   │   ├── auth/             # ProtectedRoute wrapper
│   │   ├── common/           # ErrorBoundary, Logo, Pagination, SearchBar, Skeleton loaders
│   │   └── modals/           # ConfirmationModal, ProfileModal, QuestionModal, TaskModal
│   ├── context/            # Global Contexts
│   │   ├── AuthContext.jsx   # Manages JWT token lifecycle, login/logout, and RBAC helper functions
│   │   └── SocketContext.jsx # Initializes and provides the Socket.io client instance
│   ├── layouts/            # Page layouts (e.g., DashboardLayout with Sidebar & Header)
│   ├── pages/              # Route-level components
│   │   ├── admin/            # SuperAdminDashboard, Institution Management
│   │   ├── auth/             # Login, Register, Forgot Password, OTP Verification flows
│   │   ├── dashboard/        # Instructor/Student dashboards, Analytics, Archive
│   │   ├── profile/          # User profile settings
│   │   └── tests/            # TestPlayer (actual exam UI), ResultsPage, Leaderboard
│   ├── routes/             # App routing logic (Routing.jsx with Role-based redirects)
│   ├── store/              # Zustand stores (useSidebarStore.js)
│   ├── App.jsx             # Root component wrapping providers (Query, Socket, Auth, Toast)
│   ├── main.jsx            # React entry point, initializes TanStack QueryClient
│   └── index.css           # Tailwind base styles and custom CSS variables
\`\`\`

### ⚙️ Server (Backend) Directory Structure
\`\`\`text
server/
├── app.js                  # Entry point: Express setup, DB connection, Middlewares, Socket.io attachment
├── app/
│   ├── config/             # Database and service configurations
│   │   ├── db.js             # MongoDB connection logic
│   │   ├── redis.js          # Redis client and BullMQ Queue instantiation
│   │   ├── worker.js         # BullMQ Worker processing auto-submissions asynchronously
│   │   └── roles.json        # Centralized Role & Permission configuration matrix
│   ├── controllers/        # Request handlers
│   │   ├── AdminController.js    # Super Admin metrics, institution & global user management
│   │   ├── AttemptController.js  # Handles test taking, answer saving, and manual/auto submissions
│   │   ├── AuthController.js     # JWT auth, registration, OTP, password recovery
│   │   ├── TestController.js     # Test CRUD, PDF uploads, Publishing, Analytics
│   │   ├── UserController.js     # Profile management, Institution specific user management
│   │   └── AnswerKeyController.js# Answer key PDF uploads using Cloudinary
│   ├── middleware/         # Express middlewares
│   │   ├── auth.js           # Validates JWT and attaches user to request
│   │   ├── rbac.js           # Enforces role/permission checks using roles.json
│   │   ├── error.js          # Global error handler returning standardized JSON
│   │   ├── upload.js & pdfUpload.js # Multer configurations for images and PDFs
│   │   └── index.js          # Bootstraps security middlewares (Helmet, CORS, Rate Limit, Compression)
│   ├── models/             # Mongoose Schemas
│   │   ├── User.js           # Users (Super Admin, Owner, Instructor, Student)
│   │   ├── Institution.js    # Multi-tenant isolation entity
│   │   ├── Test.js           # Test metadata
│   │   ├── Question.js       # MCQs linked to Tests
│   │   ├── Attempt.js        # Tracks student progress, answers, scores, and expiration times
│   │   ├── AnswerKey.js      # Stores uploaded PDF answer keys
│   │   └── AuditLog.js       # Non-blocking tracking of platform actions
│   ├── routes/             # Express Routers linking to Controllers
│   ├── services/           # Core Business Logic (Separation of Concerns)
│   │   ├── auth.service.js   # DB interactions for authentication
│   │   ├── test.service.js   # Heavy lifting for Test Analytics aggregation and PDF parsing
│   │   ├── attempt.service.js# Test submission logic, score calculation, Redis auto-submit queuing
│   │   └── user.service.js   # Profile and user management
│   └── utils/              # Utility functions
│       ├── socket.js         # Socket.io server configuration, namespacing by institutionId
│       ├── pdfParser.js      # Custom PDF text extraction and Regex-based Question mapping
│       ├── auditLogger.js    # Asynchronous DB logging helper
│       ├── emailService.js & sendEmail.js # Nodemailer integration for OTPs and notifications
│       └── scheduler.js      # Node-cron for daily recurring tasks (e.g., reminders)
\`\`\`

---

## 🔄 Detailed API Workflow Example: Taking a Test

1. **Start Attempt (`POST /api/attempts/start`)**
   - **Frontend:** Student clicks "Start Test".
   - **Backend:** `AttemptController` validates the test exists and is Published. Checks if an attempt already exists.
   - **Service:** Creates a new `Attempt` document with `status: IN_PROGRESS` and sets `expiresAt` based on test duration.
   - **Redis Integration:** Dispatches a delayed job to BullMQ (`submissionQueue.add`) scheduled to execute precisely when `expiresAt` occurs.
   - **Socket:** Emits `test:attempt_started` to the institution room so instructors see live activity.

2. **Save Answer (`POST /api/attempts/save-answer`)**
   - **Frontend:** Student clicks an option. TanStack Query `useMutation` sends the request in the background.
   - **Backend:** Updates the specific answer array in the `Attempt` document. Verifies time hasn't expired.

3. **Submit Attempt (`POST /api/attempts/submit`)**
   - **Frontend:** Student clicks "Submit Test".
   - **Backend:** Fetches all questions, compares answers, calculates the `score`. Updates status to `SUBMITTED`.
   - **Redis Integration:** Cancels the scheduled BullMQ auto-submit job to prevent duplicate processing.
   - **Socket:** Emits `test:attempt_submitted` to update live dashboards and leaderboards instantly.

*If the student closes the browser, the **BullMQ Worker** deployed in `worker.js` automatically processes the test at the `expiresAt` timestamp, calculates the score, and marks it as `AUTO_SUBMITTED`.*

---

## 🔮 Future Scope & Roadmap

1. **AI Proctoring:** Integration of WebRTC and AI vision models (like TensorFlow.js) for head-movement tracking, multiple-face detection, and tab-switch monitoring to prevent cheating.
2. **Microservices Migration:** As the platform scales, breaking out the `Analytics Engine` and `Notification Service` into independent microservices using gRPC or RabbitMQ.
3. **Advanced Question Types:** Expanding beyond MCQs to include Coding challenges (via isolated Docker containers) and subjective answers (graded via LLMs).
4. **Offline Mode capabilities:** Utilizing PWA Service Workers to cache questions, allowing students in low-bandwidth areas to take the test and sync answers upon reconnection.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster
- Redis Server (Local or Cloud like Upstash/RedisLabs)
- Cloudinary Account (for image/PDF storage)

### Installation
1. **Clone the repository:**
   \`\`\`bash
   git clone https://github.com/SubhradeepNathGit/TESTFLOW.git
   cd TESTFLOW
   \`\`\`

2. **Setup Server:**
   \`\`\`bash
   cd server
   npm install
   # Configure .env file using variables from .env.example
   npm run dev
   \`\`\`

3. **Setup Client:**
   \`\`\`bash
   cd client
   npm install
   # Configure .env file
   npm run dev
   \`\`\`

---

## 📞 Contact & Hiring

**Subhradeep Nath**  
Full-Stack Developer | System Design Enthusiast
- **Email:** subhradeepnath2.o@gmail.com
- **LinkedIn:** [Available upon request]
- **GitHub:** [SubhradeepNathGit](https://github.com/SubhradeepNathGit)

> *"I don't just write code; I architect solutions. I am actively seeking Full-Stack Engineering roles where I can bring my expertise in React, Node.js, distributed systems, and performance optimization to a forward-thinking team. Let's build something amazing together."*
