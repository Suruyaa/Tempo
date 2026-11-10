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
    const urgentCount = activities.filter(a => a.priority === 'urgent' && a.status !== 'completed').length;

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
      <!-- Stats Summary Chips -->
      <div class="agenda-stats-bar">
        <div class="stat-chip">
          <div class="stat-icon" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">📋</div>
          <div>
            <div class="stat-val">${total}</div>
            <div class="stat-label">Total Agenda</div>
          </div>
        </div>
        <div class="stat-chip">
          <div class="stat-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">⏳</div>
          <div>
            <div class="stat-val">${pending}</div>
            <div class="stat-label">Sedang Berjalan</div>
          </div>
        </div>
        <div class="stat-chip">
          <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">✓</div>
          <div>
            <div class="stat-val">${completed}</div>
            <div class="stat-label">Tugas Selesai</div>
          </div>
        </div>
        <div class="stat-chip">
          <div class="stat-icon" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">🔥</div>
          <div>
            <div class="stat-val">${urgentCount}</div>
            <div class="stat-label">Mendesak / Urgent</div>
          </div>
        </div>
      </div>

      <!-- Action & Filter Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary ${this.currentFilter === 'all' ? 'btn-primary' : ''}" onclick="window.agendaView.setFilter('all')">Semua (${total})</button>
          <button class="btn btn-secondary ${this.currentFilter === 'pending' ? 'btn-primary' : ''}" onclick="window.agendaView.setFilter('pending')">Tertunda (${pending})</button>
          <button class="btn btn-secondary ${this.currentFilter === 'urgent' ? 'btn-primary' : ''}" onclick="window.agendaView.setFilter('urgent')">🔥 Mendesak (${urgentCount})</button>
          <button class="btn btn-secondary ${this.currentFilter === 'completed' ? 'btn-primary' : ''}" onclick="window.agendaView.setFilter('completed')">Selesai (${completed})</button>
        </div>
        <button class="btn btn-primary" onclick="window.openAddActivityModal()">
          ➕ Tambah Agenda Baru
        </button>
      </div>

      <!-- Agenda Cards List -->
      <div class="agenda-list-wrap">
        ${filtered.length === 0 ? `
          <div style="text-align: center; padding: 40px; color: #64748b; background: #131c31; border-radius: 14px; border: 1px dashed #334155;">
            Tidak ada agenda pada filter ini. Klik tombol <strong>+ Tambah Agenda Baru</strong> untuk mencatat.
          </div>
        ` : filtered.map(act => this.renderCard(act)).join('')}
      </div>
    `;
  }

  renderCard(act) {
    const isDone = act.status === 'completed';
    const prioClass = `prio-${act.priority || 'normal'}`;

    let horizonBadgeClass = 'badge-horizon-tag';
    if (act.horizonLabel && act.horizonLabel.includes('H-1')) horizonBadgeClass += ' badge-horizon-h1';
    if (act.horizonLabel && (act.horizonLabel.includes('Hari H') || act.horizonLabel.includes('Overdue'))) horizonBadgeClass += ' badge-horizon-urgent';

    const hasVault = act.vault && ((act.vault.links && act.vault.links.length > 0) || (act.vault.files && act.vault.files.length > 0));
    const vaultLinkCount = (act.vault && act.vault.links) ? act.vault.links.length : 0;
    const vaultFileCount = (act.vault && act.vault.files) ? act.vault.files.length : 0;

    return `
      <div class="agenda-item-card ${prioClass} ${isDone ? 'completed' : ''}">
        <div class="agenda-checkbox ${isDone ? 'checked' : ''}" onclick="window.tempoAPI.toggleComplete('${act.id}')">
          ${isDone ? '✓' : ''}
        </div>
        <div class="agenda-item-body">
          <div class="agenda-item-top">
            <span class="agenda-item-title">${this.escapeHtml(act.title)}</span>
            <span class="${horizonBadgeClass}">${act.horizonLabel || 'Tenggat'}</span>
            ${act.isBlocked ? '<span style="font-size: 11px; background: #475569; padding: 2px 6px; border-radius: 4px; color: #cbd5e1;">🔒 Menunggu Prasyarat</span>' : ''}
          </div>
          ${act.description ? `<div class="agenda-item-desc">${this.escapeHtml(act.description)}</div>` : ''}
          <div class="agenda-item-meta">
            <span>🗓️ ${act.dueDate || '-'} • ⏰ ${act.dueTime || '-'}</span>
            <span>🏷️ ${act.category || 'Umum'}</span>
            ${hasVault ? `<span style="color: #38bdf8;">🗄️ Vault: ${vaultLinkCount} Link / ${vaultFileCount} Berkas</span>` : ''}
          </div>
        </div>
        <div class="agenda-item-actions">
          <button class="btn btn-secondary btn-sm" onclick="window.tempoAPI.testForcedAlert('${act.id}')" title="Tes Tampilan Notifikasi Paksa">
            🚨 Tes Alert
          </button>
          <button class="btn btn-outline btn-sm" onclick="window.deleteActivityPrompt('${act.id}')" title="Hapus Agenda">
            🗑️
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
