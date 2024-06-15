chrome.runtime.onMessage.addListener(async (request) => {
  if (request.message === "alertRater") {
    const audioCtx = new AudioContext();
    const audio = document.querySelector("audio");

    const source = audioCtx.createMediaElementSource(audio);
    const gainNode = audioCtx.createGain();

    gainNode.gain.value = request.settings.alertVolume;

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    audio.play();
  }
});
