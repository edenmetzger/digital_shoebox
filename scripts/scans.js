function initializeScans() {
  shuffle(imagePaths);

  const initialPaths = imagePaths.slice(0, INITIAL_SCAN_LOAD_COUNT);
  const remainingPaths = imagePaths.slice(INITIAL_SCAN_LOAD_COUNT);

  initialPaths.forEach((imagePath, index) => {
    createScan(imagePath, index);
  });

  loadRemainingScansInBatches(
    remainingPaths,
    INITIAL_SCAN_LOAD_COUNT
  );
}

function loadRemainingScansInBatches(paths, startIndex) {
  let cursor = 0;

  function loadBatch() {
    const batch =
      paths.slice(cursor, cursor + SCAN_LOAD_BATCH_SIZE);

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

  resetScanMotion(scan);

  workspace.appendChild(scan);

  scan.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });

  scan.addEventListener("pointerdown", pointerDown);

  scan.addEventListener("wheel", resizeWithTrackpad, {
    passive: false
  });

  if (scan.complete) {
    randomizeImage(scan, index);
  } else {
    scan.onload = () => {
      randomizeImage(scan, index);
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

  resetScanMotion(scan);
  applyTransform(scan);
}

function buildFocusQueue() {
  focusQueue = getScans().map((scan) => scan.dataset.filename);
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

  const scale = Number(scan.dataset.scale) || 1;

  const x =
    window.innerWidth / 2 -
    (scan.offsetWidth * scale) / 2;

  const y =
    window.innerHeight / 2 -
    (scan.offsetHeight * scale) / 2;

  const position =
    nudgeAwayFromRadio(x, y, scan, scale);

  moveScan(scan, {
    x: position.x,
    y: position.y,
    rotation: Math.random() * 10 - 5,
    transition:
      "left 0.55s ease, top 0.55s ease, transform 0.55s ease",
    duration: 600
  });
}