const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Carrega os ícones em Base64 para injeção rápida e sem dependência de rede
function getIconDataUrl(name) {
  try {
    const iconPath = path.join(__dirname, '../../../assets/icons', `${name}.png`);
    if (fs.existsSync(iconPath)) {
      const b64 = fs.readFileSync(iconPath).toString('base64');
      return `data:image/png;base64,${b64}`;
    }
  } catch (e) {}
  return '';
}

function setupTopBar() {
  const icons = {
    shuffle: getIconDataUrl('shuffle'),
    previous: getIconDataUrl('previous'),
    rewind: getIconDataUrl('rewind'),
    play: getIconDataUrl('play'),
    pause: getIconDataUrl('pause'),
    fastForward: getIconDataUrl('fast-forward'),
    next: getIconDataUrl('next'),
    repeat: getIconDataUrl('repeat'),
    like: getIconDataUrl('like'),
    volume: getIconDataUrl('volume'),
    mute: getIconDataUrl('mute'),
    avatar: getIconDataUrl('avatar'),
    exit: getIconDataUrl('exit')
  };

  // Cria a barra superior fixa e moderna
  const bar = document.createElement('div');
  bar.id = 'ytm-custom-topbar';
  bar.innerHTML = `
    <div class="topbar-container">
      <!-- Controles de Mídia em linha única -->
      <div class="topbar-controls">
        <button class="topbar-btn" id="btn-shuffle" title="Aleatório">
          <img src="${icons.shuffle}" alt="Aleatório" />
        </button>
        <button class="topbar-btn" id="btn-previous" title="Música Anterior">
          <img src="${icons.previous}" alt="Anterior" />
        </button>
        <button class="topbar-btn" id="btn-rewind" title="Voltar 10s">
          <img src="${icons.rewind}" alt="Voltar 10s" />
        </button>
        <button class="topbar-btn play-btn" id="btn-play-pause" title="Play / Pause">
          <img id="img-play-pause" src="${icons.play}" alt="Play/Pause" />
        </button>
        <button class="topbar-btn" id="btn-fastforward" title="Avançar 10s">
          <img src="${icons.fastForward}" alt="Avançar 10s" />
        </button>
        <button class="topbar-btn" id="btn-next" title="Próxima Música">
          <img src="${icons.next}" alt="Próxima" />
        </button>
        <button class="topbar-btn" id="btn-repeat" title="Repetir">
          <img src="${icons.repeat}" alt="Repetir" />
        </button>
        <button class="topbar-btn" id="btn-like" title="Curtir">
          <img src="${icons.like}" alt="Curtir" />
        </button>
        <button class="topbar-btn" id="btn-mute" title="Volume / Mudo">
          <img id="img-mute" src="${icons.volume}" alt="Volume" />
        </button>
      </div>

      <!-- Lado Direito: Troca de Usuário e Botão Fechar Vermelho -->
      <div class="topbar-actions">
        <button class="topbar-btn user-btn" id="btn-user-switch" title="Mudar de Conta / Perfis">
          <img src="${icons.avatar}" alt="Usuário" />
          <span id="active-user-name" class="user-label">Contas</span>
        </button>

        <button class="topbar-btn exit-btn" id="btn-app-exit" title="Fechar Aplicativo">
          <img src="${icons.exit}" alt="Fechar" />
        </button>
      </div>
    </div>

    <!-- Modal Dropdown de Troca de Contas -->
    <div id="ytm-account-modal" class="account-modal hidden">
      <div class="modal-header">
        <h3>👤 Alternar Conta</h3>
        <span class="modal-close" id="btn-close-modal">&times;</span>
      </div>
      <div id="accounts-list" class="accounts-list">
        <!-- Populado dinamicamente -->
      </div>
      <div class="modal-footer">
        <button id="btn-add-account" class="btn-add-account">
          ➕ Adicionar Nova Conta
        </button>
      </div>
    </div>
  `;

  // Estilos CSS embutidos com visual escuro elegante estilo YouTube Music
  const style = document.createElement('style');
  style.textContent = `
    #ytm-custom-topbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 48px;
      background: rgba(18, 18, 18, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      z-index: 999999;
      display: flex;
      align-items: center;
      padding: 0 16px;
      box-sizing: border-box;
      -webkit-app-region: drag; /* Permite arrastar a janela pela barra */
    }

    /* Empurra o conteúdo do YouTube Music para não ficar embaixo da barra */
    ytmusic-app {
      padding-top: 48px !important;
      box-sizing: border-box !important;
    }

    .topbar-container {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .topbar-controls, .topbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      -webkit-app-region: no-drag; /* Botões clicáveis */
    }

    .topbar-btn {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      padding: 0;
    }

    .topbar-btn img {
      width: 16px;
      height: 16px;
      object-fit: contain;
      pointer-events: none;
    }

    .topbar-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.25);
      transform: translateY(-1px);
    }

    .topbar-btn:active {
      transform: translateY(1px);
      background: rgba(255, 255, 255, 0.08);
    }

    .play-btn {
      background: rgba(255, 0, 0, 0.2);
      border-color: rgba(255, 0, 0, 0.4);
      width: 36px;
      height: 36px;
    }

    .play-btn:hover {
      background: rgba(255, 0, 0, 0.4);
      border-color: rgba(255, 0, 0, 0.7);
      box-shadow: 0 0 12px rgba(255, 0, 0, 0.3);
    }

    /* Botão de Usuário */
    .user-btn {
      width: auto;
      padding: 0 12px;
      gap: 8px;
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .user-label {
      color: #ffffff;
      font-size: 12px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Botão Fechar Vermelho */
    .exit-btn {
      background: rgba(255, 59, 48, 0.15);
      border-color: rgba(255, 59, 48, 0.4);
    }

    .exit-btn img {
      filter: drop-shadow(0 0 4px rgba(255, 59, 48, 0.6));
    }

    .exit-btn:hover {
      background: #ff3b30 !important;
      border-color: #ff3b30 !important;
      box-shadow: 0 0 14px rgba(255, 59, 48, 0.6);
    }

    .exit-btn:hover img {
      filter: brightness(0) invert(1);
    }

    /* Modal de Troca de Contas */
    .account-modal {
      position: absolute;
      top: 54px;
      right: 16px;
      width: 300px;
      background: #1e1e1e;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
      padding: 16px;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 1000000;
      animation: fadeInModal 0.2s ease-out;
      -webkit-app-region: no-drag;
    }

    .account-modal.hidden {
      display: none;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 10px;
      margin-bottom: 12px;
    }

    .modal-header h3 {
      font-size: 14px;
      font-weight: 600;
      margin: 0;
    }

    .modal-close {
      cursor: pointer;
      font-size: 20px;
      color: #888;
    }

    .modal-close:hover {
      color: #fff;
    }

    .accounts-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
      margin-bottom: 14px;
    }

    .account-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.06);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .account-item:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .account-item.active {
      background: rgba(255, 0, 0, 0.15);
      border-color: rgba(255, 0, 0, 0.5);
    }

    .account-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .account-name {
      font-size: 13px;
      font-weight: 500;
      color: #fff;
    }

    .account-email {
      font-size: 11px;
      color: #888;
    }

    .active-badge {
      font-size: 11px;
      color: #ff4444;
      font-weight: 600;
    }

    .btn-add-account {
      width: 100%;
      padding: 10px;
      background: #ff0000;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-add-account:hover {
      background: #cc0000;
    }

    @keyframes fadeInModal {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;

  document.head.appendChild(style);
  document.body.prepend(bar);

  // ─────────────────────────────────────────────────────────────
  // AÇÕES DOS BOTÕES DE MÍDIA
  // ─────────────────────────────────────────────────────────────
  const btnPlayPause = document.getElementById('btn-play-pause');
  const btnNext = document.getElementById('btn-next');
  const btnPrev = document.getElementById('btn-previous');
  const btnRewind = document.getElementById('btn-rewind');
  const btnFastForward = document.getElementById('btn-fastforward');
  const btnShuffle = document.getElementById('btn-shuffle');
  const btnRepeat = document.getElementById('btn-repeat');
  const btnLike = document.getElementById('btn-like');
  const btnMute = document.getElementById('btn-mute');
  const btnUser = document.getElementById('btn-user-switch');
  const btnExit = document.getElementById('btn-app-exit');
  const modal = document.getElementById('ytm-account-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnAddAccount = document.getElementById('btn-add-account');

  // Play / Pause
  btnPlayPause.addEventListener('click', () => {
    const btn = document.querySelector('#play-pause-button') || document.querySelector('.play-pause-button');
    if (btn) btn.click();
    else {
      const v = document.querySelector('video');
      if (v) v.paused ? v.play() : v.pause();
    }
  });

  // Próxima
  btnNext.addEventListener('click', () => {
    const btn = document.querySelector('.next-button') || document.querySelector('tp-yt-paper-icon-button.next-button');
    if (btn) btn.click();
  });

  // Anterior
  btnPrev.addEventListener('click', () => {
    const btn = document.querySelector('.previous-button') || document.querySelector('tp-yt-paper-icon-button.previous-button');
    if (btn) btn.click();
  });

  // Voltar 10s
  btnRewind.addEventListener('click', () => {
    const v = document.querySelector('video');
    if (v) v.currentTime = Math.max(0, v.currentTime - 10);
  });

  // Avançar 10s
  btnFastForward.addEventListener('click', () => {
    const v = document.querySelector('video');
    if (v) v.currentTime = Math.min(v.duration || Infinity, v.currentTime + 10);
  });

  // Aleatório (Shuffle)
  btnShuffle.addEventListener('click', () => {
    const btn = document.querySelector('ytmusic-player-bar .shuffle') || 
                document.querySelector('.ytmusic-player-bar.shuffle') ||
                document.querySelector('tp-yt-paper-icon-button.shuffle');
    if (btn) btn.click();
  });

  // Repetir (Repeat)
  btnRepeat.addEventListener('click', () => {
    const btn = document.querySelector('ytmusic-player-bar .repeat') || 
                document.querySelector('.ytmusic-player-bar.repeat') ||
                document.querySelector('tp-yt-paper-icon-button.repeat');
    if (btn) btn.click();
  });

  // Curtir (Like)
  btnLike.addEventListener('click', () => {
    const btn = document.querySelector('ytmusic-player-bar ytmusic-like-button-renderer #button[aria-label*="Gostei"]') ||
                document.querySelector('ytmusic-player-bar ytmusic-like-button-renderer tp-yt-paper-icon-button.like');
    if (btn) btn.click();
  });

  // Mudo / Volume
  btnMute.addEventListener('click', () => {
    const v = document.querySelector('video');
    if (v) {
      v.muted = !v.muted;
      const img = document.getElementById('img-mute');
      if (img) img.src = v.muted ? icons.mute : icons.volume;
    }
  });

  // Botão Fechar Vermelho: Encerra o app de vez
  btnExit.addEventListener('click', () => {
    ipcRenderer.send('app-exit');
  });

  // ─────────────────────────────────────────────────────────────
  // MODAL DE TROCA DE CONTAS
  // ─────────────────────────────────────────────────────────────
  async function renderAccounts() {
    const { accounts, activeAccountId } = await ipcRenderer.invoke('get-accounts');
    const list = document.getElementById('accounts-list');
    list.innerHTML = '';

    const activeAcc = accounts.find(a => a.id === activeAccountId);
    if (activeAcc) {
      document.getElementById('active-user-name').textContent = activeAcc.name;
    }

    accounts.forEach(acc => {
      const item = document.createElement('div');
      item.className = `account-item ${acc.id === activeAccountId ? 'active' : ''}`;
      item.innerHTML = `
        <div class="account-info">
          <span class="account-name">${acc.name}</span>
          ${acc.email ? `<span class="account-email">${acc.email}</span>` : ''}
        </div>
        ${acc.id === activeAccountId ? '<span class="active-badge">✓ Ativa</span>' : ''}
      `;

      item.addEventListener('click', async () => {
        if (acc.id !== activeAccountId) {
          modal.classList.add('hidden');
          await ipcRenderer.invoke('switch-account', acc.id);
        }
      });

      list.appendChild(item);
    });
  }

  btnUser.addEventListener('click', (e) => {
    e.stopPropagation();
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
      renderAccounts();
    }
  });

  btnCloseModal.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!modal.contains(e.target) && e.target !== btnUser) {
      modal.classList.add('hidden');
    }
  });

  btnAddAccount.addEventListener('click', async () => {
    const name = prompt('Digite um nome para a nova conta (ex: Namorada, Trabalho):', 'Conta 2');
    if (name) {
      modal.classList.add('hidden');
      await ipcRenderer.invoke('add-account', name);
    }
  });

  // Inicializa lista de contas e nome ativo
  renderAccounts();

  // ─────────────────────────────────────────────────────────────
  // DETECÇÃO AUTOMÁTICA DE NOME/EMAIL NO YOUTUBE MUSIC
  // ─────────────────────────────────────────────────────────────
  setInterval(() => {
    const accountBtn = document.querySelector('ytmusic-settings-button img') || 
                       document.querySelector('#avatar-btn img') ||
                       document.querySelector('button#avatar-btn');
    
    if (accountBtn) {
      const altText = accountBtn.getAttribute('alt') || '';
      const avatarSrc = accountBtn.getAttribute('src') || '';

      if (altText && altText.length > 1) {
        ipcRenderer.send('account-info-detected', {
          name: altText,
          avatarUrl: avatarSrc
        });
      }
    }
  }, 5000);
}

module.exports = { setupTopBar };
