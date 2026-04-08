const input = document.querySelector('.vib-newtab-input');
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date');

// Clock Logic
function updateClock() {
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// Navigation Logic
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

// Quick Jump Logic (Alt + Key)
window.addEventListener('keydown', (e) => {
  if (e.altKey) {
    const card = document.querySelector(`.asset-card[data-key="${e.key.toLowerCase()}"]`);
    if (card) {
      card.classList.add('active');
      setTimeout(() => window.location.href = card.href, 150);
      e.preventDefault();
    }
  }
});

// Auto-focus search on any keypress (if not in input)
window.addEventListener('keydown', (e) => {
  if (document.activeElement !== input && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
    input.focus();
  }
});

// Visual Interaction
input.addEventListener('input', (e) => {
  const opacity = Math.max(0.1, 1 - (e.target.value.length / 20));
  clockEl.style.opacity = opacity;
  dateEl.style.opacity = opacity * 0.6;
  clockEl.style.transform = `scale(${0.8 + (opacity * 0.2)})`;
  clockEl.style.transition = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
});
