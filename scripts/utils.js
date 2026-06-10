function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const randomIndex =
      Math.floor(Math.random() * (i + 1));

    [array[i], array[randomIndex]] =
      [array[randomIndex], array[i]];
  }
}

function getDistance(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;

  return Math.sqrt(dx * dx + dy * dy);
}

function isTypingInInput(event) {
  const tag = event.target.tagName.toLowerCase();

  return (
    tag === "input" ||
    tag === "textarea" ||
    event.target.isContentEditable
  );
}

function getRadioAvoidanceZone() {
  const radio = document.getElementById("audioWidget");
  if (!radio) return null;

  const rect = radio.getBoundingClientRect();
  const padding = 30;

  return {
    left: rect.left - padding,
    top: rect.top - padding,
    right: rect.right + padding,
    bottom: rect.bottom + padding
  };
}

function nudgeAwayFromZone(x, y, width, height, zone) {
  if (!zone) return { x, y };

  const overlaps =
    x < zone.right &&
    x + width > zone.left &&
    y < zone.bottom &&
    y + height > zone.top;

  if (!overlaps) return { x, y };

  if (Math.random() < 0.8) {
    return {
      x,
      y: zone.bottom + 20 + Math.random() * 40
    };
  }

  return { x, y };
}

function nudgeAwayFromRadio(x, y, scan, scale) {
  return nudgeAwayFromZone(
    x,
    y,
    scan.offsetWidth * scale,
    scan.offsetHeight * scale,
    getRadioAvoidanceZone()
  );
}