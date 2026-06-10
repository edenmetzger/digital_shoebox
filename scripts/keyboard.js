function initializeShoeboxControls() {
  document.addEventListener("keydown", (event) => {
    if (isTypingInInput(event)) return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      spreadRight();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      spreadLeft();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      surfaceObjects();
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      gatherObjects();
    }

    if (event.key === "Tab") {
      event.preventDefault();
      focusNextScan();
    }

    if (event.key.toLowerCase() === "x") {
      event.preventDefault();
      closeInfoCard();

      if (legend) {
        legend.classList.add("hidden");
      }
    }

    if (event.key.toLowerCase() === "s") {
      event.preventDefault();

      if (!event.repeat) {
        startHeldShake();
      }
    }

    if (event.key === "~" || event.key === "`") {
      event.preventDefault();

      if (!event.repeat) {
        showRandomMemory();
      }
    }
  });

  document.addEventListener("keyup", (event) => {
    if (isTypingInInput(event)) return;

    if (event.key.toLowerCase() === "s") {
      event.preventDefault();
      stopHeldShake();
    }
  });
}

function initializeAudioKeyboardControls() {
  document.addEventListener("keydown", handleAudioKeyboardControls);
}

function handleAudioKeyboardControls(event) {
  if (isTypingInInput(event)) return;

  const key = event.key.toLowerCase();

  if (key === "p") {
    event.preventDefault();
    togglePlayPause();
  }

  if (event.key === "]") {
    event.preventDefault();
    playNextTrack();
  }

  if (event.key === "[") {
    event.preventDefault();
    playPreviousTrack();
  }

  if (key === "m" || event.key === "/") {
    event.preventDefault();
    toggleMute();
  }

  if (key === "r") {
    event.preventDefault();
    playRandomTrack();
  }

  if (event.key === "MediaPlayPause") {
    event.preventDefault();
    togglePlayPause();
  }

  if (
    event.key === "MediaTrackNext" ||
    event.key === "AudioTrackNext"
  ) {
    event.preventDefault();
    playNextTrack();
  }

  if (
    event.key === "MediaTrackPrevious" ||
    event.key === "AudioTrackPrevious"
  ) {
    event.preventDefault();
    playPreviousTrack();
  }

  if (event.key === "AudioVolumeMute") {
    event.preventDefault();
    toggleMute();
  }
}