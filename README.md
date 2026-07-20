<p align="center">
  <h1 align="center">🏗️ SiteNex — Construction Site Management System</h1>
  <p align="center">
    A full-stack, role-based construction project management platform with ML-powered risk prediction.
    <br />
    <a href="https://github.com/HarithaGeemal/Site-Nex"><strong>View Repository »</strong></a>
  </p>
</p>

<br />

## 📋 Table of Contents

- [Introduction](#-introduction)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [User Roles & Portals](#-user-roles--portals)
- [Database Schema](#-database-schema)
- [API Structure](#-api-structure)
- [Issues Faced & How We Fixed Them](#-issues-faced--how-we-fixed-them)
- [Prerequisites](#-prerequisites)
- [Project Setup](#-project-setup)
- [Running the Application](#-running-the-application)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Screenshots](#-screenshots)
- [Contributors](#-contributors)
- [License](#-license)

---

## 🚀 Introduction

**SiteNex** is a comprehensive, full-stack web application designed to digitize and streamline the management of construction projects. It replaces traditional paper-based processes with a modern, role-based platform that connects all stakeholders — from **Admins** and **Project Managers** to **Site Engineers**, **Safety Officers**, **Store Keepers**, and on-ground **Workers** — into a single, synchronized ecosystem.

The platform covers the complete lifecycle of a construction project: project creation, task assignment and tracking, worker management, safety compliance, inventory and tool management, daily site reporting, and ML-powered delay risk prediction.

---

## ✨ Key Features

| Module | Description |
|---|---|
| **Project Management** | Create, track, and manage multiple construction projects with budgets, timelines, and progress tracking |
| **Task Workflow** | Hierarchical task management with subtasks, dependencies, SE assignments, and completion approval workflows |
| **Role-Based Access Control (RBAC)** | Granular, project-scoped permissions enforced via middleware with a role hierarchy matrix |
| **Worker Portal** | Dedicated portal for workers to view assigned tasks, submit timesheets, and access safety notices |
| **Safety Management** | Full safety suite — incidents, observations, hazard reports, Permit-to-Work (PTW), and safety notices |
| **Inventory & Tools** | Store Keeper ecosystem for tracking tools, material requests, issuance logs, and returns |
| **Daily Reporting** | Site progress reports submitted by Site Engineers for PM review |
| **ML Risk Prediction** | Machine Learning model (Flask API) that predicts project delay risk based on resource and constraint data |
| **Admin Dashboard** | System-wide user management, platform analytics, and risk assessment oversight |
| **JWT Authentication** | Secure, token-based authentication with password hashing (bcrypt) and 7-day token expiry |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI library for building the single-page application |
| **Vite 7** | Next-generation frontend build tool for fast HMR and bundling |
| **React Router DOM v7** | Client-side routing with nested layouts |
| **Tailwind CSS v4** | Utility-first CSS framework for responsive UI |
| **Axios** | HTTP client for API communication |
| **React Toastify** | Toast notification system |
| **React Circular Progressbar** | Visual progress indicators on dashboards |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | Server-side JavaScript runtime |
| **Express 5** | Web framework for building the REST API |
| **MongoDB Atlas** | Cloud-hosted NoSQL database |
| **Mongoose 9** | ODM library for MongoDB schema modeling |
| **JWT (jsonwebtoken)** | Stateless authentication token management |
| **bcryptjs** | Password hashing |
| **Zod** | Schema-based request validation |
| **Multer** | File upload handling middleware |
| **CORS** | Cross-origin request support |

### ML Module
| Technology | Purpose |
|---|---|
| **Python (Flask)** | Lightweight API server for ML predictions |
| **scikit-learn** | Machine Learning model training and inference |
| **Pandas / NumPy** | Data processing and feature engineering |
| **Joblib** | Model serialization and loading |

### DevOps & Testing
| Technology | Purpose |
|---|---|
| **Vercel** | Cloud deployment for both frontend and backend |
| **Jest 30** | JavaScript testing framework |
| **Supertest** | HTTP integration testing |
| **MongoDB Memory Server** | In-memory MongoDB for isolated test environments |
| **ESLint** | Code linting and quality enforcement |

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│              React 19 + Vite + Tailwind CSS              │
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐  │
│  │ PM      │ │ SE      │ │ SO      │ │ SK / Worker  │  │
│  │ Portal  │ │ Portal  │ │ Portal  │ │ / Admin      │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └──────┬───────┘  │
│       │           │           │              │          │
│  ┌────┴───────────┴───────────┴──────────────┴───────┐  │
│  │           AuthContext + Role Contexts              │  │
│  └───────────────────────┬───────────────────────────┘  │
└──────────────────────────┼──────────────────────────────┘
                           │ Axios (JWT Bearer)
                           ▼
┌──────────────────────────────────────────────────────────┐
│                       BACKEND                            │
│               Express 5 + Node.js (ES Modules)           │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌─────────────────┐    │
│  │ Auth       │  │ RBAC       │  │ Validation      │    │
│  │ Middleware │─▶│ Middleware │─▶│ (Zod Schemas)   │    │
│  └────────────┘  └────────────┘  └────────┬────────┘    │
│                                           │              │
│  ┌────────────────────────────────────────┴───────────┐  │
│  │               REST API Controllers                 │  │
│  │  (21 Route Files · 22 Controller Files)            │  │
│  └────────────────────────┬───────────────────────────┘  │
│                           │                              │
│  ┌────────────────────────┴───────────────────────────┐  │
│  │          Services Layer (Business Logic)           │  │
│  │   projectService · taskService · safetyService     │  │
│  │   storeService · eventService                      │  │
│  └────────────────────────┬───────────────────────────┘  │
│                           │ Mongoose ODM                 │
└───────────────────────────┼──────────────────────────────┘
                            ▼
               ┌────────────────────────┐
               │   MongoDB Atlas        │
               │   (22 Collections)     │
               └────────────────────────┘

               ┌────────────────────────┐
               │   Flask ML API         │
               │   (Port 5001)          │
               │   scikit-learn Models  │
               └────────────────────────┘
```

---

## 👥 User Roles & Portals

SiteNex supports **7 distinct user roles**, each with a dedicated portal and scoped permissions:

| Role | Code | Portal Path | Key Capabilities |
|---|---|---|---|
| **Admin** | `ADMIN` | `/admin` | User management, platform analytics, risk assessment oversight |
| **Project Manager** | `PROJECT_MANAGER` | `/pm` | Full project CRUD, task management, worker management, risk assessment, reporting |
| **Site Engineer** | `SITE_ENGINEER` | `/se` | Task execution, subtask management, worker approvals, material requests, daily reports |
| **Safety Officer** | `SAFETY_OFFICER` | `/so` | Safety observations, incident reports, hazard reports, PTW management, tool inspections |
| **Store Keeper** | `STORE_KEEPER` | `/sk` | Inventory management, material request fulfillment, tool issuance and returns |
| **Assistant Engineer** | `ASSISTANT_ENGINEER` | — | Supporting engineering tasks within assigned projects |
| **Worker** | `WORKER` | `/worker` | View assigned tasks, submit timesheets, view safety notices |

### RBAC Hierarchy

Permissions are enforced through a **role hierarchy matrix** in the RBAC middleware. Higher roles inherit access of lower roles within project scope:

```
OWNER > PROJECT_MANAGER > SITE_ENGINEER / SAFETY_OFFICER > STORE_KEEPER > ASSISTANT_ENGINEER
```

Global `ADMIN` users bypass all project-level role checks with implicit `OWNER` access.

---

## 🗃️ Database Schema

SiteNex uses **22 MongoDB collections** through Mongoose models:

| Model | Description |
|---|---|
| `User` | System users with role, credentials, and activity tracking |
| `Project` | Construction projects with budget, timeline, and status |
| `ProjectMembership` | Many-to-many project ↔ user assignments with roles |
| `Task` | Hierarchical tasks with dependencies and approval workflows |
| `Subtask` | Granular subtasks under tasks |
| `TaskAssignment` | Task-to-user assignment tracking |
| `Worker` | On-ground worker profiles (separate from system users) |
| `Timesheet` | Daily work hour entries by workers |
| `Issue` | Project issues with priority and resolution tracking |
| `SiteProgressReport` | Daily site reports by Site Engineers |
| `SafetyIncident` | Workplace safety incident records |
| `SafetyObservation` | Routine safety observations |
| `HazardReport` | Identified site hazards |
| `SafetyNotice` | Safety notices broadcast to project members |
| `PermitToWork` | Permit-to-Work management for hazardous tasks |
| `RiskAssessment` | ML risk predictions linked to projects |
| `Tool` | Project-level tool inventory |
| `MainStorageTool` | Global tool storage catalog |
| `MaterialItem` | Material inventory items |
| `MaterialRequest` | SE-to-SK material requisitions |
| `IssuanceLog` | Tool/material issuance transaction logs |
| `DeletionLog` | Audit trail for deleted records |

---

## 🔌 API Structure

All API endpoints follow a **strict RESTful nested structure**:

### Project-Scoped Routes (require authentication + project membership)
```
/api/projects/:projectId/tasks
/api/projects/:projectId/issues
/api/projects/:projectId/task-assignments
/api/projects/:projectId/site-progress-reports
/api/projects/:projectId/safety-incidents
/api/projects/:projectId/safety-observations
/api/projects/:projectId/hazard-reports
/api/projects/:projectId/safety-notices
/api/projects/:projectId/ptws
/api/projects/:projectId/safety-summary
/api/projects/:projectId/workers
/api/projects/:projectId/tools
/api/projects/:projectId/material-requests
```

### Global Routes
```
/api/users          → User registration, login, profile
/api/projects       → Project CRUD (PM/Admin)
/api/pm             → PM aggregation dashboard
/api/se             → SE aggregation dashboard
/api/worker         → Worker portal endpoints
/api/admin          → Admin dashboard & user management
/api/risk-assessments → ML risk assessment endpoints
/api/store          → Global store keeper inventory
```

### ML API (Flask — Port 5001)
```
GET  /health         → Model health check
POST /predict-delay  → Delay risk prediction
```

---

## 🐛 Issues Faced & How We Fixed Them

### 1. MongoDB Connection & Multer Configuration
**Problem:** Initial database connections were failing intermittently, and file uploads via Multer were not being handled correctly.

**Fix:** Reconfigured the MongoDB connection with proper event listeners and error handling in `configs/mongodb.js`. Set up Multer with memory storage to avoid filesystem dependency on serverless deployments.

---

### 2. RBAC Middleware — Cross-Cutting Authorization
**Problem:** Implementing fine-grained, project-scoped authorization was complex. Each route needed to verify not just authentication, but also whether the user was a member of the specific project and had a role at or above the minimum required level.

**Fix:** Designed a **Role Permissions Matrix** (`ROLE_PERMISSIONS_MATRIX`) in `rbacMiddleware.js` that maps each minimum role to all allowed roles. Combined with a `loadProject` middleware chain that validates the project exists, loads the user's membership, and checks against the matrix — all before the controller is invoked.

---

### 3. Task Completion Approval Workflow Sync
**Problem:** When workers submitted task completion requests, the status updates were not reflecting in real-time across the SE Approvals dashboard and PM overview. Subtask and timesheet entries were being missed due to incorrect database query logic.

**Fix:** Implemented proper database query chaining using `populate()` to resolve nested references. Added navigation-aware context updates using React's `useEffect` to auto-refresh data when users navigate between pages. Fixed cascade-delete logic to ensure project removal purges all related subtasks, safety notices, and reports.

---

### 4. Worker Portal — Project Visibility After Task Completion
**Problem:** Workers lost visibility of their assigned projects in the Daily Timesheets tool once all their tasks were marked as completed, because the project retrieval was coupled to active task status.

**Fix:** Decoupled the project retrieval query from active task status. Workers now see all projects where they have (or had) task assignments, regardless of current task status, ensuring uninterrupted timesheet reporting.

---

### 5. ES Modules Compatibility with Jest
**Problem:** The backend uses ES Modules (`"type": "module"` in `package.json`), but Jest does not natively support ES Modules, causing test initialization failures.

**Fix:** Used the `cross-env` package to set `NODE_OPTIONS=--experimental-vm-modules` in the test script, and configured Jest with `"transform": {}` to prevent it from trying to transpile ES module syntax. Also isolated test DB connections using `mongodb-memory-server`.

---

### 6. Vercel Serverless Deployment — Express 5 Compatibility
**Problem:** Deploying the Express 5 backend on Vercel required specific routing configuration. The default Express `app.listen()` conflicts with Vercel's serverless function model.

**Fix:** Conditionally disabled `app.listen()` in production/test environments and exported the `app` instance as the default module export. Configured `vercel.json` to route all requests through `server.js` using `@vercel/node`.

---

### 7. ML Model Risk Level vs. Delay Days Mismatch
**Problem:** The ML classifier's risk level predictions (Low/Medium/High) were inconsistent with the regression model's delay day predictions. A project could be predicted as "High" risk but show 0 delay days.

**Fix:** Replaced the classifier-driven risk level with a **delay-days-derived risk level**. The Flask API now determines risk level directly from predicted delay days using defined thresholds (Low ≤ 1 day, Medium 2-5 days, High ≥ 6 days), ensuring consistency.

---

### 8. Frontend State Management — Stale Data Across Portals
**Problem:** React Context state was not updating when users navigated between different sections of their portal, leading to stale data displays.

**Fix:** Created dedicated context providers for each role (`PMContext`, `SEContext`, `SOContext`, `SKContext`, `WorkerContext`) with navigation-aware data fetching. Used React Router's navigation events to trigger data refresh on route changes.

---

## 📦 Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** ≥ 18.x — [Download](https://nodejs.org/)
- **npm** ≥ 9.x (comes with Node.js)
- **Python** ≥ 3.9 (for ML module only) — [Download](https://python.org/)
- **Git** — [Download](https://git-scm.com/)
- **MongoDB Atlas** account (or local MongoDB instance)

---

## ⚙️ Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/HarithaGeemal/Site-Nex.git
cd Site-Nex
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
PORT=5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_BACKEND_URL=http://localhost:5000/api
```

### 4. ML Module Setup (Optional)

```bash
cd backend/ml
pip install -r requirements.txt
```

Create a `.env` file in the `backend/ml/` directory (see `.env.example`):

```env
FLASK_ENV=development
DEBUG=True
ML_API_PORT=5001
BACKEND_URL=http://localhost:5000
```

---

## ▶️ Running the Application

### Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:5000`.

### Start the Frontend Dev Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`.

### Start the ML API (Optional)

```bash
cd backend/ml
python flask_api.py
```

The ML API will start on `http://localhost:5001`.

> **Note:** All three services need to be running simultaneously for full functionality. The ML API is only required if you need the risk prediction feature.

---

## 🧪 Testing

The project includes an automated test suite using **Jest**, **Supertest**, and **MongoDB Memory Server** for isolated, ephemeral database testing.

### Run All Tests

```bash
cd backend
npm test
```

### Test Suites

| Test File | Coverage |
|---|---|
| `admin.test.js` | Admin dashboard and user management endpoints |
| `pm.test.js` | Project Manager dashboard endpoints |
| `se.test.js` | Site Engineer dashboard endpoints |
| `sk.test.js` | Store Keeper inventory endpoints |
| `worker.test.js` | Worker portal endpoints |

Test configuration uses an in-memory MongoDB instance (via `tests/setup.js`) to ensure:
- **No impact** on the production/development database
- **Clean state** before each test run
- **Fast execution** without network dependencies

---

## 🌐 Deployment

Both the frontend and backend are configured for deployment on **Vercel**.

### Backend Deployment

The `backend/vercel.json` routes all incoming requests to `server.js`:

```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

### Frontend Deployment

The `frontend/vercel.json` handles SPA routing:

```json
{
  "routes": [{ "src": "/[^.]+", "dest": "/", "status": 200 }]
}
```

> Remember to set the environment variables in Vercel's dashboard for both frontend and backend deployments.

---

## 📁 Project Structure

```
SiteNex/
├── backend/
│   ├── configs/             # MongoDB connection, Multer config
│   ├── controllers/         # 22 route controllers
│   ├── middlewares/          # Auth, RBAC, and validation middleware
│   ├── ml/                  # Python ML module (Flask API + trained models)
│   │   ├── flask_api.py
│   │   ├── train_models_new.py
│   │   ├── *.pkl            # Serialized ML models
│   │   └── requirements.txt
│   ├── models/              # 22 Mongoose schemas
│   ├── routes/              # 21 Express route definitions
│   ├── services/            # Business logic layer
│   ├── tests/               # Jest + Supertest test suites
│   ├── utils/               # Utility functions
│   ├── validations/         # Zod validation schemas
│   ├── server.js            # Express app entry point
│   ├── vercel.json          # Vercel deployment config
│   └── package.json
│
├── frontend/
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── assets/          # Images, icons, media
│   │   ├── components/      # Reusable UI components (per role)
│   │   │   ├── Admin/
│   │   │   ├── PM/
│   │   │   ├── SE/
│   │   │   ├── SK/
│   │   │   ├── SO/
│   │   │   ├── Worker/
│   │   │   └── RoleGuard.jsx
│   │   ├── context/         # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── PMContext.jsx
│   │   │   ├── SEContext.jsx
│   │   │   ├── SOContext.jsx
│   │   │   ├── SKContext.jsx
│   │   │   ├── AdminContext.jsx
│   │   │   └── WorkerContext.jsx
│   │   ├── hooks/           # Custom React hooks
│   │   ├── layouts/         # Layout wrappers per role
│   │   ├── pages/           # Page components per role
│   │   │   ├── Admin/       # AdminDashboard, UserManagement, RiskAnalysis
│   │   │   ├── PM/          # Dashboard, Projects, Tasks, Workers, Issues, etc.
│   │   │   ├── SE/          # SEDashboard, SETasks, SEApprovals, etc.
│   │   │   ├── SK/          # SKDashboard, SKInventory, SKRequests, etc.
│   │   │   ├── SO/          # SODashboard, SOObservations, SOIncidents, etc.
│   │   │   ├── Worker/      # WorkerDashboard, WorkerTasks, WorkerTimesheets, etc.
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── App.jsx          # Root component with routing
│   │   └── main.jsx         # App entry point
│   ├── tailwind.config.cjs
│   ├── vite.config.js
│   ├── vercel.json
│   └── package.json
│
└── README.md
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net` |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key (if using Clerk auth) | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk secret key (if using Clerk auth) | `sk_test_...` |
| `PORT` | Server port | `5000` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_BACKEND_URL` | Backend API base URL | `http://localhost:5000/api` |

### ML Module (`backend/ml/.env`)

| Variable | Description | Example |
|---|---|---|
| `FLASK_ENV` | Flask environment | `development` |
| `DEBUG` | Enable debug mode | `True` |
| `ML_API_PORT` | Flask server port | `5001` |
| `BACKEND_URL` | Node.js backend URL | `http://localhost:5000` |

---

## 🖼️ Screenshots

> _Screenshots of the application will be added here._

<!-- 
Add screenshots in the format:
![Dashboard](./screenshots/dashboard.png)
![PM Portal](./screenshots/pm-portal.png)
-->

---

## 👨‍💻 Contributors

- **Dileepa Anushan** — [GitHub](https://github.com/dileepa-anushan)

---

---

<p align="center">
  Made with ❤️ by the SiteNex Team
</p>
