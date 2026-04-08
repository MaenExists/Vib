// Vib: Minimalist & Compatible Navigation Intelligence
let vibEnabled = true;
let targetScrollY = window.scrollY;
let currentScrollY = window.scrollY;
let scrollVelocity = 0;
const SCROLL_ACCEL = 35;
const SCROLL_FRICTION = 0.75;

// Scroll Section Navigation
let scrollableElements = [];
let currentScrollIndex = -1;

// Universal Vib Bar State
let isVibBarOpen = false;
let vibResults = [];
let selectedResIndex = 0;
let vibInput = null;
let pageElements = [];

// Icons
const ICONS = {
  link: `<svg class="vib-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
  cmd: `<svg class="vib-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
  tab: `<svg class="vib-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="20" x2="22" y2="20"></line></svg>`,
  video: `<svg class="vib-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`,
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
  for (let [key, { newValue }] of Object.entries(changes)) {
    newValues[key] = newValue;
  }
  updateSettings(newValues);
});

chrome.runtime.onMessage.addListener((request) => { 
  if (request.action === 'stateChanged') vibEnabled = request.enabled;
  if (request.action === 'openVibBar') openVibBar();
});

// Run Auto-Skip on load
window.addEventListener('load', () => { 
  if (autoSkipEnabled && window.location.hostname.includes('youtube.com')) trySkipAd(); 
});

function safeRun(fn) {
  return function(...args) { try { return fn.apply(this, args); } catch (e) { console.error('Vib Error Protected:', e); } };
}

// Universal Scrolling Engine (High-Precision Momentum)
const SCROLL_ACCEL = 40;
const SCROLL_FRICTION = 0.82;
let scrollVelocity = 0;
let currentScrollTarget = null;
let targetScrollY = 0;
let currentScrollY = 0;

function findBestScrollable(el) {
  if (!el || el === document || el === document.body || el === document.documentElement) return window;
  
  const style = window.getComputedStyle(el);
  const overflow = style.overflowY;
  const isScrollable = (overflow === 'auto' || overflow === 'scroll' || overflow === 'overlay') && el.scrollHeight > el.clientHeight + 5;
  
  if (isScrollable) return el;
  return findBestScrollable(el.parentElement);
}

const scrollLoop = safeRun(() => {
  if (!vibEnabled || !scrollEnabled) return;
  
  if (Math.abs(scrollVelocity) > 0.1) {
    // Determine target (Window or Element)
    let target = currentScrollIndex === -1 ? window : scrollableElements[currentScrollIndex];
    if (!target) target = window;

    if (target === window) {
      targetScrollY += scrollVelocity;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      targetScrollY = Math.max(0, Math.min(targetScrollY, maxScroll));
      
      const diff = targetScrollY - currentScrollY;
      if (Math.abs(diff) > 0.1) {
        currentScrollY += diff * 0.35;
        window.scrollTo(window.scrollX, currentScrollY);
      }
    } else {
      target.scrollTop += scrollVelocity;
    }
    
    scrollVelocity *= SCROLL_FRICTION;
    requestAnimationFrame(scrollLoop);
  } else {
    scrollVelocity = 0;
    window._vibScrolling = false;
  }
});

function smoothScrollBy(amount) {
  // If no specific section selected, try to find the one under cursor or active
  if (currentScrollIndex === -1) {
    const active = document.activeElement;
    const hover = document.querySelector(':hover');
    const best = findBestScrollable(hover || active);
    
    if (best !== window) {
      // Temporary target this element for this scroll session if not already in list
      const idx = scrollableElements.indexOf(best);
      if (idx !== -1) currentScrollIndex = idx;
    }
  }

  // Sync window target on first scroll
  if (currentScrollIndex === -1 && !window._vibScrolling) {
    targetScrollY = window.scrollY;
    currentScrollY = window.scrollY;
  }

  scrollVelocity += (amount > 0 ? SCROLL_ACCEL : -SCROLL_ACCEL);
  if (Math.abs(scrollVelocity) > 180) scrollVelocity = Math.sign(scrollVelocity) * 180;
  
  if (!window._vibScrolling) {
    window._vibScrolling = true;
    requestAnimationFrame(scrollLoop);
  }
}

// Input Detection
function isEditable(el) {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  const role = el.getAttribute('role');
  const isInput = (tag === 'input' && !['button', 'checkbox', 'radio', 'submit'].includes((el.type || '').toLowerCase())) || tag === 'textarea';
  const isContentEditable = el.isContentEditable || el.getAttribute('contenteditable') === 'true' || role === 'textbox' || role === 'combobox';
  return isInput || isContentEditable;
}

// YouTube Auto-Skip Pro - Enhanced for Modern YouTube (2024-2026)
const trySkipAd = safeRun(() => {
  if (!window.location.hostname.includes('youtube.com')) return false;

  const selectors = [
    '.ytp-ad-skip-button-modern',
    '.ytp-ad-skip-button',
    '.ytp-skip-ad-button',
    '.ytp-ad-skip-button-container',
    '.ytp-ad-skip-button-slot',
    'button[aria-label*="Skip"]',
    '.ytp-ad-overlay-close-button'
  ];

  for (const s of selectors) {
    const btn = document.querySelector(s);
    if (btn && (btn.offsetParent !== null || btn.offsetWidth > 0)) {
      btn.click();
      return true;
    }
  }

  // Fallback: Check for buttons containing "Skip" text
  const allButtons = document.querySelectorAll('button');
  for (const btn of allButtons) {
    if (btn.innerText && (btn.innerText.includes('Skip Ad') || btn.innerText.includes('Skip ads'))) {
      if (btn.offsetParent !== null || btn.offsetWidth > 0) {
        btn.click();
        return true;
      }
    }
  }
  return false;
});

// Vib Bar
const openVibBar = safeRun(() => {
  if (isVibBarOpen || !vibEnabled) return;
  // Don't open in tiny iframes (likely trackers/ads)
  if (window !== window.top && (window.innerWidth < 100 || window.innerHeight < 100)) return;
  isVibBarOpen = true;
  const viewport = { top: 0, bottom: window.innerHeight };
  
  const selector = deepIndexing 
    ? 'a, button, input, textarea, [role="button"], [role="link"], [role="textbox"], [contenteditable="true"], div[onclick], span[onclick], nav, section, article'
    : 'a, button, input, textarea, [role="button"], [role="link"], [role="textbox"], [contenteditable="true"]';

  pageElements = Array.from(document.querySelectorAll(selector))
    .map(el => {
      const rect = el.getBoundingClientRect();
      if (!(rect.width > 0 && rect.height > 0 && rect.top < viewport.bottom && rect.bottom > viewport.top)) return null;
      let text = (el.innerText || el.placeholder || el.value || el.ariaLabel || el.getAttribute('data-placeholder') || '').toLowerCase().trim();
      return text ? { el, text, type: 'page', inViewport: true } : null;
    })
    .filter(e => e);

  const container = document.createElement('div');
  container.className = 'vib-overlay vib-bar-overlay';
  container.innerHTML = `<div class="vib-bar-container"><input type="text" class="vib-bar-input" placeholder="Search visible page, commands, or tabs..." spellcheck="false"><div class="vib-bar-results"></div></div>`;
  document.body.appendChild(container);
  vibInput = container.querySelector('.vib-bar-input');
  vibInput.focus();
  vibInput.addEventListener('input', handleVibSearch);
  vibInput.addEventListener('keydown', handleVibKeydown);
});

const handleVibSearch = safeRun((e) => {
  const query = e.target.value.toLowerCase();
  const commands = [
    { text: 'new tab', action: 'newTab', type: 'cmd' },
    { text: 'close tab', action: 'closeTab', type: 'cmd' },
    { text: 'history', action: 'openHistory', type: 'cmd' },
    { text: 'settings', action: 'openSettings', type: 'cmd' },
    { text: 'skip ad', action: 'skipAd', type: 'skip' }
  ].filter(c => !query || c.text.includes(query));

  const matches = pageElements.filter(e => e.text.includes(query)).slice(0, 10);
  updateResults([...commands, ...matches]);
});

function updateResults(results) {
  vibResults = results;
  selectedResIndex = 0;
  const list = document.querySelector('.vib-bar-results');
  if (!list) return;
  list.textContent = '';
  results.forEach((res, i) => {
    const item = document.createElement('div');
    item.className = `vib-res-item ${i === 0 ? 'selected' : ''}`;
    
    const iconSpan = document.createElement('span');
    let iconHTML = ICONS.link;
    if (res.type && ICONS[res.type]) iconHTML = ICONS[res.type];
    else if (res.text.includes('youtube') || res.text.includes('video')) iconHTML = ICONS.video;
    
    const parser = new DOMParser();
    const iconDoc = parser.parseFromString(iconHTML, 'image/svg+xml');
    iconSpan.appendChild(iconDoc.documentElement);
    item.appendChild(iconSpan);

    const textSpan = document.createElement('span');
    textSpan.textContent = res.text;
    item.appendChild(textSpan);

    const typeSpan = document.createElement('span');
    typeSpan.className = 'type-tag';
    typeSpan.textContent = res.type || 'page';
    item.appendChild(typeSpan);

    list.appendChild(item);
  });
  renderSelection();
}

function handleVibKeydown(e) {
  if (e.key === 'ArrowDown') { selectedResIndex = (selectedResIndex + 1) % vibResults.length; renderSelection(); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { selectedResIndex = (selectedResIndex - 1 + vibResults.length) % vibResults.length; renderSelection(); e.preventDefault(); }
  else if (e.key === 'Enter') { executeResult(vibResults[selectedResIndex]); e.preventDefault(); }
  else if (e.key === 'Escape') closeVibBar();
}

function renderSelection() {
  const items = document.querySelectorAll('.vib-res-item');
  items.forEach((item, i) => item.classList.toggle('selected', i === selectedResIndex));
  document.querySelectorAll('.vib-target-glow').forEach(e => e.classList.remove('vib-target-glow'));
  const res = vibResults[selectedResIndex];
  if (res && res.el) res.el.classList.add('vib-target-glow');
}

function executeResult(res) {
  if (!res) return;
  if (res.action === 'skipAd') trySkipAd();
  else if (res.action) chrome.runtime.sendMessage(res);
  else { res.el.click(); if (isEditable(res.el)) res.el.focus(); }
  closeVibBar();
}

function closeVibBar() {
  isVibBarOpen = false;
  const overlay = document.querySelector('.vib-bar-overlay');
  if (overlay) overlay.remove();
  document.querySelectorAll('.vib-target-glow').forEach(e => e.classList.remove('vib-target-glow'));
}

window.addEventListener('keydown', (e) => {
  const isSpace = e.key === ' ' || e.code === 'Space';
  const isTrigger = (e.ctrlKey || e.metaKey) && isSpace;
  if (isTrigger) { openVibBar(); e.preventDefault(); e.stopPropagation(); return; }
  
  if (e.key === 'Escape') {
    if (isVibBarOpen || document.querySelector('.vib-overlay') || isEditable(document.activeElement)) {
      if (document.activeElement) document.activeElement.blur();
      closeVibBar();
      document.querySelectorAll('.vib-overlay').forEach(o => o.remove());
      e.preventDefault(); e.stopPropagation();
    }
    return;
  }
  
  if (!vibEnabled || isVibBarOpen || isEditable(document.activeElement)) return;

  const scrollAmt = 35;
  switch (e.key) {
    case 'ArrowDown': smoothScrollBy(scrollAmt); e.preventDefault(); break;
    case 'ArrowUp': smoothScrollBy(-scrollAmt); e.preventDefault(); break;
    case 'Tab': cycleScrollSection(); e.preventDefault(); break;
    case '?': showGuide(); break;
  }
}, true);

function cycleScrollSection() {
  const elements = Array.from(document.querySelectorAll('*')).filter(el => {
    const style = window.getComputedStyle(el);
    return el.scrollHeight > el.clientHeight + 10 && (style.overflowY === 'auto' || style.overflowY === 'scroll');
  });
  scrollableElements = elements;
  document.querySelectorAll('.vib-scroll-focus').forEach(el => el.classList.remove('vib-scroll-focus'));
  currentScrollIndex = (currentScrollIndex + 1) >= scrollableElements.length ? -1 : currentScrollIndex + 1;
  if (currentScrollIndex !== -1) {
    scrollableElements[currentScrollIndex].classList.add('vib-scroll-focus');
    scrollableElements[currentScrollIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function showGuide() {
  if (window !== window.top) return;
  const overlay = document.createElement('div');
  overlay.className = 'vib-overlay vib-guide-overlay';
  overlay.innerHTML = `
    <div class="vib-guide-panel">
      <h2>Vib Guide</h2>
      <div class="vib-guide-grid" style="grid-template-columns: 1fr 1fr; gap: 12px 30px;">
        <div class="vib-guide-item"><span>Universal Search</span> <span class="key">Ctrl + Space</span></div>
        <div class="vib-guide-item"><span>Smooth Scroll</span> <span class="key">↓ / ↑</span></div>
        <div class="vib-guide-item"><span>Cycle Focus</span> <span class="key">Tab</span></div>
        <div class="vib-guide-item"><span>Universal Exit</span> <span class="key">Esc</span></div>
        <div class="vib-guide-item"><span>Vib Home</span> <span class="key">Ctrl + T</span></div>
        <div class="vib-guide-item"><span>Close Tab</span> <span class="key">Ctrl + W</span></div>
        <div class="vib-guide-item"><span>Reopen Tab</span> <span class="key">C-S-T</span></div>
        <div class="vib-guide-item"><span>History</span> <span class="key">Ctrl + H</span></div>
      </div>
      <p style="margin-top:20px; font-size:11px; opacity:0.5; text-align:center;">Vib is active on all pages, including your new tab.</p>
    </div>`;
  document.body.appendChild(overlay);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

const adObserver = new MutationObserver(() => trySkipAd());
adObserver.observe(document.body, { childList: true, subtree: true });
