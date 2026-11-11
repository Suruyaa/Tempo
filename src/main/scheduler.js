const store = require('./store');
const { triggerForcedAlert } = require('./alertManager');

class Scheduler {
  constructor() {
    this.timer = null;
    this.intervalMs = 30000; // Cek setiap 30 detik
  }

  start() {
    if (this.timer) return;
    console.log('[Scheduler] Engine pengingat aktif...');
    this.checkReminders();
    this.timer = setInterval(() => this.checkReminders(), this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  checkReminders() {
    const activities = store.getActivities();
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();

    activities.forEach(activity => {
      // Lewati jika sudah selesai
      if (activity.status === 'completed') return;

      // Lewati jika sedang dalam mode snooze
      if (store.isSnoozed(activity.id)) return;

      if (!activity.dueDate) return;

      const dueDateTime = new Date(`${activity.dueDate}T${activity.dueTime || '23:59:00'}`);
      const diffMs = dueDateTime.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      const parts = activity.dueDate.split('-').map(Number);
      const dueMidnight = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0).getTime();
      const calendarDayDiff = Math.round((dueMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

      const horizons = activity.reminderHorizon || ['h-1', 'h-0'];

      // 1. Cek Deadline Pas (Hari H, kurang dari 10 menit atau baru saja tiba)
      if (diffMinutes <= 10 && diffMinutes >= -30) {
        if (!store.isDismissed(activity.id, 'due-now')) {
          triggerForcedAlert(activity, {
            type: 'due-now',
            label: diffMinutes <= 0 ? 'WAKTU DEADLINE TELAH TIBA!' : `Mendekati Deadline (${diffMinutes} menit lagi!)`,
            priority: 'urgent',
            diffMinutes
          });
          return;
        }
      }

      // 2. Cek Peringatan Hari H (h-0) di pagi hari atau hari yang sama
      if (calendarDayDiff === 0 && horizons.includes('h-0')) {
        if (!store.isDismissed(activity.id, 'h-0') && diffMinutes > 10) {
          triggerForcedAlert(activity, {
            type: 'h-0',
            label: `Hari H: Deadline hari ini jam ${activity.dueTime || '23:59'}`,
            priority: activity.priority,
            diffHours
          });
          return;
        }
      }

      // 3. Cek Peringatan H-1
      if (calendarDayDiff === 1 && horizons.includes('h-1')) {
        if (!store.isDismissed(activity.id, 'h-1')) {
          triggerForcedAlert(activity, {
            type: 'h-1',
            label: `Peringatan H-1: Besok adalah tenggat waktu!`,
            priority: activity.priority,
            diffDays: 1
          });
          return;
        }
      }

      // 4. Cek Peringatan H-2
      if (calendarDayDiff === 2 && horizons.includes('h-2')) {
        if (!store.isDismissed(activity.id, 'h-2')) {
          triggerForcedAlert(activity, {
            type: 'h-2',
            label: `Peringatan H-2: Tenggat waktu 2 hari lagi`,
            priority: activity.priority,
            diffDays: 2
          });
          return;
        }
      }

      // 5. Cek Peringatan H-3
      if (calendarDayDiff === 3 && horizons.includes('h-3')) {
        if (!store.isDismissed(activity.id, 'h-3')) {
          triggerForcedAlert(activity, {
            type: 'h-3',
            label: `Peringatan H-3: Segera cicil tugas ini`,
            priority: activity.priority,
            diffDays: 3
          });
          return;
        }
      }

      // 6. Cek Peringatan H-7
      if (calendarDayDiff === 7 && horizons.includes('h-7')) {
        if (!store.isDismissed(activity.id, 'h-7')) {
          triggerForcedAlert(activity, {
            type: 'h-7',
            label: `Peringatan H-7: 1 Minggu menjelang tenggat`,
            priority: activity.priority,
            diffDays: 7
          });
          return;
        }
      }
    });
  }
}

module.exports = new Scheduler();
