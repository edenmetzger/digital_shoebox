function initializeMetadataMode() {
  document.addEventListener("keydown", (event) => {
    if (
      event.code === "Space" &&
      !event.shiftKey &&
      !event.repeat &&
      !isTypingInInput(event)
    ) {
      event.preventDefault();
      document.body.classList.add("metadata-mode");
      updateAllMetadataLabels();
    }
  });

  document.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
      document.body.classList.remove("metadata-mode");
    }
  });
}

function getMetadataText(filename) {
  const item = archiveData[filename];

  if (!item) {
    return "unknown<br>object";
  }

  const lines = [
    item.date || "unknown date",
    item.type || "object",
    item.category || "",
    item.location || "",
    item.source || ""
  ];

  return lines
    .filter((line) => line && line.trim() !== "")
    .join("<br>");
}

function updateAllMetadataLabels() {
  const scans = Array.from(document.querySelectorAll(".scan"));

  const topScans = scans
    .sort((a, b) => {
      const aZ = Number(a.style.zIndex) || 0;
      const bZ = Number(b.style.zIndex) || 0;

      return bZ - aZ;
    })
    .slice(0, 7);

  document.querySelectorAll(".metadata-label").forEach((label) => {
    label.classList.remove("visible-metadata");
  });

  topScans.forEach((scan) => {
    positionMetadataLabel(scan);

    const label = document.querySelector(
      `.metadata-label[data-filename="${scan.dataset.filename}"]`
    );

    if (label) {
      label.classList.add("visible-metadata");
    }
  });
}

function positionMetadataLabel(scan) {
  const filename = scan.dataset.filename;
  const label = document.querySelector(
    `.metadata-label[data-filename="${filename}"]`
  );

  if (!label) return;

  const left = parseFloat(scan.style.left) || 0;
  const top = parseFloat(scan.style.top) || 0;
  const scale = Number(scan.dataset.scale) || 1;

  const scanWidth = scan.offsetWidth * scale;
  const scanHeight = scan.offsetHeight * scale;

  label.style.left = `${left + scanWidth / 2}px`;
  label.style.top = `${top + scanHeight / 2}px`;
  label.style.transform = "translate(-50%, -50%)";
  label.style.zIndex = Number(scan.style.zIndex || 1) + 1;
}