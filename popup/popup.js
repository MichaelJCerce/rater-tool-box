const timeDisplay = document.querySelector(".time");
const button = document.querySelector("button");

async function getTime() {
  const { totalAET } = await chrome.storage.local.get("totalAET");

  timeDisplay.textContent = `${(((totalAET * 1.09) / 6) * 0.1).toFixed(
    1
  )} hours`;
}

button.addEventListener("click", async function (e) {
  e.preventDefault();
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);

  chrome.tabs.create({
    url: "../calendar/calendar.html",
    index: tab.index + 1,
  });
});

getTime();
