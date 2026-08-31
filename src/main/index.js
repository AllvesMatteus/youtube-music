const { app } = require('electron');
const config = require('./config/appConfig');
const { createMainWindow } = require('./windows/mainWindow');
const { createSplashWindow } = require('./windows/splashWindow');
const mediaKeysService = require('./services/mediaKeysService');
const { registerAppIpc } = require('./ipc/appIpc');
const { createApplicationMenu } = require('./menus/applicationMenu');
const startupService = require('./services/startupService');
const settingsService = require('./services/settingsService');

app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch('disable-features', 'CrossOriginOpenerPolicy');
app.userAgentFallback = config.CHROME_UA;

const gotTheLock = app.requestSingleInstanceLock();
let mainWindow = null;

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized() || !mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    const splashWindow = createSplashWindow();
    mainWindow = createMainWindow(splashWindow);

    if (settingsService.get('alwaysOnTop')) mainWindow.setAlwaysOnTop(true);
    registerAppIpc(mainWindow);
    createApplicationMenu(mainWindow, () => {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('open-account-manager');
    });

    mediaKeysService.register(mainWindow);

    app.on('activate', () => {
      if (!mainWindow || mainWindow.isDestroyed()) {
        mainWindow = createMainWindow();
        mediaKeysService.register(mainWindow);
      } else {
        mainWindow.show();
      }
    });
  });

  app.on('will-quit', () => mediaKeysService.unregisterAll());

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
