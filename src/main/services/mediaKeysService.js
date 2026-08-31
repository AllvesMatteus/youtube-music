const { globalShortcut } = require('electron');

class MediaKeysService {
  register(mainWindow) {
    try {
      // Tecla Play / Pause
      globalShortcut.register('MediaPlayPause', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('media-play-pause');
        }
      });

      // Tecla Próxima Faixa
      globalShortcut.register('MediaNextTrack', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('media-next');
        }
      });

      // Tecla Faixa Anterior
      globalShortcut.register('MediaPreviousTrack', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('media-previous');
        }
      });

      // Tecla Parar
      globalShortcut.register('MediaStop', () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('media-stop');
        }
      });

      console.log('[MediaKeysService] ⌨️ Teclas globais de mídia registradas com sucesso.');
    } catch (error) {
      console.error('[MediaKeysService] Erro ao registrar teclas de atalho:', error);
    }
  }

  unregisterAll() {
    globalShortcut.unregisterAll();
    console.log('[MediaKeysService] Teclas globais desregistradas.');
  }
}

module.exports = new MediaKeysService();
