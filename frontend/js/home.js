// Mock data - replace with API call when backend is ready
const mockTeam = [
    {
        id: '100000',
        name: 'علی صادقی',
        role: 'مهندس ارشد بک‌اند',
        initials: 'ع‌ص',
        avatarColor: '#1f3b83'
    },
    {
        id: '100001',
        name: 'مریم رحیمی',
        role: 'تحلیلگر دیتا · هوش تجاری',
        initials: 'م‌ر',
        avatarColor: '#16a34a'
    },
    {
        id: '100002',
        name: 'کامران نظاری',
        role: 'مهندس یادگیری ماشین',
        initials: 'ک‌ن',
        avatarColor: '#b19a33'
    }
];

const mockRecent = [
    {
        id: '100003',
        name: 'زهرا حسینی',
        role: 'متخصص منابع انسانی · ستاد',
        initials: 'ز‌ح',
        avatarColor: '#64748b'
    }
];

function createPersonCard(person) {
    const card = document.createElement('div');
    card.className = 'person-card';
    card.dataset.id = person.id;
    
        card.innerHTML = `
            <div class="person-avatar"
                 style="background:${person.avatarColor}20;
                        color:${person.avatarColor};
                        border: 0.5px solid ${person.avatarColor}40">
                ${person.initials}
            </div>
            <div class="person-info">
                <div class="person-name">${person.name}</div>
                <div class="person-role">${person.role}</div>
            </div>
        `;

        card.addEventListener('click', function() {
            window.location.href = `profile.html?id=${person.id}`;
        });

        return card;
}

function renderList(listId, data) {
    const container = document.getElementById(listId);
    data.forEach(function(person) {
        container.appendChild(createPersonCard(person));
    });
}

function renderStats(malePercent, femalePercent) {
    document.getElementById('male-percent').textContent = malePercent + '٪';
    document.getElementById('female-percent').textContent = femalePercent + '٪';
    document.getElementById('male-fill').style.width = malePercent + '%';
    document.getElementById('female-fill').style.width = femalePercent + '%';
}

function getInitials(fullName) {
    if (!fullName) return '?';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0);
    return parts[0].charAt(0) + '' + parts[parts.length - 1].charAt(0);
}

// Show real user name from stored user object
async function loadUserGreeting() {
    const storedUser = localStorage.getItem('user');
        
    if (!storedUser) return;

    const user = JSON.parse(storedUser);

    if (getAppMode() === DEMO_MODES.REAL) {
        try {
            const data = await apiCall(`/api/employees/${user.employee_code}`);
            if (data && data.Full_Name) {
                document.getElementById('user-name').textContent = data.Full_Name;
                // Update avatar initials
                document.getElementById('user-avatar').textContent = getInitials(data.Full_Name);
            }
        } catch (e) {
            document.getElementById('user-name').textContent = user.username;
        }
    } else {
        document.getElementById('user-name'),textContent = 'رامین فردوس';
    }
}

// Search - navigate to search screen with query
const searchInput = document.getElementById('search-input');
searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && this.value.trim()) {
        window.location.href = `search.html?q=${encodeURIComponent(this.value.trim())}`;
    }
});

// Camera button
document.getElementById('camera-btn').addEventListener('click', function() {
    window.location.href = 'camera.html';
});

// Voice search
const micBtnHome = document.getElementById('mic-btn');
let mediaRecorderHome = null;
let audioChunksHome = [];
let isRecordingHome = false;

async function startHomeRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        audioChunksHome = [];
        mediaRecorderHome = new MediaRecorder(stream);

        mediaRecorderHome.addEventListener('dataavailable', function(e) {
            if (e.data.size > 0) audioChunksHome.push(e.data);
        });

        mediaRecorderHome.addEventListener('stop', async function(){
            const audioBlob = new Blob(audioChunksHome, { type: 'audio/webm' });
            stream.getTracks().forEach(track => track.stop());

            micBtnHome.disabled = true;
            showToast('در حال پردازش صدا...', 'info');

            try {
                const formData = new FormData();
                formData.append('audio', audioBlob, 'recording.webm');

                const response = await fetch(`${API_BASE}/api/speech/transcribe`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('failed');

                const data = await response.json();
                
                const searchTerm = data.match_score >= 65
                    ? data.matched_name
                    : data.transcript;
                
                if (searchTerm && searchTerm.trim()) {
                    window.location.href = `search.html?q=${encodeURIComponent(searchTerm.trim())}`;
                } else {
                    showToast('صدایی شناسایی نشد', 'info')
                }

            } catch (e) {
                showToast('خطا در پردازش صدا', 'error');
            } finally {
                micBtnHome.disabled = false;
            }
        });

        mediaRecorderHome.start();
        isRecordingHome = true;
        micBtnHome.classList.add('listening');

        setTimeout(function() {
            if (isRecordingHome) {
                mediaRecorderHome.stop();
                isRecordingHome = false;
                micBtnHome.classList.remove('listening');
            }
        }, 5000);
    } catch (e) {
        if (e.name === 'NotAllowedError') {
            showToast('دسترسی به میکروفن رد شده است', 'error');
        } else {
            showToast('میکروفن در دسترس نیست', 'error');
        }
    }
}

// Loading Home stats
async function loadHomeStats() {
    const data = await apiCall('/api/stats/home');

    if (data === null) {
        // Mock mode - use hardcoded values
        renderStats(72, 28);
        document.getElementById('avg-age').textContent = '۳۴';
        document.getElementById('avg-tenure').textContent = '۳';
        return;
    }

    // Update existing stat card
    document.getElementById('active-count').textContent =
        data.total_active.toLocaleString('fa-IR');
    document.getElementById('male-percent').textContent = data.male_percent + '٪';
    document.getElementById('female-percent').textContent = data.female_percent + '٪';
    document.getElementById('male-fill').style.width = data.male_percent + '%';
    document.getElementById('female-fill').style.width = data.female_percent + '%';

    // New metrics
    document.getElementById('avg-age').textContent =
        data.avg_age.toLocaleString('fa-IR');
    document.getElementById('avg-tenure').textContent = 
        data.avg_tenure.toLocaleString('fa-IR');

    // Top departments
    const deptList = document.getElementById('dept-list');
    const maxCount = data.top_departments[0].count;

    data.top_departments.forEach(function(dept) {
        const pct = (dept.count / maxCount * 100).toFixed(1);

        const item = document.createElement('div');
        item.className = 'dept-item';
        item.innerHTML = `
            <span class="dept-name">${dept.name}</span>
            <div class="dept-bar-wrap">
                <div class="dept-bar-fill" style="width:0%" data-width="${pct}%"></div>
            </div>
            <span class="dept-count">${dept.count.toLocaleString('fa-IR')}</span>
        `;
        deptList.appendChild(item);
    });

    // Animate bars after render
    setTimeout(function() {
        document.querySelectorAll('.dept-bar-fill').forEach(function(bar) {
            bar.style.width = bar.dataset.width;
        });
    }, 100);
}

micBtnHome.addEventListener('click', function() {
    const mode = getAppMode();

    if (mode === DEMO_MODES.REAL) {
        if (isRecordingHome) {
            mediaRecorderHome.stop();
            isRecordingHome = false;
            micBtnHome.classList.remove('listening');
        } else {
            startHomeRecording();
        }
    } else {
        // Mock mode - web search API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast('جستجوی صوتی در دسترس نیست', 'error');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'fa-IR';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.addEventListener('start', function() {
            micBtnHome.classList.add('listening');
        });

        recognition.addEventListener('result', function(e) {
            const transcript = e.results[0][0].transcript;
            window.location.href = `search.html?q=${encodeURIComponent(transcript)}`;
        });

        recognition.addEventListener('end', function() {
            micBtnHome.classList.remove('listening');
        });

        recognition.addEventListener('error', function() {
            micBtnHome.classList.remove('listening');
            showToast('جستجوی صوتی در دسترس نیست', 'error');
        });

        recognition.start();
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', function() {
    if (confirm('آیا می‌خواهید از سامانه خارج شوید؟')) {
        const refreshToken = localStorage.getItem('refresh_token');
        const accessToken  = localStorage.getItem('access_token');

        // Call logout API
        fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ refresh_token: refreshToken })
        }).finally(function() {
            // Clear storage and redirect regardless of API response
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = '../index.html';
        });
    }
});

// Render on load
if (getAppMode() === 'mock') {
    renderList('people-list', mockTeam);
}

//Always show real recently viewed from localstorage
const recentProfiles = getRecentProfiles();
if (recentProfiles.length > 0) {
    renderList('recent-list', recentProfiles);
} else {
    // Hide the section if empty
    document.getElementById('recent-section').style.display = 'none';
}

loadUserGreeting();
loadHomeStats();