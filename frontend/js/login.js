const employeeIdInput = document.getElementById('employee-id');
const passwordInput   = document.getElementById('password');
const toggleBtn       = document.getElementById('toggle-password');
const toggleIcon      = document.getElementById('toggle-icon');
const loginBtn        = document.getElementById('login-btn');
const errorMessage    = document.getElementById('error-message');
const demoLogin       = document.getElementById('demo-login');
const mockDemoBtn     = document.getElementById('demo-mock-btn');
const realDemoBtn     = document.getElementById('demo-real-btn');

// Toggle password visibility
toggleBtn.addEventListener('click', function() {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.querySelector('use').setAttribute('href', 'assets/icons/icons.svg#icon-eye-off');
    } else {
        passwordInput.type = 'password';
        toggleIcon.querySelector('use').setAttribute('href', 'assets/icons/icons.svg#icon-eye');
    }
});

// Login button click
loginBtn.addEventListener('click', function() {
    const employeeId = employeeIdInput.value.trim();
    const password   = passwordInput.value;

    // Clear previous error
    errorMessage.textContent = '';

    // Basic validation
    if (!employeeId) {
        errorMessage.textContent = 'کد پرسنلی خود را وارد کنید';
        return;
    }

    if (!password) {
        errorMessage.textContent = 'رمز عبور خود را وارد کنید';
        return;
    }

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.textContent = 'در حال ورود...';

    // TODO: replace with the real API call when backend is ready
    setTimeout(function() {
        loginBtn.disabled = false;
        loginBtn.textContent = 'ورود به سامانه';
        errorMessage.textContent = 'کد پرسنلی یا رمز عبور اشتباه است'
    }, 1500);
})

// Show demo button only in demo mode
// app.js loads before login.js so DEMO_MODE is available
if (typeof DEMO_MODE !== 'undefined' && DEMO_MODE){
    demoLogin.classList.remove('hidden');
}

// Mock data demo
mockDemoBtn.addEventListener('click', function() {
    setAppMode(DEMO_MODES.MOCK);
    employeeIdInput.value = 'admin';
    passwordInput.value   = 'admin';
    setTimeout(function() {
        window.location.href = 'screens/home.html';
    }, 600);
});

// Real data demo
realDemoBtn.addEventListener('click', function() {
    setAppMode(DEMO_MODES.REAL);
    employeeIdInput.value = 'admin';
    passwordInput.value   = 'admin';
    setTimeout(function() {
        window.location.href = 'screens/home.html';
    }, 600);
});