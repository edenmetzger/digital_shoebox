const archiveData =
  typeof archive !== "undefined" ? archive : blurbs;

const TOTAL_IMAGE_COUNT = Object.keys(archiveData).length;
const ACTIVE_SCAN_COUNT = 55;

const IMAGE_COUNT = Math.min(
  ACTIVE_SCAN_COUNT,
  TOTAL_IMAGE_COUNT
);

const IMAGE_FOLDER = "images-web";

const SESSION_SHOWN_SCANS_KEY =
  "shoeboxSessionShownScans";

const INTRO_DURATION = 1800;
const INTRO_FADE_DURATION = 700;

const DOUBLE_TAP_DELAY = 350;
const TAP_MOVE_LIMIT = 10;

const FOUND_STORAGE_KEY =
  "shoeboxFoundObjects";

const TOSS_FRICTION = 0.85;
const TOSS_MIN_VELOCITY = 0.35;
const OFFSCREEN_MARGIN_RATIO = 0.6;

/*
  Loading strategy

  30 scans immediately
  10 after 150ms
  10 after 300ms
   5 after 450ms

  Total active pile = 55 scans
*/

const INITIAL_SCAN_LOAD_COUNT = 30;
const SCAN_LOAD_BATCH_SIZE = 10;
const SCAN_LOAD_DELAY = 150;

const audioTracks = [
  {
    title: "track 01",
    file: "audio/track01.mp3"
  },
  {
    title: "track 02",
    file: "audio/track02.mp3"
  },
  {
    title: "track 03",
    file: "audio/track03.mp3"
  },
  {
    title: "track 04",
    file: "audio/track04.mp3"
  },
  {
    title: "track 05",
    file: "audio/track05.mp3"
  }
];

function getDefaultScale() {
  if (IMAGE_COUNT >= 100) return 0.4;
  if (IMAGE_COUNT >= 50) return 0.65;
  if (IMAGE_COUNT >= 20) return 0.75;
  if (IMAGE_COUNT >= 10) return 0.9;

  return 1;
}

function getMinimumScale() {
  if (IMAGE_COUNT >= 100) {
    return getDefaultScale();
  }

  return 0.5;
}