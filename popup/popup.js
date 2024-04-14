const timeDisplay = document.querySelector(".time");
const resetButton = document.querySelector(".reset");

async function getTime() {
  const { minutesWorked } = await chrome.storage.local.get(["minutesWorked"]);

  timeDisplay.textContent = `${minutesWorked} minutes worked`;
}

getTime();

resetButton.addEventListener("click", async (e) => {
  e.preventDefault();

  await chrome.storage.local.set({ totalAET: 0, minutesWorked: 0, task: {} });

  getTime();
  chrome.runtime.sendMessage({ totalAET: 0, minutesWorked: 0 });
});
