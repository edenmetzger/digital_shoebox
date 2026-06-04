let imagePaths = Object.keys(archiveData).map((filename) => {
  return `${IMAGE_FOLDER}/${filename}`;
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

const tossAnimations = new Map();