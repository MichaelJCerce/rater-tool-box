async function updateTask() {
  const message = "updateTask";

  const id = document.querySelector("#taskIds").value;
  const title = document.querySelector(".ewok-estimated-task-weight");

  const aet = title.textContent.split(" ");
  const lowerAET = +aet[0];
  const upperAET = +aet[2];
  const averageAET = (lowerAET + upperAET) / 2;
  const type = document.querySelector(".ewok-rater-header h1").textContent;

  // const pixels = 120 ;
  // const pixelsPerSecond = (pixels) / (upperAET * 60 * 1.1);
  // const timeForBar = 5 / pixelsPerSecond  5 pix  .45pix/sec
  // const totalPixels = averageAET * 60 * pixelsPerSecond;
  // const shift = (totalPixels / 120) * 100;
  // //add 5
  //(average + timeforbar) // upper

  if (averageAET >= 1) {
    title.textContent += ` (avg: ${averageAET} minutes)`;
  } else {
    title.textContent += ` (avg: ${averageAET * 60} seconds)`;
  }

  const currentTask = {
    id,
    lowerAET,
    upperAET,
    startTime: Date.now(),
    type,
  };

  const { settings, task, workHistory } = await chrome.storage.local.get([
    "settings",
    "task",
    "workHistory",
  ]);

  chrome.runtime.sendMessage({
    message,
    currentTask,
    settings,
    task,
    workHistory,
  });
}

updateTask();
