const { ipcMain } = require('electron');
const settingsService = require('../services/settingsService');
const startupService = require('../services/startupService');

function registerAppIpc(mainWindow) {
  const handle = (channel, listener) => {
    try {
      ipcMain.removeHandler(channel);
      ipcMain.handle(channel, listener);
    } catch (error) {
      console.error(`[AppIpc] Erro ao registrar ${channel}:`, error);
    }
  };

  handle('get-app-settings', () => ({
    ...settingsService.getAll(),
    startWithWindows: startupService.isEnabled()
  }));

  handle('set-app-setting', (event, { key, value }) => {
    if (key === 'startWithWindows') {
      return { key, value: startupService.setEnabled(value) };
    }

    if (key === 'alwaysOnTop' && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setAlwaysOnTop(Boolean(value));
    }

    settingsService.set(key, value);
    return { key, value: settingsService.get(key) };
  });
}

module.exports = { registerAppIpc };
