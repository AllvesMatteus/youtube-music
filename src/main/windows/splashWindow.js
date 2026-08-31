const { BrowserWindow } = require('electron');
const path = require('path');
const config = require('../config/appConfig');

function createSplashWindow() {
  const iconPath = path.join(config.PATHS.ASSETS, 'icon.png');

  const splash = new BrowserWindow({
    width: 380,
    height: 420,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    show: false,
    icon: iconPath,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const splashPath = path.join(__dirname, '../../renderer/splash/splash.html');
  splash.loadFile(splashPath);

  splash.once('ready-to-show', () => {
    splash.show();
  });

  return splash;
}

module.exports = { createSplashWindow };
