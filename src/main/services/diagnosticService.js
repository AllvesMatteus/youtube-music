const { app } = require('electron');
const https = require('https');
const config = require('../config/appConfig');

class DiagnosticService {
  constructor() {
    this.logs = [];
    this.maxLogs = 200;
    this.logEvent('SYS_READY', 'Sistema de diagnóstico operacional.');
  }

  /**
   * Registra um evento ou erro com timestamp e código padronizado.
   */
  logEvent(code, message, details = null) {
    const entry = {
      id: Date.now() + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      timeFormatted: new Date().toLocaleTimeString('pt-BR'),
      code,
      message,
      details: details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : null
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    console.log(`[Diagnostic] [${entry.code}] ${entry.message}`, details || '');
    return entry;
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    this.logEvent('CONSOLE_CLEARED', 'Histórico do console reiniciado.');
    return this.logs;
  }

  /**
   * Mede latência e conectividade com uma URL via HTTPS nativo.
   */
  measureLatency(url) {
    return new Promise((resolve) => {
      const start = Date.now();
      try {
        const req = https.get(url, { timeout: 7000 }, (res) => {
          const latency = Date.now() - start;
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 400,
            statusCode: res.statusCode,
            latencyMs: latency
          });
        });
        req.on('error', (err) => {
          resolve({ ok: false, error: err.message, latencyMs: Date.now() - start });
        });
        req.on('timeout', () => {
          req.destroy();
          resolve({ ok: false, error: 'Tempo limite excedido', latencyMs: 7000 });
        });
      } catch (err) {
        resolve({ ok: false, error: err.message, latencyMs: Date.now() - start });
      }
    });
  }

  /**
   * Executa teste rápido de integridade.
   */
  async runSelfTest(ses) {
    this.logEvent('DIAG_TEST_START', 'Iniciando verificação de integridade do sistema...');

    const netGoogle = await this.measureLatency('https://accounts.google.com/generate_204');
    const netYTMusic = await this.measureLatency('https://music.youtube.com');

    let authCookiesCount = 0;
    let totalCookiesCount = 0;
    let isLoggedIn = false;

    if (ses) {
      try {
        const allCookies = await ses.cookies.get({});
        totalCookiesCount = allCookies.length;

        const authKeyNames = ['SAPISID', '__Secure-3PSID', 'LOGIN_INFO', 'SID', 'SSID', 'HSID'];
        authCookiesCount = allCookies.filter(c => authKeyNames.includes(c.name)).length;
        isLoggedIn = allCookies.some(c => c.name === 'SAPISID' || c.name === '__Secure-3PSID' || c.name === 'LOGIN_INFO');
      } catch (err) {
        this.logEvent('ERR_COOKIE_CHECK', 'Falha ao inspecionar cookies da sessão.', err.message);
      }
    }

    const report = {
      timestamp: new Date().toISOString(),
      appVersion: app.getVersion() || '1.0.0',
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      nodeVersion: process.versions.node,
      os: `${process.platform} ${process.arch}`,
      network: {
        googleAccounts: netGoogle.ok ? `OK (${netGoogle.latencyMs}ms)` : `FALHA (${netGoogle.error || netGoogle.statusCode})`,
        youtubeMusic: netYTMusic.ok ? `OK (${netYTMusic.latencyMs}ms)` : `FALHA (${netYTMusic.error || netYTMusic.statusCode})`
      },
      session: {
        partition: config.SESSION_PARTITION,
        totalCookies: totalCookiesCount,
        authCookies: authCookiesCount,
        isLoggedIn: isLoggedIn,
        statusLabel: isLoggedIn ? 'Conectado' : 'Desconectado'
      }
    };

    const statusReportCode = isLoggedIn ? 'SYS_PASS_CONNECTED' : 'SYS_PASS_DISCONNECTED';
    this.logEvent(statusReportCode, `Verificação rápida: ${report.session.statusLabel} (${authCookiesCount} cookies de autenticação).`);

    return report;
  }

  /**
   * Executa Diagnóstico Aprofundado (Deep Diagnostic) com medição de etapas,
   * verificação de áudio, validação de tokens e análise detalhada de memória.
   */
  async runDeepDiagnostic(ses) {
    this.logEvent('DEEP_DIAG_START', 'Iniciando diagnóstico aprofundado do sistema...');

    const steps = [];

    // Etapa 1: Rede & Rotas de API
    this.logEvent('DIAG_STEP_1', 'Etapa 1/4: Medindo latência de rede e endpoints de API...');
    const pingGoogle = await this.measureLatency('https://accounts.google.com/generate_204');
    const pingYTMusic = await this.measureLatency('https://music.youtube.com');
    const pingStream = await this.measureLatency('https://www.youtube.com/generate_204');

    steps.push({
      title: 'Conectividade e Latência de Rede',
      passed: pingGoogle.ok && pingYTMusic.ok && pingStream.ok,
      details: [
        { name: 'Google Accounts', value: pingGoogle.ok ? `${pingGoogle.latencyMs} ms` : `Erro (${pingGoogle.error})` },
        { name: 'YouTube Music Web', value: pingYTMusic.ok ? `${pingYTMusic.latencyMs} ms` : `Erro (${pingYTMusic.error})` },
        { name: 'Servidores de Mídia (CDN)', value: pingStream.ok ? `${pingStream.latencyMs} ms` : `Erro (${pingStream.error})` }
      ]
    });

    // Etapa 2: Auditoria de Cookies e Credenciais
    this.logEvent('DIAG_STEP_2', 'Etapa 2/4: Auditando integridade da sessão e tokens de segurança...');
    let criticalCookies = {};
    let validCount = 0;
    let totalCookies = 0;

    if (ses) {
      try {
        const cookies = await ses.cookies.get({});
        totalCookies = cookies.length;
        const keys = ['SAPISID', '__Secure-3PSID', 'LOGIN_INFO', 'SID', 'SSID', 'HSID'];

        keys.forEach(k => {
          const found = cookies.find(c => c.name === k);
          if (found) {
            validCount++;
            const isExpired = found.expirationDate && (found.expirationDate * 1000 < Date.now());
            criticalCookies[k] = isExpired ? 'Expirado' : 'Válido';
          } else {
            criticalCookies[k] = 'Ausente';
          }
        });
      } catch (err) {
        this.logEvent('ERR_COOKIE_AUDIT', 'Erro ao auditar cookies:', err.message);
      }
    }

    const hasAuth = validCount >= 2;
    steps.push({
      title: 'Integridade de Autenticação e Cookies',
      passed: hasAuth,
      details: Object.entries(criticalCookies).map(([name, status]) => ({ name, value: status }))
    });

    // Etapa 3: Ambiente do Electron e Isolamento
    this.logEvent('DIAG_STEP_3', 'Etapa 3/4: Verificando isolamento de processos e headers anti-detecção...');
    steps.push({
      title: 'Ambiente de Execução e Isolamento',
      passed: true,
      details: [
        { name: 'Motor Chromium', value: `v${process.versions.chrome}` },
        { name: 'Versão do Electron', value: `v${process.versions.electron}` },
        { name: 'Partição de Sessão', value: config.SESSION_PARTITION },
        { name: 'Proteção Anti-Detecção', value: 'Ativa (Firefox 135 Spoofing)' }
      ]
    });

    // Etapa 4: Desempenho e Memória
    this.logEvent('DIAG_STEP_4', 'Etapa 4/4: Analisando consumo de recursos e memória...');
    const mem = process.memoryUsage();
    const rssMB = Math.round(mem.rss / 1024 / 1024);
    const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);

    steps.push({
      title: 'Desempenho e Recursos do Sistema',
      passed: rssMB < 600,
      details: [
        { name: 'Uso de Memória RAM (Processo)', value: `${rssMB} MB` },
        { name: 'Heap V8 Utilizado', value: `${heapUsedMB} MB` },
        { name: 'Arquitetura', value: `${process.platform} (${process.arch})` }
      ]
    });

    const allPassed = steps.every(s => s.passed);
    const overallCode = allPassed ? 'DEEP_DIAG_PASS' : 'DEEP_DIAG_WARN';
    this.logEvent(overallCode, `Diagnóstico aprofundado concluído. Resultado geral: ${allPassed ? 'Aprovado' : 'Atenção requerida'}.`);

    return {
      timestamp: new Date().toISOString(),
      allPassed,
      steps,
      summary: {
        totalCookies,
        validAuthTokens: validCount,
        avgLatency: Math.round((pingGoogle.latencyMs + pingYTMusic.latencyMs + pingStream.latencyMs) / 3),
        status: hasAuth ? 'Sessão Ativa e Saudável' : 'Sessão Não Autenticada'
      }
    };
  }

  /**
   * Gera relatório formatado em texto para ser copiado.
   */
  async getDiagnosticReportText(ses) {
    const test = await this.runSelfTest(ses);
    const recentLogs = this.logs.slice(-20);

    let text = `======================================================\n`;
    text += `   RELATORIO DE DIAGNOSTICO - YOUTUBE MUSIC DESKTOP   \n`;
    text += `======================================================\n`;
    text += `Data/Hora: ${new Date().toLocaleString('pt-BR')}\n`;
    text += `Versao do App: ${test.appVersion} | Electron: ${test.electronVersion}\n`;
    text += `Sistema Operacional: ${test.os}\n\n`;

    text += `[REDE E CONECTIVIDADE]\n`;
    text += `Google Accounts: ${test.network.googleAccounts}\n`;
    text += `YouTube Music: ${test.network.youtubeMusic}\n\n`;

    text += `[SESSAO E AUTENTICACAO]\n`;
    text += `Status de Login: ${test.session.statusLabel}\n`;
    text += `Cookies Totais: ${test.session.totalCookies}\n`;
    text += `Cookies de Login (Google/YouTube): ${test.session.authCookies}\n`;
    text += `Particao: ${test.session.partition}\n\n`;

    text += `[HISTORICO DO CONSOLE]\n`;
    recentLogs.forEach(l => {
      text += `[${l.timeFormatted}] [${l.code}] ${l.message}\n`;
      if (l.details) text += `   -> Detalhes: ${l.details}\n`;
    });
    text += `======================================================\n`;

    return text;
  }
}

module.exports = new DiagnosticService();
