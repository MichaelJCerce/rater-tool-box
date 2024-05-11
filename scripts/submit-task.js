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
  const { task } = await chrome.storage.local.get("task");

  const currentTask = {
    id: url.substring(url.indexOf("=") + 1),
    startTime: Date.now(),
    aet,
    submitted: false,
  };

  chrome.runtime.sendMessage({ message, task, currentTask });
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
  const button =
    e.target.id === submitButton.id ? submitButton : submitDoneButton;

  await chrome.runtime.sendMessage({
    message,
    settings,
    task,
    totalAET,
    totalMinutesWorked,
    button: button.id,
  });

  form.requestSubmit(button);
}

async function autoSubmitTask() {
  const { settings } = await chrome.storage.local.get("settings");

  if (settings.autoSubmit) {
    setTimeout(() => {
      submitButton.click();
    }, aet * 60 * 1000);
  }
}
updateCurrentTask();
autoSubmitTask();

submitButton.addEventListener("click", submitTask);
submitDoneButton.addEventListener("click", submitTask);
