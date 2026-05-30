const searchInput   = document.getElementById('search-input');
const clearBtn      = document.getElementById('clear-btn');
const resultsList   = document.getElementById('results-list');
const resultsMeta   = document.getElementById('results-meta');
const resultsCount  = document.getElementById('results-count');
const emptyState    = document.getElementById('empty-state');
const noResults     = document.getElementById('no-results');
const cameraBtn     = document.getElementById('camera-btn');
const cameraSuggest = document.getElementById('camera-suggest-btn');

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

function performSearch(query) {
    query = query.trim();

    if (!query) {
        showState('empty');
        return;
    }

    const results = mockPeople.filter(function(person) {
        return person.name.includes(query)   ||
               person.role.includes(query)   ||
               person.department.includes(query)    ||
               person.id.includes(query);
    });

    resultsList.innerHTML = '';

    if (results.length === 0) {
        showState('no-results');
    }

    results.forEach(function(person) {
        resultsList.appendChild(createResultCard(person));
    });

    resultsCount.textContent = results.length + 'نتیجه برای «' + query + '»';
    showState('results');
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