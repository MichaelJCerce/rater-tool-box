function requestReload() {
  const message = "reload";
  chrome.runtime.sendMessage({ message });
}

async function grabTask() {
  const { settings } = await chrome.storage.local.get("settings");
  const task = document.querySelector(".ewok-rater-task-option a");
  const intervalKey = setInterval(requestReload, 10000);

  if (task && settings.active) {
    task.click();
  } else if (!settings.active) {
    clearInterval(intervalKey);

    const message = "activateGrabTask";
    chrome.runtime.sendMessage({ message, settings });
  }
}

grabTask();
