function initializeSound() {
  if (
    !backgroundAudio ||
    !playPauseButton ||
    !muteButton ||
    !prevTrackButton ||
    !nextTrackButton ||
    !shuffleButton ||
    !volumeSlider ||
    !audioTrackTitle ||
    !audioStatus
  ) {
    return;
  }

  backgroundAudio.volume = Number(volumeSlider.value);

  loadTrack(currentTrackIndex);

  document.addEventListener(
    "pointerdown",
    startAudioAfterInteraction,
    { once: true }
  );

  playPauseButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    togglePlayPause();
  });

  muteButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleMute();
  });

  prevTrackButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    playPreviousTrack();
  });

  nextTrackButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    playNextTrack();
  });

  shuffleButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    playRandomTrack();
  });

  if (randomMemoryButton) {
    randomMemoryButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      showRandomMemory();
    });
  }

  volumeSlider.addEventListener("input", () => {
    backgroundAudio.volume = Number(volumeSlider.value);

    if (backgroundAudio.volume > 0) {
      backgroundAudio.muted = false;
      muteButton.classList.remove("audio-button-muted");
    }
  });

  backgroundAudio.addEventListener("play", updateAudioUI);
  backgroundAudio.addEventListener("pause", updateAudioUI);
  backgroundAudio.addEventListener("ended", playRandomTrack);
}

function loadTrack(index) {
  if (!audioTracks.length) return;

  const track = audioTracks[index];

  backgroundAudio.src = track.file;
  audioTrackTitle.textContent = track.title;
  audioStatus.textContent = "paused";
  playPauseButton.textContent = "play";
}

function startAudioAfterInteraction(event) {
  if (
    !backgroundAudio ||
    hasTriedToStartAudio ||
    event.target.closest("#audioWidget")
  ) {
    return;
  }

  hasTriedToStartAudio = true;

  playAudio();
}

function playAudio() {
  backgroundAudio.play()
    .then(updateAudioUI)
    .catch(() => {
      audioStatus.textContent = "paused";
      playPauseButton.textContent = "play";
    });
}

function togglePlayPause() {
  if (backgroundAudio.paused) {
    playAudio();
    return;
  }

  backgroundAudio.pause();
  updateAudioUI();
}

function toggleMute() {
  backgroundAudio.muted = !backgroundAudio.muted;

  if (backgroundAudio.muted) {
    muteButton.classList.add("audio-button-muted");
  } else {
    muteButton.classList.remove("audio-button-muted");
  }
}

function playPreviousTrack() {
  currentTrackIndex =
    (currentTrackIndex - 1 + audioTracks.length) %
    audioTracks.length;

  const wasPlaying = !backgroundAudio.paused;

  loadTrack(currentTrackIndex);

  if (wasPlaying) {
    playAudio();
  }
}

function playNextTrack() {
  currentTrackIndex =
    (currentTrackIndex + 1) % audioTracks.length;

  const wasPlaying = !backgroundAudio.paused;

  loadTrack(currentTrackIndex);

  if (wasPlaying) {
    playAudio();
  }
}

function playRandomTrack() {
  if (audioTracks.length <= 1) return;

  let newIndex;

  do {
    newIndex = Math.floor(
      Math.random() * audioTracks.length
    );
  } while (newIndex === currentTrackIndex);

  currentTrackIndex = newIndex;

  const wasPlaying = !backgroundAudio.paused;

  loadTrack(currentTrackIndex);

  if (wasPlaying) {
    playAudio();
  }
}

function updateAudioUI() {
  if (backgroundAudio.paused) {
    audioStatus.textContent = "paused";
    playPauseButton.textContent = "play";
  } else {
    audioStatus.textContent = "playing";
    playPauseButton.textContent = "pause";
  }
}