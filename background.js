chrome.runtime.onInstalled.addListener(() => {
  const time = {};
  const currYear = new Date().getFullYear();
  time[currYear] = new Array(12);
  for (let i = 0; i < 12; ++i) {
    const numDays = new Date(currYear, (i + 1) % 12, 0).getDate();
    time[currYear][i] = new Array(numDays);
    for (let j = 0; j < numDays; ++j) {
      time[currYear][i][j] = 0;
    }
  }

  chrome.storage.local.set({
    settings: { active: true },
    task: {},
    time,
    totalAET: 0,
    totalMinutesWorked: 0,
  });

  setIconAndBadge("0.0", 0);

  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  midnight.setDate(midnight.getDate() + 1);
  chrome.alarms.create("checkDate", {
    when: midnight - Date.now(),
    periodInMinutes: 60 * 24,
  });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === "submitTask") {
    const { settings, task, button } = request;
    let { totalAET, totalMinutesWorked } = request;

    if (button === "ewok-task-submit-done-button") {
      settings.active = false;
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

    const roundedTotalHoursWorked = (
      Math.ceil(Math.round(totalMinutesWorked) / 6) * 0.1
    ).toFixed(1);

    setIconAndBadge(roundedTotalHoursWorked, totalAET);
  } else if (request.message === "updateTask") {
    const { task, currentTask } = request;

    if (task.id !== currentTask.id) {
      chrome.storage.local.set({ task: currentTask });
    }
  } else if (request.message === "activateGrabTask") {
    const { settings } = request;
    settings.active = true;
    chrome.storage.local.set({ settings });
  } else if (request.message === "requestTime") {
    (async () => {
      const { time, totalMinutesWorked } = await chrome.storage.local.get([
        "time",
        "totalMinutesWorked",
      ]);
      sendResponse({ time, totalMinutesWorked });
    })();

    return true;
  } else if (request.message === "reload") {
    chrome.tabs.reload(sender.tab.id);
  }
});

chrome.alarms.onAlarm.addListener(async () => {
  const { task, time, totalMinutesWorked } = await chrome.storage.local.get([
    "task",
    "time",
    "totalMinutesWorked",
  ]);

  if (Object.keys(task).length) {
    const currDate = new Date().getDate();
    const taskDate = new Date(task.startTime).getDate();

    if (currDate != taskDate) {
      const taskMonth = new Date(task.startTime).getMonth();
      const taskYear = new Date(task.startTime).getFullYear();

      const roundedTotalHoursWorked = (
        Math.ceil(Math.round(totalMinutesWorked) / 6) * 0.1
      ).toFixed(1);

      if (!time[taskYear]) {
        time[taskYear] = new Array(12);
        for (let i = 0; i < 12; ++i) {
          const numDays = new Date(taskYear, (i + 1) % 12, 0).getDate();
          time[taskYear][i] = new Array(numDays);
          for (let j = 0; j < numDays; ++j) {
            time[taskYear][i][j] = 0;
          }
        }
      }
      time[taskYear][taskMonth][taskDate - 1] = +roundedTotalHoursWorked;
    }

    task = {};
    const totalAET = 0;
    totalMinutesWorked = 0;

    chrome.storage.local.set({
      task,
      time,
      totalAET,
      totalMinutesWorked,
    });

    setIconAndBadge("0.0", 0);
  }
});

function setIconAndBadge(roundedTotalHoursWorked, totalAET) {
  const roundedTotalMinutesWorked = +roundedTotalHoursWorked * 60;

  if (roundedTotalMinutesWorked / totalAET > 1.1) {
    chrome.action.setIcon({
      path: {
        16: "./images/slow_pace_16.png",
        24: "./images/slow_pace_24.png",
        32: "./images/slow_pace_32.png",
      },
    });
  } else {
    chrome.action.setIcon({
      path: {
        16: "./images/good_pace_16.png",
        24: "./images/good_pace_24.png",
        32: "./images/good_pace_32.png",
      },
    });
  }

  chrome.action.setBadgeText({
    text: `${roundedTotalHoursWorked}`,
  });
}
