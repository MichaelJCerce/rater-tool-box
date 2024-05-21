const form = document.querySelector("#ewok-task-form");
const submitButton = document.querySelector("#ewok-task-submit-button");
const submitDoneButton = document.querySelector(
  "#ewok-task-submit-done-button"
);

const url = window.location.href;
const aet = +document
  .querySelector(".ewok-estimated-task-weight")
  .textContent.split(" ")[2];

async function updateCurrentTask() {
  const message = "updateTask";
  const { settings, task } = await chrome.storage.local.get([
    "settings",
    "task",
  ]);

  const currentTask = {
    id: url.substring(url.indexOf("=") + 1),
    startTime: Date.now(),
    aet,
    submitted: false,
  };

  chrome.runtime.sendMessage({ message, settings, task, currentTask });
}

async function submitTask(e) {
  e.preventDefault();

  const message = "submitTask";
  const { settings, task, totalAET, totalMinutesWorked } =
    await chrome.storage.local.get([
      "settings",
      "task",
      "totalAET",
      "totalMinutesWorked",
    ]);

  await chrome.runtime.sendMessage({
    message,
    settings,
    task,
    totalAET,
    totalMinutesWorked,
    button: this.id,
  });

  form.requestSubmit(this);
}

async function autoSubmitTask() {
  const { settings } = await chrome.storage.local.get("settings");

  if (settings.autoSubmit) {
    setTimeout(() => {
      submitButton.click();
    }, aet * 60 * 1000);
  }
}

submitButton.addEventListener("click", submitTask);
submitDoneButton.addEventListener("click", submitTask);

updateCurrentTask();
autoSubmitTask();
