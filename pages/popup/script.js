const calendarButton = document.querySelector(".calendar");
const dashboardButton = document.querySelector(".dashboard");
const settingsButton = document.querySelector(".settings");

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

dashboardButton.addEventListener("click", async function (e) {
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
  const { settings } = await chrome.storage.local.get("settings");
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

  const refreshRateLi = document.createElement("li");
  const refreshRateDiv = document.createElement("div");
  const refreshRate = document.createElement("input");
  refreshRate.setAttribute("type", "range");
  refreshRate.setAttribute("id", "refresh-rate");
  refreshRate.setAttribute("min", "5");
  refreshRate.setAttribute("max", "60");
  refreshRate.setAttribute("step", "5");
  const refreshRateLabel = document.createElement("label");
  refreshRateLabel.setAttribute("for", "refresh-rate");
  refreshRateLabel.textContent = `refresh rate: ${settings.refreshRate}s`;

  refreshRate.addEventListener("input", (e) => {
    refreshRateLabel.textContent = `refresh rate: ${e.target.value}s`;
  });

  const autoSubmitLi = document.createElement("li");
  const autoSubmitDiv = document.createElement("div");
  const autoSubmit = document.createElement("input");
  autoSubmit.setAttribute("type", "checkbox");
  autoSubmit.setAttribute("id", "auto-submit");
  const autoSubmitLabel = document.createElement("label");
  autoSubmitLabel.setAttribute("for", "auto-submit");
  autoSubmitLabel.textContent = "auto submit";

  const badgeTextLi = document.createElement("li");
  const badgeTextDiv = document.createElement("div");
  const badgeText = document.createElement("input");
  badgeText.setAttribute("type", "checkbox");
  badgeText.setAttribute("id", "badge-text");
  const badgeTextLabel = document.createElement("label");
  badgeTextLabel.setAttribute("for", "badge-text");
  badgeTextLabel.textContent = "badge text";

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

  const alertVolumeLi = document.createElement("li");
  const alertVolumeDiv = document.createElement("div");
  const alertVolume = document.createElement("input");
  alertVolume.setAttribute("type", "range");
  alertVolume.setAttribute("id", "alert-volume");
  alertVolume.setAttribute("min", "0.1");
  alertVolume.setAttribute("max", "6");
  alertVolume.setAttribute("step", ".1");
  const alertVolumeLabel = document.createElement("label");
  alertVolumeLabel.setAttribute("for", "alert-volume");
  alertVolumeLabel.textContent = `alert volume: ${(
    settings.alertVolume * 100
  ).toFixed(0)}%`;

  alertVolume.addEventListener("input", (e) => {
    alertVolumeLabel.textContent = `alert volume: ${(
      +e.target.value * 100
    ).toFixed(0)}%`;
  });

  const startMondayLi = document.createElement("li");
  const startMondayDiv = document.createElement("div");
  const startMonday = document.createElement("input");
  startMonday.setAttribute("type", "checkbox");
  startMonday.setAttribute("id", "start-monday");
  const startMondayLabel = document.createElement("label");
  startMondayLabel.setAttribute("for", "start-monday");
  startMondayLabel.textContent = "start monday";

  autoGrab.checked = settings.autoGrab ? true : false;
  refreshRate.value = `${settings.refreshRate}`;
  autoSubmit.checked = settings.autoSubmit ? true : false;
  badgeText.checked = settings.badgeText ? true : false;
  openResults.checked = settings.openResults ? true : false;
  playAudio.checked = settings.playAudio ? true : false;
  alertVolume.value = `${settings.alertVolume}`;
  startMonday.checked = settings.startMonday ? true : false;

  const saveButtonLi = document.createElement("li");
  const saveButton = document.createElement("button");
  saveButton.textContent = "save settings";

  saveButton.addEventListener("click", function (e) {
    e.preventDefault();

    const message = "updateSettings";
    const newSettings = {
      autoGrab: autoGrab.checked ? true : false,
      refreshRate: +refreshRate.value,
      autoSubmit: autoSubmit.checked ? true : false,
      badgeText: badgeText.checked ? true : false,
      openResults: openResults.checked ? true : false,
      playAudio: playAudio.checked ? true : false,
      alertVolume: +(+alertVolume.value).toFixed(1),
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

  refreshRateDiv.appendChild(refreshRateLabel);
  refreshRateDiv.appendChild(refreshRate);

  autoSubmitDiv.appendChild(autoSubmit);
  autoSubmitDiv.appendChild(autoSubmitLabel);

  badgeTextDiv.appendChild(badgeText);
  badgeTextDiv.appendChild(badgeTextLabel);

  openResultsDiv.appendChild(openResults);
  openResultsDiv.appendChild(openResultsLabel);

  playAudioDiv.appendChild(playAudio);
  playAudioDiv.appendChild(playAudioLabel);

  alertVolumeDiv.appendChild(alertVolumeLabel);
  alertVolumeDiv.appendChild(alertVolume);

  startMondayDiv.appendChild(startMonday);
  startMondayDiv.appendChild(startMondayLabel);

  autoGrabLi.appendChild(autoGrabDiv);
  refreshRateLi.appendChild(refreshRateDiv);
  autoSubmitLi.appendChild(autoSubmitDiv);
  badgeTextLi.appendChild(badgeTextDiv);
  openResultsLi.appendChild(openResultsDiv);
  playAudioLi.appendChild(playAudioDiv);
  alertVolumeLi.appendChild(alertVolumeDiv);
  startMondayLi.appendChild(startMondayDiv);
  saveButtonLi.appendChild(saveButton);

  ul.appendChild(autoGrabLi);
  ul.appendChild(refreshRateLi);
  ul.appendChild(autoSubmitLi);
  ul.appendChild(badgeTextLi);
  ul.appendChild(openResultsLi);
  ul.appendChild(playAudioLi);
  ul.appendChild(alertVolumeLi);
  ul.appendChild(startMondayLi);
  ul.appendChild(saveButtonLi);
});
