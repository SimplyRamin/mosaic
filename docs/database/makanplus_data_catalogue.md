# ماکان+ — Data Catalogue
## سامانه منابع انسانی · گروه صنعتی طبیعت ماکان

> **مخاطب:** تیم داده و DBA  
> **هدف:** تعریف ساختار داده مورد نیاز برای پیاده‌سازی اپلیکیشن ماکان+  
> **پایگاه داده:** Microsoft SQL Server  
> **وضعیت:** نسخه اولیه — نیاز به تأیید و تکمیل توسط تیم HR

---

## دسته‌بندی جداول

| دسته | تعداد جدول | سطح حساسیت |
|---|---|---|
| احراز هویت و دسترسی | 4 | بالا |
| ساختار سازمانی | 4 | عمومی |
| اطلاعات پرسنلی | 3 | متوسط–بالا |
| اطلاعات تماس | 1 | متوسط |
| حقوق و دستمزد | 2 | بالا |
| عملکرد | 2 | بالا |
| تصویر و بیومتریک | 1 | بالا |

---

## ۱. احراز هویت و کنترل دسترسی

### ۱.۱ `users` — کاربران سیستم

| ستون | نوع | توضیح | مثال |
|---|---|---|---|
| `user_id` | INT IDENTITY PK | شناسه یکتا | 1042 |
| `employee_id` | NVARCHAR(20) FK | کد کارمندی | TM-004821 |
| `username` | NVARCHAR(50) UNIQUE | نام کاربری | r.ferdos |
| `password_hash` | NVARCHAR(255) | هش رمز عبور (bcrypt) | $2b$12$... |
| `is_active` | BIT | فعال/غیرفعال | 1 |
| `last_login` | DATETIME | آخرین ورود | 2025-06-01 09:41 |
| `failed_attempts` | INT | تعداد ورود ناموفق | 0 |
| `locked_until` | DATETIME NULL | قفل تا زمان | NULL |
| `created_at` | DATETIME | تاریخ ایجاد | — |
| `updated_at` | DATETIME | آخرین ویرایش | — |

> 🔒 **نکته:** رمز عبور هرگز به‌صورت متن خام ذخیره نشود. از bcrypt با cost=12 استفاده شود.

---

### ۱.۲ `roles` — نقش‌های دسترسی

| ستون | نوع | توضیح | مقادیر |
|---|---|---|---|
| `role_id` | INT IDENTITY PK | شناسه نقش | — |
| `role_name` | NVARCHAR(50) | نام نقش | `employee`, `manager`, `hr_specialist`, `hr_admin`, `executive` |
| `role_name_fa` | NVARCHAR(100) | نام فارسی | کارمند عادی، مدیر، متخصص HR، ادمین HR، مدیر ارشد |
| `description` | NVARCHAR(500) | توضیح نقش | — |
| `can_view_sensitive` | BIT | دسترسی به داده حساس | 0/1 |
| `can_view_salary` | BIT | دسترسی به حقوق | 0/1 |
| `can_view_performance` | BIT | دسترسی به عملکرد | 0/1 |
| `can_export` | BIT | اجازه خروجی گرفتن | 0/1 |

**نقش‌های پیش‌فرض:**

| نقش | حقوق | عملکرد | خروجی |
|---|---|---|---|
| `employee` | ✗ | ✗ | ✗ |
| `manager` | زیرمجموعه | زیرمجموعه | ✗ |
| `hr_specialist` | واحد خود | واحد خود | ✓ |
| `hr_admin` | همه | همه | ✓ |
| `executive` | همه | همه | ✓ |

---

### ۱.۳ `user_roles` — نقش‌های هر کاربر

| ستون | نوع | توضیح |
|---|---|---|
| `user_role_id` | INT IDENTITY PK | شناسه |
| `user_id` | INT FK | شناسه کاربر |
| `role_id` | INT FK | شناسه نقش |
| `assigned_by` | INT FK | اختصاص‌دهنده |
| `assigned_at` | DATETIME | تاریخ اختصاص |
| `expires_at` | DATETIME NULL | انقضا (اختیاری) |

---

### ۱.۴ `access_scope` — محدوده دسترسی کاربر

> این جدول تعریف می‌کند هر کاربر داده کدام شرکت‌ها/واحدها را می‌تواند ببیند.

| ستون | نوع | توضیح |
|---|---|---|
| `scope_id` | INT IDENTITY PK | شناسه |
| `user_id` | INT FK | شناسه کاربر |
| `scope_type` | NVARCHAR(20) | نوع محدوده: `company`, `department`, `team`, `all` |
| `scope_ref_id` | INT NULL | شناسه ارجاع (company_id یا dept_id) |
| `granted_by` | INT FK | اعطاکننده دسترسی |
| `granted_at` | DATETIME | تاریخ اعطا |

> **مثال:** یک مدیر در هلدینگ الف فقط می‌تواند کارمندان همان هلدینگ را ببیند، نه سایر زیرمجموعه‌ها.

---

## ۲. ساختار سازمانی

### ۲.۱ `companies` — شرکت‌ها و هلدینگ‌ها

| ستون | نوع | توضیح |
|---|---|---|
| `company_id` | INT IDENTITY PK | شناسه شرکت |
| `company_code` | NVARCHAR(20) | کد شرکت | TM-001 |
| `company_name_fa` | NVARCHAR(200) | نام فارسی |
| `company_name_en` | NVARCHAR(200) | نام انگلیسی |
| `parent_company_id` | INT NULL FK | شرکت مادر (برای ساختار درختی) |
| `company_type` | NVARCHAR(50) | نوع: `holding`, `subsidiary`, `branch` |
| `is_active` | BIT | فعال |
| `employee_count` | INT | تعداد کارمند (cache) |

---

### ۲.۲ `departments` — واحدها و دپارتمان‌ها

| ستون | نوع | توضیح |
|---|---|---|
| `dept_id` | INT IDENTITY PK | شناسه واحد |
| `dept_code` | NVARCHAR(20) | کد واحد |
| `dept_name_fa` | NVARCHAR(200) | نام فارسی |
| `dept_name_en` | NVARCHAR(200) | نام انگلیسی |
| `company_id` | INT FK | شرکت مرتبط |
| `parent_dept_id` | INT NULL FK | واحد مادر |
| `dept_head_id` | INT NULL FK | مدیر واحد |
| `is_active` | BIT | فعال |

---

### ۲.۳ `positions` — سمت‌ها

| ستون | نوع | توضیح |
|---|---|---|
| `position_id` | INT IDENTITY PK | شناسه سمت |
| `position_code` | NVARCHAR(20) | کد سمت |
| `position_name_fa` | NVARCHAR(200) | عنوان فارسی |
| `position_name_en` | NVARCHAR(200) | عنوان انگلیسی |
| `dept_id` | INT FK | واحد مرتبط |
| `job_grade` | NVARCHAR(10) | گروه شغلی: A1–D5 |
| `is_managerial` | BIT | سمت مدیریتی |

---

### ۲.۴ `org_hierarchy` — سلسله‌مراتب سازمانی

> برای رسم چارت سازمانی و تعیین زنجیره گزارش‌دهی.

| ستون | نوع | توضیح |
|---|---|---|
| `hierarchy_id` | INT IDENTITY PK | شناسه |
| `employee_id` | NVARCHAR(20) FK | کارمند |
| `manager_employee_id` | NVARCHAR(20) FK | مدیر مستقیم |
| `effective_from` | DATE | از تاریخ |
| `effective_to` | DATE NULL | تا تاریخ |
| `is_current` | BIT | آیا فعلی است |

---

## ۳. اطلاعات پرسنلی

### ۳.۱ `employees` — اطلاعات پایه کارمندان

| ستون | نوع | حساسیت | توضیح |
|---|---|---|---|
| `employee_id` | NVARCHAR(20) PK | — | کد کارمندی یکتا (TM-XXXXXX) |
| `national_id` | NVARCHAR(10) | 🔒 بالا | کد ملی |
| `first_name_fa` | NVARCHAR(100) | عمومی | نام |
| `last_name_fa` | NVARCHAR(100) | عمومی | نام خانوادگی |
| `first_name_en` | NVARCHAR(100) | عمومی | نام (لاتین) |
| `last_name_en` | NVARCHAR(100) | عمومی | نام خانوادگی (لاتین) |
| `gender` | NVARCHAR(10) | متوسط | جنسیت: `male`, `female` |
| `birth_date` | DATE | 🔒 بالا | تاریخ تولد |
| `marital_status` | NVARCHAR(20) | 🔒 متوسط | وضعیت تأهل |
| `education_level` | NVARCHAR(50) | متوسط | آخرین مدرک تحصیلی |
| `field_of_study_fa` | NVARCHAR(200) | متوسط | رشته تحصیلی |
| `created_at` | DATETIME | — | تاریخ ثبت |
| `updated_at` | DATETIME | — | آخرین ویرایش |

---

### ۳.۲ `employment_records` — سابقه استخدام

| ستون | نوع | حساسیت | توضیح |
|---|---|---|---|
| `record_id` | INT IDENTITY PK | — | شناسه |
| `employee_id` | NVARCHAR(20) FK | — | کد کارمندی |
| `company_id` | INT FK | — | شرکت |
| `dept_id` | INT FK | — | واحد |
| `position_id` | INT FK | — | سمت |
| `hire_date` | DATE | متوسط | تاریخ استخدام |
| `termination_date` | DATE NULL | 🔒 بالا | تاریخ پایان همکاری |
| `employment_type` | NVARCHAR(30) | متوسط | نوع قرارداد: `permanent`, `temporary`, `project`, `internship` |
| `employment_status` | NVARCHAR(30) | متوسط | وضعیت: `active`, `on_leave`, `terminated` |
| `is_current` | BIT | — | فعال‌ترین رکورد |
| `notes` | NVARCHAR(1000) NULL | 🔒 بالا | یادداشت |

---

### ۳.۳ `employee_documents` — مدارک پرسنلی *(آینده)*

| ستون | نوع | توضیح |
|---|---|---|
| `doc_id` | INT IDENTITY PK | شناسه |
| `employee_id` | NVARCHAR(20) FK | کد کارمندی |
| `doc_type` | NVARCHAR(50) | نوع: `contract`, `id_card`, `degree`, `photo` |
| `file_path` | NVARCHAR(500) | مسیر فایل (NAS) |
| `uploaded_at` | DATETIME | تاریخ بارگذاری |
| `uploaded_by` | INT FK | بارگذاری‌کننده |

---

## ۴. اطلاعات تماس

### ۴.۱ `employee_contacts`

| ستون | نوع | حساسیت | توضیح |
|---|---|---|---|
| `contact_id` | INT IDENTITY PK | — | شناسه |
| `employee_id` | NVARCHAR(20) FK | — | کد کارمندی |
| `work_email` | NVARCHAR(200) | عمومی | ایمیل سازمانی |
| `work_phone` | NVARCHAR(20) | عمومی | تلفن دفتر |
| `mobile` | NVARCHAR(20) | 🔒 بالا | موبایل (فقط HR/مدیر مستقیم) |
| `office_location` | NVARCHAR(200) | عمومی | محل کار (ساختمان/طبقه) |
| `office_room` | NVARCHAR(50) | عمومی | شماره اتاق |
| `emergency_contact_name` | NVARCHAR(200) | 🔒 بالا | نام تماس اضطراری |
| `emergency_contact_phone` | NVARCHAR(20) | 🔒 بالا | تلفن اضطراری |

---

## ۵. حقوق و دستمزد

### ۵.۱ `salary_grades` — جدول گروه‌بندی حقوقی

| ستون | نوع | توضیح |
|---|---|---|
| `grade_id` | INT IDENTITY PK | شناسه |
| `grade_code` | NVARCHAR(10) | کد گروه: A1, B3, C2... |
| `grade_name_fa` | NVARCHAR(100) | عنوان گروه |
| `min_salary` | DECIMAL(18,0) | حداقل حقوق (تومان) |
| `max_salary` | DECIMAL(18,0) | حداکثر حقوق (تومان) |
| `effective_year` | INT | سال مالی |

---

### ۵.۲ `employee_compensation` — حقوق کارمند

> 🔒 **حساسیت بالا** — فقط HR و مدیر مستقیم

| ستون | نوع | توضیح |
|---|---|---|
| `comp_id` | INT IDENTITY PK | شناسه |
| `employee_id` | NVARCHAR(20) FK | کد کارمندی |
| `grade_id` | INT FK | گروه حقوقی |
| `base_salary` | DECIMAL(18,0) | حقوق پایه (تومان) |
| `housing_allowance` | DECIMAL(18,0) NULL | مزایای مسکن |
| `transport_allowance` | DECIMAL(18,0) NULL | مزایای ایاب و ذهاب |
| `food_allowance` | DECIMAL(18,0) NULL | حق خواربار |
| `other_allowances` | DECIMAL(18,0) NULL | سایر مزایا |
| `effective_from` | DATE | از تاریخ |
| `effective_to` | DATE NULL | تا تاریخ |
| `is_current` | BIT | فعلی |

---

## ۶. ارزیابی عملکرد

### ۶.۱ `performance_reviews` — ارزیابی‌ها

> 🔒 **حساسیت بالا** — فقط HR و مدیر مستقیم

| ستون | نوع | توضیح |
|---|---|---|
| `review_id` | INT IDENTITY PK | شناسه |
| `employee_id` | NVARCHAR(20) FK | کد کارمندی |
| `reviewer_employee_id` | NVARCHAR(20) FK | ارزیاب |
| `review_period` | NVARCHAR(20) | دوره: `1402-H1`, `1402-Annual` |
| `overall_score` | DECIMAL(4,2) | نمره کل (۱–۵) |
| `review_date` | DATE | تاریخ ارزیابی |
| `status` | NVARCHAR(20) | وضعیت: `draft`, `completed`, `approved` |
| `notes` | NVARCHAR(2000) NULL | یادداشت |

---

### ۶.۲ `review_criteria` — معیارهای ارزیابی

| ستون | نوع | توضیح |
|---|---|---|
| `criteria_id` | INT IDENTITY PK | شناسه |
| `review_id` | INT FK | ارزیابی مرتبط |
| `criteria_name_fa` | NVARCHAR(200) | معیار (کیفیت کار، رعایت قوانین...) |
| `score` | DECIMAL(4,2) | نمره (۱–۵) |
| `weight` | DECIMAL(4,2) | ضریب اهمیت |

---

## ۷. تصویر و بیومتریک (فاز دوم)

### ۷.۱ `employee_face_vectors`

> 🔒 **حساسیت بسیار بالا** — فقط سیستم، هرگز قابل دسترسی مستقیم توسط کاربر نیست

| ستون | نوع | توضیح |
|---|---|---|
| `face_id` | INT IDENTITY PK | شناسه |
| `employee_id` | NVARCHAR(20) FK | کد کارمندی |
| `face_vector` | VARBINARY(MAX) | بردار چهره (embedding از DeepFace/InsightFace) |
| `model_version` | NVARCHAR(50) | نسخه مدل استفاده‌شده |
| `created_at` | DATETIME | تاریخ ثبت |
| `is_active` | BIT | فعال |

---

## نمودار روابط (ERD خلاصه)

```
companies ──< departments ──< positions
    │                              │
    └──< employment_records >──────┘
              │
         employees ──< employee_contacts
              │
              ├──< users ──< user_roles ──< roles
              │              └──< access_scope
              │
              ├──< employee_compensation ──< salary_grades
              │
              ├──< performance_reviews ──< review_criteria
              │
              └──< employee_face_vectors
```

---

## اقدامات مورد نیاز از تیم داده

### فوری (برای راه‌اندازی PoC)
- [ ] تأیید ستون‌های جدول `employees` با تیم HR
- [ ] تأیید ساختار `companies` و تعداد هلدینگ‌های زیرمجموعه
- [ ] ارائه نمونه داده anonymized (بدون کد ملی و اطلاعات واقعی) برای محیط توسعه
- [ ] تأیید کدهای کارمندی (فرمت TM-XXXXXX یا متفاوت)
- [ ] تعریف اولیه نقش‌های دسترسی (`roles`) مطابق ساختار سازمانی

### در فاز دوم
- [ ] تعریف گروه‌های حقوقی (`salary_grades`)
- [ ] ساختار `review_criteria` برای فرم ارزیابی
- [ ] سیاست نگهداری و حذف داده بیومتریک
- [ ] بررسی ملاحظات حقوقی ذخیره بردار چهره

---

## یادداشت‌های فنی

1. **Encryption at Rest:** ستون‌های حساس (`national_id`, `salary`, `face_vector`) باید با SQL Server Always Encrypted یا TDE رمزگذاری شوند.
2. **Audit Log:** تمام دسترسی‌ها به داده حساس باید در یک جدول `audit_log` ثبت شود.
3. **Soft Delete:** از حذف واقعی رکورد خودداری شود؛ از `is_active = 0` استفاده گردد.
4. **Collation:** برای ستون‌های فارسی از `Persian_100_CI_AI` استفاده شود.
5. **Indexing:** روی `employee_id`, `dept_id`, `company_id` و `is_current` ایندکس ایجاد شود.

---

*نسخه: ۱.۰ · تاریخ: خرداد ۱۴۰۴ · تهیه‌کننده: تیم AI & Data*
