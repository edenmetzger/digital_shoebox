let pileActionType = null;
let pileQueue = [];
let pileCursor = 0;

let heldShakeInterval = null;
let heldShakeStartTime = 0;

function resetPileQueue() {
  pileActionType = null;
  pileQueue = [];
  pileCursor = 0;
}

function resetRifleQueue() {
  rifleDirection = null;
  rifleQueue = [];
  rifleCursor = 0;
}

function getHeldShakeIntensity() {
  if (!heldShakeStartTime) return 1;

  const heldFor = Date.now() - heldShakeStartTime;

  if (heldFor > 1800) return 3.2;
  if (heldFor > 1100) return 2.4;
  if (heldFor > 500) return 1.7;

  return 1.2;
}

function applyPlannedMoves(plans, duration) {
  requestAnimationFrame(() => {
    plans.forEach((plan) => {
      moveScan(plan.scan, {
        x: plan.x,
        y: plan.y,
        rotation: plan.rotation,
        transition: plan.transition,
        duration
      });
    });
  });
}

function gatherObjects() {
  closeInfoCard();
  stopAllTossAnimations();

  resetPileQueue();
  resetRifleQueue();

  const scans = getScans();

  const plans = scans.map((scan) => {
    const rawPosition =
      getGatherPosition(scan, scans.length);

    const position =
      preparePosition(scan, rawPosition.x, rawPosition.y);

    return {
      scan,
      x: position.x,
      y: position.y,
      rotation: Math.random() * 18 - 9,
      transition:
        "left 0.36s ease, top 0.36s ease, transform 0.36s ease"
    };
  });

  applyPlannedMoves(plans, 390);
}

function surfaceObjects() {
  closeInfoCard();
  stopAllTossAnimations();

  resetPileQueue();

  const scans = getScans();

  const plans = scans.map((scan) => {
    const rawPosition = getSurfacePosition(scan);

    const position =
      preparePosition(scan, rawPosition.x, rawPosition.y);

    return {
      scan,
      x: position.x,
      y: position.y,
      rotation: Math.random() * 26 - 13,
      transition:
        "left 0.36s ease, top 0.36s ease, transform 0.36s ease"
    };
  });

  applyPlannedMoves(plans, 390);
}

function shakeBox(intensity = 1) {
  closeInfoCard();
  stopAllTossAnimations();

  const scans = getScans();

  const moveXAmount = 150 * intensity;
  const moveYAmount = 110 * intensity;
  const rotationAmount = 26 * intensity;

  const plans = scans.map((scan) => {
    const currentX = parseFloat(scan.style.left) || 0;
    const currentY = parseFloat(scan.style.top) || 0;
    const currentRotation = Number(scan.dataset.rotation) || 0;

    const rawX =
      currentX +
      Math.random() * moveXAmount -
      moveXAmount / 2;

    const rawY =
      currentY +
      Math.random() * moveYAmount -
      moveYAmount / 2;

    const position = preparePosition(scan, rawX, rawY);

    return {
      scan,
      x: position.x,
      y: position.y,
      rotation:
        currentRotation +
        Math.random() * rotationAmount -
        rotationAmount / 2,
      transition:
        "left 0.14s ease-out, top 0.14s ease-out, transform 0.14s ease-out"
    };
  });

  applyPlannedMoves(plans, 155);
}

function startHeldShake() {
  if (heldShakeInterval) return;

  heldShakeStartTime = Date.now();

  shakeBox(getHeldShakeIntensity());

  heldShakeInterval = setInterval(() => {
    shakeBox(getHeldShakeIntensity());
  }, 145);
}

function stopHeldShake() {
  heldShakeStartTime = 0;

  if (heldShakeInterval) {
    clearInterval(heldShakeInterval);
    heldShakeInterval = null;
  }
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

  resetPileQueue();

  const scans = getScans();

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
  const rawPosition = getRiflePosition(scan, direction);

  const position =
    preparePosition(scan, rawPosition.x, rawPosition.y);

  const rotation =
    direction === "left"
      ? Math.random() * 34 - 26
      : Math.random() * 34 - 8;

  topZ++;

  moveScan(scan, {
    x: position.x,
    y: position.y,
    rotation,
    zIndex: topZ + index,
    transition:
      "left 0.55s ease, top 0.55s ease, transform 0.55s ease",
    duration: 600
  });
}