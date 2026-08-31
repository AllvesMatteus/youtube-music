# 📝 Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.0.0] - 2026-08-31

### ✨ Added
- ✅ Aplicação base completa funcional
- ✅ Integração com YouTube Music Web
- ✅ Suporte multi-contas com perfis isolados
- ✅ Bloqueador de anúncios integrado (Ghostery/EasyList)
- ✅ Atalhos globais de mídia (Play, Pause, Next, Previous)
- ✅ Persistência de estado (janela, sessão, contas)
- ✅ System tray com ícone e controles
- ✅ Splash screen no inicialização
- ✅ Anti-detecção de automação
- ✅ IPC bidirecional robusto
- ✅ Instalador NSIS (Windows x64)
- ✅ Arquitetura modular e escalável

### 🏗️ Architecture
- Main Process com gerenciamento de serviços isolados
- Preload Scripts com injeção segura de código
- Domain-Driven Services Pattern
- Multi-Process Architecture com isolamento

### 📚 Documentation
- README.md completo com badges e guias
- PROJETO.md com arquitetura detalhada
- CONTRIBUTING.md com diretrizes
- CODE_OF_CONDUCT.md
- Estrutura de projeto bem documentada

### 🔧 Build
- Configuração electron-builder para NSIS
- Scripts npm: `start`, `dev`, `build`
- Saída: `YouTube Music Setup 1.0.0.exe`

---

## [Unreleased]

### 🔄 In Progress
- [ ] Testes automatizados (Jest/Playwright)
- [ ] CI/CD com GitHub Actions
- [ ] Modo dark/light theme
- [ ] Sincronização de favoritos
- [ ] Histórico de reprodução
- [ ] Notificações de música nova
- [ ] Integração com Last.fm
- [ ] Suporte a plugins/extensões

### 🔮 Planejado
- [ ] Versão macOS
- [ ] Versão Linux
- [ ] Aplicativo mobile companion
- [ ] Sincronização de dados em nuvem
- [ ] Sistema de temas customizável
- [ ] Gestos de controle por touchpad
- [ ] Integração com Spotify/Apple Music

---

## Versionamento

Este projeto segue o [Semantic Versioning](https://semver.org/lang/pt-BR/):

- **MAJOR** (X.0.0): Mudanças incompatíveis
- **MINOR** (0.X.0): Novas funcionalidades compatíveis
- **PATCH** (0.0.X): Correções de bugs compatíveis

---

## Formato de Commits

Este projeto usa o seguinte formato para commits:

```
[Type]: [Descrição breve]

[Descrição detalhada, se necessário]

Closes #[número da issue]
```

### Types:
- `feat`: Nova feature
- `fix`: Correção de bug
- `docs`: Mudanças na documentação
- `refactor`: Refatoração de código
- `test`: Adição ou modificação de testes
- `chore`: Tarefas de manutenção
- `perf`: Melhorias de performance

---

## Como Contribuir

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para instruções detalhadas sobre como contribuir com mudanças ao projeto.

---

<div align="center">

[← Voltar ao README](README.md)

</div>
