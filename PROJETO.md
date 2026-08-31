# 🎵 YouTube Music Desktop — Documento de Arquitetura & Projeto

## 📌 Visão Geral

| Propriedade | Especificação |
|:---|:---|
| **Nome do App** | YouTube Music Desktop |
| **Plataforma** | Windows 10/11 (x64) |
| **Framework** | Electron |
| **Padrão Arquitetural** | **Modular Multi-Process Architecture (Domain & Service-Driven)** |
| **Resultado Final** | 📦 **`dist/YouTube Music Setup 1.0.0.exe`** (Instalador Nativo) |
| **Status Geral** | 🟢 **100% Concluído & Compilado** |

---

## 🏛️ Arquitetura Escalável

```mermaid
graph TD
    subgraph "Main Process (Node.js/Electron Engine)"
        ENTRY["src/main/index.js<br/>(App Lifecycle & Single Instance Lock)"]
        CONFIG["src/main/config/appConfig.js<br/>(Constantes & Configurações)"]
        WIN_MAIN["src/main/windows/mainWindow.js<br/>(Gerenciamento de Janela & Sessão)"]
        
        subgraph "Services Layer (Regras de Negócio Isoladas)"
            AUTH_SRV["authService.js<br/>(Login In-App & Cookie Filter)"]
            ACCOUNT_SRV["accountService.js<br/>(Multi-Contas & Partições)"]
            ADBLOCK_SRV["adblockService.js<br/>(Filtros EasyList/Ghostery)"]
            MEDIA_SRV["mediaKeysService.js<br/>(Global Shortcuts)"]
            TRAY_SRV["trayService.js<br/>(Bandeja do Windows)"]
            STATE_SRV["windowStateService.js<br/>(Persistência de Posição)"]
        end
        
        subgraph "IPC Communication Layer"
            TRACK_IPC["src/main/ipc/trackIpc.js<br/>(Comunicação Bidirecional)"]
            ACCOUNT_IPC["src/main/ipc/accountIpc.js<br/>(Troca de Perfis)"]
        end
        
        ENTRY --> CONFIG
        ENTRY --> WIN_MAIN
        WIN_MAIN --> AUTH_SRV
        WIN_MAIN --> ACCOUNT_SRV
        WIN_MAIN --> ADBLOCK_SRV
        WIN_MAIN --> MEDIA_SRV
        WIN_MAIN --> TRAY_SRV
        WIN_MAIN --> STATE_SRV
        WIN_MAIN --> TRACK_IPC
        WIN_MAIN --> ACCOUNT_IPC
    end

    subgraph "Preload Layer (Ponte de Injeção Segura)"
        PRE_ENTRY["src/preload/index.js<br/>(Bootstrap do Preload)"]
        ANTI_DET["modules/antiDetection.js<br/>(Mascaramento de Automação)"]
        PLAYER_CTRL["modules/playerController.js<br/>(Disparadores de Ação do Player)"]
        TRACK_OBS["modules/trackObserver.js<br/>(MutationObserver do DOM)"]
        TOP_BAR["modules/topBar.js<br/>(Barra Superior & Multi-Contas)"]
        AD_SKIP["modules/adSkipper.js<br/>(Auto-Skip de Anúncios)"]
        
        PRE_ENTRY --> ANTI_DET
        PRE_ENTRY --> PLAYER_CTRL
        PRE_ENTRY --> TRACK_OBS
        PRE_ENTRY --> TOP_BAR
        PRE_ENTRY --> AD_SKIP
    end

    subgraph "External World"
        YTM_WEB["🌐 music.youtube.com<br/>(Interface Oficial Web)"]
    end

    WIN_MAIN --> PRE_ENTRY
    PRE_ENTRY --> YTM_WEB
    TRACK_OBS -->|track-changed| TRACK_IPC
    MEDIA_SRV -->|media-play/next/prev| PLAYER_CTRL
```

---

## 📁 Estrutura Final do Projeto

```
e:\Developer\sandbox\Youtube Music\
├── package.json                   # Metadados e scripts (start, dev, build)
├── package-lock.json              # Lockfile
├── PROJETO.md                     # Documento mestre de arquitetura
│
├── src/
│   ├── main/                      # 🖥️ MAIN PROCESS (Backend Desktop)
│   │   ├── index.js               # Entrypoint & ciclo de vida (instância única)
│   │   ├── config/                # ⚙️ Configurações centralizadas
│   │   │   └── appConfig.js
│   │   ├── windows/               # 🪟 Gerenciadores de Janelas
│   │   │   ├── mainWindow.js      # Janela principal
│   │   │   └── splashWindow.js    # Splash Screen frameless
│   │   ├── services/              # 🧩 Serviços de Domínio Isolados
│   │   │   ├── authService.js     # Login in-app com User-Agent inteligente
│   │   │   ├── accountService.js  # Gerenciamento de Multi-Contas / Perfis
│   │   │   ├── adblockService.js  # Bloqueio de anúncios de rede (Ghostery/EasyList)
│   │   │   ├── mediaKeysService.js# Atalhos globais de teclado
│   │   │   ├── trayService.js     # System Tray com ícones brancos
│   │   │   └── windowStateService.js # Persistência de tamanho e posição
│   │   └── ipc/                   # 📡 Handlers IPC
│   │       ├── trackIpc.js        # Eventos de reprodução e título dinâmico
│   │       └── accountIpc.js      # Troca de contas e saída segura
│   │
│   ├── preload/                   # 🌉 PRELOAD SCRIPTS
│   │   ├── index.js               # Entrypoint
│   │   └── modules/
│   │       ├── antiDetection.js   # Mascaramento de webdriver e navigator
│   │       ├── playerController.js# Controle de mídia
│   │       ├── trackObserver.js   # MutationObserver para título e artista
│   │       ├── topBar.js          # Barra superior customizada & modal de contas
│   │       └── adSkipper.js       # Auto-skip de banners e promoções
│   │
│   ├── renderer/                  # 🎨 Telas Nativas
│   │   └── splash/
│   │       ├── splash.html
│   │       └── splash.css
│   │
│   └── assets/                    # 🖼️ Recursos Visuais
│       ├── icon.ico               # Ícone do aplicativo Windows (256x256)
│       ├── icon.png               # Ícone em alta resolução (512x512)
│       ├── tray-icon.png          # Ícone da bandeja
│       └── icons/                 # Ícones brancos do player + botão vermelho
│           ├── play.png, pause.png, next.png, previous.png, stop.png
│           ├── shuffle.png, repeat.png, rewind.png, fast-forward.png
│           ├── volume.png, mute.png, like.png, share.png, equalizer.png
│           ├── avatar.png
│           └── exit.png (Vermelho)
│
└── dist/                          # 📦 BUILD DE PRODUÇÃO
    └── YouTube Music Setup 1.0.0.exe
```

---

# 📊 Roadmap das Etapas — Status Final

| # | Etapa | Status | Descrição |
|:--|:------|:------:|:----------|
| **1** | Setup & Estrutura Modular | ✅ **Concluída** | Base Electron inicializada com arquitetura modular |
| **2** | YouTube Music Oficial & Sessão | ✅ **Concluída** | Interface oficial carregando com partição persistente |
| **3** | Preload & Login In-App | ✅ **Concluída** | Bypass de bloqueio do Google via User-Agent dinâmico por rota |
| **4** | Bloqueador de Anúncios | ✅ **Concluída** | Bloqueador EasyList + Ghostery + Auto-Skipper |
| **5** | Teclas Globais de Teclado | ✅ **Concluída** | Play/Pause/Next/Prev funcionando em segundo plano |
| **6** | System Tray & Splash Screen | ✅ **Concluída** | Bandeja do Windows, ThumbarButtons e tela de carregamento |
| **7** | Persistência de Janela | ✅ **Concluída** | Restauração de tamanho/posição e navegação externa segura |
| **8** | Ícones + Build do Instalador .exe | ✅ **Concluída** | Gerado instalador oficial NSIS em `dist/` |
