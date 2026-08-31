const { BrowserWindow } = require('electron');
const path = require('path');
const config = require('../config/appConfig');

let miniPlayerWindow = null;

function createMiniPlayerWindow() {
  if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
    return miniPlayerWindow;
  }

  miniPlayerWindow = new BrowserWindow({
    width: 500,
    height: 500,
    minWidth: 420,
    minHeight: 300,
    frame: false,
    transparent: true,
    resizable: true,
    show: false,
    backgroundColor: '#00000000',
    title: 'YouTube Music Mini Player',
    icon: path.join(config.PATHS.ASSETS, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../../preload/miniPlayerPreload.js'),
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: false
    }
  });

  miniPlayerWindow.setAlwaysOnTop(false);
  miniPlayerWindow.loadFile(path.join(__dirname, '../../renderer/mini-player/miniPlayer.html'));
  miniPlayerWindow.on('closed', () => {
    miniPlayerWindow = null;
  });

  return miniPlayerWindow;
}

function getMiniPlayerWindow() {
  return miniPlayerWindow && !miniPlayerWindow.isDestroyed() ? miniPlayerWindow : null;
}

function showMiniPlayer() {
  const win = getMiniPlayerWindow() || createMiniPlayerWindow();
  win.show();
  win.focus();
  return win;
}

function hideMiniPlayer() {
  const win = getMiniPlayerWindow();
  if (win) win.hide();
}

module.exports = {
  createMiniPlayerWindow,
  getMiniPlayerWindow,
  showMiniPlayer,
  hideMiniPlayer
};
