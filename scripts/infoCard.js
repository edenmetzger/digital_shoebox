function showInfoCard(scan, x, y, offsetFromClick = true) {
  const filename = scan.dataset.filename;
  const objectInfo = archiveData[filename];

  markObjectAsFound(filename);

  if (!objectInfo) {
    infoTitle.textContent = "Untitled Object";
    infoText.textContent =
      "No information has been added for this object yet.";
  } else {
    infoTitle.textContent = objectInfo.title;
    infoText.textContent = objectInfo.description;
  }

  renderNote(objectInfo);
  renderRelatedObjects(objectInfo);
  renderMemoryTrail(objectInfo);

  infoCard.style.left = `${offsetFromClick ? x + 20 : x}px`;
  infoCard.style.top = `${offsetFromClick ? y + 20 : y}px`;

  infoCard.classList.remove("hidden");
}

function closeInfoCard() {
  if (!infoCard) return;

  infoCard.classList.add("hidden");
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
  if (!foundCounter) return;

  const visibleFilenames = imagePaths.map((path) =>
    path.split("/").pop()
  );

  const found = getFoundObjects().filter((filename) =>
    visibleFilenames.includes(filename)
  );

  const percentage = visibleFilenames.length
    ? Math.round((found.length / visibleFilenames.length) * 100)
    : 0;

  foundCounter.textContent =
    `found ${found.length} / ${visibleFilenames.length} (${percentage}%)`;
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

  const heading = document.createElement("div");
  heading.className = "related-heading";
  heading.textContent = "related objects";
  relatedObjects.appendChild(heading);

  objectInfo.related.forEach((filename) => {
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

function renderMemoryTrail(objectInfo) {
  memoryTrail.innerHTML = "";

  if (!objectInfo) return;

  if (
    objectInfo.previous &&
    document.querySelector(
      `.scan[data-filename="${objectInfo.previous}"]`
    )
  ) {
    const previousButton = document.createElement("button");
    previousButton.textContent = "← earlier";

    previousButton.addEventListener("click", () => {
      openObjectByFilename(objectInfo.previous);
    });

    memoryTrail.appendChild(previousButton);
  }

  if (
    objectInfo.next &&
    document.querySelector(
      `.scan[data-filename="${objectInfo.next}"]`
    )
  ) {
    const nextButton = document.createElement("button");
    nextButton.textContent = "later →";

    nextButton.addEventListener("click", () => {
      openObjectByFilename(objectInfo.next);
    });

    memoryTrail.appendChild(nextButton);
  }
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
    const CARD_HEIGHT = 220;

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