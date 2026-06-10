let pileActionType = null;
let pileQueue = [];
let pileCursor = 0;

function initializeScans() {
  shuffle(imagePaths);

  const initialPaths = imagePaths.slice(0, INITIAL_SCAN_LOAD_COUNT);
  const remainingPaths = imagePaths.slice(INITIAL_SCAN_LOAD_COUNT);

  initialPaths.forEach((imagePath, index) => {
    createScan(imagePath, index);
  });

  loadRemainingScansInBatches(remainingPaths, INITIAL_SCAN_LOAD_COUNT);
}

function loadRemainingScansInBatches(paths, startIndex) {
  let cursor = 0;

  function loadBatch() {
    const batch = paths.slice(cursor, cursor + SCAN_LOAD_BATCH_SIZE);

    batch.forEach((imagePath, batchIndex) => {
      createScan(imagePath, startIndex + cursor + batchIndex);
    });

    cursor += SCAN_LOAD_BATCH_SIZE;

    if (cursor < paths.length) {
      setTimeout(loadBatch, SCAN_LOAD_DELAY);
    }
  }

  setTimeout(loadBatch, SCAN_LOAD_DELAY);
}

function createScan(imagePath, index) {
  const scan = document.createElement("img");

  const imageFilename = imagePath.split("/").pop();

  const filename = imageFilename.replace(
    /\.(webp|jpg|jpeg|png)$/i,
    ".jpg"
  );

  scan.src = imagePath;
  scan.loading = "lazy";
  scan.decoding = "async";
  scan.className = "scan";
  scan.alt = `Scan ${index + 1}`;
  scan.draggable = false;
  scan.dataset.scale = 1;
  scan.dataset.filename = filename;
  scan.dataset.vx = 0;
  scan.dataset.vy = 0;
  scan.dataset.spin = 0;

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
}

function randomizeImage(scan, index) {
  const baseRotation = Math.random() * 24 - 12;
  const baseScale = getDefaultScale();

  const randomScale =
    baseScale * (0.9 + Math.random() * 0.2);

  const rotation =
    baseRotation * (0.75 + Math.random() * 0.5);

  const maxX =
    window.innerWidth - scan.offsetWidth * randomScale;

  const maxY =
    window.innerHeight - scan.offsetHeight * randomScale;

  const x = Math.max(0, Math.random() * maxX);
  const y = Math.max(0, Math.random() * maxY);

  const position =
    nudgeAwayFromRadio(x, y, scan, randomScale);

  scan.style.left = `${position.x}px`;
  scan.style.top = `${position.y}px`;

  scan.dataset.rotation = rotation;
  scan.dataset.scale = randomScale;
  scan.dataset.vx = 0;
  scan.dataset.vy = 0;
  scan.dataset.spin = 0;
  scan.style.zIndex = index + 1;

  applyTransform(scan);
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

  closeInfoCard();
  stopAllTossAnimations();

  const randomScan =
    scans[Math.floor(Math.random() * scans.length)];

  bringScanToFront(randomScan);

  const nearbyScans = scans
    .filter((scan) => scan !== randomScan)
    .sort((a, b) => {
      const aZ = Number(a.style.zIndex) || 0;
      const bZ = Number(b.style.zIndex) || 0;

      return bZ - aZ;
    })
    .slice(0, 3);

  nearbyScans.forEach((scan, index) => {
    const startX = parseFloat(scan.style.left) || 0;
    const startY = parseFloat(scan.style.top) || 0;
    const direction = index % 2 === 0 ? -1 : 1;

    scan.style.transition =
      "left 0.22s ease, top 0.22s ease";

    scan.style.left = `${startX + direction * (8 + index * 3)}px`;
    scan.style.top = `${startY + 3}px`;

    setTimeout(() => {
      scan.style.left = `${startX}px`;
      scan.style.top = `${startY}px`;

      setTimeout(() => {
        scan.style.transition = "";
      }, 240);
    }, 160);
  });

  randomScan.style.transition =
    "left 0.46s cubic-bezier(.2, 1.35, .35, 1), top 0.46s cubic-bezier(.2, 1.35, .35, 1), transform 0.46s cubic-bezier(.2, 1.35, .35, 1)";

  const scale = Number(randomScan.dataset.scale) || 1;

  const x =
    window.innerWidth / 2 -
    (randomScan.offsetWidth * scale) / 2 +
    Math.random() * 160 - 80;

  const y =
    window.innerHeight / 2 -
    (randomScan.offsetHeight * scale) / 2 +
    Math.random() * 100 - 50;

  const position =
    nudgeAwayFromRadio(x, y, randomScan, scale);

  const rotation = Math.random() * 8 - 4;

  randomScan.style.left = `${position.x}px`;
  randomScan.style.top = `${position.y - 12}px`;
  randomScan.dataset.rotation = rotation;
  randomScan.dataset.vx = 0;
  randomScan.dataset.vy = 0;
  randomScan.dataset.spin = 0;

  applyTransform(randomScan);
  positionMetadataLabel(randomScan);

  setTimeout(() => {
    randomScan.style.top = `${position.y}px`;
    positionMetadataLabel(randomScan);
  }, 180);

  setTimeout(() => {
    randomScan.style.transition = "";

    const rect = randomScan.getBoundingClientRect();

    showInfoCard(
      randomScan,
      rect.left + rect.width * 0.62,
      rect.top + rect.height * 0.55,
      false
    );
  }, 520);
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

  const position =
    nudgeAwayFromRadio(x, y, scan, scale);

  const rotation = Math.random() * 10 - 5;

  scan.style.left = `${position.x}px`;
  scan.style.top = `${position.y}px`;
  scan.dataset.rotation = rotation;
  scan.dataset.vx = 0;
  scan.dataset.vy = 0;
  scan.dataset.spin = 0;

  applyTransform(scan);
  positionMetadataLabel(scan);

  setTimeout(() => {
    scan.style.transition = "";
  }, 600);
}

function gatherObjects() {
  movePileBatch("gather");
}

function surfaceObjects() {
  movePileBatch("surface");
}

function shakeBox() {
  startHeldShake();

  setTimeout(() => {
    if (isShakingBox) {
      stopHeldShake();
    }
  }, 520);
}

function startHeldShake() {
  if (isShakingBox) return;

  isShakingBox = true;
  shakeStartedAt = performance.now();
  shakeGroupIndex = 0;

  closeInfoCard();
  stopAllTossAnimations();

  buildShakeGroups();
  chooseOpenSpaceShakeDirection();
  runVelocityShake();
}

function stopHeldShake() {
  isShakingBox = false;
  shakeStartedAt = 0;
  shakeGroupIndex = 0;

  if (shakeTimeoutId) {
    clearTimeout(shakeTimeoutId);
    shakeTimeoutId = null;
  }

  document.querySelectorAll(".scan").forEach((scan) => {
    scan.style.transition = "";
  });
}

function buildShakeGroups() {
  const scans = Array.from(document.querySelectorAll(".scan"));

  shuffle(scans);

  const groupSize = 34;
  shakeGroups = [];

  for (let i = 0; i < scans.length; i += groupSize) {
    shakeGroups.push(scans.slice(i, i + groupSize));
  }
}

function chooseOpenSpaceShakeDirection() {
  const scans = Array.from(document.querySelectorAll(".scan"));

  if (!scans.length) {
    shakeDirectionX = Math.random() * 2 - 1;
    shakeDirectionY = Math.random() * 2 - 1;
    return;
  }

  let totalX = 0;
  let totalY = 0;

  scans.forEach((scan) => {
    const scale = Number(scan.dataset.scale) || 1;
    const x = parseFloat(scan.style.left) || 0;
    const y = parseFloat(scan.style.top) || 0;

    totalX += x + (scan.offsetWidth * scale) / 2;
    totalY += y + (scan.offsetHeight * scale) / 2;
  });

  const averageX = totalX / scans.length;
  const averageY = totalY / scans.length;

  let directionX = window.innerWidth / 2 - averageX;
  let directionY = window.innerHeight / 2 - averageY;

  directionX += Math.random() * 0.7 - 0.35;
  directionY += Math.random() * 0.7 - 0.35;

  const distance =
    Math.sqrt(directionX * directionX + directionY * directionY) || 1;

  shakeDirectionX = directionX / distance;
  shakeDirectionY = directionY / distance;
}

function getShakeIntensity() {
  if (!shakeStartedAt) return 1;

  const heldFor = performance.now() - shakeStartedAt;
  const ramp = 1 + heldFor / 850;

  return Math.min(3.2, ramp);
}

function runVelocityShake() {
  if (!isShakingBox || !shakeGroups.length) return;

  const group = shakeGroups[shakeGroupIndex];
  const intensity = getShakeIntensity();

  group.forEach((scan) => {
    moveScanWithShakeVelocity(scan, intensity);
  });

  shakeGroupIndex++;

  if (shakeGroupIndex >= shakeGroups.length) {
    shakeGroupIndex = 0;
    chooseOpenSpaceShakeDirection();
    buildShakeGroups();
  }

  shakeTimeoutId = setTimeout(runVelocityShake, 38);
}

function moveScanWithShakeVelocity(scan, intensity) {
  scan.style.transition =
    "left 0.13s ease-out, top 0.13s ease-out, transform 0.13s ease-out";

  const scale = Number(scan.dataset.scale) || 1;

  let x = parseFloat(scan.style.left) || 0;
  let y = parseFloat(scan.style.top) || 0;
  let rotation = Number(scan.dataset.rotation) || 0;

  let vx = Number(scan.dataset.vx) || 0;
  let vy = Number(scan.dataset.vy) || 0;
  let spin = Number(scan.dataset.spin) || 0;

  const looseness = 0.45 + Math.random() * 1.1;

  const shoveX =
    shakeDirectionX * (9 + Math.random() * 14) * intensity * looseness;

  const shoveY =
    shakeDirectionY * (8 + Math.random() * 12) * intensity * looseness;

  const scatterX =
    (Math.random() * 16 - 8) * intensity;

  const scatterY =
    (Math.random() * 14 - 7) * intensity;

  vx = vx * 0.78 + shoveX + scatterX;
  vy = vy * 0.78 + shoveY + scatterY;
  spin = spin * 0.7 + (Math.random() * 5 - 2.5) * intensity;

  const maxVelocity = 52 * intensity;

  vx = Math.max(-maxVelocity, Math.min(maxVelocity, vx));
  vy = Math.max(-maxVelocity, Math.min(maxVelocity, vy));

  x += vx;
  y += vy;
  rotation += spin;

  const position =
    nudgeAwayFromRadio(x, y, scan, scale);

  scan.style.left = `${position.x}px`;
  scan.style.top = `${position.y}px`;
  scan.dataset.rotation = rotation;
  scan.dataset.vx = vx;
  scan.dataset.vy = vy;
  scan.dataset.spin = spin;

  applyTransform(scan);

  if (document.body.classList.contains("metadata-mode")) {
    positionMetadataLabel(scan);
  }
}

function movePileBatch(actionType) {
  closeInfoCard();
  stopAllTossAnimations();

  if (actionType === "gather") {
    rifleDirection = null;
    rifleQueue = [];
    rifleCursor = 0;
  }

  const scans = Array.from(document.querySelectorAll(".scan"));

  if (!scans.length) return;

  if (
    pileActionType !== actionType ||
    !pileQueue.length ||
    pileCursor >= pileQueue.length
  ) {
    pileActionType = actionType;
    pileCursor = 0;

    pileQueue = scans
      .slice()
      .sort((a, b) => {
        const aZ = Number(a.style.zIndex) || 0;
        const bZ = Number(b.style.zIndex) || 0;

        return bZ - aZ;
      });
  }

  const batchSize =
    pileCursor === 0
      ? Math.ceil(scans.length * 0.3)
      : Math.ceil(scans.length * 0.1);

  const scansToMove =
    pileQueue.slice(pileCursor, pileCursor + batchSize);

  pileCursor += batchSize;

  scansToMove.forEach((scan, index) => {
    if (actionType === "gather") {
      moveGatheredScan(scan, index);
    }

    if (actionType === "surface") {
      moveSurfacedScan(scan, index);
    }
  });
}

function moveGatheredScan(scan, index) {
  scan.style.transition =
    "left 0.55s ease, top 0.55s ease, transform 0.55s ease";

  const scale = Number(scan.dataset.scale) || 1;
  const scans = Array.from(document.querySelectorAll(".scan"));

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const spreadX = Math.min(500, 120 + scans.length * 12);
  const spreadY = Math.min(350, 80 + scans.length * 8);

  const x =
    centerX -
    scan.offsetWidth / 2 +
    Math.random() * spreadX -
    spreadX / 2;

  const y =
    centerY -
    scan.offsetHeight / 2 +
    Math.random() * spreadY -
    spreadY / 2;

  const position =
    nudgeAwayFromRadio(x, y, scan, scale);

  scan.style.left = `${position.x}px`;
  scan.style.top = `${position.y}px`;
  scan.dataset.rotation = Math.random() * 18 - 9;
  scan.dataset.vx = 0;
  scan.dataset.vy = 0;
  scan.dataset.spin = 0;

  topZ++;
  scan.style.zIndex = topZ + index;

  applyTransform(scan);

  if (document.body.classList.contains("metadata-mode")) {
    positionMetadataLabel(scan);
  }

  setTimeout(() => {
    scan.style.transition = "";
  }, 600);
}

function moveSurfacedScan(scan, index) {
  scan.style.transition =
    "left 0.55s ease, top 0.55s ease, transform 0.55s ease";

  const scale = Number(scan.dataset.scale) || 1;

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const x =
    centerX -
    scan.offsetWidth / 2 +
    Math.random() * 700 -
    350;

  const y =
    centerY -
    scan.offsetHeight / 2 +
    Math.random() * 500 -
    250;

  const position =
    nudgeAwayFromRadio(x, y, scan, scale);

  scan.style.left = `${position.x}px`;
  scan.style.top = `${position.y}px`;
  scan.dataset.rotation = Math.random() * 26 - 13;
  scan.dataset.vx = 0;
  scan.dataset.vy = 0;
  scan.dataset.spin = 0;

  topZ++;
  scan.style.zIndex = topZ + index;

  applyTransform(scan);

  if (document.body.classList.contains("metadata-mode")) {
    positionMetadataLabel(scan);
  }

  setTimeout(() => {
    scan.style.transition = "";
  }, 600);
}

function spreadLeft() {
  rifleObjects("left");
}

function spreadRight() {
  rifleObjects("right");
}

function rifleObjects(direction) {
  closeInfoCard();
  stopAllTossAnimations();

  pileActionType = null;
  pileQueue = [];
  pileCursor = 0;

  const scans = Array.from(document.querySelectorAll(".scan"));

  if (!scans.length) return;

  if (
    rifleDirection !== direction ||
    !rifleQueue.length ||
    rifleCursor >= rifleQueue.length
  ) {
    rifleDirection = direction;
    rifleCursor = 0;

    rifleQueue = scans
      .slice()
      .sort((a, b) => {
        const aZ = Number(a.style.zIndex) || 0;
        const bZ = Number(b.style.zIndex) || 0;

        return bZ - aZ;
      });
  }

  const batchSize =
    rifleCursor === 0
      ? Math.ceil(scans.length * 0.3)
      : Math.ceil(scans.length * 0.1);

  const scansToMove =
    rifleQueue.slice(rifleCursor, rifleCursor + batchSize);

  rifleCursor += batchSize;

  scansToMove.forEach((scan, index) => {
    moveRifledScan(scan, direction, index);
  });
}

function moveRifledScan(scan, direction, index) {
  scan.style.transition =
    "left 0.55s ease, top 0.55s ease, transform 0.55s ease";

  const scale = Number(scan.dataset.scale) || 1;

  const minX =
    direction === "left"
      ? -scan.offsetWidth * scale * 0.85
      : window.innerWidth * 0.42;

  const maxX =
    direction === "left"
      ? window.innerWidth * 0.32
      : window.innerWidth -
        scan.offsetWidth * scale * 0.15;

  const x =
    minX + Math.random() * (maxX - minX);

  const maxY =
    window.innerHeight -
    scan.offsetHeight * scale -
    170;

  const y =
    30 + Math.random() * Math.max(1, maxY);

  const position =
    nudgeAwayFromRadio(x, y, scan, scale);

  const rotation =
    direction === "left"
      ? Math.random() * 34 - 26
      : Math.random() * 34 - 8;

  scan.style.left = `${position.x}px`;
  scan.style.top = `${position.y}px`;
  scan.dataset.rotation = rotation;
  scan.dataset.vx = 0;
  scan.dataset.vy = 0;
  scan.dataset.spin = 0;

  topZ++;
  scan.style.zIndex = topZ + index;

  applyTransform(scan);

  if (document.body.classList.contains("metadata-mode")) {
    positionMetadataLabel(scan);
  }

  setTimeout(() => {
    scan.style.transition = "";
  }, 600);
}

function keepScanInView(scan) {
  const scale = Number(scan.dataset.scale) || 1;

  let x = parseFloat(scan.style.left) || 0;
  let y = parseFloat(scan.style.top) || 0;

  const visibleMargin = 80;

  const minX = -scan.offsetWidth * scale + visibleMargin;
  const minY = -scan.offsetHeight * scale + visibleMargin;

  const maxX = window.innerWidth - visibleMargin;
  const maxY = window.innerHeight - visibleMargin;

  x = Math.min(maxX, Math.max(minX, x));
  y = Math.min(maxY, Math.max(minY, y));

  scan.style.left = `${x}px`;
  scan.style.top = `${y}px`;
}