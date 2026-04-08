const shortcutList = document.getElementById('shortcut-list');
const addShortcutBtn = document.getElementById('add-shortcut-btn');
const status = document.getElementById('status');

let shortcuts = [];

// Load everything
function loadSettings() {
  chrome.storage.local.get(['scrollEnabled', 'autoSkipEnabled', 'vibShortcuts'], (result) => {
    document.getElementById('scrollEnabled').checked = result.scrollEnabled !== false;
    document.getElementById('autoSkipEnabled').checked = result.autoSkipEnabled !== false;
    
    shortcuts = result.vibShortcuts || [
      { name: 'GitHub', url: 'https://github.com' },
      { name: 'YouTube', url: 'https://youtube.com' },
      { name: 'Twitter', url: 'https://twitter.com' },
      { name: 'Gmail', url: 'https://gmail.com' }
    ];
    renderShortcuts();
  });
}

function renderShortcuts() {
  shortcutList.innerHTML = '';
  shortcuts.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'shortcut-row';
    row.innerHTML = `
      <input type="text" class="shortcut-input" value="${s.name}" data-index="${i}" data-field="name" placeholder="Name">
      <input type="text" class="shortcut-input" value="${s.url}" data-index="${i}" data-field="url" placeholder="URL">
      <button class="btn-delete" data-index="${i}">Delete</button>
    `;
    shortcutList.appendChild(row);
  });
  
  // Attach listeners
  document.querySelectorAll('.shortcut-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = e.target.dataset.index;
      const field = e.target.dataset.field;
      shortcuts[idx][field] = e.target.value;
      saveAll();
    });
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.onclick = (e) => {
      shortcuts.splice(e.target.dataset.index, 1);
      saveAll();
      renderShortcuts();
    };
  });

  addShortcutBtn.disabled = shortcuts.length >= 9;
}

function saveAll() {
  const data = {
    scrollEnabled: document.getElementById('scrollEnabled').checked,
    autoSkipEnabled: document.getElementById('autoSkipEnabled').checked,
    vibShortcuts: shortcuts
  };
  
  chrome.storage.local.set(data, () => {
    showStatus();
  });
}

function showStatus() {
  status.style.opacity = '1';
  status.style.bottom = '50px';
  setTimeout(() => {
    status.style.opacity = '0';
    status.style.bottom = '40px';
  }, 2000);
}

// Global Listeners
document.getElementById('scrollEnabled').onchange = saveAll;
document.getElementById('autoSkipEnabled').onchange = saveAll;

addShortcutBtn.onclick = () => {
  if (shortcuts.length < 9) {
    shortcuts.push({ name: '', url: '' });
    renderShortcuts();
    saveAll();
  }
};

document.addEventListener('DOMContentLoaded', loadSettings);
