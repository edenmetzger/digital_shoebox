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
    moveActiveScan(event);
  }

  if (pointers.size === 2) {
    resizeActiveScanByPinch();
  }

  applyTransform(activeScan);
  positionMetadataLabel(activeScan);
}

function moveActiveScan(event) {
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

function resizeActiveScanByPinch() {
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
keepScanInView(activeScan);
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

function applyTransform(scan) {
  const rotation = Number(scan.dataset.rotation) || 0;
  const scale = Number(scan.dataset.scale) || 1;

  scan.style.transform =
    `rotate(${rotation}deg) scale(${scale})`;
}