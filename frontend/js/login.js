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

    fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Device-Name': navigator.userAgent.includes('iPhone') ? 'iPhone' : 'Desktop',
            'X-Device-OS': navigator.platform || 'Unknown'
        },
        body: JSON.stringify({
            employee_code: toEnglishNumbers(employeeId),
            password: password
        })
    })
    .then(function(response) {
        return response.json().then(function(data) {
            return { status: response.status, data: data };
        });
    })
    .then(function(result) {
        loginBtn.disabled = false;
        loginBtn.textContent = 'ورود به سامانه';

        if (result.status === 200) {
            // Store tokens
            localStorage.setItem('access_token', result.data.access_token);
            localStorage.setItem('refresh_token', result.data.refresh_token);
            localStorage.setItem('user', JSON.stringify(result.data.user));

            // Navigate to home
            window.location.href = 'screens/home.html';
        } else {
            errorMessage.textContent = result.data.detail || 'خطا در ورود به سامانه';
        }
    })
    .catch(function() {
        loginBtn.disabled = false;
        loginBtn.textContent = 'ورود به سامانه';
        errorMessage.textContent = 'خطا در اتصال به سرور';
    });
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
    employeeIdInput.value = '210197';
    passwordInput.value   = 'demo1234';
    setTimeout(function() {
        loginBtn.click();
    }, 600);
});