const api = window.miniPlayerAPI;
const $ = selector => document.querySelector(selector);
const state = { duration: 0, currentTime: 0 };

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function updateTrack(data = {}) {
  if (data.title) $('#title').textContent = data.title;
  if (data.artist) $('#artist').textContent = data.artist;
  if (data.thumbnail) $('#cover').src = data.thumbnail;
  state.duration = Number(data.duration) || 0;
  state.currentTime = Number(data.currentTime) || 0;
  $('#duration').textContent = formatTime(state.duration);
  $('#current-time').textContent = formatTime(state.currentTime);
  $('#progress').value = state.duration ? (state.currentTime / state.duration) * 100 : 0;
  const playIcon = $('#play-pause img');
  if (playIcon) playIcon.src = data.isPlaying ? '../../../assets/icons/pause.png' : '../../../assets/icons/play.png';
}

$('#previous').onclick = () => api.command('previous');
$('#play-pause').onclick = () => api.command('play-pause');
$('#next').onclick = () => api.command('next');
$('#like').onclick = () => api.command('like');
$('#repeat').onclick = () => { $('#repeat').classList.toggle('active'); api.command('repeat'); };
$('#shuffle').onclick = () => { $('#shuffle').classList.toggle('active'); api.command('shuffle'); };
$('#account-button').onclick = () => api.openAccounts();
$('#close-button').onclick = () => api.close();
$('#progress').oninput = event => api.command({ type: 'seek', value: Number(event.target.value) });

const settingsMenu = $('#settings-menu');
const settingsButton = $('#settings');

const closeSettingsMenu = () => settingsMenu.classList.add('hidden');

settingsButton.onclick = event => {
  event.stopPropagation();
  settingsMenu.classList.toggle('hidden');
};

document.addEventListener('click', event => {
  const clickedInsideMenu = settingsMenu.contains(event.target);
  const clickedOnSettingsButton = settingsButton.contains(event.target);

  if (!clickedInsideMenu && !clickedOnSettingsButton) {
    closeSettingsMenu();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeSettingsMenu();
});

$('#exit-app').onclick = () => api.command('exit');

async function loadSettings() {
  const settings = await api.getSettings();
  $('#start-with-windows').checked = Boolean(settings.startWithWindows);
  $('#close-to-tray').checked = settings.closeBehavior !== 'exit';
  $('#always-on-top').checked = Boolean(settings.alwaysOnTop);
}

$('#start-with-windows').onchange = event => api.setSetting('startWithWindows', event.target.checked);
$('#close-to-tray').onchange = event => api.setSetting('closeBehavior', event.target.checked ? 'tray' : 'exit');
$('#always-on-top').onchange = event => api.setSetting('alwaysOnTop', event.target.checked);
api.onTrackState(updateTrack);
loadSettings();
