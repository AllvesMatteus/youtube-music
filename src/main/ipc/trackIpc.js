const { ipcMain } = require('electron');
const config = require('../config/appConfig');
const trayService = require('../services/trayService');
const { getMiniPlayerWindow, showMiniPlayer } = require('../windows/miniPlayerWindow');

function registerTrackIpc(mainWindow, ses) {
  ipcMain.on('track-changed', (event, data) => {
    const { title, artist } = data || {};
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setTitle(title || config.APP_NAME);
      trayService.setTrackInfo(mainWindow, ses, { title, artist });
    }
  });

  ipcMain.on('track-state-changed', (event, state = {}) => {
    const miniPlayer = getMiniPlayerWindow();
    if (miniPlayer) miniPlayer.webContents.send('mini-player-track-state', state);
    if (mainWindow && !mainWindow.isDestroyed()) {
      const { title, artist } = state;
      if (title) mainWindow.setTitle(title);
      trayService.setTrackInfo(mainWindow, ses, { title, artist });
    }
  });

  ipcMain.on('open-mini-player', () => showMiniPlayer());
}

module.exports = { registerTrackIpc };
