const { dialog } = require('electron');
const config = require('../config/appConfig');

class AuthService {
  /**
   * Configura os filtros de rede para alternar dinamicamente os cabeçalhos.
   * Quando o usuário acessa accounts.google.com para fazer login:
   *  - Aplica o User-Agent do Firefox
   *  - Remove cabeçalhos de Client Hints (Sec-CH-UA*) que denunciam o Chromium/Electron
   * Para o restante do YouTube Music:
   *  - Aplica o User-Agent oficial do Chrome para suporte pleno a DRM e player.
   */
  setupSessionHeaders(ses) {
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      const isGoogleAuth = details.url.includes('accounts.google.com') || 
                           details.url.includes('accounts.youtube.com');

      if (isGoogleAuth) {
        details.requestHeaders['User-Agent'] = config.FIREFOX_LOGIN_UA;
        // Remove cabeçalhos específicos do Chromium que ativam a detecção do Google
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

  /**
   * Limpa todos os dados salvos da sessão (Cookies, LocalStorage, Cache, IndexedDB)
   * Permite deslogar da conta de forma fácil e segura.
   */
  async clearSession(ses, mainWindow) {
    const choice = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Sim, Desconectar', 'Cancelar'],
      defaultId: 1,
      cancelId: 1,
      title: 'Desconectar da Conta',
      message: 'Deseja realmente desconectar e limpar os dados de login?',
      detail: 'Você precisará fazer login novamente na próxima vez.'
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
