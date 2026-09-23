const { ElectronBlocker } = require('@ghostery/adblocker-electron');

// Electron 40+ usa Node.js 22, que tem globalThis.fetch nativo.
// Nao e necessario importar cross-fetch ou node-fetch.
// Isso remove ~0.5 MB de dependencias transitivas do pacote final.

class AdblockService {
  constructor() {
    this.blocker = null;
    this.isInitialized = false;
  }

  async enable(session) {
    try {
      if (!this.blocker) {
        this.blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(globalThis.fetch.bind(globalThis));
        this.isInitialized = true;
      }
      this.blocker.enableBlockingInSession(session);
      console.log('[AdblockService] Bloqueador de anuncios ativado com sucesso.');
    } catch (error) {
      console.error('[AdblockService] Aviso ao inicializar adblocker:', error.message);
    }
  }
}

module.exports = new AdblockService();