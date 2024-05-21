const calendar = document.querySelector(".calendar");
const monthAndYear = document.querySelector(".month-year");
const days = document.querySelector(".days");
const nextMonthButton = document.querySelector(".next-month");
const prevMonthButton = document.querySelector(".prev-month");
const currMonthButton = document.querySelector(".curr-month");

let month = new Date().getMonth();
let year = new Date().getFullYear();
let monday = false;

async function initializeCalendar() {
  const { settings } = await chrome.storage.local.get("settings");
  if (settings.startMonday) {
    for (let i = 1; i < 7; ++i) {
      let currDay = days.children[i - 1].textContent;
      days.children[i - 1].textContent = days.children[i].textContent;
      days.children[i].textContent = currDay;
    }
    monday = true;
  }
  drawCalendar(month, year);
}

async function drawCalendar(month, year) {
  const message = "getTime";
  const { time, roundedTotalHoursWorked } = await chrome.runtime.sendMessage({
    message,
  });

  const payday = new Date(time.payday);

  const currDate = new Date().getDate();
  const currMonth = new Date().getMonth();
  const currYear = new Date().getFullYear();

  const thisMonthMaxDays = new Date(year, month + 1, 0).getDate();
  const lastMonthMaxDays = new Date(year, month, 0).getDate();

  const lastSundayOffset = new Date(year, month, 1).getDay();
  const lastMondayOffset =
    lastSundayOffset - 1 >= 0 ? lastSundayOffset - 1 : lastSundayOffset - 1 + 7;

  const nextSundayOffset = 6 - new Date(year, month + 1, 0).getDay();
  const nextMondayOffset =
    nextSundayOffset + 1 === 7 ? 0 : nextSundayOffset + 1;

  let monthString;
  switch (month) {
    case 0:
      monthString = "January";
      break;
    case 1:
      monthString = "Febuary";
      break;
    case 2:
      monthString = "March";
      break;
    case 3:
      monthString = "April";
      break;
    case 4:
      monthString = "May";
      break;
    case 5:
      monthString = "June";
      break;
    case 6:
      monthString = "July";
      break;
    case 7:
      monthString = "August";
      break;
    case 8:
      monthString = "September";
      break;
    case 9:
      monthString = "October";
      break;
    case 10:
      monthString = "November";
      break;
    case 11:
      monthString = "December";
      break;
  }
  monthAndYear.textContent = `${monthString + ", " + year}`;

  const lastOffset = monday ? lastMondayOffset : lastSundayOffset;
  const nextOffset = monday ? nextMondayOffset : nextSundayOffset;
  let dateAdjuster = lastOffset - 1;

  for (let i = 0; i < lastOffset + thisMonthMaxDays + nextOffset; ++i) {
    const day = document.createElement("div");
    const h3 = document.createElement("h3");
    const h4 = document.createElement("h4");

    let adjustedDate = 0;
    let adjustedMonth = month;
    let adjustedYear = year;
    let hours = 0;

    if (i < lastOffset) {
      adjustedDate = lastMonthMaxDays - dateAdjuster;
      dateAdjuster -= 1;

      adjustedMonth = month - 1;
      if (adjustedMonth == -1) {
        adjustedMonth = 11;
        adjustedYear -= 1;
      }

      day.classList.add("past");
    } else if (i < lastOffset + thisMonthMaxDays) {
      dateAdjuster += 1;
      adjustedDate = dateAdjuster + 1;
    } else {
      adjustedDate = i + 1 - (thisMonthMaxDays + lastOffset);

      adjustedMonth += 1;
      if (adjustedMonth === 12) {
        adjustedMonth = 0;
        adjustedYear += 1;
      }

      day.classList.add("future");
    }

    if (time[adjustedYear]) {
      hours = time[adjustedYear][adjustedMonth][adjustedDate - 1];
      if (hours > 0) {
        day.classList.add("worked");
      }
    }

    if (
      adjustedDate === currDate &&
      adjustedMonth === currMonth &&
      adjustedYear === currYear
    ) {
      day.classList.add("current");
      hours = +roundedTotalHoursWorked;
    }

    if (hours > 8) {
      hours = 8;
    }

    const potentialPayDay = new Date(adjustedYear, adjustedMonth, adjustedDate);
    if (
      Math.round(Math.abs(potentialPayDay - payday) / 1000 / 60 / 60 / 24) %
        14 ===
      0
    ) {
      day.classList.add("pay");
    }

    h3.textContent = adjustedDate;
    h4.textContent = `${hours.toFixed(1)} hours`;
    day.classList.add("day");

    day.appendChild(h3);
    day.appendChild(h4);
    days.appendChild(day);
  }
}

function destroyCalendar() {
  let totalDays = days.children.length;
  for (let i = 7; i < totalDays; ++i) {
    const day = days.lastChild;
    days.removeChild(day);
  }
}

nextMonthButton.addEventListener("click", function (e) {
  e.preventDefault();

  destroyCalendar();

  month += 1;
  if (month == 12) {
    year += 1;
    month = 0;
  }

  drawCalendar(month, year);
});

prevMonthButton.addEventListener("click", function (e) {
  e.preventDefault();

  destroyCalendar();

  month -= 1;
  if (month == -1) {
    year -= 1;
    month = 11;
  }

  drawCalendar(month, year);
});

currMonthButton.addEventListener("click", function (e) {
  e.preventDefault();
  month = new Date().getMonth();
  year = new Date().getFullYear();
  destroyCalendar();

  drawCalendar(month, year);
});

initializeCalendar();
