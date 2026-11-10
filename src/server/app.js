const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');
const store = require('../main/store');
const { generateICS } = require('../main/icsExporter');

const PORT = 4321;
let serverInstance = null;

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Cari IPv4 non-internal
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function startCompanionServer() {
  if (serverInstance) return getLocalURL();

  serverInstance = http.createServer((req, res) => {
    // CORS headers agar bisa diakses dari browser HP
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    // API: Ambil semua agenda
    if (url.pathname === '/api/activities' && req.method === 'GET') {
      const data = store.getActivities();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    // API: Tambah agenda dari HP
    if (url.pathname === '/api/activities' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const newAct = JSON.parse(body);
          const created = store.addActivity(newAct);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(created));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
        }
      });
      return;
    }

    // API: Toggle selesai dari HP
    if (url.pathname.startsWith('/api/activities/toggle/') && req.method === 'POST') {
      const id = url.pathname.replace('/api/activities/toggle/', '');
      const updated = store.toggleComplete(id);
      if (updated) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(updated));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
      return;
    }

    // API: Download / Feed Kalender .ICS
    if (url.pathname === '/api/calendar.ics') {
      const ics = generateICS();
      res.writeHead(200, {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="tempo-calendar.ics"'
      });
      res.end(ics);
      return;
    }

    // API: Hari Libur
    if (url.pathname === '/api/holidays') {
      const holidays = store.getHolidays();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(holidays));
      return;
    }

    // Default Web UI (HTML responsif untuk HP)
    if (url.pathname === '/' || url.pathname === '/index.html') {
      const mobileHtml = generateMobileWebUI();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(mobileHtml);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  serverInstance.listen(PORT, '0.0.0.0', () => {
    console.log(`[Companion Server] Berjalan di http://${getLocalIP()}:${PORT}`);
  });

  return getLocalURL();
}

function getLocalURL() {
  return `http://${getLocalIP()}:${PORT}`;
}

function generateMobileWebUI() {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>TEMPO Mobile Companion</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; padding: 16px; min-height: 100vh; }
    header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #334155; margin-bottom: 20px; }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #38bdf8; display: flex; align-items: center; gap: 8px; }
    .badge { background: #1e293b; padding: 4px 10px; border-radius: 999px; font-size: 11px; color: #94a3b8; border: 1px solid #475569; }
    .btn-sync { background: #38bdf8; color: #0f172a; font-weight: 700; border: none; padding: 6px 14px; border-radius: 8px; font-size: 12px; }
    
    .card-add { background: #1e293b; border: 1px solid #334155; border-radius: 14px; padding: 14px; margin-bottom: 20px; }
    .card-add h3 { font-size: 14px; margin-bottom: 10px; color: #cbd5e1; }
    .input-group { display: flex; flex-direction: column; gap: 8px; }
    input, select { background: #0f172a; border: 1px solid #475569; border-radius: 8px; padding: 10px; color: #fff; font-size: 14px; }
    .btn-submit { background: #10b981; color: #fff; font-weight: 700; border: none; padding: 10px; border-radius: 8px; margin-top: 4px; font-size: 14px; }
    
    .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 12px; }
    .activity-list { display: flex; flex-direction: column; gap: 10px; }
    .activity-item { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 14px; display: flex; align-items: flex-start; gap: 12px; transition: all 0.2s; }
    .activity-item.completed { opacity: 0.6; text-decoration: line-through; }
    .activity-item.urgent { border-left: 4px solid #ef4444; }
    .activity-item.high { border-left: 4px solid #f59e0b; }
    .activity-item.normal { border-left: 4px solid #3b82f6; }
    
    .checkbox { width: 22px; height: 22px; border-radius: 6px; border: 2px solid #64748b; background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; margin-top: 2px; }
    .checkbox.checked { background: #10b981; border-color: #10b981; color: #fff; }
    .item-content { flex: 1; }
    .item-title { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
    .item-meta { display: flex; gap: 8px; font-size: 11px; color: #94a3b8; align-items: center; flex-wrap: wrap; }
    .tag-horizon { background: #334155; padding: 2px 6px; border-radius: 4px; color: #38bdf8; font-weight: 700; }
    .tag-urgent { background: rgba(239, 68, 68, 0.2); color: #fca5a5; }
    .tag-h1 { background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
    .feed-banner { background: #0c4a6e; border: 1px solid #0284c7; padding: 12px; border-radius: 10px; font-size: 12px; margin-top: 24px; text-align: center; }
    .feed-banner a { color: #38bdf8; text-decoration: underline; font-weight: bold; }
  </style>
</head>
<body>
  <header>
    <div class="brand">⚡ TEMPO</div>
    <span class="badge">HP Companion</span>
    <a href="/api/calendar.ics" class="btn-sync" download="tempo.ics">📅 Sync Kalender</a>
  </header>

  <div class="card-add">
    <h3>➕ Catat Agenda Baru</h3>
    <form id="addForm" class="input-group">
      <input type="text" id="title" placeholder="Nama agenda / tugas..." required>
      <div style="display: flex; gap: 8px;">
        <input type="date" id="dueDate" style="flex: 2;" required>
        <input type="time" id="dueTime" style="flex: 1;" value="12:00">
      </div>
      <select id="priority">
        <option value="normal">Prioritas: Normal</option>
        <option value="high">Prioritas: Tinggi (High)</option>
        <option value="urgent">Prioritas: Mendesak (Urgent)</option>
      </select>
      <button type="submit" class="btn-submit">Simpan ke Laptop</button>
    </form>
  </div>

  <div class="section-title">Daftar Agenda & Tenggat Waktu</div>
  <div id="activityList" class="activity-list">
    <div style="text-align: center; padding: 20px; color: #64748b;">Memuat data...</div>
  </div>

  <div class="feed-banner">
    📲 Ingin masukkan semua jadwal ke Google Calendar / Apple Calendar di HP?<br>
    <a href="/api/calendar.ics">Ketuk di sini untuk download file kalender .ICS</a>
  </div>

  <script>
    async function loadActivities() {
      try {
        const res = await fetch('/api/activities');
        const list = await res.json();
        const container = document.getElementById('activityList');
        if (!list || list.length === 0) {
          container.innerHTML = '<div style="text-align:center; padding:20px; color:#64748b;">Belum ada agenda.</div>';
          return;
        }

        container.innerHTML = list.map(a => {
          const isDone = a.status === 'completed';
          let prioClass = a.priority || 'normal';
          let horizonClass = 'tag-horizon';
          if (a.horizonLabel && a.horizonLabel.includes('H-1')) horizonClass += ' tag-h1';
          if (a.horizonLabel && (a.horizonLabel.includes('Hari H') || a.horizonLabel.includes('Overdue'))) horizonClass += ' tag-urgent';

          return \`
            <div class="activity-item \${prioClass} \${isDone ? 'completed' : ''}">
              <div class="checkbox \${isDone ? 'checked' : ''}" onclick="toggleDone('\${a.id}')">
                \${isDone ? '✓' : ''}
              </div>
              <div class="item-content">
                <div class="item-title">\${a.title}</div>
                <div class="item-meta">
                  <span class="\${horizonClass}">\${a.horizonLabel || 'Tenggat'}</span>
                  <span>🗓️ \${a.dueDate || ''} \${a.dueTime || ''}</span>
                </div>
              </div>
            </div>
          \`;
        }).join('');
      } catch (e) {
        console.error(e);
      }
    }

    async function toggleDone(id) {
      await fetch('/api/activities/toggle/' + id, { method: 'POST' });
      loadActivities();
    }

    document.getElementById('addForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('title').value;
      const dueDate = document.getElementById('dueDate').value;
      const dueTime = document.getElementById('dueTime').value;
      const priority = document.getElementById('priority').value;

      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, dueDate, dueTime, priority, status: 'pending' })
      });

      document.getElementById('title').value = '';
      loadActivities();
    });

    // Set default date hari ini
    document.getElementById('dueDate').value = new Date().toISOString().split('T')[0];
    loadActivities();
    setInterval(loadActivities, 5000); // Polling sync setiap 5 detik
  </script>
</body>
</html>`;
}

module.exports = {
  startCompanionServer,
  getLocalURL,
  getLocalIP
};
