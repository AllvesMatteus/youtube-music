const { ipcRenderer } = require('electron');

function setupPlayerController() {
  const getVideo = () => document.querySelector('video');
  const getPlayPauseButton = () =>
    document.querySelector('#play-pause-button') ||
    document.querySelector('.play-pause-button') ||
    document.querySelector('tp-yt-paper-icon-button.play-pause-button');
  const getNextButton = () =>
    document.querySelector('.next-button') ||
    document.querySelector('tp-yt-paper-icon-button.next-button');
  const getPreviousButton = () =>
    document.querySelector('.previous-button') ||
    document.querySelector('tp-yt-paper-icon-button.previous-button');

  const getActionButton = type => {
    const selectors = {
      like:    'ytmusic-player-bar ytmusic-like-button-renderer #button[aria-label*="Gostei"], ytmusic-player-bar ytmusic-like-button-renderer tp-yt-paper-icon-button.like',
      repeat:  'ytmusic-player-bar .repeat, .ytmusic-player-bar.repeat, tp-yt-paper-icon-button.repeat',
      shuffle: 'ytmusic-player-bar .shuffle, .ytmusic-player-bar.shuffle, tp-yt-paper-icon-button.shuffle'
    };
    return document.querySelector(selectors[type]);
  };

  const isLiked = () => {
    const likeBtn = document.querySelector(
      'ytmusic-player-bar ytmusic-like-button-renderer tp-yt-paper-icon-button.like, ' +
      'ytmusic-player-bar ytmusic-like-button-renderer #button[aria-pressed="true"]'
    );
    if (!likeBtn) return false;
    const pressed = likeBtn.getAttribute('aria-pressed');
    if (pressed !== null) return pressed === 'true';
    return likeBtn.classList.contains('active') || likeBtn.classList.contains('style-default-active');
  };

  const getThumbnailSrc = () => {
    const selectors = [
      'ytmusic-player-bar img.thumbnail',
      'ytmusic-player-bar #thumbnail img',
      'ytmusic-player-bar .thumbnail img',
      'ytmusic-player-bar img[src*="lh3.googleusercontent"]',
      'ytmusic-player-bar img[src*="ytimg"]',
      '#song-image img',
      '.ytmusic-player-bar img'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.src && el.src.startsWith('http')) return el.src;
    }
    return '';
  };

  const sendState = () => {
    const video = getVideo();
    if (!video) return;
    const titleEl  = document.querySelector('ytmusic-player-bar .title');
    const bylineEl = document.querySelector('ytmusic-player-bar .byline');
    ipcRenderer.send('track-state-changed', {
      title:       titleEl?.textContent.trim() || '',
      artist:      bylineEl?.textContent.trim() || '',
      thumbnail:   getThumbnailSrc(),
      currentTime: video.currentTime || 0,
      duration:    Number.isFinite(video.duration) ? video.duration : 0,
      isPlaying:   !video.paused,
      isLiked:     isLiked()
    });
  };

  const attachVideoEvents = () => {
    const video = getVideo();
    if (!video || video.dataset.ytmDesktopBound) return;
    video.dataset.ytmDesktopBound = 'true';
    ['timeupdate', 'loadedmetadata', 'durationchange', 'play', 'pause', 'ended'].forEach(ev =>
      video.addEventListener(ev, sendState)
    );
    sendState();
  };

  ipcRenderer.on('media-play-pause', () =>
    getPlayPauseButton()?.click() || (() => { const v = getVideo(); if (v) v.paused ? v.play() : v.pause(); })()
  );
  ipcRenderer.on('media-next',     () => getNextButton()?.click());
  ipcRenderer.on('media-previous', () => getPreviousButton()?.click());
  ipcRenderer.on('media-stop',     () => { const v = getVideo(); if (v && !v.paused) v.pause(); });

  ipcRenderer.on('mini-player-command', (event, command) => {
    if (command === 'play-pause') getPlayPauseButton()?.click();
    if (command === 'next')      getNextButton()?.click();
    if (command === 'previous')  getPreviousButton()?.click();
    if (command === 'like' || command === 'repeat' || command === 'shuffle') getActionButton(command)?.click();
    if (command?.type === 'seek') {
      const video = getVideo();
      if (video && Number.isFinite(video.duration)) {
        video.currentTime = (command.value / 100) * video.duration;
      }
    }
  });

  setInterval(attachVideoEvents, 2000);
}

module.exports = { setupPlayerController };
