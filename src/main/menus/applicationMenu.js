const { Menu, app } = require('electron');
const settingsService = require('../services/settingsService');
const startupService = require('../services/startupService');

function createApplicationMenu(mainWindow, onOpenAccounts) {
  const template = [
    {
      label: 'Aplicativo',
      submenu: [
        {
          label: 'Mostrar janela',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.show();
              mainWindow.focus();
            }
          }
        },
        {
          label: 'Iniciar com o Windows',
          type: 'checkbox',
          checked: startupService.isEnabled(),
          click: item => startupService.setEnabled(item.checked)
        },
        {
          label: 'Fechar ao clicar no X',
          type: 'checkbox',
          checked: settingsService.get('closeBehavior') === 'exit',
          click: item => settingsService.set('closeBehavior', item.checked ? 'exit' : 'tray')
        },
        {
          label: 'Manter sempre no topo',
          type: 'checkbox',
          checked: settingsService.get('alwaysOnTop'),
          click: item => {
            settingsService.set('alwaysOnTop', item.checked);
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setAlwaysOnTop(item.checked);
          }
        },
        { type: 'separator' },
        {
          label: 'Sair do aplicativo',
          click: () => {
            app.isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Contas',
      submenu: [
        {
          label: 'Gerenciar contas',
          click: () => {
            if (typeof onOpenAccounts === 'function') onOpenAccounts();
          }
        },
        {
          label: 'Adicionar conta',
          click: () => {
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('open-add-account');
            }
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

module.exports = { createApplicationMenu };
