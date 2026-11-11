// TEMPO Main Controller (Sidebar Layout & State Manager)
let activitiesCache = [];
let holidaysCache = null;
let currentTab = 'agenda';

// Instansiasi komponen
let agendaView = null;
let calendarView = null;
let nodeGraph = null;
let vaultView = null;
let logbookView = null;

const tabMeta = {
  agenda: {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    title: 'Agenda & To-Do List',
    subtitle: 'Pantau tenggat waktu, countdown H-x, dan eksekusi tugas'
  },
  calendar: {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    title: 'Kalender & Libur Nasional',
    subtitle: 'Pemetaan Hari Libur Resmi Indonesia (SKB 3 Menteri) & agenda pribadi'
  },
  nodegraph: {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
    title: 'Interactive Graph View',
    subtitle: 'Peta ketergantungan relasi tugas (Point A ➜ Point B) dengan simulasi partikel'
  },
  vault: {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
    title: 'Activity Vault',
    subtitle: 'Brankas berkas draft dan tautan online yang terhubung ke notifikasi paksa'
  },
  logbook: {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    title: 'Logbook & Jurnal Produktivitas',
    subtitle: 'Dokumentasikan refleksi harian dan riwayat tugas dengan ekspor/impor Markdown (.md)'
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  agendaView = new window.AgendaView('tab-agenda');
  calendarView = new window.CalendarView('tab-calendar');
  nodeGraph = new window.NodeGraph('tab-nodegraph');
  vaultView = new window.VaultView('tab-vault');
  logbookView = new window.LogbookView('tab-logbook');

  window.agendaView = agendaView;
  window.calendarView = calendarView;
  window.nodeGraph = nodeGraph;
  window.vaultView = vaultView;
  window.logbookView = logbookView;

  // Inisialisasi navigasi sidebar
  setupSidebarNavigation();

  // Inisialisasi tombol power tools
  setupPowerTools();

  // Inisialisasi form modal tambah agenda
  setupModalForm();

  // Inisialisasi event modal suara notifikasi
  setupSoundSettingsEvents();

  // Handle window resize untuk physics graph canvas
  window.addEventListener('resize', () => {
    if (currentTab === 'nodegraph' && nodeGraph) {
      nodeGraph.setupCanvas();
    }
  });

  // Muat data awal
  await refreshApp();

  // Dengar update dari background process
  if (window.tempoAPI && window.tempoAPI.onActivitiesUpdated) {
    window.tempoAPI.onActivitiesUpdated(async () => {
      await refreshApp();
    });
  }
});

async function refreshApp() {
  try {
    activitiesCache = await window.tempoAPI.getActivities();
    if (!holidaysCache) {
      holidaysCache = await window.tempoAPI.getHolidays();
    }

    // Update pending counter badge di sidebar
    const pendingCount = activitiesCache.filter(a => a.status !== 'completed').length;
    const badge = document.getElementById('badgePendingCount');
    if (badge) badge.textContent = pendingCount;

    // Perbarui data ke masing-masing komponen
    if (calendarView) calendarView.setData(holidaysCache, activitiesCache);
    if (nodeGraph) nodeGraph.setData(activitiesCache);
    if (vaultView) vaultView.setData(activitiesCache);

    // Render tab aktif saat ini
    renderActiveTab();

    // Perbarui checklist prasyarat di modal tambah agenda
    updateDependencyChecklist();
  } catch (err) {
    console.error('Error refreshing app:', err);
  }
}
window.refreshApp = refreshApp;

function setupSidebarNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-tab');
      switchTab(target);
    });
  });
}

function switchTab(tabName) {
  currentTab = tabName;

  // Update styling tombol sidebar
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update visibility pane
  document.querySelectorAll('.tab-pane').forEach(pane => {
    if (pane.id === `tab-${tabName}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });

  // Update Top Breadcrumb Title & Subtitle
  const meta = tabMeta[tabName] || tabMeta.agenda;
  const iconContainer = document.getElementById('viewBreadcrumbIcon');
  if (iconContainer) iconContainer.innerHTML = meta.icon;
  const titleEl = document.getElementById('viewBreadcrumbTitle');
  if (titleEl) titleEl.textContent = meta.title;
  const subEl = document.getElementById('viewBreadcrumbSubtitle');
  if (subEl) subEl.textContent = meta.subtitle;

  renderActiveTab();
}

function renderActiveTab() {
  if (currentTab === 'agenda' && agendaView) {
    agendaView.render(activitiesCache);
  } else if (currentTab === 'calendar' && calendarView) {
    calendarView.render();
  } else if (currentTab === 'nodegraph' && nodeGraph) {
    nodeGraph.render();
  } else if (currentTab === 'vault' && vaultView) {
    vaultView.render();
  } else if (currentTab === 'logbook' && logbookView) {
    logbookView.render();
  }
}

function setupPowerTools() {
  // Tombol Buka Scratchpad (Sidebar & Header)
  const openScratchpad = () => window.tempoAPI.toggleScratchpad(true);
  document.getElementById('btnOpenScratchpad')?.addEventListener('click', openScratchpad);
  document.getElementById('btnHeaderScratchpad')?.addEventListener('click', openScratchpad);

  // Tombol Tes Notifikasi Paksa (Bypass DND)
  document.getElementById('btnTestAlert')?.addEventListener('click', async () => {
    const act = activitiesCache[0];
    await window.tempoAPI.testForcedAlert(act ? act.id : null);
  });

  // Tombol Toggle Mini Floating HUD
  document.getElementById('btnToggleMini')?.addEventListener('click', async () => {
    await window.tempoAPI.toggleMiniWidget();
  });

  // Tombol Ekspor Kalender .ICS
  document.getElementById('btnExportICS')?.addEventListener('click', async () => {
    const res = await window.tempoAPI.exportICS();
    if (res.success) {
      window.showCustomAlert(
        'Kalender Berhasil Diekspor',
        `Berkas kalender standar .ICS berhasil disimpan di:\n${res.filePath}\n\nAnda dapat mengimpor file ini langsung ke Google Calendar atau kalender ponsel Anda!`
      );
    }
  });

  // Tombol Buka Pengaturan Suara Notifikasi Alarm
  document.getElementById('btnOpenSoundSettings')?.addEventListener('click', openSoundSettingsModal);

  // Tombol Buka Modal Tambah Agenda di Header
  document.getElementById('btnOpenAddModal')?.addEventListener('click', () => {
    window.openAddActivityModal();
  });
}

// ============================================================
// PENGATURAN SUARA NOTIFIKASI ALARM
// ============================================================
async function openSoundSettingsModal() {
  const modal = document.getElementById('modalSoundSettings');
  const listContainer = document.getElementById('soundPresetsList');
  const volumeSlider = document.getElementById('soundVolumeSlider');
  const volumeLabel = document.getElementById('soundVolumeLabel');

  if (!modal || !listContainer) return;

  try {
    const settings = await window.tempoAPI.getSettings();
    const activeSound = settings.alertSound || 'tempo_chime';
    const activeVol = (settings.alertVolume !== undefined ? settings.alertVolume : 0.8);

    if (volumeSlider) {
      volumeSlider.value = Math.round(activeVol * 100);
    }
    if (volumeLabel) {
      volumeLabel.textContent = `${Math.round(activeVol * 100)}%`;
    }

    const presets = window.SoundEngine ? window.SoundEngine.presets : [];
    listContainer.innerHTML = presets.map(p => `
      <div class="sound-preset-card ${p.id === activeSound ? 'active' : ''}" data-sound-id="${p.id}" onclick="window.selectSoundPreset('${p.id}')">
        <div class="preset-radio-indicator">
          <input type="radio" name="soundPresetRadio" value="${p.id}" ${p.id === activeSound ? 'checked' : ''}>
        </div>
        <div class="preset-info">
          <div class="preset-name-row">
            <span class="preset-title">${p.name}</span>
            <span class="preset-tag">${p.tag}</span>
          </div>
          <div class="preset-desc">${p.desc}</div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm btn-preview-sound" onclick="event.stopPropagation(); window.previewSound('${p.id}')" title="Dengarkan Suara Ini">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          Tes Nada
        </button>
      </div>
    `).join('');

    modal.classList.remove('hidden');
  } catch (err) {
    console.error('Error opening sound settings:', err);
  }
}

window.selectSoundPreset = (id) => {
  document.querySelectorAll('.sound-preset-card').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-sound-id') === id);
  });
  const radio = document.querySelector(`input[name="soundPresetRadio"][value="${id}"]`);
  if (radio) radio.checked = true;
};

window.previewSound = (id) => {
  const slider = document.getElementById('soundVolumeSlider');
  const vol = slider ? Number(slider.value) / 100 : 0.8;
  if (window.SoundEngine) {
    window.SoundEngine.playSound(id, vol);
  }
};

function setupSoundSettingsEvents() {
  const modal = document.getElementById('modalSoundSettings');
  const btnClose = document.getElementById('btnCloseSoundSettings');
  const btnCancel = document.getElementById('btnCancelSoundSettings');
  const btnSave = document.getElementById('btnSaveSoundSettings');
  const slider = document.getElementById('soundVolumeSlider');
  const label = document.getElementById('soundVolumeLabel');

  const hide = () => modal?.classList.add('hidden');
  if (btnClose) btnClose.onclick = hide;
  if (btnCancel) btnCancel.onclick = hide;

  if (slider) {
    slider.oninput = (e) => {
      const val = e.target.value;
      if (label) label.textContent = `${val}%`;
    };
  }

  if (btnSave) {
    btnSave.onclick = async () => {
      const checkedRadio = document.querySelector('input[name="soundPresetRadio"]:checked');
      const selectedSound = checkedRadio ? checkedRadio.value : 'tempo_chime';
      const selectedVolume = slider ? Number(slider.value) / 100 : 0.8;

      await window.tempoAPI.updateSettings({
        alertSound: selectedSound,
        alertVolume: selectedVolume
      });

      // Tes bunyi singkat sebagai feedback
      if (window.SoundEngine) {
        window.SoundEngine.playSound(selectedSound, selectedVolume);
      }

      hide();
      const preset = window.SoundEngine?.presets.find(p => p.id === selectedSound);
      window.showCustomAlert(
        'Preferensi Suara Disimpan',
        `Nada alarm utama berhasil diatur ke:\n🎵 ${preset ? preset.name : selectedSound}\nVolume: ${Math.round(selectedVolume * 100)}%`
      );
    };
  }
}

let editingActivityId = null;

function setupModalForm() {
  const modal = document.getElementById('modalAddActivity');
  const btnClose = document.getElementById('btnCloseModalAdd');
  const btnCancel = document.getElementById('btnCancelAdd');
  const form = document.getElementById('formAddActivity');
  const modalTitleEl = modal?.querySelector('.modal-title-wrap h2');
  const modalSubEl = modal?.querySelector('.modal-subtitle');
  const submitBtnEl = form?.querySelector('button[type="submit"]');

  const hideModal = () => {
    modal.classList.add('hidden');
    editingActivityId = null;
  };

  const showModal = (isEdit = false) => {
    updateDependencyChecklist(editingActivityId);
    modal.classList.remove('hidden');

    if (isEdit) {
      if (modalTitleEl) modalTitleEl.textContent = 'Edit Agenda & Tenggat Waktu';
      if (modalSubEl) modalSubEl.textContent = 'Perbarui rincian tugas, prioritas, jadwal, dan notifikasi berjangka';
      if (submitBtnEl) submitBtnEl.textContent = 'Simpan Perubahan';
    } else {
      if (modalTitleEl) modalTitleEl.textContent = 'Catat Agenda & Deadline Baru';
      if (modalSubEl) modalSubEl.textContent = 'Tetapkan tenggat waktu, rantai tugas prasyarat, dan notifikasi berjangka';
      if (submitBtnEl) submitBtnEl.textContent = 'Simpan Agenda';
    }

    const dateInput = document.getElementById('inputDueDate');
    if (!dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  };

  if (btnClose) btnClose.onclick = hideModal;
  if (btnCancel) btnCancel.onclick = hideModal;

  window.openAddActivityModal = () => {
    editingActivityId = null;
    form.reset();
    if (document.getElementById('actAlertSound')) document.getElementById('actAlertSound').value = '';
    showModal(false);
  };

  window.openAddActivityWithDate = (dateStr) => {
    editingActivityId = null;
    form.reset();
    document.getElementById('inputDueDate').value = dateStr;
    if (document.getElementById('actAlertSound')) document.getElementById('actAlertSound').value = '';
    showModal(false);
  };

  window.openEditActivityModal = (id) => {
    const act = activitiesCache.find(a => a.id === id);
    if (!act) return;

    editingActivityId = id;
    form.reset();

    document.getElementById('inputTitle').value = act.title || '';
    document.getElementById('inputDesc').value = act.description || '';
    document.getElementById('inputDueDate').value = act.dueDate || '';
    document.getElementById('inputDueTime').value = act.dueTime || '15:00';
    document.getElementById('selectPriority').value = act.priority || 'normal';
    document.getElementById('inputCategory').value = act.category || 'Umum';
    if (document.getElementById('actAlertSound')) {
      document.getElementById('actAlertSound').value = act.alertSound || '';
    }

    // Set horizon checkboxes
    const horizons = act.reminderHorizon || [];
    form.querySelectorAll('input[name="horizon"]').forEach(cb => {
      cb.checked = horizons.includes(cb.value);
    });

    // Set quickLink if any
    const firstLink = act.vault && act.vault.links && act.vault.links[0];
    const linkInput = document.getElementById('inputQuickLink');
    if (linkInput) {
      linkInput.value = firstLink ? firstLink.url : '';
    }

    showModal(true);

    // Set dependency checkboxes
    const deps = act.dependencies || [];
    form.querySelectorAll('input[name="dependency"]').forEach(cb => {
      cb.checked = deps.includes(cb.value);
    });
  };

  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();

      const title = document.getElementById('inputTitle').value.trim();
      const description = document.getElementById('inputDesc').value.trim();
      const dueDate = document.getElementById('inputDueDate').value;
      const dueTime = document.getElementById('inputDueTime').value;
      const priority = document.getElementById('selectPriority').value;
      const category = document.getElementById('inputCategory').value.trim() || 'Umum';
      const quickLink = document.getElementById('inputQuickLink').value.trim();
      const alertSound = document.getElementById('actAlertSound')?.value || '';

      // Horizon checkboxes
      const horizonChecks = form.querySelectorAll('input[name="horizon"]:checked');
      const reminderHorizon = Array.from(horizonChecks).map(c => c.value);

      // Dependency checkboxes
      const depChecks = form.querySelectorAll('input[name="dependency"]:checked');
      const dependencies = Array.from(depChecks).map(c => c.value);

      if (editingActivityId) {
        // UPDATE MODE
        const existing = activitiesCache.find(a => a.id === editingActivityId);
        const vault = existing ? (existing.vault || { links: [], files: [] }) : { links: [], files: [] };
        if (quickLink) {
          if (!vault.links) vault.links = [];
          const exists = vault.links.find(l => l.url === quickLink);
          if (!exists) vault.links.unshift({ title: 'Tautan Pendukung', url: quickLink });
        }

        await window.tempoAPI.updateActivity(editingActivityId, {
          title,
          description,
          dueDate,
          dueTime,
          priority,
          category,
          reminderHorizon,
          dependencies,
          alertSound,
          vault
        });
      } else {
        // CREATE MODE
        const vault = { links: [], files: [] };
        if (quickLink && quickLink.length > 0) {
          vault.links.push({ title: 'Tautan Pendukung', url: quickLink });
        }

        await window.tempoAPI.addActivity({
          title,
          description,
          dueDate,
          dueTime,
          priority,
          category,
          reminderHorizon,
          dependencies,
          alertSound,
          vault,
          status: 'pending'
        });
      }

      form.reset();
      hideModal();
      await refreshApp();
    };
  }
}

function updateDependencyChecklist(excludeId = null) {
  const container = document.getElementById('dependencyListContainer');
  if (!container) return;

  const validOptions = activitiesCache.filter(a => a.id !== excludeId);

  if (validOptions.length === 0) {
    container.innerHTML = '<div style="font-size: 11px; color: #64748b; font-style: italic; padding: 4px;">Belum ada tugas lain untuk dijadikan prasyarat.</div>';
    return;
  }

  container.innerHTML = validOptions.map(a => `
    <label class="dep-check-item">
      <input type="checkbox" name="dependency" value="${a.id}">
      <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${escapeHtml(a.title)} (${a.dueDate || '-'})
      </span>
    </label>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ============================================================
   CUSTOM IN-APP CONFIRMATION & ALERT SYSTEM (DARK THEME)
   ============================================================ */
window.showConfirmDialog = function(title, message, onConfirm, isDanger = true) {
  const modal = document.getElementById('modalConfirmDialog');
  const titleEl = document.getElementById('confirmDialogTitle');
  const msgEl = document.getElementById('confirmDialogMessage');
  const inputEl = document.getElementById('confirmDialogInput');
  const iconWrap = document.getElementById('confirmDialogIcon');
  const btnCancel = document.getElementById('btnConfirmCancel');
  const btnOk = document.getElementById('btnConfirmOk');

  if (!modal) return;
  if (inputEl) inputEl.classList.add('hidden');
  if (btnCancel) btnCancel.classList.remove('hidden');
  if (titleEl) titleEl.textContent = title || 'Konfirmasi';
  if (msgEl) msgEl.textContent = message || '';

  if (isDanger) {
    iconWrap.className = 'confirm-icon-wrap';
    iconWrap.innerHTML = `
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `;
    btnOk.className = 'btn btn-danger-glow';
    btnOk.textContent = 'Ya, Hapus';
  } else {
    iconWrap.className = 'confirm-icon-wrap icon-info';
    iconWrap.innerHTML = `
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    `;
    btnOk.className = 'btn btn-primary btn-glow';
    btnOk.textContent = 'Ya, Lanjutkan';
  }

  const closeDialog = () => {
    modal.classList.add('hidden');
    btnOk.onclick = null;
    btnCancel.onclick = null;
  };

  btnCancel.onclick = closeDialog;
  btnOk.onclick = async () => {
    closeDialog();
    if (typeof onConfirm === 'function') await onConfirm();
  };

  modal.classList.remove('hidden');
};

window.showCustomAlert = function(title, message) {
  const modal = document.getElementById('modalConfirmDialog');
  const titleEl = document.getElementById('confirmDialogTitle');
  const msgEl = document.getElementById('confirmDialogMessage');
  const inputEl = document.getElementById('confirmDialogInput');
  const iconWrap = document.getElementById('confirmDialogIcon');
  const btnCancel = document.getElementById('btnConfirmCancel');
  const btnOk = document.getElementById('btnConfirmOk');

  if (!modal) return;
  if (inputEl) inputEl.classList.add('hidden');
  if (btnCancel) btnCancel.classList.add('hidden'); // Sembunyikan cancel untuk alert
  if (titleEl) titleEl.textContent = title || 'Informasi';
  if (msgEl) msgEl.textContent = message || '';

  iconWrap.className = 'confirm-icon-wrap icon-success';
  iconWrap.innerHTML = `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  `;
  btnOk.className = 'btn btn-primary btn-glow';
  btnOk.textContent = 'Mengerti';

  const closeDialog = () => {
    modal.classList.add('hidden');
    btnOk.onclick = null;
    btnCancel.onclick = null;
  };

  btnOk.onclick = closeDialog;
  modal.classList.remove('hidden');
};

window.showPromptDialog = function(title, message, defaultValue = '', onConfirm) {
  const modal = document.getElementById('modalConfirmDialog');
  const titleEl = document.getElementById('confirmDialogTitle');
  const msgEl = document.getElementById('confirmDialogMessage');
  const inputEl = document.getElementById('confirmDialogInput');
  const iconWrap = document.getElementById('confirmDialogIcon');
  const btnCancel = document.getElementById('btnConfirmCancel');
  const btnOk = document.getElementById('btnConfirmOk');

  if (!modal) return;
  if (inputEl) {
    inputEl.classList.remove('hidden');
    inputEl.value = defaultValue;
  }
  if (btnCancel) btnCancel.classList.remove('hidden');
  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.textContent = message;

  iconWrap.className = 'confirm-icon-wrap icon-info';
  iconWrap.innerHTML = `
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
  `;
  btnOk.className = 'btn btn-primary btn-glow';
  btnOk.textContent = 'Simpan';

  const closeDialog = () => {
    modal.classList.add('hidden');
    if (inputEl) inputEl.classList.add('hidden');
    btnOk.onclick = null;
    btnCancel.onclick = null;
  };

  btnCancel.onclick = closeDialog;
  btnOk.onclick = async () => {
    const val = inputEl ? inputEl.value : '';
    closeDialog();
    if (typeof onConfirm === 'function') await onConfirm(val);
  };

  modal.classList.remove('hidden');
  setTimeout(() => { if (inputEl) inputEl.focus(); }, 60);
};

window.deleteActivityPrompt = (id) => {
  window.showConfirmDialog(
    'Hapus Agenda',
    'Apakah Anda yakin ingin menghapus agenda ini? Tindakan ini akan menghapus semua file vault dan rantai node prasyarat yang terhubung.',
    async () => {
      await window.tempoAPI.deleteActivity(id);
      await refreshApp();
    },
    true
  );
};

window.promptAddVaultLink = (activityId) => {
  window.showPromptDialog(
    'Tambah Tautan Dokumen',
    'Masukkan judul tautan dokumen:',
    '',
    (title) => {
      if (!title || !title.trim()) return;
      window.showPromptDialog(
        'Masukkan URL Dokumen',
        'Masukkan URL web lengkap (misal Google Docs / Notion):',
        'https://',
        async (url) => {
          if (!url || !url.trim()) return;
          await window.tempoAPI.addVaultLink(activityId, { title: title.trim(), url: url.trim() });
          await refreshApp();
        }
      );
    }
  );
};
