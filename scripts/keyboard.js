function initializeShoeboxControls() {
  document.addEventListener("keydown", (event) => {
    if (isTypingInInput(event)) return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      stopAllTossAnimations();
      spreadObjects();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stopAllTossAnimations();
      gatherObjects();
    }

    if (event.key === "Tab") {
      event.preventDefault();
      focusNextScan();
    }
  });
}

function initializeAudioKeyboardControls() {
  document.addEventListener("keydown", handleAudioKeyboardControls);
}

function handleAudioKeyboardControls(event) {
  if (isTypingInInput(event)) return;

  const key = event.key;

  if (
    key === "MediaPlayPause" ||
    (key === " " && event.shiftKey)
  ) {
    event.preventDefault();
    togglePlayPause();
  }

  if (
    key === "MediaTrackNext" ||
    key === "AudioTrackNext" ||
    key === "]"
  ) {
    event.preventDefault();
    playNextTrack();
  }

  if (
    key === "MediaTrackPrevious" ||
    key === "AudioTrackPrevious" ||
    key === "["
  ) {
    event.preventDefault();
    playPreviousTrack();
  }

  if (
    key === "AudioVolumeMute" ||
    key.toLowerCase() === "m"
  ) {
    event.preventDefault();
    toggleMute();
  }
}