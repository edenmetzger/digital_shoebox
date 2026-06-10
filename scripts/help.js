function initializeHelpToggle() {
  if (!helpToggle || !legend) return;

  legend.innerHTML = `
    <p>drag to move</p>
    <p>scroll or pinch to resize</p>
    <p>double-click/tap twice to learn more</p>
    <p>hold space for metadata</p>
    <p>s shake the box</p>
    <p>← spread left / spread right →</p>
    <p>↑ surface pile</p>
    <p>↓ gather pile</p>
    <p>tab to center an object</p>
    <p>~ random memory</p>
    <p id="foundCounter">found 0 / 0</p>
  `;

  helpToggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    legend.classList.toggle("hidden");
    updateFoundCounter();
  });

  document.addEventListener("keydown", (event) => {
    if (isTypingInInput(event)) return;

    if (event.key === "?") {
      event.preventDefault();
      legend.classList.toggle("hidden");
      updateFoundCounter();
    }
  });
}