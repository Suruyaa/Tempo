// Logbook Jurnal Component with Markdown Import/Export
class LogbookView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.entries = [];
    this.completedActivities = [];
  }

  async loadData() {
    try {
      this.entries = await window.tempoAPI.getLogbookEntries();
      const allActs = await window.tempoAPI.getActivities();
      this.completedActivities = allActs.filter(a => a.status === 'completed');
    } catch (err) {
      console.error('Error loading logbook:', err);
    }
  }

  async render() {
    if (!this.container) return;
    await this.loadData();

    this.container.innerHTML = `
      <div class="content-constrained">
        <!-- Header & Action Bar -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
          <div>
            <h2 style="font-size: 20px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 10px;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              Logbook &amp; Jurnal Produktivitas
            </h2>
            <p style="font-size: 13px; color: var(--text-dim); margin-top: 4px;">
              Dokumentasikan refleksi harian, catatan evaluasi kerja, dan riwayat tugas terselesaikan. Mendukung ekspor dan impor format Markdown (.md).
            </p>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" onclick="window.logbookView.importMarkdown()" title="Impor Catatan dari Berkas .md">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Impor .MD
            </button>
            <button class="btn btn-secondary" onclick="window.logbookView.exportMarkdown()" title="Ekspor Seluruh Jurnal ke Berkas .md">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Ekspor .MD
            </button>
            <button class="btn btn-primary btn-glow" onclick="window.logbookView.openNewEntryModal()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Tulis Catatan Jurnal
            </button>
          </div>
        </div>

        <!-- 2-Column Section: Left (Journal Entries), Right (Completed Tasks Log) -->
        <div style="display: grid; grid-template-columns: 1.3fr 1fr; gap: 24px;">
          <!-- Left Column: Journal Reflections -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-dim);">
                Catatan Refleksi &amp; Jurnal Harian (${this.entries.length})
              </span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 14px;">
              ${this.entries.length === 0 ? `
                <div style="text-align: center; padding: 40px; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
                  Belum ada catatan jurnal. Klik <strong>Tulis Catatan Jurnal</strong> atau <strong>Impor .MD</strong> untuk memulai.
                </div>
              ` : this.entries.map(e => this.renderEntryCard(e)).join('')}
            </div>
          </div>

          <!-- Right Column: Completed Tasks Achievement History -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <span style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-dim);">
                Riwayat Tugas Selesai (${this.completedActivities.length})
              </span>
            </div>

            <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 18px; max-height: calc(100vh - 230px); overflow-y: auto;">
              ${this.completedActivities.length === 0 ? `
                <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">
                  Belum ada tugas yang diselesaikan.
                </div>
              ` : this.completedActivities.map(c => `
                <div style="padding: 12px 14px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); margin-bottom: 10px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style="font-size: 14px; font-weight: 700; color: #fff;">${this.escapeHtml(c.title)}</span>
                  </div>
                  <div style="display: flex; gap: 10px; font-size: 11px; color: var(--text-muted);">
                    <span>Kategori: ${this.escapeHtml(c.category || 'Umum')}</span>
                    <span>Deadline: ${c.dueDate || '-'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Tulis Catatan Jurnal -->
      <div id="modalAddLogbook" class="modal-backdrop hidden">
        <div class="modal-card" style="width: 580px;">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <div class="modal-title-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </div>
              <div>
                <h2>Tulis Catatan Jurnal Baru</h2>
                <p class="modal-subtitle">Catat evaluasi harian, rangkuman, atau ide penting</p>
              </div>
            </div>
            <button class="btn-close-modal" onclick="window.logbookView.closeModal()">&times;</button>
          </div>

          <form id="formAddLogbook" style="display: flex; flex-direction: column; gap: 16px; padding: 20px 24px;" onsubmit="window.logbookView.handleSaveEntry(event)">
            <div class="form-group">
              <label for="logTitle">Judul Catatan / Refleksi <span class="required">*</span></label>
              <input type="text" id="logTitle" placeholder="Contoh: Evaluasi Progres Proyek & Rencana Besok" required autofocus>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label for="logDate">Tanggal</label>
                <input type="date" id="logDate" required>
              </div>
              <div class="form-group flex-1">
                <label for="logTags">Tag / Kategori</label>
                <input type="text" id="logTags" placeholder="Sprint, Evaluasi, Ide..." value="Refleksi">
              </div>
            </div>

            <div class="form-group">
              <label for="logContent">Isi Catatan (Mendukung Format Teks &amp; Markdown)</label>
              <textarea id="logContent" rows="6" placeholder="Tuliskan apa saja pencapaian hari ini, kendala yang dihadapi, atau rencana tindakan selanjutnya..." required></textarea>
            </div>

            <div class="modal-actions-full">
              <button type="button" class="btn btn-secondary" onclick="window.logbookView.closeModal()">Batal</button>
              <button type="submit" class="btn btn-primary btn-glow">Simpan ke Jurnal</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  renderEntryCard(entry) {
    const tags = entry.tags || [];
    return `
      <div class="vault-chest-card" style="padding: 18px 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div>
            <div style="font-weight: 800; font-size: 15px; color: #fff;">${this.escapeHtml(entry.title)}</div>
            <div style="font-size: 11px; color: var(--text-dim); margin-top: 3px;">
              Tanggal: ${entry.date || '-'}
            </div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="window.logbookView.deleteEntryPrompt('${entry.id}')" title="Hapus Catatan">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>

        <div style="font-size: 13px; color: #cbd5e1; line-height: 1.5; white-space: pre-wrap; margin-bottom: 12px; background: rgba(0, 0, 0, 0.2); padding: 10px 12px; border-radius: var(--radius-sm); border: 1px solid rgba(255, 255, 255, 0.05);">${this.escapeHtml(entry.content)}</div>

        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          ${tags.map(t => `<span style="font-size: 10px; font-weight: 700; background: #1e293b; color: #38bdf8; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3);">${this.escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
    `;
  }

  openNewEntryModal() {
    const modal = document.getElementById('modalAddLogbook');
    if (modal) {
      modal.classList.remove('hidden');
      const dateInput = document.getElementById('logDate');
      if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }
    }
  }

  closeModal() {
    const modal = document.getElementById('modalAddLogbook');
    if (modal) modal.classList.add('hidden');
  }

  async handleSaveEntry(e) {
    e.preventDefault();
    const title = document.getElementById('logTitle').value;
    const date = document.getElementById('logDate').value;
    const content = document.getElementById('logContent').value;
    const rawTags = document.getElementById('logTags').value;
    const tags = rawTags.split(',').map(t => t.trim()).filter(t => t.length > 0);

    await window.tempoAPI.addLogbookEntry({ title, date, content, tags });
    this.closeModal();
    this.render();
  }

  async exportMarkdown() {
    const res = await window.tempoAPI.exportLogbookMD();
    if (res.success) {
      window.showCustomAlert('Berhasil Mengekspor Logbook', `File Markdown berhasil disimpan di:\n${res.filePath}`);
    }
  }

  async importMarkdown() {
    const res = await window.tempoAPI.importLogbookMD();
    if (res.success) {
      window.showCustomAlert('Impor Berhasil', `Berhasil mengimpor ${res.count} entri catatan ke dalam Logbook.`);
      this.render();
    }
  }

  deleteEntryPrompt(id) {
    window.showConfirmDialog(
      'Hapus Catatan Jurnal',
      'Apakah Anda yakin ingin menghapus catatan jurnal ini? Tindakan ini tidak dapat dibatalkan.',
      async () => {
        await window.tempoAPI.deleteLogbookEntry(id);
        this.render();
      }
    );
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

window.LogbookView = LogbookView;
