class CalendarView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentDate = new Date();
    this.selectedDateStr = this.formatDate(this.currentDate);
    this.holidaysData = null;
    this.activities = [];
  }

  setData(holidays, activities) {
    this.holidaysData = holidays;
    this.activities = activities;
  }

  render() {
    if (!this.container) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Mapping kegiatan per tanggal (YYYY-MM-DD)
    const actMap = {};
    this.activities.forEach(a => {
      if (a.dueDate) {
        if (!actMap[a.dueDate]) actMap[a.dueDate] = [];
        actMap[a.dueDate].push(a);
      }
    });

    // Mapping hari libur & peringatan
    const holidayMap = {};
    const obsIdMap = {};
    const obsIntMap = {};

    if (this.holidaysData) {
      if (this.holidaysData.national_holidays_id) {
        this.holidaysData.national_holidays_id.forEach(h => {
          holidayMap[h.date] = h;
        });
      }
      if (this.holidaysData.national_observances_id) {
        this.holidaysData.national_observances_id.forEach(o => {
          obsIdMap[o.month_day] = o;
        });
      }
      if (this.holidaysData.international_observances) {
        this.holidaysData.international_observances.forEach(o => {
          obsIntMap[o.month_day] = o;
        });
      }
    }
    this.holidayMap = holidayMap;
    this.obsIdMap = obsIdMap;
    this.obsIntMap = obsIntMap;

    let cellsHtml = '';
    for (let i = 0; i < firstDayIndex; i++) {
      cellsHtml += `<div class="cal-day-cell" style="opacity: 0.15; pointer-events: none;"></div>`;
    }

    const todayStr = this.formatDate(new Date());

    for (let day = 1; day <= totalDays; day++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;
      const monthDayKey = `${monthStr}-${dayStr}`;

      const isToday = dateKey === todayStr;
      const isSelected = dateKey === this.selectedDateStr;
      const holiday = holidayMap[dateKey];
      const obsId = obsIdMap[monthDayKey];
      const obsInt = obsIntMap[monthDayKey];
      const dayActivities = actMap[dateKey] || [];

      let cellClasses = 'cal-day-cell';
      if (isToday) cellClasses += ' today';
      if (holiday) cellClasses += ' is-holiday';
      if (isSelected) cellClasses += ' selected';

      cellsHtml += `
        <div class="${cellClasses}" onclick="window.calendarView.selectDate('${dateKey}')">
          <div class="cal-day-num">${day}</div>
          
          ${holiday ? `
            <div class="cal-tag-pill tag-holiday" title="${this.escapeHtml(holiday.name)}">
              <span class="holiday-dot-indicator"></span>
              <span class="cal-tag-label">${this.escapeHtml(holiday.name)}</span>
            </div>
          ` : ''}

          ${obsId ? `
            <div class="cal-tag-pill tag-observance-id" title="Nasional: ${this.escapeHtml(obsId.name)}">
              <span class="flag-indonesia-icon"></span>
              <span class="cal-tag-label">${this.escapeHtml(obsId.name)}</span>
            </div>
          ` : ''}

          ${obsInt ? `
            <div class="cal-tag-pill tag-observance-int" title="${this.escapeHtml(obsInt.source || 'UN')}: ${this.escapeHtml(obsInt.name)}">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span class="cal-tag-label">${this.escapeHtml(obsInt.name)}</span>
            </div>
          ` : ''}

          ${dayActivities.map(a => `
            <div class="cal-tag-pill tag-task" title="${this.escapeHtml(a.title)}">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 14 14"></polyline>
              </svg>
              <span class="cal-tag-label">${this.escapeHtml(a.title)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    const selectedHoliday = holidayMap[this.selectedDateStr];
    const selMonthDay = this.selectedDateStr ? this.selectedDateStr.substring(5) : '';
    const selectedObsId = obsIdMap[selMonthDay];
    const selectedObsInt = obsIntMap[selMonthDay];
    const selectedActs = actMap[this.selectedDateStr] || [];

    this.container.innerHTML = `
      <div class="calendar-split-container">
        <!-- Main Calendar Grid Card -->
        <div class="cal-card-main">
          <div class="cal-nav-row">
            <h2 class="cal-month-heading" style="display: flex; align-items: center; gap: 8px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              ${monthNames[month]} ${year}
            </h2>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" onclick="window.calendarView.prevMonth()" title="Bulan Sebelumnya">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                Bulan Lalu
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window.calendarView.todayMonth()">Bulan Ini</button>
              <button class="btn btn-secondary btn-sm" onclick="window.calendarView.nextMonth()" title="Bulan Selanjutnya">
                Bulan Depan
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>

          <div class="cal-weekdays-strip">
            <div style="color: #f87171;">Minggu</div>
            <div>Senin</div>
            <div>Selasa</div>
            <div>Rabu</div>
            <div>Kamis</div>
            <div>Jumat</div>
            <div style="color: #38bdf8;">Sabtu</div>
          </div>

          <div class="cal-days-matrix">
            ${cellsHtml}
          </div>
        </div>

        <!-- Sidebar Date Inspector (Informasi & Konteks Edukatif) -->
        <div class="cal-card-main" style="max-height: 100%; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle);">
            <h3 style="font-size: 15px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              Info &amp; Konteks Tanggal
            </h3>
            <span style="font-size: 13px; color: var(--accent-cyan); font-weight: 700;">${this.selectedDateStr}</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            <!-- 1. HARI LIBUR NASIONAL -->
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Hari Libur Nasional Resmi</div>
              ${selectedHoliday ? `
                <div class="holiday-inspector-box">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span class="holiday-dot-indicator" style="width: 10px; height: 10px;"></span>
                    <strong style="font-size: 14px; color: #fca5a5;">${this.escapeHtml(selectedHoliday.name)}</strong>
                  </div>
                  <div class="inspector-badge badge-merah-skb">SKB 3 Menteri • Tanggal Merah</div>
                  <p class="inspector-desc-text">
                    ${this.escapeHtml(selectedHoliday.description || 'Hari libur resmi nasional Republik Indonesia.')}
                  </p>
                </div>
              ` : '<div style="font-size: 12px; color: #94a3b8; font-style: italic;">Bukan hari libur nasional resmi.</div>'}
            </div>

            <!-- 2. HARI PERINGATAN NASIONAL (INDONESIA) -->
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Peringatan Nasional Indonesia</div>
              ${selectedObsId ? `
                <div class="observance-id-inspector-box">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span class="flag-indonesia-icon" style="width: 18px; height: 12px;"></span>
                    <strong style="font-size: 14px; color: #fecdd3;">${this.escapeHtml(selectedObsId.name)}</strong>
                  </div>
                  <div class="inspector-badge badge-nasional-ri">Peringatan Bersejarah RI</div>
                  <p class="inspector-desc-text">
                    ${this.escapeHtml(selectedObsId.description)}
                  </p>
                </div>
              ` : '<div style="font-size: 12px; color: #94a3b8; font-style: italic;">Tidak ada peringatan nasional di tanggal ini.</div>'}
            </div>

            <!-- 3. HARI PERINGATAN INTERNASIONAL (UN / UNESCO) -->
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Hari Internasional (PBB &amp; UNESCO)</div>
              ${selectedObsInt ? `
                <div class="observance-int-inspector-box">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                    <strong style="font-size: 14px; color: #bae6fd;">${this.escapeHtml(selectedObsInt.name)}</strong>
                  </div>
                  <div class="inspector-badge badge-unesco-un">${this.escapeHtml(selectedObsInt.source || 'United Nations & UNESCO')}</div>
                  <p class="inspector-desc-text">
                    ${this.escapeHtml(selectedObsInt.description)}
                  </p>
                </div>
              ` : '<div style="font-size: 12px; color: #94a3b8; font-style: italic;">Tidak ada peringatan internasional di tanggal ini.</div>'}
            </div>

            <!-- 4. AGENDA PENGGUNA -->
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">
                Tenggat Tugas Anda (${selectedActs.length})
              </div>
              ${selectedActs.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${selectedActs.map(a => `
                    <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; font-size: 13px;">
                      <div style="font-weight: 700; color: #fff;">${this.escapeHtml(a.title)}</div>
                      <div style="font-size: 11px; color: #94a3b8; margin-top: 4px; display: flex; align-items: center; gap: 4px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        Jam: ${a.dueTime || '-'} • Prioritas: ${a.priority}
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : '<div style="font-size: 12px; color: #94a3b8; font-style: italic;">Belum ada agenda di tanggal ini.</div>'}
            </div>

            <button class="btn btn-primary btn-glow" onclick="window.openAddActivityWithDate('${this.selectedDateStr}')" style="width: 100%; justify-content: center; margin-top: 8px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Tambah Agenda di Tanggal Ini
            </button>
          </div>
        </div>
      </div>
    `;
  }

  selectDate(dateKey) {
    this.selectedDateStr = dateKey;
    this.render();
  }

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.render();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.render();
  }

  todayMonth() {
    this.currentDate = new Date();
    this.selectedDateStr = this.formatDate(this.currentDate);
    this.render();
  }

  formatDate(d) {
    return d.toISOString().split('T')[0];
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

window.CalendarView = CalendarView;
