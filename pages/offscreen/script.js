chrome.runtime.onMessage.addListener((request) => {
  if (request.message === "alertRater") {
    const audioCtx = new AudioContext();
    const audio = document.querySelector("audio");

    const source = audioCtx.createMediaElementSource(audio);
    const gainNode = audioCtx.createGain();

    gainNode.gain.value = 4;

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    audio.play();
  }
});
