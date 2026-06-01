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

    const badgeHTML = person.badge === 'team'
        ? `<span class="person-badge badge-team">تیم</span>`
        : `<span class="person-badge badge-locked>🔒</span>`;
    
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
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const micBtn = document.getElementById('mic-btn');

if (!SpeechRecognition) {
    micBtn.style.display = 'none';
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'fa-IR';
    recognition.continuous = false;
    recognition.interimResults = false;

    // Add this - required for Safari PWA
    recognition.maxAlternatives = 1;

    let isListening = false;

    micBtn.addEventListener('click', function() {
        if (isListening) {
            recognition.stop();
            return;
        }
        recognition.start();
    });

    recognition.addEventListener('start', function() {
        isListening = true;
        micBtn.classList.add('listening');
    });

    recognition.addEventListener('result', function(e) {
        const transcript = e.results[0][0].transcript;
        // Navigate to search screen with the voice query
        window.location.href = 'search.html?q=' + encodeURIComponent(transcript);
    });

    recognition.addEventListener('end', function() {
        isListening = false;
        micBtn.classList.remove('listening');
    });

    recognition.addEventListener('error', function(e) {
        isListening = false;
        micBtn.classList.remove('listening');

        if (e.error === 'not-allowed') {
            showToast('دسترسی به میکروفن رد شده است', 'error');
        } else if (e.error === 'network' || e.error === 'service-not-allowed') {
            showToast('سرویس جستجوی صوتی در دسترس نیست', 'error');
        } else if (e.error === 'no-speech') {
            showToast('صدایی شنیده نشد، دوباره امتحان کنید', 'info');
        } else {
            showToast('جستجوی صوتی در دسترس نیست', 'error');
        }
    });
}

// Logout
document.getElementById('logout-btn').addEventListener('click', function() {
    // TODO: call logout API when backend is ready
    // for now just redirect to login
    if (confirm('آیا می‌خواهید از سامانه خارج شوید؟')) {
        window.location.href = '../index.html';
    }
});

// Render on load
renderList('people-list', mockTeam);
renderList('recent-list', mockRecent);
renderStats(72, 28);