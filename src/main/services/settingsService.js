const { app } = require('electron');
const fs = require('fs');
const path = require('path');

class SettingsService {
  constructor() {
    this.file = path.join(app.getPath('userData'), 'settings.json');
    this.defaults = {
      startWithWindows: false,
      closeBehavior: 'tray',
      alwaysOnTop: false,
      openMiniPlayerOnStart: false
    };
    this.settings = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.file)) {
        const saved = JSON.parse(fs.readFileSync(this.file, 'utf8'));
        return { ...this.defaults, ...saved };
      }
    } catch (error) {
      console.error('[SettingsService] Erro ao carregar configurações:', error);
    }

    return { ...this.defaults };
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

    this.settings[key] = value;
    this.save();
    return true;
  }

  update(changes = {}) {
    Object.keys(changes).forEach(key => {
      if (Object.prototype.hasOwnProperty.call(this.defaults, key)) {
        this.settings[key] = changes[key];
      }
    });
    this.save();
    return this.getAll();
  }
}

module.exports = new SettingsService();
