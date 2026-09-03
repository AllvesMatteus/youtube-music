const { ipcMain, app } = require('electron');
const accountService = require('../services/accountService');

function registerAccountIpc(mainWindow, reloadWithNewPartition) {
  ipcMain.handle('get-accounts', () => {
    return {
      accounts: accountService.getAccounts(),
      activeAccountId: accountService.getActiveAccount().id
    };
  });

  ipcMain.handle('switch-account', async (event, accountId) => {
    const acc = await accountService.switchAccount(accountId);
    if (acc && typeof reloadWithNewPartition === 'function') {
      reloadWithNewPartition();
    }
    return acc;
  });

  ipcMain.handle('add-account', async (event, customName) => {
    const acc = await accountService.addAccount(customName);
    if (acc && typeof reloadWithNewPartition === 'function') {
      reloadWithNewPartition();
    }
    return acc;
  });

  ipcMain.handle('remove-account', async (event, accountId) => {
    const ok = accountService.removeAccount(accountId);
    if (ok && typeof reloadWithNewPartition === 'function') {
      reloadWithNewPartition();
    }
    return ok;
  });

  ipcMain.on('account-info-detected', (event, info) => {
    accountService.updateActiveAccountInfo(info);
  });

  ipcMain.on('app-exit', () => {
    app.isQuitting = true;
    app.quit();
  });
}

module.exports = { registerAccountIpc };
