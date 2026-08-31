const { ipcMain } = require('electron');
const config = require('../config/appConfig');
const trayService = require('../services/trayService');

function registerTrackIpc(mainWindow, ses) {
  ipcMain.on('track-changed', (event, { title, artist }) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (title && artist) {
        mainWindow.setTitle(`🎵 ${title} • ${artist} — ${config.APP_NAME}`);
      } else if (title) {
        mainWindow.setTitle(`🎵 ${title} — ${config.APP_NAME}`);
      } else {
        mainWindow.setTitle(config.APP_NAME);
      }

      // Atualiza também o tooltip e menu do System Tray
      trayService.setTrackInfo(mainWindow, ses, { title, artist });
    }
  });
}

module.exports = { registerTrackIpc };
