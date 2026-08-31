const { ipcRenderer } = require('electron');

function setupPlayerController() {
  function getPlayPauseButton() {
    return document.querySelector('#play-pause-button') ||
           document.querySelector('.play-pause-button') ||
           document.querySelector('tp-yt-paper-icon-button.play-pause-button');
  }

  function getNextButton() {
    return document.querySelector('.next-button') ||
           document.querySelector('tp-yt-paper-icon-button.next-button');
  }

  function getPreviousButton() {
    return document.querySelector('.previous-button') ||
           document.querySelector('tp-yt-paper-icon-button.previous-button');
  }

  // Play / Pause
  ipcRenderer.on('media-play-pause', () => {
    const btn = getPlayPauseButton();
    if (btn) {
      btn.click();
    } else {
      const video = document.querySelector('video');
      if (video) {
        if (video.paused) video.play();
        else video.pause();
      }
    }
  });

  // Próxima Música
  ipcRenderer.on('media-next', () => {
    const btn = getNextButton();
    if (btn) btn.click();
  });

  // Música Anterior
  ipcRenderer.on('media-previous', () => {
    const btn = getPreviousButton();
    if (btn) btn.click();
  });

  // Parar (Pause)
  ipcRenderer.on('media-stop', () => {
    const video = document.querySelector('video');
    if (video && !video.paused) {
      video.pause();
    }
  });
}

module.exports = { setupPlayerController };
