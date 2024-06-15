const form = document.querySelector("#ewok-task-form");
const submitButton = document.querySelector("#ewok-task-submit-button");
const submitDoneButton = document.querySelector(
  "#ewok-task-submit-done-button"
);

let autoSubmitInterval;

async function submitTask(e) {
  e.preventDefault();

  const message = "submitTask";
  const currentPageID = document.querySelector("#taskIds").value;
  const { settings, task, workHistory } = await chrome.storage.local.get([
    "settings",
    "task",
    "workHistory",
  ]);

  await chrome.runtime.sendMessage({
    message,
    button: this.id,
    currentPageID,
    settings,
    task,
    workHistory,
  });

  this.focus();
  form.requestSubmit(this);
}

async function autoSubmitTask() {
  const { settings, workHistory } = await chrome.storage.local.get([
    "settings",
    "workHistory",
  ]);
  const today = new Date();
  const id = document.querySelector("#taskIds").value;

  const aet = document
    .querySelector(".ewok-estimated-task-weight")
    .textContent.split(" ");
  const lowerAET = +aet[0];
  const upperAET = +aet[2];
  const averageAET = (lowerAET + upperAET) / 2;

  if (
    settings.autoSubmit &&
    !(
      id in
      workHistory.years[today.getFullYear()][today.getMonth()][
        today.getDate() - 1
      ].tasks
    )
  ) {
    const button = settings.autoGrab ? submitButton : submitDoneButton;
    const timeWorked = document
      .querySelector("title")
      .textContent.split(" ")[0];
    const minutes = Number(timeWorked.substring(0, timeWorked.indexOf(":")));
    const seconds = Number(timeWorked.substring(timeWorked.indexOf(":") + 1));
    const totalMinutesWorked = minutes + seconds / 60;

    if (averageAET - totalMinutesWorked <= 0) {
      button.click();
    } else {
      autoSubmitInterval = setTimeout(
        () => button.click(),
        (averageAET - totalMinutesWorked) * 60 * 1000
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
