const { app } = require('electron');
const fs = require('fs');
const path = require('path');

class AccountService {
  constructor() {
    this.dataFile = path.join(app.getPath('userData'), 'accounts.json');
    this.data = this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(this.dataFile)) {
        return JSON.parse(fs.readFileSync(this.dataFile, 'utf-8'));
      }
    } catch (e) {
      console.error('[AccountService] Erro ao carregar contas:', e);
    }

    // Estrutura padrão inicial
    const defaultData = {
      activeAccountId: 'account_default',
      accounts: [
        {
          id: 'account_default',
          name: 'Conta Principal',
          email: '',
          avatarUrl: '',
          partition: 'persist:youtube-music'
        }
      ]
    };

    this.saveData(defaultData);
    return defaultData;
  }

  saveData(data = this.data) {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('[AccountService] Erro ao salvar contas:', e);
    }
  }

  getAccounts() {
    return this.data.accounts;
  }

  getActiveAccount() {
    const acc = this.data.accounts.find(a => a.id === this.data.activeAccountId);
    return acc || this.data.accounts[0];
  }

  getActivePartition() {
    return this.getActiveAccount().partition;
  }

  async addAccount(customName = 'Nova Conta') {
    const id = `account_${Date.now()}`;
    const newAccount = {
      id,
      name: customName,
      email: '',
      avatarUrl: '',
      partition: `persist:ytm-${id}`
    };

    this.data.accounts.push(newAccount);
    this.data.activeAccountId = id;
    this.saveData();

    return newAccount;
  }

  async switchAccount(accountId) {
    const target = this.data.accounts.find(a => a.id === accountId);
    if (!target) return null;

    this.data.activeAccountId = accountId;
    this.saveData();

    return target;
  }

  updateActiveAccountInfo({ name, email, avatarUrl }) {
    const active = this.getActiveAccount();
    if (!active) return;

    let changed = false;
    if (name && active.name !== name && active.name.startsWith('Conta')) {
      active.name = name;
      changed = true;
    }
    if (email && active.email !== email) {
      active.email = email;
      changed = true;
    }
    if (avatarUrl && active.avatarUrl !== avatarUrl) {
      active.avatarUrl = avatarUrl;
      changed = true;
    }

    if (changed) {
      this.saveData();
    }
  }

  removeAccount(accountId) {
    if (this.data.accounts.length <= 1) return false;

    this.data.accounts = this.data.accounts.filter(a => a.id !== accountId);
    if (this.data.activeAccountId === accountId) {
      this.data.activeAccountId = this.data.accounts[0].id;
    }
    this.saveData();
    return true;
  }
}

module.exports = new AccountService();
