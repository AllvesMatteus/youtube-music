const { app, screen } = require('electron');
const fs = require('fs');
const path = require('path');
const config = require('../config/appConfig');

class WindowStateService {
  constructor() {
    this.stateFile = path.join(app.getPath('userData'), 'window-state.json');
    this.state = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const saved = JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
        // Valida se as coordenadas salvas ainda estão visíveis em algum monitor atual
        if (saved && this.isStateValid(saved)) {
          return saved;
        }
      }
    } catch (e) {
      console.error('[WindowStateService] Erro ao carregar estado da janela:', e);
    }

    return {
      width: config.WINDOW.DEFAULT_WIDTH,
      height: config.WINDOW.DEFAULT_HEIGHT,
      isMaximized: false
    };
  }

  isStateValid(state) {
    if (!state || typeof state.x !== 'number' || typeof state.y !== 'number') {
      return false;
    }

    // Verifica se a janela está dentro dos limites de algum monitor conectado
    const displays = screen.getAllDisplays();
    return displays.some(display => {
      const { x, y, width, height } = display.bounds;
      return (
        state.x >= x - 50 &&
        state.y >= y - 50 &&
        state.x + (state.width || 100) <= x + width + 50 &&
        state.y + (state.height || 100) <= y + height + 50
      );
    });
  }

  save(win) {
    if (!win || win.isDestroyed()) return;
    try {
      const isMaximized = win.isMaximized();
      if (!isMaximized) {
        const bounds = win.getBounds();
        this.state = {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          isMaximized: false
        };
      } else {
        this.state.isMaximized = true;
      }

      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
    } catch (e) {
      console.error('[WindowStateService] Erro ao salvar estado da janela:', e);
    }
  }

  track(win) {
    if (!win) return;

    ['resize', 'move'].forEach(event => {
      win.on(event, () => {
        // Debounce para evitar escrita excessiva em disco
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.save(win), 500);
      });
    });

    win.on('close', () => {
      this.save(win);
    });
  }
}

module.exports = new WindowStateService();
