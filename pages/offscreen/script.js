chrome.runtime.onMessage.addListener((request) => {
  if (request.message === "alertRater") {
    const audio = document.querySelector("audio");
    audio.play();
  }
});
