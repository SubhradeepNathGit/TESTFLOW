# TESTFLOW

<p align="center">
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
</p>

<p align="center">
  <img src="client/public/Banner1.png" width="32%" />
  <img src="client/public/Banner2.png" width="32%" />
  <img src="client/public/Banner3.png" width="32%" />
</p>
<p align="center">
  <img src="client/public/Banner4.png" width="32%" />
  <img src="client/public/Banner5.png" width="32%" />
  <img src="client/public/Banner6.png" width="32%" />
</p>
<p align="center">
  <img src="client/public/Banner7.png" width="32%" />
  <img src="client/public/Banner8.png" width="32%" />
  <img src="client/public/Banner9.png" width="32%" />
</p>
<p align="center">
  <img src="client/public/Banner10.png" width="32%" />
  <img src="client/public/Banner11.png" width="32%" />
  <img src="client/public/Banner12.png" width="32%" />
</p>
<p align="center">
  <img src="client/public/Banner13.png" width="32%" />
  <img src="client/public/Banner14.png" width="32%" />
  <img src="client/public/Banner15.png" width="32%" />
</p>
<p align="center">
  <img src="client/public/Banner16.png" width="32%" />
  <img src="client/public/Banner17.png" width="32%" />
  <img src="client/public/Banner18.png" width="32%" />
</p>
<p align="center">
  <img src="client/public/Banner19.png" width="32%" />
  <img src="client/public/Banner20.png" width="32%" />
  <img src="client/public/Banner21.png" width="32%" />
</p>
<p align="center">
  <img src="client/public/Banner22.png" width="49%" />
  <img src="client/public/Banner23.png" width="49%" />
</p>

**TESTFLOW** is a highly scalable, production-ready Online Test Portal Engine designed to automate and streamline the assessment process. Built on a robust MERN (MongoDB, Express, React, Node.js) stack, it handles large-scale concurrent users, asynchronous jobs via Redis and BullMQ, and features an intelligent PDF Parsing Engine equipped with OCR capabilities.

## 🚀 Features
- **Intelligent PDF Parsing Engine**: Automatically extract MCQs, options, and answers directly from uploaded PDFs using `pdf-parse` and a fallback OCR engine using `tesseract.js` for scanned documents.
- **Automated Test Submissions**: Leverages Redis and BullMQ for precise timer-based automated submission of tests in the background when the time expires.
- **Real-Time Leaderboard**: Built with Socket.io for live updates on global leaderboards when students submit tests.
- **Premium User Interface**: Built with React 19, Tailwind CSS 4, Framer Motion, and Recharts for a seamless, interactive, and visually stunning frontend.
- **Secure Authentication System**: JWT-based authentication with role-based access control (Admin, Student, SuperAdmin) and encrypted passwords via `bcryptjs`.
- **Media Management**: Direct integration with Cloudinary for seamless upload and storage of profile pictures and related test assets.

## 🏗️ System Design Architecture

The TESTFLOW architecture follows a decoupled client-server model to ensure independent scaling, maintainability, and high availability.

### Backend Architecture (Server)
- **Framework**: Express.js (Node.js) handling RESTful API endpoints.
- **Database**: MongoDB (via Mongoose) used as the primary data store for Users, Tests, Questions, and Attempts.
- **Job Queueing**: BullMQ powered by Redis handles heavy, delayed, and background tasks (e.g., auto-submit timers, processing large PDFs).
- **WebSockets**: Socket.io enables real-time duplex communication for active exam monitoring and live leaderboard tracking.
- **Email Service**: Nodemailer integration for automated notifications.
- **Storage**: Cloudinary via Multer for optimized and distributed asset storage.

### Frontend Architecture (Client)
- **Core Framework**: React 19 + Vite for ultra-fast builds and Hot Module Replacement (HMR).
- **State Management**: Redux Toolkit for global state (auth, ui) alongside Zustand for lightweight specialized stores, and React Query for server-state synchronization and caching.
- **Routing**: React Router DOM (v7) for client-side routing.
- **Styling**: Tailwind CSS 4 + Lucide React + React Icons for a utility-first, highly customizable, and premium aesthetic.
- **Animations**: Framer Motion orchestrates complex, smooth page transitions and micro-interactions.
- **Data Visualization**: Chart.js and Recharts translate raw analytics into beautiful, actionable dashboards.

---

## 🧠 Core Engineering Concepts

### 1. The PDF Parsing Engine
The `utils/pdfParser.js` file houses the logic for extracting questions from unstructured PDF documents.
- **Text Extraction**: Uses `pdf-parse` to convert the PDF buffer into raw text strings.
- **Pattern Matching**: Implements complex regular expressions (`/^(\d+[\.\)]|\?)\s*(.+)/i`) to detect question patterns, options (`A-E`), and answer keys.
- **OCR Fallback**: If `pdf-parse` returns empty text (common in scanned documents), it automatically offloads the image buffer to `tesseract.js` to optically recognize the text.
- **Dynamic Marking**: Based on the detected sections (e.g., "Section A"), the engine assigns accurate relative marks.

### 2. Redis & BullMQ Asynchronous Workflows
When a student starts an exam, keeping track of the timer natively on the Node server is risky (if the server restarts, timers are lost).
- **The Queue**: TESTFLOW spins up a BullMQ `submissionQueue` backed by an `IORedis` instance.
- **Delay Mechanics**: As soon as a test attempt is initiated, a background job is pushed to the queue with a `delay` matching the test duration.
- **The Worker**: If the student doesn't submit manually, the worker (`config/worker.js`) triggers exactly when the delay ends, calculates the score independently, marks the attempt as `AUTO_SUBMITTED`, and commits it to the database.
- **Graceful Cancellation**: If the student submits manually, the system queries BullMQ using the `jobId` (`submit-${attemptId}`) and removes the scheduled auto-submit job.

### 3. Multi-Section Test Engine (Real-World Recruitment Assessment)
To mirror real-world recruitment and corporate assessments, TESTFLOW incorporates a highly advanced Multi-Section Test capability. This builds upon the traditional single-flow test by grouping questions into distinct logical sections (e.g., Aptitude, Technical, HR) with dedicated time management and navigation constraints.

**How it was built over the existing system:**
- **Dynamic Data Structure:** The backend schema was upgraded to support a nested `sections` array within the `Test` model, mapping questions to their respective section IDs rather than a flat list.
- **Section-Level Time Management:** Instead of a single global timer, the test engine now supports isolated timers per section. State management tracks active sections, automatically enforcing time limits and switching to the next section when time expires.
- **Strict Navigation Control:** Real-world assessments prevent candidates from freely navigating between sections. The updated UI implements lock-downs: once a section is submitted or times out, it is locked permanently. The student must progress linearly, mirroring platforms like HackerRank or SHL.
- **Sectional Analytics:** The auto-submit BullMQ worker was modified to calculate scores not just globally, but on a per-section basis, giving recruiters detailed insights into a candidate's specific domain strengths.

**Workflow Implementation:**
1. **Authoring:** Admin defines sections (e.g., "Logical Reasoning - 15 mins", "Coding - 30 mins") and assigns parsed questions to these sections.
2. **Execution:** Student starts the test. Only the first section is active. The global timer and section timer run concurrently.
3. **Transition:** When the section timer runs out (or the student submits the section), the frontend dispatches a `SECTION_SUBMIT` event, saving the current state to the backend, locking the section, and seamlessly transitioning to the next.
4. **Finalization:** Upon completing the final section, the entire test is submitted, and the BullMQ worker finalizes the score analytics.

---

## 💻 Full Workflow

### 1. Admin Workflow
1. **Creation**: Admin uploads a Question Paper PDF.
2. **Parsing**: The backend parses the PDF via the Parser Engine and returns structured JSON (Questions, Options, Answers).
3. **Review**: The Admin reviews the parsed output on the frontend and creates the Test object.
4. **Publish**: The Test goes live. Socket.io broadcasts the availability.

### 2. Student Workflow
1. **Enrollment**: Student joins the portal, sees live tests.
2. **Attempt**: Student starts the test. The backend registers an `IN_PROGRESS` attempt and schedules a BullMQ job.
3. **Execution**: The React frontend locks down, showing the countdown. Answers are synced via React Query.
4. **Submission**:
   - *Manual*: Student clicks submit. Backend calculates score, BullMQ job is canceled.
   - *Auto*: Timer hits zero. BullMQ worker kicks in and finalizes the attempt autonomously.
5. **Leaderboard**: Socket.io triggers a refetch, dynamically updating the global leaderboard for all connected clients.

---

## 🐳 Docker & Containerization Implementation

TESTFLOW is fully containerized to ensure consistent environments from development to production, leveraging `docker-compose` for orchestration.

**How Docker is Implemented:**
- **Microservices Architecture:** The application is split into isolated containers for the `client` and `server`.
- **Backend Container (`testflow-server`):** Built from `server/Dockerfile`, running on Node.js. It mounts a local volume for `server/uploads` to persist uploaded PDFs/media and injects environment variables securely.
- **Frontend Container (`testflow-client`):** Built from `client/Dockerfile`. In production, it utilizes NGINX within the container to serve the static React build and handles SSL termination (mounting Let's Encrypt certificates directly into the NGINX configuration).
- **Network Bridge (`testflow-network`):** A custom Docker network bridge allows the frontend and backend containers to communicate securely by resolving container names (e.g., `server:3006`) without exposing unnecessary ports to the host.
- **Deployment Efficiency:** The entire stack can be spun up with a single command (`docker-compose up -d --build`), drastically reducing environment setup time and configuration drift.

---

## 🛠️ User Guide: Local Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas URL)
- Redis Server (Local or Upstash URL)

### Environment Setup

**1. Clone the repository:**
```bash
git clone https://github.com/SubhradeepNathGit/TESTFLOW.git
cd TESTFLOW
```

**2. Backend Configuration (`/server`):**
Create a `.env` file in the `/server` directory:
```env
PORT=3006
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
REDIS_URL=redis://127.0.0.1:6379
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**3. Frontend Configuration (`/client`):**
Create a `.env` file in the `/client` directory:
```env
VITE_API_URL=http://localhost:3006/api/v1
```

### Installation & Execution

**Backend:**
```bash
cd server
npm install
npm run dev
```

**Frontend:**
```bash
cd client
npm install
npm run dev
```

---

## ☁️ AWS EC2 Deployment Guide

To deploy TESTFLOW as a production-grade application on AWS EC2:

### 1. Provision an EC2 Instance
- Launch an **Ubuntu 24.04 LTS** instance on AWS EC2 (t3.small or t3.medium recommended for Node/Redis/Mongo).
- Configure Security Groups to allow inbound traffic on:
  - SSH (Port 22)
  - HTTP (Port 80)
  - HTTPS (Port 443)
  - Custom TCP (Port 3006 - optional, if reverse proxy isn't used)

### 2. Server Initialization
SSH into the EC2 instance and install dependencies:
```bash
sudo apt update && sudo apt upgrade -y
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
# Install Redis
sudo apt install redis-server -y
sudo systemctl enable redis-server.service
```

### 3. Application Setup
Clone the repository onto the server and install `pm2` for process management:
```bash
git clone https://github.com/SubhradeepNathGit/TESTFLOW.git
cd TESTFLOW
sudo npm install -g pm2
```

### 4. Build and Run Backend
```bash
cd server
npm install
# Ensure you create the .env file as per the Local Setup guide
pm2 start app.js --name "testflow-api"
pm2 save
pm2 startup
```

### 5. Build and Serve Frontend
```bash
cd ../client
npm install
npm run build
# Serve the dist folder using a web server like NGINX
```

### 6. NGINX Reverse Proxy (Optional but Recommended)
Install NGINX to route port 80 traffic to your frontend build and backend API:
```bash
sudo apt install nginx -y
```
Configure `/etc/nginx/sites-available/default`:
```nginx
server {
    listen 80;
    server_name your_domain_or_ip;

    # Serve React Frontend
    location / {
        root /home/ubuntu/TESTFLOW/client/dist;
        index index.html;
        try_files $uri /index.html;
    }

    # Route API requests to Node backend
    location /api/ {
        proxy_pass http://localhost:3006/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Route Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3006;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```
Restart NGINX:
```bash
sudo systemctl restart nginx
```

Your TESTFLOW instance is now live, scalable, and fully operational!
