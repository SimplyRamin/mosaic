const DEMO_MODE = true;

function renderBottomNav() {
    const currentPage = window.location.pathname.split('/').pop();

    // Pges that should not show bottom navigation
    const noNavPages = ['camera.html'];
    if (noNavPages.includes(currentPage)) return;

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

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(reg) {
                console.log('Service worker registered');
            })
            .catch(function(err) {
                console.log('Service worker failed:', err);
            });
    });
}