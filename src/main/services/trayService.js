const { Tray, Menu, app, nativeImage } = require('electron');
const path = require('path');
const config = require('../config/appConfig');
const settingsService = require('./settingsService');
const { showMiniPlayer, hideMiniPlayer, getMiniPlayerWindow, isMiniPlayerActive, setMiniPlayerActive, isMiniPlayerEnabled } = require('../windows/miniPlayerWindow');

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

    // Clique com botão esquerdo: abre a janela normal ou o mini player (se ativo)
    this.tray.on('click', () => {
      const mp = getMiniPlayerWindow();
      const miniActive = isMiniPlayerActive();

      if (miniActive && isMiniPlayerEnabled()) {
        if (mp && mp.isVisible() && !mp.isMinimized() && mp.isFocused()) {
          hideMiniPlayer();
        } else {
          showMiniPlayer();
        }
        return;
      }

      // Se o mini player não estiver ativo, abre normalmente a janela do YouTube Music
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isVisible() && !mainWindow.isMinimized() && mainWindow.isFocused()) {
          mainWindow.hide();
        } else {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });

    this.tray.on('right-click', () => {
      if (this.tray && this.contextMenu) this.tray.popUpContextMenu(this.contextMenu);
    });

    this.updateMenu(mainWindow, ses);
  }

  setTrackInfo(mainWindow, ses, { title }) {
    this.currentTitle = title || null;
    if (this.tray) {
      this.tray.setToolTip(this.currentTitle || config.APP_NAME);
      this.updateMenu(mainWindow, ses);
    }
  }

  updateMenu(mainWindow, ses) {
    if (!this.tray) return;

    this.contextMenu = Menu.buildFromTemplate([
      {
        label: 'Abrir YouTube Music',
        click: () => {
          setMiniPlayerActive(false);
          if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Atualizar / Recarregar (F5)',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.reload();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Configurações...',
        click: () => {
          const { createSettingsWindow } = require('../windows/settingsWindow');
          createSettingsWindow(mainWindow);
        }
      },
      {
        label: 'Mini Player (F3)' + (settingsService.get('miniPlayerEnabled') !== false ? '' : ' (Desativado)'),
        enabled: settingsService.get('miniPlayerEnabled') !== false,
        click: () => {
          const { toggleMiniPlayer } = require('../windows/miniPlayerWindow');
          toggleMiniPlayer();
        }
      },
      { type: 'separator' },
      {
        label: 'Fechar Aplicativo',
        click: () => { app.isQuitting = true; app.quit(); }
      }
    ]);
  }

  destroy() {
    if (this.tray) { this.tray.destroy(); this.tray = null; }
  }
}

module.exports = new TrayService();
