const settingsService = require('./settingsService');

const OLED_CSS = `
  html, body, ytmusic-app, ytmusic-app-layout, #browse-page, ytmusic-browse-response,
  ytmusic-player-page, ytmusic-guide-renderer, ytmusic-section-list-renderer,
  ytmusic-player-bar, #nav-bar-background {
    background-color: #000000 !important;
    background: #000000 !important;
  }
  ytmusic-nav-bar {
    background-color: #000000 !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
  }
  ytmusic-player-bar {
    border-top: 1px solid rgba(255, 255, 255, 0.06) !important;
  }
  #guide-wrapper {
    background-color: #000000 !important;
    border-right: 1px solid rgba(255, 255, 255, 0.06) !important;
  }
  tp-yt-paper-dialog, ytmusic-dialog {
    background-color: #0a0a0a !important;
  }
`;

class ThemeService {
  constructor() {
    this.mainWindow = null;
    this.insertedKey = null;
  }

  init(mainWindow) {
    this.mainWindow = mainWindow;
    this.applyTheme();
  }

  async applyTheme() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    try {
      if (this.insertedKey) {
        await this.mainWindow.webContents.removeInsertedCSS(this.insertedKey);
        this.insertedKey = null;
      }

      const theme = settingsService.get('theme') || 'default';

      if (theme === 'oled') {
        this.insertedKey = await this.mainWindow.webContents.insertCSS(OLED_CSS);
      } else if (theme === 'custom') {
        const customCss = settingsService.get('customCss');
        if (customCss && typeof customCss === 'string' && customCss.trim()) {
          this.insertedKey = await this.mainWindow.webContents.insertCSS(customCss);
        }
      }
    } catch (err) {
      console.warn('[ThemeService] Erro ao aplicar tema:', err.message);
    }
  }

  setTheme(themeName, customCss = null) {
    settingsService.set('theme', themeName);
    if (customCss !== null) {
      settingsService.set('customCss', customCss);
    }
    return this.applyTheme();
  }
}

module.exports = new ThemeService();
