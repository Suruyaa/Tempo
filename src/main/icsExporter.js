const store = require('./store');

function generateICS() {
  const activities = store.getActivities();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Surya Ramadhan//TEMPO Productivity Engine//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Agenda TEMPO',
    'X-WR-TIMEZONE:Asia/Jakarta'
  ];

  activities.forEach(act => {
    if (!act.dueDate) return;

    const dateClean = act.dueDate.replace(/-/g, '');
    const timeClean = (act.dueTime || '12:00').replace(/:/g, '') + '00';
    const startStr = `${dateClean}T${timeClean}`;
    
    // Asumsikan durasi event 1 jam jika tidak ditentukan
    const hour = parseInt((act.dueTime || '12:00').split(':')[0], 10) + 1;
    const endHourStr = String(hour).padStart(2, '0');
    const endStr = `${dateClean}T${endHourStr}${(act.dueTime || '12:00').split(':')[1]}00`;

    const nowStr = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:tempo-${act.id}@tempo.local`);
    lines.push(`DTSTAMP:${nowStr}`);
    lines.push(`DTSTART:${startStr}`);
    lines.push(`DTEND:${endStr}`);
    lines.push(`SUMMARY:${escapeICS(act.title)} [${act.horizonLabel || 'Tenggat'}]`);
    lines.push(`DESCRIPTION:${escapeICS(act.description || '')}\\nPrioritas: ${act.priority || 'Normal'}\\nStatus: ${act.status}`);
    lines.push(`CATEGORIES:${escapeICS(act.category || 'General')}`);
    lines.push(`STATUS:${act.status === 'completed' ? 'COMPLETED' : 'CONFIRMED'}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeICS(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

module.exports = {
  generateICS
};
