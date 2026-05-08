// =============================================
//   STORY WEBSITE — script.js
// =============================================

const TOTAL_CHAPTERS = 5;
const STORAGE_KEY = 'story_read_chapters';

// --- Utility: Ambil data chapter yang sudah dibaca dari localStorage ---
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
}

// --- Update tampilan status & progress bar di index.html ---
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

  // Update progress bar
  const count = read.length;
  const pct = Math.round((count / TOTAL_CHAPTERS) * 100);

  const bar = document.getElementById('progressBar');
  const text = document.getElementById('progressText');
  if (bar)  bar.style.width = pct + '%';
  if (text) text.textContent = `${count} / ${TOTAL_CHAPTERS} chapter`;
}

// --- Hitung estimasi waktu baca ---
function calcReadTime() {
  const proseEl = document.querySelector('.prose');
  if (!proseEl) return;
  const words = proseEl.innerText.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.round(words / 200));
  const el = document.querySelector('.read-time');
  if (el) el.textContent = `${minutes} menit baca`;
}

// --- Tandai chapter saat ini sebagai sudah dibaca ---
function markCurrentChapterRead() {
  const meta = document.querySelector('meta[name="chapter-num"]');
  if (!meta) return;
  const num = parseInt(meta.content, 10);
  if (!isNaN(num)) markChapterRead(num);
}

// --- Init berdasarkan halaman ---
document.addEventListener('DOMContentLoaded', () => {
  // Halaman index
  if (document.getElementById('chapterList')) {
    updateIndexPage();
  }

  // Halaman chapter
  if (document.querySelector('.prose')) {
    markCurrentChapterRead();
    calcReadTime();
  }
});
