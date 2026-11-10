// TEMPO Main Renderer Controller
let activitiesCache = [];
let holidaysCache = null;
let currentTab = 'agenda';

// Instansiasi komponen
let agendaView = null;
let calendarView = null;
let nodeGraph = null;
let vaultView = null;
let qrcodeModal = null;

document.addEventListener('DOMContentLoaded', async () => {
  agendaView = new window.AgendaView('tab-agenda');
  calendarView = new window.CalendarView('tab-calendar');
  nodeGraph = new window.NodeGraph('tab-nodegraph');
  vaultView = new window.VaultView('tab-vault');
  qrcodeModal = new window.QRCodeModal();

  window.agendaView = agendaView;
  window.calendarView = calendarView;
  window.nodeGraph = nodeGraph;
  window.vaultView = vaultView;

  // Inisialisasi navigasi tab
  setupTabs();

  // Inisialisasi tombol header
  setupHeaderActions();

  // Inisialisasi form modal tambah agenda
  setupModalForm();

  // Muat data awal
  await refreshApp();

  // Dengar event jika ada update aktivitas dari background
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

    // Perbarui data ke masing-masing komponen
    calendarView.setData(holidaysCache, activitiesCache);
    nodeGraph.setData(activitiesCache);
    vaultView.setData(activitiesCache);

    // Render tab aktif saat ini
    renderActiveTab();

    // Perbarui dropdown prasyarat di modal tambah agenda
    updateDependencySelectOptions();
  } catch (err) {
    console.error('Error refreshing app:', err);
  }
}
window.refreshApp = refreshApp;

function setupTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      switchTab(target);
    });
  });
}

function switchTab(tabName) {
  currentTab = tabName;

  // Update styling tombol tab
  document.querySelectorAll('.nav-tab').forEach(t => {
    if (t.getAttribute('data-tab') === tabName) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });

  // Update visibility pane
  document.querySelectorAll('.tab-pane').forEach(p => {
    if (p.id === `tab-${tabName}`) {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  renderActiveTab();
}

function renderActiveTab() {
  if (currentTab === 'agenda') {
    agendaView.render(activitiesCache);
  } else if (currentTab === 'calendar') {
    calendarView.render();
  } else if (currentTab === 'nodegraph') {
    nodeGraph.render();
  } else if (currentTab === 'vault') {
    vaultView.render();
  }
}

function setupHeaderActions() {
  // Tombol Tes Notifikasi Paksa
  document.getElementById('btnTestAlert').addEventListener('click', async () => {
    const act = activitiesCache[0];
    await window.tempoAPI.testForcedAlert(act ? act.id : null);
  });

  // Tombol Toggle Mini HUD
  document.getElementById('btnToggleMini').addEventListener('click', async () => {
    await window.tempoAPI.toggleMiniWidget();
  });

  // Tombol Sambungkan HP (QR Code)
  document.getElementById('btnMobileSync').addEventListener('click', () => {
    qrcodeModal.show();
  });

  // Tombol Ekspor Kalender .ICS
  document.getElementById('btnExportICS').addEventListener('click', async () => {
    const res = await window.tempoAPI.exportICS();
    if (res.success) {
      alert(`✓ Kalender TEMPO berhasil diekspor ke:\n${res.filePath}\n\nAnda dapat mengimpor file ini ke Google Calendar atau kalender HP!`);
    }
  });
}

function setupModalForm() {
  const modal = document.getElementById('modalAddActivity');
  const btnClose = document.getElementById('btnCloseModalAdd');
  const btnCancel = document.getElementById('btnCancelAdd');
  const form = document.getElementById('formAddActivity');

  const hideModal = () => modal.classList.add('hidden');
  const showModal = () => {
    modal.classList.remove('hidden');
    // Set default tanggal hari ini jika kosong
    const dateInput = document.getElementById('inputDueDate');
    if (!dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  };

  btnClose.onclick = hideModal;
  btnCancel.onclick = hideModal;

  window.openAddActivityModal = showModal;
  window.openAddActivityWithDate = (dateStr) => {
    document.getElementById('inputDueDate').value = dateStr;
    showModal();
  };

  form.onsubmit = async (e) => {
    e.preventDefault();

    const title = document.getElementById('inputTitle').value;
    const description = document.getElementById('inputDesc').value;
    const dueDate = document.getElementById('inputDueDate').value;
    const dueTime = document.getElementById('inputDueTime').value;
    const priority = document.getElementById('selectPriority').value;
    const category = document.getElementById('inputCategory').value;

    // Ambil horizon yang dicentang
    const horizonChecks = form.querySelectorAll('input[name="horizon"]:checked');
    const reminderHorizon = Array.from(horizonChecks).map(c => c.value);

    // Ambil dependencies
    const selectDep = document.getElementById('selectDependency');
    const dependencies = Array.from(selectDep.selectedOptions).map(o => o.value);

    await window.tempoAPI.addActivity({
      title,
      description,
      dueDate,
      dueTime,
      priority,
      category,
      reminderHorizon,
      dependencies,
      status: 'pending'
    });

    form.reset();
    hideModal();
    await refreshApp();
  };
}

function updateDependencySelectOptions() {
  const select = document.getElementById('selectDependency');
  if (!select) return;

  const currentSelection = Array.from(select.selectedOptions).map(o => o.value);
  select.innerHTML = activitiesCache.map(a => `
    <option value="${a.id}" ${currentSelection.includes(a.id) ? 'selected' : ''}>
      ${a.title} (${a.dueDate || '-'})
    </option>
  `).join('');
}

// Global Helpers
window.deleteActivityPrompt = async (id) => {
  if (confirm('Apakah Anda yakin ingin menghapus agenda ini?')) {
    await window.tempoAPI.deleteActivity(id);
    await refreshApp();
  }
};

window.promptAddVaultLink = async (activityId) => {
  const title = prompt('Masukkan Judul / Nama Tautan (misal: Draft Google Docs):');
  if (!title) return;
  const url = prompt('Masukkan URL lengkap (misal: https://docs.google.com/...):');
  if (!url) return;

  await window.tempoAPI.addVaultLink(activityId, { title, url });
  await refreshApp();
};
