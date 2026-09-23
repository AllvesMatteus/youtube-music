const { autoUpdater } = require('electron-updater');
const { app, ipcMain } = require('electron');
const settingsService = require('./settingsService');
const diagnosticService = require('./diagnosticService');

class UpdateService {
  constructor() {
    this.status = 'idle'; // 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
    this.updateInfo = null;
    this.progress = 0;
    this.errorMessage = null;
    this.initialized = false;
    this.listeners = new Set();
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Configurações do autoUpdater
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    // Configura logger básico
    autoUpdater.logger = {
      info: (...args) => diagnosticService.logEvent('UPDATE_INFO', args.join(' ')),
      warn: (...args) => diagnosticService.logEvent('UPDATE_WARN', args.join(' ')),
      error: (...args) => diagnosticService.logEvent('UPDATE_ERR', args.join(' '))
    };

    autoUpdater.on('checking-for-update', () => {
      this.status = 'checking';
      this.errorMessage = null;
      this.notifyState();
      diagnosticService.logEvent('UPDATE_CHECKING', 'Verificando atualizações no repositório...');
    });

    autoUpdater.on('update-available', (info) => {
      this.status = 'available';
      this.updateInfo = info;
      this.notifyState();
      diagnosticService.logEvent('UPDATE_AVAILABLE', `Nova versão encontrada: v${info.version}`);
    });

    autoUpdater.on('update-not-available', (info) => {
      this.status = 'not-available';
      this.updateInfo = info;
      this.notifyState();
      diagnosticService.logEvent('UPDATE_NOT_AVAILABLE', 'O aplicativo já está na versão mais recente.');
    });

    autoUpdater.on('download-progress', (progressObj) => {
      this.status = 'downloading';
      this.progress = Math.round(progressObj.percent || 0);
      this.notifyState();
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.status = 'downloaded';
      this.updateInfo = info;
      this.progress = 100;
      this.notifyState();
      diagnosticService.logEvent('UPDATE_DOWNLOADED', `Atualização v${info.version} baixada e pronta para instalar.`);
    });

    autoUpdater.on('error', (err) => {
      this.status = 'error';
      this.errorMessage = err ? err.message : 'Erro desconhecido ao verificar atualizações';
      this.notifyState();
      diagnosticService.logEvent('UPDATE_ERROR', 'Falha no auto-updater:', this.errorMessage);
    });

    // Verificação automática APENAS na inicialização (se habilitado)
    if (app.isPackaged && settingsService.get('autoUpdateEnabled') !== false) {
      setTimeout(() => {
        this.checkForUpdates(false).catch(() => {});
      }, 4000);
    }
  }

  notifyState() {
    const data = this.getStatus();
    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch (e) {}
    }
  }

  onStateChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  async checkForUpdates(manual = false) {
    if (!app.isPackaged) {
      diagnosticService.logEvent('UPDATE_DEV_SKIP', 'Modo de desenvolvimento: verificação ignorada.');
      this.status = 'not-available';
      this.updateInfo = { version: app.getVersion() };
      this.notifyState();
      return { status: 'dev-mode', version: app.getVersion() };
    }

    try {
      this.status = 'checking';
      this.notifyState();
      const result = await autoUpdater.checkForUpdates();
      return result;
    } catch (err) {
      this.status = 'error';
      this.errorMessage = err.message;
      this.notifyState();
      if (manual) throw err;
      return null;
    }
  }

  quitAndInstall() {
    if (this.status === 'downloaded') {
      autoUpdater.quitAndInstall(false, true);
    }
  }

  getStatus() {
    return {
      status: this.status,
      currentVersion: app.getVersion(),
      updateVersion: this.updateInfo ? this.updateInfo.version : null,
      progress: this.progress,
      errorMessage: this.errorMessage,
      autoUpdateEnabled: Boolean(settingsService.get('autoUpdateEnabled'))
    };
  }
}

module.exports = new UpdateService();
