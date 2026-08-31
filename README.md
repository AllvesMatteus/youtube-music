# 🎵 YouTube Music Desktop

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg?style=flat-square)](https://github.com/AllvesMatteus/youtube-music-desktop/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%2B-blue.svg?style=flat-square)](https://www.microsoft.com/windows)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D16.x-green.svg?style=flat-square)](https://nodejs.org)
[![Electron](https://img.shields.io/badge/electron-%3E%3D40.8.0-blue.svg?style=flat-square)](https://www.electronjs.org)

> 🚀 Uma aplicação Electron elegante, modular e escalável para **YouTube Music** no desktop com recursos avançados e arquitetura otimizada para performance.

---

## ✨ Características Principais

| Recurso | Descrição |
|---------|-----------|
| 🎵 **Player Nativo** | Interface completa do YouTube Music integrada no desktop |
| 🔐 **Multi-Contas** | Gerencie múltiplas contas YouTube com perfis isolados |
| 🛡️ **Bloqueio de Anúncios** | Bloqueador integrado usando Ghostery/EasyList |
| ⌨️ **Atalhos Globais** | Controle reprodução com teclas de mídia do Windows |
| 🖼️ **Minimizar para Tray** | Acesso rápido na bandeja do sistema |
| 💾 **Persistência** | Lembra tamanho, posição e sessão da janela |
| 🤖 **Anti-Detecção** | Mascaramento inteligente de automação |
| ⚡ **Otimizado** | Arquitetura modular, escalável e performática |

---

## 📋 Pré-requisitos

- **Node.js** `>= 16.x` ([Download](https://nodejs.org))
- **npm** `>= 8.x` (incluso com Node.js)
- **Windows 10/11** (x64)
- **Git** (opcional, para desenvolvimento)

---

## 🚀 Guia de Instalação

### Para Usuários Finais

1. **Baixe o instalador** na página [Releases](https://github.com/AllvesMatteus/youtube-music-desktop/releases)
2. **Execute** `YouTube Music Setup 1.0.0.exe`
3. **Siga** as instruções do instalador
4. **Inicie** a aplicação no menu iniciar ou desktop

### Para Desenvolvedores

#### 1. Clonar Repositório
```bash
git clone https://github.com/AllvesMatteus/youtube-music-desktop.git
cd youtube-music-desktop
```

#### 2. Instalar Dependências
```bash
npm install
```

#### 3. Executar em Desenvolvimento
```bash
npm run dev
```

#### 4. Build para Produção
```bash
npm run build
```

O instalador será gerado em `dist/YouTube Music Setup 1.0.0.exe`

---

## 📂 Estrutura do Projeto

```
.
├── src/
│   ├── main/                      # Main Process (Backend)
│   │   ├── index.js               # Entrypoint & ciclo de vida
│   │   ├── config/                # Configurações centralizadas
│   │   ├── windows/               # Gerenciadores de janelas
│   │   ├── services/              # Serviços de domínio
│   │   │   ├── authService.js     # Autenticação
│   │   │   ├── accountService.js  # Multi-contas
│   │   │   ├── adblockService.js  # Bloqueio de anúncios
│   │   │   ├── mediaKeysService.js# Atalhos globais
│   │   │   ├── trayService.js     # Bandeja do sistema
│   │   │   └── windowStateService.js # Persistência
│   │   └── ipc/                   # Comunicação IPC
│   ├── preload/                   # Preload Scripts (Bridge segura)
│   │   └── modules/               # Módulos de injeção
│   │       ├── antiDetection.js   # Mascaramento de automação
│   │       ├── adSkipper.js       # Auto-skip de anúncios
│   │       ├── playerController.js# Controle do player
│   │       ├── trackObserver.js   # Observação de tracks
│   │       └── topBar.js          # Barra superior
│   ├── renderer/                  # Renderer Process
│   │   └── splash/                # Splash screen
│   └── shared/                    # Código compartilhado
├── assets/                        # Recursos estáticos
│   ├── icons/                     # Ícones da aplicação
│   └── folder.ico                 # Ícone de pasta para instalador
├── scripts/                       # Scripts utilitários
├── package.json                   # Metadados & dependências
└── PROJETO.md                     # Documentação de arquitetura

```

---

## 🏗️ Arquitetura

A aplicação segue uma **arquitetura modular multi-processo**:

```
┌─────────────────────────────────────────┐
│         Main Process (Node.js)          │
├─────────────────────────────────────────┤
│ • Gerenciamento de janelas              │
│ • Serviços de negócio                   │
│ • IPC bidirecional                      │
│ • Atalhos globais                       │
└──────────────┬──────────────────────────┘
               │
         ┌─────┴─────┐
         │ Preload   │
         │ Scripts   │
         └─────┬─────┘
               │
┌──────────────┴──────────────┐
│   Renderer Process          │
│  (YouTube Music Web)        │
└─────────────────────────────┘
```

Para mais detalhes, veja [PROJETO.md](PROJETO.md)

---

## 📖 Como Usar

### Atalhos Globais

| Atalho | Ação |
|--------|------|
| `Media Play/Pause` | Play/Pausa |
| `Media Next` | Próxima música |
| `Media Previous` | Música anterior |
| `Tray` | Minimizar/Restaurar |

### Gerenciamento de Contas

1. Clique no **ícone de usuário** na barra superior
2. Selecione **Adicionar conta**
3. Faça login com sua conta Google
4. Use o **seletor de conta** para trocar entre perfis

### Bloqueio de Anúncios

- **Automático** - Ativado por padrão
- **Configuração** - Menu > Preferências > Bloquear Anúncios

---

## 🐛 Solução de Problemas

### A aplicação não inicia
- Verifique se o Windows 10+ está atualizado
- Execute novamente o instalador como administrador
- Verifique se há espaço em disco

### Login não funciona
- Limpe o cache: `%APPDATA%\YouTube Music\`
- Desative VPN/Proxy temporariamente
- Tente novamente com outra conta

### Atalhos globais não funcionam
- Verifique permissões no Windows
- Desative aplicações que capturem teclas de mídia
- Reinicie a aplicação

### Anúncios não são bloqueados
- Verifique conexão com internet
- Atualize a aplicação para a versão mais recente
- Limpe o cache do navegador

---

## 🤝 Contribuição

Contribuições são **bem-vindas**! 

### Como contribuir

1. **Fork** o repositório
2. **Crie** uma branch (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add: MinhaFeature'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. **Abra** um Pull Request

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes detalhadas.

### Áreas para Contribuição

- 🐛 Correção de bugs
- ✨ Novas features
- 📚 Documentação
- 🎨 UI/UX melhorias
- 🧪 Testes

---

## 📝 Changelog

### v1.0.0 (2026-08-31)
- ✅ Aplicação base completa
- ✅ Suporte multi-contas
- ✅ Bloqueio de anúncios integrado
- ✅ Atalhos globais
- ✅ Persistência de estado
- ✅ System tray
- ✅ Instalador NSIS

Veja [CHANGELOG.md](CHANGELOG.md) para histórico completo.

---

## 📞 Suporte

- 📧 **Email**: [adicionar email de contato]
- 💬 **Issues**: [GitHub Issues](https://github.com/AllvesMatteus/youtube-music-desktop/issues)
- 📖 **Documentação**: [PROJETO.md](PROJETO.md)

---

## 📄 Licença

Este projeto é licenciado sob a **Licença MIT** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## ⚖️ Aviso Legal

Este projeto é uma **aplicação não oficial** para YouTube Music. 

- Não é afiliado, endorsado ou patrocinado pelo Google/YouTube
- Use por sua conta e risco
- Respeite os [Termos de Serviço](https://www.youtube.com/t/terms) do YouTube Music
- O bloqueio de anúncios pode violar os ToS - use responsavelmente

---

## 🙏 Créditos

- [Electron](https://www.electronjs.org) - Framework
- [@ghostery/adblocker-electron](https://github.com/ghostery/adblocker) - Bloqueador de anúncios
- [Electron Builder](https://www.electron.build) - Build system

---

<div align="center">

Feito com ❤️ por [AllvesMatteus](https://github.com/AllvesMatteus)

[⬆ Voltar ao Topo](#-youtube-music-desktop)

</div>
