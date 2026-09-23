const { app } = require('electron');
const config = require('./config/appConfig');
const { createMainWindow, registerMiniPlayerIpc, showMiniPlayer } = require('./windows/mainWindow');
const { createSplashWindow } = require('./windows/splashWindow');
const mediaKeysService = require('./services/mediaKeysService');
const { registerAppIpc } = require('./ipc/appIpc');
const { createApplicationMenu } = require('./menus/applicationMenu');
const settingsService = require('./services/settingsService');
const updateService = require('./services/updateService');
const discordService = require('./services/discordService');

// Tratamento global para conexões de named pipes (evita pop-up de erro se o Discord for fechado)
process.on('uncaughtException', (err) => {
  if (err && (err.code === 'ENOENT' || err.message?.includes('discord-ipc') || err.message?.includes('pipe'))) {
    return;
  }
  console.error('[Main Process] Erro não tratado:', err);
});

// Otimizações de Memória RAM e Chromium Flags
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,CrossOriginOpenerPolicy');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('renderer-process-limit', '4');
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.userAgentFallback = config.CHROME_UA;

if (settingsService.get('hardwareAcceleration') === false) {
  app.disableHardwareAcceleration();
}

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
    registerMiniPlayerIpc();
    createApplicationMenu(mainWindow, () => {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('open-account-manager');
    }, showMiniPlayer);

    mediaKeysService.register(mainWindow);

    // Inicializa o serviço de atualização contínua (verifica apenas na inicialização)
    updateService.init();

    // Inicializa o Discord Rich Presence se habilitado
    discordService.init();

    if (settingsService.get('miniPlayerEnabled') !== false && settingsService.get('openMiniPlayerOnStart')) {
      setTimeout(showMiniPlayer, 1200);
    }

    app.on('activate', () => {
      if (!mainWindow || mainWindow.isDestroyed()) {
        mainWindow = createMainWindow();
        mediaKeysService.register(mainWindow);
      } else {
        mainWindow.show();
      }
    });
  });

  app.on('will-quit', () => {
    mediaKeysService.unregisterAll();
    discordService.destroy();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
