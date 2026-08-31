const { applyAntiDetection } = require('./modules/antiDetection');
const { setupPlayerController } = require('./modules/playerController');
const { setupTrackObserver } = require('./modules/trackObserver');
const { setupAdSkipper } = require('./modules/adSkipper');
const { setupTopBar } = require('./modules/topBar');

applyAntiDetection();

window.addEventListener('DOMContentLoaded', () => {
  setupPlayerController();
  setupTrackObserver();
  setupAdSkipper();
  setupTopBar();
});
