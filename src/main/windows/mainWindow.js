const { BrowserWindow, session, Menu, MenuItem, app, shell } = require('electron');
const path = require('path');
const config = require('../config/appConfig');
const authService = require('../services/authService');
const adblockService = require('../services/adblockService');
const trayService = require('../services/trayService');
const accountService = require('../services/accountService');
const windowStateService = require('../services/windowStateService');
const { registerTrackIpc } = require('../ipc/trackIpc');
const { registerAccountIpc } = require('../ipc/accountIpc');

let activeMainWindow = null;

function setupContextMenu(win, ses) {
  win.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();

    menu.append(new MenuItem({
      label: 'Voltar',
      enabled: win.webContents.canGoBack(),
      click: () => win.webContents.goBack()
    }));

    menu.append(new MenuItem({
      label: 'Avançar',
      enabled: win.webContents.canGoForward(),
      click: () => win.webContents.goForward()
    }));

    menu.append(new MenuItem({
      label: 'Recarregar',
      click: () => win.webContents.reload()
    }));

    menu.append(new MenuItem({ type: 'separator' }));

    menu.append(new MenuItem({
      label: 'Desconectar / Limpar Sessão',
      click: () => authService.clearSession(ses, win)
    }));

    menu.append(new MenuItem({ type: 'separator' }));

    menu.append(new MenuItem({
      label: 'Fechar Aplicativo',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }));

    menu.popup({ window: win, x: params.x, y: params.y });
  });
}

function createMainWindow(splashWindow = null) {
  const currentPartition = accountService.getActivePartition();
  const ses = session.fromPartition(currentPartition);
  
  // 1. Configura os cabeçalhos para login seguro
  authService.setupSessionHeaders(ses);

  // 2. Ativa o bloqueador de anúncios profissional (Ghostery/EasyList)
  adblockService.enable(ses);

  // 3. Carrega o estado salvo da janela (tamanho e posição)
  const windowState = windowStateService.load();
  const iconPath = path.join(config.PATHS.ASSETS, 'icon.png');

  const windowOptions = {
    width: windowState.width || config.WINDOW.DEFAULT_WIDTH,
    height: windowState.height || config.WINDOW.DEFAULT_HEIGHT,
    minWidth: config.WINDOW.MIN_WIDTH,
    minHeight: config.WINDOW.MIN_HEIGHT,
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
      plugins: true,
      sandbox: false
    }
  };

  if (typeof windowState.x === 'number' && typeof windowState.y === 'number') {
    windowOptions.x = windowState.x;
    windowOptions.y = windowState.y;
  }

  const win = new BrowserWindow(windowOptions);
  activeMainWindow = win;

  // Ativa o rastreamento automático de redimensionamento/movimentação
  windowStateService.track(win);

  win.webContents.setUserAgent(config.CHROME_UA);

  // Desativa qualquer diálogo nativo de beforeunload do YouTube
  win.webContents.on('will-prevent-unload', (event) => {
    event.preventDefault();
  });

  // Transição suave da Splash Screen para a Janela Principal
  const showMainWindow = () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    if (!win.isVisible()) {
      if (windowState.isMaximized) {
        win.maximize();
      }
      win.show();
      win.focus();
    }
  };

  win.once('ready-to-show', () => {
    setTimeout(showMainWindow, 800);
  });

  setTimeout(showMainWindow, 3500);

  // Botão "X": oculta na bandeja em vez de fechar bruscamente
  win.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win.hide();
      trayService.updateMenu(win, ses);
    }
  });

  win.on('show', () => trayService.updateMenu(win, ses));
  win.on('hide', () => trayService.updateMenu(win, ses));

  // Inicializa o System Tray
  trayService.create(win, ses);

  // Navegação Segura: links externos (termos, suporte, etc.) abrem no navegador do Windows
  win.webContents.setWindowOpenHandler(({ url }) => {
    const isGoogleAuth = url.includes('accounts.google.com') || url.includes('accounts.youtube.com');
    const isYTMusic = url.includes('music.youtube.com');

    if (!isGoogleAuth && !isYTMusic) {
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
          plugins: true,
          sandbox: false
        }
      }
    };
  });

  win.webContents.on('did-create-window', (childWindow) => {
    childWindow.webContents.setUserAgent(config.CHROME_UA);
  });

  setupContextMenu(win, ses);
  registerTrackIpc(win, ses);

  // Recria a janela ao trocar de partição de conta
  const reloadWithNewPartition = () => {
    const oldWin = activeMainWindow;
    const newWin = createMainWindow();
    if (oldWin && !oldWin.isDestroyed()) {
      oldWin.destroy();
    }
    return newWin;
  };

  registerAccountIpc(win, reloadWithNewPartition);

  win.loadURL(config.YTMUSIC_URL);

  return win;
}

module.exports = { createMainWindow };
