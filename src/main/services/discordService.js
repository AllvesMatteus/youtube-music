const EventEmitter = require('events');
const { Socket } = require('net');
const { randomUUID } = require('crypto');
const settingsService = require('./settingsService');

const DISCORD_CLIENT_ID = '1143202598460076053';

const OPCode = {
  HANDSHAKE: 0,
  FRAME: 1,
  CLOSE: 2,
  PING: 3,
  PONG: 4
};

function getIPCPath(id) {
  if (process.platform === 'win32') {
    return `\\\\?\\pipe\\discord-ipc-${id}`;
  }
  const prefix = (process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || process.env.TMP || process.env.TEMP || '/tmp').replace(/\/$/, '');
  return `${prefix}/discord-ipc-${id}`;
}

class IPCClient extends EventEmitter {
  constructor() {
    super();
    this.createSocket();
  }

  createSocket() {
    this.socket = new Socket();
    this.socket.on('connect', () => this.emit('connect'));
    this.socket.on('close', (hadError) => this.emit('close', hadError));
    this.socket.on('error', (err) => this.emit('error', err));
    this.socket.on('data', (buffer) => {
      try {
        const op = buffer.readInt32LE(0);
        const length = buffer.readInt32LE(4);
        const json = JSON.parse(buffer.toString('utf8', 8, 8 + length));
        this.emit('data', { op, json });
      } catch (_) {}
    });
  }

  connect(ipcPath) {
    if (this.socket.destroyed) {
      this.createSocket();
    }
    this.socket.connect(ipcPath);
  }

  send(data, op = OPCode.FRAME) {
    try {
      const json = JSON.stringify(data);
      const length = Buffer.byteLength(json);
      const buffer = Buffer.alloc(8 + length);
      buffer.writeInt32LE(op, 0);
      buffer.writeInt32LE(length, 4);
      buffer.write(json, 8, length, 'utf8');
      this.socket.write(buffer);
    } catch (_) {}
  }

  destroy() {
    try {
      this.socket.destroy();
    } catch (_) {}
  }
}

class DiscordService {
  constructor() {
    this.ipc = new IPCClient();
    this.connected = false;
    this.connecting = false;
    this.reconnectTimer = null;
    this.lastState = null;
    this.updateDebounce = null;
  }

  init() {
    if (settingsService.get('discordPresence') !== false) {
      this.connect();
    }
  }

  connect() {
    if (this.connected || this.connecting) return;
    this.connecting = true;

    const tryConnect = async () => {
      for (let id = 0; id < 10; id++) {
        const path = getIPCPath(id);
        const success = await new Promise((resolve) => {
          const onConnect = () => {
            cleanup();
            resolve(true);
          };
          const onError = () => {
            cleanup();
            resolve(false);
          };
          const onClose = () => {
            cleanup();
            resolve(false);
          };
          const cleanup = () => {
            this.ipc.socket.removeListener('connect', onConnect);
            this.ipc.socket.removeListener('error', onError);
            this.ipc.socket.removeListener('close', onClose);
          };

          this.ipc.socket.once('connect', onConnect);
          this.ipc.socket.once('error', onError);
          this.ipc.socket.once('close', onClose);

          try {
            this.ipc.connect(path);
          } catch (_) {
            cleanup();
            resolve(false);
          }
        });

        if (success) {
          this.connected = true;
          this.connecting = false;

          this.ipc.send({
            v: 1,
            client_id: DISCORD_CLIENT_ID
          }, OPCode.HANDSHAKE);

          this.ipc.on('close', () => {
            this.connected = false;
            this.scheduleReconnect();
          });

          this.ipc.on('data', ({ op, json }) => {
            if (op === OPCode.PING) {
              this.ipc.send(json, OPCode.PONG);
            }
          });

          if (this.lastState) {
            this.updateActivity(this.lastState);
          }
          return;
        }
      }

      this.connecting = false;
      this.scheduleReconnect();
    };

    tryConnect();
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (settingsService.get('discordPresence') === false) return;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 15000);
  }

  updateActivity(state) {
    this.lastState = state;
    if (settingsService.get('discordPresence') === false) {
      if (this.connected) this.clearActivity();
      return;
    }

    if (!this.connected) {
      this.connect();
      return;
    }

    if (this.updateDebounce) clearTimeout(this.updateDebounce);
    this.updateDebounce = setTimeout(() => {
      if (!state || !state.title) {
        this.clearActivity();
        return;
      }

      const isPlaying = Boolean(state.isPlaying);
      const currentTime = Number(state.currentTime) || 0;
      const duration = Number(state.duration) || 0;

      const activity = {
        type: 2, // Listening
        details: state.title.length > 128 ? state.title.slice(0, 125) + '...' : state.title,
        state: state.artist ? (state.artist.length > 128 ? state.artist.slice(0, 125) + '...' : state.artist) : 'YouTube Music',
        timestamps: isPlaying ? {
          start: Math.floor(Date.now() - (currentTime * 1000)),
          end: duration > 0 ? Math.floor(Date.now() + ((duration - currentTime) * 1000)) : undefined
        } : undefined,
        assets: {
          large_image: state.thumbnail && state.thumbnail.startsWith('http') ? state.thumbnail : 'ytm-logo',
          large_text: state.title,
          small_image: isPlaying ? 'play-border' : 'pause-border',
          small_text: isPlaying ? 'Reproduzindo' : 'Pausado'
        },
        buttons: [
          {
            label: 'Ouvir no YouTube Music',
            url: 'https://music.youtube.com'
          }
        ]
      };

      this.ipc.send({
        cmd: 'SET_ACTIVITY',
        args: {
          pid: process.pid,
          activity
        },
        nonce: randomUUID()
      });
    }, 300);
  }

  clearActivity() {
    if (!this.connected) return;
    try {
      this.ipc.send({
        cmd: 'SET_ACTIVITY',
        args: {
          pid: process.pid
        },
        nonce: randomUUID()
      });
    } catch (_) {}
  }

  destroy() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.updateDebounce) clearTimeout(this.updateDebounce);
    this.clearActivity();
    this.ipc.destroy();
    this.connected = false;
  }
}

module.exports = new DiscordService();
