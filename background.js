chrome.runtime.onInstalled.addListener(() => {
  const payday = new Date();
  payday.setHours(0, 0, 0, 0);
  payday.setDate(10);
  payday.setMonth(4);
  payday.setFullYear(2024);
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
    payday: payday.toJSON(),
  };
  time.addYear(new Date().getFullYear());
  chrome.storage.local.set({
    settings: {
      autoGrab: true,
      autoSubmit: true,
      startMonday: false,
      tempAutoGrab: true,
    },
    task: {},
    time,
    totalAET: 0,
    totalMinutesWorked: 0,
  });

  setIconAndBadge("0.0", 0);

  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  midnight.setDate(midnight.getDate() + 1);
  chrome.alarms.create("updateTime", {
    when: midnight.getTime(),
    periodInMinutes: 60 * 24,
  });
});

chrome.runtime.onStartup.addListener(async function () {
  const { totalAET, totalMinutesWorked } = await chrome.storage.local.get([
    "totalAET",
    "totalMinutesWorked",
  ]);
  const roundedTotalHoursWorked = calcRoundedTotalHoursWorked(
    totalMinutesWorked,
    totalAET
  );
  setIconAndBadge(roundedTotalHoursWorked, totalAET);
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

    chrome.storage.local.set({
      task,
      totalAET,
      totalMinutesWorked,
    });

    const roundedTotalHoursWorked = calcRoundedTotalHoursWorked(
      totalMinutesWorked,
      totalAET
    );

    setIconAndBadge(roundedTotalHoursWorked, totalAET);
  } else if (request.message === "updateTask") {
    const { task, currentTask } = request;

    if (task.id !== currentTask.id) {
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

    chrome.storage.local.set({
      task: {},
      time,
      totalAET: 0,
      totalMinutesWorked: 0,
    });

    setIconAndBadge("0.0", 0);
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

function setIconAndBadge(roundedTotalHoursWorked, totalAET) {
  if (isGoodPace(roundedTotalHoursWorked, totalAET)) {
    chrome.action.setIcon({
      path: {
        16: "./images/good_pace_16.png",
        24: "./images/good_pace_24.png",
        32: "./images/good_pace_32.png",
      },
    });
  } else {
    chrome.action.setIcon({
      path: {
        16: "./images/slow_pace_16.png",
        24: "./images/slow_pace_24.png",
        32: "./images/slow_pace_32.png",
      },
    });
  }

  chrome.action.setBadgeText({
    text: roundedTotalHoursWorked,
  });
}
