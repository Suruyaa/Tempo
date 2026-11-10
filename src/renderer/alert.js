// Audio Synthesizer via Web Audio API (Kebal Do Not Disturb & Offline-Ready)
let audioCtx = null;
let soundInterval = null;
let isMuted = false;
let currentActivity = null;
let currentReason = null;

function playAlertChime() {
  if (isMuted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx) audioCtx = new AudioContext();

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    
    // Pola nada chime: Nada tinggi menarik perhatian (A5 -> E6 -> C#6)
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

// Tangkap data alert dari main process via Preload
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
      chip.innerHTML = `🔗 <span>${l.title || 'Buka Link'}</span>`;
      chip.onclick = () => {
        window.tempoAPI.openExternal(l.url);
      };
      vaultList.appendChild(chip);
    });
  }

  startAudioLoop();
});

// Event Listeners tombol
document.getElementById('btnComplete').addEventListener('click', async () => {
  stopAudioLoop();
  if (currentActivity) {
    await window.tempoAPI.completeActivity(currentActivity.id);
  }
});

document.getElementById('btnSnooze').addEventListener('click', async () => {
  stopAudioLoop();
  if (currentActivity) {
    await window.tempoAPI.snoozeActivity(currentActivity.id, 15);
  }
});

document.getElementById('btnDismiss').addEventListener('click', async () => {
  stopAudioLoop();
  if (currentActivity) {
    const horizonType = currentReason ? currentReason.type : 'manual';
    await window.tempoAPI.dismissActivity(currentActivity.id, horizonType);
  }
});

document.getElementById('soundToggle').addEventListener('click', () => {
  isMuted = !isMuted;
  const btn = document.getElementById('soundToggle');
  if (isMuted) {
    stopAudioLoop();
    btn.textContent = '🔇';
    btn.title = 'Nyalakan Bunyi';
  } else {
    btn.textContent = '🔊';
    btn.title = 'Matikan Bunyi';
    startAudioLoop();
  }
});
