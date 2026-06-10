const shoeboxKeyActions = {
  ArrowRight: spreadRight,
  ArrowLeft: spreadLeft,
  ArrowUp: surfaceObjects,
  ArrowDown: gatherObjects,
  Tab: focusNextScan
};

const audioKeyActions = {
  p: togglePlayPause,
  "]": playNextTrack,
  "[": playPreviousTrack,
  m: toggleMute,
  "/": toggleMute,
  r: playRandomTrack,
  MediaPlayPause: togglePlayPause,
  MediaTrackNext: playNextTrack,
  AudioTrackNext: playNextTrack,
  MediaTrackPrevious: playPreviousTrack,
  AudioTrackPrevious: playPreviousTrack,
  AudioVolumeMute: toggleMute
};

function initializeShoeboxControls() {
  document.addEventListener("keydown", handleShoeboxKeydown);
  document.addEventListener("keyup", handleShoeboxKeyup);
}

function handleShoeboxKeydown(event) {
  if (isTypingInInput(event)) return;

  const directAction = shoeboxKeyActions[event.key];

  if (directAction) {
    event.preventDefault();
    directAction();
    return;
  }

  const key = event.key.toLowerCase();

  if (key === "x") {
    event.preventDefault();
    closeInfoCard();

    if (legend) {
      legend.classList.add("hidden");
    }

    return;
  }

  if (key === "s") {
    event.preventDefault();

    if (!event.repeat) {
      startHeldShake();
    }

    return;
  }

  if (event.key === "~" || event.key === "`") {
    event.preventDefault();

    if (!event.repeat) {
      showRandomMemory();
    }
  }
}

function handleShoeboxKeyup(event) {
  if (isTypingInInput(event)) return;

  if (event.key.toLowerCase() === "s") {
    event.preventDefault();
    stopHeldShake();
  }
}

function initializeAudioKeyboardControls() {
  document.addEventListener("keydown", handleAudioKeyboardControls);
}

function handleAudioKeyboardControls(event) {
  if (isTypingInInput(event)) return;

  const key = event.key.length === 1
    ? event.key.toLowerCase()
    : event.key;

  const action = audioKeyActions[key];

  if (!action) return;

  event.preventDefault();
  action();
}