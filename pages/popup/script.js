const calendarButton = document.querySelector(".calendar");
const settingsButton = document.querySelector(".settings");
const reportTimeButton = document.querySelector(".report");

calendarButton.addEventListener("click", async function (e) {
  e.preventDefault();
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);

  if (tab) {
    chrome.tabs.create({
      url: "../pages/calendar/calendar.html",
      index: tab.index + 1,
    });
  } else {
    chrome.tabs.create({
      url: "../pages/calendar/calendar.html",
    });
  }
});

reportTimeButton.addEventListener("click", async function (e) {
  e.preventDefault();
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);

  if (tab) {
    chrome.tabs.create({
      url: "https://myapps.microsoft.com/welocalize",
      index: tab.index + 1,
    });
  } else {
    chrome.tabs.create({
      url: "https://myapps.microsoft.com/welocalize",
    });
  }
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

  const openResultsLi = document.createElement("li");
  const openResultsDiv = document.createElement("div");
  const openResults = document.createElement("input");
  openResults.setAttribute("type", "checkbox");
  openResults.setAttribute("id", "open-results");
  const openResultsLabel = document.createElement("label");
  openResultsLabel.setAttribute("for", "open-results");
  openResultsLabel.textContent = "open results";

  const playAudioLi = document.createElement("li");
  const playAudioDiv = document.createElement("div");
  const playAudio = document.createElement("input");
  playAudio.setAttribute("type", "checkbox");
  playAudio.setAttribute("id", "play-audio");
  const playAudioLabel = document.createElement("label");
  playAudioLabel.setAttribute("for", "play-audio");
  playAudioLabel.textContent = "play audio";

  const startMondayLi = document.createElement("li");
  const startMondayDiv = document.createElement("div");
  const startMonday = document.createElement("input");
  startMonday.setAttribute("type", "checkbox");
  startMonday.setAttribute("id", "start-monday");
  const startMondayLabel = document.createElement("label");
  startMondayLabel.setAttribute("for", "start-monday");
  startMondayLabel.textContent = "start monday";

  const { settings } = await chrome.storage.local.get("settings");
  autoGrab.checked = settings.autoGrab ? true : false;
  autoSubmit.checked = settings.autoSubmit ? true : false;
  openResults.checked = settings.openResults ? true : false;
  playAudio.checked = settings.playAudio ? true : false;
  startMonday.checked = settings.startMonday ? true : false;

  const saveButtonLi = document.createElement("li");
  const saveButton = document.createElement("button");
  saveButton.textContent = "save settings";

  saveButton.addEventListener("click", function (e) {
    e.preventDefault();

    const message = "updateSettings";
    const newSettings = {
      autoGrab: autoGrab.checked ? true : false,
      autoSubmit: autoSubmit.checked ? true : false,
      openResults: openResults.checked ? true : false,
      playAudio: playAudio.checked ? true : false,
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

  autoGrabDiv.appendChild(autoGrab);
  autoGrabDiv.appendChild(autoGrabLabel);

  autoSubmitDiv.appendChild(autoSubmit);
  autoSubmitDiv.appendChild(autoSubmitLabel);

  openResultsDiv.appendChild(openResults);
  openResultsDiv.appendChild(openResultsLabel);
  playAudioDiv.appendChild(playAudio);
  playAudioDiv.appendChild(playAudioLabel);

  startMondayDiv.appendChild(startMonday);
  startMondayDiv.appendChild(startMondayLabel);

  autoGrabLi.appendChild(autoGrabDiv);
  autoSubmitLi.appendChild(autoSubmitDiv);
  openResultsLi.appendChild(openResultsDiv);
  playAudioLi.appendChild(playAudioDiv);
  startMondayLi.appendChild(startMondayDiv);
  saveButtonLi.appendChild(saveButton);

  ul.appendChild(autoGrabLi);
  ul.appendChild(autoSubmitLi);
  ul.appendChild(openResultsLi);
  ul.appendChild(playAudioLi);
  ul.appendChild(startMondayLi);
  ul.appendChild(saveButtonLi);
});
