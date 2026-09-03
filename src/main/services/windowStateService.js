const { app, screen } = require('electron');
const fs = require('fs');
const path = require('path');
const config = require('../config/appConfig');

class WindowStateService {
  constructor() {
    this.stateFile = path.join(app.getPath('userData'), 'window-state.json');
    this.timers = {};
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const parsed = JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
        if (parsed && typeof parsed === 'object') {
          if (parsed.width || parsed.height || parsed.isMaximized !== undefined) {
            return { main: parsed, miniPlayer: null };
          }
          return parsed;
        }
      }
    } catch (e) {
      console.error('[WindowStateService] Erro ao carregar:', e);
    }
    return { main: null, miniPlayer: null };
  }

  isStateValid(state, w = 100, h = 100) {
    if (!state || typeof state.x !== 'number' || typeof state.y !== 'number') {
      return false;
    }
    const width = state.width || w;
    const height = state.height || h;
    const displays = screen.getAllDisplays();
    return displays.some(display => {
      const { x, y, width: dw, height: dh } = display.bounds;
      return (
        state.x >= x - 50 &&
        state.y >= y - 50 &&
        state.x + width <= x + dw + 50 &&
        state.y + height <= y + dh + 50
      );
    });
  }

  get(name) {
    if (name === 'main') {
      const saved = this.data.main;
      if (saved && this.isStateValid(saved, config.WINDOW.DEFAULT_WIDTH, config.WINDOW.DEFAULT_HEIGHT)) {
        return saved;
      }
      return {
        width: config.WINDOW.DEFAULT_WIDTH,
        height: config.WINDOW.DEFAULT_HEIGHT,
        isMaximized: false
      };
    }

    if (name === 'miniPlayer') {
      const saved = this.data.miniPlayer;
      if (saved && this.isStateValid(saved, 460, 218)) {
        return saved;
      }
      return null;
    }

    return null;
  }

  save(win, name) {
    if (!win || win.isDestroyed()) return;
    try {
      if (!this.data) this.data = {};

      if (name === 'main') {
        const isMaximized = win.isMaximized();
        if (!isMaximized) {
          const bounds = win.getBounds();
          this.data.main = {
            x: bounds.x,
            y: bounds.y,
            width: bounds.width,
            height: bounds.height,
            isMaximized: false
          };
        } else {
          if (!this.data.main) this.data.main = {};
          this.data.main.isMaximized = true;
        }
      } else if (name === 'miniPlayer') {
        const bounds = win.getBounds();
        this.data.miniPlayer = {
          x: bounds.x,
          y: bounds.y
        };
      }

      fs.writeFileSync(this.stateFile, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('[WindowStateService] Erro ao salvar:', e);
    }
  }

  track(win, name) {
    if (!win) return;

    ['resize', 'move'].forEach(event => {
      win.on(event, () => {
        if (this.timers[name]) clearTimeout(this.timers[name]);
        this.timers[name] = setTimeout(() => this.save(win, name), 400);
      });
    });

    win.on('close', () => this.save(win, name));
    win.on('hide', () => this.save(win, name));
  }
}

module.exports = new WindowStateService();
