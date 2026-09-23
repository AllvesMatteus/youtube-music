// Preload anti-detecção estrito para a janela de login do Google
// Garante consistência 100% idêntica ao Firefox nativo, eliminando vazamentos do Chromium/Electron

try {
  // 1. Firefox não possui navigator.vendor ('Google Inc.' entrega Chromium)
  Object.defineProperty(navigator, 'vendor', {
    get: () => '',
    configurable: true
  });

  // 2. Firefox não possui window.chrome
  try {
    delete window.chrome;
  } catch (_) {}

  // 3. Firefox não possui Client Hints (navigator.userAgentData)
  if ('userAgentData' in navigator) {
    try {
      delete Object.getPrototypeOf(navigator).userAgentData;
      delete navigator.userAgentData;
    } catch (_) {}
  }

  // 4. Firefox não possui cookieStore
  if ('cookieStore' in window) {
    try {
      delete window.cookieStore;
    } catch (_) {}
  }

  // 5. Garante que webdriver seja undefined
  if ('webdriver' in navigator) {
    try {
      delete Object.getPrototypeOf(navigator).webdriver;
      delete navigator.webdriver;
    } catch (_) {}
  }

  // 6. Propriedade oscpu presente no Firefox para Windows
  try {
    Object.defineProperty(navigator, 'oscpu', {
      get: () => 'Windows NT 10.0; Win64; x64',
      configurable: true
    });
  } catch (_) {}

  // 7. Desativa WebAuthn / Passkey condicional no formulário
  // Impede que o Google abra o pop-up nativo "Segurança do Windows - Escolher uma chave de acesso",
  // que rouba o foco, causa timeout e faz o Google bloquear com "Esse navegador ou app pode não ser seguro".
  try {
    if (window.PublicKeyCredential) {
      delete window.PublicKeyCredential;
    }
    if (navigator.credentials) {
      navigator.credentials.get = () => Promise.reject(new DOMException('WebAuthn not supported in this context', 'NotSupportedError'));
    }
  } catch (_) {}

  // 8. Remove marcas do Electron se houver
  if (window.process && window.process.versions) {
    try {
      delete window.process;
    } catch (_) {}
  }

  // 9. Auto-recuperação do desafio "Esse navegador ou app pode não ser seguro"
  // Quando o Google apresenta a tela com o botão "Tentar novamente", o script
  // detecta e clica automaticamente para prosseguir sem travar o usuário.
  function setupAutoRetryObserver() {
    let retryAttempted = false;

    const checkAndRetry = () => {
      if (retryAttempted) return;
      try {
        const bodyText = document.body ? document.body.innerText : '';
        const isChallenge = bodyText.includes('Não foi possível fazer o login') ||
                            bodyText.includes('Esse navegador ou app pode não ser seguro') ||
                            bodyText.includes('This browser or app may not be secure') ||
                            bodyText.includes("Couldn't sign you in");

        if (isChallenge) {
          const allButtons = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
          const retryBtn = allButtons.find(b => {
            const txt = (b.textContent || '').trim().toLowerCase();
            return txt === 'tentar novamente' || txt === 'try again' || txt === 'repetir';
          });

          if (retryBtn) {
            retryAttempted = true;
            console.log('[AntiDetection] Desafio do Google detectado. Acionando "Tentar novamente" automaticamente...');
            setTimeout(() => {
              retryBtn.click();
            }, 250);
          }
        }
      } catch (_) {}
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      checkAndRetry();
    } else {
      window.addEventListener('DOMContentLoaded', checkAndRetry);
    }

    const observer = new MutationObserver(() => {
      checkAndRetry();
    });

    if (document.documentElement) {
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  setupAutoRetryObserver();

} catch (err) {
  // Falha silenciosa para não travar o carregamento do login
}
