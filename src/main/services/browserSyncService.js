const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { DatabaseSync } = require('node:sqlite');

const ESSENTIAL_COOKIES = new Set([
  'LOGIN_INFO',
  'SAPISID',
  'APISID',
  '__Secure-1PAPISID',
  '__Secure-3PAPISID',
  'SID',
  '__Secure-1PSID',
  '__Secure-3PSID',
  'HSID',
  'SSID',
  '__Secure-1PSIDTS',
  '__Secure-3PSIDTS',
  'SIDCC',
  '__Secure-1PSIDCC',
  '__Secure-3PSIDCC',
  'PREF',
  'VISITOR_INFO1_LIVE',
  'VISITOR_PRIVACY_METADATA',
  'YSC'
]);

class BrowserSyncService {
  constructor() {
    this.watcherInterval = null;
    this.keepAliveInterval = null;
    this.cachedKeys = new Map();
  }

  /**
   * Procura bancos de dados Gecko (Zen, Firefox, Floorp, Waterfox).
   */
  getGeckoDatabases() {
    const list = [];
    const appData = process.env.APPDATA || '';
    const bases = [
      { name: 'Zen Browser', dir: path.join(appData, 'zen', 'Profiles') },
      { name: 'Mozilla Firefox', dir: path.join(appData, 'Mozilla', 'Firefox', 'Profiles') },
      { name: 'Floorp', dir: path.join(appData, 'Floorp', 'Profiles') },
      { name: 'Waterfox', dir: path.join(appData, 'Waterfox', 'Profiles') }
    ];

    for (const b of bases) {
      if (!fs.existsSync(b.dir)) continue;
      try {
        const entries = fs.readdirSync(b.dir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          const cookieDb = path.join(b.dir, entry.name, 'cookies.sqlite');
          if (fs.existsSync(cookieDb)) {
            list.push({ type: 'gecko', browser: b.name, profile: entry.name, path: cookieDb });
          }
        }
      } catch (_) {}
    }

    return list;
  }

  /**
   * Procura bancos de dados Chromium (Chrome, Edge, Brave, Opera, Vivaldi).
   */
  getChromiumDatabases() {
    const list = [];
    const localAppData = process.env.LOCALAPPDATA || '';
    const appData = process.env.APPDATA || '';

    const bases = [
      { name: 'Google Chrome', dir: path.join(localAppData, 'Google', 'Chrome', 'User Data') },
      { name: 'Microsoft Edge', dir: path.join(localAppData, 'Microsoft', 'Edge', 'User Data') },
      { name: 'Brave Browser', dir: path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data') },
      { name: 'Opera', dir: path.join(appData, 'Opera Software', 'Opera Stable'), singleProfile: true },
      { name: 'Opera GX', dir: path.join(appData, 'Opera Software', 'Opera GX Stable'), singleProfile: true },
      { name: 'Vivaldi', dir: path.join(localAppData, 'Vivaldi', 'User Data') }
    ];

    for (const b of bases) {
      if (!fs.existsSync(b.dir)) continue;
      const localState = path.join(b.dir, 'Local State');
      if (!fs.existsSync(localState)) continue;

      if (b.singleProfile) {
        const cookieDb = path.join(b.dir, 'Network', 'Cookies');
        if (fs.existsSync(cookieDb)) {
          list.push({ type: 'chromium', browser: b.name, profile: 'Default', path: cookieDb, localState });
        }
        continue;
      }

      try {
        const entries = fs.readdirSync(b.dir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          if (entry.name === 'Default' || entry.name.startsWith('Profile ')) {
            const cookieDb = path.join(b.dir, entry.name, 'Network', 'Cookies');
            if (fs.existsSync(cookieDb)) {
              list.push({ type: 'chromium', browser: b.name, profile: entry.name, path: cookieDb, localState });
            }
          }
        }
      } catch (_) {}
    }

    return list;
  }

  /**
   * Obtém a chave AES mestre do Chromium via DPAPI no Windows.
   */
  getChromiumKey(localStatePath) {
    if (this.cachedKeys.has(localStatePath)) {
      return this.cachedKeys.get(localStatePath);
    }
    if (!fs.existsSync(localStatePath)) return null;

    try {
      const raw = fs.readFileSync(localStatePath, 'utf8');
      const json = JSON.parse(raw);
      const encKeyB64 = json.os_crypt && json.os_crypt.encrypted_key;
      if (!encKeyB64) return null;

      const encKey = Buffer.from(encKeyB64, 'base64');
      const rawEncKey = encKey.subarray(5); // remove prefixo 'DPAPI'
      const b64 = rawEncKey.toString('base64');

      const psCmd = `Add-Type -AssemblyName System.Security; $b = [Convert]::FromBase64String('${b64}'); $k = [System.Security.Cryptography.ProtectedData]::Unprotect($b, $null, 'CurrentUser'); [Convert]::ToBase64String($k)`;
      const out = execSync(`powershell -NoProfile -Command "${psCmd}"`, { encoding: 'utf8', timeout: 4000 }).trim();
      const key = Buffer.from(out, 'base64');
      if (key && key.length === 32) {
        this.cachedKeys.set(localStatePath, key);
        return key;
      }
    } catch (_) {}

    return null;
  }

  /**
   * Descriptografa o valor do cookie do Chromium usando AES-256-GCM.
   */
  decryptChromiumValue(buffer, aesKey) {
    if (!buffer || buffer.length < 3 + 12 + 16) return null;
    const prefix = buffer.subarray(0, 3).toString();
    if (prefix !== 'v10' && prefix !== 'v11') return null;

    try {
      const nonce = buffer.subarray(3, 15);
      const ciphertext = buffer.subarray(15, buffer.length - 16);
      const tag = buffer.subarray(buffer.length - 16);

      const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, nonce);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    } catch (_) {
      return null;
    }
  }

  /**
   * Extrai cookies de banco de dados Gecko.
   */
  extractFromGeckoDb(dbPath) {
    const tmp = path.join(
      process.env.TEMP || '.',
      `ytm_gecko_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.sqlite`
    );

    try {
      fs.copyFileSync(dbPath, tmp);
      const db = new DatabaseSync(tmp);
      const rows = db.prepare(`
        SELECT host, name, value, path, isSecure, isHttpOnly, expiry, lastAccessed 
        FROM moz_cookies 
        WHERE (host LIKE '%youtube.com%' OR host LIKE '%google.com%')
        ORDER BY lastAccessed DESC
      `).all();

      db.close();
      try { fs.unlinkSync(tmp); } catch (_) {}

      const hasAuth = rows.some(r => (r.name === 'LOGIN_INFO' || r.name === 'SAPISID') && r.value);
      if (!hasAuth) return null;

      const seen = new Set();
      const result = [];
      for (const r of rows) {
        if (!ESSENTIAL_COOKIES.has(r.name)) continue;
        const key = `${r.host}:${r.name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(r);
      }

      return result;
    } catch (_) {
      try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (_) {}
      return null;
    }
  }

  /**
   * Extrai cookies de banco de dados Chromium.
   */
  extractFromChromiumDb(item) {
    const aesKey = this.getChromiumKey(item.localState);
    if (!aesKey) return null;

    const tmp = path.join(
      process.env.TEMP || '.',
      `ytm_cr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.sqlite`
    );

    try {
      fs.copyFileSync(item.path, tmp);
      const db = new DatabaseSync(tmp);
      const rows = db.prepare(`
        SELECT host_key AS host, name, encrypted_value, path, is_secure, is_httponly, expires_utc 
        FROM cookies 
        WHERE (host_key LIKE '%youtube.com%' OR host_key LIKE '%google.com%')
      `).all();

      db.close();
      try { fs.unlinkSync(tmp); } catch (_) {}

      const result = [];
      let hasAuth = false;

      for (const r of rows) {
        if (!ESSENTIAL_COOKIES.has(r.name)) continue;
        const val = this.decryptChromiumValue(Buffer.from(r.encrypted_value), aesKey);
        if (!val) continue;

        if (r.name === 'LOGIN_INFO' || r.name === 'SAPISID') {
          hasAuth = true;
        }

        result.push({
          host: r.host,
          name: r.name,
          value: val,
          path: r.path,
          isSecure: Boolean(r.is_secure),
          isHttpOnly: Boolean(r.is_httponly),
          expiry: r.expires_utc ? Math.floor(Number(r.expires_utc) / 1000000 - 11644473600) : undefined
        });
      }

      return hasAuth ? result : null;
    } catch (_) {
      try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (_) {}
      return null;
    }
  }

  /**
   * Tenta sincronizar a sessão de qualquer navegador instalado para o Electron.
   * @param {Electron.Session} ses
   * @returns {Promise<{ success: boolean, count?: number, browser?: string }>}
   */
  async syncSessionFromBrowsers(ses) {
    // 1. Tenta Gecko primeiro (Zen Browser, Firefox, etc.)
    const geckoDbs = this.getGeckoDatabases();
    for (const item of geckoDbs) {
      const cookies = this.extractFromGeckoDb(item.path);
      if (cookies && cookies.length > 0) {
        const injected = await this.injectCookies(ses, cookies);
        if (injected > 0) {
          this.startKeepAliveSync(ses);
          return { success: true, count: injected, browser: item.browser };
        }
      }
    }

    // 2. Tenta Chromium (Chrome, Edge, Brave, etc.)
    const chromiumDbs = this.getChromiumDatabases();
    for (const item of chromiumDbs) {
      const cookies = this.extractFromChromiumDb(item);
      if (cookies && cookies.length > 0) {
        const injected = await this.injectCookies(ses, cookies);
        if (injected > 0) {
          this.startKeepAliveSync(ses);
          return { success: true, count: injected, browser: item.browser };
        }
      }
    }

    return { success: false };
  }

  async injectCookies(ses, cookies) {
    let injected = 0;
    for (const c of cookies) {
      try {
        const domain = c.host.startsWith('.') ? c.host : '.' + c.host;
        const protocol = c.isSecure ? 'https:' : 'http:';
        const cleanHost = domain.replace(/^\./, '');
        const cookieUrl = `${protocol}//${cleanHost}${c.path || '/'}`;

        await ses.cookies.set({
          url: cookieUrl,
          domain: domain,
          path: c.path || '/',
          name: c.name,
          value: c.value,
          secure: Boolean(c.isSecure),
          httpOnly: Boolean(c.isHttpOnly),
          expirationDate: c.expiry ? Number(c.expiry) : undefined
        });
        injected++;
      } catch (_) {}
    }

    if (injected > 0) {
      try {
        await ses.cookies.flushStore();
      } catch (_) {}
    }
    return injected;
  }

  /**
   * Mantém os cookies de timestamp sincronizados periodicamente para evitar
   * o erro "Sua Conta do Google foi desconectada em outra guia".
   */
  startKeepAliveSync(ses) {
    if (this.keepAliveInterval) return;

    this.keepAliveInterval = setInterval(async () => {
      try {
        const geckoDbs = this.getGeckoDatabases();
        for (const item of geckoDbs) {
          const cookies = this.extractFromGeckoDb(item.path);
          if (cookies && cookies.length > 0) {
            await this.injectCookies(ses, cookies);
            return;
          }
        }
      } catch (_) {}
    }, 45000); // Checa a cada 45 segundos de forma silenciosa
  }

  stopKeepAliveSync() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  /**
   * Monitoramento ativo após abrir o navegador para login.
   */
  startLoginWatcher(ses, onLoginDetected, timeoutMs = 90000) {
    this.stopLoginWatcher();

    const startTime = Date.now();
    const check = async () => {
      if (Date.now() - startTime > timeoutMs) {
        this.stopLoginWatcher();
        return;
      }

      const res = await this.syncSessionFromBrowsers(ses);
      if (res.success) {
        this.stopLoginWatcher();
        if (typeof onLoginDetected === 'function') {
          onLoginDetected(res);
        }
      }
    };

    check();
    this.watcherInterval = setInterval(check, 2000);
  }

  stopLoginWatcher() {
    if (this.watcherInterval) {
      clearInterval(this.watcherInterval);
      this.watcherInterval = null;
    }
  }
}

module.exports = new BrowserSyncService();
