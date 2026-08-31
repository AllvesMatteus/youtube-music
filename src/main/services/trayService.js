const { Tray, Menu, app, nativeImage } = require('electron');
const path = require('path');
const config = require('../config/appConfig');
const authService = require('./authService');

class TrayService {
  constructor() {
    this.tray = null;
    this.currentTrack = null;
    this.icons = {};
  }

  loadIcons() {
    const iconNames = ['play', 'pause', 'next', 'previous', 'stop', 'equalizer', 'repeat', 'rewind', 'fast-forward'];
    for (const name of iconNames) {
      const p = path.join(config.PATHS.ASSETS, 'icons', `${name}.png`);
      this.icons[name] = nativeImage.createFromPath(p).resize({ width: 16, height: 16 });
    }
  }

  create(mainWindow, ses) {
    if (this.tray) return;

    this.loadIcons();

    const iconPath = path.join(config.PATHS.ASSETS, 'tray-icon.png');
    let trayIcon = nativeImage.createFromPath(iconPath);
    trayIcon = trayIcon.resize({ width: 24, height: 24 });

    this.tray = new Tray(trayIcon);
    this.tray.setToolTip(config.APP_NAME);

    // Clique com o botão esquerdo: alterna entre mostrar e ocultar a janela
    this.tray.on('click', () => {
      this.toggleWindow(mainWindow);
    });

    this.updateMenu(mainWindow, ses);
  }

  setTrackInfo(mainWindow, ses, { title, artist }) {
    this.currentTrack = title && artist ? `${title} • ${artist}` : title || null;
    if (this.tray) {
      this.tray.setToolTip(this.currentTrack ? `🎵 ${this.currentTrack} — ${config.APP_NAME}` : config.APP_NAME);
      this.updateMenu(mainWindow, ses);
    }
  }

  toggleWindow(mainWindow) {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isVisible() && !mainWindow.isMinimized()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  }

  updateMenu(mainWindow, ses) {
    if (!this.tray) return;

    const contextMenu = Menu.buildFromTemplate([
      {
        label: this.currentTrack ? this.currentTrack : 'YouTube Music',
        icon: this.icons.equalizer,
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Play / Pause',
        icon: this.icons.play,
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('media-play-pause');
          }
        }
      },
      {
        label: 'Próxima Música',
        icon: this.icons.next,
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('media-next');
          }
        }
      },
      {
        label: 'Música Anterior',
        icon: this.icons.previous,
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('media-previous');
          }
        }
      },
      {
        label: 'Parar',
        icon: this.icons.stop,
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('media-stop');
          }
        }
      },
      { type: 'separator' },
      {
        label: mainWindow && mainWindow.isVisible() ? 'Ocultar Janela' : 'Mostrar Janela',
        click: () => this.toggleWindow(mainWindow)
      },
      {
        label: 'Desconectar / Limpar Sessão',
        click: () => {
          if (ses && mainWindow) {
            authService.clearSession(ses, mainWindow);
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Sair do Aplicativo',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = new TrayService();
