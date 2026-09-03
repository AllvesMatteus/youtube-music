const api = window.miniPlayerAPI;
const $ = sel => document.querySelector(sel);
const state = {
  currentTitle: '',
  duration: 0,
  currentTime: 0,
  repeatMode: 0,
  isShuffled: false,
  liked: false
};

function fmt(s) {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const t = Math.floor(s);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

function updateProgress(cur, dur) {
  const pct = dur > 0 ? (cur / dur) * 100 : 0;
  const bar = $('#progress');
  bar.value = pct;
  bar.style.background = `linear-gradient(to right, #fff ${pct}%, rgba(255,255,255,0.2) ${pct}%)`;
}

function resetProgress() {
  state.currentTime = 0;
  $('#current-time').textContent = '0:00';
  const bar = $('#progress');
  bar.value = 0;
  bar.style.background = 'rgba(255,255,255,0.2)';
}

function setRepeatState(mode) {
  state.repeatMode = mode;
  const btn = $('#repeat');
  const img = $('#repeat img');
  if (mode === 1) {
    img.src = '../../../assets/icons/repeat-all.svg';
    btn.classList.add('active');
    btn.style.opacity = '1';
  } else if (mode === 2) {
    img.src = '../../../assets/icons/repeat-one.svg';
    btn.classList.add('active');
    btn.style.opacity = '1';
  } else {
    img.src = '../../../assets/icons/repeat-off.svg';
    btn.classList.remove('active');
    btn.style.opacity = '0.55';
  }
}

function setShuffleState(isShuffled) {
  state.isShuffled = isShuffled;
  const btn = $('#shuffle');
  btn.classList.toggle('active', isShuffled);
  btn.style.opacity = isShuffled ? '1' : '0.55';
}

function setLikeState(liked) {
  state.liked = liked;
  const btn = $('#like');
  const img = $('#like img');
  if (liked) {
    img.src = '../../../assets/icons/like-active.svg';
    btn.classList.add('liked');
    btn.style.opacity = '1';
  } else {
    img.src = '../../../assets/icons/like.svg';
    btn.classList.remove('liked');
    btn.style.opacity = '0.55';
  }
}

function updateTrack(data = {}) {
  if (data.title && data.title !== state.currentTitle) {
    state.currentTitle = data.title;
    resetProgress();
  }

  if (data.title)  $('#title').textContent  = data.title;
  if (data.artist) $('#artist').textContent = data.artist;
  if (data.thumbnail) $('#cover').src = data.thumbnail;

  const dur = Number(data.duration);
  const cur = Number(data.currentTime);

  if (Number.isFinite(dur) && dur > 0) {
    state.duration = dur;
    $('#duration').textContent = fmt(dur);
  }
  if (Number.isFinite(cur)) {
    state.currentTime = cur;
    $('#current-time').textContent = fmt(cur);
    updateProgress(cur, state.duration);
  }

  const img = $('#play-pause img');
  if (img) img.src = data.isPlaying
    ? '../../../assets/icons/pause.svg'
    : '../../../assets/icons/play.svg';

  if (typeof data.isLiked === 'boolean') {
    setLikeState(data.isLiked);
  }

  if (typeof data.repeatMode === 'number') {
    setRepeatState(data.repeatMode);
  }

  if (typeof data.isShuffled === 'boolean') {
    setShuffleState(data.isShuffled);
  }
}

$('#previous').onclick = () => {
  resetProgress();
  api.command('previous');
};

$('#play-pause').onclick = () => api.command('play-pause');

$('#next').onclick = () => {
  resetProgress();
  api.command('next');
};

$('#like').onclick = () => {
  setLikeState(!state.liked);
  api.command('like');
};

$('#repeat').onclick = () => {
  const nextMode = (state.repeatMode + 1) % 3;
  setRepeatState(nextMode);
  api.command('repeat');
};

$('#shuffle').onclick = () => {
  setShuffleState(!state.isShuffled);
  api.command('shuffle');
};

$('#account-button').onclick = () => api.openAccounts();
$('#close-button').onclick   = () => api.close();

$('#progress').oninput = e => {
  const val = Number(e.target.value);
  updateProgress(val, 100);
  api.command({ type: 'seek', value: val });
};

const settingsMenu     = $('#settings-menu');
const settingsButton   = $('#settings');
const settingsBackdrop = $('#settings-backdrop');

function openSettings() {
  settingsMenu.classList.remove('hidden');
  settingsBackdrop.classList.remove('hidden');
}

function closeSettings() {
  settingsMenu.classList.add('hidden');
  settingsBackdrop.classList.add('hidden');
}

settingsButton.onclick = e => {
  e.stopPropagation();
  if (settingsMenu.classList.contains('hidden')) {
    openSettings();
  } else {
    closeSettings();
  }
};

settingsBackdrop.onclick = () => closeSettings();

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSettings();
  if (e.key === 'MediaPlayPause' || e.code === 'MediaPlayPause') {
    api.command('play-pause');
  } else if (e.key === 'MediaTrackNext' || e.code === 'MediaTrackNext') {
    resetProgress();
    api.command('next');
  } else if (e.key === 'MediaTrackPrevious' || e.code === 'MediaTrackPrevious') {
    resetProgress();
    api.command('previous');
  } else if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON') {
    e.preventDefault();
    api.command('play-pause');
  }
});

window.addEventListener('blur', () => closeSettings());

$('#open-full-player').onclick = () => {
  closeSettings();
  api.openMainWindow();
};

$('#exit-app').onclick = () => api.command('exit');

async function loadSettings() {
  const s = await api.getSettings();
  $('#start-with-windows').checked = Boolean(s.startWithWindows);
  $('#close-to-tray').checked      = s.closeBehavior !== 'exit';
  $('#always-on-top').checked      = Boolean(s.alwaysOnTop);
}
$('#start-with-windows').onchange = e => api.setSetting('startWithWindows', e.target.checked);
$('#close-to-tray').onchange      = e => api.setSetting('closeBehavior', e.target.checked ? 'tray' : 'exit');
$('#always-on-top').onchange      = e => api.setSetting('alwaysOnTop', e.target.checked);

resetProgress();
setRepeatState(0);
setShuffleState(false);
setLikeState(false);
api.onTrackState(updateTrack);
loadSettings();
