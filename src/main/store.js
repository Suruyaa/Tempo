const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');
const SAMPLE_FILE = path.join(DATA_DIR, 'activities.sample.json');
const HOLIDAYS_FILE = path.join(DATA_DIR, 'holidays.json');
const VAULT_DIR = path.join(DATA_DIR, 'vault');

const SCRATCHPAD_FILE = path.join(DATA_DIR, 'scratchpad.json');
const LOGBOOK_FILE = path.join(DATA_DIR, 'logbook.json');

// Pastikan direktori data dan vault ada
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

class Store {
  constructor() {
    this.snoozedAlerts = new Map(); // id -> timestamp un-snooze
    this.dismissedHorizonAlerts = new Set(); // key: "id:horizon" (e.g. "act-1:h-1")
    this.ensureDataFile();
  }

  ensureDataFile() {
    if (!fs.existsSync(ACTIVITIES_FILE)) {
      if (fs.existsSync(SAMPLE_FILE)) {
        fs.copyFileSync(SAMPLE_FILE, ACTIVITIES_FILE);
      } else {
        fs.writeFileSync(ACTIVITIES_FILE, JSON.stringify([], null, 2), 'utf-8');
      }
    }
  }

  getActivities() {
    this.ensureDataFile();
    try {
      const raw = fs.readFileSync(ACTIVITIES_FILE, 'utf-8');
      const data = JSON.parse(raw);
      return this.computeStatuses(data);
    } catch (err) {
      console.error('[Store] Error reading activities:', err);
      return [];
    }
  }

  saveActivities(activities) {
    try {
      fs.writeFileSync(ACTIVITIES_FILE, JSON.stringify(activities, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('[Store] Error saving activities:', err);
      return false;
    }
  }

  addActivity(activity) {
    const list = this.getActivities();
    const newId = activity.id || 'act-' + Date.now();
    const newActivity = {
      id: newId,
      title: activity.title || 'Agenda Tanpa Judul',
      description: activity.description || '',
      category: activity.category || 'Umum',
      priority: activity.priority || 'normal', // normal, high, urgent
      dueDate: activity.dueDate || new Date().toISOString().split('T')[0],
      dueTime: activity.dueTime || '12:00',
      status: activity.status || 'pending', // pending, in_progress, completed
      reminderHorizon: activity.reminderHorizon || ['h-1', 'h-0'],
      dependencies: activity.dependencies || [],
      vault: activity.vault || { links: [], files: [] },
      createdAt: new Date().toISOString()
    };
    list.push(newActivity);
    this.saveActivities(list);
    return newActivity;
  }

  updateActivity(id, updates) {
    const list = this.getActivities();
    const index = list.findIndex(a => a.id === id);
    if (index === -1) return null;

    list[index] = { ...list[index], ...updates };
    this.saveActivities(list);
    return list[index];
  }

  deleteActivity(id) {
    let list = this.getActivities();
    const beforeCount = list.length;
    list = list.filter(a => a.id !== id);
    // Hapus juga dari dependensi item lain
    list.forEach(a => {
      if (a.dependencies && a.dependencies.includes(id)) {
        a.dependencies = a.dependencies.filter(depId => depId !== id);
      }
    });
    this.saveActivities(list);
    return list.length < beforeCount;
  }

  toggleComplete(id) {
    const list = this.getActivities();
    const item = list.find(a => a.id === id);
    if (!item) return null;

    if (item.status === 'completed') {
      item.status = 'in_progress';
      delete item.completedAt;
    } else {
      item.status = 'completed';
      item.completedAt = new Date().toISOString();
    }
    this.saveActivities(list);
    return item;
  }

  getHolidays() {
    try {
      if (fs.existsSync(HOLIDAYS_FILE)) {
        const raw = fs.readFileSync(HOLIDAYS_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[Store] Error reading holidays:', err);
    }
    return { national_holidays_id: [], national_observances_id: [], international_observances: [] };
  }

  computeStatuses(activities) {
    const completedIds = new Set(
      activities.filter(a => a.status === 'completed').map(a => a.id)
    );

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();

    return activities.map(act => {
      const isBlocked = act.dependencies && act.dependencies.some(depId => !completedIds.has(depId));
      
      // Hitung sisa hari (Horizon) berdasarkan selisih hari kalender
      let daysRemaining = null;
      let isOverdue = false;
      let horizonLabel = '';

      if (act.dueDate) {
        const parts = act.dueDate.split('-').map(Number);
        const dueMidnight = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0).getTime();
        const calendarDayDiff = Math.round((dueMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

        const dueDateTime = new Date(`${act.dueDate}T${act.dueTime || '23:59:59'}`);
        const diffMs = dueDateTime.getTime() - now.getTime();

        daysRemaining = calendarDayDiff;

        if (diffMs < 0 && act.status !== 'completed') {
          isOverdue = true;
          horizonLabel = 'Terlewat (Overdue)';
        } else if (calendarDayDiff <= 0) {
          horizonLabel = 'Hari H';
        } else if (calendarDayDiff === 1) {
          horizonLabel = 'H-1';
        } else {
          horizonLabel = `H-${calendarDayDiff}`;
        }
      }

      return {
        ...act,
        isBlocked,
        isOverdue,
        daysRemaining,
        horizonLabel
      };
    });
  }

  snooze(id, minutes = 15) {
    const wakeTime = Date.now() + (minutes * 60 * 1000);
    this.snoozedAlerts.set(id, wakeTime);
  }

  isSnoozed(id) {
    if (!this.snoozedAlerts.has(id)) return false;
    const wakeTime = this.snoozedAlerts.get(id);
    if (Date.now() >= wakeTime) {
      this.snoozedAlerts.delete(id);
      return false;
    }
    return true;
  }

  dismissHorizon(id, horizon) {
    this.dismissedHorizonAlerts.add(`${id}:${horizon}`);
  }

  isDismissed(id, horizon) {
    return this.dismissedHorizonAlerts.has(`${id}:${horizon}`);
  }

  getScratchpad() {
    try {
      if (fs.existsSync(SCRATCHPAD_FILE)) {
        return fs.readFileSync(SCRATCHPAD_FILE, 'utf-8');
      }
    } catch (err) {
      console.error('[Store] Error reading scratchpad:', err);
    }
    return '';
  }

  saveScratchpad(content) {
    try {
      fs.writeFileSync(SCRATCHPAD_FILE, content, 'utf-8');
      return true;
    } catch (err) {
      console.error('[Store] Error saving scratchpad:', err);
      return false;
    }
  }

  getLogbookEntries() {
    try {
      if (fs.existsSync(LOGBOOK_FILE)) {
        const raw = fs.readFileSync(LOGBOOK_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('[Store] Error reading logbook:', err);
    }
    // Default initial sample entries
    const initial = [
      {
        id: 'log-1',
        title: 'Review Awal Sprint & Refleksi Roadmap',
        date: '2026-11-10',
        content: 'Hari ini berhasil merampungkan struktur data awal dan setup repository. Fokus berikutnya adalah menyelesaikan draft dokumen dan sinkronisasi ke stakeholder.',
        tags: ['Refleksi', 'Sprint']
      }
    ];
    this.saveLogbookEntries(initial);
    return initial;
  }

  saveLogbookEntries(entries) {
    try {
      fs.writeFileSync(LOGBOOK_FILE, JSON.stringify(entries, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('[Store] Error saving logbook:', err);
      return false;
    }
  }

  addLogbookEntry(entry) {
    const list = this.getLogbookEntries();
    const newEntry = {
      id: 'log-' + Date.now(),
      title: entry.title || 'Catatan Jurnal',
      date: entry.date || new Date().toISOString().split('T')[0],
      content: entry.content || '',
      tags: entry.tags || ['Umum'],
      createdAt: new Date().toISOString()
    };
    list.unshift(newEntry);
    this.saveLogbookEntries(list);
    return newEntry;
  }

  updateLogbookEntry(id, updates) {
    const list = this.getLogbookEntries();
    const index = list.findIndex(e => e.id === id);
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveLogbookEntries(list);
    return list[index];
  }

  deleteLogbookEntry(id) {
    let list = this.getLogbookEntries();
    list = list.filter(e => e.id !== id);
    this.saveLogbookEntries(list);
    return true;
  }

  exportLogbookMarkdown() {
    const entries = this.getLogbookEntries();
    const activities = this.getActivities();
    const completed = activities.filter(a => a.status === 'completed');

    let md = `# TEMPO Logbook & Jurnal Produktivitas\n\n`;
    md += `*Diekspor pada: ${new Date().toLocaleString('id-ID')}*\n\n`;

    md += `## Catatan Jurnal & Refleksi Harian\n\n`;
    if (entries.length === 0) {
      md += `*Belum ada entri catatan jurnal.*\n\n`;
    } else {
      entries.forEach((e) => {
        md += `### ${e.title}\n`;
        md += `- **Tanggal:** ${e.date || '-'}\n`;
        if (e.tags && e.tags.length > 0) md += `- **Tags:** ${e.tags.join(', ')}\n`;
        md += `\n${e.content || ''}\n\n---\n\n`;
      });
    }

    md += `## Riwayat Tugas Terselesaikan\n\n`;
    if (completed.length === 0) {
      md += `*Belum ada tugas yang diselesaikan.*\n\n`;
    } else {
      completed.forEach((c, idx) => {
        md += `- [x] **${c.title}** (${c.category || 'Umum'}) - Selesai: ${c.completedAt ? new Date(c.completedAt).toLocaleDateString('id-ID') : '-'}\n`;
      });
    }

    return md;
  }

  importLogbookMarkdown(markdownText) {
    if (!markdownText) return { success: false, count: 0 };
    const list = this.getLogbookEntries();
    let importedCount = 0;

    // Parsing sections split by '### '
    const sections = markdownText.split(/^###\s+/m);
    
    sections.forEach((sec, idx) => {
      if (idx === 0) return; // skip header before first ###
      const lines = sec.trim().split('\n');
      const title = lines[0].trim();
      let date = new Date().toISOString().split('T')[0];
      let tags = ['Imported'];
      let contentLines = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('- **Tanggal:**')) {
          date = line.replace('- **Tanggal:**', '').trim();
        } else if (line.startsWith('- **Tags:**')) {
          const rawTags = line.replace('- **Tags:**', '').trim();
          tags = rawTags.split(',').map(t => t.trim());
        } else if (line.trim() === '---') {
          continue;
        } else {
          contentLines.push(line);
        }
      }

      list.unshift({
        id: 'log-imp-' + Date.now() + '-' + idx,
        title: title || 'Catatan Impor',
        date,
        tags,
        content: contentLines.join('\n').trim(),
        createdAt: new Date().toISOString()
      });
      importedCount++;
    });

    // Jika format markdown bukan heading ### melainkan plain text/bullet, simpan sebagai 1 entri
    if (importedCount === 0 && markdownText.trim().length > 0) {
      list.unshift({
        id: 'log-imp-' + Date.now(),
        title: 'Dokumen Impor Markdown',
        date: new Date().toISOString().split('T')[0],
        tags: ['Imported'],
        content: markdownText.trim(),
        createdAt: new Date().toISOString()
      });
      importedCount = 1;
    }

    this.saveLogbookEntries(list);
    return { success: true, count: importedCount };
  }
}

module.exports = new Store();
