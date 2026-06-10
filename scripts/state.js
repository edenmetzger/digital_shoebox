function getSessionShownScans() {
  const stored = sessionStorage.getItem(SESSION_SHOWN_SCANS_KEY);

  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return [];
  } catch {
    return [];
  }
}

function saveSessionShownScans(filenames) {
  sessionStorage.setItem(
    SESSION_SHOWN_SCANS_KEY,
    JSON.stringify(filenames)
  );
}

function chooseActiveScanFilenames() {
  const allFilenames = Object.keys(archiveData);

  if (allFilenames.length <= ACTIVE_SCAN_COUNT) {
    saveSessionShownScans(allFilenames);
    return allFilenames;
  }

  let shown = getSessionShownScans().filter((filename) =>
    allFilenames.includes(filename)
  );

  let unseen = allFilenames.filter((filename) =>
    !shown.includes(filename)
  );

  if (unseen.length < ACTIVE_SCAN_COUNT) {
    shown = [];
    unseen = allFilenames.slice();
  }

  shuffle(unseen);

  const chosen = unseen.slice(0, ACTIVE_SCAN_COUNT);

  const updatedShown = Array.from(
    new Set([...shown, ...chosen])
  );

  saveSessionShownScans(updatedShown);

  return chosen;
}

let activeScanFilenames = chooseActiveScanFilenames();

let imagePaths = activeScanFilenames.map((filename) => {
  const webpFilename = filename.replace(/\.(jpg|jpeg|png)$/i, ".webp");
  return `${IMAGE_FOLDER}/${webpFilename}`;
});

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

let rifleDirection = null;
let rifleQueue = [];
let rifleCursor = 0;

let isShakingBox = false;
let shakeTimeoutId = null;
let shakeStartedAt = 0;
let shakeGroups = [];
let shakeGroupIndex = 0;
let shakeDirectionX = 1;
let shakeDirectionY = 0;

const tossAnimations = new Map();