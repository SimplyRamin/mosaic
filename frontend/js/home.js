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

// Render on load
renderList('people-list', mockTeam);
renderList('recent-list', mockRecent);