# 🎵 YouTube Music Desktop

Uma aplicação Electron elegante e modular para **YouTube Music** com recursos avançados para desktop, construída com arquitetura escalável e multi-processo.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Windows%2010%2B-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Recursos

- 🎵 **Player YouTube Music Nativo** - Interface completa do YouTube Music no desktop
- 🔐 **Multi-Contas** - Gerencie múltiplas contas YouTube com perfis separados
- 🛡️ **Bloqueio de Anúncios** - Bloqueador de anúncios integrado usando Ghostery/EasyList
- ⌨️ **Atalhos Globais** - Controle reprodução com teclas de mídia global
- 🖼️ **System Tray** - Minimize para bandeja do sistema
- 🎨 **Persistência de Estado** - Lembra tamanho, posição e sessão da janela
- 🤖 **Anti-Detecção** - Mascaramento inteligente de automação
- 📡 **IPC Bidirecional** - Comunicação eficiente entre processos
- ⚡ **Otimizado** - Arquitetura modular e escalável

---

## 📋 Pré-requisitos

- **Node.js** >= 16.x
- **npm** >= 8.x
- **Windows 10 ou superior** (x64)
- **Git** (opcional, para desenvolvimento)

---

## 🚀 Instalação

### 1. Clonar o repositório
```bash
git clone https://github.com/AllvesMatteus/youtube-music.git
cd youtube-music
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Executar em modo desenvolvimento
```bash
npm run dev
```

Ou iniciar normalmente:
```bash
npm start
```

---

## 🏗️ Build & Empacotamento

Para criar um instalador Windows (.exe):

```bash
npm run build
```

O instalador será gerado em: `dist/YouTube Music Setup 1.0.0.exe`

### Recursos do Instalador

- ✅ Instalação customizável em diretório específico
- ✅ Atalhos na área de trabalho e menu iniciar
- ✅ Desinstalação completa

---

## 📁 Estrutura do Projeto

```
youtube-music/
├── package.json                    # Configuração e dependências
├── README.md                       # Este arquivo
├── PROJETO.md                      # Documentação técnica detalhada
│
├── src/
│   ├── main/                       # 🖥️ Main Process (Backend)
│   │   ├── index.js                # Entrypoint e ciclo de vida
│   │   ├── config/
│   │   │   └── appConfig.js        # Constantes e configurações
│   │   ├── windows/
│   │   │   ├── mainWindow.js       # Gerenciador janela principal
│   │   │   └── splashWindow.js     # Tela de splash
│   │   ├── services/               # Camada de serviços
│   │   │   ├── authService.js      # Autenticação in-app
│   │   │   ├── accountService.js   # Gerenciamento de contas
│   │   │   ├── adblockService.js   # Bloqueador de anúncios
│   │   │   ├── mediaKeysService.js # Atalhos de mídia globais
│   │   │   ├── trayService.js      # System tray
│   │   │   └── windowStateService.js # Persistência de estado
│   │   └── ipc/                    # IPC Communication
│   │       ├── trackIpc.js         # Comunicação de tracks
│   │       └── accountIpc.js       # Comunicação de contas
│   │
│   ├── preload/                    # 🔌 Preload Scripts
│   │   ├── index.js                # Bootstrap preload
│   │   └── modules/
│   │       ├── antiDetection.js    # Anti-detecção de bot
│   │       ├── playerController.js # Controle de player
│   │       ├── trackObserver.js    # Observer de tracks
│   │       ├── topBar.js           # Barra superior UI
│   │       └── adSkipper.js        # Auto-skip de anúncios
│   │
│   ├── renderer/                   # 🎨 Renderer Process (Frontend)
│   │   ├── splash/
│   │   │   ├── splash.html
│   │   │   └── splash.css
│   │   └── ...
│   │
│   └── shared/                     # 📦 Código compartilhado
│
└── assets/                         # 🖼️ Recursos
    └── icons/                      # Ícones da aplicação
```

---

## 🏛️ Arquitetura

A aplicação segue uma **arquitetura modular multi-processo**:

### Main Process
- Gerencia ciclo de vida da aplicação
- Executado em Node.js nativo
- Acesso ao sistema de arquivos e APIs do SO
- Executa serviços isolados (autenticação, adblock, atalhos, etc)

### Preload Process
- Ponte segura entre Main e Renderer
- Injeta APIs customizadas no contexto do window
- Implementa módulos de automação (player controller, track observer, ad skipper)

### Renderer Process
- Interface web (YouTube Music)
- Isolado do Node.js (segurança)
- Comunica via IPC com Main Process

---

## 🔧 Configuração

As configurações principais estão em [src/main/config/appConfig.js](src/main/config/appConfig.js):

```javascript
// Exemplo de configuração
const CONFIG = {
  appName: 'YouTube Music',
  defaultWidth: 1280,
  defaultHeight: 800,
  preloadFile: path.join(__dirname, '../../preload/index.js'),
  // ... mais configs
};
```

---

## 📡 Comunicação IPC

A aplicação usa IPC (Inter-Process Communication) para comunicação:

### Track Observer
```javascript
// Quando uma track muda no YouTube Music
ipcMain.on('track-changed', (event, trackData) => {
  // Processa dados da track
});
```

### Account Switcher
```javascript
// Ao mudar de conta
ipcMain.on('account-switched', (event, accountData) => {
  // Carrega perfil da nova conta
});
```

---

## 🛡️ Segurança

- ✅ **Context Isolation** ativado
- ✅ **Preload script** como única ponte com Node.js
- ✅ **User-Agent inteligente** para evitar detecção
- ✅ **Session partitions** por conta de usuário
- ✅ **Sem eval()** ou code execution dinâmico

---

## 📝 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Inicia aplicação (produção) |
| `npm run dev` | Inicia aplicação (desenvolvimento) |
| `npm run build` | Cria instalador Windows |

---

## 🐛 Troubleshooting

### Problema: Aplicação não inicia
```bash
# Limpar cache de node_modules
rm -r node_modules
npm install
npm start
```

### Problema: Anúncios não são bloqueados
- Verificar atualização dos filtros de adblock
- Consultar logs da aplicação
- Verificar se o serviço de adblock está ativo

### Problema: IPC não funciona
- Garantir que preload script está sendo carregado
- Verificar context isolation está ativado
- Checar console para erros de comunicação

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 👨‍💻 Autor

**Matteus Alves**
- GitHub: [@AllvesMatteus](https://github.com/AllvesMatteus)

---

## 📞 Suporte

Para dúvidas, issues ou sugestões, abra uma [issue no GitHub](https://github.com/AllvesMatteus/youtube-music/issues).

---

## 🎯 Roadmap

- [ ] Suporte a macOS e Linux
- [ ] Temas customizáveis
- [ ] Plugin system
- [ ] Sincronização de playlists
- [ ] Integração com Spotify
- [ ] Notificações de novas releases

---

**Desenvolvido com ❤️ para amantes de música**
