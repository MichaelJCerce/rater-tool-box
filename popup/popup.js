const timeDisplay = document.querySelector(".time");

async function getTime() {
  minutesWorked = await chrome.storage.local.get(["minutesWorked"]);
  timeDisplay.textContent = `${minutesWorked.minutesWorked} minutes worked`;
}

getTime();
