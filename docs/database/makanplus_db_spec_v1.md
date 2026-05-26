# Makan+ — Database Specification
## گروه صنعتی طبیعت ماکان · Database Creation Specification for Data Team

> **Document type:** DBA Execution Spec — All DDL is ready to run  
> **Target:** Microsoft SQL Server 2019+  
> **Audience:** Data Team / DBA  
> **Version:** 1.0

---

## Architecture Overview

```
┌──────────────────────────────────┐
│  Microsoft Analysis Services     │  ← Existing HR/Payroll Data Warehouse
│  (existing — read via DAX)       │
└──────────────────┬───────────────┘
                   │  ETL / DAX Extract
                   │  (Data team's job)
                   ▼
┌──────────────────────────────────┐    ┌────────────────────────────────────┐
│  Database: MakanDWH              │    │  Database: MakanApp                │
│  ──────────────────────────────  │    │  ────────────────────────────────  │
│  Flat read-only mirror           │    │  Operational tables                │
│  Populated by ETL from AS        │◄───│  App reads employees from here     │
│  App: SELECT only                │    │  App: SELECT + INSERT + UPDATE     │
│                                  │    │  Auth, Roles, Sessions, Audit      │
└──────────────────────────────────┘    └────────────────────────────────────┘
          READ-ONLY for app                    READ/WRITE for app
```

**Two SQL Server databases, both on the same instance:**
- `MakanDWH` — populated by the data team via ETL from Analysis Services. The Makan+ application has `db_datareader` permission only.
- `MakanApp` — created and owned by the backend team. The app has full read/write access.

---

---

# DATABASE 1: `MakanDWH`

**Owner:** Data Team  
**App Permission:** `db_datareader` (SELECT only)  
**Collation:** `Persian_100_CI_AI` for all NVARCHAR columns  
**Purpose:** Flat mirror of HR data extracted from Analysis Services, optimized for the app's query patterns.

---

## Table 1.1 — `dim_employees`

**Update frequency:** Daily (after business hours, e.g., 02:00)  
**Sync strategy:** Full refresh (truncate + reload) for simplicity in Phase 1  
**Rows expected:** ~4,000 (current) — grows slowly

```sql
CREATE TABLE MakanDWH.dbo.dim_employees (

    -- Identity
    employee_id         NVARCHAR(20)    NOT NULL,   -- کد پرسنلی   | SOURCE: کد پرسنلی
    holding_name        NVARCHAR(200)   NOT NULL,   -- نام هلدینگ  | SOURCE: نام هلدینگ
    company_id          INT             NOT NULL,   -- شناسه شرکت  | SOURCE: derived from نام شرکت
    company_name        NVARCHAR(200)   NOT NULL,   -- نام شرکت    | SOURCE: نام شرکت
    department_id       INT             NULL,       -- شناسه واحد  | SOURCE: derived from واحد سازمانی
    department_name     NVARCHAR(200)   NULL,       -- واحد سازمانی| SOURCE: واحد سازمانی
    position_name       NVARCHAR(200)   NULL,       -- سمت سازمانی | SOURCE: سمت زامانی
    position_level      NVARCHAR(30)    NULL,       -- سطح شغلی    | SOURCE: derived — مدیر/رئیس/سرپرست/کارمند/کارگر
    cost_center         NVARCHAR(100)   NULL,       -- مرکز هزینه  | SOURCE: مرکز هزینه
    work_location       NVARCHAR(200)   NULL,       -- محل خدمت    | SOURCE: محل خدمت
    employment_status   NVARCHAR(20)    NOT NULL,   -- وضعیت       | SOURCE: وضعیت  — VALUES: 'active','terminated'

    -- Personal (public fields)
    full_name           NVARCHAR(200)   NOT NULL,   -- نام کامل     | SOURCE: نام و نام خانوادگی
    first_name          NVARCHAR(100)   NOT NULL,   -- نام          | SOURCE: نام
    last_name           NVARCHAR(100)   NOT NULL,   -- نام خانوادگی | SOURCE: نام خانوادگی
    gender              NVARCHAR(10)    NULL,       -- جنسیت        | SOURCE: جنسیت
    age                 TINYINT         NULL,       -- سن            | SOURCE: سن
    birth_year_persian  SMALLINT        NULL,       -- سال تولد شمسی| SOURCE: derived from تاریخ تولد

    -- Personal (manager-level fields)
    father_name         NVARCHAR(100)   NULL,       -- نام پدر      | SOURCE: نام پدر
    marital_status      NVARCHAR(20)    NULL,       -- وضعیت تأهل   | SOURCE: وضعیت تاهل  — VALUES: 'single','married'
    education_level     NVARCHAR(100)   NULL,       -- مدرک تحصیلی  | SOURCE: آخرین مدرک تحصیلی
    field_of_study      NVARCHAR(200)   NULL,       -- رشته تحصیلی  | SOURCE: رشته تحصیلی

    -- Employment dates (manager-level)
    hire_date           DATE            NULL,       -- تاریخ استخدام| SOURCE: تاریخ استخدام (converted to Gregorian)
    hire_date_persian   NVARCHAR(10)    NULL,       -- تاریخ استخدام شمسی | SOURCE: تاریخ استخدام (as-is)
    termination_date    DATE            NULL,       -- تاریخ ترک کار| SOURCE: تاریخ ترک کار (converted)
    tenure_years        DECIMAL(4,1)    NULL,       -- سابقه (سال)  | SOURCE: computed from hire_date

    -- Contact (manager-level — sensitive)
    mobile              NVARCHAR(20)    NULL,       -- موبایل        | SOURCE: موبایل
    work_email          NVARCHAR(200)   NULL,       -- ایمیل سازمانی| SOURCE: if available in AS, else NULL
    work_phone          NVARCHAR(20)    NULL,       -- تلفن دفتر    | SOURCE: if available in AS, else NULL
    office_room         NVARCHAR(50)    NULL,       -- اتاق/طبقه    | SOURCE: if available in AS, else NULL

    -- HR-admin-level sensitive
    national_id_masked  NVARCHAR(10)    NULL,       -- کد ملی (۴ رقم آخر) | SOURCE: last 4 chars of کد ملی — NEVER store full national_id here
    insurance_number    NVARCHAR(20)    NULL,       -- شماره بیمه   | SOURCE: شماره بیمه

    -- Manager relationship (critical for RBAC)
    direct_manager_id   NVARCHAR(20)    NULL,       -- کد پرسنلی مدیر مستقیم | SOURCE: *** DATA TEAM MUST CONFIRM SOURCE ***

    -- Profile photo (Phase 2)
    photo_url           NVARCHAR(500)   NULL,       -- آدرس تصویر   | SOURCE: NULL for now — populated in Phase 2

    -- Sync metadata
    last_synced_at      DATETIME2       NOT NULL    DEFAULT GETDATE(),

    CONSTRAINT PK_dim_employees PRIMARY KEY (employee_id)
);

-- Indexes for common app queries
CREATE INDEX IX_dim_emp_company     ON MakanDWH.dbo.dim_employees(company_id, employment_status);
CREATE INDEX IX_dim_emp_department  ON MakanDWH.dbo.dim_employees(department_id, employment_status);
CREATE INDEX IX_dim_emp_manager     ON MakanDWH.dbo.dim_employees(direct_manager_id);
CREATE INDEX IX_dim_emp_status      ON MakanDWH.dbo.dim_employees(employment_status);
-- Full-text search index for name search
CREATE FULLTEXT CATALOG MakanFTCatalog AS DEFAULT;
CREATE FULLTEXT INDEX ON MakanDWH.dbo.dim_employees(full_name, first_name, last_name, position_name)
    KEY INDEX PK_dim_employees;
```

> ⚠️ **CRITICAL — Data team action required:**
> 1. `direct_manager_id` — Confirm if Analysis Services contains the manager-report relationship. If not, this column stays NULL and RBAC for Phase 1 will use `department_id` as the scope boundary instead.
> 2. `national_id_masked` — Extract only `RIGHT(national_id, 4)` from the source. **Never store the full national ID in this database.**
> 3. `work_email`, `work_phone` — Confirm if these exist in Analysis Services or need a separate source.

---

## Table 1.2 — `dim_companies`

**Update frequency:** Weekly (or manually on org changes)  
**Sync strategy:** Full refresh

```sql
CREATE TABLE MakanDWH.dbo.dim_companies (

    company_id          INT             NOT NULL IDENTITY(1,1),
    company_code        NVARCHAR(20)    NULL,       -- کد شرکت     | SOURCE: data team assigns
    company_name        NVARCHAR(200)   NOT NULL,   -- نام شرکت    | SOURCE: نام شرکت (distinct values)
    holding_name        NVARCHAR(200)   NULL,       -- نام هلدینگ  | SOURCE: نام هلدینگ
    parent_company_id   INT             NULL,       -- شرکت مادر   | SOURCE: data team defines hierarchy
    company_type        NVARCHAR(20)    NOT NULL    DEFAULT 'subsidiary',  -- 'holding' or 'subsidiary'
    is_active           BIT             NOT NULL    DEFAULT 1,
    employee_count      INT             NULL,       -- computed during sync
    last_synced_at      DATETIME2       NOT NULL    DEFAULT GETDATE(),

    CONSTRAINT PK_dim_companies PRIMARY KEY (company_id)
);
```

> **Data team action:** Define the parent-child company hierarchy and provide as a lookup file. The hierarchy is needed so RBAC scope can be applied at holding or company level.

---

## Table 1.3 — `dim_departments`

**Update frequency:** Weekly  
**Sync strategy:** Full refresh

```sql
CREATE TABLE MakanDWH.dbo.dim_departments (

    department_id       INT             NOT NULL IDENTITY(1,1),
    department_name     NVARCHAR(200)   NOT NULL,   -- واحد سازمانی | SOURCE: واحد سازمانی (distinct values)
    company_id          INT             NULL,       -- شرکت مرتبط   | SOURCE: derived
    company_name        NVARCHAR(200)   NULL,
    holding_name        NVARCHAR(200)   NULL,
    is_active           BIT             NOT NULL    DEFAULT 1,
    employee_count      INT             NULL,       -- computed during sync
    last_synced_at      DATETIME2       NOT NULL    DEFAULT GETDATE(),

    CONSTRAINT PK_dim_departments PRIMARY KEY (department_id)
);
```

---

## Table 1.4 — `dim_positions`

**Update frequency:** Weekly  
**Sync strategy:** Full refresh

```sql
CREATE TABLE MakanDWH.dbo.dim_positions (

    position_id         INT             NOT NULL IDENTITY(1,1),
    position_name       NVARCHAR(200)   NOT NULL,   -- سمت سازمانی | SOURCE: سمت زامانی (distinct values)
    position_level      NVARCHAR(30)    NULL,       -- سطح          | SOURCE: derived — مدیر/رئیس/سرپرست/کارمند/کارگر
    is_managerial       BIT             NOT NULL    DEFAULT 0,
    employee_count      INT             NULL,
    last_synced_at      DATETIME2       NOT NULL    DEFAULT GETDATE(),

    CONSTRAINT PK_dim_positions PRIMARY KEY (position_id)
);
```

> **Data team action:** Define the mapping from سمت values to `position_level`. Suggested logic:
> - Contains 'مدیر' → 'manager'
> - Contains 'رئیس' → 'head'  
> - Contains 'سرپرست' → 'supervisor'
> - Contains 'کارگر' → 'worker'
> - Default → 'employee'

---

## Table 1.5 — `fact_compensation`

**Update frequency:** Monthly (after payroll run — typically 25th–30th of each Persian month)  
**Sync strategy:** Append new month; never overwrite historical rows  
**Rows expected:** ~4,000 employees × 12 months = ~48,000 rows/year

```sql
CREATE TABLE MakanDWH.dbo.fact_compensation (

    comp_id             BIGINT          NOT NULL IDENTITY(1,1),
    employee_id         NVARCHAR(20)    NOT NULL,   -- کد پرسنلی
    period_persian      NVARCHAR(7)     NOT NULL,   -- دوره شمسی   | FORMAT: '1403-06'  (year-month)
    period_date         DATE            NOT NULL,   -- اول ماه میلادی (for ordering)

    -- Gross components — SOURCE: ریز عوامل حکمی / فیش جبران خدمات
    gross_salary        DECIMAL(18,0)   NULL,       -- حقوق ناخالص
    base_salary         DECIMAL(18,0)   NULL,       -- حقوق پایه
    housing_allowance   DECIMAL(18,0)   NULL,       -- مزایای مسکن
    transport_allowance DECIMAL(18,0)   NULL,       -- حق ایاب و ذهاب
    food_allowance      DECIMAL(18,0)   NULL,       -- حق خواربار
    other_allowances    DECIMAL(18,0)   NULL,       -- سایر مزایا

    -- Deductions
    insurance_employee  DECIMAL(18,0)   NULL,       -- بیمه سهم کارمند
    tax_deduction       DECIMAL(18,0)   NULL,       -- مالیات

    -- Net
    net_salary          DECIMAL(18,0)   NULL,       -- پرداختی خالص

    -- Org context at time of payment (denormalized for history accuracy)
    company_name        NVARCHAR(200)   NULL,
    department_name     NVARCHAR(200)   NULL,
    position_name       NVARCHAR(200)   NULL,
    work_location       NVARCHAR(200)   NULL,

    last_synced_at      DATETIME2       NOT NULL    DEFAULT GETDATE(),

    CONSTRAINT PK_fact_compensation PRIMARY KEY (comp_id),
    CONSTRAINT UQ_comp_employee_period UNIQUE (employee_id, period_persian)
);

CREATE INDEX IX_fact_comp_employee ON MakanDWH.dbo.fact_compensation(employee_id, period_persian DESC);
CREATE INDEX IX_fact_comp_period   ON MakanDWH.dbo.fact_compensation(period_persian);
```

---

## Table 1.6 — `fact_attendance`

**Update frequency:** Daily (previous day's data)  
**Sync strategy:** Upsert by (employee_id, period_persian)

```sql
CREATE TABLE MakanDWH.dbo.fact_attendance (

    att_id              BIGINT          NOT NULL IDENTITY(1,1),
    employee_id         NVARCHAR(20)    NOT NULL,   -- کد پرسنلی
    period_persian      NVARCHAR(7)     NOT NULL,   -- دوره شمسی   | FORMAT: '1403-06'
    period_date         DATE            NOT NULL,

    -- Attendance metrics — SOURCE: میزان کارکرد / تاخیر
    work_hours_actual   DECIMAL(6,2)    NULL,       -- ساعت کارکرد واقعی
    work_hours_expected DECIMAL(6,2)    NULL,       -- ساعت کارکرد مورد انتظار
    avg_tardiness_min   DECIMAL(6,2)    NULL,       -- میانگین تأخیر (دقیقه)  | SOURCE: میانگین تاخیر در ورود
    late_entry_count    SMALLINT        NULL,       -- تعداد ورود دیر          | SOURCE: تعداد ورود بعد از ساعت ۸
    early_exit_count    SMALLINT        NULL,       -- تعداد خروج زود          | SOURCE: تعداد خروج بعد از ساعت ۱۷
    overtime_hours      DECIMAL(6,2)    NULL,       -- اضافه‌کاری (ساعت)       | SOURCE: جمع اضافه کاری دوره

    -- Leave metrics — SOURCE: مرخصی‌ها
    leave_balance_days  DECIMAL(5,1)    NULL,       -- مانده مرخصی            | SOURCE: مانده مرخصی دوره
    leave_hourly_taken  DECIMAL(5,1)    NULL,       -- مرخصی ساعتی استفاده‌شده | SOURCE: جمع مرخصی ساعتی
    leave_daily_count   SMALLINT        NULL,       -- تعداد مرخصی روزانه     | SOURCE: درخواست مرخصی روزانه
    sick_leave_count    SMALLINT        NULL,       -- تعداد استعلاجی          | SOURCE: درخواست استعلاجی

    last_synced_at      DATETIME2       NOT NULL    DEFAULT GETDATE(),

    CONSTRAINT PK_fact_attendance PRIMARY KEY (att_id),
    CONSTRAINT UQ_att_employee_period UNIQUE (employee_id, period_persian)
);

CREATE INDEX IX_fact_att_employee ON MakanDWH.dbo.fact_attendance(employee_id, period_persian DESC);
```

---

## Table 1.7 — `fact_decree_history`

**Update frequency:** Daily  
**Sync strategy:** Append new decrees only (never update historical)

```sql
CREATE TABLE MakanDWH.dbo.fact_decree_history (

    decree_id           BIGINT          NOT NULL IDENTITY(1,1),
    employee_id         NVARCHAR(20)    NOT NULL,
    decree_type         NVARCHAR(50)    NOT NULL,   -- نوع حکم  | SOURCE: تفکیک نوع حکم — VALUES: 'hire','termination','leave','transfer','salary_change'
    decree_date         DATE            NOT NULL,   -- تاریخ حکم (Gregorian)
    decree_date_persian NVARCHAR(10)    NULL,       -- تاریخ حکم شمسی
    work_location       NVARCHAR(200)   NULL,       -- محل خدمت  | SOURCE: احکام به تفکیک محل خدمت
    department_name     NVARCHAR(200)   NULL,       -- واحد       | SOURCE: احکام به تفکیک واحد سازمانی
    description         NVARCHAR(500)   NULL,       -- شرح حکم
    last_synced_at      DATETIME2       NOT NULL    DEFAULT GETDATE(),

    CONSTRAINT PK_fact_decree PRIMARY KEY (decree_id)
);

CREATE INDEX IX_decree_employee ON MakanDWH.dbo.fact_decree_history(employee_id, decree_date DESC);
CREATE INDEX IX_decree_type     ON MakanDWH.dbo.fact_decree_history(decree_type, decree_date DESC);
```

---

## ETL Specification for Data Team

The data team must create an ETL process (SSIS or scheduled SQL Agent jobs) that:

### DAX Queries Required

The following DAX patterns are needed to extract data from Analysis Services. These are indicative — data team adapts to actual measure/dimension names in the cube:

```dax
-- Employee master (for dim_employees)
EVALUATE
SELECTCOLUMNS(
    FILTER(
        'Personnel',
        'Personnel'[وضعیت] IN {"active", "terminated"}
    ),
    "employee_id",      [کد پرسنلی],
    "holding_name",     [نام هلدینگ],
    "company_name",     [نام شرکت],
    "full_name",        [نام و نام خانوادگی],
    "gender",           [جنسیت],
    "age",              [سن],
    "marital_status",   [وضعیت تاهل],
    "mobile",           [موبایل],
    "education_level",  [آخرین مدرک تحصیلی],
    "field_of_study",   [رشته تحصیلی],
    "position_name",    [سمت زامانی],
    "department_name",  [واحد سازمانی],
    "cost_center",      [مرکز هزینه],
    "work_location",    [محل خدمت],
    "employment_status",[وضعیت],
    "hire_date",        [تاریخ استخدام],
    "national_id_last4",RIGHT([کد ملی], 4),
    "insurance_number", [شماره بیمه]
)

-- Monthly compensation (for fact_compensation)
EVALUATE
CALCULATETABLE(
    SUMMARIZECOLUMNS(
        'Personnel'[کد پرسنلی],
        'Calendar'[Period],
        "gross_salary",  [حقوق ناخالص],
        "net_salary",    [پرداختی خالص],
        "insurance",     [میانگین پرداختی بیمه],  -- or individual value
        "tax",           [میانگین پرداختی مالیات]
    )
)
```

> **Data team:** Adapt these DAX queries to your actual measure and dimension names. The column names above are the target names in `MakanDWH`.

### Sync Schedule

| Table | Frequency | Method | Window |
|---|---|---|---|
| `dim_employees` | Daily | Full refresh | 02:00–03:00 |
| `dim_companies` | Weekly (Sunday) | Full refresh | 01:00 |
| `dim_departments` | Weekly (Sunday) | Full refresh | 01:00 |
| `dim_positions` | Weekly (Sunday) | Full refresh | 01:00 |
| `fact_compensation` | Monthly (25th) | Append new period | 03:00 |
| `fact_attendance` | Daily | Upsert current month | 02:00–03:00 |
| `fact_decree_history` | Daily | Append new rows | 02:30 |

### Post-sync step (mandatory)

After each `dim_employees` sync, run this to propagate `company_id` and `department_id`:

```sql
-- Update company_id in dim_employees
UPDATE e
SET e.company_id = c.company_id
FROM MakanDWH.dbo.dim_employees e
JOIN MakanDWH.dbo.dim_companies c ON c.company_name = e.company_name;

-- Update department_id in dim_employees
UPDATE e
SET e.department_id = d.department_id
FROM MakanDWH.dbo.dim_employees e
JOIN MakanDWH.dbo.dim_departments d ON d.department_name = e.department_name
    AND d.company_id = e.company_id;
```

---

---

# DATABASE 2: `MakanApp`

**Owner:** Backend Team  
**App Permission:** `db_owner` (full read/write)  
**Collation:** `SQL_Latin1_General_CP1_CI_AS` (standard — this DB stores app data, not Persian text)  
**Purpose:** Operational data for Makan+ application — authentication, access control, sessions, audit.

---

## Table 2.1 — `users`

```sql
CREATE TABLE MakanApp.dbo.users (

    user_id         INT             NOT NULL IDENTITY(1,1),
    employee_id     NVARCHAR(20)    NOT NULL,   -- Links to MakanDWH.dbo.dim_employees.employee_id
    username        NVARCHAR(50)    NOT NULL,
    password_hash   NVARCHAR(255)   NOT NULL,   -- bcrypt, cost factor = 12 minimum
    is_active       BIT             NOT NULL    DEFAULT 1,
    last_login      DATETIME2       NULL,
    failed_attempts TINYINT         NOT NULL    DEFAULT 0,
    locked_until    DATETIME2       NULL,
    created_by      INT             NULL,       -- user_id of the admin who created this account
    created_at      DATETIME2       NOT NULL    DEFAULT GETDATE(),
    updated_at      DATETIME2       NOT NULL    DEFAULT GETDATE(),

    CONSTRAINT PK_users             PRIMARY KEY (user_id),
    CONSTRAINT UQ_users_employee_id UNIQUE      (employee_id),
    CONSTRAINT UQ_users_username    UNIQUE      (username)
);
```

**Rules:**
- One account per `employee_id` maximum.
- Account creation is only possible by a user with `hr_admin` role — no self-registration.
- After 5 consecutive `failed_attempts`, set `locked_until = DATEADD(MINUTE, 30, GETDATE())`.
- `username` convention: `firstname.lastname` in Latin (e.g., `ahmad.karimi`).

---

## Table 2.2 — `roles`

```sql
CREATE TABLE MakanApp.dbo.roles (

    role_id                 INT             NOT NULL IDENTITY(1,1),
    role_code               NVARCHAR(30)    NOT NULL,
    role_name_fa            NVARCHAR(100)   NOT NULL,
    can_view_contact        BIT             NOT NULL    DEFAULT 0,  -- see mobile number
    can_view_salary         BIT             NOT NULL    DEFAULT 0,  -- see compensation data
    can_view_attendance     BIT             NOT NULL    DEFAULT 0,  -- see attendance/leave
    can_view_decree         BIT             NOT NULL    DEFAULT 0,  -- see decree history
    can_view_sensitive      BIT             NOT NULL    DEFAULT 0,  -- national_id, birth_date
    can_export              BIT             NOT NULL    DEFAULT 0,  -- export to Excel/CSV
    can_manage_users        BIT             NOT NULL    DEFAULT 0,  -- create/deactivate user accounts
    can_search_face         BIT             NOT NULL    DEFAULT 0,  -- use camera search

    CONSTRAINT PK_roles     PRIMARY KEY (role_id),
    CONSTRAINT UQ_role_code UNIQUE      (role_code)
);

-- Seed data — run once on deployment
INSERT INTO MakanApp.dbo.roles
    (role_code,         role_name_fa,   can_view_contact, can_view_salary, can_view_attendance, can_view_decree, can_view_sensitive, can_export, can_manage_users, can_search_face)
VALUES
    ('employee',        N'کارمند',              0, 0, 0, 0, 0, 0, 0, 0),
    ('manager',         N'مدیر',                1, 1, 1, 1, 0, 0, 0, 1),
    ('hr_specialist',   N'متخصص منابع انسانی',  1, 1, 1, 1, 1, 1, 0, 1),
    ('hr_admin',        N'ادمین منابع انسانی',  1, 1, 1, 1, 1, 1, 1, 1),
    ('executive',       N'مدیر ارشد',           1, 0, 1, 1, 0, 0, 0, 1);
-- Note: executive sees aggregates only for salary, not individual figures — enforced in app layer
```

---

## Table 2.3 — `user_roles`

```sql
CREATE TABLE MakanApp.dbo.user_roles (

    id              INT             NOT NULL IDENTITY(1,1),
    user_id         INT             NOT NULL    REFERENCES MakanApp.dbo.users(user_id),
    role_id         INT             NOT NULL    REFERENCES MakanApp.dbo.roles(role_id),
    assigned_by     INT             NOT NULL    REFERENCES MakanApp.dbo.users(user_id),
    assigned_at     DATETIME2       NOT NULL    DEFAULT GETDATE(),
    expires_at      DATETIME2       NULL,       -- NULL = no expiry

    CONSTRAINT PK_user_roles        PRIMARY KEY (id),
    CONSTRAINT UQ_user_role         UNIQUE      (user_id, role_id)
);

CREATE INDEX IX_user_roles_user ON MakanApp.dbo.user_roles(user_id);
```

---

## Table 2.4 — `access_scope`

**This table controls which employees a user is allowed to search and view. It is the heart of the multi-holding RBAC.**

```sql
CREATE TABLE MakanApp.dbo.access_scope (

    scope_id        INT             NOT NULL IDENTITY(1,1),
    user_id         INT             NOT NULL    REFERENCES MakanApp.dbo.users(user_id),

    -- What boundary this scope defines
    scope_type      NVARCHAR(20)    NOT NULL,
    -- VALUES:
    --   'all'         → user sees all employees in the system (HR Admin only)
    --   'holding'     → user sees all employees where dim_employees.holding_name = scope_value
    --   'company'     → user sees all employees where dim_employees.company_name = scope_value
    --   'department'  → user sees all employees where dim_employees.department_name = scope_value
    --   'direct_team' → user sees only their direct reports (via dim_employees.direct_manager_id)

    scope_value     NVARCHAR(200)   NULL,
    -- The value to match against dim_employees:
    --   scope_type='holding'     → scope_value = holding_name  (e.g., N'هلدینگ صنایع غذایی')
    --   scope_type='company'     → scope_value = company_name
    --   scope_type='department'  → scope_value = department_name
    --   scope_type='direct_team' → scope_value = NULL (uses dim_employees.direct_manager_id)
    --   scope_type='all'         → scope_value = NULL

    granted_by      INT             NOT NULL    REFERENCES MakanApp.dbo.users(user_id),
    granted_at      DATETIME2       NOT NULL    DEFAULT GETDATE(),
    is_active       BIT             NOT NULL    DEFAULT 1,

    CONSTRAINT PK_access_scope PRIMARY KEY (scope_id)
);

CREATE INDEX IX_scope_user ON MakanApp.dbo.access_scope(user_id, is_active);
```

**Example rows for a newly deployed system:**

```sql
-- HR Admin: sees everything
INSERT INTO access_scope (user_id, scope_type, scope_value, granted_by)
VALUES (1, 'all', NULL, 1);

-- Holding manager: sees only their holding
INSERT INTO access_scope (user_id, scope_type, scope_value, granted_by)
VALUES (2, 'holding', N'هلدینگ صنایع غذایی', 1);

-- Department manager: sees their direct reports + department
INSERT INTO access_scope (user_id, scope_type, scope_value, granted_by)
VALUES (3, 'direct_team', NULL, 1);

-- Regular employee: no scope row needed — app defaults to no cross-person access
```

---

## Table 2.5 — `sessions`

```sql
CREATE TABLE MakanApp.dbo.sessions (

    session_id      UNIQUEIDENTIFIER NOT NULL    DEFAULT NEWID(),
    user_id         INT             NOT NULL    REFERENCES MakanApp.dbo.users(user_id),
    refresh_token   NVARCHAR(500)   NOT NULL,   -- hashed with SHA-256 before storage
    device_name     NVARCHAR(200)   NULL,       -- e.g., 'iPhone 14 Pro'
    device_os       NVARCHAR(50)    NULL,       -- e.g., 'iOS 17.4'
    ip_address      NVARCHAR(45)    NULL,       -- IPv4 or IPv6
    created_at      DATETIME2       NOT NULL    DEFAULT GETDATE(),
    last_used_at    DATETIME2       NOT NULL    DEFAULT GETDATE(),
    expires_at      DATETIME2       NOT NULL,   -- DEFAULT: DATEADD(DAY, 30, GETDATE())
    revoked_at      DATETIME2       NULL,       -- NULL = still valid

    CONSTRAINT PK_sessions PRIMARY KEY (session_id)
);

CREATE INDEX IX_sessions_user    ON MakanApp.dbo.sessions(user_id, revoked_at);
CREATE INDEX IX_sessions_token   ON MakanApp.dbo.sessions(refresh_token);
CREATE INDEX IX_sessions_expires ON MakanApp.dbo.sessions(expires_at) WHERE revoked_at IS NULL;
```

**Cleanup job — run daily:**
```sql
-- Purge expired/revoked sessions older than 90 days
DELETE FROM MakanApp.dbo.sessions
WHERE (expires_at < DATEADD(DAY, -90, GETDATE()))
   OR (revoked_at < DATEADD(DAY, -90, GETDATE()));
```

---

## Table 2.6 — `audit_log`

```sql
CREATE TABLE MakanApp.dbo.audit_log (

    log_id              BIGINT          NOT NULL IDENTITY(1,1),
    user_id             INT             NOT NULL,   -- not FK — keep log even if user deleted
    action              NVARCHAR(50)    NOT NULL,
    -- VALUES: 'login', 'login_failed', 'logout',
    --         'view_profile', 'view_salary', 'view_contact',
    --         'view_attendance', 'view_decree',
    --         'search_text', 'search_face',
    --         'export', 'user_created', 'user_deactivated', 'role_assigned'

    target_employee_id  NVARCHAR(20)    NULL,       -- which employee was accessed (if applicable)
    result              NVARCHAR(10)    NOT NULL,   -- 'allowed' or 'denied'
    ip_address          NVARCHAR(45)    NULL,
    user_agent          NVARCHAR(300)   NULL,
    extra_data          NVARCHAR(500)   NULL,       -- JSON string for additional context
    created_at          DATETIME2       NOT NULL    DEFAULT GETDATE(),

    CONSTRAINT PK_audit_log PRIMARY KEY (log_id)
);

CREATE NONCLUSTERED INDEX IX_audit_user_date
    ON MakanApp.dbo.audit_log(user_id, created_at DESC)
    INCLUDE (action, result);

CREATE NONCLUSTERED INDEX IX_audit_target
    ON MakanApp.dbo.audit_log(target_employee_id, created_at DESC)
    WHERE target_employee_id IS NOT NULL;
```

> **Retention policy:** Do not delete audit log rows. Archive rows older than 2 years to a cold table if storage becomes an issue.

---

---

# Phase 2 Tables (Create Later — Not Needed for PoC)

These are defined here so the DBA can plan schema space, but **do not create now**.

```sql
-- OTP for two-factor authentication
CREATE TABLE MakanApp.dbo.otp_codes (
    otp_id      INT IDENTITY(1,1) PRIMARY KEY,
    user_id     INT          NOT NULL REFERENCES users(user_id),
    code_hash   NVARCHAR(64) NOT NULL,   -- SHA-256 of the 6-digit code
    purpose     NVARCHAR(20) NOT NULL,   -- 'login' or 'password_reset'
    expires_at  DATETIME2    NOT NULL,
    used_at     DATETIME2    NULL,
    created_at  DATETIME2    NOT NULL DEFAULT GETDATE()
);

-- Face recognition vectors
CREATE TABLE MakanApp.dbo.face_vectors (
    face_id       INT IDENTITY(1,1) PRIMARY KEY,
    employee_id   NVARCHAR(20)   NOT NULL UNIQUE,
    face_vector   VARBINARY(MAX) NOT NULL,   -- 512-dim float32, serialized numpy array
    model_name    NVARCHAR(50)   NOT NULL,
    model_version NVARCHAR(20)   NOT NULL,
    is_active     BIT            NOT NULL DEFAULT 1,
    created_at    DATETIME2      NOT NULL DEFAULT GETDATE(),
    updated_at    DATETIME2      NOT NULL DEFAULT GETDATE()
);
```

---

# Permissions Setup

```sql
-- Create a read-only login for the app to use against MakanDWH
CREATE LOGIN MakanApp_Reader WITH PASSWORD = '<strong_password>';
CREATE USER  MakanApp_Reader FOR LOGIN MakanApp_Reader;
EXEC sp_addrolemember 'db_datareader', 'MakanApp_Reader';  -- in MakanDWH

-- Create a read-write login for the app to use against MakanApp
CREATE LOGIN MakanApp_Writer WITH PASSWORD = '<strong_password>';
CREATE USER  MakanApp_Writer FOR LOGIN MakanApp_Writer;
EXEC sp_addrolemember 'db_datareader',  'MakanApp_Writer'; -- in MakanApp
EXEC sp_addrolemember 'db_datawriter',  'MakanApp_Writer'; -- in MakanApp
-- Note: no DDL permissions for the app login
```

---

# Open Questions — Data Team Must Answer Before ETL Build

| # | Question | Why it blocks |
|---|---|---|
| 1 | Does Analysis Services contain **direct manager per employee**? If yes, what is the measure/dimension name? | Without this, manager-level RBAC cannot use `direct_team` scope |
| 2 | Does Analysis Services contain **work email** and **work phone**? | These are shown on profiles in the app |
| 3 | What is the exact **company/holding hierarchy**? Provide as a flat CSV: `company_name, holding_name, parent` | `dim_companies` and RBAC holding-level scope depend on this |
| 4 | What are the **actual table/dimension names** in Analysis Services for the employee master? | Needed to write correct DAX queries |
| 5 | What is the **payroll run schedule** (which day of the month)? | Determines `fact_compensation` sync timing |
| 6 | Are **attendance records** in the same Analysis Services cube, or in a separate system? | May require a different ETL source |

---

*Version: 1.0 · Tir 1404 · Backend/Data Team · Makan+ Project*
