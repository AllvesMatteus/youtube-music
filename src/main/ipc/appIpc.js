const { ipcMain, BrowserWindow } = require('electron');
const settingsService = require('../services/settingsService');
const startupService = require('../services/startupService');
const updateService = require('../services/updateService');
const { createSettingsWindow } = require('../windows/settingsWindow');
const { closeMiniPlayer, toggleMiniPlayer, getMiniPlayerWindow } = require('../windows/miniPlayerWindow');

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
    let finalValue = value;
    if (key === 'startWithWindows') {
      finalValue = startupService.setEnabled(value);
      settingsService.set(key, finalValue);
    } else {
      settingsService.set(key, value);
    }

    if (key === 'alwaysOnTop') {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setAlwaysOnTop(Boolean(value));
      }
      const miniWin = getMiniPlayerWindow && getMiniPlayerWindow();
      if (miniWin && !miniWin.isDestroyed()) {
        miniWin.setAlwaysOnTop(Boolean(value));
      }
    }

    if (key === 'miniPlayerEnabled' && value === false) {
      closeMiniPlayer();
    }

    if (key === 'discordPresence') {
      try {
        const discordService = require('../services/discordService');
        if (value) discordService.connect();
        else discordService.clearActivity();
      } catch (_) {}
    }

    if (key === 'theme' || key === 'customCss') {
      try {
        const themeService = require('../services/themeService');
        themeService.applyTheme();
      } catch (_) {}
    }

    // Sincroniza em tempo real com todas as janelas abertas
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send('app-setting-changed', { key, value: finalValue });
      }
    });

    return { key, value: finalValue };
  });

  // Gerenciamento de Teclas de Atalho Customizáveis
  handle('shortcuts:get', () => {
    return settingsService.getShortcuts();
  });

  handle('shortcuts:set', (event, { action, accelerator }) => {
    const updated = settingsService.setShortcut(action, accelerator);
    try {
      const mediaKeysService = require('../services/mediaKeysService');
      mediaKeysService.reregister();
    } catch (_) {}

    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send('shortcuts-updated', updated);
      }
    });

    return updated;
  });

  handle('shortcuts:reset', () => {
    const reset = settingsService.resetShortcuts();
    try {
      const mediaKeysService = require('../services/mediaKeysService');
      mediaKeysService.reregister();
    } catch (_) {}

    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send('shortcuts-updated', reset);
      }
    });

    return reset;
  });

  // Gerenciamento de Temas (OLED, Padrão, Custom)
  handle('theme:set', (event, { theme, customCss }) => {
    const themeService = require('../services/themeService');
    themeService.setTheme(theme, customCss);

    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send('app-setting-changed', { key: 'theme', value: theme });
      }
    });

    return { success: true, theme };
  });

  // Atualizações
  handle('update:check', async () => {
    return await updateService.checkForUpdates(true);
  });

  handle('update:install-now', () => {
    updateService.quitAndInstall();
    return { success: true };
  });

  handle('update:get-status', () => {
    return updateService.getStatus();
  });

  // Janela de Configurações
  handle('settings:open-window', () => {
    const parent = BrowserWindow.getFocusedWindow() || mainWindow;
    createSettingsWindow(parent);
    return { success: true };
  });

  // Controles da Janela Principal (Minimizar, Maximizar, Fechar)
  handle('window:minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (win && !win.isDestroyed()) win.minimize();
    return { success: true };
  });

  handle('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (win && !win.isDestroyed()) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
    return { success: true };
  });

  handle('window:is-maximized', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    return win && !win.isDestroyed() ? win.isMaximized() : false;
  });

  handle('window:close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (win && !win.isDestroyed()) {
      const closeBehavior = settingsService.get('closeBehavior') || 'tray';
      if (closeBehavior === 'exit') {
        const { app } = require('electron');
        app.isQuitting = true;
        app.quit();
      } else {
        win.hide();
      }
    }
    return { success: true };
  });
}

module.exports = { registerAppIpc };
