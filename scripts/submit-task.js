const form = document.querySelector("#ewok-task-form");
const submitButton = document.querySelector("#ewok-task-submit-button");
const submitDoneButton = document.querySelector(
  "#ewok-task-submit-done-button"
);

let autoSubmitInterval;

async function submitTask(e) {
  e.preventDefault();

  const message = "submitTask";
  const { settings, task, totalAET } = await chrome.storage.local.get([
    "settings",
    "task",
    "totalAET",
  ]);

  await chrome.runtime.sendMessage({
    message,
    settings,
    task,
    totalAET,
    button: this.id,
  });

  form.requestSubmit(this);
}

async function autoSubmitTask() {
  const { settings } = await chrome.storage.local.get("settings");
  const aet = +document
    .querySelector(".ewok-estimated-task-weight")
    .textContent.split(" ")[2];

  if (settings.autoSubmit) {
    autoSubmitInterval = setTimeout(
      () => submitButton.click(),
      aet * 60 * 1000
    );
  }
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.message === "toggleAutoSubmit") {
    const { settings } = await chrome.storage.local.get("settings");

    if (!settings.autoSubmit) {
      clearInterval(autoSubmitInterval);
    } else {
      const aet = +document
        .querySelector(".ewok-estimated-task-weight")
        .textContent.split(" ")[2];
      const current = document.querySelector("title").textContent.split(" ")[0];
      const minutes = Number(current.substring(0, current.indexOf(":")));
      const seconds = Number(current.substring(current.indexOf(":") + 1)) / 60;
      const total = minutes + seconds;

      if (aet - total <= 0) {
        submitButton.click();
      } else {
        autoSubmitInterval = setTimeout(
          () => submitButton.click(),
          (aet - total) * 60 * 1000
        );
      }
    }
  }
});

submitButton.addEventListener("click", submitTask);
submitDoneButton.addEventListener("click", submitTask);

autoSubmitTask();
