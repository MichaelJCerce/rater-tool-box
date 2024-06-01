const form = document.querySelector("#ewok-task-form");
const submitButton = document.querySelector("#ewok-task-submit-button");
const submitDoneButton = document.querySelector(
  "#ewok-task-submit-done-button"
);

let autoSubmitInterval;

async function submitTask(e) {
  e.preventDefault();

  const message = "submitTask";
  const { settings, tasks, workHistory } = await chrome.storage.local.get([
    "settings",
    "tasks",
    "workHistory",
  ]);

  await chrome.runtime.sendMessage({
    message,
    button: this.id,
    settings,
    tasks,
    workHistory,
  });

  this.focus();
  form.requestSubmit(this);
}

async function autoSubmitTask() {
  const { settings, tasks } = await chrome.storage.local.get([
    "settings",
    "tasks",
  ]);
  const url = window.location.href;
  const aet = +document
    .querySelector(".ewok-estimated-task-weight")
    .textContent.split(" ")[2];

  if (
    settings.autoSubmit &&
    !(url.substring(url.indexOf("=") + 1) in tasks.submitted)
  ) {
    const button = settings.autoGrab ? submitButton : submitDoneButton;
    const timeWorked = document
      .querySelector("title")
      .textContent.split(" ")[0];
    const minutes = Number(timeWorked.substring(0, timeWorked.indexOf(":")));
    const seconds = Number(timeWorked.substring(timeWorked.indexOf(":") + 1));
    const totalMinutesWorked = minutes + seconds / 60;

    if (aet - totalMinutesWorked <= 0) {
      button.click();
    } else {
      autoSubmitInterval = setTimeout(
        () => button.click(),
        (aet - totalMinutesWorked) * 60 * 1000
      );
    }
  }
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.message === "updateTabs") {
    clearTimeout(autoSubmitInterval);

    const { settings } = await chrome.storage.local.get("settings");
    if (settings.autoSubmit) {
      autoSubmitTask();
    }
  }
});

submitButton.addEventListener("click", submitTask);
submitDoneButton.addEventListener("click", submitTask);

autoSubmitTask();
