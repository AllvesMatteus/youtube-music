const { globalShortcut } = require('electron');
const settingsService = require('./settingsService');

class MediaKeysService {
  constructor() {
    this.mainWindow = null;
    this.registeredShortcuts = [];
  }

  register(mainWindow) {
    this.mainWindow = mainWindow;
    this.reregister();
  }

  reregister() {
    try {
      this.unregisterAll();
      if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

      const shortcuts = settingsService.getShortcuts();

      const actions = [
        {
          id: 'playPause',
          accelerator: shortcuts.playPause,
          handler: () => {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
              this.mainWindow.webContents.send('media-play-pause');
            }
          }
        },
        {
          id: 'nextTrack',
          accelerator: shortcuts.nextTrack,
          handler: () => {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
              this.mainWindow.webContents.send('media-next');
            }
          }
        },
        {
          id: 'prevTrack',
          accelerator: shortcuts.prevTrack,
          handler: () => {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
              this.mainWindow.webContents.send('media-previous');
            }
          }
        },
        {
          id: 'volumeUp',
          accelerator: shortcuts.volumeUp,
          handler: () => {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
              this.mainWindow.webContents.send('media-volume-up');
            }
          }
        },
        {
          id: 'volumeDown',
          accelerator: shortcuts.volumeDown,
          handler: () => {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
              this.mainWindow.webContents.send('media-volume-down');
            }
          }
        },
        {
          id: 'toggleMiniPlayer',
          accelerator: shortcuts.toggleMiniPlayer,
          handler: () => {
            if (settingsService.get('miniPlayerEnabled') !== false) {
              try {
                const { toggleMiniPlayer } = require('../windows/miniPlayerWindow');
                toggleMiniPlayer();
              } catch (_) {}
            }
          }
        }
      ];

      const registeredAccels = new Set();

      actions.forEach(({ accelerator, handler }) => {
        if (accelerator && typeof accelerator === 'string' && accelerator.trim() !== '' && accelerator.toLowerCase() !== 'disabled') {
          const acc = accelerator.trim();
          try {
            const ok = globalShortcut.register(acc, handler);
            if (ok) {
              registeredAccels.add(acc.toLowerCase());
              this.registeredShortcuts.push(acc);
            } else {
              console.warn(`[MediaKeysService] Atalho "${acc}" não pôde ser registrado globalmente (possível conflito com outro programa).`);
            }
          } catch (e) {
            console.warn(`[MediaKeysService] Erro ao registrar atalho "${acc}":`, e.message);
          }
        }
      });

      // Teclas de hardware como fallback universal (caso o atalho do usuário seja uma combinação customizada)
      const hardwareFallbacks = [
        { key: 'MediaPlayPause', event: 'media-play-pause' },
        { key: 'MediaNextTrack', event: 'media-next' },
        { key: 'MediaPreviousTrack', event: 'media-previous' },
        { key: 'MediaStop', event: 'media-stop' }
      ];

      hardwareFallbacks.forEach(({ key, event }) => {
        if (!registeredAccels.has(key.toLowerCase())) {
          try {
            const ok = globalShortcut.register(key, () => {
              if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                this.mainWindow.webContents.send(event);
              }
            });
            if (ok) {
              registeredAccels.add(key.toLowerCase());
              this.registeredShortcuts.push(key);
            }
          } catch (_) {}
        }
      });
    } catch (error) {
      console.error('[MediaKeysService] Erro ao registrar teclas de atalho:', error);
    }
  }

  unregisterAll() {
    try {
      globalShortcut.unregisterAll();
      this.registeredShortcuts = [];
    } catch (error) {
      console.error('[MediaKeysService] Erro ao desregistrar atalhos:', error);
    }
  }
}

module.exports = new MediaKeysService();
