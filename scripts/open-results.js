async function openResults() {
  const { settings } = await chrome.storage.local.get("settings");

  if (settings.openResults) {
    const anchors = document.querySelectorAll(
      ".ewok-buds-column a[data-oldhref]"
    );
    for (let i = 0; i < anchors.length; ++i) {
      anchors[i].addEventListener("click", async (e) => {
        let url = anchors[i].getAttribute("data-oldhref");
        url = url.substring(url.indexOf("=") + 1);
        url = decodeURIComponent(url);

        window.open(url, "_blank", "noreferrer");
      });
    }
  }
}

openResults();
