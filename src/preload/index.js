const { applyAntiDetection } = require('./modules/antiDetection');
const { setupPlayerController } = require('./modules/playerController');
const { setupTrackObserver } = require('./modules/trackObserver');
const { setupAdSkipper } = require('./modules/adSkipper');
const { setupTopBar } = require('./modules/topBar');

// Aplica remoção de assinaturas antes de qualquer execução na página
applyAntiDetection();

// Inicializa controles, observadores, ad-skipper e barra superior
window.addEventListener('DOMContentLoaded', () => {
  setupPlayerController();
  setupTrackObserver();
  setupAdSkipper();
  setupTopBar();
});
