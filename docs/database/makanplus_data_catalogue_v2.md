# Makan+ — Revised Data Catalogue v2.0
## گروه صنعتی طبیعت ماکان · Human Resources Portal

> **Audience:** Data Team & DBA  
> **Updated:** Based on HR Dashboard data investigation  
> **Database:** Microsoft SQL Server  
> **Status:** v2.0 — Cross-referenced with existing HR dashboard

---

## Architecture Decision

The HR dashboard confirms a **mature HR/Payroll system already exists** with rich individual-level data. Rather than rebuilding what already exists, Makan+ adopts a **two-schema approach**:

```
┌─────────────────────────────────┐    ┌────────────────────────────────┐
│   [HR_SYSTEM] schema            │    │   [MAKAN_PLUS] schema          │
│   ─────────────────────────     │    │   ──────────────────────────   │
│   Existing HR/Payroll DB        │───►│   New tables created for app   │
│   READ-ONLY via SQL Views       │    │   Auth, RBAC, Audit, Faces     │
│   Data team creates views       │    │   Backend team creates these   │
└─────────────────────────────────┘    └────────────────────────────────┘
```

**Action for data team:** Create read-only SQL Views in a `vw_makanplus_*` naming convention that expose only the columns Makan+ needs — do NOT give the app direct table access to the payroll system.

---

## Part 1 — Data Already Available (Read from Existing HR System)

The following data was confirmed to exist in the HR dashboard. The data team must create **SQL Views** exposing these fields.

---

### VIEW: `vw_makanplus_employees`
**Source:** Personnel master record — HR Dashboard row 61  
`مشخصات پرسنل شامل (نام هلدینگ، کد پرسنلی، نام شرکت، ...)`

| Field (app) | Source Column (HR System) | Sensitivity | Notes |
|---|---|---|---|
| `employee_id` | کد پرسنلی | Public | Primary key for the app |
| `holding_name` | نام هلدینگ | Public | Which sub-holding |
| `company_name` | نام شرکت | Public | Which company |
| `national_id` | کد ملی | 🔒 High | Masked in view: show only last 4 digits |
| `first_name` | نام | Public | |
| `last_name` | نام خانوادگی | Public | |
| `father_name` | نام پدر | Medium | HR manager access only |
| `gender` | جنسیت | Public | |
| `birth_date` | تاریخ تولد | 🔒 Medium | Derive `age` field in view, don't expose raw date |
| `age` | سن | Public | Computed from birth_date |
| `marital_status` | وضعیت تأهل | Medium | Manager+ access |
| `education_level` | آخرین مدرک تحصیلی | Public | |
| `field_of_study` | رشته تحصیلی | Public | |
| `position_name` | سمت سازمانی | Public | |
| `department_name` | واحد سازمانی | Public | |
| `cost_center` | مرکز هزینه | Medium | Manager+ access |
| `work_location` | محل خدمت | Public | |
| `employment_status` | وضعیت | Public | active / terminated |
| `hire_date` | تاریخ استخدام | Medium | Manager+ access |
| `termination_date` | تاریخ ترک کار | 🔒 High | HR Admin only |
| `mobile` | موبایل | 🔒 High | Direct manager only |
| `address` | آدرس | 🔒 High | HR Admin only |
| `insurance_number` | شماره بیمه | 🔒 High | HR Admin only |

> ⚠️ **EXCLUDE from view:** شماره حساب، شماره شبا، نام بانک، نام شعبه — Bank details are NOT needed by Makan+ at any access level. Leave them in the payroll system only.

---

### VIEW: `vw_makanplus_companies`
**Source:** Holding/company structure implied by هلدینگ and شرکت fields + Dashboard rows 24, 37, 40, 43

| Field (app) | Source | Notes |
|---|---|---|
| `company_id` | Derived/mapped | Assign numeric ID to each unique شرکت |
| `company_name_fa` | نام شرکت | |
| `holding_name_fa` | نام هلدینگ | |
| `parent_company_id` | Derived | Data team must define the hierarchy |
| `company_type` | Derived | `holding` or `subsidiary` |
| `is_active` | Derived | Based on whether active employees exist |

> **Action for data team:** Define the exact parent-child hierarchy of all holdings and subsidiaries and provide as a lookup table or mapping file.

---

### VIEW: `vw_makanplus_departments`
**Source:** واحد سازمانی — Dashboard rows 3, 17, 25, 38, 44

| Field (app) | Source | Notes |
|---|---|---|
| `dept_id` | Derived | Numeric ID per unique واحد سازمانی |
| `dept_name_fa` | واحد سازمانی | |
| `company_id` | Derived from هلدینگ/شرکت | |
| `employee_count` | Computed | COUNT of active employees in واحد |

---

### VIEW: `vw_makanplus_positions`
**Source:** شغل سازمانی / سمت سازمانی — Dashboard rows 1, 31–35

| Field (app) | Source | Notes |
|---|---|---|
| `position_id` | Derived | Numeric ID per unique سمت |
| `position_name_fa` | سمت سازمانی | |
| `is_managerial` | Derived | Based on titles matching مدیر / رئیس / سرپرست |
| `job_grade` | Derived from salary bands | Optional — see compensation note below |

> **Note:** Dashboard rows 31–35 confirm that job levels (مدیران، روئسا، سرپرستان، کارمندان، کارگران) exist in the system and are used for average salary segmentation.

---

### VIEW: `vw_makanplus_org_hierarchy`
**Source:** The manager–report relationship is implied by org structure but **NOT explicitly listed** in the dashboard. 

> ⚠️ **Data team must confirm:** Does the existing HR system store the direct manager (مدیر مستقیم) per employee? This is critical for RBAC — a manager must be able to look up their direct reports. If this field doesn't exist, it must be added to the Makan+ schema as a new table.

---

### VIEW: `vw_makanplus_compensation`
**Source:** Payroll/decree system — Dashboard rows 4, 23–40, 41 (فیش جبران خدمات), 62–63 (ریز عوامل حکمی)

| Field (app) | Source | Sensitivity | Notes |
|---|---|---|---|
| `employee_id` | کد پرسنلی | — | |
| `gross_salary` | حقوق ناخالص | 🔒 Very High | Manager + HR only |
| `net_salary` | پرداختی خالص | 🔒 Very High | Manager + HR only |
| `insurance_deduction` | کسر بیمه | 🔒 Very High | HR only |
| `tax_deduction` | مالیات | 🔒 Very High | HR only |
| `salary_components` | ریز عوامل حکمی | 🔒 Very High | HR only |
| `effective_month` | تاریخ حکم | — | Persian calendar month |

> **Confirmed available:** Individual payslips (فیش جبران خدمات تک تک اعضا, row 41) and full decree factor breakdown (ریز عوامل حکمی, row 62) exist per employee. Makan+ shows only gross/net to managers; full breakdown only to HR Admin.

---

### VIEW: `vw_makanplus_attendance`
**Source:** Attendance/time system — Dashboard rows 49–60

| Field (app) | Source | Notes |
|---|---|---|
| `employee_id` | کد پرسنلی | |
| `work_hours_monthly` | میانگین کارکرد ماه (ساعت) | Average monthly hours |
| `avg_tardiness_hours` | میانگین تاخیر در ورود | |
| `leave_balance_days` | مانده مرخصی دوره | |
| `leave_hourly_requests` | درخواست مرخصی ساعتی | |
| `leave_daily_requests` | درخواست مرخصی روزانه | |
| `sick_leave_requests` | درخواست استعلاجی | |
| `overtime_daily_requests` | درخواست اضافه کار روزانه | |
| `overtime_total_hours` | جمع اضافه کاری دوره | |
| `late_entries_count` | تعداد ورود بعد از ساعت ۸ | |
| `record_period` | ماه/دوره | |

> **Confirmed available:** Attendance data exists per employee. The source system appears to be a separate biometric/attendance system feeding into the HR system.

---

### VIEW: `vw_makanplus_decree_history`
**Source:** Decree (حکم) system — Dashboard rows 16–22

| Field (app) | Source | Notes |
|---|---|---|
| `employee_id` | کد پرسنلی | |
| `decree_type` | نوع حکم | hire / termination / leave / transfer / etc |
| `decree_date` | تاریخ حکم | |
| `work_location` | محل خدمت | |
| `dept_name` | واحد سازمانی | |

---

## Part 2 — NEW Tables to Create (Makan+ Schema)

These tables do **not exist anywhere** and must be created fresh in the `[MAKAN_PLUS]` SQL Server schema.

---

### TABLE: `makan_users`
**Purpose:** Authentication credentials for Makan+ app (custom auth, no AD dependency)

```sql
CREATE TABLE makan_users (
    user_id         INT IDENTITY(1,1) PRIMARY KEY,
    employee_id     NVARCHAR(20)  NOT NULL UNIQUE,   -- FK → HR system employee_id
    username        NVARCHAR(50)  NOT NULL UNIQUE,
    password_hash   NVARCHAR(255) NOT NULL,           -- bcrypt, cost=12
    is_active       BIT           NOT NULL DEFAULT 1,
    last_login      DATETIME2     NULL,
    failed_attempts TINYINT       NOT NULL DEFAULT 0,
    locked_until    DATETIME2     NULL,
    created_at      DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2     NOT NULL DEFAULT GETDATE()
);
```

> - Password is **never** stored in plain text. bcrypt with cost=12.
> - `employee_id` is the link to all HR data — it is the bridge between this table and all the `vw_makanplus_*` views.
> - Account creation is done by HR Admin only, not self-registration.

---

### TABLE: `makan_roles`
**Purpose:** Define the access levels in the system

```sql
CREATE TABLE makan_roles (
    role_id              INT IDENTITY(1,1) PRIMARY KEY,
    role_code            NVARCHAR(30)  NOT NULL UNIQUE,
    role_name_fa         NVARCHAR(100) NOT NULL,
    can_view_contact     BIT NOT NULL DEFAULT 0,   -- mobile number
    can_view_salary      BIT NOT NULL DEFAULT 0,
    can_view_attendance  BIT NOT NULL DEFAULT 0,
    can_view_decree      BIT NOT NULL DEFAULT 0,
    can_view_sensitive   BIT NOT NULL DEFAULT 0,   -- national_id, birth_date
    can_export           BIT NOT NULL DEFAULT 0,
    can_search_face      BIT NOT NULL DEFAULT 0
);
```

**Seed data (insert on deployment):**

| role_code | role_name_fa | contact | salary | attendance | decree | sensitive | export | face |
|---|---|---|---|---|---|---|---|---|
| `employee` | کارمند | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `manager` | مدیر | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ |
| `hr_specialist` | متخصص HR | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `hr_admin` | ادمین HR | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `executive` | مدیر ارشد | ✓ | ✗ (aggregates only) | ✓ | ✓ | ✗ | ✗ | ✓ |

---

### TABLE: `makan_user_roles`
**Purpose:** Assign roles to users

```sql
CREATE TABLE makan_user_roles (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    user_id      INT          NOT NULL REFERENCES makan_users(user_id),
    role_id      INT          NOT NULL REFERENCES makan_roles(role_id),
    assigned_by  INT          NOT NULL REFERENCES makan_users(user_id),
    assigned_at  DATETIME2    NOT NULL DEFAULT GETDATE(),
    expires_at   DATETIME2    NULL
);
```

---

### TABLE: `makan_access_scope`
**Purpose:** Define which companies/holdings a user is allowed to see — critical for the multi-holding structure where some sub-holdings don't share their AD.

```sql
CREATE TABLE makan_access_scope (
    scope_id     INT IDENTITY(1,1) PRIMARY KEY,
    user_id      INT           NOT NULL REFERENCES makan_users(user_id),
    scope_type   NVARCHAR(20)  NOT NULL,   -- 'all', 'holding', 'company', 'department', 'team'
    scope_ref_id INT           NULL,        -- company_id or dept_id from HR views
    granted_by   INT           NOT NULL REFERENCES makan_users(user_id),
    granted_at   DATETIME2     NOT NULL DEFAULT GETDATE()
);
```

> **Example rows:**
> - A manager in Holding A: `scope_type='holding', scope_ref_id=3` — can search all people in holding 3 only, sees lock icon on others.
> - HR Admin: `scope_type='all', scope_ref_id=NULL` — sees everyone.
> - A regular employee: `scope_type='department', scope_ref_id=12` — can search but only sees general info of people in their department.

---

### TABLE: `makan_sessions`
**Purpose:** JWT refresh token management (stateful invalidation)

```sql
CREATE TABLE makan_sessions (
    session_id    UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id       INT           NOT NULL REFERENCES makan_users(user_id),
    refresh_token NVARCHAR(500) NOT NULL,
    device_info   NVARCHAR(300) NULL,    -- "iPhone 14 Pro / iOS 17"
    ip_address    NVARCHAR(45)  NULL,
    created_at    DATETIME2     NOT NULL DEFAULT GETDATE(),
    expires_at    DATETIME2     NOT NULL,
    revoked_at    DATETIME2     NULL
);
```

---

### TABLE: `makan_otp` *(Phase 2 — for SMS/email OTP)*

```sql
CREATE TABLE makan_otp (
    otp_id      INT IDENTITY(1,1) PRIMARY KEY,
    user_id     INT          NOT NULL REFERENCES makan_users(user_id),
    otp_code    NVARCHAR(10) NOT NULL,     -- hashed
    otp_type    NVARCHAR(20) NOT NULL,     -- 'login', 'password_reset'
    expires_at  DATETIME2    NOT NULL,
    used_at     DATETIME2    NULL,
    created_at  DATETIME2    NOT NULL DEFAULT GETDATE()
);
```

---

### TABLE: `makan_audit_log`
**Purpose:** Track every access to sensitive data. Non-negotiable for a system handling HR data at this scale.

```sql
CREATE TABLE makan_audit_log (
    log_id        BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id       INT           NOT NULL,
    action        NVARCHAR(50)  NOT NULL,   -- 'view_profile', 'view_salary', 'search_face', 'export'
    target_employee_id NVARCHAR(20) NULL,
    ip_address    NVARCHAR(45)  NULL,
    user_agent    NVARCHAR(500) NULL,
    result        NVARCHAR(20)  NOT NULL,   -- 'allowed', 'denied'
    created_at    DATETIME2     NOT NULL DEFAULT GETDATE()
);
-- Index for querying by user and date
CREATE NONCLUSTERED INDEX IX_audit_user_date ON makan_audit_log(user_id, created_at DESC);
```

---

### TABLE: `makan_face_vectors` *(Phase 2 — Camera search)*
**Purpose:** Store face embeddings for the photo-search feature

```sql
CREATE TABLE makan_face_vectors (
    face_id       INT IDENTITY(1,1) PRIMARY KEY,
    employee_id   NVARCHAR(20)  NOT NULL UNIQUE,
    face_vector   VARBINARY(MAX) NOT NULL,    -- 512-dim float32 array, serialized
    model_name    NVARCHAR(50)  NOT NULL,     -- 'insightface_buffalo_l'
    model_version NVARCHAR(20)  NOT NULL,
    created_at    DATETIME2     NOT NULL DEFAULT GETDATE(),
    updated_at    DATETIME2     NOT NULL DEFAULT GETDATE(),
    is_active     BIT           NOT NULL DEFAULT 1
);
```

> - Face vectors are never returned to clients — only matched server-side.
> - Access to this table must be restricted to the face-search microservice only.
> - Employee consent/policy for biometric data storage must be confirmed with legal before Phase 2.

---

## Part 3 — Confirmed NOT Available / Needs Clarification

| Data | Status | Action |
|---|---|---|
| **Direct manager (مدیر مستقیم) per employee** | ❓ Unknown | Data team must confirm if org hierarchy exists in HR system |
| **Performance reviews / ratings** | ❌ Not in dashboard | If needed, build new `makan_performance_reviews` table in Phase 2 |
| **Profile photos** | ❌ Not in dashboard | Decide: upload manually to Makan+, or source from existing system? |
| **Employee work email** | ❓ Not explicit in row 61 | Confirm if work email is stored in HR system or only in email server |
| **Office phone / extension** | ❓ Not in row 61 | Confirm source |

---

## Summary: What Data Team Must Deliver

### Step 1 — Clarify (this week)
- [ ] Confirm whether **direct manager per employee** exists in the HR system
- [ ] Confirm whether **work email** is in the HR system or elsewhere
- [ ] Provide the **company/holding hierarchy** as a flat mapping file (holding → companies → departments)
- [ ] Confirm the **exact table/view names** in the existing HR MSSQL database

### Step 2 — Create Views (for PoC)
- [ ] `vw_makanplus_employees` — with sensitivity-based column masking
- [ ] `vw_makanplus_companies` — holding/subsidiary structure
- [ ] `vw_makanplus_departments` — unit list with company mapping
- [ ] `vw_makanplus_org_hierarchy` — manager–report chain (if data exists)

### Step 3 — Create New Tables (backend team, not data team)
All `makan_*` tables listed in Part 2 — these are created by the backend dev when setting up the MSSQL Makan+ schema.

---

## ERD Summary

```
[HR SYSTEM — Read via Views]
vw_companies ──< vw_departments ──< vw_positions
      │
      └──< vw_employees ──< vw_compensation
               │          └──< vw_attendance
               │          └──< vw_decree_history
               │
[MAKAN_PLUS — New Tables]
               └──< makan_users ──< makan_user_roles ──< makan_roles
                         │          └──< makan_access_scope
                         └──< makan_sessions
                         └──< makan_otp
                         └──< makan_face_vectors
                         └──< makan_audit_log
```

---

*Version: 2.0 · Revised: Tir 1404 · Prepared by: AI & Data Team*
