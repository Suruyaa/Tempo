const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tempoAPI', {
  // Activity CRUD
  getActivities: () => ipcRenderer.invoke('get-activities'),
  addActivity: (act) => ipcRenderer.invoke('add-activity', act),
  updateActivity: (id, updates) => ipcRenderer.invoke('update-activity', id, updates),
  deleteActivity: (id) => ipcRenderer.invoke('delete-activity', id),
  toggleComplete: (id) => ipcRenderer.invoke('toggle-complete', id),

  // Vault & Files
  addVaultLink: (activityId, link) => ipcRenderer.invoke('add-vault-link', { activityId, link }),
  removeVaultLink: (activityId, index) => ipcRenderer.invoke('remove-vault-link', { activityId, index }),
  addVaultFile: (activityId) => ipcRenderer.invoke('add-vault-file', activityId),
  openExternal: (url) => ipcRenderer.invoke('alert-action-open-link', url),

  // Logbook Jurnal (.MD export & import)
  getLogbookEntries: () => ipcRenderer.invoke('get-logbook-entries'),
  addLogbookEntry: (entry) => ipcRenderer.invoke('add-logbook-entry', entry),
  updateLogbookEntry: (id, updates) => ipcRenderer.invoke('update-logbook-entry', { id, updates }),
  deleteLogbookEntry: (id) => ipcRenderer.invoke('delete-logbook-entry', id),
  exportLogbookMD: () => ipcRenderer.invoke('export-logbook-md'),
  importLogbookMD: () => ipcRenderer.invoke('import-logbook-md'),

  // Holidays
  getHolidays: () => ipcRenderer.invoke('get-holidays'),

  // Export ICS
  exportICS: () => ipcRenderer.invoke('export-ics'),

  // Scratchpad
  getScratchpad: () => ipcRenderer.invoke('get-scratchpad'),
  saveScratchpad: (content) => ipcRenderer.invoke('save-scratchpad', content),
  toggleScratchpad: (visible) => ipcRenderer.invoke('toggle-scratchpad', visible),

  // Window Controls
  showMainWindow: () => ipcRenderer.invoke('show-main-window'),
  toggleMiniWidget: (visible) => ipcRenderer.invoke('toggle-mini-widget', visible),

  // Forced Alert IPC
  completeActivity: (id) => ipcRenderer.invoke('alert-action-complete', id),
  snoozeActivity: (id, minutes) => ipcRenderer.invoke('alert-action-snooze', { activityId: id, minutes }),
  dismissActivity: (id, horizon) => ipcRenderer.invoke('alert-action-dismiss', { activityId: id, horizon }),
  testForcedAlert: (id) => ipcRenderer.invoke('test-forced-alert', id),

  // Event Listeners
  onAlertData: (callback) => {
    ipcRenderer.on('alert-data', (event, data) => callback(data));
  },
  onActivitiesUpdated: (callback) => {
    ipcRenderer.on('activities-updated', () => callback());
  }
});
