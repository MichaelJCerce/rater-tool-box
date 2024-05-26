let autoGrabInterval;

async function autoGrabTask() {
  const { settings } = await chrome.storage.local.get("settings");

  if (settings.autoGrab) {
    const task = document.querySelector(".ewok-rater-task-option a");
    autoGrabInterval = setInterval(
      () => chrome.runtime.sendMessage({ message: "reload" }),
      10000
    );

    if (task && settings.tempAutoGrab) {
      task.click();
    } else if (!settings.tempAutoGrab) {
      clearInterval(autoGrabInterval);

      const message = "activateTempAutoGrab";
      chrome.runtime.sendMessage({ message, settings });
    }
  }
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.message === "updateTabs") {
    clearInterval(autoGrabInterval);

    const { settings } = await chrome.storage.local.get("settings");
    if (settings.autoGrab) {
      autoGrabTask();
    }
  }
});

autoGrabTask();
