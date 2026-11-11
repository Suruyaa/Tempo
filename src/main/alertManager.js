const { BrowserWindow, screen, ipcMain, shell } = require('electron');
const path = require('path');
const store = require('./store');

let alertWindow = null;
let currentAlertData = null;

function createAlertWindow(activity, triggerReason) {
  // Simpan data alert aktif
  currentAlertData = { activity, triggerReason };

  // Jika window sudah ada, perbarui datanya dan bawa ke paling depan
  if (alertWindow && !alertWindow.isDestroyed()) {
    alertWindow.webContents.send('alert-data', currentAlertData);
    alertWindow.show();
    alertWindow.setAlwaysOnTop(true, 'screen-saver');
    alertWindow.moveTop();
    alertWindow.focus();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const winWidth = 460;
  const winHeight = 280;
  // Posisi di kanan bawah (di atas taskbar)
  const posX = Math.round(screenWidth - winWidth - 24);
  const posY = Math.round(screenHeight - winHeight - 24);

  const alertIconPath = path.join(__dirname, '..', 'renderer', 'assets', 'tempo-logo.png');

  alertWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: posX,
    y: posY,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    hasShadow: true,
    icon: alertIconPath,
    webPreferences: {
      preload: path.join(__dirname, '..', '..', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Bypass Do Not Disturb Windows: pasang level tertinggi 'screen-saver'
  alertWindow.setAlwaysOnTop(true, 'screen-saver');
  alertWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  alertWindow.loadFile(path.join(__dirname, '..', 'renderer', 'alert.html'));

  alertWindow.webContents.on('did-finish-load', () => {
    if (currentAlertData) {
      alertWindow.webContents.send('alert-data', currentAlertData);
    }
    alertWindow.setAlwaysOnTop(true, 'screen-saver');
    alertWindow.moveTop();
    alertWindow.focus();
  });

  alertWindow.on('closed', () => {
    alertWindow = null;
    currentAlertData = null;
  });
}

// Handler IPC dari alert window
function setupAlertIPC(mainWindow) {
  ipcMain.handle('alert-action-complete', async (event, activityId) => {
    const updated = store.toggleComplete(activityId);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('activities-updated');
    }
    if (alertWindow && !alertWindow.isDestroyed()) {
      alertWindow.close();
    }
    return updated;
  });

  ipcMain.handle('alert-action-snooze', async (event, { activityId, minutes }) => {
    store.snooze(activityId, minutes || 15);
    if (alertWindow && !alertWindow.isDestroyed()) {
      alertWindow.close();
    }
    return true;
  });

  ipcMain.handle('alert-action-dismiss', async (event, { activityId, horizon }) => {
    if (horizon) {
      store.dismissHorizon(activityId, horizon);
    }
    if (alertWindow && !alertWindow.isDestroyed()) {
      alertWindow.close();
    }
    return true;
  });

  ipcMain.handle('alert-action-open-link', async (event, url) => {
    if (url) {
      shell.openExternal(url);
    }
    return true;
  });
}

function triggerForcedAlert(activity, reason) {
  createAlertWindow(activity, reason);
}

module.exports = {
  createAlertWindow,
  setupAlertIPC,
  triggerForcedAlert
};
