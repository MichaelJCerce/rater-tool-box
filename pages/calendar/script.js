const calendar = document.querySelector(".calendar");
const monthAndYear = document.querySelector(".month-year");
const days = document.querySelector(".days");
const prevMonthButton = document.querySelector(".prev-month");
const nextMonthButton = document.querySelector(".next-month");
const currMonthButton = document.querySelector(".curr-month");

const sunday = document.createElement("h2");
sunday.textContent = "Sunday";
const monday = document.createElement("h2");
monday.textContent = "Monday";
const tuesday = document.createElement("h2");
tuesday.textContent = "Tuesday";
const wednesday = document.createElement("h2");
wednesday.textContent = "Wednesday";
const thursday = document.createElement("h2");
thursday.textContent = "Thurday";
const friday = document.createElement("h2");
friday.textContent = "Friday";
const saturday = document.createElement("h2");
saturday.textContent = "Saturday";
const dayNames = [
  sunday,
  monday,
  tuesday,
  wednesday,
  thursday,
  friday,
  saturday,
];

const calcTotalRoundedHours = function (totalAET) {
  let multiplier = 1.09;
  let totalRoundedHours = `100`;

  while ((+totalRoundedHours * 60) / totalAET >= 1.1) {
    if (multiplier < 1) {
      totalRoundedHours = (
        Math.ceil(Math.round(totalAET + 1 - 6) / 6) * 0.1
      ).toFixed(1);
    } else {
      totalRoundedHours = (
        Math.ceil(Math.round(totalAET * multiplier) / 6) * 0.1
      ).toFixed(1);
    }

    multiplier -= 0.01;
  }

  return totalRoundedHours;
};

async function drawCalendar(monthIndex, year) {
  const { settings, workHistory } = await chrome.storage.local.get([
    "settings",
    "workHistory",
  ]);

  const today = new Date();
  const payday = new Date(workHistory.payday);

  const thisMonthMaxDays = new Date(year, monthIndex + 1, 0).getDate();
  const lastMonthMaxDays = new Date(year, monthIndex, 0).getDate();

  const startMondayOffset = settings.startMonday ? 1 : 0;

  const lastSundayOffset = new Date(year, monthIndex, 1).getDay();
  const lastMondayOffset =
    lastSundayOffset - 1 >= 0 ? lastSundayOffset - 1 : lastSundayOffset - 1 + 7;

  const nextSundayOffset = 6 - new Date(year, monthIndex + 1, 0).getDay();
  const nextMondayOffset =
    nextSundayOffset + 1 === 7 ? 0 : nextSundayOffset + 1;

  let month;
  switch (monthIndex) {
    case 0:
      month = "January";
      break;
    case 1:
      month = "Febuary";
      break;
    case 2:
      month = "March";
      break;
    case 3:
      month = "April";
      break;
    case 4:
      month = "May";
      break;
    case 5:
      month = "June";
      break;
    case 6:
      month = "July";
      break;
    case 7:
      month = "August";
      break;
    case 8:
      month = "September";
      break;
    case 9:
      month = "October";
      break;
    case 10:
      month = "November";
      break;
    case 11:
      month = "December";
      break;
  }

  monthAndYear.textContent = `${month + ", " + year}`;
  for (let i = 0; i < 7; ++i) {
    days.appendChild(dayNames[(i + startMondayOffset) % 7]);
  }

  const lastOffset = startMondayOffset ? lastMondayOffset : lastSundayOffset;
  const nextOffset = startMondayOffset ? nextMondayOffset : nextSundayOffset;
  let dateAdjuster = lastOffset - 1;
  for (let i = 0; i < lastOffset + thisMonthMaxDays + nextOffset; ++i) {
    const day = document.createElement("div");
    const h3 = document.createElement("h3");
    const h4 = document.createElement("h4");

    let adjustedDate = 0;
    let adjustedMonthIndex = monthIndex;
    let adjustedYear = year;

    if (i < lastOffset) {
      adjustedDate = lastMonthMaxDays - dateAdjuster;
      dateAdjuster -= 1;

      adjustedMonthIndex = monthIndex - 1;
      if (adjustedMonthIndex == -1) {
        adjustedMonthIndex = 11;
        adjustedYear -= 1;
      }

      day.classList.add("past");
    } else if (i < lastOffset + thisMonthMaxDays) {
      dateAdjuster += 1;
      adjustedDate = dateAdjuster + 1;
    } else {
      adjustedDate = i + 1 - (thisMonthMaxDays + lastOffset);

      adjustedMonthIndex += 1;
      if (adjustedMonthIndex === 12) {
        adjustedMonthIndex = 0;
        adjustedYear += 1;
      }

      day.classList.add("future");
    }

    if (
      adjustedDate === today.getDate() &&
      adjustedMonthIndex === today.getMonth() &&
      adjustedYear === today.getFullYear()
    ) {
      day.classList.remove("past");
      day.classList.remove("future");
      day.classList.add("current");
    }

    let hours = "0.0";
    if (workHistory.years[adjustedYear]) {
      hours = calcTotalRoundedHours(
        workHistory.years[adjustedYear][adjustedMonthIndex][adjustedDate - 1]
      );
    }

    if (hours !== "0.0") {
      h4.textContent = `${hours} hours`;
    }

    const potentialPayDay = new Date(
      adjustedYear,
      adjustedMonthIndex,
      adjustedDate
    );
    if (
      Math.round(Math.abs(potentialPayDay - payday) / 1000 / 60 / 60 / 24) %
        14 ===
      0
    ) {
      day.classList.add("pay");
    }

    h3.textContent = adjustedDate;
    day.classList.add("day");

    day.appendChild(h3);
    day.appendChild(h4);
    days.appendChild(day);
  }
}

function destroyCalendar() {
  const totalDays = days.children.length;
  for (let i = 0; i < totalDays; ++i) {
    days.removeChild(days.lastChild);
  }
}

nextMonthButton.addEventListener("click", function (e) {
  e.preventDefault();

  monthIndex += 1;
  if (monthIndex == 12) {
    year += 1;
    monthIndex = 0;
  }

  destroyCalendar();
  drawCalendar(monthIndex, year);
});

prevMonthButton.addEventListener("click", function (e) {
  e.preventDefault();

  monthIndex -= 1;
  if (monthIndex == -1) {
    year -= 1;
    monthIndex = 11;
  }

  destroyCalendar();
  drawCalendar(monthIndex, year);
});

currMonthButton.addEventListener("click", function (e) {
  e.preventDefault();

  monthIndex = new Date().getMonth();
  year = new Date().getFullYear();

  destroyCalendar();
  drawCalendar(monthIndex, year);
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === "updateCurrentDay") {
    const todayHoursDisplay = document.querySelector(".current.day > h4");
    if (todayHoursDisplay) {
      todayHoursDisplay.textContent = request.totalRoundedHours + " hours";
    }
  } else if (request.message === "drawCalendar") {
    destroyCalendar();
    drawCalendar(monthIndex, year);
  }
});

let monthIndex = new Date().getMonth();
let year = new Date().getFullYear();

drawCalendar(monthIndex, year);
