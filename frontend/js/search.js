const searchInput   = document.getElementById('search-input');
const clearBtn      = document.getElementById('clear-btn');
const resultsList   = document.getElementById('results-list');
const resultsMeta   = document.getElementById('results-meta');
const resultsCount  = document.getElementById('results-count');
const emptyState    = document.getElementById('empty-state');
const noResults     = document.getElementById('no-results');
const cameraBtn     = document.getElementById('camera-btn');
const cameraSuggest = document.getElementById('camera-suggest-btn');
const micBtn        = document.getElementById('mic-btn');
const spinner       = document.getElementById('search-spinner');

// Mock data - replace with API call when backend is ready
const mockPeople = [
    {
        id: '100000',
        name: 'علی صادقی',
        role: 'مهندس ارشد بک‌اند',
        department: 'مهندسی',
        initials: 'ع‌ص',
        avatarColor: '#1e3a8a'
    },
    {
        id: '100001',
        name: 'مریم رحیمی',
        role: 'تحلیلگر داده · هوش تجاری',
        department: 'مهندسی',
        initials: 'م‌ر',
        avatarColor: '#16a34a'
    },
    {
        id: '100002',
        name: 'کامران نظاری',
        role: 'مهندس یادگیری ماشین',
        department: 'مهندسی',
        initials: 'ک‌ن',
        avatarColor: '#b8960c'
    },
    {
        id: '100003',
        name: 'زهرا حسینی',
        role: 'متخصص منابع انسانی · ستاد',
        department: 'منابع انسانی',
        initials: 'ز‌ح',
        avatarColor: '#64748b'
    },
    {
        id: '100004',
        name: 'احمد کریمی',
        role: 'مهندس ارشد DevOps · زیرساخت',
        department: 'مهندسی',
        initials: 'ا‌ک',
        avatarColor: '#1e3a8a'
    }
];

function createResultCard(person) {
    const card = document.createElement('div');
    card.className = 'person-card';

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
        <span class="person-badge badge-dept">${person.department}</span>
    `;

    card.addEventListener('click', function() {
        window.location.href = `profile.html?id=${person.id}`;
    });

    return card;
}

function showState(state) {
    emptyState.classList.add('hidden');
    resultsList.classList.add('hidden');
    resultsMeta.classList.add('hidden');
    noResults.classList.add('hidden');

    if (state === 'empty') {
        emptyState.classList.remove('hidden');
    }
    if (state === 'results') {
        resultsList.classList.remove('hidden');
        resultsMeta.classList.remove('hidden');
    }
    if (state === 'no-results'){
        noResults.classList.remove('hidden');
    }
}

async function performSearch(query) {
    query = toEnglishNumbers(query.trim());

    if (!query) {
        showState('empty');
        return;
    }

    // Show spinner
    if (spinner) spinner.classList.remove('hidden');

    try {
        const data = await apiCall(`/api/employees/search?q=${encodeURIComponent(query)}`);

        if (data === null) {
            // Mock mode - use local filter
            const results = mockPeople.filter(function(person) {
                return person.name.includes(query)       ||
                       person.role.includes(query)       ||
                       person.department.includes(query) ||
                       person.id.includes(query);
            });

            resultsList.innerHTML = '';
            if (results.length === 0) {
                showState('no-results');
                return;
            }
            results.forEach(function(person) {
                resultsList.appendChild(createResultCard(person));
            });
            resultsCount.textContent = results.length + ' نتیجه برای «' + query + '»';
            showState('results');
        } else {
            // Real mode - use API results
            resultsList.innerHTML = '';
            if (data.results.length === 0) {
                showState('no-results');
                return;
            }
            data.results.forEach(function(person) {
                resultsList.appendChild(createResultCard({
                    id:          person.Employee_Code,
                    name:        person.Full_Name,
                    role:        person.Post,
                    department:  person.ORG,
                    initials:    getInitials(person.Full_Name),
                    avatarColor: getAvatarColor(person.Employee_Code)
                }));
            });
            resultsCount.textContent = data.count + ' نتیجه برای «' + query + '»';
            showState('results');
        }
    } catch(e) {
        showToast('خطا در دریافت نتایج', 'error');
        showState('empty');
    } finally {
        if (spinner) spinner.classList.add('hidden');
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

// Input handler
searchInput.addEventListener('input', function() {
    const hasValue = this.value.length > 0;
    clearBtn.classList.toggle('visible', hasValue);
    performSearch(this.value);
});

// Clear button
clearBtn.addEventListener('click', function() {
    searchInput.value = '';
    clearBtn.classList.remove('visible');
    searchInput.focus();
    showState('empty');
});

// Camera buttons
cameraBtn.addEventListener('click', function() {
    window.location.href = 'camera.html';
});

cameraSuggest.addEventListener('click', function() {
    window.location.href = 'camera.html';
});

// Voice search
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

async function startWhisperRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.addEventListener('dataavailable', function(e) {
            if (e.data.size > 0) {
                audioChunks.push(e.data);
            }
        });

        mediaRecorder.addEventListener('stop', async function() {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            stream.getTracks().forEach(track => track.stop());
            await sendAudioToWhisper(audioBlob);
        });

        mediaRecorder.start();
        isRecording = true;
        micBtn.classList.add('listening');

        // Auto stop after 5 seconds
        setTimeout(function() {
            if (isRecording) stopWhisperRecording();
        }, 5000);

    } catch (e) {
        if (e.name === 'NotAllowedError') {
            showToast('دسترسی به میکروفن رد شده است', 'error');
        } else {
            showToast('میکروفن در دسترس نیست', 'error');
        }
    } 
}

function stopWhisperRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        micBtn.classList.remove('listening');
    }
}

async function sendAudioToWhisper(audioBlob) {
    micBtn.disabled = true;
    showToast('در حال پردازش صدا...', 'info');

    try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        const response = await fetch(`${API_BASE}/api/speech/transcribe`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('transcription failed');

        const data = await response.json()

        // Use matched name if confidence is good, otherwise use raw transcript
        const searchTerm = data.match_score >= 65
            ? data.matched_name
            : data.transcript;
        
        if (searchTerm && searchTerm.trim()) {
            searchInput.value = searchTerm.trim();
            clearBtn.classList.add('visible');
            performSearch(searchTerm.trim());
        } else {
            showToast('صدایی شناسایی نشد', 'info');
        }

    } catch (e) {
        showToast('خطا در پردازش صدا', 'error');
    } finally {
        micBtn.disabled = false;
    }
}

// Mic button - toggle recording
micBtn.addEventListener('click', function() {
    const mode = getAppMode();

    if (mode === DEMO_MODES.REAL) {
        // Real mode - use whisper
        if (isRecording) {
            stopWhisperRecording();
        } else {
            startWhisperRecording();
        }
    } else {
        // Mock mode - use Web Speech API if available
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
            micBtn.classList.add('listening');
        });

        recognition.addEventListener('result', function(e) {
            const transcript = e.results[0][0].transcript;
            searchInput.value = transcript;
            clearBtn.classList.add('visible');
            performSearch(transcript);
        });

        recognition.addEventListener('end', function() {
            micBtn.classList.remove('listening');
        });

        recognition.addEventListener('error', function(e) {
            micBtn.classList.remove('listening');
            if (e.error === 'not-allowed') {
                showToast('دسترسی به میکروفن رد شده است', 'error');
            } else {
                showToast('جستجوی صوتی در دسترس نیست', 'error');
            }
        });

        recognition.start();
    }
});

// Read query from URL - comes from home screen search
const params = new URLSearchParams(window.location.search);
const initialQuery = params.get('q');
if (initialQuery) {
    searchInput.value = initialQuery;
    clearBtn.classList.add('visible');
    performSearch(initialQuery);
} else {
    showState('empty');
}

searchInput.focus();