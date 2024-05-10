const form = document.querySelector("#ewok-task-form");
const submitButton = document.querySelector("#ewok-task-submit-button");
const submitDoneButton = document.querySelector(
  "#ewok-task-submit-done-button"
);

async function updateCurrentTask() {
  const message = "updateTask";
  const { task } = await chrome.storage.local.get("task");

  const currentTask = {
    id: window.location.href.substring(window.location.href.indexOf("=") + 1),
    startTime: Date.now(),
    aet: +document
      .querySelector(".ewok-estimated-task-weight")
      .textContent.split(" ")[2],
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

updateCurrentTask();

submitButton.addEventListener("click", submitTask);
submitDoneButton.addEventListener("click", submitTask);
