const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

function setupTopBar() {
  if (document.getElementById('ytmd-titlebar')) return;

  var appIconBase64 = '';
  try {
    var iconFile = path.join(__dirname, '../../../assets/icon.png');
    if (fs.existsSync(iconFile)) {
      appIconBase64 = 'data:image/png;base64,' + fs.readFileSync(iconFile).toString('base64');
    }
  } catch (_) {}

  // 1. Zona de gatilho invisível no topo da tela (faixa de 6px)
  var trigger = document.createElement('div');
  trigger.id = 'ytmd-titlebar-trigger';
  document.documentElement.appendChild(trigger);

  // 2. Barra de Título (36px, padrão Windows dark #202020, arrastável)
  var titlebar = document.createElement('div');
  titlebar.id = 'ytmd-titlebar';
  titlebar.className = 'ytmd-titlebar';

  // Lado Esquerdo: Ícone + Título Dinâmico
  var left = document.createElement('div');
  left.className = 'ytmd-titlebar-left';

  if (appIconBase64) {
    var iconImg = document.createElement('img');
    iconImg.className = 'ytmd-titlebar-icon';
    iconImg.src = appIconBase64;
    iconImg.alt = 'YouTube Music';
    left.appendChild(iconImg);
  }

  var titleSpan = document.createElement('span');
  titleSpan.id = 'ytmd-title-text';
  titleSpan.className = 'ytmd-title-text';
  titleSpan.textContent = 'YouTube Music';
  left.appendChild(titleSpan);

  titlebar.appendChild(left);

  // Lado Direito: Botão de Configurações e Controles Nativos do Windows (Minimizar, Maximizar, Fechar)
  var right = document.createElement('div');
  right.className = 'ytmd-titlebar-right';

  // Botão Configurações (46x36px, Segoe Fluent Gear \uE713)
  var settingsBtn = document.createElement('button');
  settingsBtn.id = 'ytmd-btn-settings';
  settingsBtn.className = 'ytmd-titlebar-btn ytmd-btn-settings';
  settingsBtn.title = 'Configurações';
  settingsBtn.setAttribute('tabindex', '-1');
  settingsBtn.textContent = '\uE713';
  settingsBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    ipcRenderer.invoke('settings:open-window');
  });
  right.appendChild(settingsBtn);

  // Botão Minimizar (46x36px, Segoe Fluent ChromeMinimize \uE921)
  var minBtn = document.createElement('button');
  minBtn.id = 'ytmd-btn-minimize';
  minBtn.className = 'ytmd-titlebar-btn';
  minBtn.title = 'Minimizar';
  minBtn.setAttribute('tabindex', '-1');
  minBtn.textContent = '\uE921';
  minBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    ipcRenderer.invoke('window:minimize');
  });
  right.appendChild(minBtn);

  // Botão Maximizar / Restaurar (46x36px, Segoe Fluent ChromeMaximize \uE922 / ChromeRestore \uE923)
  var maxBtn = document.createElement('button');
  maxBtn.id = 'ytmd-btn-maximize';
  maxBtn.className = 'ytmd-titlebar-btn';
  maxBtn.title = 'Maximizar';
  maxBtn.setAttribute('tabindex', '-1');
  maxBtn.textContent = '\uE922';
  maxBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    ipcRenderer.invoke('window:maximize');
  });
  right.appendChild(maxBtn);

  // Botão Fechar (46x36px, Segoe Fluent ChromeClose \uE8BB, hover vermelho nativo do Windows)
  var closeBtn = document.createElement('button');
  closeBtn.id = 'ytmd-btn-close';
  closeBtn.className = 'ytmd-titlebar-btn ytmd-btn-close';
  closeBtn.title = 'Fechar';
  closeBtn.setAttribute('tabindex', '-1');
  closeBtn.textContent = '\uE8BB';
  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    ipcRenderer.invoke('window:close');
  });
  right.appendChild(closeBtn);

  titlebar.appendChild(right);

  // Injetar estilos limpos:
  // - html, body com overflow hidden para eliminar a barra de rolagem raiz que passava por cima do botão Fechar
  // - ytmusic-app-layout como container de rolagem interno com barra moderna, transparente e sem setas
  var style = document.createElement('style');
  style.id = 'ytmd-titlebar-styles';
  style.appendChild(document.createTextNode(
    'html, body {' +
      'overflow: hidden !important;' +
      'width: 100vw !important;' +
      'height: 100vh !important;' +
      'margin: 0 !important;' +
      'padding: 0 !important;' +
    '}' +
    'ytmusic-app-layout, #layout {' +
      'height: 100vh !important;' +
      'overflow-y: auto !important;' +
      'overflow-x: hidden !important;' +
    '}' +
    '::-webkit-scrollbar {' +
      'width: 8px !important;' +
      'height: 8px !important;' +
      'background-color: transparent !important;' +
    '}' +
    '::-webkit-scrollbar-track {' +
      'background-color: transparent !important;' +
    '}' +
    '::-webkit-scrollbar-thumb {' +
      'background-color: rgba(255, 255, 255, 0.22) !important;' +
      'border-radius: 4px !important;' +
    '}' +
    '::-webkit-scrollbar-thumb:hover {' +
      'background-color: rgba(255, 255, 255, 0.45) !important;' +
    '}' +
    '::-webkit-scrollbar-button {' +
      'display: none !important;' +
      'width: 0 !important;' +
      'height: 0 !important;' +
    '}' +
    '#ytmd-titlebar-trigger {' +
      'position: fixed !important;' +
      'top: 0 !important;' +
      'left: 0 !important;' +
      'width: 100vw !important;' +
      'height: 6px !important;' +
      'z-index: 2147483646 !important;' +
      'background: transparent !important;' +
    '}' +
    '#ytmd-titlebar {' +
      'position: fixed !important;' +
      'top: 0 !important;' +
      'left: 0 !important;' +
      'width: 100vw !important;' +
      'height: 36px !important;' +
      'background-color: #202020 !important;' +
      'border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;' +
      'z-index: 2147483647 !important;' +
      'display: flex !important;' +
      'align-items: center !important;' +
      'justify-content: space-between !important;' +
      'padding: 0 !important;' +
      'box-sizing: border-box !important;' +
      'user-select: none !important;' +
      '-webkit-app-region: drag !important;' +
      'transform: translateY(-36px) !important;' +
      'transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease !important;' +
      'box-shadow: 0 4px 16px rgba(0, 0, 0, 0) !important;' +
    '}' +
    '#ytmd-titlebar.ytmd-visible {' +
      'transform: translateY(0) !important;' +
      'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6) !important;' +
    '}' +
    '.ytmd-titlebar-left {' +
      'display: flex !important;' +
      'align-items: center !important;' +
      'gap: 8px !important;' +
      'padding-left: 12px !important;' +
      'min-width: 0 !important;' +
      'overflow: hidden !important;' +
      'pointer-events: none !important;' +
      '-webkit-app-region: drag !important;' +
    '}' +
    '.ytmd-titlebar-icon {' +
      'width: 16px !important;' +
      'height: 16px !important;' +
      'object-fit: contain !important;' +
      'flex-shrink: 0 !important;' +
    '}' +
    '.ytmd-title-text {' +
      'color: #e0e0e0 !important;' +
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;' +
      'font-size: 13px !important;' +
      'font-weight: 400 !important;' +
      'white-space: nowrap !important;' +
      'overflow: hidden !important;' +
      'text-overflow: ellipsis !important;' +
      'letter-spacing: 0.1px !important;' +
    '}' +
    '.ytmd-titlebar-right {' +
      'display: flex !important;' +
      'align-items: center !important;' +
      'margin: 0 !important;' +
      'padding: 0 !important;' +
      'height: 36px !important;' +
      '-webkit-app-region: no-drag !important;' +
      'flex-shrink: 0 !important;' +
    '}' +
    '.ytmd-titlebar-btn {' +
      'width: 46px !important;' +
      'height: 36px !important;' +
      'background: transparent !important;' +
      'border: none !important;' +
      'border-radius: 0 !important;' +
      'color: #ffffff !important;' +
      'display: inline-flex !important;' +
      'align-items: center !important;' +
      'justify-content: center !important;' +
      'cursor: pointer !important;' +
      'padding: 0 !important;' +
      'margin: 0 !important;' +
      'outline: none !important;' +
      '-webkit-app-region: no-drag !important;' +
      'font-family: "Segoe Fluent Icons", "Segoe MDL2 Assets", sans-serif !important;' +
      'font-size: 10px !important;' +
      'line-height: 1 !important;' +
      'user-select: none !important;' +
      'transition: background-color 0.1s ease, color 0.1s ease !important;' +
    '}' +
    '.ytmd-btn-settings {' +
      'font-size: 13px !important;' +
    '}' +
    '.ytmd-titlebar-btn:hover {' +
      'background-color: rgba(255, 255, 255, 0.1) !important;' +
      'color: #ffffff !important;' +
    '}' +
    '.ytmd-titlebar-btn:active {' +
      'background-color: rgba(255, 255, 255, 0.18) !important;' +
    '}' +
    '.ytmd-btn-close:hover {' +
      'background-color: #e81123 !important;' +
      'color: #ffffff !important;' +
    '}' +
    '.ytmd-btn-close:active {' +
      'background-color: #bf0f1d !important;' +
      'color: #ffffff !important;' +
    '}'
  ));

  document.head.appendChild(style);
  document.documentElement.appendChild(titlebar);

  // Duplo clique na área de arrastar para Maximizar / Restaurar
  titlebar.addEventListener('dblclick', function(e) {
    if (e.target && e.target.closest('.ytmd-titlebar-btn')) return;
    ipcRenderer.invoke('window:maximize');
  });

  // Atualização do ícone de Maximizar/Restaurar com glifos nativos do Windows 11
  var setMaximizeIcon = function(isMaximized) {
    var btn = document.getElementById('ytmd-btn-maximize');
    if (!btn) return;
    btn.textContent = isMaximized ? '\uE923' : '\uE922';
    btn.title = isMaximized ? 'Restaurar' : 'Maximizar';
  };

  var checkMaximized = function() {
    ipcRenderer.invoke('window:is-maximized').then(function(isMax) {
      setMaximizeIcon(Boolean(isMax));
    }).catch(function() {});
  };

  checkMaximized();
  setTimeout(checkMaximized, 1000);

  ipcRenderer.on('window-maximized-state', function(event, isMax) {
    setMaximizeIcon(Boolean(isMax));
  });

  window.addEventListener('resize', checkMaximized);

  // Mecanismo de Auto-Hide estilo Navegador Zen (Sobreposição suave)
  var hideTimeout = null;

  var showBar = function() {
    if (hideTimeout) {
      clearTimeout(hideTimeout);
      hideTimeout = null;
    }
    checkMaximized();
    titlebar.classList.add('ytmd-visible');
  };

  var scheduleHide = function(delay) {
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(function() {
      titlebar.classList.remove('ytmd-visible');
      hideTimeout = null;
    }, delay || 1000);
  };

  trigger.addEventListener('mouseenter', showBar);
  titlebar.addEventListener('mouseenter', showBar);
  titlebar.addEventListener('mouseleave', function() {
    scheduleHide(1000);
  });

  document.addEventListener('mousemove', function(e) {
    if (e.clientY <= 6) {
      showBar();
    }
  });

  // Mostra brevemente ao carregar para o usuário saber que existe, e depois recolhe
  showBar();
  scheduleHide(2500);

  // Atualização dinâmica do Título da Música (apenas título e autor, sem curtidas)
  var updateTitle = function(title, artist) {
    if (!titleSpan) return;
    if (title && title.trim()) {
      var t = title.trim();
      var a = (artist || '').split('•')[0].split('·')[0].split('|')[0].trim();
      titleSpan.textContent = a ? (t + ' • ' + a) : t;
    } else {
      var docTitle = (document.title || '').replace(/ - YouTube Music/i, '').replace(/ • YouTube Music/i, '').trim();
      titleSpan.textContent = docTitle || 'YouTube Music';
    }
  };

  // Observador de faixa em reprodução no YouTube Music
  var observeTrack = function() {
    var playerBar = document.querySelector('ytmusic-player-bar');
    if (!playerBar) return;

    var readPlayer = function() {
      var tEl = playerBar.querySelector('.title') || playerBar.querySelector('.ytmusic-player-bar.title');
      var aEl = playerBar.querySelector('.byline') || playerBar.querySelector('.ytmusic-player-bar.byline');
      var t = tEl ? tEl.textContent.trim() : '';
      var a = '';
      if (aEl) {
        var firstLink = aEl.querySelector('a');
        if (firstLink && firstLink.textContent.trim()) {
          a = firstLink.textContent.trim();
        } else {
          var raw = aEl.textContent.trim();
          var parts = raw.split(/•|·|\|/);
          a = (parts[0] || '').trim();
        }
      }
      updateTitle(t, a);
    };

    var observer = new MutationObserver(readPlayer);
    observer.observe(playerBar, { childList: true, subtree: true, characterData: true });
    readPlayer();
  };

  var playerPoll = setInterval(function() {
    if (document.querySelector('ytmusic-player-bar')) {
      clearInterval(playerPoll);
      observeTrack();
    }
  }, 1000);

  ipcRenderer.on('track-changed', function(event, data) {
    if (data) updateTitle(data.title, data.artist);
  });

  var titleTag = document.querySelector('title');
  if (titleTag) {
    new MutationObserver(function() {
      var playerBar = document.querySelector('ytmusic-player-bar');
      if (!playerBar) updateTitle('', '');
    }).observe(titleTag, { childList: true, characterData: true, subtree: true });
  }

  // Suporte a tela cheia
  var handleFullscreen = function() {
    var isFs = !!document.fullscreenElement;
    document.documentElement.classList.toggle('ytmd-fullscreen', isFs);
    if (titlebar) titlebar.style.display = isFs ? 'none' : 'flex';
  };
  document.addEventListener('fullscreenchange', handleFullscreen);
}

module.exports = { setupTopBar };
