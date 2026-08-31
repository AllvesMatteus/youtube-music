const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch');

class AdblockService {
  constructor() {
    this.blocker = null;
    this.isInitialized = false;
  }

  async enable(session) {
    try {
      if (!this.blocker) {
        // Carrega filtros pré-compilados do Ghostery (EasyList + EasyPrivacy)
        this.blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
        this.isInitialized = true;
      }
      
      // Ativa o bloqueador na sessão persistente do YouTube Music
      this.blocker.enableBlockingInSession(session);
      console.log('[AdblockService] 🛡️ Bloqueador de anúncios ativado com sucesso.');
    } catch (error) {
      console.error('[AdblockService] Aviso ao inicializar adblocker:', error.message);
    }
  }
}

module.exports = new AdblockService();
