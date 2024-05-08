const task = document.querySelector(".ewok-rater-task-option a");
if (task) {
  task.click();
}

function requestReload() {
  chrome.runtime.sendMessage({ message: "reload" });
}
setInterval(requestReload, 10000);


