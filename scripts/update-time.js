async function updateTime() {
  const { minutesWorked } = await chrome.storage.local.get("minutesWorked");
  const newTaskTime = +document
    .querySelector(".ewok-estimated-task-weight")
    .textContent.split(" ")[2];
  await chrome.storage.local.set({
    minutesWorked: minutesWorked + newTaskTime,
  });
}

updateTime();
