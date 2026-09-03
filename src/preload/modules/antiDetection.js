function applyAntiDetection() {
  Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined,
    configurable: true
  });

  Object.defineProperty(navigator, 'plugins', {
    get: () => [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
      { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
      { name: 'Native Client', filename: 'internal-nacl-plugin' }
    ],
    configurable: true
  });

  Object.defineProperty(navigator, 'languages', {
    get: () => ['pt-BR', 'pt', 'en-US', 'en'],
    configurable: true
  });
}

module.exports = { applyAntiDetection };
