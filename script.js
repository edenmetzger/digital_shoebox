const scans = Array.from(document.querySelectorAll(".scan"));

let topZ = 1;
let activeScan = null;

let pointers = new Map();

let dragStartX = 0;
let dragStartY = 0;
let imageStartX = 0;
let imageStartY = 0;

let initialPinchDistance = 0;
let initialScale = 1;

shuffle(scans);

scans.forEach((scan, index) => {
  scan.draggable = false;
  scan.dataset.scale = 1;

  scan.addEventListener("dragstart", (event) => event.preventDefault());
  scan.addEventListener("pointerdown", pointerDown);
  scan.addEventListener("pointermove", pointerMove);
  scan.addEventListener("pointerup", pointerUp);
  scan.addEventListener("pointercancel", pointerUp);
  scan.addEventListener("pointerleave", pointerUp);

  if (scan.complete) {
    randomizeImage(scan, index);
  } else {
    scan.onload = () => randomizeImage(scan, index);
  }
});

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
    initialPinchDistance = getDistance(points[0], points[1]);
    initialScale = Number(activeScan.dataset.scale) || 1;
  }
}

function pointerMove(event) {
  if (!activeScan || !pointers.has(event.pointerId)) return;

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
    const newDistance = getDistance(points[0], points[1]);
    const scaleChange = newDistance / initialPinchDistance;

    let newScale = initialScale * scaleChange;
    newScale = Math.max(0.5, Math.min(1.5, newScale));

    activeScan.dataset.scale = newScale;
  }

  applyTransform(activeScan);
}

function pointerUp(event) {
  pointers.delete(event.pointerId);

  if (activeScan && activeScan.hasPointerCapture(event.pointerId)) {
    activeScan.releasePointerCapture(event.pointerId);
  }

  if (pointers.size === 0) {
    activeScan = null;
  }
}

function randomizeImage(scan, index) {
  const rotation = Math.random() * 24 - 12;

  const maxX = window.innerWidth - scan.offsetWidth;
  const maxY = window.innerHeight - scan.offsetHeight;

  const x = Math.max(0, Math.random() * maxX);
  const y = Math.max(0, Math.random() * maxY);

  scan.style.left = `${x}px`;
  scan.style.top = `${y}px`;
  scan.dataset.rotation = rotation;
  scan.dataset.scale = 1;
  scan.style.zIndex = index + 1;

  applyTransform(scan);
}

function applyTransform(scan) {
  const rotation = scan.dataset.rotation || 0;
  const scale = scan.dataset.scale || 1;

  scan.style.transform = `rotate(${rotation}deg) scale(${scale})`;
}

function getDistance(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
  }
}

scans.forEach((scan) => {
  scan.addEventListener("wheel", resizeWithTrackpad, { passive: false });
});

function resizeWithTrackpad(event) {
  event.preventDefault();

  const scan = event.currentTarget;
  let scale = Number(scan.dataset.scale) || 1;

  // Trackpad pinch often comes through as ctrlKey + wheel
  // Two-finger scroll also works here
  const zoomAmount = -event.deltaY * 0.0015;

  scale += zoomAmount;

  // 50% to 150%
  scale = Math.max(0.5, Math.min(1.5, scale));

  scan.dataset.scale = scale;
  applyTransform(scan);
}