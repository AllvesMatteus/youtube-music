const { app } = require('electron');
const fs = require('fs');
const path = require('path');

class SettingsService {
  constructor() {
    this.file = path.join(app.getPath('userData'), 'settings.json');
    this.defaultShortcuts = {
      playPause: 'MediaPlayPause',
      nextTrack: 'MediaNextTrack',
      prevTrack: 'MediaPreviousTrack',
      volumeUp: 'Ctrl+Alt+Up',
      volumeDown: 'Ctrl+Alt+Down',
      toggleMiniPlayer: 'F3'
    };

    this.defaults = {
      startWithWindows: false,
      closeBehavior: 'tray',
      alwaysOnTop: false,
      miniPlayerEnabled: true,
      openMiniPlayerOnStart: false,
      autoUpdateEnabled: true,
      hardwareAcceleration: true,
      discordPresence: true,
      trackNotifications: true,
      theme: 'default',
      customCss: '',
      shortcuts: { ...this.defaultShortcuts }
    };
    this.settings = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.file)) {
        const saved = JSON.parse(fs.readFileSync(this.file, 'utf8'));
        return {
          ...this.defaults,
          ...saved,
          shortcuts: {
            ...this.defaultShortcuts,
            ...(saved && saved.shortcuts ? saved.shortcuts : {})
          }
        };
      }
    } catch (error) {
      console.error('[SettingsService] Erro ao carregar configurações:', error);
    }

    return {
      ...this.defaults,
      shortcuts: { ...this.defaultShortcuts }
    };
  }

  save() {
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      fs.writeFileSync(this.file, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      console.error('[SettingsService] Erro ao salvar configurações:', error);
    }
  }

  getAll() {
    return { ...this.settings };
  }

  get(key) {
    return this.settings[key];
  }

  set(key, value) {
    if (!Object.prototype.hasOwnProperty.call(this.defaults, key)) {
      return false;
    }

    if (key === 'shortcuts' && typeof value === 'object' && value !== null) {
      this.settings.shortcuts = {
        ...this.defaultShortcuts,
        ...(this.settings.shortcuts || {}),
        ...value
      };
    } else {
      this.settings[key] = value;
    }
    this.save();
    return true;
  }

  getShortcuts() {
    return {
      ...this.defaultShortcuts,
      ...(this.settings.shortcuts || {})
    };
  }

  setShortcut(action, accelerator) {
    if (!this.settings.shortcuts) {
      this.settings.shortcuts = { ...this.defaultShortcuts };
    }
    this.settings.shortcuts[action] = accelerator;
    this.save();
    return this.getShortcuts();
  }

  resetShortcuts() {
    this.settings.shortcuts = { ...this.defaultShortcuts };
    this.save();
    return this.getShortcuts();
  }

  update(changes = {}) {
    Object.keys(changes).forEach(key => {
      if (Object.prototype.hasOwnProperty.call(this.defaults, key)) {
        if (key === 'shortcuts' && typeof changes[key] === 'object' && changes[key] !== null) {
          this.settings.shortcuts = {
            ...this.defaultShortcuts,
            ...(this.settings.shortcuts || {}),
            ...changes[key]
          };
        } else {
          this.settings[key] = changes[key];
        }
      }
    });
    this.save();
    return this.getAll();
  }
}

module.exports = new SettingsService();
