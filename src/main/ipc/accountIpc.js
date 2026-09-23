const { ipcMain, app, BrowserWindow, shell } = require('electron');
const accountService = require('../services/accountService');
const authService = require('../services/authService');
const browserSyncService = require('../services/browserSyncService');
const diagnosticService = require('../services/diagnosticService');
const config = require('../config/appConfig');
const { createLoginWindow } = require('../windows/loginWindow');
const { createDiagnosticWindow } = require('../windows/diagnosticWindow');

/**
 * Registra os handlers IPC relacionados a contas, sessão de login e diagnóstico.
 */
function registerAccountIpc(mainWindow, reloadWithNewPartition, performLogoutCallback, openLoginWindowCallback) {
  ipcMain.handle('get-accounts', function() {
    return {
      accounts: accountService.getAccounts(),
      activeAccountId: accountService.getActiveAccount().id
    };
  });

  ipcMain.handle('switch-account', async function(_event, accountId) {
    var acc = await accountService.switchAccount(accountId);
    if (acc && typeof reloadWithNewPartition === 'function') {
      reloadWithNewPartition();
    }
    return acc;
  });

  ipcMain.handle('add-account', async function(_event, customName) {
    var acc = await accountService.addAccount(customName);
    if (acc && typeof reloadWithNewPartition === 'function') {
      reloadWithNewPartition();
    }
    return acc;
  });

  // Sincroniza a sessão diretamente dos navegadores instalados (Zen, Firefox, etc.)
  ipcMain.handle('sync-browser-session', async function() {
    try {
      var activeAcc = accountService.getActiveAccount();
      var { session } = require('electron');
      var ses = session.fromPartition(activeAcc.partition);
      var res = await browserSyncService.syncSessionFromBrowsers(ses);
      if (res.success) {
        diagnosticService.logEvent('AUTH_SYNC_SUCCESS', `Sessão sincronizada do navegador: ${res.browser}`);
        var currentWin = BrowserWindow.getFocusedWindow() || mainWindow;
        if (currentWin && !currentWin.isDestroyed()) {
          currentWin.loadURL(config.YTMUSIC_URL);
        }
      }
      return res;
    } catch (err) {
      diagnosticService.logEvent('ERR_SYNC_BROWSER', 'Erro ao sincronizar sessão:', err.message);
      return { success: false, error: err.message };
    }
  });

  // Abre janela de login interna (Firefox UA) e monitora o retorno para music.youtube.com
  ipcMain.handle('open-browser-for-login', async function() {
    var currentWin = BrowserWindow.getFocusedWindow() || mainWindow;
    if (typeof openLoginWindowCallback === 'function') {
      openLoginWindowCallback();
    } else {
      createLoginWindow(currentWin, function() {
        if (currentWin && !currentWin.isDestroyed()) {
          currentWin.show();
          currentWin.focus();
          currentWin.loadURL(config.YTMUSIC_URL);
        }
      });
    }
    return { success: true, waiting: true };
  });

  // Abre login pela janela interna (Firefox UA) com detecção automática
  ipcMain.handle('open-login-window', async function() {
    var currentWin = BrowserWindow.getFocusedWindow() || mainWindow;
    if (typeof openLoginWindowCallback === 'function') {
      openLoginWindowCallback();
    } else {
      createLoginWindow(currentWin, function() {
        if (currentWin && !currentWin.isDestroyed()) {
          currentWin.show();
          currentWin.focus();
          currentWin.loadURL(config.YTMUSIC_URL);
        }
      });
    }
    return { success: true };
  });

  // Importa cookies manuais (fallback)
  ipcMain.handle('import-session-cookies', async function(_event, rawData) {
    try {
      var activeAcc = accountService.getActiveAccount();
      var { session } = require('electron');
      var ses = session.fromPartition(activeAcc.partition);

      var res = await authService.importSessionCookies(ses, rawData);
      if (res.success) {
        diagnosticService.logEvent('AUTH_MANUAL_COOKIES_SUCCESS', `${res.count} cookies importados manualmente.`);
        var currentWin = BrowserWindow.getFocusedWindow() || mainWindow;
        if (currentWin && !currentWin.isDestroyed()) {
          currentWin.loadURL(config.YTMUSIC_URL);
        }
      }
      return res;
    } catch (err) {
      diagnosticService.logEvent('ERR_IMPORT_COOKIES', 'Erro ao importar cookies manuais:', err.message);
      return { success: false, error: err.message };
    }
  });

  // Logout com confirmação por diálogo
  ipcMain.handle('account:logout', async function() {
    try {
      var activeAcc = accountService.getActiveAccount();
      if (!activeAcc) return { success: false, error: 'no_active_account' };

      var { session } = require('electron');
      var ses = session.fromPartition(activeAcc.partition);
      var focusedWin = BrowserWindow.getFocusedWindow() || mainWindow;

      await authService.clearSession(ses, focusedWin);
      diagnosticService.logEvent('AUTH_200_LOGOUT', 'Logout com confirmação executado.');
      return { success: true };
    } catch (err) {
      diagnosticService.logEvent('ERR_LOGOUT_DIALOG', 'Erro no logout via diálogo:', err.message);
      return { success: false, error: err.message };
    }
  });

  // Logout direto e imediato (disparado pelo clique no menu "Sair" do YouTube Music)
  ipcMain.handle('account:perform-logout', async function() {
    try {
      if (typeof performLogoutCallback === 'function') {
        await performLogoutCallback();
      } else {
        var activeAcc = accountService.getActiveAccount();
        var { session } = require('electron');
        var ses = session.fromPartition(activeAcc.partition);
        await ses.clearStorageData();
        await ses.clearCache();
        accountService.updateActiveAccountInfo({ name: null, email: null });
        var focusedWin = BrowserWindow.getFocusedWindow() || mainWindow;
        if (focusedWin && !focusedWin.isDestroyed()) {
          focusedWin.loadURL(config.YTMUSIC_URL);
        }
      }
      diagnosticService.logEvent('AUTH_200_LOGOUT', 'Sessão encerrada com sucesso via perform-logout.');
      return { success: true };
    } catch (err) {
      diagnosticService.logEvent('ERR_PERFORM_LOGOUT', 'Erro ao executar perform-logout:', err.message);
      return { success: false, error: err.message };
    }
  });

  // ── Handlers do Sistema de Diagnóstico ──────────────────────────────────
  ipcMain.handle('diagnostic:run-test', async function() {
    var activeAcc = accountService.getActiveAccount();
    var { session } = require('electron');
    var ses = session.fromPartition(activeAcc ? activeAcc.partition : config.SESSION_PARTITION);
    return await diagnosticService.runSelfTest(ses);
  });

  ipcMain.handle('diagnostic:run-deep-test', async function() {
    var activeAcc = accountService.getActiveAccount();
    var { session } = require('electron');
    var ses = session.fromPartition(activeAcc ? activeAcc.partition : config.SESSION_PARTITION);
    return await diagnosticService.runDeepDiagnostic(ses);
  });

  ipcMain.handle('diagnostic:clear-logs', function() {
    return diagnosticService.clearLogs();
  });

  ipcMain.handle('diagnostic:get-logs', function() {
    return diagnosticService.getLogs();
  });

  ipcMain.handle('diagnostic:get-report-text', async function() {
    var activeAcc = accountService.getActiveAccount();
    var { session } = require('electron');
    var ses = session.fromPartition(activeAcc ? activeAcc.partition : config.SESSION_PARTITION);
    return await diagnosticService.getDiagnosticReportText(ses);
  });

  ipcMain.handle('diagnostic:open-window', function() {
    var currentWin = BrowserWindow.getFocusedWindow() || mainWindow;
    var activeAcc = accountService.getActiveAccount();
    var { session } = require('electron');
    var ses = session.fromPartition(activeAcc ? activeAcc.partition : config.SESSION_PARTITION);
    createDiagnosticWindow(currentWin, ses, openLoginWindowCallback, performLogoutCallback);
    return { success: true };
  });

  ipcMain.handle('toggle-mini-player', function() {
    const { toggleMiniPlayer } = require('../windows/miniPlayerWindow');
    toggleMiniPlayer();
    return { success: true };
  });

  ipcMain.handle('remove-account', async function(_event, accountId) {
    var ok = accountService.removeAccount(accountId);
    if (ok && typeof reloadWithNewPartition === 'function') {
      reloadWithNewPartition();
    }
    return ok;
  });

  ipcMain.on('account-info-detected', function(_event, info) {
    accountService.updateActiveAccountInfo(info);
  });

  ipcMain.on('app-exit', function() {
    app.isQuitting = true;
    app.quit();
  });
}

module.exports = { registerAccountIpc };
