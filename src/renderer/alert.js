// Audio Synthesizer via Web Audio API (Kebal Do Not Disturb & Offline-Ready)
let audioCtx = null;
let soundInterval = null;
let isMuted = false;
let currentActivity = null;
let currentReason = null;

// Anti-Procrastination puzzle state
let currentAnswer = '';
let pendingAction = null; // 'snooze' atau 'dismiss'

function playAlertChime() {
  if (isMuted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx) audioCtx = new AudioContext();

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const notes = [880, 1318.5, 1108.7];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + (i * 0.12));

      gain.gain.setValueAtTime(0, now + (i * 0.12));
      gain.gain.linearRampToValueAtTime(0.2, now + (i * 0.12) + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.12) + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + (i * 0.12));
      osc.stop(now + (i * 0.12) + 0.4);
    });
  } catch (err) {
    console.error('Audio synthesizer error:', err);
  }
}

function startAudioLoop() {
  playAlertChime();
  if (!soundInterval) {
    soundInterval = setInterval(playAlertChime, 3500);
  }
}

function stopAudioLoop() {
  if (soundInterval) {
    clearInterval(soundInterval);
    soundInterval = null;
  }
}

window.tempoAPI.onAlertData((data) => {
  if (!data || !data.activity) return;

  currentActivity = data.activity;
  currentReason = data.triggerReason;

  document.getElementById('alertTitle').textContent = currentActivity.title;
  document.getElementById('alertDesc').textContent = currentActivity.description || 'Tidak ada catatan tambahan.';

  const badgeHorizon = document.getElementById('badgeHorizon');
  if (currentReason && currentReason.label) {
    badgeHorizon.textContent = currentReason.label;
  } else {
    badgeHorizon.textContent = currentActivity.horizonLabel || 'Peringatan';
  }

  // Render link vault jika ada
  const vaultList = document.getElementById('vaultList');
  vaultList.innerHTML = '';
  if (currentActivity.vault && currentActivity.vault.links && currentActivity.vault.links.length > 0) {
    currentActivity.vault.links.forEach(l => {
      const chip = document.createElement('div');
      chip.className = 'vault-chip';
      chip.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        <span>${l.title || 'Buka Link'}</span>
      `;
      chip.onclick = () => {
        window.tempoAPI.openExternal(l.url);
      };
      vaultList.appendChild(chip);
    });
  }

  startAudioLoop();
});

// Event Listeners tombol utama
document.getElementById('btnComplete').addEventListener('click', async () => {
  stopAudioLoop();
  if (currentActivity) {
    await window.tempoAPI.completeActivity(currentActivity.id);
  }
});

// Tantangan Anti-Menunda untuk Tugas Urgent / Hari H
function triggerProcrastinationGate(actionType) {
  const isUrgent = currentActivity && (currentActivity.priority === 'urgent' || currentActivity.priority === 'high');
  
  if (!isUrgent) {
    // Kalau tugas biasa, langsung izinkan
    executeAction(actionType);
    return;
  }

  // Buka Gate Overlay dengan puzzle matematika cepat
  pendingAction = actionType;
  const num1 = Math.floor(Math.random() * 20) + 10;
  const num2 = Math.floor(Math.random() * 20) + 10;
  currentAnswer = String(num1 + num2);

  document.getElementById('gatePuzzleText').textContent = `Hitung cepat: ${num1} + ${num2} = ?`;
  const gateInput = document.getElementById('gateInput');
  gateInput.value = '';
  document.getElementById('gateOverlay').classList.remove('hidden');
  gateInput.focus();
}

async function executeAction(actionType) {
  stopAudioLoop();
  if (!currentActivity) return;

  if (actionType === 'snooze') {
    await window.tempoAPI.snoozeActivity(currentActivity.id, 15);
  } else if (actionType === 'dismiss') {
    const horizonType = currentReason ? currentReason.type : 'manual';
    await window.tempoAPI.dismissActivity(currentActivity.id, horizonType);
  }
}

document.getElementById('btnSnooze').addEventListener('click', () => {
  triggerProcrastinationGate('snooze');
});

document.getElementById('btnDismiss').addEventListener('click', () => {
  triggerProcrastinationGate('dismiss');
});

// Gate Buttons
document.getElementById('btnGateCancel').addEventListener('click', () => {
  document.getElementById('gateOverlay').classList.add('hidden');
  pendingAction = null;
});

document.getElementById('btnGateConfirm').addEventListener('click', () => {
  checkGateAnswer();
});

document.getElementById('gateInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    checkGateAnswer();
  }
});

function checkGateAnswer() {
  const val = document.getElementById('gateInput').value.trim();
  if (val === currentAnswer) {
    document.getElementById('gateOverlay').classList.add('hidden');
    executeAction(pendingAction);
  } else {
    document.getElementById('gateInput').style.borderColor = '#ef4444';
    document.getElementById('gateInput').value = '';
    document.getElementById('gateInput').placeholder = 'Salah! Coba hitung lagi...';
  }
}

document.getElementById('soundToggle').addEventListener('click', () => {
  isMuted = !isMuted;
  const btn = document.getElementById('soundToggle');
  if (isMuted) {
    stopAudioLoop();
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
      </svg>
    `;
    btn.title = 'Nyalakan Bunyi';
  } else {
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
    `;
    btn.title = 'Matikan Bunyi';
    startAudioLoop();
  }
});
