function showRandomMemory() {
  const scans = getScans();

  if (!scans.length) return;

  closeInfoCard();
  stopAllTossAnimations();

  const randomScan =
    scans[Math.floor(Math.random() * scans.length)];

  bringScanToFront(randomScan);

  nudgeNearbyScans(randomScan, scans);
  centerRandomMemory(randomScan);
}

function nudgeNearbyScans(randomScan, scans) {
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

    scan.style.left =
      `${startX + direction * (8 + index * 3)}px`;
    scan.style.top = `${startY + 3}px`;

    setTimeout(() => {
      scan.style.left = `${startX}px`;
      scan.style.top = `${startY}px`;

      setTimeout(() => {
        scan.style.transition = "";
      }, 240);
    }, 160);
  });
}

function centerRandomMemory(scan) {
  scan.style.transition =
    "left 0.46s cubic-bezier(.2, 1.35, .35, 1), top 0.46s cubic-bezier(.2, 1.35, .35, 1), transform 0.46s cubic-bezier(.2, 1.35, .35, 1)";

  const scale = Number(scan.dataset.scale) || 1;

  const x =
    window.innerWidth / 2 -
    (scan.offsetWidth * scale) / 2 +
    Math.random() * 160 -
    80;

  const y =
    window.innerHeight / 2 -
    (scan.offsetHeight * scale) / 2 +
    Math.random() * 100 -
    50;

  const position =
    nudgeAwayFromRadio(x, y, scan, scale);

  scan.style.left = `${position.x}px`;
  scan.style.top = `${position.y - 12}px`;
  scan.dataset.rotation = Math.random() * 8 - 4;

  resetScanMotion(scan);
  applyTransform(scan);
  positionMetadataLabel(scan);

  setTimeout(() => {
    scan.style.top = `${position.y}px`;
    positionMetadataLabel(scan);
  }, 180);

  setTimeout(() => {
    scan.style.transition = "";

    const rect = scan.getBoundingClientRect();

    showInfoCard(
      scan,
      rect.left + rect.width * 0.62,
      rect.top + rect.height * 0.55,
      false
    );
  }, 520);
}