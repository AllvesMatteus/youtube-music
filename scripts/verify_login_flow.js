/**
 * Script de Auto-Verificação do Fluxo de Login do Google
 * Executa uma instância do Electron com a mesma proteção anti-detecção
 * e valida se a tela de login carrega e se recupera automaticamente de desafios.
 *
 * Uso: npx electron scripts/verify_login_flow.js
 */

const { app, BrowserWindow, session } = require('electron');
const path = require('path');
const config = require('../src/main/config/appConfig');

app.whenReady().then(async () => {
  console.log('[VerifyLogin] Iniciando teste de fluxo de autenticação...');

  const testPartition = 'persist:verify-login-test';
  const testSes = session.fromPartition(testPartition);

  await testSes.clearStorageData();
  await testSes.clearCache();

  testSes.webRequest.onBeforeSendHeaders(
    { urls: ['https://*.google.com/*', 'https://*.youtube.com/*', 'https://*.googleapis.com/*'] },
    (details, callback) => {
      const headers = details.requestHeaders;
      headers['User-Agent'] = config.FIREFOX_UA;
      for (const key of Object.keys(headers)) {
        const lower = key.toLowerCase();
        if (lower.startsWith('sec-ch-ua') || lower === 'x-requested-with') {
          delete headers[key];
        }
      }
      callback({ cancel: false, requestHeaders: headers });
    }
  );

  const preloadScript = path.join(__dirname, '../src/preload/loginPreload.js');

  const win = new BrowserWindow({
    width: 520,
    height: 680,
    show: true,
    title: 'Teste de Fluxo de Login — Auto-Verificação',
    autoHideMenuBar: true,
    webPreferences: {
      partition: testPartition,
      preload: preloadScript,
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: false
    }
  });

  win.webContents.setUserAgent(config.FIREFOX_UA);

  win.webContents.on('did-finish-load', async () => {
    const url = win.getURL();
    const title = win.getTitle();
    console.log('[VerifyLogin] Página carregada:', { title, url });

    const cookies = await testSes.cookies.get({});
    console.log('[VerifyLogin] Cookies atribuídos pelo Google:', cookies.map(c => c.name));

    const check = await win.webContents.executeJavaScript(`
      (() => {
        const text = document.body ? document.body.innerText : '';
        const hasEmailInput = !!document.querySelector('input[type="email"]');
        const isBlocked = text.includes('Não foi possível fazer o login') ||
                          text.includes('Esse navegador ou app pode não ser seguro');
        return { hasEmailInput, isBlocked, textSnippet: text.substring(0, 150).replace(/\\r?\\n/g, ' ') };
      })()
    `);

    console.log('[VerifyLogin] Resultado da análise do DOM:', check);

    if (check.hasEmailInput) {
      console.log('>>> SUCESSO: Campo de login (e-mail) pronto para entrada do usuário!');
    } else if (check.isBlocked) {
      console.log('>>> AVISO: Desafio de segurança detectado. O preload acionará "Tentar novamente" automaticamente.');
    }
  });

  win.loadURL(config.LOGIN_URL);
});
