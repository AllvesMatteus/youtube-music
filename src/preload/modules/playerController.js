const { ipcRenderer } = require('electron');

function setupPlayerController() {
  const getVideo = () => document.querySelector('video');
  const getPlayPauseButton = () => document.querySelector('#play-pause-button') || document.querySelector('.play-pause-button') || document.querySelector('tp-yt-paper-icon-button.play-pause-button');
  const getNextButton = () => document.querySelector('.next-button') || document.querySelector('tp-yt-paper-icon-button.next-button');
  const getPreviousButton = () => document.querySelector('.previous-button') || document.querySelector('tp-yt-paper-icon-button.previous-button');
  const getActionButton = type => {
    const selectors = {
      like: 'ytmusic-player-bar ytmusic-like-button-renderer #button[aria-label*="Gostei"], ytmusic-player-bar ytmusic-like-button-renderer tp-yt-paper-icon-button.like',
      repeat: 'ytmusic-player-bar .repeat, .ytmusic-player-bar.repeat, tp-yt-paper-icon-button.repeat',
      shuffle: 'ytmusic-player-bar .shuffle, .ytmusic-player-bar.shuffle, tp-yt-paper-icon-button.shuffle'
    };
    return document.querySelector(selectors[type]);
  };

  const sendState = () => {
    const video = getVideo();
    if (!video) return;
    const titleElement = document.querySelector('ytmusic-player-bar .title');
    const bylineElement = document.querySelector('ytmusic-player-bar .byline');
    const thumbnailElement = document.querySelector('ytmusic-player-bar img');
    ipcRenderer.send('track-state-changed', {
      title: titleElement?.textContent.trim() || '',
      artist: bylineElement?.textContent.trim() || '',
      thumbnail: thumbnailElement?.src || '',
      currentTime: video.currentTime || 0,
      duration: Number.isFinite(video.duration) ? video.duration : 0,
      isPlaying: !video.paused
    });
  };

  const attachVideoEvents = () => {
    const video = getVideo();
    if (!video || video.dataset.ytmDesktopBound) return;
    video.dataset.ytmDesktopBound = 'true';
    ['timeupdate', 'loadedmetadata', 'durationchange', 'play', 'pause', 'ended'].forEach(event => video.addEventListener(event, sendState));
    sendState();
  };

  ipcRenderer.on('media-play-pause', () => getPlayPauseButton()?.click() || (() => { const video = getVideo(); if (video) video.paused ? video.play() : video.pause(); })());
  ipcRenderer.on('media-next', () => getNextButton()?.click());
  ipcRenderer.on('media-previous', () => getPreviousButton()?.click());
  ipcRenderer.on('media-stop', () => { const video = getVideo(); if (video && !video.paused) video.pause(); });
  ipcRenderer.on('mini-player-command', (event, command) => {
    if (command === 'play-pause') getPlayPauseButton()?.click();
    if (command === 'next') getNextButton()?.click();
    if (command === 'previous') getPreviousButton()?.click();
    if (command === 'like' || command === 'repeat' || command === 'shuffle') getActionButton(command)?.click();
    if (command?.type === 'seek') { const video = getVideo(); if (video && Number.isFinite(video.duration)) video.currentTime = (command.value / 100) * video.duration; }
  });

  setInterval(attachVideoEvents, 2000);
}

module.exports = { setupPlayerController };
