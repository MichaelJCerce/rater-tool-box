function requestReload() {
  const message = "reload";
  chrome.runtime.sendMessage({ message });
}

async function autoGrabTask() {
  const { settings } = await chrome.storage.local.get("settings");
  if (settings.autoGrab) {
    const task = document.querySelector(".ewok-rater-task-option a");
    const intervalKey = setInterval(requestReload, 10000);

    if (task && settings.tempAutoGrab) {
      task.click();
    } else if (!settings.tempAutoGrab) {
      clearInterval(intervalKey);

      const message = "activateTempAutoGrab";
      chrome.runtime.sendMessage({ message, settings });
    }
  }
}

autoGrabTask();
