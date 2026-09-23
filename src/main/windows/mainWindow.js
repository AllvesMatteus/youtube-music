const { BrowserWindow, session, Menu, MenuItem, app, shell } = require('electron');
const path = require('path');
const config = require('../config/appConfig');
const authService = require('../services/authService');
const adblockService = require('../services/adblockService');
const trayService = require('../services/trayService');
const accountService = require('../services/accountService');
const settingsService = require('../services/settingsService');
const windowStateService = require('../services/windowStateService');
const diagnosticService = require('../services/diagnosticService');
const { registerTrackIpc } = require('../ipc/trackIpc');
const { registerAccountIpc } = require('../ipc/accountIpc');
const { createMiniPlayerWindow, showMiniPlayer, hideMiniPlayer, getMiniPlayerWindow, toggleMiniPlayer, setMiniPlayerActive } = require('./miniPlayerWindow');
const { createLoginWindow } = require('./loginWindow');
const { createDiagnosticWindow } = require('./diagnosticWindow');
const { createSettingsWindow } = require('./settingsWindow');

let activeMainWindow = null;
let accountIpcRegistered = false;
let trackIpcRegistered = false;

function setupContextMenu(win, ses, openLoginWindow, performLogout) {
  win.webContents.on('context-menu', function(event, params) {
    var menu = new Menu();
    menu.append(new MenuItem({ label: 'Voltar', enabled: win.webContents.canGoBack(), click: function() { win.webContents.goBack(); } }));
    menu.append(new MenuItem({ label: 'Avançar', enabled: win.webContents.canGoForward(), click: function() { win.webContents.goForward(); } }));
    menu.append(new MenuItem({ label: 'Atualizar / Recarregar (F5)', accelerator: 'F5', click: function() { win.webContents.reload(); } }));
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({
      label: 'Configurações...',
      click: function() { createSettingsWindow(win); }
    }));
    const miniPlayerActive = settingsService.get('miniPlayerEnabled') !== false;
    menu.append(new MenuItem({
      label: 'Mini Player (F3)' + (miniPlayerActive ? '' : ' (Desativado)'),
      accelerator: miniPlayerActive ? 'F3' : undefined,
      enabled: miniPlayerActive,
      click: function() { toggleMiniPlayer(); }
    }));
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({
      label: 'Desconectar / Sair da Conta',
      click: function() { if (typeof performLogout === 'function') performLogout(); }
    }));
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({ label: 'Fechar Aplicativo', click: function() { app.isQuitting = true; app.quit(); } }));
    menu.popup({ window: win, x: params.x, y: params.y });
  });
}

function sendMiniPlayerCommand(command) {
  if (!activeMainWindow || activeMainWindow.isDestroyed()) return;
  activeMainWindow.webContents.send('mini-player-command', command);
}

function registerMiniPlayerIpc() {
  var { ipcMain } = require('electron');
  ipcMain.on('mini-player-command', function(event, command) {
    if (command === 'exit') {
      app.isQuitting = true;
      app.quit();
      return;
    }
    sendMiniPlayerCommand(command);
  });

  ipcMain.on('mini-player-close', function() {
    if (settingsService.get('closeBehavior') === 'exit') {
      app.isQuitting = true;
      app.quit();
    } else {
      hideMiniPlayer();
    }
  });

  ipcMain.on('mini-player-minimize', function() { hideMiniPlayer(); });

  ipcMain.on('open-main-window', function() {
    setMiniPlayerActive(false);
    if (activeMainWindow && !activeMainWindow.isDestroyed()) {
      if (activeMainWindow.isMinimized()) activeMainWindow.restore();
      activeMainWindow.show();
      activeMainWindow.focus();
    }
  });

  ipcMain.on('open-account-manager', function() {
    if (activeMainWindow && !activeMainWindow.isDestroyed()) {
      activeMainWindow.show();
      activeMainWindow.focus();
      activeMainWindow.webContents.send('open-account-manager');
    }
  });
}

function createMainWindow(splashWindow) {
  splashWindow = splashWindow || null;
  var currentPartition = accountService.getActivePartition();
  var ses = session.fromPartition(currentPartition);
  authService.setupSessionHeaders(ses);
  adblockService.enable(ses);
  var windowState = windowStateService.get('main');
  var iconPath = path.join(config.PATHS.ASSETS, 'icon.png');

  var win = new BrowserWindow({
    width: windowState.width || config.WINDOW.DEFAULT_WIDTH,
    height: windowState.height || config.WINDOW.DEFAULT_HEIGHT,
    minWidth: config.WINDOW.MIN_WIDTH,
    minHeight: config.WINDOW.MIN_HEIGHT,
    x: windowState.x !== undefined ? windowState.x : undefined,
    y: windowState.y !== undefined ? windowState.y : undefined,
    title: config.APP_NAME,
    icon: iconPath,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#000000',
    titleBarStyle: 'hidden',
    webPreferences: {
      partition: currentPartition,
      preload: config.PATHS.PRELOAD,
      contextIsolation: false,
      nodeIntegration: false,
      plugins: false,
      sandbox: false,
      backgroundThrottling: false
    }
  });

  activeMainWindow = win;
  if (settingsService.get('alwaysOnTop')) win.setAlwaysOnTop(true);
  windowStateService.track(win, 'main');
  win.webContents.setUserAgent(config.CHROME_UA);
  win.webContents.on('will-prevent-unload', function(event) { event.preventDefault(); });

  win.on('maximize', function() {
    if (!win.isDestroyed()) win.webContents.send('window-maximized-state', true);
  });
  win.on('unmaximize', function() {
    if (!win.isDestroyed()) win.webContents.send('window-maximized-state', false);
  });

  var showMainWindow = function() {
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
    if (!win.isVisible()) {
      if (windowState.isMaximized) win.maximize();
      win.show();
      win.focus();
    }
  };

  win.once('ready-to-show', function() { setTimeout(showMainWindow, 800); });
  setTimeout(showMainWindow, 3500);

  win.on('close', function(event) {
    if (!app.isQuitting) {
      var closeBehavior = settingsService.get('closeBehavior') || 'tray';
      if (closeBehavior === 'exit') {
        app.isQuitting = true;
        app.quit();
      } else {
        event.preventDefault();
        win.hide();
        trayService.updateMenu(win, ses);
      }
    }
  });
  win.on('show', function() { trayService.updateMenu(win, ses); });
  win.on('hide', function() { trayService.updateMenu(win, ses); });
  trayService.create(win, ses);

  // ── Autenticação via Janela de Login Interna (Firefox UA Anti-Detecção) ─────────────
  var openLoginWindow = function() {
    createLoginWindow(win, function() {
      if (!win.isDestroyed()) {
        win.show();
        win.focus();
        win.loadURL(config.YTMUSIC_URL);
      }
    });
  };

  // ── Encerramento Limpo de Sessão (Logout / Sair) ──────────────────────────────────
  var performLogout = async function() {
    diagnosticService.logEvent('AUTH_200_LOGOUT', 'Desconexão / Logout solicitado.');
    try {
      await ses.clearStorageData({
        storages: ['cookies', 'localstorage', 'indexdb', 'cachestorage', 'websql']
      });
      await ses.clearCache();
      accountService.updateActiveAccountInfo({ name: null, email: null });
    } catch (err) {
      diagnosticService.logEvent('ERR_LOGOUT_CLEAR', 'Falha ao limpar armazenamento na desconexão:', err.message);
    }
    if (win && !win.isDestroyed()) {
      win.loadURL(config.YTMUSIC_URL);
    }
  };

  var isLogoutUrl = function(url) {
    if (!url) return false;
    var lower = url.toLowerCase();
    return lower.includes('/logout') ||
           lower.includes('/signout') ||
           lower.includes('logout2') ||
           lower.includes('action_logout=1');
  };

  var handleGoogleAuthAttempt = function(event, url) {
    if (!url) return false;

    // Se for rota de Logout, executa performLogout e cancela a navegação desnecessária
    if (isLogoutUrl(url)) {
      if (event) event.preventDefault();
      performLogout();
      return true;
    }

    var isGoogleAuth = (
      url.includes('accounts.google.com') ||
      url.includes('accounts.youtube.com') ||
      url.includes('youtube.com/signin')
    );
    if (isGoogleAuth) {
      if (event) event.preventDefault();
      openLoginWindow();
      return true;
    }
    return false;
  };

  win.webContents.on('will-navigate', function(event, url) {
    handleGoogleAuthAttempt(event, url);
  });

  win.webContents.on('will-redirect', function(event, url) {
    handleGoogleAuthAttempt(event, url);
  });

  win.webContents.on('did-navigate', function(event, url) {
    if (isLogoutUrl(url)) {
      performLogout();
    } else if (url.includes('accounts.google.com') || url.includes('accounts.youtube.com') || url.includes('youtube.com/signin')) {
      handleGoogleAuthAttempt(event, url);
    }
  });

  // Atalhos de Teclado (F1 a F5 + Teclas de Mídia quando focado)
  win.webContents.on('before-input-event', function(event, input) {
    if (input.type !== 'keyDown') return;

    if (input.key === 'F1') {
      event.preventDefault();
      createDiagnosticWindow(win, ses, openLoginWindow, performLogout);
    } else if (input.key === 'F2') {
      event.preventDefault();
      openLoginWindow();
    } else if (input.key === 'F3') {
      event.preventDefault();
      if (settingsService.get('miniPlayerEnabled') !== false) {
        toggleMiniPlayer();
      }
    } else if (input.key === 'F5') {
      event.preventDefault();
      win.webContents.reload();
    } else if (input.key === 'MediaPlayPause' || input.code === 'MediaPlayPause') {
      event.preventDefault();
      win.webContents.send('media-play-pause');
    } else if (input.key === 'MediaNextTrack' || input.code === 'MediaTrackNext') {
      event.preventDefault();
      win.webContents.send('media-next');
    } else if (input.key === 'MediaPreviousTrack' || input.code === 'MediaTrackPrevious') {
      event.preventDefault();
      win.webContents.send('media-previous');
    } else if (input.key === 'MediaStop' || input.code === 'MediaStop') {
      event.preventDefault();
      win.webContents.send('media-stop');
    }
  });

  // Manipulador de comandos multimídia de drivers de hardware (ex: Viper V770 RGB)
  win.on('app-command', function(event, cmd) {
    if (cmd === 'media-play-pause' || cmd === 'media-play' || cmd === 'media-pause') {
      win.webContents.send('media-play-pause');
    } else if (cmd === 'media-next-track') {
      win.webContents.send('media-next');
    } else if (cmd === 'media-previous-track') {
      win.webContents.send('media-previous');
    } else if (cmd === 'media-stop') {
      win.webContents.send('media-stop');
    }
  });

  win.webContents.on('did-finish-load', function() {
    try {
      const themeService = require('../services/themeService');
      themeService.init(win);
    } catch (_) {}
  });

  // Manipulador de janelas abertas pelo YouTube Music
  win.webContents.setWindowOpenHandler(function(details) {
    var url = details.url;

    if (isLogoutUrl(url)) {
      performLogout();
      return { action: 'deny' };
    }

    var isGoogleAuth = url.includes('accounts.google.com') ||
                       url.includes('accounts.youtube.com') ||
                       url.includes('youtube.com/signin');
    if (isGoogleAuth) {
      handleGoogleAuthAttempt(null, url);
      return { action: 'deny' };
    }

    var isYTMusic = url.includes('music.youtube.com');
    if (!isYTMusic) {
      shell.openExternal(url);
      return { action: 'deny' };
    }

    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        autoHideMenuBar: true,
        backgroundColor: config.WINDOW.BACKGROUND_COLOR,
        webPreferences: {
          partition: currentPartition,
          contextIsolation: false,
          nodeIntegration: false,
          plugins: false,
          sandbox: false,
          backgroundThrottling: false
        }
      }
    };
  });

  win.webContents.on('did-create-window', function(childWindow) {
    childWindow.webContents.setUserAgent(config.CHROME_UA);
  });

  setupContextMenu(win, ses, openLoginWindow, performLogout);

  if (!trackIpcRegistered) {
    registerTrackIpc(win, ses);
    trackIpcRegistered = true;
  }
  if (!accountIpcRegistered) {
    var reloadWithNewPartition = function() {
      var oldWin = activeMainWindow;
      var newWin = createMainWindow();
      if (oldWin && !oldWin.isDestroyed()) oldWin.destroy();
      return newWin;
    };
    registerAccountIpc(win, reloadWithNewPartition, performLogout, openLoginWindow);
    accountIpcRegistered = true;
  }

  win.loadURL(config.YTMUSIC_URL);
  return win;
}

module.exports = {
  createMainWindow,
  createMiniPlayerWindow,
  showMiniPlayer,
  getMiniPlayerWindow,
  registerMiniPlayerIpc
};
