# 🚀 Ferramentas de Publicação & Releases

Este diretório contém o utilitário inteligente de build, versionamento e publicação automática de atualizações do **YouTube Music Desktop**.

---

## 📁 Estrutura de Arquivos

* **`publish.ps1`**: Script inteligente em PowerShell que:
  1. Carrega as variáveis do `.env` (ou do sistema).
  2. Consulta a versão local atual no `package.json`.
  3. Consulta a última release publicada no GitHub via API (`https://api.github.com/repos/AllvesMatteus/youtube-music/releases/latest`).
  4. Analisa o Git e lista **exatamente quais arquivos foram modificados, criados ou excluídos**.
  5. Oferece opções automáticas de versionamento SemVer (Patch, Minor, Major ou personalizada).
  6. Solicita ou gera automaticamente as notas da versão (Changelog).
  7. Atualiza `package.json` e `README.md`.
  8. Realiza `git add`, `git commit` e `git push origin main`.
  9. Executa `electron-builder` para compilar o instalador e enviar para o GitHub Releases.
  10. Garante que a release seja marcada como pública no GitHub.
* **`publish.bat`**: Atalho executável (duplo clique) para rodar o script no Windows sem precisar abrir o terminal.
* **`.env`**: Arquivo de credenciais locais (protegido no `.gitignore`, nunca enviado para o GitHub).

---

## 🕹️ Como Usar

Você pode iniciar o publicador de 3 formas fáceis:

1. **Pela raiz do projeto:** Dê 2 cliques no arquivo [`publicar.bat`](../../publicar.bat).
2. **Pelo terminal:** Execute `npm run publish:auto`.
3. **Por esta pasta:** Dê 2 cliques no arquivo `publish.bat` ou rode `.\publish.ps1`.
