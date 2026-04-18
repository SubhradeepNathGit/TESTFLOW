<div align="center">
  <img src="https://via.placeholder.com/150/4f46e5/ffffff?text=TESTFLOW" alt="TESTFLOW Logo" width="120" />

  # TESTFLOW 🚀
  
  **A Next-Generation, Real-Time Assessment & Examination Platform**

  [![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-Backend-green?logo=nodedotjs)](https://nodejs.org/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Database-success?logo=mongodb)](https://mongodb.com/)
  [![Redis](https://img.shields.io/badge/Redis-Queue%20%26%20Sync-red?logo=redis)](https://redis.io/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
</div>

---

## 🌟 Overview
**TESTFLOW** is a comprehensive, multi-tenant online examination platform designed for educational institutions, corporate training, and independent instructors. It manages the entire lifecycle of secure evaluations—from automated PDF question parsing and real-time test execution to advanced statistical analytics and global leaderboards.

The application leverages a high-performance **MERN stack**, augmented with **Redis/BullMQ** for precise timing controls and **Socket.io** for real-time live proctoring and synchronicity.

---

## 🏗 System Architecture & Role-Based Access Control (RBAC)

The platform is strictly segregated into four hierarchical roles to ensure security and operational efficiency:

1. **Platform Admin (Super Admin)**:
   - Oversees the global infrastructure.
   - Registers and manages *Institutions*.
   - Global dashboard showing multi-tenant metrics and global activity.
2. **Institution Admin**:
   - Manages the personnel isolated within their own organization.
   - Onboards and restricts *Instructors* and *Students*.
3. **Instructor**:
   - Creates exams (manually or via intelligent automated PDF MCQ parsing).
   - Manages the exam lifecycle (Draft -> Published -> Archived).
   - Monitors live test attempts in real-time.
   - Analyzes deep aggregation metrics on student performance.
4. **Student**:
   - Takes strictly timed exams.
   - Real-time score boards and historical attempt tracking.
   - Performance dashboards and global percentile leaderboards.

---

## 🚀 Key Workflows

### 1. Intelligent PDF Parsing
Instructors no longer need to type out questions manually. They can simply upload a formatted PDF document, and TESTFLOW's backend utilizing `pdf-parse` extracts the questions, options, and correct answers automatically to generate a comprehensive digital exam in seconds.

### 2. Time-Strict Assessment Execution
TESTFLOW utilizes robust backend timers to prevent manipulation. When a student starts an exam:
- An attempt document is born in **MongoDB**.
- **BullMQ + Redis** simultaneously queues an auto-submit job.
- If the student fails to submit before the time expires, the worker forcibly evaluates and auto-submits the test.

### 3. Real-Time Interactions
Using `socket.io`, actions across the platform are localized instantly without manual refresh:
- When an instructor publishes an exam, it immediately appears on all enrolled student dashboards.
- When an exam is ongoing, instructors see live notifications of submissions.
- Leaderboards auto-update dynamically based on active scoring logic.

---

## 📦 Technology Stack & Packages

### 💻 Frontend (Client)
Built with **Vite** and **React 19**, the frontend prioritizes speed, modularity, and premium aesthetics.

* **Core & Routing:** `react`, `react-dom`, `react-router-dom`
* **Styling & UI:** `tailwindcss` (@tailwindcss/vite), `framer-motion` (animations), `clsx` & `tailwind-merge` (dynamic classes).
* **State Management:** `zustand` (lightweight global state).
* **Network & Sockets:** `axios` (API requests), `socket.io-client` (WebSockets).
* **Data Visualization:** `chart.js`, `react-chartjs-2`, `recharts` for instructor analytics.
* **Forms & Validation:** `react-hook-form`
* **Icons:** `lucide-react`, `react-icons`
* **Utilities:** `jwt-decode` (token parsing), `react-datepicker`, `react-toastify` (notifications).

### ⚙️ Backend (Server)
Built on **Node.js** and **Express 5**, ensuring massive concurrent scalability.

* **Database & ORM:** `mongoose`
* **Security & Auth:** `bcryptjs` (password hashing), `jsonwebtoken` (stateless auth), `helmet` (HTTP headers), `express-validator`, `express-rate-limit`, `cors`.
* **Queues & Timers:** `ioredis` and `bullmq` handling precise chron-jobs and asynchronous operations.
* **File Processing:** `multer` (multipart/form-data), `pdf-parse`, `pdfkit`, `tesseract.js`.
* **Cloud Storage:** `cloudinary`, `multer-storage-cloudinary` (for profile avatars).
* **Real-Time:** `socket.io`
* **Logging:** `winston` & `morgan` providing combined and error-separated production logging.
* **Email Services:** `nodemailer`

---

## 📂 Project Structure

```text
testflow/
├── client/                     # Frontend Vite / React application
│   ├── src/
│   │   ├── api/                # Axios interceptors and route definitions
│   │   ├── components/         # Reusable UI (Modals, Tables, Navbars, Sidebar)
│   │   ├── context/            # AuthContext, SocketContext providers
│   │   ├── pages/              # View layer matching URL routes
│   │   │   ├── admin/          # SuperAdmin & InstitutionAdmin dashboards
│   │   │   ├── auth/           # Login / Registration views
│   │   │   ├── dashboard/      # Instructor & Student specific views
│   │   │   └── tests/          # Live test portal, Leaderboards
│   │   ├── routes/             # Protected/Role-based routing wrappers
│   │   ├── index.css           # Global Tailwind directives
│   │   └── main.jsx            # React root component
│   └── package.json
│
├── server/                     # Backend Node/Express application
│   ├── app/
│   │   ├── config/             # DB connections, Redis, Worker settings
│   │   ├── controllers/        # Route logic (Auth, Test, Attempt, Answers)
│   │   ├── middlewares/        # JWT auth, Error handling, Role checking
│   │   ├── models/             # Mongoose schemas (User, Test, Question, Attempt)
│   │   ├── routes/             # Express app routing
│   │   ├── services/           # Heavy lifting business logic (PDF extract, Scoring)
│   │   └── utils/              # Sockets, Custom Error Classes, Logging
│   ├── logs/                   # Winston auto-generated `error.log` and `combined.log`
│   ├── app.js                  # Server entrypoint
│   └── package.json
```

---

## 🛠 Installation & Local Setup

### Prerequisites
- Node.js (v18+)
- MongoDB connection string
- Redis Server (Running locally or via cloud like Upstash)
- Cloudinary credentials

### 1. Database & Backend Setup
```bash
cd server
npm install

# Create your .env file
touch .env
```
**Server `.env` Configuration:**
```env
PORT=3006
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_strong_secret
REDIS_URL=your_redis_connection_string
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
SMTP_USER=optional_email
SMTP_PASS=optional_password
```

Start the backend in development mode:
```bash
npm run dev
```

### 2. Frontend Setup
```bash
cd client
npm install

# Create your .env file
touch .env
```
**Client `.env` Configuration:**
```env
VITE_API_URL=http://localhost:3006/api
VITE_SOCKET_URL=http://localhost:3006
```

Start the frontend Vite server:
```bash
npm run dev
```

---

## 🛡️ Production Readiness Features
1. **Deduplicated Data Processing**: Front-ends have aggregation methods implemented to handle network double-calls gracefully.
2. **Robust Error Handling**: Centralized error middleware ensures clients never crash outright when servers throw unhandled exceptions.
3. **Comprehensive Logging**: Winston captures all operational output directly to `server/logs/`, preventing silent failures.
4. **Soft Deletes**: Exams and questions employ architectural Soft Deletes to preserve historical attempt records and relational integrity.
5. **Architectural Security**: Helmet applied HTTP headers, rate limiters, and `bcrypt` protect passwords, preventing Brute Force and XSS/Man-in-the-Middle attacks.

---

<div align="center">
  <p>Built as a scalable, high-performance solution for the future of digital education.</p>
</div>
