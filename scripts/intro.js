function initializeIntro() {
  if (!introOverlay) return;

  const navigationEntry =
    performance.getEntriesByType("navigation")[0];

  const isRefresh =
    navigationEntry && navigationEntry.type === "reload";

  if (isRefresh) {
    introOverlay.remove();
    return;
  }

  setTimeout(() => {
    introOverlay.style.transition =
      `opacity ${INTRO_FADE_DURATION}ms ease`;

    introOverlay.style.opacity = "0";

    setTimeout(() => {
      introOverlay.remove();
    }, INTRO_FADE_DURATION);
  }, INTRO_DURATION);
}