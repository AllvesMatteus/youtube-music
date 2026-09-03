const { dialog } = require('electron');
const config = require('../config/appConfig');

class AuthService {
  setupSessionHeaders(ses) {
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      const isGoogleAuth = details.url.includes('accounts.google.com') || 
                           details.url.includes('accounts.youtube.com');

      if (isGoogleAuth) {
        details.requestHeaders['User-Agent'] = config.FIREFOX_LOGIN_UA;
        delete details.requestHeaders['Sec-CH-UA'];
        delete details.requestHeaders['Sec-CH-UA-Mobile'];
        delete details.requestHeaders['Sec-CH-UA-Platform'];
        delete details.requestHeaders['Sec-CH-UA-Model'];
        delete details.requestHeaders['X-Requested-With'];
      } else {
        details.requestHeaders['User-Agent'] = config.CHROME_UA;
        delete details.requestHeaders['X-Requested-With'];
      }

      callback({ requestHeaders: details.requestHeaders });
    });
  }
  async clearSession(ses, mainWindow) {
    const choice = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Sim, Desconectar', 'Cancelar'],
      defaultId: 1,
      cancelId: 1,
      title: 'Desconectar da Conta',
      message: 'Deseja realmente desconectar e limpar os dados de login?',
      detail: 'VocÃª precisarÃ¡ fazer login novamente na prÃ³xima vez.'
    });

    if (choice.response === 0) {
      await ses.clearStorageData({
        storages: ['cookies', 'localstorage', 'indexdb', 'cachestorage', 'websql']
      });
      await ses.clearCache();

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(config.YTMUSIC_URL);
      }
    }
  }
}

module.exports = new AuthService();

