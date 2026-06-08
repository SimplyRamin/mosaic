// Read the employee id from the URL
const params     = new URLSearchParams(window.location.search);
const employeeId = params.get('id');

if (!requireAuth()) throw new Error('Not authenticated');

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

function formatCurrency(value) {
    if (value === null || value === undefined) return '-';
    const num = Math.round(Number(value) / 10); // Rial to Toman
    return num.toLocaleString('fa-IR') + ' تومان';
}

function formatMinutes(value) {
    if (value === null || value === undefined) return '-';
    const mins = Math.round(Number(value));
    if (mins === 0) return '۰';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0 ) return m.toLocaleString('fa-IR') + "دقیقه";
    if (m === 0 ) return h.toLocaleString('fa-IR') + "ساعت";
    return h.toLocaleString('fa-IR') + ' ساعت و ' + m.toLocaleString('fa-IR') + ' دقیقه';
}

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

function renderSalary(salary) {
    const list = document.getElementById('compensation-list');
    list.innerHTML = '';
    list.appendChild(createInfoRow('icon-shield-check', 'حقوق ناخالص',     formatCurrency(salary.Gross_Salary),        true));
    list.appendChild(createInfoRow('icon-shield-check', 'پرداختی خالص',    formatCurrency(salary.Net_Salary),          true));
    list.appendChild(createInfoRow('icon-shield-check', 'حقوق پایه',       formatCurrency(salary.Base_Salary),         false));
    list.appendChild(createInfoRow('icon-shield-check', 'مالیات',          formatCurrency(salary.Tax_Deduction),       false));
    list.appendChild(createInfoRow('icon-shield-check', 'بیمه سهم کارمند', formatCurrency(salary.Insurance_Employee),  false));
}

function renderDecree(decreeList) {
    const list = document.getElementById('attendance-list');
    list.closest('.profile-section').querySelector('.profile-section-title').textContent = 'سوابق حکمی';
    list.innerHTML = '';

    if (!decreeList || decreeList.length === 0) {
        list.appendChild(createInfoRow('icon-shield-check', 'اطلاعاتی یافت نشد', 'حکم', false));
        return;
    }

    decreeList.forEach(function(d) {
        const label = (d.Commission_Type || '-') + ' · ' + (d.Solar_Date || '-');
        const value = (d.ORG_Chart || '-') + ' · ' + (d.Work_Location || '-');
        list.appendChild(createInfoRow('icon-shield-check', label, value, false));
    });
}

function renderAttendance(attendanceList) {
    if (!attendanceList || attendanceList.length === 0) return;

    // Find or create attendance section after decree section
    let attSection = document.getElementById('attendance-extra-section');
    if (!attSection) {
        const divider = document.createElement('div');
        divider.className = 'divider';

        attSection = document.createElement('div');
        attSection.className = 'profile-section';
        attSection.id = 'attendance-extra-section';
        attSection.innerHTML = '<h2 class="profile-section-title">کارکرد و حضور</h2><div class="info-list" id="attendance-extra-list"></div>';

        const profileContent = document.getElementById('profile-content');
        profileContent.appendChild(divider);
        profileContent.appendChild(attSection);
    }

    const list = document.getElementById('attendance-extra-list');
    list.innerHTML = '';

    attendanceList.forEach(function(item) {
        list.appendChild(createInfoRow(
            'icon-user-check',
            item.Attendance_Factor_Title || '-',
            formatMinutes(item.SumValue),
            false
        ));
    });
}

async function loadProfile() {
    const data = await apiCall(`/api/employees/${employeeId}`);

    if (data === null) {
        // Mock mode
        const employee = mockEmployees[employeeId];
        setTimeout(function() {
            if (employee) {
                renderProfile(employee);
                saveRecentProfile({
                    id:          employee.id,
                    name:        employee.name,
                    role:        employee.role,
                    initials:    employee.initials,
                    avatarColor: employee.avatarColor
                });
                document.title = document.title = 'ماکان+ · ' + employee.name;
            } else {
                renderNotFound();
            }
            hideSkeleton();
        }, 800);
    } else {
        // Real mode - map API response to renderProfile format
        renderProfile({
            id:             data.Employee_Code,
            name:           data.Full_Name,
            position:       data.Post,
            department:     data.ORG,
            company:        data.Company_Name,
            holding:        data.Holding_Name,
            initials:       getInitials(data.Full_Name),
            avatarColor:    getAvatarColor(data.Employee_Code),
            contact: {
                mobile:         data.Mobile           || '-',
                workEmail:      '-',
                workPhone:      '-',
                officeLocation: data.Work_Loc_Name    || '-'
            },
            employment: {
                employeeId:     data.Employee_Code,
                hireDate:       data.Employment_Solar_Date || '-',
                contractType:   '-',
                status:         data.Is_Active_Text   || '-',
                workLocation:   data.Work_Loc_Name    || '-'
            },
            hr: {
                gender:         data.Gender_Type      || '-',
                age:            data.Age              || '-',
                maritalStatus:  data.Marital_Status   || '-',
                educationLevel: data.Education_Degree || '-',
                fieldOfStudy:   data.Education_Field  || '-',
                nationalId:     data.National_ID      || '-'
            },
            compensation: {
                grossSalary:    '-',
                netSalary:      '-',
                salaryGrade:    '-'
            },
            attendance: {
                workHours:      '-',
                leaveBalance:   '-',
                overtimeHours:  '-',
                lateEntries:    '-'
            }
        });
        saveRecentProfile({
            id:          data.Employee_Code,
            name:        data.Full_Name,
            role:        data.Post,
            initials:    getInitials(data.Full_Name),
            avatarColor: getAvatarColor(data.Employee_Code)
        });
        document.title = 'ماکان+ · ' + data.Full_Name;
        hideSkeleton();
        // Fire salary, decree and attendance in parallel
        Promise.allSettled([
            apiCall(`/api/employees/${employeeId}/salary`),
            apiCall(`/api/employees/${employeeId}/decree`),
            apiCall(`/api/employees/${employeeId}/attendance`)
        ]).then(function(results) {
            const salaryResult     = results[0];
            const decreeResult     = results[1];
            const attendanceResult = results[2];

            if (salaryResult.status === 'fulfilled' && salaryResult.value) {
                renderSalary(salaryResult.value);
            }
            if (decreeResult.status === 'fulfilled' && decreeResult.value) {
                renderDecree(decreeResult.value.results || []);
            }
            if (attendanceResult.status === 'fulfilled' && attendanceResult.value) {
                renderAttendance(attendanceResult.value.results || []);
            }
        });
    }
}

function getInitials(fullName) {
    if (!fullName) return '?';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0);
    return parts[0].charAt(0) + '' + parts[parts.length - 1].charAt(0);
}

function getAvatarColor(employeeCode) {
    const colors = [
        '#1e3a8a', '#16a34a', '#b8960c',
        '#64748b', '#9333ea', '#0891b2'
    ];
    const index = parseInt(employeeCode) % colors.length;
    return colors[index] || '#1e3a8a';
}

if (!employeeId) {
    hideSkeleton();
    renderNotFound();
} else {
    loadProfile().catch(function() {
        hideSkeleton();
        renderNotFound();
    });
}