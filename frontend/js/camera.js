const video         = document.getElementById('camera-feed');
const canvas        = document.getElementById('capture-canvas');
const imagePreview  = document.getElementById('image-preview');
const captureBtn    = document.getElementById('capture-btn');
const flipBtn       = document.getElementById('flip-btn');
const galleryBtn    = document.getElementById('gallery-btn');
const galleryInput  = document.getElementById('gallery-input');
const backBtn       = document.getElementById('back-btn');
const scanLine      = document.getElementById('scan-line');
const scanFrame     = document.getElementById('scan-frame');
const resultCard    = document.getElementById('result-card');
const resultAvatar  = document.getElementById('result-avatar');
const resultName    = document.getElementById('result-name');
const resultRole    = document.getElementById('result-role');
const resultBtn     = document.getElementById('result-btn');
const unavailable   = document.getElementById('camera-unavailable');
const hintText      = document.getElementById('camera-hint');
const flashBtn      = document.getElementById('flash-btn');

let currentStream   = null;
let facingMode      = 'environment'; // back camera by default
let capturedImageData = null;

if (!requireAuth()) throw new Error('Not authenticated');

/* ------------------------------ Camera Setup ------------------------------ */

async function startCamera() {
    // Check if browser supports camera
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showUnavailable('دوربین در این مرورگر پشتیبانی نمی‌شود');
        return;
    }

    // Check if on HTTPS - camera requires secure context
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        showUnavailable('برای استفاده از دوربین، اتصال امن (HTTPS) نیاز است');
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {facingMode: facingMode},
            audio: false
        });

        currentStream = stream;
        video.srcObject = stream;
        video.classList.remove('hidden');
        unavailable.classList.add('hidden');
        scanFrame.style.opacity = '1';

    } catch (e) {
        if (e.name === 'NotAllowedError') {
            showUnavailable('دسترسی به دوربین رد شد\nتنظیمات مرورگر را بررسی کنید')
        } else if (e.name === 'NotFoundError') {
            showUnavailable('دوربینی یافت نشد');
        } else {
            showUnavailable('دوربینی در دسترس نیست');
        }
    }
}

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(function(track) {
            track.stop();
        });
        currentStream = null;
    }
}

function showUnavailable(message) {
    video.classList.add('hidden');
    unavailable.classList.remove('hidden');
    document.getElementById('unavailable-message').textContent = message;
    scanFrame.style.opacity = '0.2';
    captureBtn.disabled = true;
    captureBtn.style.opacity = '0.4';
}

/* --------------------------------- Capture -------------------------------- */
function captureImage() {
    if (!currentStream && !imagePreview.src) return;

    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    capturedImageData = canvas.toDataURL('image/jpeg', 0.8);
    sendForIdentification(capturedImageData);
}

/* ----------------------------- Identification ----------------------------- */
function sendForIdentification(imageData) {
    // show scanning animation
    scanLine.classList.add('active');
    hintText.textContent = 'در حال شناسایی...';
    captureBtn.disabled = true;

    // TODO: repalce with real API call when face recognition backend is ready
    // fetch('/api/face/identify', {
    //      method: 'POST',
    //      headers: { 'Content-Type': 'application/json' },
    //      body: JSON.stringify({ image: imageData })
    // })

    // Mock response - simulates backend delay
    setTimeout(function() {
        scanLine.classList.remove('active');
        captureBtn.disabled = false;
        hintText.textContent = 'دوربین را به سمت چهره فرد بگیرید';

        // Mock: randomly success or fail for demo purposes
        const mockSuccess = Math.random() > 0.3;

        if (mockSuccess) {
            showResult({
                id: '100000',
                name: 'علی صادقی',
                role: 'مهندس ارشد بک‌اند',
                initials: 'ع‌ص',
                avatarColor: '#1e3a8a'
            });
        } else {
            showNotFound();
        }
    }, 2000)
}

function showResult(person) {
    resultAvatar.textContent = person.initials;
    resultAvatar.style.background = person.avatarColor + '20';
    resultAvatar.style.color = person.avatarColor;
    resultAvatar.style.border = '1.5px solid ' + person.avatarColor + '40';

    resultName.textContent = person.name;
    resultRole.textContent = person.role;

    resultBtn.onclick = function() {
        stopCamera();
        window.location.href = 'profile.html?id=' + person.id;
    };

    resultCard.classList.remove('hidden');
}

function showNotFound() {
    showToast('چهره‌ای شناسایی نشد، دوباره تلاش کنید', 'info');
}

/* -------------------------------- Controls -------------------------------- */
captureBtn.addEventListener('click', captureImage);

flipBtn.addEventListener('click', async function() {
    stopCamera();
    facingMode = facingMode === 'environment' ? 'user' : 'environment';
    resultCard.classList.add('hidden');
    await startCamera();
});

flashBtn.style.opacity = '0.3';
flashBtn.style.cursor = 'not-allowed';
flashBtn.setAttribute('title', 'فلش در مرورگر پشتیبانی نمی‌شود');
flashBtn.addEventListener('click', function() {
    showToast('کنترل فلش در مرورگر پشتیبانی نمی‌شود', 'info');
});

galleryBtn.addEventListener('click', function() {
    galleryInput.click();
});

galleryInput.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        stopCamera();
        video.classList.add('hidden');
        imagePreview.src = e.target.result;
        imagePreview.classList.remove('hidden');
        sendForIdentification(e.target.result);
    };
    reader.readAsDataURL(file);
});

backBtn.addEventListener('click', function() {
    stopCamera();
    window.history.back();
});

// Dismiss result card when tapping viewfinder
document.getElementById('viewfinder').addEventListener('click', function() {
    if (!resultCard.classList.contains('hidden')) {
        resultCard.classList.add('hidden');
    }
});

/* ---------------------------------- Init ---------------------------------- */
startCamera();
