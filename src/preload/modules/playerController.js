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

  const getLikeButton = () =>
    document.querySelector('ytmusic-like-button-renderer #button-shape-like button') ||
    document.querySelector('ytmusic-like-button-renderer tp-yt-paper-icon-button.like') ||
    document.querySelector('ytmusic-player-bar ytmusic-like-button-renderer #button[aria-label*="Gostei"]') ||
    document.querySelector('ytmusic-player-bar ytmusic-like-button-renderer #button[aria-label*="Like"]') ||
    document.querySelector('ytmusic-like-button-renderer button');

  const getRepeatButton = () =>
    document.querySelector('ytmusic-player-bar .repeat') ||
    document.querySelector('tp-yt-paper-icon-button.repeat');

  const getShuffleButton = () =>
    document.querySelector('ytmusic-player-bar .shuffle') ||
    document.querySelector('tp-yt-paper-icon-button.shuffle');

  const isLiked = () => {
    const renderer = document.querySelector('ytmusic-like-button-renderer');
    if (renderer) {
      const status = renderer.getAttribute('like-status');
      if (status === 'LIKE') return true;
      if (status === 'DISLIKE' || status === 'INDIFFERENT') return false;
    }
    const btn = getLikeButton();
    if (!btn) return false;
    const pressed = btn.getAttribute('aria-pressed');
    if (pressed !== null) return pressed === 'true';
    return btn.classList.contains('active') || btn.classList.contains('style-default-active');
  };

  const getRepeatMode = () => {
    const btn = getRepeatButton();
    if (!btn) return 0;
    const label = (btn.getAttribute('aria-label') || btn.getAttribute('title') || '').toLowerCase();
    if (label.includes('uma') || label.includes('one') || label.includes('1')) return 2;
    if (label.includes('tudo') || label.includes('all') || label.includes('todas')) return 1;
    if (btn.getAttribute('aria-pressed') === 'true') return 1;
    return 0;
  };

  const isShuffled = () => {
    const btn = getShuffleButton();
    if (!btn) return false;
    const pressed = btn.getAttribute('aria-pressed') || btn.getAttribute('aria-selected');
    if (pressed !== null) return pressed === 'true';
    return btn.classList.contains('active');
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
      isLiked:     isLiked(),
      repeatMode:  getRepeatMode(),
      isShuffled:  isShuffled()
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

  const attachBarObserver = () => {
    const bar = document.querySelector('ytmusic-player-bar');
    if (!bar || bar.dataset.ytmBarObserved) return;
    bar.dataset.ytmBarObserved = 'true';
    const obs = new MutationObserver(() => sendState());
    obs.observe(bar, {
      attributes: true,
      subtree: true,
      attributeFilter: ['like-status', 'aria-pressed', 'aria-label', 'title', 'class']
    });
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
    if (command === 'like') {
      const btn = getLikeButton();
      if (btn) btn.click();
      setTimeout(sendState, 200);
    }
    if (command === 'repeat') {
      const btn = getRepeatButton();
      if (btn) btn.click();
      setTimeout(sendState, 200);
    }
    if (command === 'shuffle') {
      const btn = getShuffleButton();
      if (btn) btn.click();
      setTimeout(sendState, 200);
    }
    if (command?.type === 'seek') {
      const video = getVideo();
      if (video && Number.isFinite(video.duration)) {
        video.currentTime = (command.value / 100) * video.duration;
      }
    }
  });

  setInterval(() => {
    attachVideoEvents();
    attachBarObserver();
  }, 1500);
}

module.exports = { setupPlayerController };
