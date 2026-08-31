const { app } = require('electron');

class StartupService {
  isEnabled() {
    return app.getLoginItemSettings().openAtLogin;
  }

  setEnabled(enabled) {
    app.setLoginItemSettings({
      openAtLogin: Boolean(enabled),
      openAsHidden: false
    });
    return this.isEnabled();
  }
}

module.exports = new StartupService();
