const DEMO_MODE = true;
const API_BASE  = window.location.hostname === 'localhost'
    ? 'https://localhost:8001'
    : `https://${window.location.hostname}:8001`

//Mode: 'mock' = mock data, 'real' = real backend
const DEMO_MODES = {
    MOCK: 'mock',
    REAL: 'real'
};

function getAppMode() {
    return localStorage.getItem('app_mode') || DEMO_MODES.MOCK;
}

function setAppMode(mode) {
    localStorage.setItem('app_mode', mode);
}

function renderBottomNav() {
    const currentPage = window.location.pathname.split('/').pop();

    // Pges that should not show bottom navigation
    const noNavPages = ['camera.html'];
    if (noNavPages.includes(currentPage)) return;

    const screen = document.querySelector('.screen');
    if (!screen) return;

    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';

    const items = [
        { icon: 'icon-home',    label: 'خانه',    href: 'home.html' },
        { icon: 'icon-search',  label: 'جستجو',   href: 'search.html' },
        { icon: 'icon-user',    label: 'پروفایل', href: 'profile.html' }
    ];

    items.forEach(function(item) {
        const isActive = currentPage === item.href;
        const a = document.createElement('a');
        a.href = item.href;
        a.className = 'nav-item' + (isActive ? ' active' : '');
        a.innerHTML = `
            <svg class="icon nav-icon">
                <use href="#${item.icon}"></use>
            </svg>
            <span class="nav-label">${item.label}</span>
        `;
        nav.appendChild(a);
    });

    document.querySelector('.screen').appendChild(nav);
}

function showToast(message, type) {
    const existing = document.getElementById('toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast toast--' + (type || 'info');
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(function() {
        toast.classList.add('toast--visible');
    }, 10);

    setTimeout(function() {
        toast.classList.remove('toast--visible');
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

renderBottomNav();

// Service worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js');
    });
}

// Update detection via version file
function checkForUpdates() {
    fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            const stored = localStorage.getItem('app_version');
            if (stored && stored !== data.version) {
                showUpdateToast(data.version);
            } else {
                localStorage.setItem('app_version', data.version);
            }
        })
        .catch(function() {});
}

function showUpdateToast(newVersion) {
    const existing = document.getElementById('update-toast');
    if (existing) return;

    const toast = document.createElement('div');
    toast.id = 'update-toast';
    toast.className = 'update-toast';
    toast.innerHTML = `
        <span>نسخه جدید موجود است</span>
        <button id="update-btn">بروزرسانی</button>
    `;
    document.body.appendChild(toast);

    document.getElementById('update-btn').addEventListener('click', function() {
        localStorage.setItem('app_version', newVersion);
        toast.remove();

        // Clear all caches then reload fresh
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.map(function(key) {
                    return caches.delete(key);
                })
            );
        }).then(function() {
            window.location.reload(true);
        });
    });
}

async function apiCall(endpoint) {
    const mode = getAppMode();

    if (mode === DEMO_MODES.MOCK) {
        return null; // caller handles mock data
    }

    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    return response.json();
}



checkForUpdates();