// =============================================
//   STORY WEBSITE — script.js
// =============================================

const TOTAL_CHAPTERS = 5;
const STORAGE_KEY = 'story_read_chapters';
const LAST_READ_KEY = 'story_last_read';
const WORDS_PER_CHAPTER_KEY = 'story_words_per_chapter';

// --- Secret word mechanic ("???" mystery page) ---
// Tambah / ganti kata di sini kalau mau ubah puzzle-nya.
// "id" harus sama persis dengan value data-secret di tag <strong> terkait.
const SECRET_WORDS = ['rokok', 'vape', 'Ukhuwah', 'broken home', 'pisau', 'Skengha'];

// Clue untuk tiap kata — jangan sebut kata aslinya, cukup arah/petunjuk samar.
// Urutan objeknya mengikuti SECRET_WORDS, dan kalau kamu nambah/pindah kata
// ke halaman lain, update juga clue-nya di sini biar tetap fair.
const SECRET_WORD_HINTS = {
  rokok: 'Benda yang menyebabkan penikmatnya kecanduan.',
  vape: 'Salah satu benda yang menyebabkan Taufik kembali ke rumahnya sambil menangis.',
  Ukhuwah: 'Sekolah yang katanya "Sekolah islam swasta terbaik".',
  'broken home': 'Kondisi dimana rumah tidak terasa seperti rumah.',
  pisau: 'Salah satu benda yang masuk ke "Daftar benda yang membuat Taufik trauma".',
  Skengha: 'Sebuah sekolah yang terkenal dengan slogan "Man jadda wa jadda".'
};
const SECRET_FOUND_KEY = 'story_secret_words_found';
const MYSTERY_UNLOCKED_KEY = 'story_mystery_unlocked';

// --- Utility: Ambil data chapter yang sudah dibaca ---
function getReadChapters() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// --- Utility: Simpan chapter yang sudah dibaca ---
function markChapterRead(chapterNum) {
  const read = getReadChapters();
  if (!read.includes(chapterNum)) {
    read.push(chapterNum);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(read));
  }
  localStorage.setItem(LAST_READ_KEY, chapterNum);
}

// --- Utility: Ambil chapter terakhir yang dibaca ---
function getLastRead() {
  try {
    const data = localStorage.getItem(LAST_READ_KEY);
    return data ? parseInt(data, 10) : null;
  } catch {
    return null;
  }
}

// --- Utility: Simpan estimasi kata per chapter ---
function saveWordCount(chapterNum, words) {
  try {
    const data = localStorage.getItem(WORDS_PER_CHAPTER_KEY);
    const counts = data ? JSON.parse(data) : {};
    counts[chapterNum] = words;
    localStorage.setItem(WORDS_PER_CHAPTER_KEY, JSON.stringify(counts));
  } catch { }
}

// =============================================
//   FITUR 1 — SCROLL PROGRESS BAR
// =============================================

function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scrollProgressBar';
  bar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 2px;
    width: 0%;
    background: var(--accent);
    z-index: 9999;
    transition: width 0.1s linear;
  `;
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
  });
}

// =============================================
//   FITUR 2 — LAST READ HIGHLIGHT
// =============================================

function highlightLastRead() {
  const lastRead = getLastRead();
  if (!lastRead) return;

  const card = document.querySelector(`.chapter-card[data-chapter="${lastRead}"]`);
  if (!card) return;

  const meta = card.querySelector('.chapter-meta');
  if (meta) {
    const badge = document.createElement('span');
    badge.className = 'last-read-badge';
    badge.textContent = 'Terakhir dibaca';
    meta.appendChild(badge);
  }
}

// =============================================
//   FITUR 3 — ESTIMATED FINISH TIME
// =============================================

function updateEstimatedFinish() {
  const el = document.getElementById('estimatedFinish');
  if (!el) return;

  const read = getReadChapters();
  const remaining = TOTAL_CHAPTERS - read.length;

  if (remaining === 0) {
    el.textContent = 'Semua chapter selesai dibaca ✦';
    return;
  }

  try {
    const data = localStorage.getItem(WORDS_PER_CHAPTER_KEY);
    const counts = data ? JSON.parse(data) : {};
    const knownChapters = Object.keys(counts).length;
    if (knownChapters === 0) return;

    const totalWords = Object.values(counts).reduce((a, b) => a + b, 0);
    const avgPerChapter = totalWords / knownChapters;
    const remainingMinutes = Math.max(1, Math.round((avgPerChapter * remaining) / 200));
    el.textContent = `~${remainingMinutes} menit lagi untuk menyelesaikan cerita ini`;
  } catch { }
}

// =============================================
//   FUNGSI LAMA — DIPERTAHANKAN
// =============================================

function updateIndexPage() {
  const read = getReadChapters();

  for (let i = 1; i <= TOTAL_CHAPTERS; i++) {
    const statusEl = document.getElementById(`status-${i}`);
    if (statusEl) {
      if (read.includes(i)) {
        statusEl.textContent = 'Sudah dibaca';
        statusEl.classList.add('sudah-dibaca');
      } else {
        statusEl.textContent = 'Belum dibaca';
        statusEl.classList.remove('sudah-dibaca');
      }
    }
  }

  const count = read.length;
  const pct = Math.round((count / TOTAL_CHAPTERS) * 100);

  const bar = document.getElementById('progressBar');
  const text = document.getElementById('progressText');
  if (bar) bar.style.width = pct + '%';
  if (text) text.textContent = `${count} / ${TOTAL_CHAPTERS} chapter`;
}

function calcReadTime() {
  const proseEl = document.querySelector('.prose');
  if (!proseEl) return;
  const words = proseEl.innerText.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  const el = document.querySelector('.read-time');
  if (el) el.textContent = `${minutes} menit baca`;

  const meta = document.querySelector('meta[name="chapter-num"]');
  if (meta) {
    const num = parseInt(meta.content, 10);
    if (!isNaN(num)) saveWordCount(num, words);
  }
}

function markCurrentChapterRead() {
  const meta = document.querySelector('meta[name="chapter-num"]');
  if (!meta) return;
  const num = parseInt(meta.content, 10);
  if (!isNaN(num)) markChapterRead(num);
}

// =============================================
//   FITUR 4 — SECRET WORD HUNT ("???" mystery page)
// =============================================

function getFoundSecretWords() {
  try {
    const data = localStorage.getItem(SECRET_FOUND_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function isMysteryUnlocked() {
  return localStorage.getItem(MYSTERY_UNLOCKED_KEY) === 'true';
}

function showSecretToast(message) {
  let toast = document.querySelector('.secret-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'secret-toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = message;
  // restart animation
  toast.classList.remove('is-visible');
  void toast.offsetWidth;
  toast.classList.add('is-visible');

  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
  }, 3200);
}

function markSecretWordFound(id, el) {
  const found = getFoundSecretWords();

  if (found.includes(id)) {
    // Sudah pernah ditemukan sebelumnya
    if (el) el.classList.add('is-found');
    showSecretToast(`Kata ini sudah kamu temukan sebelumnya. <br><strong>${found.length} / ${SECRET_WORDS.length}</strong> ditemukan.`);
    return;
  }

  found.push(id);
  localStorage.setItem(SECRET_FOUND_KEY, JSON.stringify(found));
  if (el) el.classList.add('is-found');

  const allFound = SECRET_WORDS.every((w) => found.includes(w));

  if (allFound) {
    localStorage.setItem(MYSTERY_UNLOCKED_KEY, 'true');
    showSecretToast(`Kata terakhir ditemukan... <br><strong>Halaman "???" telah terbuka.</strong>`);
  } else {
    showSecretToast(`Kata tersembunyi ditemukan. <br><strong>${found.length} / ${SECRET_WORDS.length}</strong> ditemukan.`);
  }

  updateMysteryCard();
}

function initSecretWordHunt() {
  const found = getFoundSecretWords();

  document.querySelectorAll('.secret-word').forEach((el) => {
    const id = el.dataset.secret;
    if (!id) return;

    if (found.includes(id)) {
      el.classList.add('is-found');
    }

    el.addEventListener('click', (e) => {
      e.preventDefault();
      markSecretWordFound(id, el);
    });
  });
}

// --- Update the "???" card on extra.html ---
function buildHintList(found) {
  const list = document.createElement('div');
  list.className = 'mystery-hints';

  SECRET_WORDS.forEach((id) => {
    const row = document.createElement('div');
    row.className = 'mystery-hint-row';

    if (found.includes(id)) {
      row.classList.add('is-found');
      row.innerHTML = `<span class="mystery-hint-mark">✓</span><span class="mystery-hint-text">Ditemukan</span>`;
    } else {
      const hint = SECRET_WORD_HINTS[id] || 'Belum ada clue untuk kata ini.';
      row.innerHTML = `<span class="mystery-hint-mark">?</span><span class="mystery-hint-text">${hint}</span>`;
    }

    list.appendChild(row);
  });

  return list;
}

function updateMysteryCard() {
  const card = document.getElementById('mysteryCard');
  if (!card) return;

  const found = getFoundSecretWords();
  const progressEl = card.querySelector('.mystery-progress');
  const titleEl = card.querySelector('.mystery-title');
  const descEl = card.querySelector('.mystery-desc');

  if (isMysteryUnlocked()) {
    card.classList.remove('is-locked');
    card.classList.add('is-unlocked');
    card.href = '../main/mystery.html';
    if (titleEl) titleEl.textContent = '???';
    if (descEl) descEl.textContent = 'Terkuak. Klik untuk membaca.';
    if (progressEl) progressEl.textContent = 'Unlocked ✦';

    const oldHintWrap = card.querySelector('.mystery-hint-wrap');
    if (oldHintWrap) oldHintWrap.remove();
    return;
  }

  card.classList.add('is-locked');
  card.classList.remove('is-unlocked');
  card.removeAttribute('href');
  if (titleEl) titleEl.textContent = '???';
  if (descEl) descEl.textContent = 'Temukan kata tersembunyi di sepanjang cerita untuk membuka halaman ini.';
  if (progressEl) progressEl.textContent = `${found.length} / ${SECRET_WORDS.length} kata ditemukan`;

  // --- Hint toggle (dibuat sekali, lalu di-refresh isinya tiap update) ---
  let hintWrap = card.querySelector('.mystery-hint-wrap');
  if (!hintWrap) {
    hintWrap = document.createElement('div');
    hintWrap.className = 'mystery-hint-wrap';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'mystery-hint-toggle';
    toggleBtn.textContent = 'Lihat clue';

    const hintBody = document.createElement('div');
    hintBody.className = 'mystery-hint-body';

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = hintBody.classList.toggle('is-open');
      toggleBtn.textContent = isOpen ? 'Sembunyikan clue' : 'Lihat clue';
    });

    hintWrap.appendChild(toggleBtn);
    hintWrap.appendChild(hintBody);

    const contentEl = card.querySelector('.extra-card-content');
    if (contentEl) contentEl.appendChild(hintWrap);
  }

  const hintBody = hintWrap.querySelector('.mystery-hint-body');
  hintBody.innerHTML = '';
  hintBody.appendChild(buildHintList(found));

  if (!card._lockedClickBound) {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.mystery-hint-wrap')) return; // biar tombol clue nggak ke-trigger toast
      e.preventDefault();
      showSecretToast('Halaman ini masih terkunci. Coba cari kata-kata tersembunyi di dalam cerita.');
    });
    card._lockedClickBound = true;
  }
}

// --- Guard for main/mystery.html itself ---
function guardMysteryPage() {
  const guard = document.getElementById('mysteryGuard');
  if (!guard) return; // bukan halaman mystery

  if (!isMysteryUnlocked()) {
    guard.style.display = 'flex';
    document.getElementById('mysteryContent')?.remove();
  } else {
    guard.remove();
    const content = document.getElementById('mysteryContent');
    if (content) content.style.display = 'block';
  }
}

// =============================================
//   IMAGES PAGE — LIGHTBOX
// =============================================

function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox) return;

  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  function openLightbox(card) {
    lightboxImg.src = card.dataset.full;
    lightboxImg.alt = card.querySelector('img').alt;
    lightboxTitle.textContent = card.dataset.title || '';
    lightboxDesc.textContent = card.dataset.desc || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lightboxImg.src = '';
  }

  document.querySelectorAll('.image-card').forEach((card) => {
    card.addEventListener('click', () => openLightbox(card));
  });

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

// =============================================
//   INIT
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('chapterList')) {
    updateIndexPage();
    highlightLastRead();
    updateEstimatedFinish();
  }

  if (document.querySelector('.prose')) {
    markCurrentChapterRead();
    calcReadTime();
    initScrollProgress();
    initSecretWordHunt();
  }

  updateMysteryCard();
  guardMysteryPage();
  initLightbox();
});