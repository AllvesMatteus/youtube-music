function setupAdSkipper() {
  setInterval(() => {
    const skipButtons = [
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-modern',
      '.videoAdUiSkipButton',
      '.ytp-ad-overlay-close-button',
      'button.ytmusic-mealbar-promo-renderer[aria-label="Ignorar"]',
      'button.ytmusic-mealbar-promo-renderer[aria-label="Dismiss"]',
      'tp-yt-paper-button#dismiss-button'
    ];

    for (const selector of skipButtons) {
      const btn = document.querySelector(selector);
      if (btn && typeof btn.click === 'function') {
        btn.click();
      }
    }

    const adVideo = document.querySelector('.ad-showing video');
    if (adVideo && !isNaN(adVideo.duration) && isFinite(adVideo.duration)) {
      adVideo.currentTime = adVideo.duration;
    }
  }, 500);
}

module.exports = { setupAdSkipper };
