// Read the employee id from the URL
const params     = new URLSearchParams(window.location.search);
const employeeID = params.get('id');

// Mock data - replace with API call when backend is ready
const mockEmployees = {
    '100000': {
        id: '100000',
        name: 'علی صادقی',
        position: 'مهندس ارشد بک‌اند',
        department: 'مهندسی',
        company: 'شرکت فناوری ماکان',
        holding: 'هلدینگ فناوری',
        initials: 'ع‌ص',
        avatarColor: '#1e3a8a',
        contact: {
            mobile: '۰۹۱۲-۳۴۵-۶۷۸۹',
            workEmail: 'a.sadeghi@tm-group.ir',
            workPhone: '۰۲۱-۸۸۰۰-۱۱۰۱',
            officeLocation: 'برج مرکزی · طبقه ۷'
        },
        employment: {
            employeeId: '100000',
            hireDate: '۱۴ اسفند ۱۳۹۶',
            contractType: 'دائم تمام‌وقت',
            status: 'فعال',
            workLocation: 'تهران · ستاد مرکزی'
        },
        hr: {
            gender: 'مرد',
            age: '۳۴',
            maritalStatus: 'متأهل',
            educationLevel: 'کارشناسی ارشد',
            fieldOfStudy: 'مهندسی نرم‌افزار',
            nationalId: '***۴۵۶۷'
        },
        compensation: {
            grossSalary: '۶۵ میلیون تومان',
            netSalary: '۵۲ میلیون تومان',
            salaryGrade: 'گروه B3'
        },
        attendance: {
            workHours: '۱۶۸ ساعت',
            leaveBalance: '۱۲ روز',
            overtimeHours: '۸ ساعت',
            lateEntries: '۲ بار'
        }
    },
    '100001': {
        id: '100001',
        name: 'مریم رحیمی',
        position: 'تحلیلگر داده',
        department: 'هوش تجاری',
        company: 'شرکت فناوری ماکان',
        holding: 'هلدینگ فناوری',
        initials: 'م‌ر',
        avatarColor: '#16a34a',
        contact: {
            mobile: '۰۹۱۵-۴۵۶-۷۸۹۰',
            workEmail: 'm.rahimi@tm-group.ir',
            workPhone: '۰۲۱-۸۸۰۰-۱۱۰۲',
            officeLocation: 'برج مرکزی · طبقه ۵'
        },
        employment: {
            employeeId: '100001',
            hireDate: '۳ مهر ۱۳۹۸',
            contractType: 'دائم تمام‌وقت',
            status: 'فعال',
            workLocation: 'تهران · ستاد مرکزی'
        },
        hr: {
            gender: 'زن',
            age: '۲۹',
            maritalStatus: 'مجرد',
            educationLevel: 'کارشناسی ارشد',
            fieldOfStudy: 'مهندسی صنایع',
            nationalId: '***۱۲۳۴'
        },
        compensation: {
            grossSalary: '۴۸ میلیون تومان',
            netSalary: '۳۸ میلیون تومان',
            salaryGrade: 'گروه B1'
        },
        attendance: {
            workHours: '۱۷۲ ساعت',
            leaveBalance: '۸ روز',
            overtimeHours: '۱۴ ساعت',
            lateEntries: '۰ بار'
        }
    }
};

function createInfoRow( icon, label, value, highlight) {
    const row = document.createElement('div');
    row.className = 'info-row';

    row.innerHTML = `
        <div class="info-icon">
            <svg class="icon icon-sm"><use href="#${icon}"></use></svg>
        </div>
        <div class="info-content">
            <div class="info-label">${label}</div>
            <div class="info-value ${highlight ? 'highlight' : ''}">${value}</div>
        </div>
    `;

    return row;
}

function createTag(text, color) {
    const tag = document.createElement('span');
    tag.className = 'person-badge';
    tag.style.background = color + '15';
    tag.style.color = color;
    tag.style.border = '0.5px solid ' + color + '30';
    tag.textContent = text;
    return tag;
}

function renderProfile(employee) {
    // Avatar
    const avatar = document.getElementById('profile-avatar');
    avatar.textContent = employee.initials;
    avatar.style.background = employee.avatarColor + '20';
    avatar.style.color = employee.avatarColor;
    avatar.style.border = '2px solid ' + employee.avatarColor + '40';

    // Name and position
    document.getElementById('profile-name').textContent = employee.name;
    document.getElementById('profile-position').textContent = employee.position;

    // Tags
    const tagsContainer = document.getElementById('profile-tags');
    tagsContainer.appendChild(createTag(employee.department, '#1e3a8a'));
    tagsContainer.appendChild(createTag(employee.company, '#64748b'));

    // Contact
    const contactList = document.getElementById('contact-list');
    contactList.appendChild(createInfoRow('icon-phone', 'موبایل', employee.contact.mobile, false));
    contactList.appendChild(createInfoRow('icon-mail', 'ایمیل سازمانی', employee.contact.workEmail, false));
    contactList.appendChild(createInfoRow('icon-phone', 'تلفن دفتر', employee.contact.workPhone, false));
    contactList.appendChild(createInfoRow('icon-building', 'محل استقرار', employee.contact.officeLocation, false));

    // Employment
    const employmentList = document.getElementById('employment-list');
    employmentList.appendChild(createInfoRow('icon-user', 'کد پرسنلی', employee.employment.employeeId, true));
    employmentList.appendChild(createInfoRow('icon-user-check', 'تاریخ استخدام', employee.employment.hireDate, false));
    employmentList.appendChild(createInfoRow('icon-building', 'نوع قرارداد', employee.employment.contractType, false));
    employmentList.appendChild(createInfoRow('icon-user-check', 'وضعیت', employee.employment.status, false));
    employmentList.appendChild(createInfoRow('icon-building', 'محل خدمت', employee.employment.workLocation, false));

    // HR details
    const hrList = document.getElementById('hr-list');
    hrList.appendChild(createInfoRow('icon-user', 'جنسیت', employee.hr.gender, false));
    hrList.appendChild(createInfoRow('icon-user', 'سن', employee.hr.age, false));
    hrList.appendChild(createInfoRow('icon-user', 'وضعیت تاهل', employee.hr.maritalStatus, false));
    hrList.appendChild(createInfoRow('icon-user', 'آخرین مدرک', employee.hr.educationLevel, false));
    hrList.appendChild(createInfoRow('icon-user', 'رشته تحصیلی', employee.hr.fieldOfStudy, false));
    hrList.appendChild(createInfoRow('icon-user', 'کد ملی', employee.hr.nationalId, false));

    // Compensation
    const compensationList = document.getElementById('compensation-list');
    compensationList.appendChild(createInfoRow('icon-shield-check', 'حقوق ناخالص', employee.compensation.grossSalary, false));
    compensationList.appendChild(createInfoRow('icon-shield-check', 'پرداختی خالص', employee.compensation.netSalary, false));
    compensationList.appendChild(createInfoRow('icon-shield-check', 'گروه حقوقی', employee.compensation.salaryGrade, false));

    // Attendance
    const attendanceList = document.getElementById('attendance-list');
    attendanceList.appendChild(createInfoRow('icon-user-check', 'ساعت کارکرد ماه', employee.attendance.workHours, false));
    attendanceList.appendChild(createInfoRow('icon-user-check', 'مانده مرخصی', employee.attendance.leaveBalance, false));
    attendanceList.appendChild(createInfoRow('icon-user-check', 'اضافه‌کاری', employee.attendance.overtimeHours, false));
    attendanceList.appendChild(createInfoRow('icon-user-check', 'تعداد تاخیر', employee.attendance.lateEntries, false));
}

function showSkeleton() {
    document.getElementById('skeleton-screen').classList.remove('hidden');
    document.getElementById('profile-content').classList.add('hidden');
}

function hideSkeleton() {
    document.getElementById('skeleton-screen').classList.add('hidden');
    document.getElementById('profile-content').classList.remove('hidden');
}

function renderNotFound() {
    const main = document.querySelector('.main-content');
    main.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;
                    justify-content:center;height:60vh;gap:12px;padding:24px;text-align:center">
            <svg class="icon" style="width:48px;height:48px;color:var(--color-border)">
                <use href="#icon-user"></use>
            </svg>
            <p style="font-size:14px;font-weight:500;color:var(--color-text)">پروفایل یافت نشد</p>
            <p style="font-size:12px;color:var(--color-muted)">کارمند در سیستم ثبت نشده است</p>
        </div>
    `;
}

// Back button
document.getElementById('back-btn').addEventListener('click', function() {
    window.history.back();
});

// Load Profile
showSkeleton();

if (!employeeID) {
    hideSkeleton();
    renderNotFound();
} else {
    const employee = mockEmployees[employeeID];
    if (employee) {
        // Simulate loading delay so skeleton is visible
        setTimeout(function() {
            renderProfile(employee);
            hideSkeleton();
            document.title = 'ماکان+ · ' + employee.name;
        }, 800);
    } else {
        hideSkeleton();
        renderNotFound();
    }
}