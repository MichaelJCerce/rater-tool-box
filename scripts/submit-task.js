const form = document.querySelector("#ewok-task-form");
const submitButton = document.querySelector("#ewok-task-submit-button");
const submitDoneButton = document.querySelector(
  "#ewok-task-submit-done-button"
);

const aet = +document
  .querySelector(".ewok-estimated-task-weight")
  .textContent.split(" ")[2];

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

autoSubmitTask();
