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
  let { totalAET, minutesWorked, task } = await chrome.storage.local.get([
    "totalAET",
    "minutesWorked",
    "task",
  ]);
  let message = "";
  if (button === submitDoneButton) {
    message = "stopGrabTask";
  }

  if (!task.submitted) {
    totalAET += task.aet;
    task.submitted = true;
  }

  minutesWorked += (Date.now() - task.startTime) / 1000 / 60;
  task.startTime = Date.now();

  await chrome.storage.local.set({
    totalAET,
    minutesWorked,
    task,
  });

  await chrome.runtime.sendMessage({ message, totalAET, minutesWorked });
  form.requestSubmit(button);
}

getTask();

submitButton.addEventListener("click", calcTimeWorked);
submitDoneButton.addEventListener("click", calcTimeWorked);
