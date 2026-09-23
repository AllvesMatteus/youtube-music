const { ipcRenderer } = require('electron');
const { applyAntiDetection } = require('./modules/antiDetection');
const { setupPlayerController } = require('./modules/playerController');
const { setupTrackObserver } = require('./modules/trackObserver');
const { setupAdSkipper } = require('./modules/adSkipper');
const { setupTopBar } = require('./modules/topBar');

applyAntiDetection();

function setupAuthClickInterceptors() {
  document.addEventListener('click', (e) => {
    try {
      const target = e.target;
      if (!target) return;

      const el = target.closest('a, button, yt-formatted-string, tp-yt-paper-item, ytd-compact-link-renderer, tp-yt-paper-button');
      if (!el) return;

      const text = (el.textContent || '').trim().toLowerCase();
      const href = el.getAttribute('href') || (el.closest('a') && el.closest('a').getAttribute('href')) || '';

      // Intercepta clique em "Sair" / "Sign out" no menu do YouTube Music
      const isLogout = text === 'sair' ||
                       text === 'sign out' ||
                       href.includes('/logout') ||
                       href.includes('/Logout') ||
                       href.includes('Logout2');

      if (isLogout) {
        e.preventDefault();
        e.stopPropagation();
        ipcRenderer.invoke('account:perform-logout');
        return;
      }

      // Intercepta clique em "Fazer login" / "Sign in"
      const isLogin = text === 'fazer login' ||
                      text === 'sign in' ||
                      href.includes('accounts.google.com') ||
                      href.includes('ServiceLogin');

      if (isLogin) {
        e.preventDefault();
        e.stopPropagation();
        ipcRenderer.invoke('open-login-window');
        return;
      }
    } catch (_) {}
  }, true);
}

window.addEventListener('DOMContentLoaded', () => {
  setupPlayerController();
  setupTrackObserver();
  setupAdSkipper();
  setupTopBar();
  setupAuthClickInterceptors();
});
