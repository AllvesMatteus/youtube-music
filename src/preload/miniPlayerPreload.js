const { contextBridge, ipcRenderer } = require('electron');

const api = {
  onTrackState: callback => ipcRenderer.on('mini-player-track-state', (event, state) => callback(state)),
  getSettings: () => ipcRenderer.invoke('get-app-settings'),
  setSetting: (key, value) => ipcRenderer.invoke('set-app-setting', { key, value }),
  command: command => ipcRenderer.send('mini-player-command', command),
  close: () => ipcRenderer.send('mini-player-close'),
  minimize: () => ipcRenderer.send('mini-player-minimize'),
  openAccounts: () => ipcRenderer.send('open-account-manager'),
  openMainWindow: () => ipcRenderer.send('open-main-window'),
  onRequestAddAccount: callback => ipcRenderer.on('open-add-account', callback)
};

if (process.contextIsolated && contextBridge) {
  contextBridge.exposeInMainWorld('miniPlayerAPI', api);
} else {
  window.miniPlayerAPI = api;
}
