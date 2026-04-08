// Vib: Minimalist & Compatible Navigation Intelligence (Shadow DOM Edition)
let vibEnabled = true;
let targetScrollY = window.scrollY;
let currentScrollY = window.scrollY;
let scrollVelocity = 0;
let scrollableElements = [];
let currentScrollIndex = -1;

// Universal Vib Bar State
let isVibBarOpen = false;
let vibResults = [];
let selectedResIndex = 0;
let vibInput = null;
let pageElements = [];
let vibShadowRoot = null;

const VIB_STYLES = `
  :host {
    --vib-accent: #00ff88;
    --vib-bg: rgba(15, 15, 15, 0.85);
    --vib-border: rgba(255, 255, 255, 0.1);
  }
  .vib-overlay {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: 2147483647;
    font-family: 'Inter', -apple-system, sans-serif;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    background: rgba(0,0,0,0.4);
    backdrop-filter: blur(8px);
    pointer-events: auto;
  }
  .vib-bar-container {
    margin-top: 15vh;
    width: 550px;
    max-width: 90vw;
    background: var(--vib-bg);
    backdrop-filter: blur(30px) saturate(160%);
    border: 1px solid var(--vib-border);
    border-radius: 20px;
    box-shadow: 0 30px 80px rgba(0,0,0,0.6);
    padding: 8px;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .vib-bar-input {
    width: 100%;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 18px;
    padding: 16px 20px;
    outline: none;
    box-sizing: border-box;
  }
  .vib-bar-results {
    max-height: 350px;
    overflow-y: auto;
    padding: 5px;
  }
  .vib-res-item {
    padding: 12px 18px;
    border-radius: 12px;
    color: rgba(255,255,255,0.6);
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 14px;
    transition: 0.2s;
    cursor: pointer;
  }
  .vib-res-item.selected {
    background: rgba(255,255,255,0.08);
    color: var(--vib-accent);
  }
  .vib-icon { width: 16px; height: 16px; flex-shrink: 0; opacity: 0.7; }
  .selected .vib-icon { opacity: 1; filter: drop-shadow(0 0 5px var(--vib-accent)); }
  .type-tag { margin-left: auto; font-size: 10px; opacity: 0.5; text-transform: uppercase; letter-spacing: 1px; }

  /* Guide Panel */
  .vib-guide-panel {
    background: var(--vib-bg);
    backdrop-filter: blur(40px);
    border: 1px solid var(--vib-border);
    border-radius: 24px;
    padding: 35px;
    width: 550px;
    color: #fff;
    margin-top: 10vh;
  }
  .key {
    background: rgba(0,255,136,0.1);
    color: var(--vib-accent);
    padding: 3px 8px;
    border-radius: 6px;
    font-weight: 700;
    font-family: monospace;
    font-size: 12px;
    border: 1px solid rgba(0,255,136,0.2);
  }
  .guide-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
`;

const ICONS = {
  link: `<svg class="vib-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
  cmd: `<svg class="vib-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
  skip: `<svg class="vib-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>`
};

// State Manager
let scrollEnabled = true;
let autoSkipEnabled = true;
let deepIndexing = false;

function updateSettings(result) {
  if (result.vibEnabled !== undefined) vibEnabled = result.vibEnabled;
  if (result.scrollEnabled !== undefined) scrollEnabled = result.scrollEnabled;
  if (result.autoSkipEnabled !== undefined) autoSkipEnabled = result.autoSkipEnabled;
  if (result.deepIndexing !== undefined) deepIndexing = result.deepIndexing;
}

chrome.storage.local.get(['vibEnabled', 'scrollEnabled', 'autoSkipEnabled', 'deepIndexing'], updateSettings);
chrome.storage.onChanged.addListener((changes) => {
  const newValues = {};
  for (let [key, { newValue }] of Object.entries(changes)) newValues[key] = newValue;
  updateSettings(newValues);
});

chrome.runtime.onMessage.addListener((request) => { 
  if (request.action === 'openVibBar') openVibBar();
});

function safeRun(fn) {
  return function(...args) { try { return fn.apply(this, args); } catch (e) { console.error('Vib Error:', e); } };
}

// Rebuild UI with Shadow DOM
function createVibHost() {
  const host = document.createElement('div');
  host.id = 'vib-shadow-host';
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = VIB_STYLES;
  shadow.appendChild(style);
  return shadow;
}

const openVibBar = safeRun(() => {
  if (isVibBarOpen || !vibEnabled) return;
  if (window !== window.top && (window.innerWidth < 150 || window.innerHeight < 150)) return;
  
  isVibBarOpen = true;
  vibShadowRoot = createVibHost();
  
  const overlay = document.createElement('div');
  overlay.className = 'vib-overlay';
  overlay.innerHTML = `
    <div class="vib-bar-container">
      <input type="text" class="vib-bar-input" placeholder="Search page, commands..." spellcheck="false">
      <div class="vib-bar-results"></div>
    </div>
  `;
  
  vibShadowRoot.appendChild(overlay);
  vibInput = vibShadowRoot.querySelector('.vib-bar-input');
  vibInput.focus();

  // Advanced Indexing for "All" Elements
  const selector = `
    a, button, input, textarea, select, [role="button"], [role="link"], [role="textbox"], 
    [role="menuitem"], [role="tab"], [role="checkbox"], [contenteditable="true"], 
    [onclick], [jsaction], [tabindex]:not([tabindex="-1"]), 
    summary, details, .btn, .button, .clickable
  `.trim();

  pageElements = Array.from(document.querySelectorAll(selector))
    .map(el => {
      const rect = el.getBoundingClientRect();
      // Only index elements that are likely visible or have some presence
      if (rect.width === 0 && rect.height === 0) return null;

      // Multi-attribute text extraction
      let text = (
        el.innerText || 
        el.placeholder || 
        el.value || 
        el.getAttribute('aria-label') || 
        el.getAttribute('title') || 
        el.getAttribute('alt') || 
        el.getAttribute('data-placeholder') ||
        ''
      ).toLowerCase().trim();

      // Fallback for icons/images: check parents or specific attributes
      if (!text && el.tagName === 'IMG') text = el.alt || el.title;
      if (!text) {
        // Try to find the closest text node
        const firstText = Array.from(el.childNodes).find(n => n.nodeType === 3 && n.textContent.trim());
        if (firstText) text = firstText.textContent.trim().toLowerCase();
      }

      return text ? { el, text, type: 'page' } : null;
    }).filter(e => e);


  vibInput.oninput = (e) => handleSearch(e.target.value);
  vibInput.onkeydown = handleKeydown;
  overlay.onclick = (e) => { if (e.target === overlay) closeVibBar(); };
});

function handleSearch(query) {
  query = query.toLowerCase().trim();
  const commands = [
    { text: 'new tab', action: 'newTab', type: 'cmd' },
    { text: 'close tab', action: 'closeTab', type: 'cmd' },
    { text: 'next tab', action: 'nextTab', type: 'cmd' },
    { text: 'prev tab', action: 'prevTab', type: 'cmd' },
    { text: 'settings', action: 'openSettings', type: 'cmd' },
    { text: 'skip ad', action: 'skipAd', type: 'skip' }
  ].filter(c => !query || c.text.includes(query));

  // Better sorting: exact matches first, then starts with, then contains
  const matches = pageElements.filter(e => e.text.includes(query))
    .sort((a, b) => {
      if (a.text === query) return -1;
      if (b.text === query) return 1;
      if (a.text.startsWith(query)) return -1;
      if (b.text.startsWith(query)) return 1;
      return a.text.length - b.text.length;
    })
    .slice(0, 15);
    
  renderResults([...commands, ...matches]);
}

function renderResults(results) {
  vibResults = results;
  selectedResIndex = 0;
  const list = vibShadowRoot.querySelector('.vib-bar-results');
  list.innerHTML = '';
  
  results.forEach((res, i) => {
    const item = document.createElement('div');
    item.className = `vib-res-item ${i === 0 ? 'selected' : ''}`;
    item.innerHTML = `
      ${ICONS[res.type] || ICONS.link}
      <span>${res.text}</span>
      <span class="type-tag">${res.type || 'link'}</span>
    `;
    item.onclick = () => executeResult(res);
    list.appendChild(item);
  });
}

function handleKeydown(e) {
  if (e.key === 'ArrowDown') { selectedResIndex = (selectedResIndex + 1) % vibResults.length; updateSelection(); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { selectedResIndex = (selectedResIndex - 1 + vibResults.length) % vibResults.length; updateSelection(); e.preventDefault(); }
  else if (e.key === 'Enter') { executeResult(vibResults[selectedResIndex]); e.preventDefault(); }
  else if (e.key === 'Escape') closeVibBar();
}

function updateSelection() {
  const items = vibShadowRoot.querySelectorAll('.vib-res-item');
  items.forEach((item, i) => item.classList.toggle('selected', i === selectedResIndex));
}

function executeResult(res) {
  if (!res) return;
  if (res.action === 'skipAd') trySkipAd();
  else if (res.action) chrome.runtime.sendMessage(res);
  else {
    const el = res.el;
    // Dispatch comprehensive event sequence
    const events = ['mousedown', 'focus', 'click', 'mouseup'];
    events.forEach(type => {
      const ev = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        view: window
      });
      el.dispatchEvent(ev);
    });
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) el.focus();
  }
  closeVibBar();
}

function closeVibBar() {
  isVibBarOpen = false;
  const host = document.getElementById('vib-shadow-host');
  if (host) host.remove();
}

// Global Key Listener
window.addEventListener('keydown', (e) => {
  const isSpace = e.key === ' ' || e.code === 'Space';
  if ((e.ctrlKey || e.metaKey) && isSpace) {
    openVibBar();
    e.preventDefault();
    return;
  }
  
  if (isVibBarOpen) return; // Bar handles its own keys
  
  if (e.key === '?') { showGuide(); return; }
  
  // Scrolling
  if (!vibEnabled || !scrollEnabled || isEditable(document.activeElement)) return;
  if (e.key === 'ArrowDown') smoothScrollBy(40);
  if (e.key === 'ArrowUp') smoothScrollBy(-40);
}, true);

function showGuide() {
  if (isVibBarOpen) return;
  const shadow = createVibHost();
  const overlay = document.createElement('div');
  overlay.className = 'vib-overlay';
  overlay.innerHTML = `
    <div class="vib-guide-panel">
      <h2 style="color:var(--vib-accent); margin-bottom:25px;">Vib Commands</h2>
      <div class="guide-row"><span>Search Bar</span> <span class="key">Ctrl + Space</span></div>
      <div class="guide-row"><span>Smooth Scroll</span> <span class="key">↓ / ↑</span></div>
      <div class="guide-row"><span>Toggle Guide</span> <span class="key">?</span></div>
      <div class="guide-row"><span>New Tab</span> <span class="key">Ctrl + T</span></div>
      <div class="guide-row"><span>Close Tab</span> <span class="key">Ctrl + W</span></div>
      <div style="margin-top:20px; font-size:11px; opacity:0.4; text-align:center;">Vib Isolated Shadow UI v1.0</div>
    </div>
  `;
  shadow.appendChild(overlay);
  overlay.onclick = () => document.getElementById('vib-shadow-host').remove();
}

function isEditable(el) {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable;
}

// Momentum Scrolling
const SCROLL_ACCEL = 40;
const SCROLL_FRICTION = 0.85;

function smoothScrollBy(amount) {
  scrollVelocity += amount;
  if (Math.abs(scrollVelocity) > 150) scrollVelocity = Math.sign(scrollVelocity) * 150;
  if (!window._vibLoop) {
    window._vibLoop = true;
    const loop = () => {
      if (Math.abs(scrollVelocity) > 0.5) {
        window.scrollBy(0, scrollVelocity);
        scrollVelocity *= SCROLL_FRICTION;
        requestAnimationFrame(loop);
      } else {
        scrollVelocity = 0;
        window._vibLoop = false;
      }
    };
    requestAnimationFrame(loop);
  }
}
