class VaultView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.activities = [];
  }

  setData(activities) {
    this.activities = activities;
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="content-constrained">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 10px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                <rect x="1" y="3" width="22" height="5"></rect>
                <line x1="10" y1="12" x2="14" y2="12"></line>
              </svg>
              Activity Vault (Brankas Berkas &amp; Tautan)
            </h2>
            <p style="font-size: 13px; color: var(--text-dim); margin-top: 4px;">
              Simpan draft dokumen, spreadsheet, dan tautan online per agenda. Berkas terhubung dapat dibuka langsung 1-klik dari notifikasi paksa!
            </p>
          </div>
        </div>

        <div class="vault-masonry-grid">
          ${this.activities.length === 0 ? `
            <div style="grid-column: 1 / -1; text-align: center; padding: 48px; color: #64748b; background: var(--bg-surface); border-radius: var(--radius-xl); border: 1px dashed var(--border-subtle);">
              Belum ada agenda terdaftar untuk menampung berkas vault.
            </div>
          ` : this.activities.map(act => this.renderVaultCard(act)).join('')}
        </div>
      </div>
    `;
  }

  renderVaultCard(act) {
    const links = (act.vault && act.vault.links) ? act.vault.links : [];
    const files = (act.vault && act.vault.files) ? act.vault.files : [];

    return `
      <div class="vault-chest-card">
        <div class="vault-chest-header">
          <div>
            <div style="font-weight: 800; font-size: 16px; color: #fff;">${this.escapeHtml(act.title)}</div>
            <div style="font-size: 11px; color: var(--text-dim); margin-top: 4px; display: flex; align-items: center; gap: 6px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>${act.dueDate || '-'} • ${act.horizonLabel || 'Tenggat'}</span>
            </div>
          </div>
          <span style="font-size: 11px; background: #1e293b; color: #38bdf8; padding: 3px 8px; border-radius: 6px; font-weight: 700; border: 1px solid rgba(56, 189, 248, 0.3);">
            ${act.category || 'Umum'}
          </span>
        </div>

        <!-- Tautan Online -->
        <div style="margin-top: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Tautan Web / Dokumen Online</span>
            <button class="btn btn-secondary btn-sm" onclick="window.promptAddVaultLink('${act.id}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Tautan
            </button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${links.length === 0 ? `
              <div style="font-size: 11px; color: #64748b; font-style: italic;">Belum ada tautan web.</div>
            ` : links.map((l, idx) => `
              <div style="background: var(--bg-card); padding: 8px 12px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border-subtle);">
                <a href="#" onclick="window.tempoAPI.openExternal('${l.url}'); return false;" style="color: var(--accent-cyan); text-decoration: none; font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px; display: flex; align-items: center; gap: 6px;" title="${l.url}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                  <span>${this.escapeHtml(l.title || l.url)}</span>
                </a>
                <button class="btn btn-outline btn-sm" onclick="window.tempoAPI.removeVaultLink('${act.id}', ${idx})" title="Hapus">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Berkas Komputer Lokal -->
        <div style="margin-top: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Berkas Komputer Lokal</span>
            <button class="btn btn-secondary btn-sm" onclick="window.tempoAPI.addVaultFile('${act.id}')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Lampirkan File
            </button>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${files.length === 0 ? `
              <div style="font-size: 11px; color: #64748b; font-style: italic;">Belum ada berkas terlampir.</div>
            ` : files.map(f => `
              <div style="background: var(--bg-card); padding: 8px 12px; border-radius: var(--radius-sm); display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border-subtle);">
                <a href="#" onclick="window.tempoAPI.openExternal('file:///${f.path.replace(/\\\\/g, '/')}'); return false;" style="color: #cbd5e1; text-decoration: none; font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px; display: flex; align-items: center; gap: 6px;" title="${f.path}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                  <span>${this.escapeHtml(f.name)}</span>
                </a>
                <span style="font-size: 10px; color: #10b981; font-weight: 700; background: rgba(16, 185, 129, 0.1); padding: 2px 6px; border-radius: 4px;">Tersimpan</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

window.VaultView = VaultView;
