// Vib: Background Orchestrator (Production-Ready)
let vibEnabled = true;

// Initialize state
chrome.storage.local.get(['vibEnabled'], (result) => {
  if (result.vibEnabled !== undefined) {
    vibEnabled = result.vibEnabled;
  } else {
    chrome.storage.local.set({ vibEnabled: true });
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-vib-bar') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'openVibBar' }).catch(() => {
          // Fallback if content script not loaded (e.g. on chrome:// or about: pages)
          console.log('Vib: Cannot open bar on this page.');
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    switch (request.action) {
      case 'toggleVib':
        vibEnabled = !vibEnabled;
        chrome.storage.local.set({ vibEnabled });
        // Notify all tabs
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => chrome.tabs.sendMessage(tab.id, { action: 'stateChanged', enabled: vibEnabled }).catch(() => {}));
        });
        break;
      case 'newTab': chrome.tabs.create({}); break;
      case 'closeTab': chrome.tabs.remove(sender.tab.id); break;
      case 'nextTab':
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
          const activeIndex = tabs.findIndex(t => t.active);
          chrome.tabs.update(tabs[(activeIndex + 1) % tabs.length].id, { active: true });
        });
        break;
      case 'prevTab':
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
          const activeIndex = tabs.findIndex(t => t.active);
          chrome.tabs.update(tabs[(activeIndex - 1 + tabs.length) % tabs.length].id, { active: true });
        });
        break;
      case 'newWindow': chrome.windows.create({ incognito: !!request.incognito }); break;
      case 'openHistory': chrome.tabs.create({ url: 'chrome://history' }); break;
      case 'openSettings': chrome.runtime.openOptionsPage(); break;
    }
  } catch (e) {
    console.error('Vib Background Error:', e);
  }
});
