const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const ACTIVITIES_FILE = path.join(DATA_DIR, 'activities.json');
const SAMPLE_FILE = path.join(DATA_DIR, 'activities.sample.json');
const HOLIDAYS_FILE = path.join(DATA_DIR, 'holidays.json');
const VAULT_DIR = path.join(DATA_DIR, 'vault');

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
    const todayStr = now.toISOString().split('T')[0];

    return activities.map(act => {
      const isBlocked = act.dependencies && act.dependencies.some(depId => !completedIds.has(depId));
      
      // Hitung sisa hari (Horizon)
      let daysRemaining = null;
      let isOverdue = false;
      let horizonLabel = '';

      if (act.dueDate) {
        const due = new Date(`${act.dueDate}T${act.dueTime || '23:59:59'}`);
        const diffMs = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

        daysRemaining = diffDays;
        if (diffMs < 0 && act.status !== 'completed') {
          isOverdue = true;
          horizonLabel = 'Terlewat (Overdue)';
        } else if (diffDays <= 0) {
          horizonLabel = diffHours > 0 ? `Hari H (${diffHours} jam lagi)` : 'Hari H (Sekarang)';
        } else {
          horizonLabel = `H-${diffDays}`;
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
}

module.exports = new Store();
