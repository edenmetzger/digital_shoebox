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

  if (key === "~" || key === "`") {
    event.preventDefault();
    showRandomMemory();
  }
}