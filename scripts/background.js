chrome.runtime.onInstalled.addListener(async function (details) {
  if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
    await chrome.storage.local.set({
      settings: {
        autoGrab: true,
        autoSubmit: true,
        openResults: true,
        playAudio: true,
        startMonday: false,
        tempAutoGrab: true,
      },
      tasks: { current: {}, submitted: {} },
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
    const { currentTask, settings, tasks } = request;

    if (!(currentTask.id in tasks.submitted)) {
      settings.playAudio && playAlert();
      tasks.current = currentTask;
      chrome.storage.local.set({ tasks });
    }
  } else if (request.message === "submitTask") {
    const { button, settings, tasks, workHistory } = request;

    if (!(tasks.current.id in tasks.submitted)) {
      const today = new Date();
      if (!workHistory.years[today.getFullYear()]) {
        addYear(workHistory, today.getFullYear());
      }

      workHistory.years[today.getFullYear()][today.getMonth()][
        today.getDate() - 1
      ] += tasks.current.aet;
      tasks.submitted[tasks.current.id] = tasks.current.aet;
    }

    if (button === "ewok-task-submit-done-button" && settings.autoGrab) {
      settings.tempAutoGrab = false;
    }

    await chrome.storage.local.set({
      settings,
      tasks,
      workHistory,
    });

    setBadge();
  } else if (request.message === "updateSettings") {
    await chrome.storage.local.set({ settings: request.newSettings });

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
  } else if (request.message === "activateTempAutoGrab") {
    const { settings } = request;

    settings.tempAutoGrab = true;
    chrome.storage.local.set({ settings });
  } else if (request.message === "reload") {
    chrome.tabs.reload(sender.tab.id);
  }
});

chrome.alarms.onAlarm.addListener(async function () {
  const { tasks, workHistory } = await chrome.storage.local.get([
    "tasks",
    "workHistory",
  ]);

  await chrome.tabs.query(
    {
      url: "https://www.raterhub.com/evaluation/rater/task/show?taskIds=*",
    },
    function (tabs) {
      if (tabs.length) {
        const url = tabs[0].url;
        if (url.substring(url.indexOf("=") + 1) in tasks.submitted) {
          let yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);

          workHistory.years[yesterday.getFullYear()][yesterday.getMonth()][
            yesterday.getDate() - 1
          ] -= tasks.current.aet;
          delete tasks.submitted[tasks.current.id];
        }
      }
    }
  );

  await chrome.storage.local.set({
    tasks: {
      current: tasks.current.id in tasks.submitted ? {} : tasks.current,
      submitted: {},
    },
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
});

function addYear(workHistory, year) {
  workHistory.years[year] = new Array(12);
  for (let month = 0; month < 12; ++month) {
    const numDays = new Date(year, (month + 1) % 12, 0).getDate();
    workHistory.years[year][month] = new Array(numDays);
    for (let day = 0; day < numDays; ++day) {
      workHistory.years[year][month][day] = 0;
    }
  }
}

function createWorkHistory() {
  const workHistory = { payday: "2024-05-10T04:00:00.000Z", years: {} };
  addYear(workHistory, new Date().getFullYear());
  return workHistory;
}

function calcTotalRoundedHours(totalAET) {
  if (totalAET === 0) {
    return "0.0";
  }

  let multiplier = 1.09;
  let totalRoundedHours = `100`;

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
  const { workHistory } = await chrome.storage.local.get("workHistory");
  const today = new Date();

  let totalRoundedHours = "0.0";
  if (workHistory.years[today.getFullYear()]) {
    totalRoundedHours = calcTotalRoundedHours(
      workHistory.years[today.getFullYear()][today.getMonth()][
        today.getDate() - 1
      ]
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

  chrome.action.setBadgeBackgroundColor({ color: "#92B3F4" });
  chrome.action.setBadgeText({
    text: totalRoundedHours,
  });
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
  const message = "alertRater";

  await checkOffscreen();
  chrome.runtime.sendMessage({ message });
}
