// =============================================
//   STORY WEBSITE — script.js
// =============================================

const TOTAL_CHAPTERS = 5;
const STORAGE_KEY = 'story_read_chapters';
const LAST_READ_KEY = 'story_last_read';
const WORDS_PER_CHAPTER_KEY = 'story_words_per_chapter';

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
  } catch {}
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
  } catch {}
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
  if (bar)  bar.style.width = pct + '%';
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
  }

  initLightbox();
});