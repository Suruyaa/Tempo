// Logbook Jurnal Component with Clean Modern Canvas Editor & Markdown Import/Export
class LogbookView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.entries = [];
    this.completedActivities = [];
    this.editingEntryId = null;
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
              Dokumentasikan refleksi harian, evaluasi sprint, dan catatan pencapaian kerja. Mendukung format Markdown (.md) dan penyuntingan langsung.
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
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
              <span style="font-size: 11px; color: var(--text-muted);">Klik kanan / titik 3 untuk edit</span>
            </div>

            <div style="display: flex; flex-direction: column; gap: 14px;">
              ${this.entries.length === 0 ? `
                <div style="text-align: center; padding: 48px; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
                  Belum ada catatan jurnal. Klik <strong>Tulis Catatan Jurnal</strong> atau gunakan tombol <strong>Ke Jurnal</strong> di Quick Scratchpad untuk memulai.
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

      <!-- MODAL CANVAS EDITOR JURNAL (CLEAN MODERN WRITING EXPERIENCE) -->
      <div id="modalAddLogbook" class="modal-backdrop hidden">
        <div class="modal-card modal-canvas-editor">
          <!-- Editor Top Control Bar -->
          <div class="canvas-editor-topbar">
            <div class="canvas-editor-breadcrumb">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              <span id="canvasEditorModalTitle">Catatan Jurnal &amp; Refleksi</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.logbookView.closeModal()">Batal</button>
              <button type="button" class="btn btn-primary btn-glow btn-sm" onclick="document.getElementById('formAddLogbook').requestSubmit()">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Simpan
              </button>
              <button class="btn-close-modal" onclick="window.logbookView.closeModal()" title="Tutup" style="margin-left: 4px;">&times;</button>
            </div>
          </div>

          <!-- Canvas Form Body -->
          <form id="formAddLogbook" class="canvas-editor-form" onsubmit="window.logbookView.handleSaveEntry(event)">
            <!-- Borderless Big Title Input -->
            <input type="text" id="logTitle" class="canvas-title-input" placeholder="Judul Catatan..." required autofocus autocomplete="off">

            <!-- Metadata Properties Strip -->
            <div class="canvas-properties-strip">
              <div class="canvas-property-item">
                <span class="prop-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Tanggal
                </span>
                <input type="date" id="logDate" class="canvas-prop-input" required>
              </div>

              <div class="canvas-property-item">
                <span class="prop-label">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                  Tags
                </span>
                <input type="text" id="logTags" class="canvas-prop-input" placeholder="Refleksi, Sprint, Ide..." value="Refleksi">
              </div>
            </div>

            <div class="canvas-divider"></div>

            <!-- Borderless Long-Form Text Canvas -->
            <textarea id="logContent" class="canvas-textarea-body" rows="12" placeholder="Tuliskan refleksi harian, rangkuman rapat, ide terobosan, atau evaluasi kerja di sini...&#10;&#10;Mendukung format bebas, Markdown (# Heading, - Checklist), dan bullet points." required></textarea>
          </form>
        </div>
      </div>
    `;
  }

  renderEntryCard(entry) {
    const tags = entry.tags || [];
    return `
      <div class="vault-chest-card" style="padding: 18px 20px;" oncontextmenu="window.logbookView.openEditModal('${entry.id}'); return false;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div>
            <div style="font-weight: 800; font-size: 15px; color: #fff; cursor: pointer;" onclick="window.logbookView.openEditModal('${entry.id}')" title="Klik untuk edit catatan">
              ${this.escapeHtml(entry.title)}
            </div>
            <div style="font-size: 11px; color: var(--text-dim); margin-top: 3px;">
              Tanggal: ${entry.date || '-'}
            </div>
          </div>
          <div style="display: flex; gap: 6px; flex-shrink: 0;">
            <button class="btn btn-secondary btn-sm" onclick="window.logbookView.openEditModal('${entry.id}')" title="Edit Catatan (atau klik kanan kartu)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </button>
            <button class="btn btn-outline btn-sm" onclick="window.logbookView.deleteEntryPrompt('${entry.id}')" title="Hapus Catatan">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <div style="font-size: 13px; color: #cbd5e1; line-height: 1.6; white-space: pre-wrap; margin-bottom: 12px; background: rgba(0, 0, 0, 0.2); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid rgba(255, 255, 255, 0.05);">${this.escapeHtml(entry.content)}</div>

        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          ${tags.map(t => `<span style="font-size: 10px; font-weight: 700; background: #1e293b; color: #38bdf8; padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(56, 189, 248, 0.3);">${this.escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
    `;
  }

  openNewEntryModal() {
    this.editingEntryId = null;
    const modal = document.getElementById('modalAddLogbook');
    const titleEl = document.getElementById('canvasEditorModalTitle');
    const titleInput = document.getElementById('logTitle');
    const dateInput = document.getElementById('logDate');
    const tagsInput = document.getElementById('logTags');
    const contentInput = document.getElementById('logContent');

    if (titleEl) titleEl.textContent = 'Catatan Jurnal Baru';
    if (titleInput) titleInput.value = '';
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    if (tagsInput) tagsInput.value = 'Refleksi';
    if (contentInput) contentInput.value = '';

    if (modal) {
      modal.classList.remove('hidden');
      setTimeout(() => titleInput?.focus(), 60);
    }
  }

  openEditModal(id) {
    const entry = this.entries.find(e => e.id === id);
    if (!entry) return;

    this.editingEntryId = id;
    const modal = document.getElementById('modalAddLogbook');
    const titleEl = document.getElementById('canvasEditorModalTitle');
    const titleInput = document.getElementById('logTitle');
    const dateInput = document.getElementById('logDate');
    const tagsInput = document.getElementById('logTags');
    const contentInput = document.getElementById('logContent');

    if (titleEl) titleEl.textContent = 'Edit Catatan Jurnal';
    if (titleInput) titleInput.value = entry.title || '';
    if (dateInput) dateInput.value = entry.date || new Date().toISOString().split('T')[0];
    if (tagsInput) tagsInput.value = (entry.tags || []).join(', ');
    if (contentInput) contentInput.value = entry.content || '';

    if (modal) {
      modal.classList.remove('hidden');
      setTimeout(() => titleInput?.focus(), 60);
    }
  }

  closeModal() {
    const modal = document.getElementById('modalAddLogbook');
    if (modal) modal.classList.add('hidden');
    this.editingEntryId = null;
  }

  async handleSaveEntry(e) {
    e.preventDefault();
    const title = document.getElementById('logTitle').value.trim();
    const date = document.getElementById('logDate').value;
    const content = document.getElementById('logContent').value.trim();
    const rawTags = document.getElementById('logTags').value;
    const tags = rawTags.split(',').map(t => t.trim()).filter(t => t.length > 0);

    if (!title) return;

    if (this.editingEntryId) {
      await window.tempoAPI.updateLogbookEntry(this.editingEntryId, { title, date, content, tags });
    } else {
      await window.tempoAPI.addLogbookEntry({ title, date, content, tags });
    }

    this.closeModal();
    await this.render();
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
