const form = document.querySelector("#ewok-task-form");
const submitButton = document.querySelector("#ewok-task-submit-button");
const submitDoneButton = document.querySelector(
  "#ewok-task-submit-done-button"
);

async function getTask() {
  const { task } = await chrome.storage.local.get("task");
  let url = window.location.href;
  newTask = {
    id: url.substring(url.indexOf("=") + 1),
    startTime: Date.now(),
    aet: +document
      .querySelector(".ewok-estimated-task-weight")
      .textContent.split(" ")[2],
    submitted: false,
  };

  if (task.id != newTask.id) {
    await chrome.storage.local.set({ task: newTask });
  }
}

async function calcTimeWorked(e) {
  e.preventDefault();

  const button =
    e.target.id === submitButton.id ? submitButton : submitDoneButton;
  const { totalAET, minutesWorked, task } = await chrome.storage.local.get([
    "totalAET",
    "minutesWorked",
    "task",
  ]);

  if (!task.submitted) {
    task.submitted = true;
    await chrome.storage.local.set({
      totalAET: totalAET + task.aet,
      minutesWorked:
        minutesWorked + Math.round((Date.now() - task.startTime) / 1000 / 60),
      task,
    });
  }

  form.requestSubmit(button);
}

getTask();

submitButton.addEventListener("click", calcTimeWorked);
submitDoneButton.addEventListener("click", calcTimeWorked);
