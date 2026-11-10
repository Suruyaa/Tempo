class CalendarView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentDate = new Date(); // default tanggal saat ini
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

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Minggu
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
    if (this.holidaysData) {
      if (this.holidaysData.national_holidays_id) {
        this.holidaysData.national_holidays_id.forEach(h => {
          holidayMap[h.date] = h;
        });
      }
      // Peringatan nasional (MM-DD)
      const obsIdMap = {};
      if (this.holidaysData.national_observances_id) {
        this.holidaysData.national_observances_id.forEach(o => {
          obsIdMap[o.month_day] = o;
        });
      }
      // Peringatan internasional (MM-DD)
      const obsIntMap = {};
      if (this.holidaysData.international_observances) {
        this.holidaysData.international_observances.forEach(o => {
          obsIntMap[o.month_day] = o;
        });
      }

      this.obsIdMap = obsIdMap;
      this.obsIntMap = obsIntMap;
    }
    this.holidayMap = holidayMap;

    // Siapkan kotak kalender
    let cellsHtml = '';
    // Kosongkan hari sebelum tanggal 1
    for (let i = 0; i < firstDayIndex; i++) {
      cellsHtml += `<div class="cal-cell" style="opacity: 0.2; pointer-events: none;"></div>`;
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
      const obsId = this.obsIdMap ? this.obsIdMap[monthDayKey] : null;
      const obsInt = this.obsIntMap ? this.obsIntMap[monthDayKey] : null;
      const dayActivities = actMap[dateKey] || [];

      let cellClasses = 'cal-cell';
      if (isToday) cellClasses += ' today';
      if (holiday) cellClasses += ' is-holiday';
      if (isSelected) cellClasses += ' selected';

      cellsHtml += `
        <div class="${cellClasses}" onclick="window.calendarView.selectDate('${dateKey}')">
          <div class="cal-cell-num">${day}</div>
          ${holiday ? `<div class="cal-event-pill event-holiday" title="${holiday.name}">🔴 ${holiday.name}</div>` : ''}
          ${obsId ? `<div class="cal-event-pill event-observance" title="${obsId.name}">🇮🇩 ${obsId.name}</div>` : ''}
          ${obsInt ? `<div class="cal-event-pill event-observance" title="${obsInt.name}">🌐 ${obsInt.name}</div>` : ''}
          ${dayActivities.map(a => `
            <div class="cal-event-pill event-user-activity" title="${a.title}">📌 ${a.title}</div>
          `).join('')}
        </div>
      `;
    }

    // Render Side Panel Info untuk tanggal terpilih
    const selectedHoliday = holidayMap[this.selectedDateStr];
    const selMonthDay = this.selectedDateStr ? this.selectedDateStr.substring(5) : '';
    const selectedObsId = this.obsIdMap ? this.obsIdMap[selMonthDay] : null;
    const selectedObsInt = this.obsIntMap ? this.obsIntMap[selMonthDay] : null;
    const selectedActs = actMap[this.selectedDateStr] || [];

    this.container.innerHTML = `
      <div class="calendar-layout">
        <div class="bento-card calendar-grid-card">
          <div class="calendar-header-nav">
            <h2 class="calendar-title-month">🗓️ ${monthNames[month]} ${year}</h2>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" onclick="window.calendarView.prevMonth()">◀ Bulan Lalu</button>
              <button class="btn btn-secondary btn-sm" onclick="window.calendarView.todayMonth()">Bulan Ini</button>
              <button class="btn btn-secondary btn-sm" onclick="window.calendarView.nextMonth()">Bulan Depan ▶</button>
            </div>
          </div>

          <div class="calendar-days-header">
            <div style="color: #f87171;">Minggu</div>
            <div>Senin</div>
            <div>Selasa</div>
            <div>Rabu</div>
            <div>Kamis</div>
            <div>Jumat</div>
            <div style="color: #38bdf8;">Sabtu</div>
          </div>

          <div class="calendar-grid-cells">
            ${cellsHtml}
          </div>
        </div>

        <!-- Sidebar Detail Tanggal Terpilih -->
        <div class="bento-card">
          <div class="bento-header">
            <h3 class="bento-title">📍 Detail Tanggal</h3>
            <span style="font-size: 13px; color: var(--accent-cyan); font-weight: 700;">${this.selectedDateStr}</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 14px; overflow-y: auto; flex: 1;">
            <!-- Libur Nasional -->
            <div>
              <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Hari Libur Nasional</div>
              ${selectedHoliday ? `
                <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); padding: 10px 12px; border-radius: 8px; color: #fca5a5; font-size: 13px; font-weight: 700;">
                  🔴 ${selectedHoliday.name} (Tanggal Merah Resmi)
                </div>
              ` : '<div style="font-size: 12px; color: #94a3b8;">Bukan hari libur nasional resmi.</div>'}
            </div>

            <!-- Hari Peringatan -->
            <div>
              <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Hari Besar / Peringatan</div>
              ${(selectedObsId || selectedObsInt) ? `
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  ${selectedObsId ? `<div style="background: rgba(168, 85, 247, 0.15); border: 1px solid rgba(168, 85, 247, 0.4); padding: 8px 12px; border-radius: 8px; color: #d8b4fe; font-size: 12px; font-weight: 600;">🇮🇩 ${selectedObsId.name}</div>` : ''}
                  ${selectedObsInt ? `<div style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); padding: 8px 12px; border-radius: 8px; color: #7dd3fc; font-size: 12px; font-weight: 600;">🌐 ${selectedObsInt.name}</div>` : ''}
                </div>
              ` : '<div style="font-size: 12px; color: #94a3b8;">Tidak ada hari peringatan tercatat.</div>'}
            </div>

            <!-- Agenda Pengguna pada Tanggal ini -->
            <div style="flex: 1;">
              <div style="font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px;">Agenda Anda di Tanggal Ini (${selectedActs.length})</div>
              ${selectedActs.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  ${selectedActs.map(a => `
                    <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; font-size: 13px;">
                      <div style="font-weight: 700; color: #fff;">${a.title}</div>
                      <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">⏰ ${a.dueTime || '-'} • Prioritas: ${a.priority}</div>
                    </div>
                  `).join('')}
                </div>
              ` : '<div style="font-size: 12px; color: #94a3b8;">Tidak ada agenda deadline di tanggal ini.</div>'}
            </div>

            <button class="btn btn-primary" onclick="window.openAddActivityWithDate('${this.selectedDateStr}')" style="width: 100%; justify-content: center;">
              ➕ Buat Agenda di Tanggal Ini
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
}

window.CalendarView = CalendarView;
