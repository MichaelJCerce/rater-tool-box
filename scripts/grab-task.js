let autoGrabInterval;
let tempAutoGrab;

async function autoGrabTask() {
  const { settings } = await chrome.storage.local.get("settings");
  tempAutoGrab = settings.tempAutoGrab;

  if (settings.autoGrab) {
    const task = document.querySelector(".ewok-rater-task-option a");
    autoGrabInterval = setInterval(
      () => chrome.runtime.sendMessage({ message: "reload" }),
      10000
    );

    if (task && tempAutoGrab) {
      task.click();
    } else if (!tempAutoGrab) {
      clearInterval(autoGrabInterval);

      const message = "activateTempAutoGrab";
      chrome.runtime.sendMessage({ message, settings });
    }
  }
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.message === "toggleAutoGrab") {
    const { settings } = await chrome.storage.local.get("settings");

    if (!settings.autoGrab) {
      clearInterval(autoGrabInterval);
    } else if (tempAutoGrab) {
      autoGrabInterval = setInterval(
        () => chrome.runtime.sendMessage({ message: "reload" }),
        10000
      );
    }
  }
});

autoGrabTask();
