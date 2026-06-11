function showInfoCard(scan, x, y, offsetFromClick = true) {
  const filename = scan.dataset.filename;
  const objectInfo = archiveData[filename];

  markObjectAsFound(filename);

  if (!objectInfo) {
    infoTitle.textContent = "Untitled Object";
    infoText.textContent =
      "No information has been added for this object yet.";
  } else {
    infoTitle.textContent = objectInfo.title || "Untitled Object";
    infoText.textContent = objectInfo.description || "";
  }

  renderObjectMetadata(objectInfo, filename);
  renderNote(objectInfo);
  renderRelatedObjects(objectInfo);

  infoCard.style.left = `${offsetFromClick ? x + 20 : x}px`;
  infoCard.style.top = `${offsetFromClick ? y + 20 : y}px`;

  infoCard.classList.remove("hidden");
}

function closeInfoCard() {
  if (!infoCard) return;
  infoCard.classList.add("hidden");
}

function getOrCreateObjectMetadataList() {
  let metadataList = document.getElementById("objectMetadata");

  if (!metadataList) {
    metadataList = document.createElement("dl");
    metadataList.id = "objectMetadata";
    metadataList.className = "object-metadata";
    infoCard.insertBefore(metadataList, noteButton);
  }

  return metadataList;
}

function renderObjectMetadata(objectInfo, filename) {
  const metadataList = getOrCreateObjectMetadataList();
  metadataList.innerHTML = "";

  if (!objectInfo) {
    metadataList.classList.add("hidden");
    return;
  }

  const rows = [
    ["file", objectInfo.filename || filename],
    ["category", objectInfo.category],
    ["type", objectInfo.type],
    ["date", objectInfo.date],
    ["location", objectInfo.location],
    ["source", objectInfo.source],
    ["tags", objectInfo.tags]
  ].filter(([, value]) => hasMetadataValue(value));

  rows.forEach(([label, value]) => {
    const term = document.createElement("dt");
    term.textContent = label;

    const detail = document.createElement("dd");
    detail.textContent = formatMetadataValue(value);

    metadataList.appendChild(term);
    metadataList.appendChild(detail);
  });

  metadataList.classList.toggle("hidden", rows.length === 0);
}

function hasMetadataValue(value) {
  if (Array.isArray(value)) {
    return value.some((item) => String(item).trim() !== "");
  }

  return value !== undefined && value !== null && String(value).trim() !== "";
}

function formatMetadataValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .join(", ");
  }

  return String(value).trim();
}

function markObjectAsFound(filename) {
  const found = getFoundObjects();

  if (!found.includes(filename)) {
    found.push(filename);

    localStorage.setItem(
      FOUND_STORAGE_KEY,
      JSON.stringify(found)
    );
  }

  updateFoundCounter();
}

function getFoundObjects() {
  const stored = localStorage.getItem(FOUND_STORAGE_KEY);

  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function updateFoundCounter() {
  const counter = document.getElementById("foundCounter");
  if (!counter) return;

  const found = getFoundObjects().filter((filename) =>
    activeScanFilenames.includes(filename)
  );

  const percentage = activeScanFilenames.length
    ? Math.round((found.length / activeScanFilenames.length) * 100)
    : 0;

  counter.textContent =
    `found ${found.length} / ${activeScanFilenames.length} in this pile (${percentage}%)`;
}

function renderNote(objectInfo) {
  notePanel.classList.add("hidden");
  notePanel.textContent = "";

  if (!objectInfo || !objectInfo.note) {
    noteButton.classList.add("hidden");
    return;
  }

  noteButton.classList.remove("hidden");
  noteButton.textContent = "pull out note";

  noteButton.onclick = () => {
    notePanel.textContent = objectInfo.note.trim();
    notePanel.classList.toggle("hidden");
  };
}

function renderRelatedObjects(objectInfo) {
  relatedObjects.innerHTML = "";

  if (
    !objectInfo ||
    !objectInfo.related ||
    !objectInfo.related.length
  ) {
    return;
  }

  const availableRelated = objectInfo.related.filter((filename) =>
    document.querySelector(`.scan[data-filename="${filename}"]`)
  );

  if (!availableRelated.length) return;

  const heading = document.createElement("div");
  heading.className = "related-heading";
  heading.textContent = "related objects in this pile";
  relatedObjects.appendChild(heading);

  availableRelated.forEach((filename) => {
    const relatedItem = archiveData[filename];
    const relatedScan = document.querySelector(
      `.scan[data-filename="${filename}"]`
    );

    if (!relatedItem || !relatedScan) return;

    const button = document.createElement("button");
    button.textContent = relatedItem.title || filename;

    button.addEventListener("click", () => {
      openObjectByFilename(filename, true);
    });

    relatedObjects.appendChild(button);
  });
}

function openObjectByFilename(filename, shouldHighlight = false) {
  const relatedScan = document.querySelector(
    `.scan[data-filename="${filename}"]`
  );

  if (!relatedScan) return;

  bringScanToFront(relatedScan);

  if (shouldHighlight) {
    highlightScan(relatedScan);
  }

  requestAnimationFrame(() => {
    const rect = relatedScan.getBoundingClientRect();

    const CARD_WIDTH = 320;
    const CARD_HEIGHT = 260;

    let cardX = rect.left + rect.width * 0.35;
    let cardY = rect.top + rect.height * 0.65;

    if (cardX + CARD_WIDTH > window.innerWidth) {
      cardX = rect.right - CARD_WIDTH;
    }

    if (cardY + CARD_HEIGHT > window.innerHeight) {
      cardY = rect.top - CARD_HEIGHT - 16;
    }

    cardX = Math.max(20, cardX);
    cardY = Math.max(20, cardY);

    showInfoCard(relatedScan, cardX, cardY, false);
  });
}

function highlightScan(scan) {
  scan.classList.remove("scan-highlight");

  void scan.offsetWidth;

  scan.classList.add("scan-highlight");

  setTimeout(() => {
    scan.classList.remove("scan-highlight");
  }, 1200);
}

closeInfo.addEventListener("click", () => {
  closeInfoCard();
});