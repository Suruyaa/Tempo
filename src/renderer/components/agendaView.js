class AgendaView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentFilter = 'all'; // all, pending, completed, urgent
  }

  render(activities) {
    if (!this.container) return;

    const total = activities.length;
    const completed = activities.filter(a => a.status === 'completed').length;
    const pending = total - completed;
    const urgentCount = activities.filter(a => (a.priority === 'urgent' || a.priority === 'high') && a.status !== 'completed').length;

    // Filter activities
    let filtered = [...activities];
    if (this.currentFilter === 'pending') {
      filtered = filtered.filter(a => a.status !== 'completed');
    } else if (this.currentFilter === 'completed') {
      filtered = filtered.filter(a => a.status === 'completed');
    } else if (this.currentFilter === 'urgent') {
      filtered = filtered.filter(a => (a.priority === 'urgent' || a.priority === 'high') && a.status !== 'completed');
    }

    // Urutkan: Pending dulu, kemudian berdasarkan deadline terdekat
    filtered.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      const timeA = new Date(`${a.dueDate}T${a.dueTime || '23:59:00'}`).getTime();
      const timeB = new Date(`${b.dueDate}T${b.dueTime || '23:59:00'}`).getTime();
      return timeA - timeB;
    });

    this.container.innerHTML = `
      <div class="content-constrained">
        <!-- Stats Summary Banner -->
        <div class="stats-banner-grid">
          <div class="stat-box">
            <div class="stat-icon-wrap" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
            </div>
            <div>
              <div class="stat-number">${total}</div>
              <div class="stat-desc">Total Agenda Terdaftar</div>
            </div>
          </div>

          <div class="stat-box">
            <div class="stat-icon-wrap" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div>
              <div class="stat-number">${pending}</div>
              <div class="stat-desc">Sedang Berjalan</div>
            </div>
          </div>

          <div class="stat-box">
            <div class="stat-icon-wrap" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div>
              <div class="stat-number">${completed}</div>
              <div class="stat-desc">Tugas Selesai</div>
            </div>
          </div>

          <div class="stat-box">
            <div class="stat-icon-wrap" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
              </svg>
            </div>
            <div>
              <div class="stat-number">${urgentCount}</div>
              <div class="stat-desc">Mendesak / Urgent</div>
            </div>
          </div>
        </div>

        <!-- Filter Pills Bar -->
        <div class="filter-bar">
          <div class="filter-pills">
            <button class="filter-pill ${this.currentFilter === 'all' ? 'active' : ''}" onclick="window.agendaView.setFilter('all')">
              Semua (${total})
            </button>
            <button class="filter-pill ${this.currentFilter === 'pending' ? 'active' : ''}" onclick="window.agendaView.setFilter('pending')">
              Tertunda (${pending})
            </button>
            <button class="filter-pill ${this.currentFilter === 'urgent' ? 'active' : ''}" onclick="window.agendaView.setFilter('urgent')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 4px;"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
              Mendesak (${urgentCount})
            </button>
            <button class="filter-pill ${this.currentFilter === 'completed' ? 'active' : ''}" onclick="window.agendaView.setFilter('completed')">
              Selesai (${completed})
            </button>
          </div>
        </div>

        <!-- Agenda Cards List -->
        <div class="agenda-cards-container">
          ${filtered.length === 0 ? `
            <div style="text-align: center; padding: 48px 24px; color: #64748b; background: var(--bg-surface); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
              <div style="margin-bottom: 12px; color: var(--accent-cyan); display: flex; justify-content: center;">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 12h8"></path>
                </svg>
              </div>
              <div style="font-size: 15px; font-weight: 700; color: #cbd5e1; margin-bottom: 4px;">Tidak ada agenda di kategori ini</div>
              <div style="font-size: 12px; color: #64748b;">Gunakan tombol <strong>+ Catat Agenda Baru</strong> di kanan atas untuk membuat tugas baru.</div>
            </div>
          ` : filtered.map(act => this.renderCard(act)).join('')}
        </div>
      </div>
    `;
  }

  renderCard(act) {
    const isDone = act.status === 'completed';
    const prioClass = `prio-${act.priority || 'normal'}`;

    let horizonBadgeClass = 'badge-pill-horizon';
    if (act.horizonLabel && act.horizonLabel.includes('H-1')) horizonBadgeClass += ' badge-pill-h1';
    if (act.horizonLabel && (act.horizonLabel.includes('Hari H') || act.horizonLabel.includes('Overdue'))) horizonBadgeClass += ' badge-pill-urgent';

    const hasVault = act.vault && ((act.vault.links && act.vault.links.length > 0) || (act.vault.files && act.vault.files.length > 0));
    const vaultLinkCount = (act.vault && act.vault.links) ? act.vault.links.length : 0;
    const vaultFileCount = (act.vault && act.vault.files) ? act.vault.files.length : 0;

    return `
      <div class="agenda-card ${prioClass} ${isDone ? 'completed' : ''}" oncontextmenu="window.openEditActivityModal('${act.id}'); return false;">
        <div class="task-checkbox-custom ${isDone ? 'checked' : ''}" onclick="window.tempoAPI.toggleComplete('${act.id}')" title="${isDone ? 'Tandai belum selesai' : 'Tandai selesai'}">
          ${isDone ? `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ` : ''}
        </div>

        <div class="task-main-details">
          <div class="task-top-row">
            <span class="task-title-text" onclick="window.openEditActivityModal('${act.id}')" style="cursor: pointer;" title="Klik untuk edit agenda">${this.escapeHtml(act.title)}</span>
            <span class="${horizonBadgeClass}">${act.horizonLabel || 'Tenggat'}</span>
            ${act.isBlocked ? `
              <span class="badge-blocked">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 3px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Menunggu Prasyarat
              </span>
            ` : ''}
          </div>

          ${act.description ? `<div class="task-desc-text">${this.escapeHtml(act.description)}</div>` : ''}

          <div class="task-meta-bar">
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 4px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${act.dueDate || '-'}
            </span>
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              ${act.dueTime || '-'}
            </span>
            <span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 4px;"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
              ${act.category || 'Umum'}
            </span>
            ${hasVault ? `
              <span style="color: #38bdf8;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 4px;"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
                Vault: ${vaultLinkCount} Link / ${vaultFileCount} Berkas
              </span>
            ` : ''}
          </div>
        </div>

        <div class="task-action-btns">
          <button class="btn btn-secondary btn-sm" onclick="window.openEditActivityModal('${act.id}')" title="Edit Agenda & Deadline (atau klik kanan kartu)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.tempoAPI.testForcedAlert('${act.id}')" title="Uji Coba Notifikasi Paksa untuk Tugas Ini">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            Tes Alert
          </button>
          <button class="btn btn-outline btn-sm" onclick="window.deleteActivityPrompt('${act.id}')" title="Hapus Agenda">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `;
  }

  setFilter(filter) {
    this.currentFilter = filter;
    window.refreshApp();
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

window.AgendaView = AgendaView;
