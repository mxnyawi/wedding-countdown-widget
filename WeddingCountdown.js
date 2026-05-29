// ============================================================================
//  💍  Wedding Countdown Widget  —  for the Scriptable app (iOS)
// ============================================================================
//  Counts DOWN to your wedding day, then automatically flips to counting UP
//  ("days since") the moment the date passes.
//
//  HOW TO USE  (full guide in README.md):
//    1. Install the free "Scriptable" app from the App Store.
//    2. Open Scriptable → tap (+) → paste this whole file → name it
//       "Wedding Countdown" → Done.
//    3. Long-press your Home Screen → (+) → search "Scriptable" → add a
//       Small / Medium / Large widget.
//    4. Long-press the new widget → "Edit Widget" → Script: Wedding Countdown.
//    5. (Optional) Set the "Parameter" field to a date to override the
//       config below, e.g.  2026-09-12 16:00
//
//  EDIT THESE TWO LINES  👇  then you're done.
// ============================================================================

const CONFIG = {
  // Your wedding date & time, local time. Format: "YYYY-MM-DDTHH:MM:SS"
  // (you can also override this per-widget via the widget "Parameter" field)
  weddingDate: "2026-10-17T16:00:00",

  // Shown at the top of the widget
  coupleNames: "N & T",

  // Visual theme — pick: "rose", "sunset", "midnight", "sage", "gold"
  theme: "rose",
};

// ============================================================================
//  Themes
// ============================================================================
const THEMES = {
  rose:     { bg: ["#2a0a1f", "#7a1f44"], accent: "#ff8fb1", text: "#ffe9f0", sub: "#f0b9cd" },
  sunset:   { bg: ["#1a0f2e", "#ff6b6b"], accent: "#ffd86b", text: "#fff5e6", sub: "#ffc9a8" },
  midnight: { bg: ["#020111", "#20202c"], accent: "#7aa2ff", text: "#eef2ff", sub: "#a9b6d8" },
  sage:     { bg: ["#10241b", "#3e6b4f"], accent: "#bfe3c2", text: "#eefaf0", sub: "#bcd9c1" },
  gold:     { bg: ["#1c1606", "#3d3415"], accent: "#f3d27a", text: "#fff8e6", sub: "#e6d2a0" },
};

// ============================================================================
//  Settings store  —  lets you change the date/names WITHOUT editing code.
//
//  Settings are saved to a JSON file in Scriptable's folder (iCloud if
//  available). Run the script inside the Scriptable app to open an editor;
//  the widget on your Home Screen just reads the saved values.
//  Priority:  widget Parameter  >  saved settings file  >  CONFIG defaults.
// ============================================================================
const SETTINGS_FILENAME = "wedding-countdown-settings.json";
const BG_FILENAME = "wedding-countdown-bg.jpg";

function settingsFile() {
  let fm;
  try { fm = FileManager.iCloud(); } catch (e) { fm = FileManager.local(); }
  const dir = fm.documentsDirectory();
  return { fm, path: fm.joinPath(dir, SETTINGS_FILENAME) };
}

function loadSettings() {
  const base = {
    weddingDate: CONFIG.weddingDate,
    coupleNames: CONFIG.coupleNames,
    theme: CONFIG.theme,
    useBackgroundImage: false, // set true after picking a photo in the editor
    overlay: 0.45,             // 0 = photo as-is, 1 = fully black scrim
  };
  try {
    const { fm, path } = settingsFile();
    if (fm.fileExists(path)) {
      if (fm.isFileStoredIniCloud && fm.isFileStoredIniCloud(path) && !fm.isFileDownloaded(path)) {
        fm.downloadFileFromiCloud(path);
      }
      const saved = JSON.parse(fm.readString(path));
      return Object.assign(base, saved);
    }
  } catch (e) { /* fall back to defaults */ }
  return base;
}

function saveSettings(obj) {
  try {
    const { fm, path } = settingsFile();
    fm.writeString(path, JSON.stringify(obj, null, 2));
    return true;
  } catch (e) { return false; }
}

// ---- Background photo -------------------------------------------------------
function bgImagePath() {
  let fm;
  try { fm = FileManager.iCloud(); } catch (e) { fm = FileManager.local(); }
  return { fm, path: fm.joinPath(fm.documentsDirectory(), BG_FILENAME) };
}

// Let the user pick a photo and store it alongside the script.
async function pickBackgroundImage() {
  let img;
  try {
    img = await Photos.fromLibrary(); // opens the system photo picker
  } catch (e) {
    return false; // user cancelled the picker
  }
  if (!img) return false;
  const { fm, path } = bgImagePath();
  fm.writeImage(path, img);
  return true;
}

function loadBackgroundImage() {
  try {
    const { fm, path } = bgImagePath();
    if (!fm.fileExists(path)) return null;
    if (fm.isFileStoredIniCloud && fm.isFileStoredIniCloud(path) && !fm.isFileDownloaded(path)) {
      fm.downloadFileFromiCloud(path);
    }
    return fm.readImage(path);
  } catch (e) { return null; }
}

function removeBackgroundImage() {
  try {
    const { fm, path } = bgImagePath();
    if (fm.fileExists(path)) fm.remove(path);
  } catch (e) { /* ignore */ }
}

// Draw a translucent dark scrim over the photo so light text stays readable.
function darkenImage(img, alpha) {
  try {
    const ctx = new DrawContext();
    ctx.size = img.size;
    ctx.respectScreenScale = true;
    ctx.opaque = false;
    const rect = new Rect(0, 0, img.size.width, img.size.height);
    ctx.drawImageInRect(img, rect);
    ctx.setFillColor(new Color("#000000", alpha));
    ctx.fillRect(rect);
    return ctx.getImage();
  } catch (e) {
    return img; // if drawing fails, fall back to the raw photo
  }
}

// In-app editor: prompt for date / names / theme and persist them.
async function editSettings() {
  const s = loadSettings();

  const hasPhoto = !!loadBackgroundImage();

  const a = new Alert();
  a.title = "💍 Wedding Countdown";
  a.message = "Set your details. Date format: YYYY-MM-DD HH:MM (24h).";
  a.addTextField("Date (YYYY-MM-DD HH:MM)", toInputFormat(s.weddingDate));
  a.addTextField("Couple names", s.coupleNames);
  a.addTextField("Theme (rose/sunset/midnight/sage/gold)", s.theme);
  // Photo scrim 0–100 (higher = darker, more readable text over busy photos)
  a.addTextField("Photo darkness 0-100", String(Math.round((s.overlay ?? 0.45) * 100)));
  a.addAction("Save");
  a.addAction(hasPhoto ? "Save & change photo…" : "Save & choose photo…");
  if (hasPhoto) a.addDestructiveAction("Remove photo (use theme)");
  a.addCancelAction("Cancel");

  const idx = await a.presentAlert();
  if (idx === -1) return loadSettings(); // cancelled

  const dateIn = a.textFieldValue(0).trim();
  const namesIn = a.textFieldValue(1).trim();
  const themeIn = a.textFieldValue(2).trim().toLowerCase();
  const darkIn = parseInt(a.textFieldValue(3), 10);

  // Validate the date before saving so a typo can't break the widget.
  const parsed = parseDateInput(dateIn);
  if (!parsed) {
    const err = new Alert();
    err.title = "Couldn't read that date";
    err.message = `"${dateIn}" isn't valid. Use e.g. 2026-10-17 16:00. Keeping your previous date.`;
    err.addAction("OK");
    await err.presentAlert();
    return loadSettings();
  }

  const overlay = isNaN(darkIn) ? (s.overlay ?? 0.45) : Math.min(1, Math.max(0, darkIn / 100));

  const next = {
    weddingDate: parsed.iso,
    coupleNames: namesIn || s.coupleNames,
    theme: THEMES[themeIn] ? themeIn : s.theme,
    overlay,
    useBackgroundImage: hasPhoto, // may change below based on the chosen action
  };

  // Action 0 = Save. Action 1 = choose/change photo. Action 2 (if present) = remove photo.
  if (idx === 1) {
    const picked = await pickBackgroundImage();
    next.useBackgroundImage = picked || hasPhoto;
  } else if (idx === 2 && hasPhoto) {
    removeBackgroundImage();
    next.useBackgroundImage = false;
  }

  saveSettings(next);
  return next;
}

// Turn stored ISO ("2026-10-17T16:00:00") into editor format ("2026-10-17 16:00")
function toInputFormat(iso) {
  return String(iso).replace("T", " ").slice(0, 16);
}

// Parse a flexible date string -> { date, iso } or null.
function parseDateInput(raw) {
  if (!raw) return null;
  let s = raw.trim().replace(" ", "T");
  if (!s.includes("T")) s += "T00:00:00";
  if (s.length === 16) s += ":00";
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return { date: d, iso: s };
}

// ============================================================================
//  Date helpers
// ============================================================================

// Allow per-widget override via the widget Parameter field, else saved settings.
function resolveWeddingDate(settings) {
  const raw =
    (args.widgetParameter && String(args.widgetParameter).trim()) ||
    (settings && settings.weddingDate) ||
    CONFIG.weddingDate;
  // Accept "2026-09-12 16:00" or "2026-09-12T16:00:00" or "2026-09-12"
  let s = raw.replace(" ", "T");
  if (!s.includes("T")) s += "T00:00:00";
  if (s.length === 16) s += ":00"; // add seconds if missing
  const d = new Date(s);
  if (isNaN(d.getTime())) {
    // Last-ditch fallback so the widget never shows a blank crash screen.
    return new Date(CONFIG.weddingDate);
  }
  return d;
}

// Returns the difference broken into d/h/m and a direction flag.
function diffFromNow(target) {
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  const future = ms >= 0;
  const abs = Math.abs(ms);

  const totalMinutes = Math.floor(abs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  // "Is the wedding today?" — compare calendar days, ignoring time of day.
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWedding = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const calendarDayDiff = Math.round((startOfWedding - startOfToday) / 86400000);
  const isToday = calendarDayDiff === 0;

  return { future, isToday, days, hours, minutes, ms };
}

function plural(n, word) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

// ============================================================================
//  Widget builder
// ============================================================================

function buildWidget(settings) {
  settings = settings || loadSettings();
  const theme = THEMES[settings.theme] || THEMES.rose;
  const target = resolveWeddingDate(settings);
  const d = diffFromNow(target);
  const family = config.widgetFamily || "medium";

  const w = new ListWidget();

  // Gradient background (also the fallback if a photo is set but can't load).
  const grad = new LinearGradient();
  grad.colors = [new Color(theme.bg[0]), new Color(theme.bg[1])];
  grad.locations = [0, 1];
  grad.startPoint = new Point(0, 0);
  grad.endPoint = new Point(1, 1);
  w.backgroundGradient = grad;

  // Lock-screen accessory families get a compact treatment.
  if (family.startsWith("accessory")) {
    return buildAccessory(w, d, family);
  }

  // Photo background: load the saved picture, darken it for legibility, and
  // use it instead of the gradient. Falls back to the gradient if missing.
  if (settings.useBackgroundImage) {
    const photo = loadBackgroundImage();
    if (photo) {
      const overlay = typeof settings.overlay === "number" ? settings.overlay : 0.45;
      w.backgroundImage = darkenImage(photo, overlay);
    }
  }

  const pad = family === "small" ? 12 : 18;
  w.setPadding(pad, pad, pad, pad);

  // Header: couple names + heart
  const header = w.addText(settings.coupleNames || CONFIG.coupleNames);
  header.font = Font.semiboldRoundedSystemFont(family === "small" ? 13 : 16);
  header.textColor = new Color(theme.sub);
  header.lineLimit = 1;
  header.minimumScaleFactor = 0.7;

  w.addSpacer(family === "small" ? 4 : 8);

  // The big number
  const bigStack = w.addStack();
  bigStack.layoutVertically();

  if (d.isToday) {
    // 🎉 The day itself
    const t = bigStack.addText("Today! 🎉");
    t.font = Font.heavyRoundedSystemFont(family === "small" ? 30 : 44);
    t.textColor = new Color(theme.accent);
    t.minimumScaleFactor = 0.5;
    t.lineLimit = 1;

    const sub = bigStack.addText("It's the big day");
    sub.font = Font.mediumRoundedSystemFont(family === "small" ? 12 : 15);
    sub.textColor = new Color(theme.text);
  } else {
    // Number
    const number = String(d.days);
    const numText = bigStack.addText(number);
    numText.font = Font.heavyRoundedSystemFont(family === "small" ? 46 : 64);
    numText.textColor = new Color(theme.accent);
    numText.minimumScaleFactor = 0.5;
    numText.lineLimit = 1;

    // Label: "days to go" / "days married" + day label
    const dayWord = d.days === 1 ? "day" : "days";
    const label = d.future ? `${dayWord} to go` : `${dayWord} married 💛`;
    const labelText = bigStack.addText(label);
    labelText.font = Font.semiboldRoundedSystemFont(family === "small" ? 13 : 17);
    labelText.textColor = new Color(theme.text);
    labelText.lineLimit = 1;
    labelText.minimumScaleFactor = 0.7;

    // Fine print: hours/minutes when close, or the date otherwise
    if (family !== "small") {
      w.addSpacer(6);
      let fine;
      if (d.future && d.days === 0) {
        fine = `${plural(d.hours, "hour")} ${plural(d.minutes, "min")} away`;
      } else if (d.future) {
        fine = `+ ${plural(d.hours, "hour")}`;
      } else {
        fine = `since ${formatDate(target)}`;
      }
      const fineText = w.addText(fine);
      fineText.font = Font.regularRoundedSystemFont(13);
      fineText.textColor = new Color(theme.sub);
      fineText.lineLimit = 1;
      fineText.minimumScaleFactor = 0.7;
    }
  }

  // Large widget gets a progress-style footer with the formatted date.
  if (family === "large") {
    w.addSpacer();
    const foot = w.addText(formatDate(target, true));
    foot.font = Font.mediumRoundedSystemFont(15);
    foot.textColor = new Color(theme.sub);
  } else {
    w.addSpacer();
  }

  // Refresh roughly hourly (iOS controls the real cadence) so the count stays
  // fresh and the day-of flip happens promptly.
  w.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);

  return w;
}

// Lock-screen / StandBy accessory widgets
function buildAccessory(w, d, family) {
  w.backgroundGradient = null; // lock screen widgets are tinted by the system
  let line;
  if (d.isToday) {
    line = "💍 Today!";
  } else if (d.future) {
    line = `💍 ${d.days}d to go`;
  } else {
    line = `💍 ${d.days}d married`;
  }

  if (family === "accessoryInline") {
    const t = w.addText(line);
    return w;
  }

  // accessoryRectangular / accessoryCircular
  const stack = w.addStack();
  stack.layoutVertically();
  const big = stack.addText(d.isToday ? "🎉" : String(d.days));
  big.font = Font.boldSystemFont(family === "accessoryCircular" ? 22 : 26);
  const sub = stack.addText(
    d.isToday ? "Big day!" : d.future ? "days to go" : "days married"
  );
  sub.font = Font.systemFont(11);
  return w;
}

function formatDate(date, withWeekday) {
  const df = new DateFormatter();
  df.dateFormat = withWeekday ? "EEEE, d MMMM yyyy" : "d MMM yyyy";
  return df.string(date);
}

// ============================================================================
//  Run
// ============================================================================
if (config.runsInWidget) {
  // On the Home Screen: just read saved settings and render.
  Script.setWidget(buildWidget());
} else {
  // Inside the Scriptable app: open the editor so you can change the date /
  // names / theme with no code edits, then show a live preview.
  const settings = await editSettings();
  await buildWidget(settings).presentMedium();
}
Script.complete();
