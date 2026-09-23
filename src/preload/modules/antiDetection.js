function applyAntiDetection() {
  // Nao modificamos prototipos nativos de navigator.webdriver ou plugins,
  // pois scripts de deteccao de automacao do Google verificam se foram
  // adulterados via Object.getOwnPropertyDescriptor.
}

module.exports = { applyAntiDetection };