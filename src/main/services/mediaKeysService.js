const { globalShortcut } = require('electron');

class MediaKeysService {
  register(mainWindow) {
    try {
      this.unregisterAll();

      const bindings = [
        { key: 'MediaPlayPause', event: 'media-play-pause' },
        { key: 'MediaNextTrack', event: 'media-next' },
        { key: 'MediaPreviousTrack', event: 'media-previous' },
        { key: 'MediaStop', event: 'media-stop' }
      ];

      bindings.forEach(({ key, event }) => {
        globalShortcut.register(key, () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send(event);
          }
        });
      });
    } catch (error) {
      console.error('[MediaKeysService] Erro ao registrar teclas de atalho:', error);
    }
  }

  unregisterAll() {
    globalShortcut.unregisterAll();
  }
}

module.exports = new MediaKeysService();
