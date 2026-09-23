const { BrowserWindow } = require('electron');
const path = require('path');
const config = require('../config/appConfig');
const windowStateService = require('../services/windowStateService');
const settingsService = require('../services/settingsService');

let miniPlayerWindow = null;

function createMiniPlayerWindow() {
  if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) return miniPlayerWindow;

  const savedPos = windowStateService.get('miniPlayer');

  miniPlayerWindow = new BrowserWindow({
    width: 460,
    height: 218,
    minWidth: 460,
    minHeight: 218,
    maxWidth: 460,
    maxHeight: 218,
    x: savedPos ? savedPos.x : undefined,
    y: savedPos ? savedPos.y : undefined,
    frame: false,
    transparent: true,
    resizable: false,
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

  windowStateService.track(miniPlayerWindow, 'miniPlayer');

  miniPlayerWindow.setAlwaysOnTop(Boolean(settingsService.get('alwaysOnTop')));
  miniPlayerWindow.loadFile(path.join(__dirname, '../../renderer/mini-player/miniPlayer.html'));
  miniPlayerWindow.on('closed', () => { miniPlayerWindow = null; });
  return miniPlayerWindow;
}

function getMiniPlayerWindow() {
  return miniPlayerWindow && !miniPlayerWindow.isDestroyed() ? miniPlayerWindow : null;
}

function isMiniPlayerEnabled() {
  return settingsService.get('miniPlayerEnabled') !== false;
}

let miniPlayerActive = false;

function isMiniPlayerActive() {
  const mp = getMiniPlayerWindow();
  if (mp && !mp.isDestroyed() && mp.isVisible()) return true;
  return miniPlayerActive;
}

function setMiniPlayerActive(active) {
  miniPlayerActive = Boolean(active);
}

function showMiniPlayer() {
  if (!isMiniPlayerEnabled()) return null;
  miniPlayerActive = true;
  const win = getMiniPlayerWindow() || createMiniPlayerWindow();
  win.show();
  win.focus();
  return win;
}

function hideMiniPlayer() {
  const win = getMiniPlayerWindow();
  if (win) win.hide();
}

function closeMiniPlayer() {
  miniPlayerActive = false;
  const win = getMiniPlayerWindow();
  if (win && !win.isDestroyed()) {
    win.close();
  }
}

function toggleMiniPlayer() {
  if (!isMiniPlayerEnabled()) {
    hideMiniPlayer();
    miniPlayerActive = false;
    return;
  }
  const win = getMiniPlayerWindow();
  if (win && win.isVisible()) {
    hideMiniPlayer();
    miniPlayerActive = false;
  } else {
    showMiniPlayer();
  }
}

module.exports = {
  createMiniPlayerWindow,
  getMiniPlayerWindow,
  showMiniPlayer,
  hideMiniPlayer,
  closeMiniPlayer,
  toggleMiniPlayer,
  isMiniPlayerEnabled,
  isMiniPlayerActive,
  setMiniPlayerActive
};
