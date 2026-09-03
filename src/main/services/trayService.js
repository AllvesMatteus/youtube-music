const { Tray, Menu, app, nativeImage } = require('electron');
const path = require('path');
const config = require('../config/appConfig');
const { showMiniPlayer, hideMiniPlayer, getMiniPlayerWindow } = require('../windows/miniPlayerWindow');

class TrayService {
  constructor() {
    this.tray         = null;
    this.currentTitle = null;
    this.contextMenu  = null;
  }

  create(mainWindow, ses) {
    if (this.tray) return;

    const iconPath = path.join(config.PATHS.ASSETS, 'tray-icon.png');
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 32, height: 32, quality: 'best' });

    this.tray = new Tray(icon);
    this.tray.setToolTip(config.APP_NAME);

    this.tray.on('click', () => {
      const mp = getMiniPlayerWindow();
      if (mp && !mp.isDestroyed()) {
        if (mp.isVisible() && !mp.isMinimized()) { hideMiniPlayer(); return; }
        showMiniPlayer(); return;
      }
      showMiniPlayer();
    });

    this.tray.on('right-click', () => {
      if (this.tray && this.contextMenu) this.tray.popUpContextMenu(this.contextMenu);
    });

    this.updateMenu(mainWindow);
  }

  setTrackInfo(mainWindow, ses, { title }) {
    this.currentTitle = title || null;
    if (this.tray) {
      this.tray.setToolTip(this.currentTitle || config.APP_NAME);
      this.updateMenu(mainWindow);
    }
  }

  updateMenu(mainWindow) {
    if (!this.tray) return;

    this.contextMenu = Menu.buildFromTemplate([
      {
        label: 'Abrir YouTube Music',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Mini Player',
        click: () => showMiniPlayer()
      },
      { type: 'separator' },
      {
        label: 'Fechar tudo',
        click: () => { app.isQuitting = true; app.quit(); }
      }
    ]);
  }

  destroy() {
    if (this.tray) { this.tray.destroy(); this.tray = null; }
  }
}

module.exports = new TrayService();
