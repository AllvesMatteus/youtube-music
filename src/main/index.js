const { app } = require('electron');
const config = require('./config/appConfig');
const { createMainWindow } = require('./windows/mainWindow');
const { createSplashWindow } = require('./windows/splashWindow');
const mediaKeysService = require('./services/mediaKeysService');

// Remove o flag de automação do Chromium antes do app inicializar
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch('disable-features', 'CrossOriginOpenerPolicy');
app.userAgentFallback = config.CHROME_UA;

// Garante instância única do aplicativo
const gotTheLock = app.requestSingleInstanceLock();

let mainWindow = null;

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized() || !mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // 1. Cria e exibe a Splash Screen de carregamento
    const splashWindow = createSplashWindow();

    // 2. Inicializa a janela principal em segundo plano conectada à splash
    mainWindow = createMainWindow(splashWindow);

    // 3. Ativa as teclas de mídia do teclado
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

  app.on('will-quit', () => {
    mediaKeysService.unregisterAll();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
