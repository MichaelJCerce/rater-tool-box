function requestReload() {
  chrome.runtime.sendMessage({ message: "reload" });
}

async function grabTask() {
  const task = document.querySelector(".ewok-rater-task-option a");
  const key = setInterval(requestReload, 10000);
  const { settings } = await chrome.storage.local.get("settings");

  if (task && settings.active) {
    task.click();
  } else if (!settings.active) {
    clearInterval(key);
    settings.active = true;
    chrome.storage.local.set({ settings });
  }
}

grabTask();
