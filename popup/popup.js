const calendarButton = document.querySelector(".calendar");
const settingsButton = document.querySelector(".settings");
const reportTimeButton = document.querySelector(".report");

calendarButton.addEventListener("click", async function (e) {
  e.preventDefault();
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);

  chrome.tabs.create({
    url: "../pages/calendar/calendar.html",
    index: tab.index + 1,
  });
});

reportTimeButton.addEventListener("click", async function (e) {
  e.preventDefault();
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);

  chrome.tabs.create({
    url: "https://myapps.microsoft.com/welocalize",
    index: tab.index + 1,
  });
});

settingsButton.addEventListener("click", async function (e) {
  e.preventDefault();
  const save = [];
  const ul = document.querySelector("ul");

  while (ul.children.length) {
    save.push(ul.removeChild(ul.lastElementChild));
  }

  const autoGrabLi = document.createElement("li");
  const autoGrabDiv = document.createElement("div");
  const autoGrab = document.createElement("input");
  autoGrab.setAttribute("type", "checkbox");
  autoGrab.setAttribute("id", "auto-grab");
  const autoGrabLabel = document.createElement("label");
  autoGrabLabel.setAttribute("for", "auto-grab");
  autoGrabLabel.textContent = "auto grab";

  const autoSubmitLi = document.createElement("li");
  const autoSubmitDiv = document.createElement("div");
  const autoSubmit = document.createElement("input");
  autoSubmit.setAttribute("type", "checkbox");
  autoSubmit.setAttribute("id", "auto-submit");
  const autoSubmitLabel = document.createElement("label");
  autoSubmitLabel.setAttribute("for", "auto-submit");
  autoSubmitLabel.textContent = "auto submit";

  const startMondayLi = document.createElement("li");
  const startMondayDiv = document.createElement("div");
  const startMonday = document.createElement("input");
  startMonday.setAttribute("type", "checkbox");
  startMonday.setAttribute("id", "start-monday");
  const startMondayLabel = document.createElement("label");
  startMondayLabel.setAttribute("for", "start-monday");
  startMondayLabel.textContent = "start monday";

  const saveButtonLi = document.createElement("li");
  const saveButton = document.createElement("button");
  saveButton.textContent = "save settings";

  autoGrabDiv.appendChild(autoGrab);
  autoGrabDiv.appendChild(autoGrabLabel);

  autoSubmitDiv.appendChild(autoSubmit);
  autoSubmitDiv.appendChild(autoSubmitLabel);

  startMondayDiv.appendChild(startMonday);
  startMondayDiv.appendChild(startMondayLabel);

  autoGrabLi.appendChild(autoGrabDiv);
  autoSubmitLi.appendChild(autoSubmitDiv);
  startMondayLi.appendChild(startMondayDiv);
  saveButtonLi.appendChild(saveButton);
  ul.appendChild(autoGrabLi);
  ul.appendChild(autoSubmitLi);
  ul.appendChild(startMondayLi);
  ul.appendChild(saveButtonLi);

  const { settings } = await chrome.storage.local.get("settings");
  autoGrab.checked = settings.autoGrab ? true : false;
  autoSubmit.checked = settings.autoSubmit ? true : false;
  startMonday.checked = settings.startMonday ? true : false;

  saveButton.addEventListener("click", function (e) {
    e.preventDefault();

    const message = "updateSettings";
    const newSettings = {
      autoGrab: autoGrab.checked ? true : false,
      autoSubmit: autoSubmit.checked ? true : false,
      startMonday: startMonday.checked ? true : false,
      tempAutoGrab: true,
    };
    while (ul.children.length) {
      ul.removeChild(ul.lastElementChild);
    }
    while (save.length) {
      ul.appendChild(save.pop());
    }
    chrome.runtime.sendMessage({ message, newSettings });
  });
});
