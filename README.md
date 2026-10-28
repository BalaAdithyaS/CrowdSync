# CrowdSync ⚡

> **Intelligent Real-Time Crowd and Queue Management Platform**
> Built for campus cafeterias, student service centers, libraries, clinics, and high-traffic counters.

CrowdSync is a full-stack, production-oriented crowd intelligence and virtual queueing platform. It empowers users to check live crowd density, compare waiting times, join virtual queues with transparent uncertainty estimation intervals, and receive real-time status notifications. Campus operators and administrators gain full operational control with live service consoles, call-next orchestration, multi-location counter routing, and rich operational analytics.

---

## 🌟 Key Features

### 👤 User Experience
* **Live Campus Directory:** Search and filter campus venues by category (`cafeteria`, `library`, `service_counter`, `food_court`, `clinic`) and crowd congestion status (`Low`, `Moderate`, `High`).
* **Interactive OSM Map:** Leaflet-powered spatial map with crowd-colorized map markers and popups.
* **Virtual Queueing:** Join counters with anti-duplicate guards, real-time ticket numbering (e.g. `CEN-A-003`), live queue position tracking, and one-click exit with reason logging.
* **Intelligent Wait Estimation:** Dynamic wait time predictions showing transparent uncertainty intervals (e.g., `8–12 mins`) with human-readable rationale explanations instead of black-box numbers.
* **Live Alerts & Real-Time Sync:** WebSockets push instant notifications when you are approaching the front of the queue, when your ticket is called, or when service commences.
* **Saved Favorites & Visit History:** Bookmark high-frequency campus hubs and review past completed visits.

### 🛡️ Operator & Admin Experience
* **Operational KPI Dashboard:** High-level metrics tracking active counters, currently waiting visitors, average wait durations, completion throughput, and peak congestion locations.
* **Live Counter Queue Console:** Real-time counter management with one-click actions:
  - 📢 **Call Next:** Summons the next student and triggers high-priority alerts.
  - ▶️ **Start Service:** Records exact service start timestamps and feeds estimation telemetry.
  - ✅ **Complete Service:** Closes session, measures total service duration, and dynamically updates moving averages.
  - ⚠️ **Mark No-Show / Cancel:** Removes absent visitors and advances queue order.
* **Location & Counter CRUD:** Create, pause, or reconfigure service counters, capacities, and baseline wait metrics.
* **Operational Analytics:** Recharts visualizations analyzing wait-time estimation accuracy, hourly traffic volume distributions, counter completion velocities, and cross-location comparisons.
* **Auditing & Telemetry:** Full system audit trail logging operator actions, queue transitions, and timestamps.

---

## 🏗️ Architecture & Technology Stack

```
                     ┌──────────────────────────────────────┐
                     │          CrowdSync Frontend          │
                     │  React 19 + Vite + TypeScript        │
                     │  Tailwind CSS v4 + Framer Motion    │
                     │  TanStack Query + Recharts + Leaflet │
                     └───────────────┬──────────────────────┘
                                     │ HTTP REST / WebSocket
                                     ▼
                     ┌──────────────────────────────────────┐
                     │          FastAPI Backend             │
                     │  Python 3.11+ / SQLAlchemy 2.x       │
                     │  Pydantic v2 + JWT Security          │
                     │  ConnectionManager (Channel PubSub)  │
                     └─────────┬──────────────────┬─────────┘
                               │                  │
                ┌──────────────▼──────┐     ┌─────▼───────────────┐
                │   Database Engine   │     │  Estimation Engine  │
                │  SQLite (Local dev) │     │  Moving Averages    │
                │  PostgreSQL (Prod)  │     │  Uncertainty Bounds │
                └─────────────────────┘     │  Telemetry Fallback │
                                            └─────────────────────┘
```

| Component | Technology | Description |
|---|---|---|
| **Frontend Framework** | React 19, Vite, TypeScript | Modern, high-performance SPA |
| **Styling & Motion** | Tailwind CSS v4, Framer Motion | Custom design tokens, dark/light theme, responsive |
| **Server State & Routing** | TanStack Query v5, React Router v7 | Intelligent caching, prefetching, and route guards |
| **Data Viz & Maps** | Recharts, Leaflet, OpenStreetMap | Dynamic analytics charts and venue mapping |
| **Backend API** | FastAPI, Python 3.11+ | Asynchronous REST endpoints and WebSocket servers |
| **ORM & Database** | SQLAlchemy 2.x, Alembic | Sync engine supporting SQLite and PostgreSQL |
| **Security** | PyJWT, Passlib, Bcrypt | Role-based JWT access tokens and secure hashing |
| **Real-Time** | Native WebSockets | Channel-scoped live events (`location:*`, `queue:*`, `user:*`) |
| **Testing** | Pytest, Vitest, Testing Library | 100% automated test coverage across back and front |

---

## 🧠 Intelligent Estimation Engine

Waiting times in CrowdSync are calculated via the `EstimationService` (`backend/app/services/estimation.py`):

1. **Moving Window Average:** Computes recent service durations ($N=12$) weighted towards recent observations.
2. **Prior Blend for Cold Starts:** If sample size is small ($N < 5$), blends observed data with counter default baseline to ensure stable predictions.
3. **Queue Position Dynamics:**
   $$\text{Estimated Wait} = \text{Position Ahead} \times \text{Avg Service Duration}$$
4. **Transparent Uncertainty Bounds:**
   - Minimum: $\max(60\text{s},\, \text{Estimated Wait} \times 0.8)$
   - Maximum: $\text{Estimated Wait} \times 1.25$
   - Formatted as readable intervals (e.g. `8–12 mins`).
5. **Explainability:** Renders contextual explanations (e.g., *"Based on 12 recent orders at Canteen Express (avg 2.1 mins/person)."*).

---

## 🚀 Quickstart Guide

### Prerequisites
* Python 3.11+ (or Python 3.12 / 3.13)
* Node.js 18+ (Node 20+ recommended)
* npm (or pnpm)

---

### Step 1: Clone and Set Up Backend

```bash
# Clone the repository
git clone https://github.com/your-org/crowdsync.git
cd crowdsync

# Create and activate Python virtual environment
python -m venv venv

# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux / macOS:
# source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Run migrations and seed the VIT Campus Demo database
alembic upgrade head
python scripts/seed_demo.py
```

### Step 2: Start the Backend Server

```bash
uvicorn backend.app.main:app --reload --port 8000
```
* **API Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **API Alternative Docs:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### Step 3: Set Up and Start Frontend

```bash
# In a new terminal window:
cd frontend

# Install frontend dependencies
npm install

# Start the Vite development server
npm run dev
```
* **Web Application:** [http://localhost:5173](http://localhost:5173)

---

## 🔑 Demo Credentials

The platform is pre-seeded with realistic campus locations, counters, queue tickets, and users:

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **Platform / Org Admin** | `admin@vitcampus.edu` | `admin123` | Full dashboard, counter controls, location management, analytics |
| **Location Staff / Operator** | `staff@vitcampus.edu` | `staff123` | Live counter queue desk, call next, complete service, no-show |
| **Student / Visitor** | `student@vitcampus.edu` | `student123` | Live ticket tracking, join queues, search venues, view history |

> 💡 **Quick Login:** The `/login` page includes **1-Click Demo Buttons** for Student, Staff, and Admin credentials.

---

## 🐳 Docker & Container Deployment

To launch the complete production stack (PostgreSQL 16 + Redis + FastAPI Backend + Nginx Frontend):

```bash
# Create local .env from example
cp .env.example .env

# Build and start all containers
docker-compose up --build -d
```

Services exposed:
* **Frontend Application:** [http://localhost](http://localhost) (port 80)
* **Backend API:** [http://localhost:8000](http://localhost:8000)
* **PostgreSQL:** `localhost:5432`
* **Redis:** `localhost:6379`

---

## 🧪 Running Tests

### Backend Unit & Integration Tests (Pytest)
```bash
# Run backend pytest suite
pytest backend/tests
```
* Coverage: `test_estimation.py` (mathematical bounds, cold-start weighting, front-of-line) and `test_routes.py` (authentication, duplicate queue protection, ticket sequence lifecycle, leave queue, live notifications, analytics).

### Frontend Component & Integration Tests (Vitest)
```bash
cd frontend
npm run test
```
* Coverage: `components.test.tsx` (CrowdBadge statuses, StatCard metrics, Button states/actions, QueueTicketCard sequence & wait interval rendering).

### Frontend Production Build Verification
```bash
cd frontend
npm run build
```

---

## 📡 API Reference Overview

### Authentication (`/api/v1/auth`)
* `POST /api/v1/auth/signup` – Register a new student or visitor account.
* `POST /api/v1/auth/login` – Authenticate and receive JWT access token.
* `GET /api/v1/auth/me` – Retrieve current user profile and role.

### Locations (`/api/v1/locations`)
* `GET /api/v1/locations` – Query campus locations with category, crowd level, and search filters.
* `GET /api/v1/locations/{id}` – Retrieve location details, facilities, and active counters.
* `POST /api/v1/locations` – Create new campus venue (*Admin only*).
* `POST /api/v1/locations/{id}/counters` – Add service counter to location (*Admin only*).

### Queues (`/api/v1/queues`)
* `POST /api/v1/queues/join` – Join a counter virtual queue (prevents duplicate active tickets).
* `GET /api/v1/queues/active` – Fetch active queue tickets for authenticated user.
* `GET /api/v1/queues/{id}` – Retrieve live queue tracking details with dynamic estimation.
* `POST /api/v1/queues/{id}/leave` – Cancel or leave queue ticket with audit reason.
* `GET /api/v1/queues/history/me` – Retrieve past completed or cancelled queue visits.

### Admin & Counter Management (`/api/v1/admin`)
* `GET /api/v1/admin/queues` – Live queue management feed across all counters.
* `POST /api/v1/admin/counters/{id}/call-next` – Call next waiting visitor.
* `POST /api/v1/admin/queues/{id}/start-service` – Start counter transaction.
* `POST /api/v1/admin/queues/{id}/complete` – Complete transaction and log service duration.
* `POST /api/v1/admin/queues/{id}/no-show` – Mark absent visitor.
* `POST /api/v1/admin/queues/{id}/cancel` – Administratively cancel ticket.
* `GET /api/v1/admin/audit-logs` – Retrieve timestamped administrative audit trail.

### Analytics (`/api/v1/analytics`)
* `GET /api/v1/analytics/overview` – High-level KPI aggregations.
* `GET /api/v1/analytics/volume-trends` – Hourly and daily traffic distribution.
* `GET /api/v1/analytics/estimation-accuracy` – Real-world error delta vs predicted wait times.
* `GET /api/v1/analytics/counter-performance` – Completion velocities and idle durations per counter.

---

## 🔒 Security & Best Practices

1. **Role-Based Access Control:** Endpoint protections strictly enforce roles (`USER`, `LOCATION_ADMIN`, `ORGANIZATION_ADMIN`, `PLATFORM_ADMIN`) at the database and API layer.
2. **Password Protection:** Passwords securely hashed with `bcrypt` with salt rounds.
3. **Stateless JWTs:** Short-lived access tokens signed with HMAC-SHA256.
4. **Input Validation:** Pydantic v2 schemas rigorously sanitize payload fields and enforce constraints.
5. **Auditing:** Administrative actions, cancellations, and status overrides are recorded in the relational `audit_logs` table with actor IDs and timestamps.

---

## 📄 License

This project is licensed under the MIT License.
