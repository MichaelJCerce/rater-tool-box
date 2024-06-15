chrome.runtime.onInstalled.addListener(async function (details) {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    await chrome.storage.local.set({
      settings: {
        alertVolume: 1,
        autoGrab: true,
        autoSubmit: true,
        badgeText: true,
        openResults: true,
        playAudio: true,
        refreshRate: 10,
        startMonday: false,
        tempAutoGrab: true,
      },
      task: {},
      workHistory: createWorkHistory(),
    });
  }

  checkAlarm();
  setBadge();
});

chrome.runtime.onStartup.addListener(function () {
  checkAlarm();
  setBadge();
});

chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.message === "updateTask") {
    const { currentTask, settings, task, workHistory } = request;
    const today = new Date();

    if (
      !(
        currentTask.id in
        workHistory.years[today.getFullYear()][today.getMonth()][
          today.getDate() - 1
        ].tasks
      ) &&
      currentTask.id !== task.id
    ) {
      settings.playAudio && playAlert();
      chrome.storage.local.set({ task: currentTask });
    }
  } else if (request.message === "submitTask") {
    const { button, currentPageID, settings, task, workHistory } = request;
    const today = new Date();

    if (task.id === currentPageID) {
      if (
        !(
          task.id in
          workHistory.years[today.getFullYear()][today.getMonth()][
            today.getDate() - 1
          ].tasks
        )
      ) {
        if (!workHistory.years[today.getFullYear()]) {
          addYear(workHistory, today.getFullYear());
        }

        workHistory.years[today.getFullYear()][today.getMonth()][
          today.getDate() - 1
        ].totalAET += (task.lowerAET + task.upperAET) / 2;

        workHistory.years[today.getFullYear()][today.getMonth()][
          today.getDate() - 1
        ].tasks[task.id] = {
          lowerAET: task.lowerAET,
          upperAET: task.upperAET,
          startTime: task.startTime,
          type: task.type,
        };
      }

      workHistory.years[today.getFullYear()][today.getMonth()][
        today.getDate() - 1
      ].totalMinutesWorked += (Date.now() - task.startTime) / 1000 / 60;
      workHistory.years[today.getFullYear()][today.getMonth()][
        today.getDate() - 1
      ].tasks[task.id].submitTime = Date.now();

      task.startTime = Date.now();

      if (button === "ewok-task-submit-done-button" && settings.autoGrab) {
        settings.tempAutoGrab = false;
      }

      await chrome.storage.local.set({
        settings,
        task,
        workHistory,
      });

      setBadge();
    }
  } else if (request.message === "updateSettings") {
    await chrome.storage.local.set({ settings: request.newSettings });

    if (request.newSettings.badgeText) {
      chrome.action.setIcon({
        path: {
          16: "../assets/images/rtb_bt_16.png",
          24: "../assets/images/rtb_bt_24.png",
          32: "../assets/images/rtb_bt_32.png",
        },
      });
    } else {
      chrome.action.setIcon({
        path: {
          16: "../assets/images/rtb_nbt_16.png",
          24: "../assets/images/rtb_nbt_24.png",
          32: "../assets/images/rtb_nbt_32.png",
        },
      });
      chrome.action.setBadgeText({
        text: "",
      });
    }

    chrome.tabs.query(
      {
        url: [
          "https://www.raterhub.com/evaluation/rater",
          "https://www.raterhub.com/evaluation/rater/",
          "https://www.raterhub.com/evaluation/rater/task/index",
          "https://www.raterhub.com/evaluation/rater/task/index/",
          "https://www.raterhub.com/evaluation/rater/task/show?taskIds=*",
        ],
      },
      function (tabs) {
        for (let i = 0; i < tabs.length; i++) {
          chrome.tabs.sendMessage(tabs[i].id, {
            message: "updateTabs",
          });
        }
      }
    );

    chrome.runtime.sendMessage(
      {
        message: "drawCalendar",
      },
      function (response) {
        if (
          chrome.runtime.lastError.message ===
          "Could not establish connection. Receiving end does not exist."
        ) {
          console.log("calendar not open");
          return;
        }
      }
    );

    setBadge();
  } else if (request.message === "activateTempAutoGrab") {
    const { settings } = request;

    settings.tempAutoGrab = true;
    chrome.storage.local.set({ settings });
  } else if (request.message === "reload") {
    chrome.tabs.reload(sender.tab.id);
  }
});

chrome.alarms.onAlarm.addListener(async function () {
  const { task, workHistory } = await chrome.storage.local.get([
    "task",
    "workHistory",
  ]);
  const today = new Date();
  let yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const taskDate = new Date(task.startTime);
  if (taskDate.toDateString() === "Invalid Date") {
    return;
  }

  if (
    today.getDate() !== taskDate.getDate() ||
    today.getMonth() !== taskDate.getMonth() ||
    today.getFullYear() !== taskDate.getFullYear()
  ) {
    const tab = await chrome.tabs.query({
      url: "https://www.raterhub.com/evaluation/rater/task/show?taskIds=*",
    });

    if (
      tab.length &&
      task.id in
        workHistory.years[yesterday.getFullYear()][yesterday.getMonth()][
          yesterday.getDate() - 1
        ].tasks
    ) {
      const taskStartTime =
        workHistory.years[yesterday.getFullYear()][yesterday.getMonth()][
          yesterday.getDate() - 1
        ].tasks[task.id].startTime;

      const taskSubmitTime =
        workHistory.years[yesterday.getFullYear()][yesterday.getMonth()][
          yesterday.getDate() - 1
        ].tasks[task.id].submitTime;

      workHistory.years[yesterday.getFullYear()][yesterday.getMonth()][
        yesterday.getDate() - 1
      ].tasks[task.id].totalAET -= (task.lowerAET + task.upperAET) / 2;

      workHistory.years[yesterday.getFullYear()][yesterday.getMonth()][
        yesterday.getDate() - 1
      ].tasks[task.id].totalMinutesWorked -=
        (taskSubmitTime - taskStartTime) / 1000 / 60;

      delete workHistory.years[yesterday.getFullYear()][yesterday.getMonth()][
        yesterday.getDate() - 1
      ].tasks[task.id];
    }

    task.startTime = Date.now();

    await chrome.storage.local.set({
      task:
        task.id in
        workHistory.years[yesterday.getFullYear()][yesterday.getMonth()][
          yesterday.getDate() - 1
        ].tasks
          ? {}
          : task,
      workHistory,
    });

    chrome.runtime.sendMessage(
      {
        message: "drawCalendar",
      },
      function (response) {
        if (
          chrome.runtime.lastError.message ===
          "Could not establish connection. Receiving end does not exist."
        ) {
          console.log("calendar not open");
          return;
        }
      }
    );

    setBadge();
  }
});

function addYear(workHistory, year) {
  workHistory.years[year] = new Array(12);
  for (let month = 0; month < 12; ++month) {
    const numDays = new Date(year, (month + 1) % 12, 0).getDate();
    workHistory.years[year][month] = new Array(numDays);
    for (let day = 0; day < numDays; ++day) {
      workHistory.years[year][month][day] = {
        tasks: {},
        totalAET: 0,
        totalMinutesWorked: 0,
      };
    }
  }
}

function createWorkHistory() {
  const workHistory = { payday: "2024-05-10T04:00:00.000Z", years: {} };
  addYear(workHistory, new Date().getFullYear());
  return workHistory;
}

function calcTotalRoundedHours(totalAET, totalMinutesWorked) {
  if (totalAET === 0 || totalMinutesWorked === 0) {
    return "0.0";
  }

  // let totalRoundedHours = (
  //   Math.ceil(Math.round(totalMinutesWorked) / 6) * 0.1
  // ).toFixed(1);
  let totalRoundedHours = "100";
  let multiplier = 1.09;

  while ((+totalRoundedHours * 60) / totalAET >= 1.1) {
    if (multiplier >= 1) {
      totalRoundedHours = (
        Math.ceil(Math.round(totalAET * multiplier) / 6) * 0.1
      ).toFixed(1);
    } else {
      totalRoundedHours = (
        Math.ceil(Math.round(totalAET + 1 - 6) / 6) * 0.1
      ).toFixed(1);
    }

    multiplier -= 0.01;
  }

  return totalRoundedHours;
}

async function setBadge() {
  const { settings, workHistory } = await chrome.storage.local.get([
    "settings",
    "workHistory",
  ]);
  const today = new Date();

  let totalRoundedHours = "0.0";
  if (workHistory.years[today.getFullYear()]) {
    totalRoundedHours = calcTotalRoundedHours(
      workHistory.years[today.getFullYear()][today.getMonth()][
        today.getDate() - 1
      ].totalAET,
      workHistory.years[today.getFullYear()][today.getMonth()][
        today.getDate() - 1
      ].totalMinutesWorked
    );
  }

  chrome.runtime.sendMessage(
    {
      message: "updateCurrentDay",
      totalRoundedHours,
    },
    function (response) {
      if (
        chrome.runtime.lastError.message ===
        "Could not establish connection. Receiving end does not exist."
      ) {
        console.log("calendar not open");
        return;
      }
    }
  );

  if (settings.badgeText) {
    chrome.action.setBadgeBackgroundColor({ color: "#92B3F4" });
    chrome.action.setBadgeText({
      text: totalRoundedHours,
    });
  }
}

async function checkAlarm() {
  const alarm = await chrome.alarms.get("updateTime");

  if (!alarm) {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    midnight.setDate(midnight.getDate() + 1);

    chrome.alarms.create({ when: Date.now() + 30 * 1000 });
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
  const { settings } = await chrome.storage.local.get("settings");
  const message = "alertRater";

  await checkOffscreen();
  chrome.runtime.sendMessage({ message, settings });
}
