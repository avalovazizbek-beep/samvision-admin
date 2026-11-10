const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('setupApi', {
  load: () => ipcRenderer.invoke('setup:load'),
  test: (serverUrl) => ipcRenderer.invoke('setup:test', serverUrl),
  save: (data) => ipcRenderer.invoke('setup:save', data),
  cancel: () => ipcRenderer.invoke('setup:cancel'),
});
