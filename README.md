# 🎵 YouTube Music Desktop

[![Version](https://img.shields.io/badge/version-1.1.0-red.svg?style=flat-square)](https://github.com/AllvesMatteus/youtube-music/releases)
[![Platform](https://img.shields.io/badge/platform-Windows%2010%20%2F%2011-blue.svg?style=flat-square)](https://www.microsoft.com/windows)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/electron-40.10.6-blue.svg?style=flat-square)](https://www.electronjs.org)

> 🚀 Um cliente Electron desktop moderno, elegante e de alta performance para o **YouTube Music**, com bloqueio de anúncios nativo, mini player flutuante, Discord Rich Presence, notificações do Windows, temas visuais e atualizações automáticas contínuas.

---

## ✨ Características Principais

| Recurso | Descrição |
|---|---|
| 🎵 **Player Nativo Otimizado** | Interface oficial do YouTube Music com baixa latência e consumo reduzido de RAM |
| 🪟 **Mini Player Flutuante** | Mini-janela compacta estilo Zen com controles completos, capa e sincronização em tempo real |
| 🎮 **Discord Rich Presence** | Exibe no seu perfil do Discord a música, artista, capa do álbum, tempo decorrido e botão de reprodução |
| 🔔 **Notificações Nativas** | Avisos no canto da tela do Windows na troca de faixa sem interromper seus jogos ou trabalho |
| ⌨️ **Teclas de Atalho Globais** | Gravador interativo nas Configurações e suporte nativo a teclados mecânicos/gaming |
| 🖤 **Aparência & Temas** | Seletor com tema Preto Puro (OLED / AMOLED) de alto contraste |
| 🛡️ **Bloqueio de Anúncios** | Motor integrado Ghostery/EasyList para reprodução contínua sem interrupções |
| 🔄 **Auto-Atualização Contínua** | Verificação automática e atualização em segundo plano via GitHub Releases |
| 🖼️ **Bandeja do Sistema (Tray)** | Fechamento em segundo plano e controles rápidos ao clicar no ícone da barra de tarefas |

---

## 📋 Pré-requisitos

- **Windows 10 / 11** (64-bit)
- **Node.js** `>= 18.x` (para desenvolvimento)

---

## 🚀 Instalação e Execução

### Para Usuários
1. Baixe o instalador mais recente na página de [Releases](https://github.com/AllvesMatteus/youtube-music/releases).
2. Execute o instalador `YouTube Music Setup 1.1.0.exe`.
3. Pronto! O app se atualizará automaticamente conforme novas versões forem lançadas.

### Para Desenvolvedores
```bash
# 1. Clonar o repositório
git clone https://github.com/AllvesMatteus/youtube-music.git
cd youtube-music

# 2. Instalar dependências
npm install

# 3. Rodar em ambiente de desenvolvimento
npm start

# 4. Gerar instalador para Windows
npm run build
```

---

## 📂 Estrutura do Projeto

```
.
├── src/
│   ├── main/                      # Processo Principal (Electron / Node.js)
│   │   ├── index.js               # Entrypoint & ciclo de vida
│   │   ├── config/appConfig.js    # Configurações centralizadas
│   │   ├── windows/               # Gerenciadores de janelas (Main, Settings, MiniPlayer, Splash)
│   │   ├── services/              # Serviços de domínio
│   │   │   ├── authService.js     # Autenticação
│   │   │   ├── adblockService.js  # Bloqueio de anúncios
│   │   │   ├── discordService.js  # Discord Rich Presence via IPC nativo
│   │   │   ├── notificationService.js # Notificações desktop do Windows
│   │   │   ├── themeService.js    # Injeção de temas visuais (OLED Black)
│   │   │   ├── mediaKeysService.js# Atalhos globais e suporte a teclados gaming
│   │   │   ├── settingsService.js # Persistência de configurações em JSON
│   │   │   ├── updateService.js   # Atualizações automáticas contínuas
│   │   │   └── trayService.js     # Bandeja do sistema (Tray)
│   │   └── ipc/                   # Canais de comunicação IPC
│   ├── preload/                   # Preload Scripts (Bridge segura com a web)
│   │   └── modules/               # Módulos de injeção
│   │       ├── antiDetection.js   # Mascaramento de automação
│   │       ├── playerController.js# Controle do player e captura de faixas
│   │       └── topBar.js          # Barra de controles nativos do Windows
│   └── renderer/                  # Interfaces de Renderização
│       ├── mini-player/           # Interface do Mini Player
│       └── splash/                # Interface da tela de splash
└── assets/                        # Ícones e recursos visuais
```

---

## 📝 Versões

### v1.1.0 (2026-09-22)
- ✅ Novo design de configurações estilo YouTube Music
- ✅ Teclas de atalho globais customizáveis com gravação interativa
- ✅ Correção definitiva de compatibilidade com teclas multimídia (teclados gaming)
- ✅ Integração nativa com Discord Rich Presence
- ✅ Notificações nativas do Windows na troca de faixa
- ✅ Suporte a Temas Visuais (Preto Puro OLED / AMOLED)

### v1.0.0 (2026-08-31)
- ✅ Aplicação base completa
- ✅ Suporte multi-contas
- ✅ Bloqueio de anúncios integrado
- ✅ Atalhos globais
- ✅ Persistência de estado
- ✅ System tray
- ✅ Instalador NSIS

---

## 📄 Licença

Este projeto é licenciado sob a **Licença MIT** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## ⚖️ Aviso Legal

Este projeto é uma **aplicação não oficial** para YouTube Music.
- Não é afiliado, endossado ou patrocinado pelo Google/YouTube.
- Respeite os [Termos de Serviço](https://www.youtube.com/t/terms) do YouTube Music.
