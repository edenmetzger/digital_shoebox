const IMAGE_COUNT = 12;

function getDefaultScale() {
  if (IMAGE_COUNT >= 100) return 0.40;
  if (IMAGE_COUNT >= 50) return 0.50;
  if (IMAGE_COUNT >= 20) return 0.75;
  if (IMAGE_COUNT >= 10) return 0.90;

  return 1;
}

function getMinimumScale() {
  if (IMAGE_COUNT >= 100) {
    return getDefaultScale();
  }

  return 0.5;
}

const IMAGE_FOLDER = "images";
const IMAGE_PREFIX = "scan";
const IMAGE_EXTENSION = "jpg";

const INTRO_DURATION = 3500;
const INTRO_FADE_DURATION = 1000;

const DOUBLE_TAP_DELAY = 350;
const TAP_MOVE_LIMIT = 10;

const FOUND_STORAGE_KEY = "shoeboxFoundObjects";

const TOSS_FRICTION = 0.85;
const TOSS_MIN_VELOCITY = 0.35;
const OFFSCREEN_MARGIN_RATIO = 0.6;


const audioTracks = [
  { title: "track 01", file: "audio/track01.mp3" },
  { title: "track 02", file: "audio/track02.mp3" },
  { title: "track 03", file: "audio/track03.mp3" },
  { title: "track 04", file: "audio/track04.mp3" },
  { title: "track 05", file: "audio/track05.mp3" }
];

const archiveData =
  typeof archive !== "undefined" ? archive : blurbs;

let imagePaths = [];

for (let i = 1; i <= IMAGE_COUNT; i++) {
  imagePaths.push(`${IMAGE_FOLDER}/${IMAGE_PREFIX}${i}.${IMAGE_EXTENSION}`);
}

const workspace = document.getElementById("workspace");
const introOverlay = document.getElementById("introOverlay");

const infoCard = document.getElementById("infoCard");
const infoTitle = document.getElementById("infoTitle");
const infoText = document.getElementById("infoText");
const closeInfo = document.getElementById("closeInfo");
const noteButton = document.getElementById("noteButton");
const notePanel = document.getElementById("notePanel");
const relatedObjects = document.getElementById("relatedObjects");
const memoryTrail = document.getElementById("memoryTrail");
const foundCounter = document.getElementById("foundCounter");

const backgroundAudio = document.getElementById("backgroundAudio");
const audioTrackTitle = document.getElementById("audioTrackTitle");
const audioStatus = document.getElementById("audioStatus");
const playPauseButton = document.getElementById("playPauseButton");
const muteButton = document.getElementById("muteButton");
const prevTrackButton = document.getElementById("prevTrackButton");
const nextTrackButton = document.getElementById("nextTrackButton");
const shuffleButton = document.getElementById("shuffleButton");
const randomMemoryButton = document.getElementById("randomMemoryButton");
const volumeSlider = document.getElementById("volumeSlider");
const helpToggle = document.getElementById("helpToggle");
const legend = document.getElementById("legend");

let topZ = IMAGE_COUNT + 1;

let activeScan = null;
let activePointerId = null;

let dragStartX = 0;
let dragStartY = 0;
let imageStartX = 0;
let imageStartY = 0;

let lastMoveX = 0;
let lastMoveY = 0;
let lastMoveTime = 0;
let velocityX = 0;
let velocityY = 0;

let pointers = new Map();
let initialPinchDistance = 0;
let initialScale = 1;

let currentTrackIndex = 0;
let hasTriedToStartAudio = false;

let hasMovedDuringPointer = false;
let lastTapTime = 0;
let lastTappedScan = null;

let focusQueue = [];

const tossAnimations = new Map();

initializeIntro();
initializeSound();
initializeScans();
initializeMetadataMode();
initializeShoeboxControls();
updateFoundCounter();
initializeHelpToggle();

function initializeScans() {
  shuffle(imagePaths);

  imagePaths.forEach((imagePath, index) => {
    const scan = document.createElement("img");
    const filename = imagePath.split("/").pop();

    scan.src = imagePath;
    scan.className = "scan";
    scan.alt = `Scan ${index + 1}`;
    scan.draggable = false;
    scan.dataset.scale = 1;
    scan.dataset.filename = filename;

    workspace.appendChild(scan);

    const label = document.createElement("div");
    label.className = "metadata-label";
    label.dataset.filename = filename;
    label.innerHTML = getMetadataText(filename);
    workspace.appendChild(label);

    scan.addEventListener("dragstart", (event) => {
      event.preventDefault();
    });

    scan.addEventListener("pointerdown", pointerDown);

    scan.addEventListener("wheel", resizeWithTrackpad, {
      passive: false
    });

    if (scan.complete) {
      randomizeImage(scan, index);
      positionMetadataLabel(scan);
    } else {
      scan.onload = () => {
        randomizeImage(scan, index);
        positionMetadataLabel(scan);
      };
    }
  });
}

function getMetadataText(filename) {
  const item = archiveData[filename];

  if (!item) {
    return "unknown<br>object";
  }

  const lines = [
    item.year || item.date || "unknown date",
    item.type || "object",
    item.category || "",
    item.location || "",
    item.source || ""
  ];

  return lines
    .filter((line) => line && line.trim() !== "")
    .join("<br>");
}

function initializeMetadataMode() {
  document.addEventListener("keydown", (event) => {
    if (
      event.code === "Space" &&
      !event.repeat &&
      !isTypingInInput(event)
    ) {
      event.preventDefault();
      document.body.classList.add("metadata-mode");
      updateAllMetadataLabels();
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
      document.body.classList.remove("metadata-mode");
    }
  });
}

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

function isTypingInInput(event) {
  const tag = event.target.tagName.toLowerCase();

  return (
    tag === "input" ||
    tag === "textarea" ||
    event.target.isContentEditable
  );
}

function updateAllMetadataLabels() {
  const scans = Array.from(document.querySelectorAll(".scan"));

  const topScans = scans
    .sort((a, b) => {
      const aZ = Number(a.style.zIndex) || 0;
      const bZ = Number(b.style.zIndex) || 0;

      return bZ - aZ;
    })
    .slice(0, 10);

  document.querySelectorAll(".metadata-label").forEach((label) => {
    label.classList.remove("visible-metadata");
  });

  topScans.forEach((scan) => {
    positionMetadataLabel(scan);

    const label = document.querySelector(
      `.metadata-label[data-filename="${scan.dataset.filename}"]`
    );

    if (label) {
      label.classList.add("visible-metadata");
    }
  });
}

function positionMetadataLabel(scan) {
  const filename = scan.dataset.filename;
  const label = document.querySelector(
    `.metadata-label[data-filename="${filename}"]`
  );

  if (!label) return;

  const left = parseFloat(scan.style.left) || 0;
  const top = parseFloat(scan.style.top) || 0;

  const scale = Number(scan.dataset.scale) || 1;

  const scanWidth = scan.offsetWidth * scale;
  const scanHeight = scan.offsetHeight * scale;

  label.style.left = `${left + scanWidth / 2}px`;
  label.style.top = `${top + scanHeight / 2}px`;

  label.style.transform = "translate(-50%, -50%)";
  label.style.zIndex = Number(scan.style.zIndex || 1) + 1;
}

function pointerDown(event) {
  event.preventDefault();
  event.stopPropagation();

  const selectedScan = event.currentTarget;

  if (activeScan && activeScan !== selectedScan) return;

  stopTossAnimation(selectedScan);

  activeScan = selectedScan;
  activePointerId = event.pointerId;
  hasMovedDuringPointer = false;

  pointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY
  });

  lockOtherScans(activeScan);

  topZ++;
  activeScan.style.zIndex = topZ;

  dragStartX = event.clientX;
  dragStartY = event.clientY;

  imageStartX = parseFloat(activeScan.style.left) || 0;
  imageStartY = parseFloat(activeScan.style.top) || 0;

  lastMoveX = event.clientX;
  lastMoveY = event.clientY;
  lastMoveTime = performance.now();
  velocityX = 0;
  velocityY = 0;

  if (pointers.size === 2) {
    closeInfoCard();

    const points = Array.from(pointers.values());

    initialPinchDistance = getDistance(points[0], points[1]);
    initialScale = Number(activeScan.dataset.scale) || 1;
  }

  window.addEventListener("pointermove", pointerMove, {
    passive: false
  });

  window.addEventListener("pointerup", pointerUp);
  window.addEventListener("pointercancel", pointerUp);
}

function pointerMove(event) {
  if (!activeScan || !pointers.has(event.pointerId)) return;

  event.preventDefault();
  event.stopPropagation();

  pointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY
  });

  if (pointers.size === 1) {
    const dx = event.clientX - dragStartX;
    const dy = event.clientY - dragStartY;

    if (
      Math.abs(dx) > TAP_MOVE_LIMIT ||
      Math.abs(dy) > TAP_MOVE_LIMIT
    ) {
      hasMovedDuringPointer = true;
      closeInfoCard();
    }

    const now = performance.now();
    const timeDelta = Math.max(16, now - lastMoveTime);

    velocityX = ((event.clientX - lastMoveX) / timeDelta) * 16;
    velocityY = ((event.clientY - lastMoveY) / timeDelta) * 16;

    lastMoveX = event.clientX;
    lastMoveY = event.clientY;
    lastMoveTime = now;

    activeScan.style.left = `${imageStartX + dx}px`;
    activeScan.style.top = `${imageStartY + dy}px`;
  }

  if (pointers.size === 2) {
    hasMovedDuringPointer = true;
    closeInfoCard();

    const points = Array.from(pointers.values());

    const newDistance = getDistance(points[0], points[1]);
    const scaleChange = newDistance / initialPinchDistance;

    let newScale = initialScale * scaleChange;
    newScale = Math.max(
  getMinimumScale(),
  Math.min(1.5, newScale)
);

    activeScan.dataset.scale = newScale;
  }

  applyTransform(activeScan);
positionMetadataLabel(activeScan);
}

function pointerUp(event) {
  if (!activeScan) return;

  const releasedScan = activeScan;

  pointers.delete(event.pointerId);

  if (
    !hasMovedDuringPointer &&
    event.pointerId === activePointerId
  ) {
    handleDoubleTapOrClick(
      releasedScan,
      event.clientX,
      event.clientY
    );
  }

  if (
    hasMovedDuringPointer &&
    event.pointerId === activePointerId &&
    pointers.size === 0
  ) {
    startTossAnimation(releasedScan, velocityX, velocityY);
  }

  if (pointers.size === 0) {
    unlockAllScans();

    activeScan = null;
    activePointerId = null;

    window.removeEventListener("pointermove", pointerMove);
    window.removeEventListener("pointerup", pointerUp);
    window.removeEventListener("pointercancel", pointerUp);
  }
}

function startTossAnimation(scan, vx, vy) {
  if (
    Math.abs(vx) < TOSS_MIN_VELOCITY &&
    Math.abs(vy) < TOSS_MIN_VELOCITY
  ) {
    return;
  }

  stopTossAnimation(scan);

  function animate() {
    let x = parseFloat(scan.style.left) || 0;
    let y = parseFloat(scan.style.top) || 0;

    x += vx;
    y += vy;

    const scale = Number(scan.dataset.scale) || 1;
    const margin = getOffscreenMargin();

    const minX = -margin;
    const minY = -margin;

    const maxX =
      window.innerWidth -
      scan.offsetWidth * scale +
      margin;

    const maxY =
      window.innerHeight -
      scan.offsetHeight * scale +
      margin;

    if (x < minX) {
      x = minX;
      vx = 0;
    }

    if (x > maxX) {
      x = maxX;
      vx = 0;
    }

    if (y < minY) {
      y = minY;
      vy = 0;
    }

    if (y > maxY) {
      y = maxY;
      vy = 0;
    }

    vx *= TOSS_FRICTION;
    vy *= TOSS_FRICTION;

    scan.style.left = `${x}px`;
    scan.style.top = `${y}px`;

    applyTransform(scan);
positionMetadataLabel(scan);

    if (
      Math.abs(vx) < TOSS_MIN_VELOCITY &&
      Math.abs(vy) < TOSS_MIN_VELOCITY
    ) {
      tossAnimations.delete(scan);
      return;
    }

    const animationId = requestAnimationFrame(animate);
    tossAnimations.set(scan, animationId);
  }

  const animationId = requestAnimationFrame(animate);
  tossAnimations.set(scan, animationId);
}

function getOffscreenMargin() {
  const scans = Array.from(document.querySelectorAll(".scan"));

  if (!scans.length) {
    return 120;
  }

  const smallestSize = Math.min(
    ...scans.map((scan) => {
      const scale = Number(scan.dataset.scale) || 1;
      return Math.min(
        scan.offsetWidth * scale,
        scan.offsetHeight * scale
      );
    })
  );

  return smallestSize * OFFSCREEN_MARGIN_RATIO;
}

function stopTossAnimation(scan) {
  const animationId = tossAnimations.get(scan);

  if (animationId) {
    cancelAnimationFrame(animationId);
    tossAnimations.delete(scan);
  }
}

function stopAllTossAnimations() {
  tossAnimations.forEach((animationId) => {
    cancelAnimationFrame(animationId);
  });

  tossAnimations.clear();
}

function lockOtherScans(selectedScan) {
  const scans = document.querySelectorAll(".scan");

  scans.forEach((scan) => {
    if (scan !== selectedScan) {
      scan.style.pointerEvents = "none";
    }
  });

  selectedScan.style.pointerEvents = "auto";
}

function unlockAllScans() {
  const scans = document.querySelectorAll(".scan");

  scans.forEach((scan) => {
    scan.style.pointerEvents = "auto";
  });
}

function handleDoubleTapOrClick(scan, x, y) {
  const now = Date.now();

  const isDoubleTap =
    lastTappedScan === scan &&
    now - lastTapTime < DOUBLE_TAP_DELAY;

  if (isDoubleTap) {
    showInfoCard(scan, x, y);

    lastTapTime = 0;
    lastTappedScan = null;

    return;
  }

  lastTapTime = now;
  lastTappedScan = scan;
}

function showInfoCard(scan, x, y, offsetFromClick = true) {
  const filename = scan.dataset.filename;
  const objectInfo = archiveData[filename];

  markObjectAsFound(filename);

  if (!objectInfo) {
    infoTitle.textContent = "Untitled Object";
    infoText.textContent =
      "No information has been added for this object yet.";
  } else {
    infoTitle.textContent = objectInfo.title;
    infoText.textContent = objectInfo.description;
  }

  renderNote(objectInfo);
  renderRelatedObjects(objectInfo);
  renderMemoryTrail(objectInfo);

  infoCard.style.left = `${offsetFromClick ? x + 20 : x}px`;
  infoCard.style.top = `${offsetFromClick ? y + 20 : y}px`;

  infoCard.classList.remove("hidden");
}

function markObjectAsFound(filename) {
  const found = getFoundObjects();

  if (!found.includes(filename)) {
    found.push(filename);

    localStorage.setItem(
      FOUND_STORAGE_KEY,
      JSON.stringify(found)
    );
  }

  updateFoundCounter();
}

function getFoundObjects() {
  const stored = localStorage.getItem(FOUND_STORAGE_KEY);

  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function updateFoundCounter() {
  if (!foundCounter) return;

  const visibleFilenames = imagePaths.map((path) =>
    path.split("/").pop()
  );

  const found = getFoundObjects().filter((filename) =>
    visibleFilenames.includes(filename)
  );

  const percentage = visibleFilenames.length
    ? Math.round((found.length / visibleFilenames.length) * 100)
    : 0;

  foundCounter.textContent =
    `found ${found.length} / ${visibleFilenames.length} (${percentage}%)`;
}

function renderNote(objectInfo) {
  notePanel.classList.add("hidden");
  notePanel.textContent = "";

  if (!objectInfo || !objectInfo.note) {
    noteButton.classList.add("hidden");
    return;
  }

  noteButton.classList.remove("hidden");
  noteButton.textContent = "pull out note";

  noteButton.onclick = () => {
    notePanel.textContent = objectInfo.note.trim();
    notePanel.classList.toggle("hidden");
  };
}

function renderRelatedObjects(objectInfo) {
  relatedObjects.innerHTML = "";

  if (
    !objectInfo ||
    !objectInfo.related ||
    !objectInfo.related.length
  ) {
    return;
  }

  const heading = document.createElement("div");
  heading.className = "related-heading";
  heading.textContent = "related objects";
  relatedObjects.appendChild(heading);

  objectInfo.related.forEach((filename) => {
    const relatedItem = archiveData[filename];
    const relatedScan = document.querySelector(
      `.scan[data-filename="${filename}"]`
    );

    if (!relatedItem || !relatedScan) return;

    const button = document.createElement("button");
    button.textContent = relatedItem.title || filename;

    button.addEventListener("click", () => {
      openObjectByFilename(filename, true);
    });

    relatedObjects.appendChild(button);
  });
}

function renderMemoryTrail(objectInfo) {
  memoryTrail.innerHTML = "";

  if (!objectInfo) return;

  if (
    objectInfo.previous &&
    document.querySelector(
      `.scan[data-filename="${objectInfo.previous}"]`
    )
  ) {
    const previousButton = document.createElement("button");
    previousButton.textContent = "← earlier";
    previousButton.addEventListener("click", () => {
      openObjectByFilename(objectInfo.previous);
    });
    memoryTrail.appendChild(previousButton);
  }

  if (
    objectInfo.next &&
    document.querySelector(
      `.scan[data-filename="${objectInfo.next}"]`
    )
  ) {
    const nextButton = document.createElement("button");
    nextButton.textContent = "later →";
    nextButton.addEventListener("click", () => {
      openObjectByFilename(objectInfo.next);
    });
    memoryTrail.appendChild(nextButton);
  }
}

function openObjectByFilename(filename, shouldHighlight = false) {
  const relatedScan = document.querySelector(
    `.scan[data-filename="${filename}"]`
  );

  if (!relatedScan) return;

  bringScanToFront(relatedScan);

  if (shouldHighlight) {
    highlightScan(relatedScan);
  }

  requestAnimationFrame(() => {
    const rect = relatedScan.getBoundingClientRect();

    const CARD_WIDTH = 320;
    const CARD_HEIGHT = 220;

    let cardX = rect.left + rect.width * 0.35;
    let cardY = rect.top + rect.height * 0.65;

    if (cardX + CARD_WIDTH > window.innerWidth) {
      cardX = rect.right - CARD_WIDTH;
    }

    if (cardY + CARD_HEIGHT > window.innerHeight) {
      cardY = rect.top - CARD_HEIGHT - 16;
    }

    cardX = Math.max(20, cardX);
    cardY = Math.max(20, cardY);

    showInfoCard(relatedScan, cardX, cardY, false);
  });
}

function highlightScan(scan) {
  scan.classList.remove("scan-highlight");

  void scan.offsetWidth;

  scan.classList.add("scan-highlight");

  setTimeout(() => {
    scan.classList.remove("scan-highlight");
  }, 1200);
}

function bringScanToFront(scan) {
  const scans = Array.from(document.querySelectorAll(".scan"));

  const highestZ = scans.reduce((highest, currentScan) => {
    const z = Number(currentScan.style.zIndex) || 0;
    return Math.max(highest, z);
  }, topZ);

  topZ = highestZ + 1;

  scan.style.zIndex = topZ;
  positionMetadataLabel(scan);
}

function showRandomMemory() {
  const scans = Array.from(document.querySelectorAll(".scan"));

  if (!scans.length) return;

  const randomScan =
    scans[Math.floor(Math.random() * scans.length)];

  bringScanToFront(randomScan);

  const rect = randomScan.getBoundingClientRect();

  showInfoCard(randomScan, rect.left + 20, rect.top + 20);
}

function closeInfoCard() {
  if (!infoCard) return;

  infoCard.classList.add("hidden");
}

closeInfo.addEventListener("click", () => {
  closeInfoCard();
});

function randomizeImage(scan, index) {
  const baseRotation = Math.random() * 24 - 12;
const baseScale = getDefaultScale();

const randomScale =
  baseScale * (0.9 + Math.random() * 0.2);
  const rotation = baseRotation * (0.75 + Math.random() * 0.5);

  const maxX =
    window.innerWidth - scan.offsetWidth * randomScale;

  const maxY =
    window.innerHeight - scan.offsetHeight * randomScale;

  const x = Math.max(0, Math.random() * maxX);
  const y = Math.max(0, Math.random() * maxY);

  scan.style.left = `${x}px`;
  scan.style.top = `${y}px`;

  scan.dataset.rotation = rotation;
  scan.dataset.scale = randomScale;

  scan.style.zIndex = index + 1;

  applyTransform(scan);
}

function resizeWithTrackpad(event) {
  event.preventDefault();
  event.stopPropagation();

  closeInfoCard();

  const scan = event.currentTarget;

  stopTossAnimation(scan);

  let scale = Number(scan.dataset.scale) || 1;

  scale += -event.deltaY * 0.0015;
  scale = Math.max(
  getMinimumScale(),
  Math.min(1.5, scale)
);

  scan.dataset.scale = scale;

  bringScanToFront(scan);
applyTransform(scan);
positionMetadataLabel(scan);
}

function spreadObjects() {
  closeInfoCard();
  stopAllTossAnimations();

  const scans = Array.from(document.querySelectorAll(".scan"));

  scans.forEach((scan, index) => {
    scan.style.transition =
      "left 0.55s ease, top 0.55s ease, transform 0.55s ease";

    const scale = Number(scan.dataset.scale) || 1;

    const maxX =
      window.innerWidth - scan.offsetWidth * scale;

    const maxY =
      window.innerHeight - scan.offsetHeight * scale;

    const x = Math.max(0, Math.random() * maxX);
    const y = Math.max(0, Math.random() * maxY);

    const rotation = Math.random() * 30 - 15;

    scan.style.left = `${x}px`;
    scan.style.top = `${y}px`;

    scan.dataset.rotation = rotation;

    topZ++;
    scan.style.zIndex = topZ + index;

    applyTransform(scan);
positionMetadataLabel(scan);

    setTimeout(() => {
      scan.style.transition = "";
    }, 600);
  });
}

function gatherObjects() {
  closeInfoCard();
  stopAllTossAnimations();

  const scans = Array.from(document.querySelectorAll(".scan"));

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  scans.forEach((scan, index) => {
    scan.style.transition =
      "left 0.55s ease, top 0.55s ease, transform 0.55s ease";

    const jitterX = Math.random() * 160 - 80;
    const jitterY = Math.random() * 120 - 60;
    const rotation = Math.random() * 18 - 9;

    const x =
      centerX -
      scan.offsetWidth / 2 +
      jitterX;

    const y =
      centerY -
      scan.offsetHeight / 2 +
      jitterY;

    scan.style.left = `${x}px`;
    scan.style.top = `${y}px`;

    scan.dataset.rotation = rotation;

    topZ++;
    scan.style.zIndex = topZ + index;

    applyTransform(scan);
positionMetadataLabel(scan);

    setTimeout(() => {
      scan.style.transition = "";
    }, 600);
  });
}

function applyTransform(scan) {
  const rotation = Number(scan.dataset.rotation) || 0;
  const scale = Number(scan.dataset.scale) || 1;

  scan.style.transform =
    `rotate(${rotation}deg) scale(${scale})`;
}

function initializeIntro() {
  if (!introOverlay) return;

  const navigationEntry =
    performance.getEntriesByType("navigation")[0];

  const isRefresh =
    navigationEntry && navigationEntry.type === "reload";

  if (isRefresh) {
    introOverlay.remove();
    return;
  }

  setTimeout(() => {
    introOverlay.style.transition =
      `opacity ${INTRO_FADE_DURATION}ms ease`;

    introOverlay.style.opacity = "0";

    setTimeout(() => {
      introOverlay.remove();
    }, INTRO_FADE_DURATION);
  }, INTRO_DURATION);
}

function initializeSound() {
  if (
    !backgroundAudio ||
    !playPauseButton ||
    !muteButton ||
    !prevTrackButton ||
    !nextTrackButton ||
    !shuffleButton ||
    !randomMemoryButton ||
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

  document.addEventListener("keydown", handleAudioKeyboardControls);

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

  randomMemoryButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    showRandomMemory();
  });

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

function getDistance(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;

  return Math.sqrt(dx * dx + dy * dy);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const randomIndex =
      Math.floor(Math.random() * (i + 1));

    [array[i], array[randomIndex]] =
      [array[randomIndex], array[i]];
  }
}


function getScanCenter(scan) {
  const rect = scan.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function initializeHelpToggle() {
  if (!helpToggle || !legend) return;

  helpToggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    legend.classList.toggle("hidden");
  });

  document.addEventListener("keydown", (event) => {
    if (isTypingInInput(event)) return;

    if (event.key === "?") {
      event.preventDefault();
      legend.classList.toggle("hidden");
    }
  });
}

function buildFocusQueue() {
  const scans = Array.from(document.querySelectorAll(".scan"));

  focusQueue = scans.map((scan) => scan.dataset.filename);
  shuffle(focusQueue);
}

function focusNextScan() {
  closeInfoCard();
  stopAllTossAnimations();

  if (!focusQueue.length) {
    buildFocusQueue();
  }

  const filename = focusQueue.shift();

  const scan = document.querySelector(
    `.scan[data-filename="${filename}"]`
  );

  if (!scan) {
    focusNextScan();
    return;
  }

  bringScanToCenter(scan);
}

function bringScanToCenter(scan) {
  bringScanToFront(scan);

  scan.style.transition =
    "left 0.55s ease, top 0.55s ease, transform 0.55s ease";

  const scale = Number(scan.dataset.scale) || 1;

  const x =
    window.innerWidth / 2 -
    (scan.offsetWidth * scale) / 2;

  const y =
    window.innerHeight / 2 -
    (scan.offsetHeight * scale) / 2;

  const rotation = Math.random() * 10 - 5;

  scan.style.left = `${x}px`;
  scan.style.top = `${y}px`;
  scan.dataset.rotation = rotation;

  applyTransform(scan);
  positionMetadataLabel(scan);

  setTimeout(() => {
    scan.style.transition = "";
  }, 600);
}

function handleAudioKeyboardControls(event) {
  if (isTypingInInput(event)) return;

  const key = event.key;

  if (
    key === "MediaPlayPause" ||
    key === " " && event.shiftKey
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