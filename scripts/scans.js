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

  scan.style.left = `${x}px`;
  scan.style.top = `${y}px`;

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

  const randomScan =
    scans[Math.floor(Math.random() * scans.length)];

  bringScanToFront(randomScan);

  const rect = randomScan.getBoundingClientRect();

  showInfoCard(randomScan, rect.left + 20, rect.top + 20);
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