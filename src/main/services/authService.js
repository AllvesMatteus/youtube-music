const { dialog } = require('electron');
const config = require('../config/appConfig');

/**
 * AuthService
 *
 * Responsabilidades:
 *  - setupSessionHeaders: configura User-Agent oficial do Chrome
 *  - importSessionCookies: importa cookies capturados do navegador padrao para o Electron
 *  - clearSession: limpa dados de sessao e cookies com confirmacao
 */
class AuthService {
  setupSessionHeaders(ses) {
    ses.webRequest.onBeforeSendHeaders(function(details, callback) {
      var headers = details.requestHeaders;
      var url = details.url || '';

      var isAuthUrl = url.includes('accounts.google.com') ||
                      url.includes('accounts.youtube.com') ||
                      url.includes('youtube.com/signin');

      if (isAuthUrl) {
        // Para domínios de autenticação do Google, usa o User-Agent do Firefox
        // e remove todos os client hints do Chromium (sec-ch-ua) para contornar
        // com 100% de sucesso o bloqueio 'This browser or app may not be secure'.
        headers['User-Agent'] = config.FIREFOX_UA;

        for (var key of Object.keys(headers)) {
          var lowerKey = key.toLowerCase();
          if (lowerKey.startsWith('sec-ch-ua') || lowerKey === 'x-requested-with') {
            delete headers[key];
          }
        }
      } else {
        // Remove headers que identificam WebViews automatizadas
        delete headers['X-Requested-With'];
        // Sincroniza o User-Agent correspondente ao Chromium nativo
        headers['User-Agent'] = config.CHROME_UA;
      }

      callback({ requestHeaders: headers });
    });
  }

  /**
   * Importa cookies da sessao do navegador padrao (Chrome, Edge, Brave, etc.)
   * para a partition ativa do Electron.
   *
   * Suporta formatos:
   *  - String bruta de cabecalho: "Cookie: SAPISID=...; __Secure-3PSID=..."
   *  - Cabecalhos copiados do DevTools
   *  - Pares separados por ponto e virgula: "SAPISID=...; LOGIN_INFO=..."
   *
   * @param {Electron.Session} ses
   * @param {string} rawData
   * @returns {Promise<{ success: boolean, count: number, error?: string }>}
   */
  async importSessionCookies(ses, rawData) {
    if (!rawData || typeof rawData !== 'string') {
      return { success: false, error: 'Por favor, cole os dados do cookie.' };
    }

    var cookieStr = rawData;
    var cookieMatch = rawData.match(/cookie:\s*([^\r\n]+)/i);
    if (cookieMatch) {
      cookieStr = cookieMatch[1];
    }

    var pairs = cookieStr
      .split(';')
      .map(function(s) { return s.trim(); })
      .filter(function(s) { return s.includes('='); });

    if (pairs.length === 0) {
      return { success: false, error: 'Nenhum cookie valido encontrado no texto.' };
    }

    var count = 0;
    var domains = ['.youtube.com', '.google.com'];

    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i];
      var idx = pair.indexOf('=');
      if (idx === -1) continue;

      var name = pair.substring(0, idx).trim();
      var value = pair.substring(idx + 1).trim();
      if (!name) continue;

      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }

      var isHttpOnly = name.startsWith('__Secure') || name.startsWith('__Host') || name === 'LOGIN_INFO' || name === 'SID' || name === 'HSID' || name === 'SSID';

      for (var d = 0; d < domains.length; d++) {
        var domain = domains[d];
        try {
          await ses.cookies.set({
            url: 'https://music.youtube.com',
            domain: domain,
            path: '/',
            name: name,
            value: value,
            secure: true,
            httpOnly: isHttpOnly
          });
          count++;
        } catch (err) {
          // Ignora cookies invalidos ou de formato restrito
        }
      }
    }

    try {
      await ses.cookies.flushStore();
    } catch (_) {}

    return { success: count > 0, count: count };
  }

  async clearSession(ses, mainWindow) {
    var choice = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Sim, Desconectar', 'Cancelar'],
      defaultId: 1,
      cancelId: 1,
      title: 'Desconectar da Conta',
      message: 'Deseja realmente desconectar e limpar os dados de login?',
      detail: 'Voce precisara fazer login novamente na proxima vez.'
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