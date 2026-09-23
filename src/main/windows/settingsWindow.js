const { BrowserWindow, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const config = require('../config/appConfig');
const settingsService = require('../services/settingsService');
const startupService = require('../services/startupService');
const updateService = require('../services/updateService');

let settingsWin = null;

function createSettingsWindow(parentWindow) {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.show();
    settingsWin.focus();
    return settingsWin;
  }

  const iconPath = path.join(config.PATHS.ASSETS, 'icon.png');
  let appIconBase64 = '';
  try {
    if (fs.existsSync(iconPath)) {
      appIconBase64 = 'data:image/png;base64,' + fs.readFileSync(iconPath).toString('base64');
    }
  } catch (_) {}

  settingsWin = new BrowserWindow({
    width: 820,
    height: 630,
    minWidth: 720,
    minHeight: 540,
    center: true,
    title: 'Configurações',
    icon: iconPath,
    backgroundColor: '#050505',
    autoHideMenuBar: true,
    resizable: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      sandbox: false
    }
  });

  settingsWin.on('closed', () => {
    settingsWin = null;
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Configurações</title>
  <style>
    :root {
      --bg-base: #050505;
      --bg-sidebar: #0f0f0f;
      --bg-surface: #141414;
      --bg-surface-elevated: #1e1e1e;
      --bg-surface-hover: #222222;
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-hover: rgba(255, 255, 255, 0.18);
      --yt-red: #ff0000;
      --yt-red-hover: #d90000;
      --text-primary: #f1f1f1;
      --text-secondary: #aaaaaa;
      --text-muted: #717171;
      --pill-bg: rgba(255, 255, 255, 0.08);
      --pill-bg-hover: rgba(255, 255, 255, 0.16);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: var(--bg-base); }
    ::-webkit-scrollbar-thumb { background: #272727; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #3f3f3f; }

    body {
      background: var(--bg-base);
      color: var(--text-primary);
      font-family: 'YouTube Sans', Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 13px;
      user-select: none;
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* Sidebar Estilo YouTube Music */
    .sidebar {
      width: 236px;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      padding: 14px 0;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      padding: 6px 18px 20px 18px;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .sidebar-logo {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      filter: drop-shadow(0 0 10px rgba(255, 0, 0, 0.45));
    }
    .sidebar-brand-title {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.2px;
      color: #fff;
    }

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 16px;
      margin: 1px 10px;
      border-radius: 10px;
      color: #ccc;
      cursor: pointer;
      font-size: 13.5px;
      font-weight: 500;
      transition: background 0.15s, color 0.15s;
    }
    .nav-item:hover {
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
    }
    .nav-item.active {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
      font-weight: 600;
    }
    .nav-item svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
      flex-shrink: 0;
    }

    .sidebar-divider {
      height: 1px;
      background: var(--border-subtle);
      margin: 10px 16px;
    }

    /* Área de Conteúdo */
    .content-area {
      flex: 1;
      padding: 28px 36px;
      overflow-y: auto;
      background: var(--bg-base);
    }

    .tab-pane {
      display: none;
      flex-direction: column;
      gap: 18px;
      animation: fadeIn 0.15s ease-out;
    }
    .tab-pane.active {
      display: flex;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .tab-header {
      margin-bottom: 6px;
    }
    .tab-title {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.3px;
    }
    .tab-subtitle {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    /* Cards de Opção */
    .setting-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      transition: border-color 0.15s, background 0.15s;
    }
    .setting-card:hover {
      border-color: var(--border-hover);
      background: rgba(255, 255, 255, 0.02);
    }
    .setting-info {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .setting-label {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }
    .setting-desc {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    /* Switches */
    .switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
      flex-shrink: 0;
    }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #333333;
      transition: 0.2s;
      border-radius: 24px;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.2s;
      border-radius: 50%;
    }
    input:checked + .slider { background-color: var(--yt-red); }
    input:checked + .slider:before { transform: translateX(20px); }

    /* Select */
    select.setting-select {
      background: var(--bg-surface-elevated);
      color: #fff;
      border: 1px solid var(--border-subtle);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      outline: none;
      cursor: pointer;
    }
    select.setting-select:focus { border-color: var(--yt-red); }

    /* Botões Pill */
    .pill-btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.15s, transform 0.1s;
      border: 1px solid var(--border-subtle);
      background: var(--pill-bg);
      color: var(--text-primary);
      outline: none;
    }
    .pill-btn:hover {
      background: var(--pill-bg-hover);
      border-color: var(--border-hover);
    }
    .pill-btn:active { transform: scale(0.97); }
    .pill-primary {
      background: var(--yt-red);
      border-color: var(--yt-red);
      color: #fff;
      font-weight: 600;
    }
    .pill-primary:hover { background: var(--yt-red-hover); }

    /* Gravador de Atalhos (Key Recorder) */
    .shortcut-recorder-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .shortcut-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.16);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      color: #eee;
      cursor: pointer;
      min-width: 130px;
      justify-content: center;
      transition: all 0.15s;
    }
    .shortcut-badge:hover {
      border-color: rgba(255, 255, 255, 0.35);
      background: rgba(255, 255, 255, 0.05);
    }
    .shortcut-badge.recording {
      border-color: var(--yt-red);
      background: rgba(255, 0, 0, 0.12);
      color: #ff6b6b;
      animation: pulseRecord 1.2s infinite;
    }
    @keyframes pulseRecord {
      0%, 100% { border-color: var(--yt-red); }
      50% { border-color: rgba(255, 0, 0, 0.3); }
    }
    .kbd {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.18);
      padding: 2px 7px;
      border-radius: 4px;
      font-family: inherit;
      font-size: 11px;
      font-weight: 600;
      color: #fff;
    }
    .btn-clear-shortcut {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      border-radius: 4px;
      transition: color 0.15s;
    }
    .btn-clear-shortcut:hover { color: #ff5555; }
    .btn-clear-shortcut svg { width: 14px; height: 14px; fill: currentColor; }

    /* Aviso / Dica */
    .notice-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-left: 3px solid var(--yt-red);
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 12px;
      line-height: 1.5;
      color: var(--text-secondary);
    }

    /* Aba Sobre */
    .about-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
    }
    .about-logo { width: 56px; height: 56px; }
    .about-title { font-size: 20px; font-weight: 700; color: #fff; }
    .about-version {
      font-size: 12px;
      color: var(--text-muted);
      background: rgba(255, 255, 255, 0.06);
      padding: 3px 10px;
      border-radius: 12px;
      font-weight: 500;
    }
    .about-author { font-size: 13px; color: var(--text-secondary); }
    .about-author a { color: #fff; font-weight: 600; text-decoration: underline; cursor: pointer; }
    .about-links { display: flex; gap: 10px; margin-top: 10px; }
    .link-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 8px;
      background: var(--pill-bg);
      border: 1px solid var(--border-subtle);
      color: #fff;
      text-decoration: none;
      font-size: 12px;
      transition: background 0.15s;
    }
    .link-badge:hover { background: var(--pill-bg-hover); border-color: var(--border-hover); }

    /* Badges de Status */
    .status-badge { font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 600; }
    .badge-info { background: rgba(33, 150, 243, 0.15); color: #64b5f6; }
    .badge-success { background: rgba(76, 175, 80, 0.15); color: #81c784; }
    .badge-error { background: rgba(244, 67, 54, 0.15); color: #e57373; }
  </style>
</head>
<body>
  <!-- Sidebar Estilo YouTube Music -->
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-brand">
        <svg class="sidebar-logo" viewBox="0 0 192 192">
          <g>
            <circle fill="#FF0000" cx="96" cy="96" r="88"/>
            <path fill="#FFFFFF" d="M96,54.04c23.14,0,41.96,18.82,41.96,41.96S119.14,137.96,96,137.96S54.04,119.14,54.04,96S72.86,54.04,96,54.04 M96,50c-25.41,0-46,20.59-46,46s20.59,46,46,46s46-20.59,46-46S121.41,50,96,50L96,50z"/>
            <polygon fill="#FFFFFF" points="80,119 119,95 80,73"/>
          </g>
        </svg>
        <span class="sidebar-brand-title">Configurações</span>
      </div>
    </div>

    <div class="sidebar-nav">
      <div class="nav-item active" data-tab="tab-general">
        <svg viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
        Geral
      </div>
      <div class="nav-item" data-tab="tab-shortcuts">
        <svg viewBox="0 0 24 24"><path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/></svg>
        Teclas de Atalho
      </div>
      <div class="nav-item" data-tab="tab-appearance">
        <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.27 19.67 10.59 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>
        Aparência & Temas
      </div>
      <div class="nav-item" data-tab="tab-integrations">
        <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm4-7H8V8h8v2z"/></svg>
        Recursos & Integrações
      </div>
      <div class="nav-item" data-tab="tab-miniplayer">
        <svg viewBox="0 0 24 24"><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/></svg>
        Mini Player
      </div>

      <div class="sidebar-divider"></div>

      <div class="nav-item" data-tab="tab-about">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        Sobre & Atualizações
      </div>
    </div>
  </div>

  <!-- Conteúdo Principal -->
  <div class="content-area">
    <!-- Aba Geral -->
    <div class="tab-pane active" id="tab-general">
      <div class="tab-header">
        <div class="tab-title">Configurações Gerais</div>
        <div class="tab-subtitle">Preferências do sistema, inicialização e ferramentas rápidas</div>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Iniciar com o Windows</span>
          <span class="setting-desc">Abre o YouTube Music automaticamente quando o computador ligar.</span>
        </div>
        <label class="switch">
          <input type="checkbox" id="chk-start-windows">
          <span class="slider"></span>
        </label>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Comportamento ao Fechar</span>
          <span class="setting-desc">Ao clicar no botão "X", minimiza para a bandeja ao invés de encerrar.</span>
        </div>
        <select id="sel-close-behavior" class="setting-select">
          <option value="tray">Minimizar para a Bandeja</option>
          <option value="exit">Fechar o Aplicativo</option>
        </select>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Aceleração de Hardware</span>
          <span class="setting-desc">Utiliza a placa de vídeo para melhor desempenho gráfico e animações fluidas.</span>
        </div>
        <label class="switch">
          <input type="checkbox" id="chk-hardware-accel">
          <span class="slider"></span>
        </label>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Manter Sempre no Topo</span>
          <span class="setting-desc">Mantém a janela principal por cima de todos os outros programas.</span>
        </div>
        <label class="switch">
          <input type="checkbox" id="chk-always-on-top">
          <span class="slider"></span>
        </label>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Verificar Atualizações ao Iniciar</span>
          <span class="setting-desc">Checa se há novas versões disponíveis automaticamente sempre que o aplicativo for aberto.</span>
        </div>
        <label class="switch">
          <input type="checkbox" id="chk-autoupdate">
          <span class="slider"></span>
        </label>
      </div>

      <div style="margin-top: 6px;">
        <div class="tab-title" style="font-size: 15px;">Ferramentas do Sistema</div>
        <div class="tab-subtitle">Verificação de integridade e conectividade da sessão</div>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Diagnóstico do Sistema</span>
          <span class="setting-desc">Verifica cookies de sessão, conexões com os servidores Google e relatórios operacionais.</span>
        </div>
        <button id="btn-open-diagnostic" class="pill-btn">
          Abrir Diagnóstico
        </button>
      </div>
    </div>

    <!-- Aba Teclas de Atalho -->
    <div class="tab-pane" id="tab-shortcuts">
      <div class="tab-header">
        <div class="tab-title">Teclas de Atalho Globais</div>
        <div class="tab-subtitle">Personalize atalhos para controlar sua reprodução de qualquer tela do Windows</div>
      </div>

      <div class="notice-card">
        <strong>Controles e Teclados Gaming:</strong> As teclas multimídia dedicadas (como Play/Pause em teclados <strong>Patriot Viper V770 RGB</strong>) são reconhecidas nativamente. Se outro aplicativo (como navegadores) estiver bloqueando suas teclas multimídia, clique no atalho abaixo e defina qualquer combinação livre (ex: <span class="kbd">Ctrl</span> + <span class="kbd">Alt</span> + <span class="kbd">Espaço</span>).
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Reproduzir / Pausar</span>
          <span class="setting-desc">Alterna entre reprodução e pausa da música atual.</span>
        </div>
        <div class="shortcut-recorder-wrap">
          <div class="shortcut-badge" data-action="playPause">...</div>
          <button class="btn-clear-shortcut" data-action="playPause" title="Limpar atalho">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Próxima Faixa</span>
          <span class="setting-desc">Avança para a próxima música da fila.</span>
        </div>
        <div class="shortcut-recorder-wrap">
          <div class="shortcut-badge" data-action="nextTrack">...</div>
          <button class="btn-clear-shortcut" data-action="nextTrack" title="Limpar atalho">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Faixa Anterior</span>
          <span class="setting-desc">Retorna para o início da faixa ou música anterior.</span>
        </div>
        <div class="shortcut-recorder-wrap">
          <div class="shortcut-badge" data-action="prevTrack">...</div>
          <button class="btn-clear-shortcut" data-action="prevTrack" title="Limpar atalho">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Aumentar Volume</span>
          <span class="setting-desc">Aumenta o volume interno do player em 5%.</span>
        </div>
        <div class="shortcut-recorder-wrap">
          <div class="shortcut-badge" data-action="volumeUp">...</div>
          <button class="btn-clear-shortcut" data-action="volumeUp" title="Limpar atalho">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Diminuir Volume</span>
          <span class="setting-desc">Diminui o volume interno do player em 5%.</span>
        </div>
        <div class="shortcut-recorder-wrap">
          <div class="shortcut-badge" data-action="volumeDown">...</div>
          <button class="btn-clear-shortcut" data-action="volumeDown" title="Limpar atalho">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Alternar Mini Player</span>
          <span class="setting-desc">Exibe ou oculta a janela compacta flutuante.</span>
        </div>
        <div class="shortcut-recorder-wrap">
          <div class="shortcut-badge" data-action="toggleMiniPlayer">...</div>
          <button class="btn-clear-shortcut" data-action="toggleMiniPlayer" title="Limpar atalho">
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
        <button id="btn-reset-shortcuts" class="pill-btn">
          Restaurar Atalhos Padrão
        </button>
      </div>
    </div>

    <!-- Aba Aparência & Temas -->
    <div class="tab-pane" id="tab-appearance">
      <div class="tab-header">
        <div class="tab-title">Aparência & Temas</div>
        <div class="tab-subtitle">Personalize as cores e o acabamento visual do YouTube Music</div>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Tema da Interface</span>
          <span class="setting-desc">Escolha entre o estilo escuro original ou o tema Preto Puro (OLED / AMOLED).</span>
        </div>
        <select id="sel-theme" class="setting-select">
          <option value="default">Padrão (YouTube Music Dark)</option>
          <option value="oled">Preto Puro (OLED / AMOLED)</option>
        </select>
      </div>
    </div>

    <!-- Aba Recursos & Integrações -->
    <div class="tab-pane" id="tab-integrations">
      <div class="tab-header">
        <div class="tab-title">Recursos & Integrações</div>
        <div class="tab-subtitle">Conexão com o Discord e notificações nativas do sistema</div>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Discord Rich Presence</span>
          <span class="setting-desc">Exibe o título da música, artista, capa do álbum e barra de progresso no seu status do Discord.</span>
        </div>
        <label class="switch">
          <input type="checkbox" id="chk-discord-presence">
          <span class="slider"></span>
        </label>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Notificações Nativas do Windows</span>
          <span class="setting-desc">Exibe um aviso discreto no canto da tela com a capa e o título sempre que uma nova música começar.</span>
        </div>
        <label class="switch">
          <input type="checkbox" id="chk-track-notifications">
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Aba Mini Player -->
    <div class="tab-pane" id="tab-miniplayer">
      <div class="tab-header">
        <div class="tab-title">Mini Player Flutuante</div>
        <div class="tab-subtitle">Controles compactos de reprodução para multitarefas e jogos</div>
      </div>

      <div class="setting-card" style="border-color: rgba(255, 0, 0, 0.3); background: rgba(255, 0, 0, 0.04);">
        <div class="setting-info">
          <span class="setting-label">Habilitar Mini Player</span>
          <span class="setting-desc">Ativa ou desativa a janela flutuante e seu atalho global.</span>
        </div>
        <label class="switch">
          <input type="checkbox" id="chk-miniplayer-enabled">
          <span class="slider"></span>
        </label>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Abrir Mini Player ao Iniciar</span>
          <span class="setting-desc">Inicia o aplicativo exibindo diretamente a janela compacta do Mini Player.</span>
        </div>
        <label class="switch">
          <input type="checkbox" id="chk-miniplayer-start">
          <span class="slider"></span>
        </label>
      </div>

      <div class="setting-card">
        <div class="setting-info">
          <span class="setting-label">Mini Player Sempre no Topo</span>
          <span class="setting-desc">Fixa a mini-janela por cima de outros jogos e janelas de trabalho.</span>
        </div>
        <label class="switch">
          <input type="checkbox" id="chk-miniplayer-top">
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Aba Sobre & Atualizações -->
    <div class="tab-pane" id="tab-about">
      <div class="tab-header">
        <div class="tab-title">Sobre o YouTube Music</div>
        <div class="tab-subtitle">Informações de desenvolvimento e gerenciamento de versões</div>
      </div>

      <div class="about-card">
        <div class="about-logo">
          <svg width="56" height="56" viewBox="0 0 192 192" style="filter: drop-shadow(0 0 16px rgba(255, 0, 0, 0.45));">
            <g>
              <circle fill="#FF0000" cx="96" cy="96" r="88"/>
              <path fill="#FFFFFF" d="M96,54.04c23.14,0,41.96,18.82,41.96,41.96S119.14,137.96,96,137.96S54.04,119.14,54.04,96S72.86,54.04,96,54.04 M96,50c-25.41,0-46,20.59-46,46s20.59,46,46,46s46-20.59,46-46S121.41,50,96,50L96,50z"/>
              <polygon fill="#FFFFFF" points="80,119 119,95 80,73"/>
            </g>
          </svg>
        </div>
        <div class="about-title">YouTube Music Desktop</div>
        <span class="about-version">Versão 1.1.0</span>
        <div class="about-author">
          Desenvolvido com excelência por <a id="link-author" href="#">AllvesMatteus</a>
        </div>
        <p style="font-size: 11px; color: var(--text-secondary); max-width: 460px; line-height: 1.5; margin-top: 4px;">
          Cliente desktop otimizado para Windows com arquitetura modular, bloqueador de anúncios nativo, controles rápidos, Discord Rich Presence e temas visuais.
        </p>

        <div class="about-links">
          <a id="link-repo" class="link-badge" href="#">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            GitHub Oficial
          </a>
          <a id="link-issues" class="link-badge" href="#">
            Reportar Problema
          </a>
        </div>
      </div>

      <div class="setting-card" style="flex-direction: column; align-items: flex-start; gap: 12px;">
        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
          <div>
            <span class="setting-label">Status da Versão</span>
            <div id="update-status-desc" class="setting-desc" style="margin-top: 2px;">Pronto para verificar atualizações.</div>
          </div>
          <span id="update-badge" class="status-badge badge-info">v1.1.0</span>
        </div>

        <div style="display:flex; gap:10px; align-items:center; width:100%;">
          <button id="btn-check-updates" class="pill-btn pill-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
            Verificar Atualizações Agora
          </button>
          <button id="btn-install-update" class="pill-btn pill-primary" style="display: none; background: #2ba640; border-color: #2ba640;">
            Reiniciar e Instalar Atualização
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const { ipcRenderer, shell } = require('electron');

    // Navegação por Abas
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        item.classList.add('active');
        const tabId = item.dataset.tab;
        const target = document.getElementById(tabId);
        if (target) target.classList.add('active');
      });
    });

    // Links Externos
    document.getElementById('link-author').addEventListener('click', (e) => {
      e.preventDefault();
      shell.openExternal('https://github.com/AllvesMatteus/AllvesMatteus');
    });
    document.getElementById('link-repo').addEventListener('click', (e) => {
      e.preventDefault();
      shell.openExternal('https://github.com/AllvesMatteus/youtube-music');
    });
    document.getElementById('link-issues').addEventListener('click', (e) => {
      e.preventDefault();
      shell.openExternal('https://github.com/AllvesMatteus/youtube-music/issues');
    });

    // Botão Diagnóstico
    const btnOpenDiag = document.getElementById('btn-open-diagnostic');
    if (btnOpenDiag) {
      btnOpenDiag.addEventListener('click', () => {
        ipcRenderer.invoke('diagnostic:open-window');
      });
    }

    // Carregar e Salvar Configurações
    async function loadSettings() {
      const settings = await ipcRenderer.invoke('get-app-settings');

      document.getElementById('chk-start-windows').checked = Boolean(settings.startWithWindows);
      document.getElementById('sel-close-behavior').value = settings.closeBehavior || 'tray';
      document.getElementById('chk-hardware-accel').checked = settings.hardwareAcceleration !== false;
      document.getElementById('chk-always-on-top').checked = Boolean(settings.alwaysOnTop);
      document.getElementById('chk-autoupdate').checked = settings.autoUpdateEnabled !== false;

      document.getElementById('sel-theme').value = settings.theme || 'default';
      document.getElementById('chk-discord-presence').checked = settings.discordPresence !== false;
      document.getElementById('chk-track-notifications').checked = settings.trackNotifications !== false;

      document.getElementById('chk-miniplayer-enabled').checked = settings.miniPlayerEnabled !== false;
      document.getElementById('chk-miniplayer-start').checked = Boolean(settings.openMiniPlayerOnStart);
      document.getElementById('chk-miniplayer-top').checked = Boolean(settings.alwaysOnTop);

      loadShortcuts();
    }

    function setupChangeListeners() {
      const bind = (id, key, isCheckbox = true) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', async () => {
          const val = isCheckbox ? el.checked : el.value;
          await ipcRenderer.invoke('set-app-setting', { key, value: val });
        });
      };

      bind('chk-start-windows', 'startWithWindows');
      bind('sel-close-behavior', 'closeBehavior', false);
      bind('chk-hardware-accel', 'hardwareAcceleration');
      bind('chk-always-on-top', 'alwaysOnTop');
      bind('chk-autoupdate', 'autoUpdateEnabled');

      bind('chk-discord-presence', 'discordPresence');
      bind('chk-track-notifications', 'trackNotifications');

      bind('chk-miniplayer-enabled', 'miniPlayerEnabled');
      bind('chk-miniplayer-start', 'openMiniPlayerOnStart');
      bind('chk-miniplayer-top', 'alwaysOnTop');

      document.getElementById('sel-theme').addEventListener('change', async (e) => {
        await ipcRenderer.invoke('theme:set', { theme: e.target.value });
      });

      ipcRenderer.on('app-setting-changed', (event, { key, value }) => {
        if (key === 'startWithWindows') {
          const el = document.getElementById('chk-start-windows');
          if (el) el.checked = Boolean(value);
        } else if (key === 'closeBehavior') {
          const el = document.getElementById('sel-close-behavior');
          if (el) el.value = value;
        } else if (key === 'alwaysOnTop') {
          const el1 = document.getElementById('chk-always-on-top');
          const el2 = document.getElementById('chk-miniplayer-top');
          if (el1) el1.checked = Boolean(value);
          if (el2) el2.checked = Boolean(value);
        } else if (key === 'miniPlayerEnabled') {
          const el = document.getElementById('chk-miniplayer-enabled');
          if (el) el.checked = Boolean(value);
        } else if (key === 'theme') {
          const el = document.getElementById('sel-theme');
          if (el) el.value = value;
        }
      });
    }

    // ── Gerenciador de Teclas de Atalho ──────────────────────────────
    let activeRecordingAction = null;

    function formatAcceleratorToHtml(accelerator) {
      if (!accelerator || accelerator.trim() === '') {
        return '<span style="color:#777; font-style:italic;">Nenhum</span>';
      }
      const parts = accelerator.split('+');
      return parts.map(p => {
        let label = p;
        if (label === 'MediaPlayPause') label = 'Play/Pause';
        if (label === 'MediaNextTrack') label = 'Próxima';
        if (label === 'MediaPreviousTrack') label = 'Anterior';
        if (label === 'MediaStop') label = 'Parar';
        if (label === 'Space') label = 'Espaço';
        return '<span class="kbd">' + label + '</span>';
      }).join(' + ');
    }

    async function loadShortcuts() {
      const shortcuts = await ipcRenderer.invoke('shortcuts:get');
      renderShortcuts(shortcuts);
    }

    function renderShortcuts(shortcuts) {
      document.querySelectorAll('.shortcut-badge').forEach(badge => {
        const action = badge.dataset.action;
        const accel = shortcuts[action] || '';
        badge.innerHTML = formatAcceleratorToHtml(accel);
        badge.classList.remove('recording');
      });
    }

    // Clique para gravar atalho
    document.querySelectorAll('.shortcut-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = badge.dataset.action;

        if (activeRecordingAction === action) {
          activeRecordingAction = null;
          loadShortcuts();
          return;
        }

        document.querySelectorAll('.shortcut-badge').forEach(b => b.classList.remove('recording'));
        activeRecordingAction = action;
        badge.classList.add('recording');
        badge.innerHTML = '<span style="color:#ff6b6b; font-weight:600;">Pressione as teclas...</span>';
      });
    });

    // Clique no botão limpar (✕)
    document.querySelectorAll('.btn-clear-shortcut').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        const updated = await ipcRenderer.invoke('shortcuts:set', { action, accelerator: '' });
        renderShortcuts(updated);
      });
    });

    // Captura global de teclas durante a gravação
    window.addEventListener('keydown', async (e) => {
      if (!activeRecordingAction) return;

      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        activeRecordingAction = null;
        loadShortcuts();
        return;
      }

      // Ignora pressionamento isolado de modificadores
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        return;
      }

      const modifiers = [];
      if (e.ctrlKey) modifiers.push('Ctrl');
      if (e.altKey) modifiers.push('Alt');
      if (e.shiftKey) modifiers.push('Shift');
      if (e.metaKey) modifiers.push('Super');

      let keyName = e.key;

      if (e.code === 'Space') keyName = 'Space';
      else if (e.code === 'ArrowUp') keyName = 'Up';
      else if (e.code === 'ArrowDown') keyName = 'Down';
      else if (e.code === 'ArrowLeft') keyName = 'Left';
      else if (e.code === 'ArrowRight') keyName = 'Right';
      else if (e.code === 'MediaPlayPause' || e.key === 'MediaPlayPause') keyName = 'MediaPlayPause';
      else if (e.code === 'MediaTrackNext' || e.key === 'MediaNextTrack') keyName = 'MediaNextTrack';
      else if (e.code === 'MediaTrackPrevious' || e.key === 'MediaPreviousTrack') keyName = 'MediaPreviousTrack';
      else if (e.code === 'MediaStop' || e.key === 'MediaStop') keyName = 'MediaStop';
      else if (e.code.startsWith('Key')) keyName = e.code.replace('Key', '');
      else if (e.code.startsWith('Digit')) keyName = e.code.replace('Digit', '');
      else if (e.key.length === 1) keyName = e.key.toUpperCase();

      const accelerator = [...modifiers, keyName].join('+');
      const action = activeRecordingAction;
      activeRecordingAction = null;

      const updated = await ipcRenderer.invoke('shortcuts:set', { action, accelerator });
      renderShortcuts(updated);
    });

    // Resetar padrões
    document.getElementById('btn-reset-shortcuts').addEventListener('click', async () => {
      const reset = await ipcRenderer.invoke('shortcuts:reset');
      renderShortcuts(reset);
    });

    // ── Gerenciador de Atualizações ──────────────────────────────────
    const btnCheckUpdates = document.getElementById('btn-check-updates');
    const btnInstallUpdate = document.getElementById('btn-install-update');
    const updateDesc = document.getElementById('update-status-desc');
    const updateBadge = document.getElementById('update-badge');

    btnCheckUpdates.addEventListener('click', async () => {
      btnCheckUpdates.disabled = true;
      btnCheckUpdates.style.opacity = '0.6';
      updateDesc.textContent = 'Verificando atualizações no GitHub...';

      try {
        const res = await ipcRenderer.invoke('update:check');
        if (res && res.status === 'dev-mode') {
          updateDesc.textContent = 'Ambiente de desenvolvimento (builds de teste não consultam releases).';
          updateBadge.className = 'status-badge badge-info';
          updateBadge.textContent = 'Modo Dev';
        }
      } catch (err) {
        updateDesc.textContent = 'Erro ao verificar: ' + err.message;
        updateBadge.className = 'status-badge badge-error';
        updateBadge.textContent = 'Falha';
      } finally {
        btnCheckUpdates.disabled = false;
        btnCheckUpdates.style.opacity = '1';
        setTimeout(pollUpdateStatus, 1000);
      }
    });

    btnInstallUpdate.addEventListener('click', () => {
      ipcRenderer.invoke('update:install-now');
    });

    async function pollUpdateStatus() {
      try {
        const info = await ipcRenderer.invoke('update:get-status');
        if (info) {
          if (info.status === 'checking') {
            updateDesc.textContent = 'Verificando novidades no repositório...';
          } else if (info.status === 'available') {
            updateDesc.textContent = 'Nova versão v' + (info.updateVersion || '') + ' disponível! Baixando...';
            updateBadge.className = 'status-badge badge-info';
            updateBadge.textContent = 'Baixando...';
          } else if (info.status === 'downloaded') {
            updateDesc.textContent = 'Versão v' + (info.updateVersion || '') + ' pronta para instalação!';
            updateBadge.className = 'status-badge badge-success';
            updateBadge.textContent = 'Pronto!';
            btnInstallUpdate.style.display = 'inline-flex';
          } else if (info.status === 'not-available') {
            updateDesc.textContent = 'Você já está utilizando a versão mais recente (v' + info.currentVersion + ').';
            updateBadge.className = 'status-badge badge-success';
            updateBadge.textContent = 'Atualizado';
          } else if (info.status === 'error') {
            updateDesc.textContent = 'Não foi possível verificar: ' + (info.errorMessage || 'Sem conexão.');
            updateBadge.className = 'status-badge badge-error';
            updateBadge.textContent = 'Erro';
          }
        }
      } catch (err) {}
    }

    loadSettings();
    setupChangeListeners();
    pollUpdateStatus();
  </script>
</body>
</html>
  `;

  settingsWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
  return settingsWin;
}

module.exports = { createSettingsWindow };
