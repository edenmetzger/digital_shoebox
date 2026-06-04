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