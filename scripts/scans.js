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

  applyTransform(scan);
  positionMetadataLabel(scan);

  setTimeout(() => {
    scan.style.transition = "";
  }, 600);
}

function gatherObjects() {
  closeInfoCard();
  stopAllTossAnimations();
  clearPileMotionClass();

  rifleDirection = null;
  rifleQueue = [];
  rifleCursor = 0;

  const scans = Array.from(document.querySelectorAll(".scan"));

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  scans.forEach((scan) => {
    const scale = Number(scan.dataset.scale) || 1;

    const spreadX = Math.min(500, 120 + scans.length * 12);
    const spreadY = Math.min(350, 80 + scans.length * 8);

    const jitterX = Math.random() * spreadX - spreadX / 2;
    const jitterY = Math.random() * spreadY - spreadY / 2;

    const x = centerX - scan.offsetWidth / 2 + jitterX;
    const y = centerY - scan.offsetHeight / 2 + jitterY;

    const position = nudgeAwayFromRadio(x, y, scan, scale);

    scan.classList.add("moving-pile");

    scan.style.left = `${position.x}px`;
    scan.style.top = `${position.y}px`;
    scan.dataset.rotation = Math.random() * 18 - 9;

    applyTransform(scan);

    if (document.body.classList.contains("metadata-mode")) {
      positionMetadataLabel(scan);
    }
  });
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

  topZ++;
  scan.style.zIndex = topZ + index;

  applyTransform(scan);
  positionMetadataLabel(scan);

  setTimeout(() => {
    scan.style.transition = "";
  }, 600);
}

function surfaceObjects() {
  closeInfoCard();
  stopAllTossAnimations();
  clearPileMotionClass();

  const scans = Array.from(document.querySelectorAll(".scan"));

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  scans.forEach((scan) => {
    const scale = Number(scan.dataset.scale) || 1;

    const jitterX = Math.random() * 700 - 350;
    const jitterY = Math.random() * 500 - 250;

    const x = centerX - scan.offsetWidth / 2 + jitterX;
    const y = centerY - scan.offsetHeight / 2 + jitterY;

    const position = nudgeAwayFromRadio(x, y, scan, scale);

    scan.classList.add("moving-pile");

    scan.style.left = `${position.x}px`;
    scan.style.top = `${position.y}px`;
    scan.dataset.rotation = Math.random() * 26 - 13;

    applyTransform(scan);

    if (document.body.classList.contains("metadata-mode")) {
      positionMetadataLabel(scan);
    }
  });
}

function shakeBox() {
  closeInfoCard();
  stopAllTossAnimations();
  clearPileMotionClass();

  const scans = Array.from(document.querySelectorAll(".scan"));

  scans.forEach((scan) => {
    const scale = Number(scan.dataset.scale) || 1;

    const currentX = parseFloat(scan.style.left) || 0;
    const currentY = parseFloat(scan.style.top) || 0;
    const currentRotation = Number(scan.dataset.rotation) || 0;

    const x = currentX + Math.random() * 70 - 35;
    const y = currentY + Math.random() * 50 - 25;

    const position = nudgeAwayFromRadio(x, y, scan, scale);

    scan.classList.add("moving-pile");

    scan.style.left = `${position.x}px`;
    scan.style.top = `${position.y}px`;
    scan.dataset.rotation =
      currentRotation + Math.random() * 18 - 9;

    applyTransform(scan);

    if (document.body.classList.contains("metadata-mode")) {
      positionMetadataLabel(scan);
    }
  });
}

function moveScansInBatches(scans, moveFunction, batchSize, delay) {
  let cursor = 0;

  function moveBatch() {
    const batch = scans.slice(cursor, cursor + batchSize);

    batch.forEach((scan, index) => {
      moveFunction(scan, cursor + index);
    });

    cursor += batchSize;

    if (cursor < scans.length) {
      setTimeout(moveBatch, delay);
    }
  }

  moveBatch();
}

function moveSurfaceScan(scan, index) {
  scan.style.transition =
    "left 0.45s ease, top 0.45s ease, transform 0.45s ease";

  const scale = Number(scan.dataset.scale) || 1;

  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const jitterX = Math.random() * 700 - 350;
  const jitterY = Math.random() * 500 - 250;

  const x = centerX - scan.offsetWidth / 2 + jitterX;
  const y = centerY - scan.offsetHeight / 2 + jitterY;

  const position = nudgeAwayFromRadio(x, y, scan, scale);

  scan.style.left = `${position.x}px`;
  scan.style.top = `${position.y}px`;
  scan.dataset.rotation = Math.random() * 26 - 13;

  topZ++;
  scan.style.zIndex = topZ + index;

  applyTransform(scan);
  positionMetadataLabel(scan);

  setTimeout(() => {
    scan.style.transition = "";
  }, 500);
}

function moveShakenScan(scan, index) {
  scan.style.transition =
    "left 0.22s ease, top 0.22s ease, transform 0.22s ease";

  const scale = Number(scan.dataset.scale) || 1;

  const currentX = parseFloat(scan.style.left) || 0;
  const currentY = parseFloat(scan.style.top) || 0;
  const currentRotation = Number(scan.dataset.rotation) || 0;

  const x = currentX + Math.random() * 50 - 25;
  const y = currentY + Math.random() * 36 - 18;

  const position = nudgeAwayFromRadio(x, y, scan, scale);

  scan.style.left = `${position.x}px`;
  scan.style.top = `${position.y}px`;
  scan.dataset.rotation = currentRotation + Math.random() * 10 - 5;

  topZ++;
  scan.style.zIndex = topZ + index;

  applyTransform(scan);
  positionMetadataLabel(scan);

  setTimeout(() => {
    scan.style.transition = "";
  }, 260);
}

function clearPileMotionClass() {
  document.querySelectorAll(".scan.moving-pile").forEach((scan) => {
    scan.classList.remove("moving-pile");
  });
}