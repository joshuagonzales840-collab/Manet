/* K-Tix Assist — Secure Portal Auth */



let role = 'user';
let signupData = {};
let selectedIdType = "Driver's License";
let idFileName = null;
let faceCaptured = false;

function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.hidden = true);
    const el = document.getElementById('view-' + name);
    if (el) el.hidden = false;

    document.querySelectorAll('.side-item').forEach(b => {
        b.classList.toggle('on', b.dataset.view === name ||
            ((name === 'id' || name === 'face') && b.dataset.view === 'signup'));
    });

    if (name === 'login') {
        role = 'user';
        applyRole('user');
    }
}

function applyRole(r) {
    role = r;
    const lt = document.getElementById('lt');
    const ll = document.getElementById('ll');
    const demo = document.getElementById('demo');
    const ls = document.getElementById('ls');
    if (lt) lt.textContent = cfg[r][0];
    if (ll) ll.innerHTML = cfg[r][1] + ' <span class="req">*</span>';
    if (demo) demo.textContent = cfg[r][2];
    if (ls) ls.textContent = r === 'user' ? 'Sign in to your K-Tix Assist account' : 'Sign in to continue';
    const terms = document.getElementById('terms-wrap');
    if (terms) terms.style.display = r === 'user' ? '' : 'none';
    const su = document.getElementById('su');
    if (su) {
        su.style.display = r === 'user' ? '' : 'none';
        const sep = su.parentElement && su.parentElement.querySelector('.sep');
        if (sep) sep.style.display = r === 'user' ? '' : 'none';
    }
    const er = document.getElementById('er');
    if (er) er.textContent = '';
}

document.querySelectorAll('.side-item, [data-view]').forEach(el => {
    el.addEventListener('click', e => {
        e.preventDefault();
        const v = el.dataset.view;
        if (v) showView(v);
    });
});

document.getElementById('eye') && document.getElementById('eye').addEventListener('click', () => {
    const p = document.getElementById('pw');
    p.type = p.type === 'password' ? 'text' : 'password';
    document.getElementById('eye').textContent = p.type === 'password' ? '👁' : '🙈';
});
document.getElementById('s-eye') && document.getElementById('s-eye').addEventListener('click', () => {
    const p = document.getElementById('s-pw');
    p.type = p.type === 'password' ? 'text' : 'password';
    document.getElementById('s-eye').textContent = p.type === 'password' ? '👁' : '🙈';
});

document.getElementById('lf') && document.getElementById('lf').addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('id').value.trim().toLowerCase();
    const pw = document.getElementById('pw').value;
    if (!id || !pw) return document.getElementById('er').textContent = 'Please fill in all fields.';
    if (role === 'user' && document.getElementById('terms') && !document.getElementById('terms').checked) {
        return document.getElementById('er').textContent = 'Please accept the Terms of Service & Privacy Policy.';
    }
    if (document.getElementById('rm').checked) localStorage.rem = JSON.stringify({ role, id });
    else localStorage.removeItem('rem');

    const u = DB.users.find(u => (u.username === id || u.email === id) && u.pw === pw);
    if (!u) return document.getElementById('er').textContent = 'Invalid credentials.';
    if (!u.active) return document.getElementById('er').textContent = 'Account deactivated.';
    setS({ role, username: u.username, name: u.name });
    location.href = !u.idOk ? 'id-verification.html' : !u.faceOk ? 'face-verification.html' : !u.policy ? 'privacy-policy.html' : 'user-dashboard.html';
});

document.getElementById('ff') && document.getElementById('ff').addEventListener('submit', e => {
    e.preventDefault();
    if (!document.getElementById('fe').value.trim()) return document.getElementById('fer').textContent = 'Enter your email or username.';
    document.getElementById('ff').innerHTML = '<p style="color:#16a34a;font-weight:600;text-align:center">Password reset instructions have been sent.</p><p class="footer-links"><a href="#" data-view="login">Back to Login</a></p>';
    const link = document.querySelector('#ff [data-view]');
    if (link) link.addEventListener('click', ev => { ev.preventDefault(); showView('login'); });
});

document.getElementById('sf1') && document.getElementById('sf1').addEventListener('submit', e => {
    e.preventDefault();
    const fn = document.getElementById('s-fn').value.trim();
    const em = document.getElementById('s-em').value.trim().toLowerCase();
    const pw = document.getElementById('s-pw').value;
    const pw2 = document.getElementById('s-pw2').value;
    const er = m => document.getElementById('s-er').textContent = m;
    if (!fn || !em || !pw || !pw2) return er('Please fill in all fields.');
    if (!/^\S+@\S+\.\S+$/.test(em)) return er('Enter a valid email.');
    if (pw.length < 8) return er('Password must be at least 8 characters.');
    if (pw !== pw2) return er('Passwords do not match.');
    if (!document.getElementById('s-terms').checked) return er('You must accept the Terms of Service & Privacy Policy.');
    if (DB.users.some(u => u.email === em || u.username === em.split('@')[0])) return er('Email or username already exists.');
    signupData = { name: fn, email: em, pw, username: em.split('@')[0] };
    document.getElementById('s-er').textContent = '';
    showView('id');
});

document.querySelectorAll('.id-type').forEach(b => {
    b.addEventListener('click', () => {
        document.querySelectorAll('.id-type').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        selectedIdType = b.dataset.type;
    });
});

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('id-file');

function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) { toast('Please choose a JPG or PNG image.'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('File must be under 5 MB.'); return; }
    idFileName = file.name;
    const fn = document.getElementById('file-name');
    fn.textContent = '✓ ' + file.name;
    fn.hidden = false;
    document.getElementById('id-banner').hidden = false;
    document.getElementById('id-result').hidden = false;
    document.getElementById('id-name').textContent = signupData.name || '—';
    document.getElementById('id-num').textContent = 'ID-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    document.getElementById('id-type-label').textContent = selectedIdType;
    document.getElementById('id-continue').disabled = false;
    document.getElementById('id-er').textContent = '';
}

if (dropZone) {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
    dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('drag'); handleFile(e.dataTransfer.files[0]); });
}
if (fileInput) fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));
document.getElementById('btn-drop') && document.getElementById('btn-drop').addEventListener('click', () => fileInput.click());
document.getElementById('btn-cam') && document.getElementById('btn-cam').addEventListener('click', () => toast('Camera capture is simulated — please upload a file instead.'));

document.getElementById('id-continue') && document.getElementById('id-continue').addEventListener('click', () => {
    if (!idFileName) return document.getElementById('id-er').textContent = 'Please upload an ID first.';
    showView('face');
    startCamera();
});

let stream = null;
async function startCamera() {
    const video = document.getElementById('face-video');
    const placeholder = document.getElementById('face-placeholder');
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        video.srcObject = stream;
        video.hidden = false;
        if (placeholder) placeholder.hidden = true;
    } catch (err) {
        if (placeholder) placeholder.innerHTML = '📷<br>Camera unavailable<br><small>(demo mode)</small>';
    }
}
function stopCamera() {
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
}

document.getElementById('btn-capture') && document.getElementById('btn-capture').addEventListener('click', () => {
    const oval = document.getElementById('face-oval');
    const pg = document.getElementById('face-pg');
    const status = document.getElementById('face-status');
    oval.classList.add('scanning');
    status.textContent = 'Verifying face…';
    document.getElementById('btn-capture').disabled = true;
    let p = 0;
    const t = setInterval(() => {
        p += 5;
        pg.style.width = p + '%';
        if (p >= 100) {
            clearInterval(t);
            oval.classList.remove('scanning');
            status.innerHTML = '<b style="color:#16a34a">✓ Face Verification Successful</b>';
            faceCaptured = true;
            document.getElementById('btn-create').disabled = false;
            document.getElementById('btn-capture').disabled = false;
            stopCamera();
        }
    }, 80);
});

document.getElementById('btn-create') && document.getElementById('btn-create').addEventListener('click', () => {
    if (!faceCaptured) return toast('Please capture your face first.');
    const uname = signupData.username || signupData.email.split('@')[0];
    DB.users.push({
        id: 'U-00' + (DB.users.length + 1),
        username: uname,
        name: signupData.name,
        email: signupData.email,
        pw: signupData.pw,
        active: 1, idOk: 1, faceOk: 1, policy: 1,
        date: now().slice(0, 10)
    });
    save();
    log('User', 'Registered', 'Authentication', uname);
    setS({ role: 'user', username: uname, name: signupData.name });
    toast('Account created successfully!');
    setTimeout(() => location.href = 'user-dashboard.html', 800);
});

const saved = JSON.parse(localStorage.rem || 'null');
if (saved) {
    role = saved.role === 'user' ? 'user' : 'user';
    if (document.getElementById('id')) document.getElementById('id').value = saved.id || '';
    if (document.getElementById('rm')) document.getElementById('rm').checked = true;
}
applyRole(role);
showView('login');

if (sessionStorage.msg) {
    toast(sessionStorage.msg);
    sessionStorage.removeItem('msg');
}