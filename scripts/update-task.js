async function updateTask() {
  const message = "updateTask";

  const url = window.location.href;
  const aet = +document
    .querySelector(".ewok-estimated-task-weight")
    .textContent.split(" ")[2];

  const currentTask = {
    id: url.substring(url.indexOf("=") + 1),
    startTime: Date.now(),
    aet,
    submitted: false,
  };

  const { settings, task } = await chrome.storage.local.get([
    "settings",
    "task",
  ]);

  chrome.runtime.sendMessage({ message, currentTask, settings, task });
}

updateTask();
