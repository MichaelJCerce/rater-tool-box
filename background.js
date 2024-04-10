chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ minutesWorked: 0 });
});
