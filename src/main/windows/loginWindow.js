const { BrowserWindow, session, shell } = require('electron');
const path = require('path');
const config = require('../config/appConfig');
const accountService = require('../services/accountService');
const diagnosticService = require('../services/diagnosticService');

let loginWin = null;

/**
 * Cria a janela de login do Google / YouTube Music.
 *
 * ESTRATÉGIA ANTI-DETECÇÃO RIGOROSA:
 * - Sessão isolada 'persist:yt-login-temp' limpa automaticamente antes de cada uso.
 * - Injeta loginPreload.js para anular propriedades que identificam Chromium (window.chrome,
 *   navigator.userAgentData, navigator.vendor = "").
 * - Header User-Agent do Firefox forçado em todas as requisições para o Google.
 * - Client Hints do Chromium (sec-ch-ua) e X-Requested-With removidos.
 * - Mantém Sec-Fetch-* idênticos ao Firefox real.
 * - Ao detectar music.youtube.com autenticado, transfere os cookies para a partição ativa.
 */
async function createLoginWindow(parentWindow, onComplete) {
  if (loginWin && !loginWin.isDestroyed()) {
    loginWin.show();
    loginWin.focus();
    return loginWin;
  }

  diagnosticService.logEvent('AUTH_100_LOGIN_REQUESTED', 'Janela de login solicitada.');

  const loginPartition = 'persist:yt-login-temp';
  const loginSes = session.fromPartition(loginPartition);

  // Limpa cookies e cache anteriores para evitar que o Google herde bloqueios passados
  try {
    await loginSes.clearStorageData();
    await loginSes.clearCache();
  } catch (err) {
    console.warn('[LoginWindow] Aviso ao limpar sessão temporária:', err.message);
  }

  // Intercepta requisições HTTP para forçar Firefox UA e remover Client Hints do Chromium
  loginSes.webRequest.onBeforeSendHeaders(
    { urls: ['https://*.google.com/*', 'https://*.youtube.com/*', 'https://*.googleapis.com/*'] },
    (details, callback) => {
      const headers = details.requestHeaders;
      headers['User-Agent'] = config.FIREFOX_UA;

      // Remove apenas sec-ch-ua e x-requested-with (mantém sec-fetch-* pois Firefox envia)
      for (const key of Object.keys(headers)) {
        const lower = key.toLowerCase();
        if (lower.startsWith('sec-ch-ua') || lower === 'x-requested-with') {
          delete headers[key];
        }
      }

      callback({ cancel: false, requestHeaders: headers });
    }
  );

  const preloadScript = path.join(__dirname, '../../preload/loginPreload.js');

  loginWin = new BrowserWindow({
    width: 520,
    height: 680,
    center: true,
    parent: null, // Sem parent fixo para garantir que não fique atrás da janela maximizada
    modal: false,
    title: 'Fazer Login — Conta Google',
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      partition: loginPartition,
      preload: preloadScript,
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true
    }
  });

  // Força foco na frente imediatamente
  loginWin.setAlwaysOnTop(true);
  loginWin.show();
  loginWin.focus();
  setTimeout(() => {
    if (loginWin && !loginWin.isDestroyed()) {
      loginWin.setAlwaysOnTop(false);
    }
  }, 600);

  loginWin.webContents.setUserAgent(config.FIREFOX_UA);

  diagnosticService.logEvent('AUTH_101_WINDOW_OPENED', 'Janela de login aberta com proteção anti-detecção.');

  const activePartition = accountService.getActivePartition();
  const activeSes = session.fromPartition(activePartition);

  let completed = false;

  const handleSuccess = async (url) => {
    if (!url || completed) return;

    try {
      const parsed = new URL(url);
      if (parsed.hostname !== 'music.youtube.com') return;
    } catch (_) {
      return;
    }

    completed = true;

    try {
      const allCookies = await loginSes.cookies.get({});
      let injected = 0;

      for (const c of allCookies) {
        const isGoogleDomain = c.domain && (
          c.domain.includes('google.com') ||
          c.domain.includes('youtube.com')
        );
        if (!isGoogleDomain) continue;

        try {
          const proto = c.secure ? 'https' : 'http';
          const cleanHost = c.domain.replace(/^\./, '');
          const cookieUrl = `${proto}://${cleanHost}${c.path || '/'}`;

          await activeSes.cookies.set({
            url: cookieUrl,
            domain: c.domain,
            path: c.path || '/',
            name: c.name,
            value: c.value,
            secure: Boolean(c.secure),
            httpOnly: Boolean(c.httpOnly),
            expirationDate: c.expirationDate
          });
          injected++;
        } catch (_) {}
      }

      if (injected > 0) {
        try { await activeSes.cookies.flushStore(); } catch (_) {}
        diagnosticService.logEvent('AUTH_102_SUCCESS', `Login concluído com sucesso! ${injected} cookies sincronizados.`);
      } else {
        diagnosticService.logEvent('AUTH_102_SUCCESS', 'Login concluído.');
      }
    } catch (err) {
      diagnosticService.logEvent('ERR_COOKIE_COPY', 'Falha ao copiar cookies da sessão de login.', err.message);
    }

    setTimeout(() => {
      if (typeof onComplete === 'function') {
        onComplete();
      }
      if (loginWin && !loginWin.isDestroyed()) {
        loginWin.close();
      }
    }, 400);
  };

  loginWin.webContents.on('will-navigate', (_event, url) => handleSuccess(url));
  loginWin.webContents.on('will-redirect', (_event, url) => handleSuccess(url));
  loginWin.webContents.on('did-navigate', (_event, url) => handleSuccess(url));

  loginWin.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    if (errorCode === -3) return; // Abortado / redirecionado normalmente
    diagnosticService.logEvent('ERR_AUTH_001', `Falha ao carregar página de autenticação (${errorCode}: ${errorDescription})`, validatedURL);

    // Renderiza tela amigável de erro com código e botão de tentar novamente
    if (loginWin && !loginWin.isDestroyed()) {
      const errHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: sans-serif; background: #121212; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; text-align: center; }
            h2 { color: #ff5555; margin-bottom: 8px; }
            p { color: #aaa; font-size: 13px; line-height: 1.5; margin-bottom: 20px; }
            .code { background: #222; padding: 4px 8px; border-radius: 4px; font-family: monospace; color: #4285f4; font-size: 12px; }
            button { background: #065fd4; color: #fff; border: 0; border-radius: 6px; padding: 10px 18px; font-size: 13px; font-weight: 600; cursor: pointer; }
            button:hover { background: #044bb3; }
          </style>
        </head>
        <body>
          <h2>Falha de Conexão no Login</h2>
          <p>Não foi possível comunicar com os servidores de login da Google.<br><span class="code">Código de Erro: ERR_AUTH_001 (${errorCode})</span></p>
          <button onclick="location.reload()">Tentar Novamente</button>
        </body>
        </html>
      `;
      loginWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errHtml));
    }
  });

  loginWin.webContents.setWindowOpenHandler((details) => {
    const url = details.url;
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'music.youtube.com') {
        handleSuccess(url);
        return { action: 'deny' };
      }
      if (parsed.hostname.endsWith('google.com') || parsed.hostname.endsWith('youtube.com')) {
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            autoHideMenuBar: true,
            webPreferences: {
              partition: loginPartition,
              preload: preloadScript,
              contextIsolation: false,
              nodeIntegration: false,
              sandbox: false
            }
          }
        };
      }
    } catch (_) {}

    shell.openExternal(url);
    return { action: 'deny' };
  });

  loginWin.webContents.on('did-create-window', (childWindow) => {
    childWindow.webContents.setUserAgent(config.FIREFOX_UA);
    childWindow.webContents.on('will-navigate', (_e, url) => handleSuccess(url));
    childWindow.webContents.on('did-navigate', (_e, url) => handleSuccess(url));
  });

  loginWin.on('closed', () => {
    loginWin = null;
  });

  loginWin.loadURL(config.LOGIN_URL);
  return loginWin;
}

module.exports = { createLoginWindow };
