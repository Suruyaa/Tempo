// Scratchpad Controller
const noteInput = document.getElementById('noteInput');
const btnClose = document.getElementById('btnClose');
const btnCopy = document.getElementById('btnCopy');
const btnConvert = document.getElementById('btnConvertToAgenda');
const saveStatus = document.getElementById('saveStatus');

let saveTimeout = null;

// Load initial content from store
async function loadNote() {
  try {
    const text = await window.tempoAPI.getScratchpad();
    noteInput.value = text || '';
    noteInput.focus();
  } catch (err) {
    console.error('Error loading scratchpad:', err);
  }
}

// Auto-save on input
noteInput.addEventListener('input', () => {
  saveStatus.textContent = 'Menyimpan...';
  saveStatus.style.color = '#f59e0b';

  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await window.tempoAPI.saveScratchpad(noteInput.value);
    saveStatus.textContent = '● Tersimpan otomatis';
    saveStatus.style.color = '#10b981';
  }, 400);
});

// Close button
btnClose.addEventListener('click', () => {
  window.tempoAPI.toggleScratchpad(false);
});

// Escape key to close
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.tempoAPI.toggleScratchpad(false);
  }
});

// Copy all text
btnCopy.addEventListener('click', () => {
  navigator.clipboard.writeText(noteInput.value);
  const orig = btnCopy.textContent;
  btnCopy.textContent = '✓ Tersalin!';
  setTimeout(() => { btnCopy.textContent = orig; }, 1500);
});

// Convert first line / text into a new Agenda (H-1)
btnConvert.addEventListener('click', async () => {
  const text = noteInput.value.trim();
  if (!text) return;

  const lines = text.split('\n');
  const title = lines[0].substring(0, 80);
  const desc = lines.slice(1).join('\n');

  // Set deadline besok (H-1)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dueDateStr = tomorrow.toISOString().split('T')[0];

  await window.tempoAPI.addActivity({
    title,
    description: desc,
    dueDate: dueDateStr,
    dueTime: '17:00',
    priority: 'high',
    category: 'Scratchpad',
    reminderHorizon: ['h-1', 'h-0'],
    dependencies: [],
    status: 'pending'
  });

  btnConvert.textContent = '✓ Berhasil Dibuat!';
  setTimeout(() => {
    btnConvert.textContent = '➕ Jadikan Agenda (H-1)';
    window.tempoAPI.toggleScratchpad(false);
  }, 1000);
});

loadNote();
