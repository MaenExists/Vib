const toggleBtn = document.getElementById('toggle-btn');
const badge = document.getElementById('status-badge');

function updateUI(enabled) {
  badge.textContent = enabled ? 'Active' : 'Disabled';
  badge.className = 'status' + (enabled ? '' : ' disabled');
  toggleBtn.textContent = (enabled ? 'Disable' : 'Enable') + ' Vib';
}

chrome.storage.local.get(['vibEnabled'], (result) => {
  const enabled = result.vibEnabled !== false;
  updateUI(enabled);
});

toggleBtn.addEventListener('click', () => {
  chrome.storage.local.get(['vibEnabled'], (result) => {
    const currentState = result.vibEnabled !== false;
    const newState = !currentState;
    chrome.runtime.sendMessage({ action: 'toggleVib' });
    updateUI(newState);
  });
});

document.getElementById('open-settings').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
