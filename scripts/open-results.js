async function openResults() {
  const anchors = document.querySelectorAll(
    ".ewok-buds-column a[data-oldhref]"
  );

  for (let i = 0; i < anchors.length; ++i) {
    anchors[i].addEventListener("click", async (e) => {
      const { settings } = await chrome.storage.local.get("settings");
      let url = anchors[i].getAttribute("data-oldhref");
      url = url.substring(url.indexOf("=") + 1);
      url = decodeURIComponent(url);
      if (settings.openResults) {
        window.open(url, "_blank", "noreferrer");
      }
    });
  }
}

openResults();
