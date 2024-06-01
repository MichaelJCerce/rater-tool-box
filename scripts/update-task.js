async function updateTask() {
  const message = "updateTask";

  const url = window.location.href;
  const aet = +document
    .querySelector(".ewok-estimated-task-weight")
    .textContent.split(" ")[2];

  const currentTask = {
    id: url.substring(url.indexOf("=") + 1),
    aet,
  };

  const { settings, tasks } = await chrome.storage.local.get([
    "settings",
    "tasks",
  ]);

  chrome.runtime.sendMessage({ message, currentTask, settings, tasks });
}

updateTask();
