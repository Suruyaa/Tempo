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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div>
          <h2 style="font-size: 18px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px;">
            🗄️ Activity Vault (Brankas Berkas & Tautan Tugas)
          </h2>
          <p style="font-size: 13px; color: #94a3b8; margin-top: 4px;">
            Simpan berkas dokumen draft dan tautan web penting per agenda. Bisa langsung dibuka otomatis dari notifikasi paksa!
          </p>
        </div>
      </div>

      <div class="vault-grid">
        ${this.activities.length === 0 ? `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b; background: #131c31; border-radius: 14px; border: 1px dashed #334155;">
            Belum ada agenda untuk menyimpan berkas vault.
          </div>
        ` : this.activities.map(act => this.renderVaultCard(act)).join('')}
      </div>
    `;
  }

  renderVaultCard(act) {
    const links = (act.vault && act.vault.links) ? act.vault.links : [];
    const files = (act.vault && act.vault.files) ? act.vault.files : [];

    return `
      <div class="vault-item-card">
        <div class="vault-item-header">
          <div>
            <div style="font-weight: 700; font-size: 15px; color: #fff;">${this.escapeHtml(act.title)}</div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">🗓️ ${act.dueDate || '-'} • ${act.horizonLabel || 'Tenggat'}</div>
          </div>
          <span style="font-size: 11px; background: #334155; color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-weight: 600;">
            ${act.category || 'Umum'}
          </span>
        </div>

        <!-- Tautan / Quick Links -->
        <div style="margin-top: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Tautan Web / Dokumen Online</span>
            <button class="btn btn-secondary btn-sm" onclick="window.promptAddVaultLink('${act.id}')">+ Tautan</button>
          </div>
          <div class="vault-links-list">
            ${links.length === 0 ? `
              <div style="font-size: 11px; color: #64748b; font-style: italic;">Belum ada tautan.</div>
            ` : links.map((l, idx) => `
              <div class="vault-row">
                <a href="#" onclick="window.tempoAPI.openExternal('${l.url}'); return false;" title="${l.url}">
                  🔗 ${this.escapeHtml(l.title || l.url)}
                </a>
                <button class="btn btn-outline btn-sm" onclick="window.tempoAPI.removeVaultLink('${act.id}', ${idx})" title="Hapus">✕</button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Berkas Komputer Lokal -->
        <div style="margin-top: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Berkas Komputer Lokal</span>
            <button class="btn btn-secondary btn-sm" onclick="window.tempoAPI.addVaultFile('${act.id}')">+ Lampirkan File</button>
          </div>
          <div class="vault-files-list">
            ${files.length === 0 ? `
              <div style="font-size: 11px; color: #64748b; font-style: italic;">Belum ada berkas terlampir.</div>
            ` : files.map(f => `
              <div class="vault-row">
                <a href="#" onclick="window.tempoAPI.openExternal('file:///${f.path.replace(/\\\\/g, '/')}'); return false;" title="${f.path}">
                  📄 ${this.escapeHtml(f.name)}
                </a>
                <span style="font-size: 10px; color: #10b981;">Tersimpan</span>
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
