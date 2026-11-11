let isExpanded = false;
let activitiesCache = [];

async function updateWidget() {
  try {
    const list = await window.tempoAPI.getActivities();
    activitiesCache = list || [];

    if (!activitiesCache || activitiesCache.length === 0) {
      document.getElementById('wTitle').textContent = 'Tidak ada agenda';
      document.getElementById('wCountdown').textContent = '-';
      document.getElementById('wProgress').textContent = '0/0';
      renderDropdownList([]);
      return;
    }

    const total = activitiesCache.length;
    const completed = activitiesCache.filter(a => a.status === 'completed').length;
    document.getElementById('wProgress').textContent = `${completed}/${total} selesai`;

    // Filter tugas pending dan urutkan berdasarkan tenggat terdekat
    const pendingList = activitiesCache.filter(a => a.status !== 'completed');

    if (pendingList.length === 0) {
      document.getElementById('wTitle').textContent = 'Semua agenda selesai! 🎉';
      const badge = document.getElementById('wCountdown');
      badge.textContent = '100%';
      badge.className = 'badge-time';
    } else {
      pendingList.sort((a, b) => {
        const timeA = new Date(`${a.dueDate}T${a.dueTime || '23:59:00'}`).getTime();
        const timeB = new Date(`${b.dueDate}T${b.dueTime || '23:59:00'}`).getTime();
        return timeA - timeB;
      });

      const nearest = pendingList[0];
      document.getElementById('wTitle').textContent = nearest.title;
      const badge = document.getElementById('wCountdown');
      badge.textContent = nearest.horizonLabel || 'Mendatang';

      if (nearest.horizonLabel && (nearest.horizonLabel.includes('Hari H') || nearest.horizonLabel.includes('Overdue'))) {
        badge.className = 'badge-time urgent';
      } else {
        badge.className = 'badge-time';
      }
    }

    renderDropdownList(activitiesCache);
  } catch (err) {
    console.error('Widget error:', err);
  }
}

function renderDropdownList(list) {
  const container = document.getElementById('dropdownList');
  const countEl = document.getElementById('dropdownCount');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = '<div class="dropdown-empty">Belum ada agenda yang dicatat.</div>';
    if (countEl) countEl.textContent = '0 Tugas';
    return;
  }

  // Tampilkan tugas pending di atas, lalu tugas selesai di bawah
  const sorted = [...list].sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    const timeA = new Date(`${a.dueDate}T${a.dueTime || '23:59:00'}`).getTime();
    const timeB = new Date(`${b.dueDate}T${b.dueTime || '23:59:00'}`).getTime();
    return timeA - timeB;
  });

  const pendingCount = sorted.filter(a => a.status !== 'completed').length;
  if (countEl) countEl.textContent = `${pendingCount} Aktif`;

  container.innerHTML = sorted.map((act, index) => {
    const isDone = act.status === 'completed';
    let horizonClass = 'item-horizon';
    if (act.horizonLabel && (act.horizonLabel.includes('Hari H') || act.horizonLabel.includes('Overdue'))) {
      horizonClass += ' urgent';
    } else if (act.horizonLabel && act.horizonLabel.includes('H-1')) {
      horizonClass += ' h1';
    }

    const delay = (index * 0.035).toFixed(3);

    return `
      <div class="task-item ${isDone ? 'completed' : ''}" style="animation-delay: ${delay}s;" onclick="toggleTaskCompletion('${act.id}', event)">
        <div class="item-checkbox ${isDone ? 'checked' : ''}" title="${isDone ? 'Tandai belum selesai' : 'Tandai selesai'}">
          ${isDone ? `
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ` : ''}
        </div>
        <div class="item-body">
          <div class="item-title" title="${escapeHtml(act.title)}">${escapeHtml(act.title)}</div>
          <div class="item-sub">
            <span class="${horizonClass}">${act.horizonLabel || 'Tenggat'}</span>
            <span>${act.dueDate || '-'} • ${act.dueTime || '-'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleDropdown() {
  const container = document.getElementById('hudContainer');
  if (!container) return;

  if (isExpanded) {
    // Tutup dengan animasi keluar
    container.classList.add('closing');
    setTimeout(async () => {
      container.classList.remove('expanded');
      container.classList.remove('closing');
      if (window.tempoAPI && window.tempoAPI.setWidgetExpanded) {
        await window.tempoAPI.setWidgetExpanded(false);
      }
      isExpanded = false;
    }, 180);
  } else {
    // Buka dengan animasi membal (bounce)
    if (window.tempoAPI && window.tempoAPI.setWidgetExpanded) {
      await window.tempoAPI.setWidgetExpanded(true);
    }
    container.classList.add('expanded');
    isExpanded = true;
    updateWidget();
  }
}

async function toggleTaskCompletion(id, event) {
  event.stopPropagation();
  try {
    await window.tempoAPI.toggleComplete(id);
    await updateWidget();
  } catch (err) {
    console.error('Error toggling complete from widget:', err);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Event Listeners
document.getElementById('widgetInfo')?.addEventListener('click', toggleDropdown);
document.getElementById('btnToggleDropdown')?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleDropdown();
});
document.getElementById('btnLogo')?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleDropdown();
});

document.getElementById('btnOpen')?.addEventListener('click', (e) => {
  e.stopPropagation();
  window.tempoAPI.showMainWindow();
});

document.getElementById('btnFooterDashboard')?.addEventListener('click', (e) => {
  e.stopPropagation();
  window.tempoAPI.showMainWindow();
});

// Update otomatis saat pertama kali dibuka dan setiap 15 detik
updateWidget();
setInterval(updateWidget, 15000);

if (window.tempoAPI && window.tempoAPI.onActivitiesUpdated) {
  window.tempoAPI.onActivitiesUpdated(() => {
    updateWidget();
  });
}
