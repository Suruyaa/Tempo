const { app, BrowserWindow, ipcMain, screen, dialog, shell, Menu, Tray, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const store = require('./src/main/store');
const scheduler = require('./src/main/scheduler');
const { setupAlertIPC, triggerForcedAlert } = require('./src/main/alertManager');
const { generateICS } = require('./src/main/icsExporter');

let mainWindow = null;
let miniWidgetWindow = null;
let scratchpadWindow = null;
let tray = null;

function createScratchpadWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const sWidth = 560;
  const sHeight = 380;
  const posX = Math.round((screenWidth - sWidth) / 2);
  const posY = Math.round((screenHeight - sHeight) / 3);

  scratchpadWindow = new BrowserWindow({
    width: sWidth,
    height: sHeight,
    x: posX,
    y: posY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  scratchpadWindow.setAlwaysOnTop(true, 'screen-saver');
  scratchpadWindow.setVisibleOnAllWorkspaces(true);
  scratchpadWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'scratchpad.html'));

  scratchpadWindow.on('blur', () => {
    // Sembunyikan saat klik di luar
    if (scratchpadWindow && scratchpadWindow.isVisible()) {
      scratchpadWindow.hide();
    }
  });
}

function toggleScratchpad(forceState) {
  if (!scratchpadWindow || scratchpadWindow.isDestroyed()) {
    createScratchpadWindow();
  }

  if (forceState === true) {
    scratchpadWindow.show();
    scratchpadWindow.focus();
  } else if (forceState === false) {
    scratchpadWindow.hide();
  } else {
    if (scratchpadWindow.isVisible()) {
      scratchpadWindow.hide();
    } else {
      scratchpadWindow.show();
      scratchpadWindow.focus();
    }
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: 'TEMPO - Desktop Productivity Engine',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));

  mainWindow.on('close', (event) => {
    // Sembunyikan ke background saat ditutup agar pengingat & scheduler tetap jalan
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createMiniWidget() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;

  const wWidth = 320;
  const wHeight = 64;
  const posX = Math.round(screenWidth - wWidth - 20);
  const posY = 20;

  miniWidgetWindow = new BrowserWindow({
    width: wWidth,
    height: wHeight,
    x: posX,
    y: posY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  miniWidgetWindow.setAlwaysOnTop(true, 'floating');
  miniWidgetWindow.setVisibleOnAllWorkspaces(true);
  miniWidgetWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'widget.html'));
}

function createTray() {
  // Buat icon sederhana jika asset belum ada
  tray = new Tray(createTrayIcon());
  tray.setToolTip('TEMPO - Pengingat & Produktivitas');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '⚡ Buka Dashboard TEMPO',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: '📌 Tampilkan / Sembunyikan Mini HUD',
      click: () => {
        if (miniWidgetWindow) {
          if (miniWidgetWindow.isVisible()) {
            miniWidgetWindow.hide();
          } else {
            miniWidgetWindow.show();
          }
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Keluar Sepenuhnya',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createTrayIcon() {
  const { nativeImage } = require('electron');
  // Buat icon kanvas 16x16 sederhana
  const icon = nativeImage.createFromBuffer(
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZElEQVQ4T2NkQAP/Gf7//0+mBgYGBgZGIiYyg/kMDGQZgKzBxISBEUkD5mYGBhQUg03BpgmffkZ0jYw4vEAbgw+jGgAWhjA2zMh6kDUwMWJTh4yR1aE7F10PspuJNQDXm8TGJgBqFioL2O6h5gAAAABJRU5ErkJggg==',
      'base64'
    )
  );
  return icon;
}

app.whenReady().then(() => {
  createMainWindow();
  createMiniWidget();
  createScratchpadWindow();
  createTray();

  // Daftarkan Global Keyboard Shortcut untuk Quick Scratchpad
  // Bisa ditekan dari aplikasi mana pun di Windows (Alt+Space atau Ctrl+Shift+Space)
  try {
    globalShortcut.register('Alt+Space', () => {
      toggleScratchpad();
    });
    globalShortcut.register('CommandOrControl+Shift+Space', () => {
      toggleScratchpad();
    });
    console.log('[TEMPO] Shortcut Global Alt+Space & Ctrl+Shift+Space terdaftar!');
  } catch (err) {
    console.error('Gagal mendaftarkan global shortcut:', err);
  }

  // Inisialisasi Alert IPC
  setupAlertIPC(mainWindow);

  // Jalankan background scheduler
  scheduler.start();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
  globalShortcut.unregisterAll();
  scheduler.stop();
});

// IPC Handlers
ipcMain.handle('get-activities', () => {
  return store.getActivities();
});

ipcMain.handle('add-activity', (event, act) => {
  const newAct = store.addActivity(act);
  broadcastActivitiesUpdated();
  return newAct;
});

ipcMain.handle('update-activity', (event, id, updates) => {
  const updated = store.updateActivity(id, updates);
  broadcastActivitiesUpdated();
  return updated;
});

ipcMain.handle('delete-activity', (event, id) => {
  const res = store.deleteActivity(id);
  broadcastActivitiesUpdated();
  return res;
});

ipcMain.handle('toggle-complete', (event, id) => {
  const updated = store.toggleComplete(id);
  broadcastActivitiesUpdated();
  return updated;
});

ipcMain.handle('get-holidays', () => {
  return store.getHolidays();
});

ipcMain.handle('show-main-window', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
  return true;
});

ipcMain.handle('toggle-mini-widget', (event, visible) => {
  if (miniWidgetWindow) {
    if (visible === undefined) {
      if (miniWidgetWindow.isVisible()) miniWidgetWindow.hide();
      else miniWidgetWindow.show();
    } else {
      if (visible) miniWidgetWindow.show();
      else miniWidgetWindow.hide();
    }
  }
  return true;
});

ipcMain.handle('get-logbook-entries', () => {
  return store.getLogbookEntries();
});

ipcMain.handle('add-logbook-entry', (event, entry) => {
  return store.addLogbookEntry(entry);
});

ipcMain.handle('delete-logbook-entry', (event, id) => {
  return store.deleteLogbookEntry(id);
});

ipcMain.handle('export-logbook-md', async () => {
  const mdContent = store.exportLogbookMarkdown();
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Ekspor Logbook Jurnal (.md)',
    defaultPath: 'tempo-jurnal-logbook.md',
    filters: [{ name: 'Markdown Document', extensions: ['md'] }]
  });

  if (filePath) {
    fs.writeFileSync(filePath, mdContent, 'utf-8');
    return { success: true, filePath };
  }
  return { success: false };
});

ipcMain.handle('import-logbook-md', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Impor Dokumen Markdown (.md) ke Logbook',
    properties: ['openFile'],
    filters: [{ name: 'Markdown Files', extensions: ['md', 'markdown', 'txt'] }]
  });

  if (result.canceled || result.filePaths.length === 0) return { success: false, count: 0 };

  const content = fs.readFileSync(result.filePaths[0], 'utf-8');
  const importRes = store.importLogbookMarkdown(content);
  return importRes;
});

ipcMain.handle('export-ics', async () => {
  const icsData = generateICS();
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Ekspor Kalender TEMPO (.ics)',
    defaultPath: 'tempo-agenda.ics',
    filters: [{ name: 'iCalendar', extensions: ['ics'] }]
  });

  if (filePath) {
    fs.writeFileSync(filePath, icsData, 'utf-8');
    return { success: true, filePath };
  }
  return { success: false };
});

ipcMain.handle('test-forced-alert', (event, id) => {
  const activities = store.getActivities();
  const act = activities.find(a => a.id === id) || activities[0];
  if (act) {
    triggerForcedAlert(act, {
      type: 'test',
      label: 'UJI COBA NOTIFIKASI PAKSA (BYPASS DND)',
      priority: 'urgent'
    });
    return true;
  }
  return false;
});

ipcMain.handle('add-vault-link', (event, { activityId, link }) => {
  const activities = store.getActivities();
  const act = activities.find(a => a.id === activityId);
  if (!act) return null;

  if (!act.vault) act.vault = { links: [], files: [] };
  if (!act.vault.links) act.vault.links = [];

  act.vault.links.push(link);
  const updated = store.updateActivity(activityId, { vault: act.vault });
  broadcastActivitiesUpdated();
  return updated;
});

ipcMain.handle('remove-vault-link', (event, { activityId, index }) => {
  const activities = store.getActivities();
  const act = activities.find(a => a.id === activityId);
  if (!act || !act.vault || !act.vault.links) return null;

  act.vault.links.splice(index, 1);
  const updated = store.updateActivity(activityId, { vault: act.vault });
  broadcastActivitiesUpdated();
  return updated;
});

ipcMain.handle('add-vault-file', async (event, activityId) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Lampirkan Berkas ke Activity Vault',
    properties: ['openFile']
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const srcPath = result.filePaths[0];
  const fileName = path.basename(srcPath);
  const destDir = path.join(__dirname, 'data', 'vault', activityId);

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const destPath = path.join(destDir, fileName);
  fs.copyFileSync(srcPath, destPath);

  const activities = store.getActivities();
  const act = activities.find(a => a.id === activityId);
  if (!act) return null;

  if (!act.vault) act.vault = { links: [], files: [] };
  if (!act.vault.files) act.vault.files = [];

  act.vault.files.push({ name: fileName, path: destPath, addedAt: new Date().toISOString() });
  const updated = store.updateActivity(activityId, { vault: act.vault });
  broadcastActivitiesUpdated();
  return updated;
});

ipcMain.handle('get-scratchpad', () => {
  return store.getScratchpad();
});

ipcMain.handle('save-scratchpad', (event, content) => {
  return store.saveScratchpad(content);
});

ipcMain.handle('toggle-scratchpad', (event, visible) => {
  toggleScratchpad(visible);
  return true;
});

function broadcastActivitiesUpdated() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('activities-updated');
  }
  if (miniWidgetWindow && !miniWidgetWindow.isDestroyed()) {
    miniWidgetWindow.webContents.send('activities-updated');
  }
}
