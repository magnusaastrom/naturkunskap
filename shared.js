// ═══════════════════════════════════════════
//  SHARED UTILITIES  –  naturkunskap-site
// ═══════════════════════════════════════════

const CLASSES = {
  'NK1a1': { label: 'Naturkunskap 1a1', color: '#e07a40', page: 'nk1a1.html' },
  'NK1a2': { label: 'Naturkunskap 1a2', color: '#4a9fd4', page: 'nk1a2.html' },
  'NK1b':  { label: 'Naturkunskap 1b',  color: '#9b6dd6', page: 'nk1b.html'  },
  'NK2':   { label: 'Naturkunskap 2',   color: '#3ecfb2', page: 'nk2.html'   }
};

// Passwords per class (change these!)
const CLASS_PASSWORDS = {
  'NK1a1': 'nk1a1',
  'NK1a2': 'nk1a2',
  'NK1b':  'nk1b',
  'NK2':   'nk2'
};

const TEACHER_PASSWORD = 'larare2026'; // Change this!

// ── SESSION ──────────────────────────────────
function getSession() {
  try { return JSON.parse(sessionStorage.getItem('nk_session') || 'null'); } catch { return null; }
}
function setSession(data) {
  sessionStorage.setItem('nk_session', JSON.stringify(data));
}
function clearSession() {
  sessionStorage.removeItem('nk_session');
}
function logoutAndChoose() {
  sessionStorage.removeItem('nk_session');
  window.location.href = 'index.html';
}
function requireLogin(allowedClass) {
  const s = getSession();
  if (!s) { window.location.href = 'index.html'; return null; }
  if (allowedClass && s.klass !== allowedClass && s.role !== 'teacher') {
    window.location.href = 'index.html'; return null;
  }
  return s;
}

// ── PROGRESS STORAGE ─────────────────────────
function getProgress(userId) {
  try { return JSON.parse(localStorage.getItem('nk_progress_' + userId) || '{}'); } catch { return {}; }
}
function saveProgress(userId, data) {
  localStorage.setItem('nk_progress_' + userId, JSON.stringify(data));
}
function recordSession(userId, setId, total, correct) {
  const p = getProgress(userId);
  if (!p[setId]) p[setId] = { sessions: [] };
  p[setId].sessions.push({
    date: new Date().toISOString(),
    total, correct,
    pct: Math.round((correct / total) * 100)
  });
  saveProgress(userId, p);
}

// ── ALL USERS (for teacher view) ─────────────
function getAllUserIds() {
  const ids = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('nk_progress_')) ids.push(k.replace('nk_progress_', ''));
  }
  return ids;
}

// ── PUNNETT ÖVNINGAR ────────────────────────
// Körs bara på sidor som innehåller .punnett


function getCurrentExercise() {
  return Array.from(document.querySelectorAll('.punnett'))
    .find(el => el.offsetParent !== null);
}

function parseNumberFromAnswer(value) {
  if (!value) return null;

  // plocka ut första talet (accepterar "2", "2 av 4", "50 %", "50%")
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function checkPunnett() {
  const current = getCurrentExercise();
  if (!current) return;

  const inputs = current.querySelectorAll('input[data-answer]');
  let correct = 0;

  inputs.forEach(input => {
    input.classList.remove('correct', 'wrong');

    
const userValue = (input.value || '').trim();
const expected  = input.dataset.answer;

if (userValue === expected) {

      input.classList.add('correct');
      correct++;
    } else {
      input.classList.add('wrong');
    }
  });
// ✅ Kontroll av sannolikhetsfrågor (om de finns)
let probCorrect = true;
const probInputs = current.querySelectorAll('input[data-prob]');

probInputs.forEach(input => {
  input.classList.remove('correct', 'wrong');

  const expected = Number(input.dataset.prob);
  const given = parseNumberFromAnswer(input.value);

  if (given === expected) {
    input.classList.add('correct');
  } else {
    input.classList.add('wrong');
    probCorrect = false;
  }
});

  const feedback = current.querySelector('.feedback');
  const nextBtn = current.querySelector('.next-btn');

  if (feedback) {
    if (correct === inputs.length && probCorrect) {
      feedback.textContent = '✅ Alla rutor är rätt!';
      if (nextBtn) nextBtn.disabled = false;
    } else {
      feedback.textContent =
        '❌ Några rutor är fel. Titta på vilka alleler som kombineras.';
      if (nextBtn) nextBtn.disabled = true;
   
    }
  }
}

function resetPunnett() {
  const current = getCurrentExercise();
  if (!current) return;

  const inputs = current.querySelectorAll('input[data-answer]');
  inputs.forEach(input => {
    input.value = '';
    input.classList.remove('correct', 'wrong');
  });

  const feedback = current.querySelector('.feedback');
  if (feedback) feedback.textContent = '';

  const nextBtn = current.querySelector('.next-btn');
  if (nextBtn) nextBtn.disabled = true;
}

function nextPunnett() {
  const current = getCurrentExercise();
  if (!current) return;

  const next = current.nextElementSibling;

  if (next && next.classList.contains('punnett')) {
    current.style.display = 'none';
    next.style.display = 'block';

    next.scrollIntoView({ behavior: 'smooth' });

    const nextBtn = next.querySelector('.next-btn');
    if (nextBtn) nextBtn.disabled = true;
  }
}

