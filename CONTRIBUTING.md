# 🤝 Guia de Contribuição

Obrigado por considerar contribuir para o **YouTube Music Desktop**! Este documento fornece diretrizes e instruções para participar do projeto.

---

## 📋 Código de Conduta

Por favor, leia nosso [Código de Conduta](CODE_OF_CONDUCT.md) antes de contribuir. Esperamos que todos os contribuidores respeitem esses princípios.

---

## ❓ Questões e Suporte

- **Dúvidas sobre como usar?** → Veja a [documentação](README.md#-como-usar)
- **Problema técnico?** → Abra uma [Issue](https://github.com/AllvesMatteus/youtube-music-desktop/issues)
- **Discussões gerais?** → Use [Discussions](https://github.com/AllvesMatteus/youtube-music-desktop/discussions)

---

## 🐛 Reportando Bugs

### Antes de reportar:
1. Verifique se o bug já foi reportado
2. Tente reproduzir com a versão mais recente
3. Limpe cache e temp files

### Ao reportar:
Inclua informações:
```markdown
**Ambiente:**
- Windows: [versão]
- YouTube Music Desktop: [versão]

**Descrição do Bug:**
[Descrição clara]

**Passos para Reproduzir:**
1. ...
2. ...

**Comportamento Esperado:**
[O que deveria acontecer]

**Comportamento Atual:**
[O que está acontecendo]

**Logs/Screenshots:**
[Anexe se possível]
```

---

## ✨ Sugerindo Features

1. Verifique se já não foi sugerido
2. Use um título descritivo
3. Forneça descrição detalhada
4. Explique o caso de uso
5. Liste exemplos

**Template:**
```markdown
**Descrição:**
[Explicação clara da feature]

**Benefício:**
[Por que isso seria útil]

**Exemplo de uso:**
[Como seria utilizado]

**Alternativas consideradas:**
[Outras abordagens]
```

---

## 💻 Desenvolvimento Local

### Setup
```bash
git clone https://github.com/AllvesMatteus/youtube-music-desktop.git
cd youtube-music-desktop
npm install
```

### Rodar em desenvolvimento
```bash
npm run dev
```

### Build para teste
```bash
npm run build
```

---

## 📝 Padrões de Código

### JavaScript/Node.js
- Use **ES6+** syntax
- Variáveis em **camelCase**
- Constantes em **UPPER_CASE**
- Funções com nomes **descritivos**

**Exemplo:**
```javascript
// ❌ Evite
function process() {
  let a = 10;
  return a * 2;
}

// ✅ Prefira
const MULTIPLIER = 2;

function calculateTotal(baseValue) {
  return baseValue * MULTIPLIER;
}
```

### Estrutura de Serviços
```javascript
// src/main/services/myService.js
class MyService {
  constructor(config) {
    this.config = config;
  }

  initialize() {
    // Inicialização
  }

  execute(params) {
    // Lógica principal
  }

  cleanup() {
    // Limpeza
  }
}

module.exports = MyService;
```

### IPC Communication
```javascript
// Main process
ipcMain.handle('action-name', async (event, data) => {
  try {
    const result = await someService.execute(data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Preload/Renderer
await window.electronAPI.send('action-name', payload);
```

---

## 🔄 Processo de Pull Request

### 1. Preparação
```bash
git checkout -b feature/sua-feature
# ou
git checkout -b fix/seu-bug
```

### 2. Desenvolvimento
- Faça commits pequenos e descritivos
- Use mensagens em português/inglês claro
- Refira issues quando aplicável

**Formato de commit:**
```
[Type]: [Descrição breve]

[Descrição detalhada, se necessário]

Closes #123
```

**Types:**
- `feat`: Nova feature
- `fix`: Correção de bug
- `docs`: Documentação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Tarefas de manutenção

**Exemplos:**
```bash
git commit -m "feat: adicionar suporte a modo escuro"
git commit -m "fix: corrigir crash ao trocar de conta"
git commit -m "docs: atualizar guia de contribuição"
```

### 3. Verificações Antes do Push
- [ ] Código segue o padrão de estilo
- [ ] Sem `console.log()` ou debug code
- [ ] Testado localmente
- [ ] Sem conflitos com `main`
- [ ] Commits são atômicos e bem descritos

### 4. Abrir Pull Request
```bash
git push origin feature/sua-feature
```

**Template de PR:**
```markdown
## Descrição
Breve descrição do que foi feito

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Mudança na documentação

## Issues Relacionadas
Fixes #123

## Testes
- [ ] Testado em Windows 10
- [ ] Testado em Windows 11

## Screenshots (se aplicável)
[Anexe screenshots]

## Checklist
- [ ] Meu código segue o estilo do projeto
- [ ] Revisei minhas próprias mudanças
- [ ] Comentei código complexo
- [ ] Atualizei documentação
```

### 5. Review
- Responda aos comentários
- Faça ajustes solicitados em novos commits
- Mantenha a conversa produtiva

---

## 📚 Estrutura de Pastas

Ao adicionar novos arquivos:

```
src/main/
├── services/      # Lógica de negócio
├── windows/       # Gerenciamento de UI
├── ipc/          # Comunicação inter-processo
└── config/       # Configurações

src/preload/
└── modules/      # Injeção segura de código

src/renderer/
└── [componentes visuais]
```

---

## 🧪 Testes

Por enquanto, testes são manuais. Ao fazer mudanças:

1. Teste a funcionalidade principal
2. Teste casos extremos
3. Verifique em dev mode e build
4. Teste em Windows 10 e 11 se possível

Documentação de testes automatizados em breve.

---

## 📖 Documentação

Ao adicionar features:
1. Atualize [README.md](README.md)
2. Atualize [PROJETO.md](PROJETO.md) se impactar arquitetura
3. Documente configurações em comentários
4. Atualize [CHANGELOG.md](CHANGELOG.md)

---

## 🚀 Merge e Release

### Critério para Merge
- ✅ Passa em todas as verificações
- ✅ Pelo menos 1 review positivo
- ✅ Sem conflitos
- ✅ Testes aprovados
- ✅ Documentação atualizada

### Processo de Release
1. Merge em `main`
2. Update version em `package.json`
3. Criar tag: `git tag v1.x.x`
4. Build: `npm run build`
5. Criar Release no GitHub

---

## 🎓 Recursos

- [Documentação Electron](https://www.electronjs.org/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Git Workflow](https://guides.github.com/introduction/flow/)

---

## 💬 Dúvidas?

- Abra uma [Discussion](https://github.com/AllvesMatteus/youtube-music-desktop/discussions)
- Comente em uma Issue existente
- Revise a documentação em [PROJETO.md](PROJETO.md)

---

## 🙏 Obrigado!

Sua contribuição ajuda a melhorar o YouTube Music Desktop para todos. Estamos animados em colaborar com você!

---

<div align="center">

[← Voltar ao README](README.md)

</div>
