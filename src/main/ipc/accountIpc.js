const { ipcMain, app } = require('electron');
const accountService = require('../services/accountService');

function registerAccountIpc(mainWindow, reloadWithNewPartition) {
  // Retorna a lista de contas salvas
  ipcMain.handle('get-accounts', () => {
    return {
      accounts: accountService.getAccounts(),
      activeAccountId: accountService.getActiveAccount().id
    };
  });

  // Troca para outra conta (recarrega a janela com a partição da conta)
  ipcMain.handle('switch-account', async (event, accountId) => {
    const acc = await accountService.switchAccount(accountId);
    if (acc && typeof reloadWithNewPartition === 'function') {
      reloadWithNewPartition();
    }
    return acc;
  });

  // Adiciona nova conta (cria nova partição isolada e recarrega)
  ipcMain.handle('add-account', async (event, customName) => {
    const acc = await accountService.addAccount(customName);
    if (acc && typeof reloadWithNewPartition === 'function') {
      reloadWithNewPartition();
    }
    return acc;
  });

  // Remove uma conta
  ipcMain.handle('remove-account', async (event, accountId) => {
    const ok = accountService.removeAccount(accountId);
    if (ok && typeof reloadWithNewPartition === 'function') {
      reloadWithNewPartition();
    }
    return ok;
  });

  // Atualiza nome/avatar detectados automaticamente no DOM
  ipcMain.on('account-info-detected', (event, info) => {
    accountService.updateActiveAccountInfo(info);
  });

  // Fecha o aplicativo de vez (botão exit vermelho)
  ipcMain.on('app-exit', () => {
    app.isQuitting = true;
    app.quit();
  });
}

module.exports = { registerAccountIpc };
