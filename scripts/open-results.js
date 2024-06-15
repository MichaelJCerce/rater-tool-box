function addLink() {
  let url = this.getAttribute("data-oldhref");
  url = url.substring(url.indexOf("=") + 1);
  url = decodeURIComponent(url);
  window.open(url, "_blank", "noreferrer");
}

async function openResults() {
  const { settings } = await chrome.storage.local.get("settings");
  const anchors = document.querySelectorAll("a[data-oldhref]");

  for (let i = 0; i < anchors.length; ++i) {
    if (settings.openResults) {
      anchors[i].addEventListener("click", addLink);
    } else {
      anchors[i].removeEventListener("click", addLink);
    }
  }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "updateTabs") {
    openResults();
  }
});

openResults();
