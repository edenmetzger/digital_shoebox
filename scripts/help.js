function initializeHelpToggle() {
  if (!helpToggle || !legend) return;

  helpToggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    legend.classList.toggle("hidden");
  });

  document.addEventListener("keydown", (event) => {
    if (isTypingInInput(event)) return;

    if (event.key === "?") {
      event.preventDefault();
      legend.classList.toggle("hidden");
    }
  });
}