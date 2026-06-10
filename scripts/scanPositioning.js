function getScans() {
  return Array.from(document.querySelectorAll(".scan"));
}

function resetScanMotion(scan) {
  scan.dataset.vx = 0;
  scan.dataset.vy = 0;
  scan.dataset.spin = 0;
}

function bringScanToFront(scan) {
  const highestZ = getScans().reduce((highest, currentScan) => {
    const z = Number(currentScan.style.zIndex) || 0;
    return Math.max(highest, z);
  }, 0);

  topZ = highestZ + 1;
  scan.style.zIndex = topZ;

  positionMetadataLabel(scan);
}

function keepPlannedPositionInView(scan, x, y) {
  const scale = Number(scan.dataset.scale) || 1;
  const visibleMargin = 140;

  const minX = -scan.offsetWidth * scale + visibleMargin;
  const minY = -scan.offsetHeight * scale + visibleMargin;

  const maxX = window.innerWidth - visibleMargin;
  const maxY = window.innerHeight - visibleMargin;

  return {
    x: Math.min(maxX, Math.max(minX, x)),
    y: Math.min(maxY, Math.max(minY, y))
  };
}

function keepScanInView(scan) {
  const x = parseFloat(scan.style.left) || 0;
  const y = parseFloat(scan.style.top) || 0;

  const position = keepPlannedPositionInView(scan, x, y);

  scan.style.left = `${position.x}px`;
  scan.style.top = `${position.y}px`;
}

function getGatherPosition(scan, totalScans) {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const spreadX = Math.min(500, 120 + totalScans * 12);
  const spreadY = Math.min(350, 80 + totalScans * 8);

  return {
    x:
      centerX -
      scan.offsetWidth / 2 +
      Math.random() * spreadX -
      spreadX / 2,
    y:
      centerY -
      scan.offsetHeight / 2 +
      Math.random() * spreadY -
      spreadY / 2
  };
}

function getSurfacePosition(scan) {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  return {
    x:
      centerX -
      scan.offsetWidth / 2 +
      Math.random() * 700 -
      350,
    y:
      centerY -
      scan.offsetHeight / 2 +
      Math.random() * 500 -
      250
  };
}

function getRiflePosition(scan, direction) {
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

  const maxY =
    window.innerHeight -
    scan.offsetHeight * scale -
    170;

  return {
    x: minX + Math.random() * (maxX - minX),
    y: 30 + Math.random() * Math.max(1, maxY)
  };
}

function preparePosition(scan, x, y) {
  const scale = Number(scan.dataset.scale) || 1;

  const nudgedPosition =
    nudgeAwayFromRadio(x, y, scan, scale);

  return keepPlannedPositionInView(
    scan,
    nudgedPosition.x,
    nudgedPosition.y
  );
}

function moveScan(scan, options) {
  const {
    x,
    y,
    rotation,
    transition,
    duration = 600,
    zIndex = null
  } = options;

  scan.style.transition = transition;
  scan.style.left = `${x}px`;
  scan.style.top = `${y}px`;
  scan.dataset.rotation = rotation;

  resetScanMotion(scan);

  if (zIndex !== null) {
    scan.style.zIndex = zIndex;
  }

  applyTransform(scan);
  positionMetadataLabel(scan);

  setTimeout(() => {
    scan.style.transition = "";
  }, duration);
}