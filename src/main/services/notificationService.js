const { Notification, nativeImage } = require('electron');
const path = require('path');
const config = require('../config/appConfig');
const settingsService = require('./settingsService');

class NotificationService {
  constructor() {
    this.lastTrackKey = '';
    this.activeNotification = null;
  }

  showTrackNotification(state) {
    if (settingsService.get('trackNotifications') === false) return;
    if (!Notification.isSupported()) return;
    if (!state || !state.title || !state.isPlaying) return;

    const trackKey = `${state.title}:::${state.artist}`;
    if (trackKey === this.lastTrackKey) return;
    this.lastTrackKey = trackKey;

    try {
      if (this.activeNotification) {
        this.activeNotification.close();
      }

      const defaultIcon = path.join(config.PATHS.ASSETS, 'icon.png');
      const notification = new Notification({
        title: state.title,
        body: state.artist ? state.artist : 'YouTube Music',
        icon: defaultIcon,
        silent: true
      });

      this.activeNotification = notification;
      notification.show();

      setTimeout(() => {
        if (this.activeNotification === notification) {
          notification.close();
          this.activeNotification = null;
        }
      }, 5000);
    } catch (err) {
      console.warn('[NotificationService] Falha ao exibir notificação:', err.message);
    }
  }
}

module.exports = new NotificationService();
