chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    const time = {
      addYear(year) {
        this[year] = new Array(12);
        for (let i = 0; i < 12; ++i) {
          const numDays = new Date(year, (i + 1) % 12, 0).getDate();
          this[year][i] = new Array(numDays);
          for (let j = 0; j < numDays; ++j) {
            this[year][i][j] = 0;
          }
        }
      },
      payday: "2024-05-10T04:00:00.000Z",
    };
    time.addYear(new Date().getFullYear());

    await chrome.storage.local.set({
      settings: {
        autoGrab: true,
        autoSubmit: true,
        openResults: true,
        playAudio: true,
        startMonday: false,
        tempAutoGrab: true,
      },
      task: {},
      time,
      totalAET: 0,
      totalMinutesWorked: 0,
    });
  }

  checkAlarm();
  setIconAndBadgeText();
});

chrome.runtime.onStartup.addListener(function () {
  checkAlarm();
  setIconAndBadgeText();
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === "submitTask") {
    const { settings, task, button } = request;
    let { totalAET, totalMinutesWorked } = request;

    if (button === "ewok-task-submit-done-button") {
      settings.tempAutoGrab = false;
      chrome.storage.local.set({ settings });
    }

    if (!task.submitted) {
      totalAET += task.aet;
      task.submitted = true;
    }

    const minutesOnTask = (Date.now() - task.startTime) / 1000 / 60;
    task.startTime = Date.now();
    totalMinutesWorked += minutesOnTask;

    (async () => {
      await chrome.storage.local.set({
        task,
        totalAET,
        totalMinutesWorked,
      });

      setIconAndBadgeText();
    })();
  } else if (request.message === "updateTask") {
    const { settings, task, currentTask } = request;

    if (task.id !== currentTask.id) {
      if (settings.playAudio) {
        playAlert();
      }
      chrome.storage.local.set({ task: currentTask });
    }
  } else if (request.message === "activateTempAutoGrab") {
    const { settings } = request;

    settings.tempAutoGrab = true;
    chrome.storage.local.set({ settings });
  } else if (request.message === "getTime") {
    (async () => {
      const { time, totalAET, totalMinutesWorked } =
        await chrome.storage.local.get([
          "time",
          "totalAET",
          "totalMinutesWorked",
        ]);

      const roundedTotalHoursWorked = calcRoundedTotalHoursWorked(
        totalMinutesWorked,
        totalAET
      );

      sendResponse({ time, roundedTotalHoursWorked });
    })();

    return true;
  } else if (request.message === "updateSettings") {
    const { newSettings } = request;

    chrome.storage.local.set({ settings: newSettings });
  } else if (request.message === "reload") {
    chrome.tabs.reload(sender.tab.id);
  }
});

chrome.alarms.onAlarm.addListener(async () => {
  const { task, time, totalAET, totalMinutesWorked } =
    await chrome.storage.local.get([
      "task",
      "time",
      "totalAET",
      "totalMinutesWorked",
    ]);

  if (Object.keys(task).length) {
    const taskDate = new Date(task.startTime).getDate();
    const taskMonth = new Date(task.startTime).getMonth();
    const taskYear = new Date(task.startTime).getFullYear();

    const roundedTotalHoursWorked = calcRoundedTotalHoursWorked(
      totalMinutesWorked,
      totalAET
    );

    if (!time[taskYear]) {
      time.addYear(taskYear);
    }

    time[taskYear][taskMonth][taskDate - 1] = +roundedTotalHoursWorked;

    await chrome.storage.local.set({
      task: {},
      time,
      totalAET: 0,
      totalMinutesWorked: 0,
    });

    setIconAndBadgeText();
  }
});

function isGoodPace(roundedTotalHoursWorked, totalAET) {
  const roundedTotalMinutesWorkedRatio =
    (+roundedTotalHoursWorked * 60) / totalAET;

  if (roundedTotalMinutesWorkedRatio > 1.1) {
    return false;
  }
  return true;
}

function calcRoundedTotalHoursWorked(totalMinutesWorked, totalAET) {
  let multiplier = 1.09;
  let roundedTotalHoursWorked;

  for (let i = 9; i > -1; --i) {
    roundedTotalHoursWorked = (
      Math.ceil(Math.round(totalMinutesWorked * multiplier) / 6) * 0.1
    ).toFixed(1);
    if (isGoodPace(roundedTotalHoursWorked, totalAET)) {
      break;
    }
    multiplier -= 0.01;
  }

  return roundedTotalHoursWorked;
}

async function setIconAndBadgeText() {
  const { totalAET, totalMinutesWorked } = await chrome.storage.local.get([
    "totalAET",
    "totalMinutesWorked",
  ]);

  let roundedTotalHoursWorked = calcRoundedTotalHoursWorked(
    totalMinutesWorked,
    totalAET
  );

  if (isGoodPace(roundedTotalHoursWorked, totalAET)) {
    chrome.action.setIcon({
      path: {
        16: "../assets/images/good_pace_16.png",
        24: "../assets/images/good_pace_24.png",
        32: "../assets/images/good_pace_32.png",
      },
    });
  } else {
    chrome.action.setIcon({
      path: {
        16: "../assets/images/slow_pace_16.png",
        24: "../assets/images/slow_pace_24.png",
        32: "../assets/images/slow_pace_32.png",
      },
    });
  }

  if (Number(roundedTotalHoursWorked) > 8) {
    roundedTotalHoursWorked = "8.0"
  }

  chrome.action.setBadgeBackgroundColor({ color: "#92B3F4" });
  chrome.action.setBadgeText({
    text: roundedTotalHoursWorked,
  });
}

async function checkAlarm() {
  const alarms = await chrome.alarms.getAll();

  if (!alarms.length) {
    const { task } = await chrome.storage.local.get("task");

    if (Object.keys(task).length) {
      const today = new Date();
      const taskDate = new Date(task.startTime).getDate();
      const taskMonth = new Date(task.startTime).getMonth();
      const taskYear = new Date(task.startTime).getFullYear();

      if (
        today.getDate() != taskDate ||
        today.getMonth() != taskMonth ||
        today.getFullYear() != taskYear
      ) {
        chrome.alarms.create("updateTime", { when: Date.now() });
      }
    }

    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    midnight.setDate(midnight.getDate() + 1);
    chrome.alarms.create("updateTime", {
      when: midnight.getTime(),
      periodInMinutes: 60 * 24,
    });
  }
}

async function checkOffscreen() {
  const existingOffscreen = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL("pages/offscreen/offscreen.html")],
  });

  if (!existingOffscreen.length) {
    await chrome.offscreen.createDocument({
      url: "../pages/offscreen/offscreen.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: "alert rater of newly grabbed task",
    });
  }
}

async function playAlert() {
  const message = "alertRater";

  await checkOffscreen();
  chrome.runtime.sendMessage({ message });
}
