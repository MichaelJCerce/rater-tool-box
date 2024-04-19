chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ totalAET: 0, minutesWorked: 0, task: {} });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.minutesWorked / request.totalAET > 1.05) {
    chrome.action.setIcon({
      path: {
        16: "./images/too_slow_16.png",
        24: "./images/too_slow_24.png",
        32: "./images/too_slow_32.png",
      },
    });
  } else if (request.minutesWorked / request.totalAET < 1) {
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
    text: `${(
      Math.floor(request.minutesWorked / 60) +
      Math.ceil((request.minutesWorked % 60) / 6) * 0.1
    ).toFixed(1)}`,
  });
});
