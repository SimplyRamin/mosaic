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

// Chip filter logic
const chips = document.querySelectorAll('.chip');
chips.forEach(function(chip) {
    chip.addEventListener('click', function() {
        chips.forEach(function(c) { c.classList.remove('active'); });
        this.classList.add('active');
        // TODO: filter logic when real data is connected
    });
});

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
    // TODO: call logout API when backend is ready
    // for now just redirect to login
    if (confirm('آیا می‌خواهید از سامانه خارج شوید؟')) {
        window.location.href = '../index.html';
    }
});

// Render on load
if (getAppMode() === 'mock') {
    renderList('people-list', mockTeam);
    renderList('recent-list', mockRecent);
}
renderStats(72, 28);