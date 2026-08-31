const { ipcRenderer } = require('electron');

function setupTrackObserver() {
  const updateTrackInfo = () => {
    const titleEl = document.querySelector('ytmusic-player-bar .title') || 
                    document.querySelector('.ytmusic-player-bar.title');
    const bylineEl = document.querySelector('ytmusic-player-bar .byline') || 
                     document.querySelector('.ytmusic-player-bar.byline');

    const title = titleEl ? titleEl.textContent.trim() : '';
    const artist = bylineEl ? bylineEl.textContent.trim() : '';

    if (title) {
      ipcRenderer.send('track-changed', { title, artist });
    }
  };

  const observer = new MutationObserver(updateTrackInfo);
  
  const checkPlayerBar = setInterval(() => {
    const playerBar = document.querySelector('ytmusic-player-bar');
    if (playerBar) {
      clearInterval(checkPlayerBar);
      observer.observe(playerBar, {
        childList: true,
        subtree: true,
        characterData: true
      });
      updateTrackInfo();
    }
  }, 1000);
}

module.exports = { setupTrackObserver };
