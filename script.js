const IMAGE_COUNT = 12;
const IMAGE_FOLDER = "images";
const IMAGE_PREFIX = "scan";
const IMAGE_EXTENSION = "jpg";

const INTRO_DURATION = 3500;
const INTRO_FADE_DURATION = 1000;

const imagePaths = [];

for (let i = 1; i <= IMAGE_COUNT; i++) {
  imagePaths.push(`${IMAGE_FOLDER}/${IMAGE_PREFIX}${i}.${IMAGE_EXTENSION}`);
}

const workspace = document.getElementById("workspace");

const introOverlay = document.getElementById("introOverlay");

const infoCard = document.getElementById("infoCard");
const infoTitle = document.getElementById("infoTitle");
const infoText = document.getElementById("infoText");
const closeInfo = document.getElementById("closeInfo");

let topZ = 1;
let activeScan = null;

let pointers = new Map();

let dragStartX = 0;
let dragStartY = 0;
let imageStartX = 0;
let imageStartY = 0;

let initialPinchDistance = 0;
let initialScale = 1;

initializeIntro();

shuffle(imagePaths);

imagePaths.forEach((imagePath, index) => {
  const scan = document.createElement("img");

  scan.src = imagePath;
  scan.className = "scan";
  scan.alt = `Scan ${index + 1}`;

  scan.draggable = false;

  scan.dataset.scale = 1;
  scan.dataset.filename = imagePath.split("/").pop();

  workspace.appendChild(scan);

  scan.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });

  scan.addEventListener("pointerdown", pointerDown);
  scan.addEventListener("pointermove", pointerMove);
  scan.addEventListener("pointerup", pointerUp);
  scan.addEventListener("pointercancel", pointerUp);
  scan.addEventListener("pointerleave", pointerUp);

  scan.addEventListener("wheel", resizeWithTrackpad, {
    passive: false
  });

  scan.addEventListener("dblclick", showInfoCard);

  if (scan.complete) {
    randomizeImage(scan, index);
  } else {
    scan.onload = () => randomizeImage(scan, index);
  }
});

function initializeIntro() {
  if (!introOverlay) {
    return;
  }

  const introSeen =
    sessionStorage.getItem("introSeen");

  if (introSeen) {
    introOverlay.remove();
    return;
  }

  sessionStorage.setItem("introSeen", "true");

  setTimeout(() => {
    introOverlay.style.transition =
      `opacity ${INTRO_FADE_DURATION}ms ease`;

    introOverlay.style.opacity = "0";

    setTimeout(() => {
      introOverlay.remove();
    }, INTRO_FADE_DURATION);
  }, INTRO_DURATION);
}

function pointerDown(event) {
  event.preventDefault();

  activeScan = event.currentTarget;

  activeScan.setPointerCapture(event.pointerId);

  pointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY
  });

  topZ++;
  activeScan.style.zIndex = topZ;

  if (pointers.size === 1) {
    dragStartX = event.clientX;
    dragStartY = event.clientY;

    imageStartX = parseFloat(activeScan.style.left) || 0;
    imageStartY = parseFloat(activeScan.style.top) || 0;
  }

  if (pointers.size === 2) {
    const points = Array.from(pointers.values());

    initialPinchDistance = getDistance(
      points[0],
      points[1]
    );

    initialScale =
      Number(activeScan.dataset.scale) || 1;
  }
}

function pointerMove(event) {
  if (!activeScan || !pointers.has(event.pointerId)) {
    return;
  }

  event.preventDefault();

  pointers.set(event.pointerId, {
    x: event.clientX,
    y: event.clientY
  });

  if (pointers.size === 1) {
    const dx = event.clientX - dragStartX;
    const dy = event.clientY - dragStartY;

    activeScan.style.left = `${imageStartX + dx}px`;
    activeScan.style.top = `${imageStartY + dy}px`;
  }

  if (pointers.size === 2) {
    const points = Array.from(pointers.values());

    const newDistance = getDistance(
      points[0],
      points[1]
    );

    const scaleChange =
      newDistance / initialPinchDistance;

    let newScale =
      initialScale * scaleChange;

    newScale = Math.max(
      0.5,
      Math.min(1.5, newScale)
    );

    activeScan.dataset.scale = newScale;
  }

  applyTransform(activeScan);
}

function pointerUp(event) {
  pointers.delete(event.pointerId);

  if (
    activeScan &&
    activeScan.hasPointerCapture(event.pointerId)
  ) {
    activeScan.releasePointerCapture(event.pointerId);
  }

  if (pointers.size === 0) {
    activeScan = null;
  }
}

function randomizeImage(scan, index) {
  const baseRotation =
    Math.random() * 24 - 12;

  const randomScale =
    0.75 + Math.random() * 0.5;

  const rotation =
    baseRotation *
    (0.75 + Math.random() * 0.5);

  const maxX =
    window.innerWidth -
    scan.offsetWidth * randomScale;

  const maxY =
    window.innerHeight -
    scan.offsetHeight * randomScale;

  const x = Math.max(
    0,
    Math.random() * maxX
  );

  const y = Math.max(
    0,
    Math.random() * maxY
  );

  scan.style.left = `${x}px`;
  scan.style.top = `${y}px`;

  scan.dataset.rotation = rotation;
  scan.dataset.scale = randomScale;

  scan.style.zIndex = index + 1;

  applyTransform(scan);
}

function resizeWithTrackpad(event) {
  event.preventDefault();

  const scan = event.currentTarget;

  let scale =
    Number(scan.dataset.scale) || 1;

  const zoomAmount =
    -event.deltaY * 0.0015;

  scale += zoomAmount;

  scale = Math.max(
    0.5,
    Math.min(1.5, scale)
  );

  scan.dataset.scale = scale;

  applyTransform(scan);
}

function showInfoCard(event) {
  event.preventDefault();
  event.stopPropagation();

  const scan = event.currentTarget;

  const filename =
    scan.dataset.filename;

  const objectInfo =
    blurbs[filename];

  if (!objectInfo) {
    infoTitle.textContent =
      "Untitled Object";

    infoText.textContent =
      "No information has been added for this object yet.";
  } else {
    infoTitle.textContent =
      objectInfo.title;

    infoText.textContent =
      objectInfo.description;
  }

  infoCard.style.left =
    `${event.clientX + 20}px`;

  infoCard.style.top =
    `${event.clientY + 20}px`;

  infoCard.classList.remove("hidden");
}

closeInfo.addEventListener("click", () => {
  infoCard.classList.add("hidden");
});

function applyTransform(scan) {
  const rotation =
    Number(scan.dataset.rotation) || 0;

  const scale =
    Number(scan.dataset.scale) || 1;

  scan.style.transform =
    `rotate(${rotation}deg) scale(${scale})`;
}

function getDistance(point1, point2) {
  const dx =
    point2.x - point1.x;

  const dy =
    point2.y - point1.y;

  return Math.sqrt(
    dx * dx + dy * dy
  );
}

function shuffle(array) {
  for (
    let i = array.length - 1;
    i > 0;
    i--
  ) {
    const randomIndex =
      Math.floor(
        Math.random() * (i + 1)
      );

    [
      array[i],
      array[randomIndex]
    ] = [
      array[randomIndex],
      array[i]
    ];
  }
}