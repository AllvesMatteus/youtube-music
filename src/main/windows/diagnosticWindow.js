const { BrowserWindow, clipboard } = require('electron');
const path = require('path');
const config = require('../config/appConfig');
const diagnosticService = require('../services/diagnosticService');

let diagnosticWin = null;

function createDiagnosticWindow(parentWindow, ses, onOpenLogin, onPerformLogout) {
  if (diagnosticWin && !diagnosticWin.isDestroyed()) {
    diagnosticWin.show();
    diagnosticWin.focus();
    return diagnosticWin;
  }

  const iconPath = path.join(config.PATHS.ASSETS, 'icon.png');

  diagnosticWin = new BrowserWindow({
    width: 820,
    height: 760,
    minWidth: 720,
    minHeight: 580,
    center: true,
    title: 'YouTube Music — Diagnóstico do Sistema',
    icon: iconPath,
    backgroundColor: '#030303',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      sandbox: false
    }
  });

  diagnosticWin.on('closed', () => {
    diagnosticWin = null;
  });

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>YouTube Music — Diagnóstico do Sistema</title>
  <style>
    :root {
      --bg-base: #030303;
      --bg-surface: #121212;
      --bg-surface-elevated: #181818;
      --bg-surface-hover: #202020;
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-hover: rgba(255, 255, 255, 0.18);
      --yt-red: #ff0000;
      --yt-red-hover: #d90000;
      --text-primary: #f1f1f1;
      --text-secondary: #aaaaaa;
      --text-muted: #717171;
      --pill-bg: rgba(255, 255, 255, 0.08);
      --pill-bg-hover: rgba(255, 255, 255, 0.16);
      --green-glow: #2ba640;
      --red-glow: #ff4444;
      --amber-glow: #f59e0b;
      --blue-accent: #3ea6ff;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #030303; }
    ::-webkit-scrollbar-thumb { background: #272727; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #3f3f3f; }

    body {
      background: var(--bg-base);
      color: var(--text-primary);
      font-family: 'YouTube Sans', Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 18px 22px;
      font-size: 13px;
      user-select: none;
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    /* Cabeçalho Oficial YouTube Music */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 16px;
      flex-shrink: 0;
    }
    .brand-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ytm-emblem {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .ytm-titles {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .brand-name {
      font-size: 17px;
      font-weight: 700;
      color: #fff;
      letter-spacing: -0.4px;
    }
    .brand-name span {
      font-weight: 400;
      color: #fff;
    }
    .header-sep {
      color: var(--text-muted);
      font-size: 14px;
      font-weight: 300;
    }
    .brand-sub {
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 400;
    }

    /* Barra de Legenda de Atalhos */
    .shortcuts-legend {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .kbd-chip {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 11px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 5px;
      transition: border-color 0.2s;
    }
    .kbd-chip kbd {
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 3px;
      padding: 1px 4px;
      font-size: 10px;
      font-family: monospace;
      font-weight: 700;
      color: #fff;
    }
    .kbd-chip.kbd-highlight {
      border-color: rgba(255, 255, 255, 0.25);
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }

    /* Cards de Métricas */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
      flex-shrink: 0;
    }
    .card {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: background 0.2s, border-color 0.2s;
    }
    .card:hover {
      background: var(--bg-surface-elevated);
      border-color: var(--border-hover);
    }
    .card-title {
      font-size: 10px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .card-val {
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .card-sub {
      font-size: 10px;
      color: var(--text-secondary);
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .pulse-green { background: var(--green-glow); box-shadow: 0 0 7px rgba(43, 166, 64, 0.6); }
    .pulse-red { background: var(--red-glow); box-shadow: 0 0 7px rgba(255, 68, 68, 0.6); }
    .pulse-yellow { background: var(--amber-glow); box-shadow: 0 0 7px rgba(245, 158, 11, 0.6); }

    /* Barra de Ações - YouTube Music Pill Buttons */
    .actions-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
      flex-wrap: wrap;
      align-items: center;
      flex-shrink: 0;
    }
    .pill-btn {
      padding: 7px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      transition: background 0.15s, transform 0.1s, border-color 0.15s;
      border: 1px solid var(--border-subtle);
      background: var(--pill-bg);
      color: var(--text-primary);
      outline: none;
      font-family: inherit;
    }
    .pill-btn svg {
      width: 14px;
      height: 14px;
      fill: currentColor;
      flex-shrink: 0;
    }
    .pill-btn:hover {
      background: var(--pill-bg-hover);
      border-color: var(--border-hover);
    }
    .pill-btn:active {
      transform: scale(0.97);
    }
    .pill-btn .kbd {
      font-size: 9px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 1px 5px;
      border-radius: 3px;
      color: #bbb;
      font-weight: 700;
      font-family: monospace;
    }

    /* Botão Atualizar (F5) destacado */
    .pill-refresh {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.22);
      color: #fff;
      font-weight: 600;
    }
    .pill-refresh:hover {
      background: rgba(255, 255, 255, 0.22);
      border-color: rgba(255, 255, 255, 0.35);
    }

    /* Botão Diagnóstico Aprofundado (F1) estilo YTM Red */
    .pill-primary {
      background: var(--yt-red);
      border-color: var(--yt-red);
      color: #fff;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(255, 0, 0, 0.25);
    }
    .pill-primary:hover {
      background: var(--yt-red-hover);
      border-color: var(--yt-red-hover);
    }
    .pill-primary .kbd {
      background: rgba(0, 0, 0, 0.45);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.25);
    }

    /* Botão Desconectar Sessão */
    .pill-danger {
      background: rgba(255, 59, 48, 0.08);
      border-color: rgba(255, 59, 48, 0.22);
      color: #ff6b6b;
    }
    .pill-danger:hover {
      background: rgba(255, 59, 48, 0.18);
      border-color: rgba(255, 59, 48, 0.38);
    }

    /* Animação do ícone de recarregar */
    .spinning {
      animation: spin 0.7s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .toast-copy {
      color: var(--green-glow);
      font-size: 11px;
      font-weight: 500;
      display: none;
      margin-left: 4px;
    }

    /* Painel Aprofundado */
    .deep-panel {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 14px;
      display: none;
      flex-shrink: 0;
    }
    .deep-panel.active {
      display: block;
    }
    .deep-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .deep-title {
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .deep-badge {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 700;
    }
    .badge-ok { background: rgba(43, 166, 64, 0.15); color: var(--green-glow); border: 1px solid rgba(43, 166, 64, 0.3); }
    .badge-warn { background: rgba(245, 158, 11, 0.15); color: var(--amber-glow); border: 1px solid rgba(245, 158, 11, 0.3); }
    .deep-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    .step-box {
      background: var(--bg-surface-elevated);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      padding: 8px 12px;
    }
    .step-box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-weight: 600;
      color: #ddd;
      margin-bottom: 4px;
    }
    .step-row {
      font-size: 10px;
      color: #888;
      display: flex;
      justify-content: space-between;
      padding: 1px 0;
      font-family: monospace;
    }

    /* Terminal de Logs & Operações */
    .terminal-container {
      background: #080808;
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .terminal-header {
      background: #111111;
      border-bottom: 1px solid var(--border-subtle);
      padding: 8px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .terminal-title {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    .terminal-tools {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .scroll-status {
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: background 0.15s;
    }
    .scroll-status.active {
      color: var(--green-glow);
      background: rgba(43, 166, 64, 0.1);
      border: 1px solid rgba(43, 166, 64, 0.25);
    }
    .scroll-status.paused {
      color: var(--amber-glow);
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.25);
    }
    .btn-scroll-bottom {
      display: none;
      align-items: center;
      gap: 4px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border-subtle);
      color: #fff;
      font-size: 10px;
      padding: 2px 8px;
      border-radius: 12px;
      cursor: pointer;
    }
    .btn-scroll-bottom:hover {
      background: rgba(255, 255, 255, 0.16);
    }
    .btn-clear {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: inherit;
    }
    .btn-clear:hover {
      color: #fff;
      background: #1f1f1f;
    }

    .terminal-content {
      flex: 1;
      overflow-y: auto;
      padding: 10px 14px;
      font-family: Consolas, "JetBrains Mono", Menlo, Courier, monospace;
      font-size: 11px;
      line-height: 1.5;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .log-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      word-break: break-all;
    }
    .log-time { color: #555; flex-shrink: 0; }
    .log-code { font-weight: 700; flex-shrink: 0; }
    .log-code.info { color: var(--blue-accent); }
    .log-code.success { color: var(--green-glow); }
    .log-code.warn { color: var(--amber-glow); }
    .log-code.error { color: var(--red-glow); }
    .log-msg { color: #ccc; }
    .log-extra { color: #666; font-size: 10px; margin-left: 20px; }
  </style>
</head>
<body>
  <!-- Cabeçalho Oficial YouTube Music -->
  <div class="header">
    <div class="brand-container">
      <div class="ytm-emblem" title="YouTube Music">
        <svg width="30" height="30" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="#FF0000"/>
          <circle cx="12" cy="12" r="7" fill="none" stroke="#FFFFFF" stroke-width="1.6"/>
          <polygon points="10.5,9.2 15,12 10.5,14.8" fill="#FFFFFF"/>
        </svg>
      </div>
      <div class="ytm-titles">
        <div class="brand-name">YouTube <span>Music</span></div>
        <span class="header-sep">|</span>
        <div class="brand-sub">Diagnóstico do Sistema & Operações</div>
      </div>
    </div>
    <div class="shortcuts-legend">
      <div class="kbd-chip" title="Executa verificação aprofundada em 4 etapas"><kbd>F1</kbd><span>Aprofundado</span></div>
      <div class="kbd-chip" title="Abre janela de login seguro Google"><kbd>F2</kbd><span>Login</span></div>
      <div class="kbd-chip" title="Alterna exibição do Mini Player"><kbd>F3</kbd><span>Mini Player</span></div>
      <div class="kbd-chip kbd-highlight" title="Atualiza o status do sistema e console"><kbd>F5</kbd><span>Atualizar</span></div>
      <div class="kbd-chip" title="Fecha a janela de diagnóstico"><kbd>Esc</kbd><span>Fechar</span></div>
    </div>
  </div>

  <!-- Cards de Métricas -->
  <div class="metrics-grid">
    <div class="card">
      <span class="card-title">Status da Sessão</span>
      <span class="card-val" id="val-auth"><span class="pulse-dot pulse-yellow"></span> Verificando</span>
      <span class="card-sub" id="sub-auth">Conta Google</span>
    </div>
    <div class="card">
      <span class="card-title">Conexão & Latência</span>
      <span class="card-val" id="val-net"><span class="pulse-dot pulse-yellow"></span> Testando</span>
      <span class="card-sub" id="sub-net">music.youtube.com</span>
    </div>
    <div class="card">
      <span class="card-title">Cookies de Sessão</span>
      <span class="card-val" id="val-cookies">--</span>
      <span class="card-sub">Tokens Google & YTM</span>
    </div>
    <div class="card">
      <span class="card-title">Versão do App</span>
      <span class="card-val" id="val-version">v1.0.0</span>
      <span class="card-sub">Electron / Chromium</span>
    </div>
  </div>

  <!-- Barra de Botões com Atalhos F1 a F5 -->
  <div class="actions-bar">
    <!-- Atualizar Status (F5) destacado conforme solicitação -->
    <button id="btn-refresh" class="pill-btn pill-refresh" title="Atualizar diagnóstico agora (F5)">
      <svg id="icon-refresh" viewBox="0 0 24 24">
        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
      </svg>
      Atualizar Status <span class="kbd">F5</span>
    </button>

    <!-- Diagnóstico Aprofundado (F1) -->
    <button id="btn-deep" class="pill-btn pill-primary" title="Executar diagnóstico aprofundado com auditoria de cookies e latência (F1)">
      <svg viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14.5l-4-4 1.41-1.41L12 14.67l6.59-6.59L20 9.5l-8 8z"/>
      </svg>
      Diagnóstico Aprofundado <span class="kbd">F1</span>
    </button>

    <!-- Login Seguro (F2) -->
    <button id="btn-login" class="pill-btn" title="Abrir janela de login seguro Google anti-detecção (F2)">
      <svg viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
      </svg>
      Login Seguro <span class="kbd">F2</span>
    </button>

    <!-- Mini Player (F3) -->
    <button id="btn-miniplayer" class="pill-btn" title="Alternar Mini Player flutuante (F3)">
      <svg viewBox="0 0 24 24">
        <path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/>
      </svg>
      Mini Player <span class="kbd">F3</span>
    </button>

    <!-- Desconectar Sessão -->
    <button id="btn-logout" class="pill-btn pill-danger" title="Limpar cookies, cache e desconectar conta">
      <svg viewBox="0 0 24 24">
        <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
      </svg>
      Desconectar Sessão
    </button>

    <!-- Copiar Relatório -->
    <button id="btn-copy" class="pill-btn" title="Copiar relatório completo para a área de transferência">
      <svg viewBox="0 0 24 24">
        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
      </svg>
      Copiar Relatório
    </button>
    <span id="copy-toast" class="toast-copy">Relatório copiado com sucesso!</span>
  </div>

  <!-- Painel do Diagnóstico Aprofundado -->
  <div id="deep-panel" class="deep-panel">
    <div class="deep-header">
      <span class="deep-title">Resultado da Auditoria Aprofundada</span>
      <span id="deep-badge" class="deep-badge badge-ok">Concluído</span>
    </div>
    <div class="deep-grid" id="deep-grid"></div>
  </div>

  <!-- Terminal de Logs & Operações -->
  <div class="terminal-container">
    <div class="terminal-header">
      <span class="terminal-title">Console de Logs & Operações</span>
      <div class="terminal-tools">
        <button id="btn-scroll-bottom" class="btn-scroll-bottom">↓ Rolar para o fim</button>
        <span id="scroll-pill" class="scroll-status active" title="Clique para pausar ou ativar auto-scroll">Auto-scroll Ativo</span>
        <button id="btn-clear" class="btn-clear">Limpar Console</button>
      </div>
    </div>
    <div class="terminal-content" id="terminal-content"></div>
  </div>

  <script>
    const { ipcRenderer, clipboard } = require('electron');

    const terminalEl = document.getElementById('terminal-content');
    const scrollPill = document.getElementById('scroll-pill');
    const btnScrollBottom = document.getElementById('btn-scroll-bottom');
    const iconRefresh = document.getElementById('icon-refresh');
    let autoScroll = true;

    function updateScrollUi() {
      const threshold = 35;
      const isAtBottom = (terminalEl.scrollHeight - terminalEl.scrollTop) <= (terminalEl.clientHeight + threshold);
      autoScroll = isAtBottom;

      if (autoScroll) {
        scrollPill.textContent = 'Auto-scroll Ativo';
        scrollPill.className = 'scroll-status active';
        btnScrollBottom.style.display = 'none';
      } else {
        scrollPill.textContent = 'Auto-scroll Pausado';
        scrollPill.className = 'scroll-status paused';
        btnScrollBottom.style.display = 'inline-flex';
      }
    }

    terminalEl.addEventListener('scroll', updateScrollUi);

    scrollPill.addEventListener('click', () => {
      autoScroll = !autoScroll;
      if (autoScroll) {
        terminalEl.scrollTop = terminalEl.scrollHeight;
      }
      updateScrollUi();
    });

    btnScrollBottom.addEventListener('click', () => {
      autoScroll = true;
      terminalEl.scrollTo({ top: terminalEl.scrollHeight, behavior: 'smooth' });
      setTimeout(updateScrollUi, 250);
    });

    function scrollToBottom() {
      if (autoScroll) {
        terminalEl.scrollTop = terminalEl.scrollHeight;
      }
    }

    async function loadLogs() {
      try {
        const logs = await ipcRenderer.invoke('diagnostic:get-logs');
        terminalEl.innerHTML = logs.map(l => {
          let codeCls = 'info';
          if (l.code.includes('ERR') || l.code.includes('FAIL')) codeCls = 'error';
          else if (l.code.includes('PASS') || l.code.includes('SUCCESS') || l.code.includes('CONNECTED')) codeCls = 'success';
          else if (l.code.includes('WARN')) codeCls = 'warn';

          const extra = l.details ? '<div class="log-extra">' + escapeHtml(l.details) + '</div>' : '';

          return '<div class="log-item">' +
            '<div class="log-row">' +
              '<span class="log-time">' + l.timeFormatted + '</span>' +
              '<span class="log-code ' + codeCls + '">[' + l.code + ']</span>' +
              '<span class="log-msg">' + escapeHtml(l.message) + '</span>' +
            '</div>' +
            extra +
          '</div>';
        }).join('');

        scrollToBottom();
      } catch (err) {
        console.error('Erro ao ler logs:', err);
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    async function refreshStatus() {
      if (iconRefresh) {
        iconRefresh.classList.remove('spinning');
        void iconRefresh.offsetWidth;
        iconRefresh.classList.add('spinning');
        setTimeout(() => iconRefresh.classList.remove('spinning'), 750);
      }

      try {
        const data = await ipcRenderer.invoke('diagnostic:run-test');

        const authEl = document.getElementById('val-auth');
        const authSub = document.getElementById('sub-auth');
        if (data.session.isLoggedIn) {
          authEl.innerHTML = '<span class="pulse-dot pulse-green"></span> Conectado (' + data.session.authCookies + ' cookies)';
          authSub.textContent = 'Conta ativa e sincronizada';
        } else {
          authEl.innerHTML = '<span class="pulse-dot pulse-red"></span> Desconectado';
          authSub.textContent = 'Use Login Seguro (F2)';
        }

        const netEl = document.getElementById('val-net');
        const netSub = document.getElementById('sub-net');
        const netOk = data.network.googleAccounts.includes('OK') && data.network.youtubeMusic.includes('OK');
        if (netOk) {
          netEl.innerHTML = '<span class="pulse-dot pulse-green"></span> Operacional';
          netSub.textContent = 'Google & YouTube Music OK';
        } else {
          netEl.innerHTML = '<span class="pulse-dot pulse-red"></span> Falha de Conexão';
          netSub.textContent = 'Verifique conexão com a internet';
        }

        document.getElementById('val-cookies').textContent = data.session.authCookies + ' auth / ' + data.session.totalCookies + ' total';
        document.getElementById('val-version').textContent = 'v' + data.appVersion;

        await loadLogs();
      } catch (err) {
        console.error('Erro ao atualizar status:', err);
      }
    }

    async function runDeepDiagnostic() {
      const btn = document.getElementById('btn-deep');
      const panel = document.getElementById('deep-panel');
      const grid = document.getElementById('deep-grid');
      const badge = document.getElementById('deep-badge');

      btn.disabled = true;
      btn.style.opacity = '0.6';
      panel.classList.add('active');

      grid.innerHTML = '<div style="grid-column: span 2; text-align:center; color:#888; padding: 12px;">Executando auditoria e medição de latência...</div>';
      await loadLogs();

      try {
        const res = await ipcRenderer.invoke('diagnostic:run-deep-test');
        badge.className = 'deep-badge ' + (res.allPassed ? 'badge-ok' : 'badge-warn');
        badge.textContent = res.allPassed ? 'Aprovado' : 'Atenção';

        grid.innerHTML = res.steps.map(s => {
          const rows = s.details.map(d =>
            '<div class="step-row"><span>' + escapeHtml(d.name) + '</span><span>' + escapeHtml(d.value) + '</span></div>'
          ).join('');

          return '<div class="step-box">' +
            '<div class="step-box-header">' +
              '<span>' + escapeHtml(s.title) + '</span>' +
              '<span class="deep-badge ' + (s.passed ? 'badge-ok' : 'badge-warn') + '">' + (s.passed ? 'OK' : 'Aviso') + '</span>' +
            '</div>' +
            rows +
          '</div>';
        }).join('');

        await refreshStatus();
      } catch (err) {
        grid.innerHTML = '<div style="color:#ff4e45; padding:8px;">Erro: ' + escapeHtml(err.message) + '</div>';
      } finally {
        btn.disabled = false;
        btn.style.opacity = '1';
      }
    }

    // Atalhos de Teclado no Diagnóstico (F1 a F5 e Esc)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        runDeepDiagnostic();
      } else if (e.key === 'F5') {
        e.preventDefault();
        refreshStatus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        ipcRenderer.invoke('open-login-window');
        setTimeout(refreshStatus, 1500);
      } else if (e.key === 'F3') {
        e.preventDefault();
        ipcRenderer.invoke('toggle-mini-player');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        window.close();
      }
    });

    document.getElementById('btn-refresh').addEventListener('click', refreshStatus);
    document.getElementById('btn-deep').addEventListener('click', runDeepDiagnostic);

    document.getElementById('btn-login').addEventListener('click', () => {
      ipcRenderer.invoke('open-login-window');
      setTimeout(refreshStatus, 1500);
    });

    document.getElementById('btn-miniplayer').addEventListener('click', () => {
      ipcRenderer.invoke('toggle-mini-player');
    });

    document.getElementById('btn-logout').addEventListener('click', async () => {
      await ipcRenderer.invoke('account:perform-logout');
      setTimeout(refreshStatus, 800);
    });

    document.getElementById('btn-clear').addEventListener('click', async () => {
      await ipcRenderer.invoke('diagnostic:clear-logs');
      await loadLogs();
    });

    document.getElementById('btn-copy').addEventListener('click', async () => {
      const text = await ipcRenderer.invoke('diagnostic:get-report-text');
      clipboard.writeText(text);
      const toast = document.getElementById('copy-toast');
      toast.style.display = 'inline';
      setTimeout(() => { toast.style.display = 'none'; }, 2800);
    });

    refreshStatus();
  </script>
</body>
</html>
  `;

  diagnosticWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
  return diagnosticWin;
}

module.exports = { createDiagnosticWindow };
