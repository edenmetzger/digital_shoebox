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

function getMetadataText(filename, index = null) {
  const item = archiveData[filename];

  if (!item) {
    return index === null
      ? "unknown object"
      : `${index} / unknown object`;
  }

  const parts = [
    item.type || "object",
    item.category || "",
    item.date || "",
    item.location || ""
  ].filter((part) => part && part.trim() !== "");

  const label = parts.join(" / ");

  if (index === null) return label;

  return `${index} / ${label}`;
}

function getOrCreateMetadataLabel(scan, index) {
  const filename = scan.dataset.filename;

  let label = document.querySelector(
    `.metadata-label[data-filename="${filename}"]`
  );

  if (!label) {
    label = document.createElement("div");
    label.className = "metadata-label";
    label.dataset.filename = filename;
    workspace.appendChild(label);
  }

  label.textContent = getMetadataText(filename, index);

  return label;
}

function updateAllMetadataLabels() {
  const scans = Array.from(document.querySelectorAll(".scan"));

  const topScans = scans
    .sort((a, b) => {
      const aZ = Number(a.style.zIndex) || 0;
      const bZ = Number(b.style.zIndex) || 0;

      return bZ - aZ;
    })
    .slice(0, 12);

  document.querySelectorAll(".metadata-label").forEach((label) => {
    label.classList.remove("visible-metadata");
  });

  topScans.forEach((scan, index) => {
    const labelNumber = String(index + 1).padStart(2, "0");
    const label = getOrCreateMetadataLabel(scan, labelNumber);

    positionMetadataLabel(scan);

    label.classList.add("visible-metadata");
  });
}

function positionMetadataLabel(scan) {
  if (!document.body.classList.contains("metadata-mode")) return;

  const label = document.querySelector(
    `.metadata-label[data-filename="${scan.dataset.filename}"]`
  );

  if (!label) return;

  const left = parseFloat(scan.style.left) || 0;
  const top = parseFloat(scan.style.top) || 0;
  const scale = Number(scan.dataset.scale) || 1;

  const scanWidth = scan.offsetWidth * scale;
  const scanHeight = scan.offsetHeight * scale;

  label.style.left = `${left + scanWidth / 2}px`;
  label.style.top = `${top + scanHeight + 8}px`;
  label.style.transform = "translateX(-50%)";
  label.style.zIndex = Number(scan.style.zIndex || 1) + 1;
}