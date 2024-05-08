chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    totalAET: 0,
    minutesWorked: 0,
    task: {},
    prevWeek: {},
    currWeek: { totalAET: 0 },
    settings: { active: true },
  });

  chrome.action.setBadgeText({
    text: "0.0",
  });

  chrome.alarms.create("checkDate", {
    periodInMinutes: 60,
  });
});

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.message == "reload") {
    chrome.tabs.reload(sender.tab.id);
    return;
  }
  if (request.message == "stopGrabTask") {
    const { settings } = await chrome.storage.local.get("settings");
    settings.active = false;
    await chrome.storage.local.set({ settings });
  }

  roundedTime = (
    Math.floor(request.minutesWorked / 60) +
    Math.ceil((request.minutesWorked % 60) / 6) * 0.1
  ).toFixed(1);

  if ((+roundedTime * 60) / request.totalAET > 1.09) {
    chrome.action.setIcon({
      path: {
        16: "./images/too_slow_16.png",
        24: "./images/too_slow_24.png",
        32: "./images/too_slow_32.png",
      },
    });
  } else if ((+roundedTime * 60) / request.totalAET < 1) {
    chrome.action.setIcon({
      path: {
        16: "./images/too_fast_16.png",
        24: "./images/too_fast_24.png",
        32: "./images/too_fast_32.png",
      },
    });
  } else {
    chrome.action.setIcon({
      path: {
        16: "./images/work_time_tracker_16.png",
        24: "./images/work_time_tracker_24.png",
        32: "./images/work_time_tracker_32.png",
      },
    });
  }

  chrome.action.setBadgeText({
    text: `${roundedTime}`,
  });
});

chrome.alarms.onAlarm.addListener(async () => {
  const { totalAET, minutesWorked, task, prevWeek, currWeek } =
    await chrome.storage.local.get([
      "totalAET",
      "minutesWorked",
      "task",
      "prevWeek",
      "currWeek",
    ]);

  if (Object.keys(task).length) {
    const lastTaskDay = new Date(task.startTime).getDay();
    const currentDay = new Date().getDay();

    if (lastTaskDay !== currentDay) {
      currWeek[lastTaskDay] = minutesWorked;
      currWeek.totalAET += totalAET;
      if (currentDay === 1) {
        prevWeek = currWeek;
        currWeek = { totalAET: 0 };
      }

      chrome.storage.local.set({
        totalAET: 0,
        minutesWorked: 0,
        task: {},
        prevWeek,
        currWeek,
      });

      chrome.action.setIcon({
        path: {
          16: "./images/work_time_tracker_16.png",
          24: "./images/work_time_tracker_24.png",
          32: "./images/work_time_tracker_32.png",
        },
      });

      chrome.action.setBadgeText({
        text: "0.0",
      });
    }
  }
});
