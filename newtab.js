const input = document.querySelector('.vib-newtab-input');
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date');
const assetsContainer = document.getElementById('assets-container');
const openSettingsBtn = document.getElementById('open-settings-btn');

let shortcuts = [];

// Clock Logic
function updateClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// Load & Render Shortcuts
function renderShortcuts() {
  chrome.storage.local.get(['vibShortcuts'], (result) => {
    shortcuts = result.vibShortcuts || [
      { name: 'GitHub', url: 'https://github.com' },
      { name: 'YouTube', url: 'https://youtube.com' },
      { name: 'Twitter', url: 'https://twitter.com' },
      { name: 'Gmail', url: 'https://gmail.com' }
    ];
    
    assetsContainer.innerHTML = '';
    shortcuts.slice(0, 9).forEach((s, i) => {
      const card = document.createElement('a');
      card.href = s.url.startsWith('http') ? s.url : `https://${s.url}`;
      card.className = 'asset-card';
      card.dataset.index = i + 1;
      card.innerHTML = `
        <span class="asset-key">${i + 1}</span>
        <span class="asset-name">${s.name}</span>
      `;
      assetsContainer.appendChild(card);
    });
  });
}

renderShortcuts();

// Navigation & Global Keybindings
window.addEventListener('keydown', (e) => {
  const isNumber = /^[1-9]$/.test(e.key);
  const inputEmpty = input.value.trim() === '';
  
  if (isNumber && (document.activeElement !== input || inputEmpty)) {
    const card = document.querySelector(`.asset-card[data-index="${e.key}"]`);
    if (card) {
      card.classList.add('active');
      setTimeout(() => window.location.href = card.href, 150);
      e.preventDefault();
      return;
    }
  }

  if (e.key === 'Escape') input.blur();

  if (document.activeElement !== input && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !isNumber) {
    input.focus();
  }
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    let query = input.value.trim();
    if (!query) return;

    if (query.includes('.') && !query.includes(' ')) {
      if (!query.startsWith('http')) query = 'https://' + query;
      window.location.href = query;
    } else {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
  }
});

// Settings button
openSettingsBtn.onclick = () => chrome.runtime.openOptionsPage();

// Visual Interaction
input.addEventListener('input', (e) => {
  const opacity = Math.max(0.1, 1 - (e.target.value.length / 15));
  clockEl.style.opacity = opacity;
  dateEl.style.opacity = opacity * 0.5;
  clockEl.style.transform = `scale(${0.9 + (opacity * 0.1)})`;
});
