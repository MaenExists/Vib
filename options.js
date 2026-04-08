const settings = [
  'scrollEnabled',
  'newTabEnabled',
  'autoSkipEnabled',
  'deepIndexing'
];

function saveSettings() {
  const data = {};
  settings.forEach(id => {
    data[id] = document.getElementById(id).checked;
  });
  
  chrome.storage.local.set(data, () => {
    const status = document.getElementById('status');
    status.style.opacity = '1';
    setTimeout(() => {
      status.style.opacity = '0';
    }, 2000);
  });
}

function loadSettings() {
  chrome.storage.local.get(settings, (result) => {
    settings.forEach(id => {
      // Default to true for most, false for deepIndexing
      const defaultValue = id !== 'deepIndexing';
      document.getElementById(id).checked = result[id] !== undefined ? result[id] : defaultValue;
    });
  });
}

document.addEventListener('DOMContentLoaded', loadSettings);
settings.forEach(id => {
  document.getElementById(id).addEventListener('change', saveSettings);
});
