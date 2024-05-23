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
      task: {},
      time: createTime(),
      totalAET: 0,
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
    let { totalAET } = request;

    if (button === "ewok-task-submit-done-button") {
      settings.tempAutoGrab = false;
      chrome.storage.local.set({ settings });
    }

    if (!task.submitted) {
      totalAET += task.aet;
      task.submitted = true;
    }

    (async () => {
      await chrome.storage.local.set({
        task,
        totalAET,
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
      const { time, totalAET } = await chrome.storage.local.get([
        "time",
        "totalAET",
      ]);

      const totalRoundedHours = calcTotalRoundedHours(totalAET);

      sendResponse({ time, totalRoundedHours });
    })();

    return true;
  } else if (request.message === "updateSettings") {
    (async () => {
      const { newSettings } = request;

      await chrome.storage.local.set({ settings: newSettings });

      chrome.tabs.query(
        {
          url: [
            "https://www.raterhub.com/evaluation/rater",
            "https://www.raterhub.com/evaluation/rater/",
            "https://www.raterhub.com/evaluation/rater/task/index",
            "https://www.raterhub.com/evaluation/rater/task/index/",
          ],
        },
        function (tabs) {
          for (let i = 0; i < tabs.length; i++) {
            chrome.tabs.sendMessage(tabs[i].id, { message: "toggleAutoGrab" });
          }
        }
      );

      chrome.tabs.query(
        {
          url: "https://www.raterhub.com/evaluation/rater/task/show*",
        },
        function (tabs) {
          if (tabs.length) {
            chrome.tabs.sendMessage(tabs[0].id, {
              message: "toggleAutoSubmit",
            });
          }
        }
      );

      chrome.runtime.sendMessage(
        {
          message: "updateCalendarLayout",
        },
        function (response) {
          if (
            chrome.runtime.lastError.message !=
            "The message port closed before a response was received."
          ) {
            console.log("calendar not open");
            return;
          }
        }
      );
    })();
  } else if (request.message === "reload") {
    chrome.tabs.reload(sender.tab.id);
  }
});

chrome.alarms.onAlarm.addListener(async function () {
  const { task, time } = await chrome.storage.local.get(["task", "time"]);
  let { totalAET } = await chrome.storage.local.get("totalAET");

  if (Object.keys(task).length) {
    const today = new Date();
    const taskDate = new Date(task.startTime).getDate();
    const taskMonth = new Date(task.startTime).getMonth();
    const taskYear = new Date(task.startTime).getFullYear();

    if (
      today.getDate() !== taskDate ||
      today.getMonth() !== taskMonth ||
      today.getFullYear() !== taskYear
    ) {
      await chrome.tabs.query(
        {
          url: "https://www.raterhub.com/evaluation/rater/task/show*",
        },
        function (tabs) {
          if (tabs.length) {
            const url = tabs[0].url;
            if (
              url.substring(url.indexOf("=") + 1) === task.id &&
              task.submitted
            ) {
              totalAET -= task.aet;
              task.submitted = false;
            }
          }
        }
      );

      const totalRoundedHours = Number(calcTotalRoundedHours(totalAET));

      if (!time[taskYear]) {
        time.addYear(taskYear);
      }

      time[taskYear][taskMonth][taskDate - 1] += totalRoundedHours;

      await chrome.storage.local.set({
        task: task.submitted ? {} : task,
        time,
        totalAET: 0,
      });

      setIconAndBadgeText();
    }
  }
});

function createTime() {
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

  return time;
}

function isGoodPace(totalRoundedHours, totalAET) {
  const totalRoundedMinutesRatio = (+totalRoundedHours * 60) / totalAET;

  if (totalRoundedMinutesRatio > 1.1) {
    return false;
  }
  return true;
}

function calcTotalRoundedHours(totalAET) {
  let multiplier = 1.09;
  let totalRoundedHours;

  for (let i = 9; i > -1; --i) {
    totalRoundedHours = (
      Math.ceil(Math.round(totalAET * multiplier) / 6) * 0.1
    ).toFixed(1);
    if (isGoodPace(totalRoundedHours, totalAET)) {
      break;
    }
    multiplier -= 0.01;
  }

  return totalRoundedHours;
}

async function setIconAndBadgeText() {
  const { totalAET } = await chrome.storage.local.get(["totalAET"]);

  let totalRoundedHours = calcTotalRoundedHours(totalAET);

  if (isGoodPace(totalRoundedHours, totalAET)) {
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

  if (Number(totalRoundedHours) > 8) {
    totalRoundedHours = "8.0";
  }

  chrome.runtime.sendMessage(
    {
      message: "updateCalendarCurrentday",
      totalRoundedHours,
    },
    function (response) {
      if (
        chrome.runtime.lastError.message !=
        "The message port closed before a response was received."
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
