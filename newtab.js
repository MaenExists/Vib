const input = document.querySelector('.vib-newtab-input');

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

// Focus on start
window.addEventListener('focus', () => input.focus());
input.focus();

// Add some interaction
input.addEventListener('input', (e) => {
  const h1 = document.querySelector('h1');
  if (e.target.value.length > 0) {
    h1.style.opacity = '0.3';
    h1.style.transform = 'scale(0.8)';
  } else {
    h1.style.opacity = '0.9';
    h1.style.transform = 'scale(1)';
  }
  h1.style.transition = 'all 0.5s ease';
});
