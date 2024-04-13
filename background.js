chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ totalAET: 0, minutesWorked: 0, task: {}})
});
