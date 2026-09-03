const { BrowserWindow, session, Menu, MenuItem, app, shell } = require('electron');
const path = require('path');
const config = require('../config/appConfig');
const authService = require('../services/authService');
const adblockService = require('../services/adblockService');
const trayService = require('../services/trayService');
const accountService = require('../services/accountService');
const settingsService = require('../services/settingsService');
const windowStateService = require('../services/windowStateService');
const { registerTrackIpc } = require('../ipc/trackIpc');
const { registerAccountIpc } = require('../ipc/accountIpc');
const { createMiniPlayerWindow, showMiniPlayer, hideMiniPlayer, getMiniPlayerWindow } = require('./miniPlayerWindow');

let activeMainWindow = null;
let accountIpcRegistered = false;
let trackIpcRegistered = false;

function setupContextMenu(win, ses) {
  win.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();
    menu.append(new MenuItem({ label: 'Voltar', enabled: win.webContents.canGoBack(), click: () => win.webContents.goBack() }));
    menu.append(new MenuItem({ label: 'Avançar', enabled: win.webContents.canGoForward(), click: () => win.webContents.goForward() }));
    menu.append(new MenuItem({ label: 'Recarregar', click: () => win.webContents.reload() }));
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({ label: 'Desconectar / Limpar Sessão', click: () => authService.clearSession(ses, win) }));
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({ label: 'Fechar Aplicativo', click: () => { app.isQuitting = true; app.quit(); } }));
    menu.popup({ window: win, x: params.x, y: params.y });
  });
}

function sendMiniPlayerCommand(command) {
  if (!activeMainWindow || activeMainWindow.isDestroyed()) return;
  activeMainWindow.webContents.send('mini-player-command', command);
}

function registerMiniPlayerIpc() {
  const { ipcMain } = require('electron');
  ipcMain.on('mini-player-command', (event, command) => {
    if (command === 'exit') {
      app.isQuitting = true;
      app.quit();
      return;
    }
    sendMiniPlayerCommand(command);
  });

  ipcMain.on('mini-player-close', () => {
    if (settingsService.get('closeBehavior') === 'exit') {
      app.isQuitting = true;
      app.quit();
    } else {
      hideMiniPlayer();
    }
  });

  ipcMain.on('mini-player-minimize', () => hideMiniPlayer());
  ipcMain.on('open-main-window', () => {
    if (activeMainWindow && !activeMainWindow.isDestroyed()) {
      activeMainWindow.show();
      activeMainWindow.focus();
    }
  });

  ipcMain.on('open-account-manager', () => {
    if (activeMainWindow && !activeMainWindow.isDestroyed()) {
      activeMainWindow.show();
      activeMainWindow.focus();
      activeMainWindow.webContents.send('open-account-manager');
    }
  });
}

function createMainWindow(splashWindow = null) {
  const currentPartition = accountService.getActivePartition();
  const ses = session.fromPartition(currentPartition);
  authService.setupSessionHeaders(ses);
  adblockService.enable(ses);
  const windowState = windowStateService.get('main');
  const iconPath = path.join(config.PATHS.ASSETS, 'icon.png');

  const win = new BrowserWindow({
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
    backgroundColor: config.WINDOW.BACKGROUND_COLOR,
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
  win.webContents.on('will-prevent-unload', event => event.preventDefault());

  const showMainWindow = () => {
    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();
    if (!win.isVisible()) {
      if (windowState.isMaximized) win.maximize();
      win.show();
      win.focus();
    }
  };

  win.once('ready-to-show', () => setTimeout(showMainWindow, 800));
  setTimeout(showMainWindow, 3500);

  win.on('close', event => {
    if (!app.isQuitting) {
      event.preventDefault();
      win.hide();
      trayService.updateMenu(win, ses);
    }
  });
  win.on('show', () => trayService.updateMenu(win, ses));
  win.on('hide', () => trayService.updateMenu(win, ses));
  trayService.create(win, ses);

  win.webContents.setWindowOpenHandler(({ url }) => {
    const isGoogleAuth = url.includes('accounts.google.com') || url.includes('accounts.youtube.com');
    const isYTMusic = url.includes('music.youtube.com');
    if (!isGoogleAuth && !isYTMusic) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true, backgroundColor: config.WINDOW.BACKGROUND_COLOR, webPreferences: { partition: currentPartition, contextIsolation: false, nodeIntegration: false, plugins: false, sandbox: false,
      backgroundThrottling: false } } };
  });

  win.webContents.on('did-create-window', childWindow => childWindow.webContents.setUserAgent(config.CHROME_UA));
  setupContextMenu(win, ses);

  if (!trackIpcRegistered) {
    registerTrackIpc(win, ses);
    trackIpcRegistered = true;
  }
  if (!accountIpcRegistered) {
    const reloadWithNewPartition = () => {
      const oldWin = activeMainWindow;
      const newWin = createMainWindow();
      if (oldWin && !oldWin.isDestroyed()) oldWin.destroy();
      return newWin;
    };
    registerAccountIpc(win, reloadWithNewPartition);
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





