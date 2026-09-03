const path = require('path');

module.exports = {
  APP_NAME: 'YouTube Music Desktop',
  YTMUSIC_URL: 'https://music.youtube.com',
  LOGIN_URL: 'https://accounts.google.com/ServiceLogin?service=youtube&continue=https://music.youtube.com',
  CHROME_UA: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  FIREFOX_LOGIN_UA: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0',
  SESSION_PARTITION: 'persist:youtube-music',
  PATHS: {
    PRELOAD: path.join(__dirname, '../../preload/index.js'),
    ASSETS: path.join(__dirname, '../../../assets'),
  },
  WINDOW: {
    DEFAULT_WIDTH: 1280,
    DEFAULT_HEIGHT: 800,
    MIN_WIDTH: 800,
    MIN_HEIGHT: 600,
    BACKGROUND_COLOR: '#030303'
  }
};
