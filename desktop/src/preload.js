/**
 * Admin panel (veb sahifa) va ilova o‘rtasidagi xavfsiz ko‘prik.
 * Sahifa faqat shu funksiyalarni ko‘radi — Node.js yoki fayl tizimiga to‘g‘ridan-to‘g‘ri kirish yo‘q.
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('samvisionDesktop', {
  isDesktop: true,
  getInfo: () => ipcRenderer.invoke('app:info'),
  openSettings: () => ipcRenderer.invoke('app:settings'),
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url),

  getUpdateStatus: () => ipcRenderer.invoke('update:status'),
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  onUpdateStatus: (callback) => {
    const handler = (_event, status) => callback(status);
    ipcRenderer.on('update:status', handler);
    return () => ipcRenderer.removeListener('update:status', handler);
  },
});
