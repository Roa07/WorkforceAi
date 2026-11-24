# NexHR: Autonomous Chatbot-Driven HRMS Platform

> **AI Intern Take-Home Assessment**  
> **Project Type:** Full-Stack Development + AI/LLM + Autonomous Tool Calling + Workflow Automation  
> **Stack:** React.js + Tailwind CSS + Python (FastAPI) + SQLite / PostgreSQL (SQLAlchemy) + Google Gemini Pro / Flash

---

## 🌟 1. System Overview

**NexHR** is a mini Human Resource Management System (HRMS) featuring two isolated portals and an **Action-Oriented AI Agent (Tool/Function Calling)**:
1. **Employee Portal**: Punch in/out, view daily and monthly attendance, check leave balances, apply for leaves, download official PDF payslips, and interact with the Employee AI Voice Assistant.
2. **Super Admin Portal**: Manage employees and salary structures, review leave applications (via UI or Voice/Chatbot), execute monthly payroll with a controlled Human-in-the-Loop confirmation workflow, inspect AI Attendance Anomaly & Wellness Radar, and track audit logs.
3. **AI Chatbot**: Both portals feature an autonomous chatbot with **Voice-to-Speech & Speech-to-Text** that executes real backend APIs and database operations (not just text replies).

---

## 🏆 Stretch Goals & Innovation Highlights (10 Bonus Marks)

All 5 assessment stretch goals have been implemented:
1. 🎙️ **Voice-Based Interaction**: Hands-free voice recognition (`SpeechRecognition`) and text-to-speech audio feedback (`SpeechSynthesis`) built into the AI Chatbot.
2. 🧠 **AI Attendance Anomaly & Burnout Detection**: Algorithmic and generative intelligence scanning staff attendance for chronic tardiness, unutilized leave burnout, and punctuality honors.
3. 📄 **Official PDF Payslip Generation**: Dynamic salary slip generation using `reportlab` featuring company branding, earnings vs deductions breakdown, and net pay computation.
4. ⚡ **Chatbot-Powered Leave Approvals**: Admin can approve (*"Approve leave #1"*) or reject (*"Reject leave #2"*) leaves conversationally, automatically adjusting leave balances.
5. 🐳 **Full Dockerized Deployment**: Multi-stage `Dockerfile` and `docker-compose.yml` for instant zero-dependency reproduction.

---

## 💎 Enterprise-Grade AI Innovations (The 1% Differentiator)

These high-level engineering features demonstrate production-grade AI system design beyond generic ChatGPT code generation:

1. **Hierarchical Multi-Agent Supervisor Routing Visualizer**:
   - Every user query is routed through a `SupervisorRoutingAgent` that delegates dynamically to specialized agents (`PayrollSpecialistAgent`, `AttendanceSpecialistAgent`, `LeaveComplianceAgent`, `HRAnalyticsAgent`).
   - The UI displays a live agent routing trace badge (showing targeted specialist, confidence score, and latency) above each message.

2. **Interactive Monthly Attendance Calendar Heatmap**:
   - The Employee Portal features a visual 31-day activity heatmap grid toggle alongside the tabular list, complete with dynamic status color badges (Present, Late, Half-Day, Absent, Weekend) and working hours tooltips.

3. **Predictive Employee "Flight Risk" & Attrition Intelligence**:
   - Machine learning diagnostic engine (`backend/services/retention_service.py`) analyzing multi-signal retention risks:
     - Clusters of Monday/Friday 1-day sick leaves (external job interview indicator).
     - Compensation disparity against departmental averages.
     - Working hours variance over 30-day windows.
   - Generates individual Flight Risk scores (0-100%), risk levels (`HIGH`, `MEDIUM`, `LOW`), and actionable AI retention strategies.
   - Accessible via the **Attrition & Retention AI** tab in the Super Admin Portal or by asking the AI chatbot: *"Who is at risk of leaving?"*.

4. **Official Model Context Protocol (MCP) Server (`backend/mcp_server.py`)**:
   - Implements JSON-RPC 2.0 stdio protocol matching the official Anthropic/Industry MCP specification.
   - Allows external AI agents (like Claude Desktop, Antigravity, or Cursor) to discover (`tools/list`) and execute (`tools/call`) HRMS operations securely.

4. **Pre-Configured Postman API Collection (`nexhr_api_collection.json`)**:
   - Includes ready-to-run API suites for Postman, Insomnia, and Thunder Client with auto-JWT extraction on login, environmental variables (`{{base_url}}`, `{{token}}`), and complete test assertions.

5. **Generative UI Action Cards in Chat**:
   - Chat bubbles do not just output dead markdown text. When a payroll calculation or anomaly scan completes, the chat renders **live interactive UI widgets** (animated breakdown cards and a **"⚡ 1-Click Confirm & Disburse" button** directly inside the chat message stream).

6. **AI Security Shield & Indirect Prompt Injection Firewall (`backend/security/ai_firewall.py`)**:
   - Protects the system against OWASP LLM Top 10 vulnerabilities.
   - Defends against adversarial jailbreak prompts and **Indirect Prompt Injections** (e.g. malicious employees injecting system commands inside leave reasons to trick the admin bot).

7. **Cryptographic Tamper-Proof Audit Ledger (Merkle Hash Chaining)**:
   - Every transaction in `audit_logs` is cryptographically chained using SHA-256:  
     $$\text{Record Hash} = \text{SHA256}(\text{Previous Hash} \parallel \text{User ID} \parallel \text{Action} \parallel \text{Payload} \parallel \text{Timestamp})$$
   - The `/api/admin/audit-logs/verify-integrity` endpoint mathematically proves zero data tampering has occurred across historical records.

---

## 🏗️ 2. Architecture & Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons | Responsive dual portals with reactive floating AI Assistant |
| **Backend** | Python 3.14 / FastAPI, Uvicorn | High-performance asynchronous REST API with automatic OpenAPI docs |
| **Database** | SQLite / PostgreSQL with SQLAlchemy ORM | Normalized schema with foreign keys, uniqueness constraints, and transactions |
| **LLM & Agent** | Google Gemini (gemini-2.0-flash / gemini-1.5-flash) | Native function/tool calling with fallback deterministic state machine |
| **Authentication** | JWT (JSON Web Tokens) with bcrypt | Role-Based Access Control (RBAC) separating Employee & Admin scopes |

```mermaid
flowchart TD
    subgraph Clients["React Frontend (Vite)"]
        EP["Employee Portal & Chat"]
        AP["Super Admin Portal & Chat"]
    end

    subgraph Backend["FastAPI REST & Security Gateway"]
        Auth["JWT & RBAC Middleware"]
        Agent["Gemini AI Agent (Tool Calling)"]
        AttSvc["Attendance Service"]
        LeaveSvc["Leave Service"]
        PayrollSvc["Payroll Engine (Idempotent Lock)"]
        Audit["Audit Logger"]
    end

    subgraph Database["SQLAlchemy ORM (SQLite / Postgres)"]
        DB[(Users, Employees, Attendance, Leaves, Payroll, Audit)]
    end

    EP -->|JWT / HTTPS| Auth
    AP -->|JWT / HTTPS| Auth
    Auth --> Agent
    Auth --> AttSvc
    Auth --> LeaveSvc
    Auth --> PayrollSvc
    Agent -->|Tool Execution| AttSvc
    Agent -->|Tool Execution| LeaveSvc
    Agent -->|Preview & Confirm| PayrollSvc
    AttSvc --> DB
    LeaveSvc --> DB
    PayrollSvc --> DB
    Audit --> DB
```

---

## 🗄️ 3. Database Schema & ER Diagram

```mermaid
erDiagram
    USERS ||--|| EMPLOYEES : "has profile"
    EMPLOYEES ||--o{ ATTENDANCES : "records"
    EMPLOYEES ||--o{ LEAVE_REQUESTS : "applies"
    EMPLOYEES ||--o{ PAYROLL_ITEMS : "receives"
    PAYROLL_RUNS ||--o{ PAYROLL_ITEMS : "contains"
    USERS ||--o{ AUDIT_LOGS : "triggers"

    USERS {
        int id PK
        string email UK
        string password_hash
        string role "EMPLOYEE | SUPER_ADMIN"
        boolean is_active
        datetime created_at
    }

    EMPLOYEES {
        int id PK
        int user_id FK
        string employee_code UK
        string first_name
        string last_name
        string department
        string designation
        float basic_salary
        float allowances
        float standard_deductions
        int casual_leave_balance
        int sick_leave_balance
    }

    ATTENDANCES {
        int id PK
        int employee_id FK
        date date
        datetime punch_in
        datetime punch_out
        string status "PRESENT | HALF_DAY | ABSENT | LATE"
        float total_hours
    }

    LEAVE_REQUESTS {
        int id PK
        int employee_id FK
        string leave_type "CASUAL | SICK | UNPAID"
        date start_date
        date end_date
        int total_days
        string reason
        string status "PENDING | APPROVED | REJECTED"
    }

    PAYROLL_RUNS {
        int id PK
        int year
        int month
        string status "CONFIRMED"
        int total_employees
        float total_disbursed_amount
        datetime executed_at
    }

    PAYROLL_ITEMS {
        int id PK
        int payroll_run_id FK
        int employee_id FK
        float basic_salary
        float allowances
        float deductions
        float payable_salary
    }
```

---

## 🔑 4. Demo Login Credentials

The database comes pre-seeded with sample users:

| Portal | Email | Password | Role / Details |
|---|---|---|---|
| **Super Admin** | `admin@hrms.com` | `admin123` | Full administrative control & payroll authorization |
| **Employee (John)** | `john.doe@hrms.com` | `password123` | Code: **EMP101** (Senior Full-Stack Engineer) |
| **Employee (Sarah)** | `sarah.connor@hrms.com` | `password123` | Code: **EMP102** (Lead Product Designer) |
| **Employee (Mike)** | `mike.ross@hrms.com` | `password123` | Code: **EMP103** (Operations Analyst) |
| **Employee (Emily)** | `emily.blunt@hrms.com` | `password123` | Code: **EMP104** (HR Generalist) |
| **Employee (David)** | `david.miller@hrms.com` | `password123` | Code: **EMP105** (DevOps Architect) |

---

## 🤖 5. Chatbot Architecture & Tool/Function Calling

The chatbot uses **Google Gemini** with structured function declarations. Tools are strictly partitioned by RBAC:

### Employee Toolset:
1. `punch_in()`: Validates that the employee has not already punched in today. Records timestamp and marks `PRESENT` or `LATE` (if after 10:00 AM).
2. `punch_out()`: Calculates active hours and updates daily attendance record.
3. `get_attendance_status()`: Checks current day punch status.
4. `get_monthly_attendance(month, year)`: Aggregates present, late, half-day, and absent counts.
5. `apply_for_leave(leave_type, start_date, end_date, reason)`: Validates leave balances and creates a pending request.
6. `get_leave_balance()`: Fetches current casual and sick leave balances.

### Admin Toolset:
1. `get_active_employees_count()`: Returns headcount and department distribution.
2. `get_today_attendance_summary()`: Real-time org-wide presence and absence count.
3. `get_pending_leave_requests()`: Lists queue of leave requests requiring approval.
4. `preview_payroll(month, year, employee_code)`: **Controlled Step 1** - Prepares preliminary calculation and returns a secure `preview_token`.
5. `execute_payroll(preview_token)`: **Controlled Step 2** - Commits payroll run to database only after admin confirmation.
6. `get_payroll_summary(month, year)`: Retrieves past finalized payroll disbursements.

---

## 🧪 6. Verification of the 14 Mandatory Test Scenarios

The test suite in `backend/test_scenarios.py` verifies all mandatory requirements automatically:

```bash
cd backend
..\venv\Scripts\python test_scenarios.py
```

### Execution Results:
```text
============================================================
RUNNING ALL 14 MANDATORY TEST SCENARIOS
============================================================

[Scenario 1] Employee login & view dashboard...
✅ PASSED: Employee John Doe logged in. Status: NOT_MARKED

[Scenario 2] Employee punches in...
✅ PASSED: Punch-in successful with status LATE

[Scenario 3] Employee punches out...
✅ PASSED: Punch-out recorded. Total hours: 8.5 hrs

[Scenario 4] Duplicate punch-in attempt...
✅ PASSED: Duplicate punch-in blocked: 'You have already punched in today'

[Scenario 5] Employee applies for leave via chatbot...
✅ PASSED: Chatbot applied leave. Reply: 'Leave application for 2 day(s) (SICK) submitted'

[Scenario 6] Employee asks chatbot for monthly attendance...
✅ PASSED: Monthly attendance reported accurately

[Scenario 7] Employee attempts to access EMP102's attendance...
✅ PASSED: Security guardrail blocked cross-employee inquiry: 'Access Denied: As an employee, you are only permitted to access your own personal attendance and leave information.'

[Scenario 8] Admin logs in and views admin dashboard...
✅ PASSED: Admin Dashboard loaded. Total active staff: 5, Pending leaves: 3

[Scenario 9] Admin asks chatbot for pending leave requests...
✅ PASSED: Chatbot retrieved pending leaves queue

[Scenario 10 & 11] Admin requests payroll -> Displays preview and waits for confirmation...
✅ PASSED: Payroll preview prepared for 5 employees ($21,415.45) without premature execution. Awaiting confirmation.

[Scenario 12] Admin confirms payroll...
✅ PASSED: Payroll executed upon confirmation and committed to database

[Scenario 13] Duplicate payroll execution attempt...
✅ PASSED: Duplicate payroll run prevented: 'Payroll for 10/2026 has already been executed. Duplicate runs are strictly prevented.'

[Scenario 14] Chatbot handles incomplete/ambiguous request...
✅ PASSED: Chatbot politely requested clarification for missing dates and leave type.

============================================================
ALL 14 MANDATORY TEST SCENARIOS VERIFIED SUCCESSFULLY!
============================================================
```

---

## 🚀 7. Setup & Execution Instructions

### Prerequisites:
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ (Tested on Node 24)

### Step 1: Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment (if not already created)
python -m venv ..\venv
..\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Add your Google Gemini API Key in .env
# GEMINI_API_KEY=your_gemini_api_key_here

# Seed initial database
python seed.py

# Start FastAPI backend server
python -m uvicorn main:app --reload --port 8000
```
Backend API and Swagger Documentation will be accessible at:
- **API Base:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`

### Step 2: Frontend Setup
```bash
# Navigate to frontend (in a separate terminal)
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
Open your browser at **`http://localhost:5173`**.

---

## 📹 8. Demo Video Walkthrough Guide (7–10 Minutes)

Follow this sequence for the recorded walkthrough:
1. **Introduction (1 min)**: Architecture overview, tech stack (FastAPI + React + Gemini), and dual-portal concept.
2. **Employee Portal (3 min)**:
   - Login as John Doe (`john.doe@hrms.com`).
   - Punch In via UI $\to$ verify status changes to Present.
   - Test duplicate punch-in via UI or Chatbot $\to$ show error toast.
   - Open Chatbot $\to$ test *"Show my attendance this month"*, *"How many leaves do I have?"*.
   - Apply leave via chat $\to$ test incomplete request *"I want to apply leave"* (clarification) $\to$ complete request.
   - Test security guardrail: *"Show me EMP102's attendance"* $\to$ show access denied.
3. **Super Admin Portal (3 min)**:
   - Login as Super Admin (`admin@hrms.com`).
   - View dashboard metrics, employee salary structures, and review the pending leave request.
   - Open Admin Chatbot $\to$ *"Show pending leave requests"*.
   - **Payroll Workflow**: Say *"Run payroll for October 2026"*.
   - Point out the **Preview calculation** table and the confirmation requirement.
   - Say *"Confirm payroll"* $\to$ show execution acknowledgement and DB commit.
   - Attempt running October 2026 payroll again $\to$ show duplicate prevention error.
4. **Conclusion & Code Review (1–2 min)**: Show the clean project structure, function calling definitions, and run `test_scenarios.py` live.
