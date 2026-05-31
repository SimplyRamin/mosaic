const employeeIdInput = document.getElementById('employee-id');
const submitBtn       = document.getElementById('submit-btn');
const errorMessage    = document.getElementById('error-message');
const successState    = document.getElementById('success-state');
const forgotContent   = document.querySelector('.forgot-content');
const backBtn         = document.getElementById('back-btn');
const backToLoginBtn  = document.getElementById('back-to-login-btn');

submitBtn.addEventListener('click', function() {
    const employeeId = employeeIdInput.value.trim();
    errorMessage.textContent = '';

    if (!employeeId) {
        errorMessage.textContent = 'کد پرسنلی را وارد کنید';
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'در حال ثبت...';

    // TODO: replace with real API call
    setTimeout(function() {
        // Hide form elements, show success
        employeeIdInput.closest('.field-group').classList.add('hidden');
        submitBtn.classList.add('hidden');
        successState.classList.remove('hidden');
    }, 1000);
});

backBtn.addEventListener('click', function() {
    window.location.href = '../index.html';
});

backToLoginBtn.addEventListener('click', function() {
    window.location.href = '../index.html';
});

