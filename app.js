(function () {
  const DB_NAME = "media-pages-db";
  const DB_VERSION = 1;
  const STORE = "files";
  const META_KEY = "media-pages:pages";
  const SETTINGS_KEY = "media-pages:github-settings";
  const LOGOS_KEY = "media-pages:logos";
  const EXPANDED_ROWS_KEY = "media-pages:expanded-rows";
  const INDEX_PATH = "data/pages.json";
  const GITHUB_API_VERSION = "2022-11-28";
  const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
  const MAX_GITHUB_BYTES = 100 * 1024 * 1024;
  const MAX_VIDEO_SECONDS = 600;
  const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg"]);
  const VIDEO_EXTENSIONS = new Set(["mp4", "3gp"]);
  const MOV_EXTENSIONS = new Set(["mov"]);
  const MOV_MIME_TYPES = new Set(["video/quicktime", "video/x-quicktime", "video/mov"]);
  const FFMPEG_ESM_URL = "https://cdnjs.cloudflare.com/ajax/libs/ffmpeg/0.12.10/esm/index.js";
  const FFMPEG_CORE_BASE_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
  const DEFAULT_GITHUB_SETTINGS = {
    owner: "nordiamarble",
    repo: "Viber-Videos",
    branch: "main",
    mediaDir: "media",
    siteBaseUrl: "https://nordiamarble.github.io/Viber-Videos/",
  };
  const BUILTIN_LOGOS = [
    {
      id: "builtin-dionyssomarble",
      name: "Dionyssomarble",
      url: "./assets/logos/dionyssomarble-transparent.png",
    },
    {
      id: "builtin-nordia-marble",
      name: "NORDIA Marble",
      url: "./assets/logos/nordia-marble-transparent.png",
    },
    {
      id: "builtin-dionyssomarble-nordia",
      name: "Διπλό λογότυπο",
      url: "./assets/logos/dionyssomarble-nordia-combo-transparent.png",
    },
  ];

  const icons = {
    menu: "M4 6h16M4 12h16M4 18h16",
    video: "m15 10 5-3v10l-5-3v3H4V7h11v3Z",
    image: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M21 10V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v5m5 3 2.5-2.5L14 14l2-2 5 5M8 8h.01",
    home: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z",
    plus: "M12 5v14M5 12h14",
    folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
    settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM4.93 4.93l2.12 2.12m9.9 9.9 2.12 2.12M2 12h3m14 0h3M4.93 19.07l2.12-2.12m9.9-9.9 2.12-2.12",
    search: "m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z",
    upload: "M12 16V4m0 0 5 5m-5-5-5 5M4 20h16",
    copy: "M8 8h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8Zm-2 8H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    edit: "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z",
    trash: "M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14",
    external: "M14 3h7v7M21 3l-9 9M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5",
    play: "M8 5v14l11-7-11-7Z",
    x: "M6 6l12 12M18 6 6 18",
    chevron: "m9 18 6-6-6-6",
  };

  const samplePages = [
    {
      id: "sample-crete",
      title: "Καλοκαιρινές Διακοπές 2024",
      description: "Φωτογραφίες και βίντεο από τις φετινές καλοκαιρινές διακοπές μας στην Κρήτη.",
      slug: "kalokairines-diakopes-2024",
      published: true,
      createdAt: "2026-05-24T10:00:00.000Z",
      files: [
        remoteImage("Παραλία", "#008c8c", "#f7d06b"),
        remoteImage("Θάλασσα", "#0e7490", "#b7e4ef"),
        remoteImage("Νησί", "#2f6f4e", "#f4a261"),
      ],
    },
    {
      id: "sample-athens",
      title: "Αθήνα - Μια πόλη ιστορία",
      description: "Μικρή συλλογή από στιγμές στην Αθήνα.",
      slug: "athina-mia-poli-istoria",
      published: true,
      createdAt: "2026-05-23T10:00:00.000Z",
      files: [
        remoteImage("Αθήνα", "#4a5568", "#cbd5e1"),
      ],
    },
    {
      id: "sample-food",
      title: "Συνταγές από την Κρήτη",
      description: "Φωτογραφίες από αγαπημένες γεύσεις.",
      slug: "syntages-kritis",
      published: false,
      createdAt: "2026-05-22T10:00:00.000Z",
      files: [
        remoteImage("Φαγητό", "#bc5a3c", "#f8d8b0"),
      ],
    },
  ];

  const state = {
    pages: [],
    search: "",
    selectedId: "",
    selectedFiles: [],
    uploadErrors: [],
    uploadStatus: "",
    processingFiles: false,
    draft: {
      title: "",
      description: "",
      slug: "",
      published: true,
      slugTouched: false,
      logoId: "",
      logoSize: 18,
      overlayText: "",
      overlaySubtext: "",
    },
    previewOpen: localStorage.getItem("media-pages:preview-open") !== "false",
    expandedRows: new Set(loadExpandedRows()),
    settingsOpen: false,
    imageEditor: null,
    videoEditor: null,
    logos: loadLogos(),
    editId: null,
    db: null,
    github: loadGithubSettings(),
    uploading: false,
    objectUrls: new Map(),
  };

  function remoteImage(name, colorA, colorB) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
        <defs>
          <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
            <stop stop-color="${colorA}" />
            <stop offset="1" stop-color="${colorB}" />
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#g)" />
        <circle cx="930" cy="170" r="96" fill="rgba(255,255,255,.28)" />
        <path d="M0 590 C210 500 330 650 520 560 C730 460 820 620 1200 500 L1200 800 L0 800 Z" fill="rgba(255,255,255,.34)" />
        <path d="M0 680 C230 610 420 725 610 650 C820 565 930 710 1200 610 L1200 800 L0 800 Z" fill="rgba(255,255,255,.45)" />
        <text x="72" y="118" fill="white" font-family="Arial, sans-serif" font-size="52" font-weight="700">${escapeHtml(name)}</text>
      </svg>
    `;
    return {
      id: `remote-${Math.random().toString(36).slice(2)}`,
      name,
      type: "image/jpeg",
      size: 0,
      remoteUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    };
  }

  function icon(name) {
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${icons[name] || icons.image}"></path></svg>`;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function slugify(value) {
    const map = {
      α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z", η: "i", θ: "th",
      ι: "i", κ: "k", λ: "l", μ: "m", ν: "n", ξ: "x", ο: "o", π: "p",
      ρ: "r", σ: "s", ς: "s", τ: "t", υ: "y", φ: "f", χ: "ch", ψ: "ps",
      ω: "o",
    };
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[άαβγδεέζηήθιίϊΐκλμνξοόπρσςτυύϋΰφχψωώ]/g, (char) => map[char] || char)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70);
  }

  function fileTitle(name) {
    return String(name || "media")
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "media";
  }

  function uniqueSlug(base, excludeId) {
    const fallback = `media-${Date.now()}`;
    const cleanBase = slugify(base) || fallback;
    let candidate = cleanBase;
    let counter = 2;
    while (state.pages.some((page) => page.slug === candidate && page.id !== excludeId)) {
      candidate = `${cleanBase}-${counter}`;
      counter += 1;
    }
    return candidate;
  }

  function normalizeFolder(value) {
    return String(value || "media")
      .trim()
      .replace(/^\/+|\/+$/g, "")
      .replace(/\/+/g, "/") || "media";
  }

  function cleanFileName(name) {
    const extension = fileExtension({ name });
    const base = String(name || "media")
      .replace(/\.[^.]+$/, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "media";
    return extension ? `${base}.${extension}` : base;
  }

  function mediaUploadName(item) {
    const name = item.name || item.file?.name || "media";
    const fileType = String(item.type || item.file?.type || "");
    const preferredExtension = fileType === "video/mp4" ? "mp4" : fileType === "video/3gpp" ? "3gp" : "";
    const extension = preferredExtension || fileExtension({ name }) || fileExtension(item.file || {});
    const nameExtension = fileExtension({ name });
    if (!extension) return name;
    if (preferredExtension && nameExtension !== preferredExtension) return replaceExtension(name, preferredExtension);
    return nameExtension ? name : `${name}.${extension}`;
  }

  function clampNumber(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.max(min, Math.min(max, number));
  }

  function videoPlayback(media) {
    const sourceDuration = Number(media?.durationSeconds || 0);
    const stored = media?.playback || {};
    const maxStart = Math.max(0, sourceDuration - 0.1);
    const startSeconds = clampNumber(stored.startSeconds ?? 0, 0, maxStart);
    const fallbackDuration = sourceDuration ? Math.max(0.1, sourceDuration - startSeconds) : MAX_VIDEO_SECONDS;
    const durationSeconds = clampNumber(stored.durationSeconds ?? fallbackDuration, 0.1, MAX_VIDEO_SECONDS);
    const segmentSeconds = sourceDuration ? Math.max(0.1, sourceDuration - startSeconds) : durationSeconds;
    return {
      startSeconds,
      durationSeconds,
      segmentSeconds,
      loops: durationSeconds > segmentSeconds + 0.05,
    };
  }

  function playbackMeta(media) {
    if (!media?.type?.startsWith("video/")) return "";
    const playback = videoPlayback(media);
    const sourceDuration = Number(media.durationSeconds || 0);
    if (!media.playback || !sourceDuration) return "";
    const loopText = playback.loops ? " · loop" : "";
    return ` · προβολή ${formatSeconds(playback.durationSeconds)} από ${formatSeconds(playback.startSeconds)}${loopText}`;
  }

  function githubSettingsReady() {
    const settings = state.github;
    return Boolean(settings.owner && settings.repo && settings.branch && settings.token);
  }

  function loadGithubSettings() {
    const defaults = {
      ...DEFAULT_GITHUB_SETTINGS,
      token: "",
    };
    try {
      return normalizeGithubSettings({ ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") });
    } catch {
      return defaults;
    }
  }

  function normalizeGithubSettings(settings) {
    return {
      owner: String(settings.owner || DEFAULT_GITHUB_SETTINGS.owner).trim(),
      repo: String(settings.repo || DEFAULT_GITHUB_SETTINGS.repo).trim(),
      branch: String(settings.branch || DEFAULT_GITHUB_SETTINGS.branch).trim(),
      mediaDir: normalizeFolder(settings.mediaDir || DEFAULT_GITHUB_SETTINGS.mediaDir),
      siteBaseUrl: String(settings.siteBaseUrl || DEFAULT_GITHUB_SETTINGS.siteBaseUrl).trim().replace(/\/+$/g, "") + "/",
      token: String(settings.token || "").trim(),
    };
  }

  function saveGithubSettings(settings) {
    state.github = normalizeGithubSettings(settings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.github));
  }

  function loadLogos() {
    try {
      const logos = JSON.parse(localStorage.getItem(LOGOS_KEY) || "[]");
      return Array.isArray(logos) ? logos : [];
    } catch {
      return [];
    }
  }

  function saveLogos() {
    localStorage.setItem(LOGOS_KEY, JSON.stringify(state.logos));
  }

  function loadExpandedRows() {
    try {
      const rows = JSON.parse(localStorage.getItem(EXPANDED_ROWS_KEY) || "[]");
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  }

  function saveExpandedRows() {
    localStorage.setItem(EXPANDED_ROWS_KEY, JSON.stringify(Array.from(state.expandedRows)));
  }

  function mergeLogos(logos) {
    if (!Array.isArray(logos)) return;
    const byId = new Map(state.logos.map((logo) => [logo.id, logo]));
    logos.forEach((logo) => {
      if (logo?.id && logo?.dataUrl) byId.set(logo.id, logo);
    });
    state.logos = Array.from(byId.values());
    saveLogos();
  }

  function mergePageLogos() {
    mergeLogos(state.pages.map((page) => page.logo).filter(Boolean));
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function allLogos() {
    const builtinIds = new Set(BUILTIN_LOGOS.map((logo) => logo.id));
    return [
      ...BUILTIN_LOGOS,
      ...state.logos.filter((logo) => logo?.id && !builtinIds.has(logo.id)),
    ];
  }

  function logoById(id) {
    return allLogos().find((logo) => logo.id === id) || null;
  }

  function logoSrc(logo) {
    return logo?.dataUrl || logo?.url || "";
  }

  function renderTextOverlay(page) {
    if (!page) return "";
    const text = String(page.overlayText || "").trim();
    const subtext = String(page.overlaySubtext || "").trim();
    if (!text && !subtext) return "";
    return `
      <div class="media-text-overlay">
        ${text ? `<strong>${escapeHtml(text)}</strong>` : ""}
        ${subtext ? `<span>${escapeHtml(subtext)}</span>` : ""}
      </div>
    `;
  }

  function renderEditableTextOverlay(page) {
    const text = String(page?.overlayText || "").trim();
    const subtext = String(page?.overlaySubtext || "").trim();
    return `
      <div class="media-text-overlay editor-live-text-overlay" ${text || subtext ? "" : "hidden"}>
        <strong>${escapeHtml(text)}</strong>
        <span>${escapeHtml(subtext)}</span>
      </div>
    `;
  }

  function renderLogoOverlayControls(prefix, selectedLogoId, size, overlayText, overlaySubtext) {
    return `
      <div class="editor-control-group">
        <div class="editor-field">
          <span>Λογότυπο επικάλυψης</span>
          <div class="logo-row">
            <select class="input" id="${prefix}LogoId">
              <option value="">Χωρίς λογότυπο</option>
              ${allLogos().map((logo) => `<option value="${escapeHtml(logo.id)}" ${selectedLogoId === logo.id ? "selected" : ""}>${escapeHtml(logo.name)}</option>`).join("")}
            </select>
            <label class="secondary logo-upload-button">
              ${icon("upload")} Νέο λογότυπο
              <input id="${prefix}LogoInput" type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" />
            </label>
          </div>
        </div>
        <label>
          <span>Μέγεθος λογοτύπου</span>
          <div class="range-row">
            <input id="${prefix}LogoSize" type="range" min="8" max="35" step="1" value="${escapeHtml(size || 18)}" />
            <input class="input range-number" id="${prefix}LogoSizeNumber" type="number" min="8" max="35" step="1" value="${escapeHtml(size || 18)}" />
          </div>
        </label>
        <label>
          <span>Κείμενο επικάλυψης</span>
          <input class="input" id="${prefix}OverlayText" maxlength="90" value="${escapeHtml(overlayText || "")}" placeholder="π.χ. 2616 Bellagio" />
        </label>
        <label>
          <span>Μικρό κείμενο</span>
          <input class="input" id="${prefix}OverlaySubtext" maxlength="120" value="${escapeHtml(overlaySubtext || "")}" placeholder="π.χ. Premium marble surfaces" />
        </label>
      </div>
    `;
  }

  function logoSizePercent(page) {
    return clampNumber(page?.logoSize ?? 18, 8, 35);
  }

  function videoPlaybackAttrs(media) {
    const playback = videoPlayback(media);
    return [
      `data-video-start="${escapeHtml(playback.startSeconds)}"`,
      `data-video-duration="${escapeHtml(playback.durationSeconds)}"`,
      `data-video-source-duration="${escapeHtml(media?.durationSeconds || playback.durationSeconds)}"`,
    ].join(" ");
  }

  function bindTimedVideos() {
    document.querySelectorAll("video[data-video-duration]").forEach((video) => {
      if (video.dataset.timedBound === "true") return;
      video.dataset.timedBound = "true";
      const read = () => ({
        start: Number(video.dataset.videoStart || 0),
        target: Number(video.dataset.videoDuration || 0),
        sourceDuration: Number(video.dataset.videoSourceDuration || video.duration || 0),
      });
      const reset = () => {
        const { start } = read();
        video.dataset.playedSeconds = "0";
        video.dataset.lastTime = String(start);
        if (Number.isFinite(video.duration) && Math.abs(video.currentTime - start) > 0.08) {
          video.currentTime = start;
        }
      };
      video.addEventListener("loadedmetadata", reset);
      video.addEventListener("play", () => {
        const { start } = read();
        if (video.currentTime < start || Math.abs(Number(video.dataset.playedSeconds || 0)) < 0.01) {
          video.currentTime = start;
        }
        video.dataset.lastTime = String(video.currentTime);
      });
      video.addEventListener("seeking", () => {
        video.dataset.lastTime = String(video.currentTime);
      });
      video.addEventListener("timeupdate", () => {
        const { start, target, sourceDuration } = read();
        if (!target || !sourceDuration) return;
        const segmentEnd = Math.min(sourceDuration, start + target);
        const lastTime = Number(video.dataset.lastTime || video.currentTime);
        let played = Number(video.dataset.playedSeconds || 0);
        if (video.currentTime >= lastTime) played += video.currentTime - lastTime;
        video.dataset.playedSeconds = String(played);
        video.dataset.lastTime = String(video.currentTime);
        if (played >= target) {
          video.pause();
          video.currentTime = Math.min(segmentEnd, sourceDuration);
          return;
        }
        if (video.currentTime >= segmentEnd - 0.04) {
          video.currentTime = start;
          video.dataset.lastTime = String(start);
          if (!video.paused) video.play().catch(() => {});
        }
      });
      video.addEventListener("ended", () => {
        const { start, target } = read();
        const played = Number(video.dataset.playedSeconds || 0);
        if (played < target) {
          video.currentTime = start;
          video.play().catch(() => {});
        }
      });
    });
  }

  function pageUrl(slug) {
    const base = state.github.siteBaseUrl || window.location.href.split("#")[0];
    return `${base}#/p/${slug}`;
  }

  function directMediaUrl(media) {
    const url = media?.githubPath ? publicMediaUrl(media.githubPath) : media?.remoteUrl || "";
    return /^https?:\/\//.test(url) ? url : "";
  }

  function renderCopyUrlField(label, value, emptyText = "Δεν υπάρχει ακόμα URL") {
    return `
      <label class="copy-url-field">
        <span>${escapeHtml(label)}</span>
        <div class="url-box">
          <input readonly value="${escapeHtml(value || emptyText)}" />
          <button class="icon-button copy-direct-url" type="button" data-url="${escapeHtml(value)}" ${value ? "" : "disabled"} title="Αντιγραφή ${escapeHtml(label)}">${icon("copy")}</button>
        </div>
      </label>
    `;
  }

  function formatBytes(bytes) {
    if (!bytes) return "";
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit += 1;
    }
    return `${size.toFixed(unit ? 1 : 0)} ${units[unit]}`;
  }

  function formatSeconds(seconds) {
    if (typeof seconds !== "number" || !Number.isFinite(seconds)) return "";
    return `${seconds.toFixed(2)} sec`;
  }

  function fileExtension(file) {
    return String(file.name || "").split(".").pop().toLowerCase();
  }

  function replaceExtension(name, extension) {
    const cleanName = String(name || "video").replace(/\.[^.]+$/, "");
    return `${cleanName}.${extension}`;
  }

  function mediaMeta(media) {
    const parts = [];
    if (media.type) parts.push(media.type);
    if (media.size) parts.push(formatBytes(media.size));
    if (media.durationSeconds !== undefined) parts.push(`διάρκεια ${formatSeconds(media.durationSeconds)}`);
    if (media.convertedFrom) parts.push("μετατροπή από MOV");
    return parts.join(" · ");
  }

  function getVideoDuration(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      const cleanup = () => {
        URL.revokeObjectURL(url);
        video.removeAttribute("src");
        video.load();
      };

      video.preload = "metadata";
      video.onloadedmetadata = () => {
        const duration = video.duration;
        cleanup();
        if (Number.isFinite(duration)) resolve(duration);
        else reject(new Error("unknown-duration"));
      };
      video.onerror = () => {
        cleanup();
        reject(new Error("unreadable-video"));
      };
      video.src = url;
    });
  }

  let ffmpegLoadPromise = null;
  let ffmpegInstance = null;

  async function toBlobUrl(url, mimeType) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`ffmpeg asset ${response.status}`);
    const blob = await response.blob();
    return URL.createObjectURL(new Blob([blob], { type: mimeType }));
  }

  async function loadFfmpeg(onStatus = () => {}) {
    if (ffmpegInstance) return ffmpegInstance;
    if (!ffmpegLoadPromise) {
      ffmpegLoadPromise = (async () => {
        onStatus("Φορτώνω τον μετατροπέα MOV → MP4. Αυτό γίνεται μόνο την πρώτη φορά.");
        const { FFmpeg } = await import(FFMPEG_ESM_URL);
        const ffmpeg = new FFmpeg();
        ffmpeg.on("log", ({ message }) => {
          if (/frame=|time=|speed=/.test(message)) onStatus("Μετατρέπω το MOV σε MP4...");
        });
        await ffmpeg.load({
          coreURL: await toBlobUrl(`${FFMPEG_CORE_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
          wasmURL: await toBlobUrl(`${FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
        });
        ffmpegInstance = ffmpeg;
        return ffmpeg;
      })().catch((error) => {
        ffmpegLoadPromise = null;
        throw error;
      });
    }
    return ffmpegLoadPromise;
  }

  async function convertMovToMp4(file, onStatus = () => {}) {
    const ffmpeg = await loadFfmpeg(onStatus);
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const inputName = `input-${stamp}.mov`;
    const outputName = `output-${stamp}.mp4`;
    onStatus(`${file.name}: μετατρέπω σε MP4...`);
    try {
      await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
      await ffmpeg.exec([
        "-i", inputName,
        "-map", "0:v:0",
        "-map", "0:a?",
        "-sn",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "24",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "128k",
        "-movflags", "+faststart",
        outputName,
      ]);
      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data], { type: "video/mp4" });
      return new File([blob], replaceExtension(file.name, "mp4"), { type: "video/mp4" });
    } finally {
      await ffmpeg.deleteFile(inputName).catch(() => {});
      await ffmpeg.deleteFile(outputName).catch(() => {});
    }
  }

  async function validateUploadFile(file, onStatus = () => {}) {
    const extension = fileExtension(file);
    const isImage = IMAGE_EXTENSIONS.has(extension);
    const isVideo = VIDEO_EXTENSIONS.has(extension);
    const isMov = MOV_EXTENSIONS.has(extension) || MOV_MIME_TYPES.has(String(file.type || "").toLowerCase());

    if (!isImage && !isVideo && !isMov) {
      return {
        error: `${file.name}: επιτρέπονται μόνο φωτογραφίες png, jpg, jpeg και βίντεο mp4, 3gp, mov.`,
      };
    }

    if (!isMov && file.size > MAX_GITHUB_BYTES) {
      return {
        error: `${file.name}: είναι ${formatBytes(file.size)}. Για αποθήκευση σε κανονικό GitHub repo το όριο είναι 100 MB ανά αρχείο.`,
      };
    }

    if (isImage) {
      return {
        item: {
          file,
          name: file.name,
          type: file.type || `image/${extension === "jpg" ? "jpeg" : extension}`,
          size: file.size,
          kind: "image",
        },
      };
    }

    if (file.size > MAX_VIDEO_BYTES) {
      return {
        error: `${file.name}: είναι ${formatBytes(file.size)}. Το όριο για βίντεο είναι 200 MB.`,
      };
    }

    try {
      const videoFile = isMov ? await convertMovToMp4(file, onStatus) : file;
      if (videoFile.size > MAX_GITHUB_BYTES) {
        return {
          error: `${file.name}: μετά τη μετατροπή έγινε ${formatBytes(videoFile.size)}. Το GitHub δέχεται μέχρι 100 MB ανά αρχείο.`,
        };
      }
      const durationSeconds = await getVideoDuration(videoFile);
      if (durationSeconds > MAX_VIDEO_SECONDS) {
        return {
          error: `${file.name}: διάρκεια ${formatSeconds(durationSeconds)}. Το όριο είναι 600.00 sec.`,
        };
      }
      return {
        item: {
          file: videoFile,
          name: videoFile.name,
          type: videoFile.type || "video/mp4",
          size: videoFile.size,
          kind: "video",
          durationSeconds,
          convertedFrom: isMov ? file.name : "",
        },
      };
    } catch (error) {
      return {
        error: isMov
          ? `${file.name}: το MOV δεν μετατράπηκε σε MP4. Δοκίμασε ξανά με μικρότερο MOV ή κάν' το export ως MP4.`
          : `${file.name}: δεν μπόρεσα να διαβάσω με ακρίβεια τη διάρκεια, άρα δεν δημιουργείται URL.`,
      };
    }
  }

  function mediaKind(files) {
    if (!files.length) return "Άδειο";
    const hasVideo = files.some((file) => file.type.startsWith("video/"));
    const hasImage = files.some((file) => file.type.startsWith("image/"));
    if (hasVideo && hasImage) return "Βίντεο + thumbnail";
    if (hasVideo) return "Βίντεο";
    return "Thumbnail";
  }

  function firstMedia(page) {
    return page.files && page.files.length ? page.files[0] : null;
  }

  function pageVideo(page) {
    return page?.files?.find((file) => file.type.startsWith("video/")) || firstMedia(page);
  }

  function pageThumbnail(page) {
    return page?.files?.find((file) => file.type.startsWith("image/")) || firstMedia(page);
  }

  function selectedVideoThumbnailPairs() {
    const videos = state.selectedFiles.filter((item) => item.kind === "video");
    const thumbnails = state.selectedFiles.filter((item) => item.kind === "image");
    const count = Math.min(videos.length, thumbnails.length);
    return {
      videos,
      thumbnails,
      pairs: Array.from({ length: count }, (_, index) => ({
        video: videos[index],
        thumbnail: thumbnails[index],
      })),
      missingVideos: Math.max(0, thumbnails.length - videos.length),
      missingThumbnails: Math.max(0, videos.length - thumbnails.length),
    };
  }

  function pageFileSummary(page) {
    const count = page.files.length;
    const media = firstMedia(page);
    const countText = `${count} αρχείο${count === 1 ? "" : "α"}`;
    if (media && media.durationSeconds !== undefined) {
      return `1 βίντεο + 1 thumbnail · ${formatSeconds(media.durationSeconds)}`;
    }
    return countText;
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function putFile(id, file) {
    return new Promise((resolve, reject) => {
      const tx = state.db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(file, id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function getFile(id) {
    return new Promise((resolve, reject) => {
      const tx = state.db.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function deleteFile(id) {
    return new Promise((resolve) => {
      const tx = state.db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
  }

  function loadPages() {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) {
      state.pages = samplePages;
      savePages();
      return;
    }
    try {
      state.pages = JSON.parse(raw);
      mergePageLogos();
    } catch {
      state.pages = samplePages;
      savePages();
    }
  }

  function savePages() {
    localStorage.setItem(META_KEY, JSON.stringify(state.pages));
  }

  async function githubRequest(path, options = {}) {
    const { owner, repo, token } = state.github;
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        ...(options.headers || {}),
      },
    });
    if (response.status === 404 && (!options.method || options.method === "GET")) return null;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.message || `GitHub error ${response.status}`);
    }
    return payload;
  }

  async function getGithubFileSha(path) {
    const payload = await githubRequest(`/contents/${encodeURIComponentPath(path)}?ref=${encodeURIComponent(state.github.branch)}`);
    return payload && payload.sha ? payload.sha : null;
  }

  function encodeURIComponentPath(path) {
    return path.split("/").map(encodeURIComponent).join("/");
  }

  function publicMediaUrl(path) {
    const base = state.github.siteBaseUrl || DEFAULT_GITHUB_SETTINGS.siteBaseUrl;
    return `${base.replace(/\/+$/, "")}/${String(path || "").replace(/^\/+/, "")}`;
  }

  async function fileToBase64(file) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  }

  async function textToBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  }

  async function uploadGithubFile(path, contentBase64, message) {
    const sha = await getGithubFileSha(path);
    const body = {
      message,
      content: contentBase64,
      branch: state.github.branch,
    };
    if (sha) body.sha = sha;
    const payload = await githubRequest(`/contents/${encodeURIComponentPath(path)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    return payload.content;
  }

  async function uploadMediaToGithub(item, slug) {
    if (item.size > MAX_GITHUB_BYTES) {
      throw new Error(`${item.name}: το GitHub repo δέχεται έως 100 MB ανά αρχείο.`);
    }
    const uploadName = mediaUploadName(item);
    const stamp = new Date().toISOString().slice(0, 10);
    const role = item.kind === "image" ? "thumbnail" : "video";
    const path = `${normalizeFolder(state.github.mediaDir)}/${stamp}/${slug}-${role}-${cleanFileName(uploadName)}`;
    const content = await fileToBase64(item.file);
    await uploadGithubFile(path, content, `Add media ${uploadName}`);
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: uploadName,
      type: item.type,
      size: item.size,
      kind: item.kind,
      durationSeconds: item.durationSeconds,
      playback: item.playback || null,
      githubPath: path,
      remoteUrl: publicMediaUrl(path),
    };
  }

  function hasPhotoOverlay(config) {
    return Boolean(config?.logo || config?.overlayText || config?.overlaySubtext);
  }

  async function itemToImageSource(item) {
    if (item.file) {
      const url = URL.createObjectURL(item.file);
      return { url, revoke: () => URL.revokeObjectURL(url) };
    }
    if (item.githubPath) return { url: publicMediaUrl(item.githubPath), revoke: () => {} };
    if (item.remoteUrl) return { url: item.remoteUrl, revoke: () => {} };
    return { url: "", revoke: () => {} };
  }

  async function photoWithOverlay(item, config) {
    if (!item || item.kind !== "image" || !hasPhotoOverlay(config)) return item;
    const source = await itemToImageSource(item);
    if (!source.url) return item;
    try {
      const image = await loadImage(source.url);
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      await drawBrandOverlay(ctx, canvas.width, canvas.height, config);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.94));
      if (!blob) return item;
      const name = `${fileTitle(item.name)}-overlay.png`;
      const file = new File([blob], name, { type: "image/png" });
      return {
        ...item,
        file,
        name,
        type: "image/png",
        size: file.size,
      };
    } finally {
      source.revoke();
    }
  }

  async function drawBrandOverlay(ctx, width, height, config) {
    const padding = Math.max(10, Math.round(width * 0.015));
    const text = String(config.overlayText || "").trim();
    const subtext = String(config.overlaySubtext || "").trim();
    if (text || subtext) {
      const fontSize = Math.max(22, Math.min(64, Math.round(width * 0.034)));
      ctx.save();
      ctx.lineJoin = "round";
      ctx.textBaseline = "top";
      ctx.font = `900 ${fontSize}px Arial, Helvetica, sans-serif`;
      ctx.lineWidth = Math.max(3, Math.round(fontSize * 0.16));
      ctx.strokeStyle = "#1d1d1d";
      ctx.fillStyle = "#ffffff";
      const x = padding;
      let y = padding;
      if (text) {
        const safeText = text.slice(0, 90);
        ctx.strokeText(safeText, x, y);
        ctx.fillText(safeText, x, y);
        y += Math.round(fontSize * 1.12);
      }
      if (subtext) {
        const smallSize = Math.max(15, Math.round(fontSize * 0.58));
        ctx.font = `900 ${smallSize}px Arial, Helvetica, sans-serif`;
        ctx.lineWidth = Math.max(2, Math.round(smallSize * 0.16));
        const safeSubtext = subtext.slice(0, 120);
        ctx.strokeText(safeSubtext, x, y);
        ctx.fillText(safeSubtext, x, y);
      }
      ctx.restore();
    }

    const logoUrl = logoSrc(config.logo);
    if (logoUrl) {
      const logo = await loadImage(logoUrl);
      const logoPercent = clampNumber(config.logoSize ?? 18, 8, 35) / 100;
      const logoWidth = Math.max(48, width * logoPercent);
      const logoHeight = (logo.naturalHeight || logo.height) * (logoWidth / (logo.naturalWidth || logo.width));
      const logoY = Math.max(padding, padding + (Math.max(0, Math.round(width * 0.07) - logoHeight) / 2));
      ctx.drawImage(logo, width - logoWidth - padding, logoY, logoWidth, logoHeight);
    }
  }

  async function syncPagesToGithub() {
    const publicPages = state.pages.filter((page) => !page.id.startsWith("sample-"));
    const json = JSON.stringify({ pages: publicPages, logos: state.logos }, null, 2);
    await uploadGithubFile(INDEX_PATH, await textToBase64(json), "Update media pages index");
  }

  async function tryLoadPublishedPages() {
    if (window.location.protocol === "file:") return;
    try {
      const response = await fetch(`./${INDEX_PATH}?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) return;
      const payload = await response.json();
      if (!Array.isArray(payload.pages)) return;
      const byId = new Map(state.pages.map((page) => [page.id, page]));
      payload.pages.forEach((page) => byId.set(page.id, page));
      state.pages = Array.from(byId.values());
      mergeLogos(payload.logos);
      mergePageLogos();
      savePages();
    } catch {
      // The public index exists only after the first GitHub sync.
    }
  }

  async function mediaSrc(media) {
    if (!media) return "";
    if (media.githubPath) return publicMediaUrl(media.githubPath);
    if (media.remoteUrl) return media.remoteUrl;
    if (state.objectUrls.has(media.id)) return state.objectUrls.get(media.id);
    const file = await getFile(media.id);
    if (!file) return "";
    const url = URL.createObjectURL(file);
    state.objectUrls.set(media.id, url);
    return url;
  }

  function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Το link αντιγράφηκε.");
    } catch {
      const input = document.createElement("input");
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
      showToast("Το link αντιγράφηκε.");
    }
  }

  function render() {
    const route = window.location.hash.replace(/^#\/?/, "");
    if (route.startsWith("p/")) {
      renderPublic(route.replace("p/", ""));
      return;
    }
    renderAdmin();
  }

  function renderAdmin() {
    const app = document.getElementById("app");
    const filtered = state.pages.filter((page) => {
      const term = state.search.trim().toLowerCase();
      if (!term) return true;
      return `${page.title} ${page.description} ${page.slug}`.toLowerCase().includes(term);
    });
    const selected = state.pages.find((page) => page.id === state.selectedId) || state.pages[0];
    state.selectedId = selected ? selected.id : "";

    app.innerHTML = `
      <div class="app-shell">
        <header class="topbar">
          <div class="brand">
            <span class="brand-mark">${icon("video")}</span>
            <span>Media Pages</span>
          </div>
          <label class="search">
            ${icon("search")}
            <input id="globalSearch" type="search" value="${escapeHtml(state.search)}" placeholder="Αναζήτηση σελίδων..." />
          </label>
          <div class="top-actions">
            <button class="primary" id="topNew">${icon("plus")} Νέα σελίδα</button>
            <button class="icon-button" id="openSettings" title="Ρυθμίσεις GitHub">${icon("settings")}</button>
            <div class="avatar">ΑΔ</div>
          </div>
        </header>
        <main class="main">
          <div class="dashboard-grid ${state.previewOpen ? "" : "preview-closed"}">
            ${renderForm()}
            ${renderPagesList(filtered)}
            ${state.previewOpen ? renderPreview(selected) : ""}
          </div>
          <button class="preview-rail-toggle ${state.previewOpen ? "open" : ""}" id="previewRailToggle" type="button" title="${state.previewOpen ? "Κλείσιμο προεπισκόπησης" : "Άνοιγμα προεπισκόπησης"}">
            ${icon(state.previewOpen ? "chevron" : "eye")}
            <span>${state.previewOpen ? "Κλείσιμο" : "Προεπισκόπηση"}</span>
          </button>
        </main>
      </div>
      ${state.settingsOpen ? renderGithubSettingsModal() : ""}
      ${state.imageEditor ? renderImageEditorModal() : ""}
      ${state.videoEditor ? renderVideoEditorModal() : ""}
    `;

    bindAdminEvents();
    hydrateThumbs();
    bindTimedVideos();
  }

  function renderForm() {
    const editing = state.pages.find((page) => page.id === state.editId);
    const draft = editing ? {
      title: editing.title,
      description: editing.description,
      slug: editing.slug,
      published: editing.published,
      logoId: state.draft.logoId || editing.logo?.id || "",
      logoSize: state.draft.logoSize || editing.logoSize || 18,
      overlayText: state.draft.overlayText || editing.overlayText || "",
      overlaySubtext: state.draft.overlaySubtext || editing.overlaySubtext || "",
    } : state.draft;
    const pairs = selectedVideoThumbnailPairs();
    const batchMode = !editing && pairs.pairs.length > 1;
    return `
      <section class="panel form-panel" id="createPanel">
        <div class="panel-header">
          <div>
            <h1 class="panel-title">${editing ? "Επεξεργασία σελίδας" : "Δημιουργία URLs"}</h1>
            <p class="panel-subtitle">${editing ? "Ενημέρωσε το βίντεο και το thumbnail της σελίδας." : "Κάθε ζευγάρι βίντεο + thumbnail γίνεται ξεχωριστή σελίδα με δικό του URL."}</p>
          </div>
        </div>
        <form class="form-body" id="pageForm">
          <div class="field">
            <label for="title">${editing ? "Τίτλος σελίδας" : "Τίτλος ή πρόθεμα"} ${editing ? '<span class="required">*</span>' : ""}</label>
            <input class="input" id="title" name="title" ${editing ? "required" : ""} value="${escapeHtml(draft.title || "")}" placeholder="${editing ? "" : "Προαιρετικό - αλλιώς θα μπει το όνομα αρχείου"}" />
          </div>
          <div class="field">
            <label for="description">Περιγραφή</label>
            <textarea id="description" name="description" maxlength="500">${escapeHtml(draft.description || "")}</textarea>
            <span class="hint">Έως 500 χαρακτήρες.</span>
          </div>
          <div class="field">
            <label for="slug">${batchMode ? "Βάση URL" : "Slug URL"} ${editing ? '<span class="required">*</span>' : ""}</label>
            <div class="slug-row">
              <span class="slug-prefix">${escapeHtml(window.location.href.split("#")[0])}#/p/</span>
              <input class="input" id="slug" name="slug" ${editing ? "required" : ""} value="${escapeHtml(draft.slug || "")}" placeholder="${batchMode ? "π.χ. viber-video" : "δημιουργείται αυτόματα"}" />
            </div>
            <span class="hint">${batchMode ? "Για πολλά αρχεία θα προστεθεί αυτόματα το όνομα κάθε αρχείου, ώστε κάθε URL να είναι μοναδικό." : "Μπορείς να το αφήσεις κενό και θα δημιουργηθεί αυτόματα."}</span>
          </div>
          <div class="field">
            <label>Βίντεο ή φωτογραφίες <span class="required">*</span></label>
            <label class="dropzone" id="dropzone">
              <input id="mediaInput" type="file" ${state.processingFiles ? "disabled" : ""} multiple />
              <span>
                <span class="empty-icon">${icon("upload")}</span>
                <p class="drop-title">Σύρε αρχεία εδώ ή <span>κάνε κλικ για επιλογή</span></p>
                <p class="drop-note">Για κάθε σελίδα ανέβασε 1 βίντεο MP4/3GP/MOV και 1 thumbnail PNG/JPG/JPEG. Τα MOV μετατρέπονται αυτόματα σε MP4 πριν ανέβουν.</p>
              </span>
            </label>
            ${state.uploadStatus ? `<div class="url-note">${escapeHtml(state.uploadStatus)}</div>` : ""}
            <div class="media-stack" id="mediaStack">
              ${renderSelectedFiles(editing)}
            </div>
            ${renderUploadErrors()}
          </div>
          <div class="switch-row">
            <div class="switch-copy">
              <strong>Ορατότητα</strong>
              <span>Η σελίδα θα είναι διαθέσιμη όταν κάποιος έχει το link.</span>
            </div>
            <label class="switch">
              <input id="published" type="checkbox" ${draft.published === false ? "" : "checked"} />
              <span></span>
            </label>
          </div>
          <button class="primary" type="submit" ${state.uploading || state.processingFiles ? "disabled" : ""}>${state.uploading ? icon("upload") + " Ανεβάζω στο GitHub..." : state.processingFiles ? icon("upload") + " Μετατρέπω αρχεία..." : editing ? icon("edit") + " Αποθήκευση" : icon("plus") + " Δημιουργία URL" + (pairs.pairs.length > 1 ? "s" : "")}</button>
          ${editing ? '<button class="ghost" type="button" id="cancelEdit">Ακύρωση επεξεργασίας</button>' : ""}
        </form>
      </section>
    `;
  }

  function renderGithubSettingsModal() {
    const settings = state.github;
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="settings-modal" role="dialog" aria-modal="true" aria-label="Ρυθμίσεις GitHub">
          <div class="settings-modal-head">
            <div>
              <h2>Ρυθμίσεις αποθήκευσης</h2>
              <p>Το GitHub repo είναι ήδη συμπληρωμένο. Χρειάζεται μόνο το token για να μπορεί ο browser να ανεβάζει αρχεία.</p>
            </div>
            <button class="icon-button" id="closeSettings" type="button" title="Κλείσιμο">${icon("x")}</button>
          </div>
          <div class="settings-status">
            <span class="status ${githubSettingsReady() ? "live" : "draft"}">${githubSettingsReady() ? "Έτοιμο για upload" : "Λείπει μόνο το token"}</span>
          </div>
          <div class="ready-settings-card">
            <strong>Έτοιμη αποθήκευση</strong>
            <span>${escapeHtml(settings.owner)}/${escapeHtml(settings.repo)} · ${escapeHtml(settings.branch)} · ${escapeHtml(settings.mediaDir)}</span>
            <span>${escapeHtml(settings.siteBaseUrl)}</span>
          </div>
          <label class="settings-wide">
            <span>GitHub token</span>
            <input class="input" id="ghToken" type="password" value="${escapeHtml(settings.token)}" placeholder="Βάλε εδώ το token" autocomplete="off" />
          </label>
          <details class="advanced-settings">
            <summary>Προχωρημένες ρυθμίσεις</summary>
          <div class="settings-grid">
            <label>
              <span>GitHub owner</span>
              <input class="input" id="ghOwner" value="${escapeHtml(settings.owner)}" placeholder="username ή organization" />
            </label>
            <label>
              <span>Repository</span>
              <input class="input" id="ghRepo" value="${escapeHtml(settings.repo)}" placeholder="όνομα repository" />
            </label>
            <label>
              <span>Branch</span>
              <input class="input" id="ghBranch" value="${escapeHtml(settings.branch)}" placeholder="main" />
            </label>
            <label>
              <span>Φάκελος αρχείων</span>
              <input class="input" id="ghMediaDir" value="${escapeHtml(settings.mediaDir)}" placeholder="media" />
            </label>
          </div>
          <label class="settings-wide">
            <span>Δημόσιο URL site</span>
            <input class="input" id="ghSiteBaseUrl" value="${escapeHtml(settings.siteBaseUrl)}" placeholder="https://username.github.io/repo/" />
          </label>
          </details>
          <p class="settings-note">Το token μένει μόνο σε αυτόν τον browser και δεν ανεβαίνει μέσα στο repo.</p>
          <div class="settings-actions">
            <button class="secondary" type="button" id="closeSettingsSecondary">Άκυρο</button>
            <button class="primary" type="button" id="saveGithubSettings">${icon("settings")} Αποθήκευση</button>
          </div>
        </section>
      </div>
    `;
  }

  function renderSelectedFiles(editing) {
    const existing = editing && !state.selectedFiles.length ? editing.files || [] : [];
    const pairState = selectedVideoThumbnailPairs();
    const pending = state.selectedFiles.map((item, index) => ({
      id: `pending-${index}`,
      name: item.name,
      type: item.type,
      size: item.size,
      kind: item.kind,
      durationSeconds: item.durationSeconds,
      playback: item.playback,
      pendingIndex: index,
    }));
    const files = pending.length ? pending : existing;
    if (!files.length) return "";
    const list = files
      .map((file) => `
        <div class="media-file">
          <div data-thumb="${escapeHtml(file.id)}" class="thumb-fallback">${icon(file.type.startsWith("video/") ? "video" : "image")}</div>
          <div>
            ${file.pendingIndex !== undefined ? `<input class="input file-rename" data-index="${file.pendingIndex}" value="${escapeHtml(file.name)}" aria-label="Μετονομασία αρχείου" />` : `<p class="file-name">${escapeHtml(file.name)}</p>`}
            <p class="file-meta">${escapeHtml(file.kind === "image" ? "thumbnail" : file.kind === "video" ? "video" : mediaKind([file]))} · ${escapeHtml(mediaMeta(file))}${escapeHtml(playbackMeta(file))}${file.pendingIndex !== undefined ? " · θα μπει σε ζευγάρι" : ""}</p>
          </div>
          <div class="media-file-actions">
            ${file.pendingIndex !== undefined && file.kind === "image" ? `<button class="icon-button edit-thumbnail" type="button" data-index="${file.pendingIndex}" title="Επεξεργασία thumbnail">${icon("edit")}</button>` : ""}
            ${file.pendingIndex !== undefined && file.kind === "video" ? `<button class="icon-button edit-video" type="button" data-index="${file.pendingIndex}" title="Χρόνος βίντεο">${icon("edit")}</button>` : ""}
            ${file.pendingIndex === undefined && file.type.startsWith("video/") ? `<button class="icon-button edit-existing-video" type="button" data-id="${escapeHtml(file.id)}" title="Χρόνος βίντεο">${icon("edit")}</button>` : ""}
            ${file.pendingIndex !== undefined ? `<button class="icon-button remove-pending" type="button" data-index="${file.pendingIndex}" title="Αφαίρεση">${icon("x")}</button>` : ""}
          </div>
        </div>
      `)
      .join("");
    const pendingNote = state.selectedFiles.length && !editing
      ? `<div class="url-note">${pairState.videos.length} βίντεο + ${pairState.thumbnails.length} thumbnails: θα δημιουργηθούν ${pairState.pairs.length} σελίδες. ${pairState.missingThumbnails ? `Λείπουν ${pairState.missingThumbnails} thumbnails.` : ""} ${pairState.missingVideos ? `Λείπουν ${pairState.missingVideos} βίντεο.` : ""}</div>`
      : "";
    return pendingNote + list;
  }

  function renderImageEditorModal() {
    const item = state.selectedFiles[state.imageEditor.index];
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="image-editor-modal" role="dialog" aria-modal="true" aria-label="Επεξεργασία thumbnail">
          <div class="settings-modal-head">
            <div>
              <h2>Επεξεργασία thumbnail</h2>
              <p>${escapeHtml(item ? item.name : "")}</p>
            </div>
            <button class="icon-button" id="closeImageEditor" type="button" title="Κλείσιμο">${icon("x")}</button>
          </div>
          <div class="editor-layout">
            <div class="editor-canvas-wrap">
              <canvas id="thumbnailCanvas" width="1280" height="720"></canvas>
              ${state.imageEditor.aspect === "free" ? '<div class="crop-frame" id="cropFrame"></div>' : ""}
            </div>
            <div class="editor-controls">
              <label>
                <span>Μέγεθος</span>
                <select class="input" id="editAspect">
                  ${[
                    ["16:9", "16:9"],
                    ["9:16", "9:16"],
                    ["4:3", "4:3"],
                    ["3:4", "3:4"],
                    ["3:3", "3:3"],
                    ["1:1", "1:1"],
                    ["2:3", "2:3"],
                    ["3:2", "3:2"],
                    ["4:5", "4:5"],
                    ["5:4", "5:4"],
                    ["21:9", "21:9"],
                    ["9:21", "9:21"],
                    ["free", "Ελεύθερο με περίγραμμα"],
                  ].map(([value, label]) => `<option value="${value}" ${state.imageEditor.aspect === value ? "selected" : ""}>${label}</option>`).join("")}
                </select>
              </label>
              <label>
                <span>Crop zoom</span>
                <input id="editZoom" type="range" min="1" max="3" step="0.01" value="${state.imageEditor.zoom}" />
              </label>
              <label>
                <span>Μετακίνηση οριζόντια</span>
                <input id="editOffsetX" type="range" min="-50" max="50" step="1" value="${state.imageEditor.offsetX}" />
              </label>
              <label>
                <span>Μετακίνηση κάθετα</span>
                <input id="editOffsetY" type="range" min="-50" max="50" step="1" value="${state.imageEditor.offsetY}" />
              </label>
              ${renderLogoOverlayControls("imageEdit", state.imageEditor.logoId, state.imageEditor.logoSize, state.imageEditor.overlayText, state.imageEditor.overlaySubtext)}
            </div>
          </div>
          <div class="settings-actions">
            <button class="secondary" type="button" id="resetImageEditor">Επαναφορά</button>
            <button class="primary" type="button" id="saveImageEditor">${icon("edit")} Αποθήκευση thumbnail</button>
          </div>
        </section>
      </div>
    `;
  }

  function renderVideoEditorModal() {
    const editor = state.videoEditor;
    const duration = Number(editor.durationSeconds || 0);
    const maxStart = Math.max(0, duration - 0.1);
    const segment = Math.max(0.1, duration - editor.startSeconds);
    const loops = editor.displaySeconds > segment + 0.05;
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="video-editor-modal" role="dialog" aria-modal="true" aria-label="Χρόνος βίντεο">
          <div class="settings-modal-head">
            <div>
              <h2>Χρόνος βίντεο</h2>
              <p>${escapeHtml(editor.name)} · ακριβής διάρκεια ${formatSeconds(duration)}</p>
            </div>
            <button class="icon-button" id="closeVideoEditor" type="button" title="Κλείσιμο">${icon("x")}</button>
          </div>
          <div class="video-editor-layout">
            <div class="video-editor-media">
              <video class="video-editor-preview" src="${escapeHtml(editor.sourceUrl)}" controls playsinline></video>
              ${renderEditableTextOverlay(editor)}
              ${logoSrc(editor.logo) ? `<img class="video-logo-overlay" style="--logo-size:${escapeHtml(logoSizePercent(editor))}%;" src="${escapeHtml(logoSrc(editor.logo))}" alt="${escapeHtml(editor.logo.name)}" />` : ""}
            </div>
            <div class="editor-controls">
              <label>
                <span>Έναρξη στο sec</span>
                <input id="videoStartRange" type="range" min="0" max="${escapeHtml(maxStart)}" step="0.01" value="${escapeHtml(editor.startSeconds)}" />
                <input class="input" id="videoStartInput" type="number" min="0" max="${escapeHtml(maxStart)}" step="0.01" value="${escapeHtml(editor.startSeconds)}" />
              </label>
              <label>
                <span>Χρόνος προβολής σε sec</span>
                <input id="videoDurationRange" type="range" min="0.1" max="${MAX_VIDEO_SECONDS}" step="0.01" value="${escapeHtml(editor.displaySeconds)}" />
                <input class="input" id="videoDurationInput" type="number" min="0.1" max="${MAX_VIDEO_SECONDS}" step="0.01" value="${escapeHtml(editor.displaySeconds)}" />
              </label>
              <div class="url-note">
                Θα παίξει ${formatSeconds(editor.displaySeconds)} από το ${formatSeconds(editor.startSeconds)}.
                ${loops ? "Επειδή ο χρόνος είναι μεγαλύτερος από το διαθέσιμο κομμάτι, θα κάνει loop." : "Αν μικρύνεις τον χρόνο, θα σταματά εκεί."}
              </div>
              ${renderLogoOverlayControls("videoEdit", editor.logo?.id || "", editor.logoSize, editor.overlayText, editor.overlaySubtext)}
            </div>
          </div>
          <div class="settings-actions">
            <button class="secondary" type="button" id="resetVideoEditor">Επαναφορά</button>
            <button class="primary" type="button" id="saveVideoEditor">${icon("edit")} Αποθήκευση χρόνου</button>
          </div>
        </section>
      </div>
    `;
  }

  function renderUploadErrors() {
    if (!state.uploadErrors.length) return "";
    return `
      <div class="validation-list">
        ${state.uploadErrors.map((error) => `<div class="validation-error">${escapeHtml(error)}</div>`).join("")}
      </div>
    `;
  }

  function renderPagesList(pages) {
    const cards = pages.map((page) => {
      const videoUrl = directMediaUrl(pageVideo(page));
      const thumbnailUrl = directMediaUrl(pageThumbnail(page));
      const publicUrl = pageUrl(page.slug);
      const isExpanded = state.expandedRows.has(page.id);
      return `
        <article class="page-card ${isExpanded ? "expanded" : "collapsed"}" data-row="${escapeHtml(page.id)}">
          <div class="page-card-media" data-thumb="${escapeHtml((pageThumbnail(page) || {}).id || "")}">
            ${icon("image")}
          </div>
          <div class="page-card-main">
            <div class="page-card-head">
              <div>
                <h3>${escapeHtml(page.title)}</h3>
                <p>${escapeHtml(pageFileSummary(page))}</p>
              </div>
              <div class="page-card-meta">
                <span class="status ${page.published ? "live" : "draft"}">${page.published ? "Δημοσιευμένη" : "Πρόχειρο"}</span>
                <span class="type-chip">${icon("video")} ${mediaKind(page.files)}</span>
                <button class="secondary compact-toggle toggle-page-details" type="button" data-id="${escapeHtml(page.id)}" aria-expanded="${isExpanded ? "true" : "false"}">
                  ${icon("chevron")} ${isExpanded ? "Σύμπτυξη" : "Άνοιγμα"}
                </button>
              </div>
            </div>
            <div class="page-card-details" ${isExpanded ? "" : "hidden"}>
              <div class="media-url-list">
              <div class="media-url-row">
                <span>Σελίδα</span>
                <code>${escapeHtml(publicUrl)}</code>
                <button class="mini-copy copy-direct-url" type="button" data-url="${escapeHtml(publicUrl)}" title="Αντιγραφή URL σελίδας">${icon("copy")} Copy</button>
              </div>
              <div class="media-url-row">
                <span>Βίντεο</span>
                <code>${escapeHtml(videoUrl || "Δεν υπάρχει βίντεο")}</code>
                <button class="mini-copy copy-direct-url" type="button" data-url="${escapeHtml(videoUrl)}" ${videoUrl ? "" : "disabled"} title="Αντιγραφή URL βίντεο">${icon("copy")} Copy</button>
              </div>
              <div class="media-url-row">
                <span>Thumbnail</span>
                <code>${escapeHtml(thumbnailUrl || "Δεν υπάρχει thumbnail")}</code>
                <button class="mini-copy copy-direct-url" type="button" data-url="${escapeHtml(thumbnailUrl)}" ${thumbnailUrl ? "" : "disabled"} title="Αντιγραφή URL thumbnail">${icon("copy")} Copy</button>
              </div>
              </div>
              <div class="page-card-actions">
                <a class="secondary page-action-link" href="${escapeHtml(publicUrl)}" target="_blank" rel="noopener">${icon("eye")} Προβολή</a>
                <button class="secondary edit-page" data-id="${escapeHtml(page.id)}" type="button">${icon("edit")} Επεξεργασία</button>
                <button class="icon-button delete-page" data-id="${escapeHtml(page.id)}" type="button" title="Διαγραφή">${icon("trash")}</button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join("");

    return `
      <section class="panel pages-list">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Οι σελίδες μου (${state.pages.length})</h2>
          </div>
          <div class="table-tools">
            <label class="search mini-search">
              ${icon("search")}
              <input id="tableSearch" type="search" value="${escapeHtml(state.search)}" placeholder="Αναζήτηση σελίδων..." />
            </label>
          </div>
        </div>
        ${cards ? `
          <div class="pages-card-list">
            ${cards}
          </div>
          <div class="table-footer">
            <div class="pagination">
              <button class="page-dot active">1</button>
              <button class="page-dot">2</button>
              <button class="page-dot">3</button>
            </div>
            <span class="hint">1-${pages.length} από ${state.pages.length}</span>
          </div>
        ` : `
          <div class="empty-state">
            <span class="empty-icon">${icon("folder")}</span>
            <h2>Δεν βρέθηκαν σελίδες</h2>
            <p>Δημιούργησε μια νέα σελίδα ανεβάζοντας φωτογραφίες ή βίντεο και θα εμφανιστεί εδώ.</p>
            <button class="primary" id="emptyNew">${icon("plus")} Νέα σελίδα</button>
          </div>
        `}
      </section>
    `;
  }

  function renderPreview(page) {
    const url = page ? pageUrl(page.slug) : "";
    const video = page ? pageVideo(page) : null;
    const thumbnail = page ? pageThumbnail(page) : null;
    const previewMedia = video || thumbnail;
    const videoUrl = directMediaUrl(video);
    const thumbnailUrl = directMediaUrl(thumbnail);
    const logo = page?.logo;
    const logoUrl = logoSrc(logo);
    const overlay = page ? renderTextOverlay(page) : "";
    return `
      <section class="panel preview-panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Προεπισκόπηση δημόσιας σελίδας</h2>
          </div>
          <div class="row-actions">
            <button class="icon-button" id="closePreview" type="button" title="Κλείσιμο προεπισκόπησης">${icon("chevron")}</button>
            ${page ? `<button class="icon-button view-page" data-slug="${escapeHtml(page.slug)}" title="Άνοιγμα">${icon("external")}</button>` : ""}
          </div>
        </div>
        <div class="preview-card">
          ${page ? `
            <div class="direct-url-panel">
              ${renderCopyUrlField("URL σελίδας", url)}
              ${renderCopyUrlField("URL βίντεο", videoUrl, "Δεν υπάρχει βίντεο")}
              ${renderCopyUrlField("URL φωτογραφίας", thumbnailUrl, "Δεν υπάρχει φωτογραφία")}
            </div>
            <article class="public-preview">
              <div class="preview-content">
                <h3 class="preview-title">${escapeHtml(page.title)}</h3>
              </div>
              <div class="preview-media" data-preview-video="${escapeHtml(previewMedia ? previewMedia.id : "")}" data-preview-poster="${escapeHtml(thumbnail ? thumbnail.id : "")}">
                ${overlay}
                ${video ? `<span class="play-overlay">${icon("play")}</span>` : ""}
                ${logoUrl ? `<img class="video-logo-overlay" style="--logo-size:${escapeHtml(logoSizePercent(page))}%;" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(logo.name)}" />` : ""}
              </div>
              <div class="preview-content">
                <p class="preview-description">${escapeHtml(page.description || "Χωρίς περιγραφή.")}</p>
              </div>
              ${thumbnail ? `<div class="preview-gallery"><div data-gallery-media="${escapeHtml(thumbnail.id)}" data-gallery-type="${escapeHtml(thumbnail.type)}" class="thumb-fallback">${icon("image")}</div></div>` : ""}
            </article>
            <button class="secondary view-page" data-slug="${escapeHtml(page.slug)}" style="width:100%; margin-top:14px;">Προβολή σε νέα καρτέλα ${icon("external")}</button>
          ` : `
            <div class="empty-state">
              <span class="empty-icon">${icon("image")}</span>
              <h2>Δεν υπάρχει προεπισκόπηση</h2>
              <p>Μόλις δημιουργήσεις μια σελίδα, θα δεις εδώ πώς θα φαίνεται δημόσια.</p>
            </div>
          `}
        </div>
      </section>
    `;
  }

  function bindAdminEvents() {
    const globalSearch = document.getElementById("globalSearch");
    const tableSearch = document.getElementById("tableSearch");
    [globalSearch, tableSearch].forEach((input) => {
      if (!input) return;
      input.addEventListener("input", (event) => {
        state.search = event.target.value;
        renderAdmin();
      });
    });

    document.getElementById("topNew")?.addEventListener("click", () => {
      clearFormState();
      document.getElementById("createPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    document.getElementById("emptyNew")?.addEventListener("click", () => {
      clearFormState();
      renderAdmin();
    });
    document.getElementById("cancelEdit")?.addEventListener("click", () => {
      clearFormState();
      renderAdmin();
    });
    document.getElementById("openSettings")?.addEventListener("click", () => {
      state.settingsOpen = true;
      renderAdmin();
    });
    document.getElementById("closeSettings")?.addEventListener("click", closeSettings);
    document.getElementById("closeSettingsSecondary")?.addEventListener("click", closeSettings);
    document.getElementById("previewRailToggle")?.addEventListener("click", togglePreview);
    document.getElementById("closePreview")?.addEventListener("click", togglePreview);
    document.getElementById("closeImageEditor")?.addEventListener("click", closeImageEditor);
    document.getElementById("resetImageEditor")?.addEventListener("click", resetImageEditor);
    document.getElementById("saveImageEditor")?.addEventListener("click", saveEditedThumbnail);
    document.getElementById("closeVideoEditor")?.addEventListener("click", closeVideoEditor);
    document.getElementById("resetVideoEditor")?.addEventListener("click", resetVideoEditor);
    document.getElementById("saveVideoEditor")?.addEventListener("click", saveVideoEditor);

    const title = document.getElementById("title");
    const description = document.getElementById("description");
    const slug = document.getElementById("slug");
    title?.addEventListener("input", () => {
      if (!state.editId) {
        state.draft.title = title.value;
        if (!state.draft.slugTouched) {
          state.draft.slug = slugify(title.value);
          if (slug) slug.value = state.draft.slug;
        }
      } else if (!slug.dataset.touched) {
        slug.value = slugify(title.value);
      }
    });
    description?.addEventListener("input", () => {
      if (!state.editId) state.draft.description = description.value;
    });
    slug?.addEventListener("input", () => {
      slug.value = slugify(slug.value);
      if (!state.editId) {
        state.draft.slugTouched = true;
        state.draft.slug = slug.value;
      } else {
        slug.dataset.touched = "true";
      }
    });
    document.getElementById("published")?.addEventListener("change", (event) => {
      if (!state.editId) state.draft.published = event.target.checked;
    });

    bindDropzone();
    bindActions();
    bindGithubSettings();

    document.getElementById("pageForm")?.addEventListener("submit", handleSubmit);
    document.querySelectorAll(".remove-pending").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedFiles.splice(Number(button.dataset.index), 1);
        renderAdmin();
      });
    });
    document.querySelectorAll(".edit-thumbnail").forEach((button) => {
      button.addEventListener("click", () => openImageEditor(Number(button.dataset.index)));
    });
    document.querySelectorAll(".edit-video").forEach((button) => {
      button.addEventListener("click", () => openPendingVideoEditor(Number(button.dataset.index)));
    });
    document.querySelectorAll(".edit-existing-video").forEach((button) => {
      button.addEventListener("click", () => openExistingVideoEditor(button.dataset.id));
    });
    document.querySelectorAll(".toggle-page-details").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        togglePageDetails(button.dataset.id);
      });
    });
    document.querySelectorAll(".file-rename").forEach((input) => {
      input.addEventListener("input", () => {
        const item = state.selectedFiles[Number(input.dataset.index)];
        if (item) item.name = input.value.trim() || item.file.name;
      });
    });

    document.querySelectorAll("[data-row]").forEach((row) => {
      row.addEventListener("click", (event) => {
        if (event.target.closest("button, a")) return;
        state.selectedId = row.dataset.row;
        renderAdmin();
      });
    });
    bindImageEditorControls();
    drawImageEditorCanvas();
    bindVideoEditorControls();
  }

  function togglePageDetails(id) {
    if (!id) return;
    if (state.expandedRows.has(id)) state.expandedRows.delete(id);
    else state.expandedRows.add(id);
    saveExpandedRows();
    renderAdmin();
  }

  function togglePreview() {
    state.previewOpen = !state.previewOpen;
    localStorage.setItem("media-pages:preview-open", String(state.previewOpen));
    renderAdmin();
  }

  function closeSettings() {
    state.settingsOpen = false;
    renderAdmin();
  }

  async function saveLogoFile(file) {
    if (!file) return;
    const extension = fileExtension(file);
    if (!IMAGE_EXTENSIONS.has(extension)) {
      showToast("Το λογότυπο πρέπει να είναι png, jpg ή jpeg.");
      return null;
    }
    const dataUrl = await fileToDataUrl(file);
    const logo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: fileTitle(file.name),
      dataUrl,
    };
    state.logos = [logo, ...state.logos];
    saveLogos();
    showToast("Το λογότυπο αποθηκεύτηκε.");
    return logo;
  }

  async function addLogoFromInput(event, onLogo) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    const logo = await saveLogoFile(file);
    if (logo && onLogo) onLogo(logo);
  }

  function openImageEditor(index) {
    const item = state.selectedFiles[index];
    if (!item || item.kind !== "image") return;
    state.imageEditor = {
      index,
      previewUrl: URL.createObjectURL(item.file),
      aspect: "16:9",
      zoom: 1,
      offsetX: 0,
      offsetY: 0,
      logoId: state.draft.logoId || "",
      logoSize: state.draft.logoSize || 18,
      overlayText: state.draft.overlayText || "",
      overlaySubtext: state.draft.overlaySubtext || "",
    };
    renderAdmin();
  }

  function closeImageEditor() {
    if (state.imageEditor?.previewUrl) URL.revokeObjectURL(state.imageEditor.previewUrl);
    state.imageEditor = null;
    renderAdmin();
  }

  function videoEditorFromMedia(media, source, extra = {}) {
    const playback = videoPlayback(media);
    return {
      ...extra,
      source,
      name: media.name,
      durationSeconds: Number(media.durationSeconds || 0),
      startSeconds: Number(playback.startSeconds.toFixed(2)),
      displaySeconds: Number(playback.durationSeconds.toFixed(2)),
      originalStartSeconds: 0,
      originalDisplaySeconds: Number((media.durationSeconds || MAX_VIDEO_SECONDS).toFixed(2)),
    };
  }

  function openPendingVideoEditor(index) {
    const item = state.selectedFiles[index];
    if (!item || item.kind !== "video") return;
    const sourceUrl = URL.createObjectURL(item.file);
    state.videoEditor = {
      ...videoEditorFromMedia(item, "pending", { index, sourceUrl }),
      logo: logoById(state.draft.logoId),
      logoSize: state.draft.logoSize || 18,
      overlayText: state.draft.overlayText || "",
      overlaySubtext: state.draft.overlaySubtext || "",
      originalStartSeconds: 0,
      originalDisplaySeconds: Number((item.durationSeconds || MAX_VIDEO_SECONDS).toFixed(2)),
    };
    renderAdmin();
  }

  async function openExistingVideoEditor(fileId) {
    const page = state.pages.find((item) => item.files.some((file) => file.id === fileId));
    const media = page?.files.find((file) => file.id === fileId);
    if (!page || !media || !media.type.startsWith("video/")) return;
    const sourceUrl = await mediaSrc(media);
    state.videoEditor = {
      ...videoEditorFromMedia(media, "existing", { pageId: page.id, fileId, sourceUrl }),
      logo: page.logo || null,
      logoSize: page.logoSize || 18,
      overlayText: page.overlayText || "",
      overlaySubtext: page.overlaySubtext || "",
      originalStartSeconds: 0,
      originalDisplaySeconds: Number((media.durationSeconds || MAX_VIDEO_SECONDS).toFixed(2)),
    };
    renderAdmin();
  }

  function closeVideoEditor() {
    if (state.videoEditor?.source === "pending" && state.videoEditor.sourceUrl) {
      URL.revokeObjectURL(state.videoEditor.sourceUrl);
    }
    state.videoEditor = null;
    renderAdmin();
  }

  function resetVideoEditor() {
    if (!state.videoEditor) return;
    state.videoEditor.startSeconds = 0;
    state.videoEditor.displaySeconds = Number((state.videoEditor.durationSeconds || MAX_VIDEO_SECONDS).toFixed(2));
    renderAdmin();
  }

  function resetImageEditor() {
    if (!state.imageEditor) return;
    state.imageEditor.zoom = 1;
    state.imageEditor.offsetX = 0;
    state.imageEditor.offsetY = 0;
    state.imageEditor.aspect = "16:9";
    state.imageEditor.logoId = state.draft.logoId || "";
    state.imageEditor.logoSize = state.draft.logoSize || 18;
    state.imageEditor.overlayText = state.draft.overlayText || "";
    state.imageEditor.overlaySubtext = state.draft.overlaySubtext || "";
    renderAdmin();
  }

  function bindImageEditorControls() {
    if (!state.imageEditor) return;
    const controls = [
      ["editAspect", "aspect", String],
      ["editZoom", "zoom", Number],
      ["editOffsetX", "offsetX", Number],
      ["editOffsetY", "offsetY", Number],
      ["imageEditOverlayText", "overlayText", String],
      ["imageEditOverlaySubtext", "overlaySubtext", String],
      ["imageEditLogoId", "logoId", String],
      ["imageEditLogoSize", "logoSize", Number],
      ["imageEditLogoSizeNumber", "logoSize", Number],
    ];
    controls.forEach(([id, key, cast]) => {
      const input = document.getElementById(id);
      input?.addEventListener("input", () => {
        state.imageEditor[key] = cast(input.value);
        if (key === "logoSize") {
          const range = document.getElementById("imageEditLogoSize");
          const number = document.getElementById("imageEditLogoSizeNumber");
          const value = String(clampNumber(input.value, 8, 35));
          if (range) range.value = value;
          if (number) number.value = value;
          state.imageEditor.logoSize = Number(value);
        }
        if (key === "aspect") renderAdmin();
        else drawImageEditorCanvas();
      });
    });
    document.getElementById("imageEditLogoInput")?.addEventListener("change", (event) => {
      addLogoFromInput(event, (logo) => {
        state.imageEditor.logoId = logo.id;
        renderAdmin();
      });
    });
    bindCropFrameDrag();
  }

  function bindVideoEditorControls() {
    const editor = state.videoEditor;
    if (!editor) return;
    const preview = document.querySelector(".video-editor-preview");
    const startRange = document.getElementById("videoStartRange");
    const startInput = document.getElementById("videoStartInput");
    const durationRange = document.getElementById("videoDurationRange");
    const durationInput = document.getElementById("videoDurationInput");
    const logoSelect = document.getElementById("videoEditLogoId");
    const logoSizeRange = document.getElementById("videoEditLogoSize");
    const logoSizeNumber = document.getElementById("videoEditLogoSizeNumber");
    const overlayText = document.getElementById("videoEditOverlayText");
    const overlaySubtext = document.getElementById("videoEditOverlaySubtext");
    const sync = (key, value) => {
      if (key === "startSeconds") {
        const maxStart = Math.max(0, Number(editor.durationSeconds || 0) - 0.1);
        editor.startSeconds = Number(clampNumber(value, 0, maxStart).toFixed(2));
        if (startRange) startRange.value = String(editor.startSeconds);
        if (startInput) startInput.value = String(editor.startSeconds);
        if (preview) preview.currentTime = editor.startSeconds;
      } else {
        editor.displaySeconds = Number(clampNumber(value, 0.1, MAX_VIDEO_SECONDS).toFixed(2));
        if (durationRange) durationRange.value = String(editor.displaySeconds);
        if (durationInput) durationInput.value = String(editor.displaySeconds);
      }
    };
    startRange?.addEventListener("input", () => sync("startSeconds", startRange.value));
    startInput?.addEventListener("input", () => sync("startSeconds", startInput.value));
    durationRange?.addEventListener("input", () => sync("displaySeconds", durationRange.value));
    durationInput?.addEventListener("input", () => sync("displaySeconds", durationInput.value));
    const rerenderVideoEditor = () => renderAdmin();
    logoSelect?.addEventListener("input", () => {
      editor.logo = logoById(logoSelect.value);
      rerenderVideoEditor();
    });
    const syncLogoSize = (value) => {
      editor.logoSize = clampNumber(value, 8, 35);
      if (logoSizeRange) logoSizeRange.value = String(editor.logoSize);
      if (logoSizeNumber) logoSizeNumber.value = String(editor.logoSize);
      const logo = document.querySelector(".video-editor-media .video-logo-overlay");
      if (logo) logo.style.setProperty("--logo-size", `${editor.logoSize}%`);
    };
    logoSizeRange?.addEventListener("input", () => syncLogoSize(logoSizeRange.value));
    logoSizeNumber?.addEventListener("input", () => syncLogoSize(logoSizeNumber.value));
    const syncVideoTextOverlay = () => {
      const layer = document.querySelector(".video-editor-media .editor-live-text-overlay");
      if (!layer) return;
      const strong = layer.querySelector("strong");
      const small = layer.querySelector("span");
      if (strong) strong.textContent = editor.overlayText || "";
      if (small) small.textContent = editor.overlaySubtext || "";
      layer.hidden = !String(editor.overlayText || "").trim() && !String(editor.overlaySubtext || "").trim();
    };
    overlayText?.addEventListener("input", () => {
      editor.overlayText = overlayText.value;
      syncVideoTextOverlay();
    });
    overlaySubtext?.addEventListener("input", () => {
      editor.overlaySubtext = overlaySubtext.value;
      syncVideoTextOverlay();
    });
    document.getElementById("videoEditLogoInput")?.addEventListener("change", (event) => {
      addLogoFromInput(event, (logo) => {
        editor.logo = logo;
        rerenderVideoEditor();
      });
    });
    preview?.addEventListener("loadedmetadata", () => {
      preview.currentTime = editor.startSeconds;
    });
  }

  async function saveVideoEditor() {
    const editor = state.videoEditor;
    if (!editor) return;
    const playback = {
      startSeconds: Number(clampNumber(editor.startSeconds, 0, Math.max(0, editor.durationSeconds - 0.1)).toFixed(2)),
      durationSeconds: Number(clampNumber(editor.displaySeconds, 0.1, MAX_VIDEO_SECONDS).toFixed(2)),
    };

    if (editor.source === "pending") {
      const item = state.selectedFiles[editor.index];
      if (item) item.playback = playback;
      state.draft.logoId = editor.logo?.id || "";
      state.draft.logoSize = editor.logoSize || 18;
      state.draft.overlayText = editor.overlayText || "";
      state.draft.overlaySubtext = editor.overlaySubtext || "";
      closeVideoEditor();
      showToast("Το βίντεο και η επικάλυψη ενημερώθηκαν.");
      return;
    }

    state.pages = state.pages.map((page) => {
      if (page.id !== editor.pageId) return page;
      return {
        ...page,
        files: page.files.map((file) => (file.id === editor.fileId ? { ...file, playback } : file)),
        logo: editor.logo || null,
        logoSize: editor.logoSize || 18,
        overlayText: editor.overlayText || "",
        overlaySubtext: editor.overlaySubtext || "",
        updatedAt: new Date().toISOString(),
      };
    });
    savePages();
    if (githubSettingsReady()) {
      try {
        await syncPagesToGithub();
      } catch (error) {
        showToast(`Δεν ανέβηκε ο χρόνος στο GitHub: ${error.message}`);
        return;
      }
    }
    closeVideoEditor();
    showToast("Ο χρόνος του βίντεο αποθηκεύτηκε.");
  }

  function drawImageEditorCanvas() {
    const editor = state.imageEditor;
    const canvas = document.getElementById("thumbnailCanvas");
    if (!editor || !canvas) return;
    renderEditedThumbnail(canvas).catch(() => {
      showToast("Δεν μπόρεσα να φορτώσω την εικόνα για επεξεργασία.");
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      if (/^https?:/.test(src)) image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  async function renderEditedThumbnail(canvas) {
    const editor = state.imageEditor;
    if (!editor || !canvas) return;
    const ctx = canvas.getContext("2d");
    const [ratioW, ratioH] = aspectSize(editor.aspect);
    canvas.width = ratioW;
    canvas.height = ratioH;
    canvas.style.aspectRatio = `${ratioW} / ${ratioH}`;

    const image = await loadImage(editor.previewUrl);
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#111820";
    ctx.fillRect(0, 0, width, height);

    const scale = Math.max(width / image.width, height / image.height) * editor.zoom;
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const x = (width - drawWidth) / 2 + (editor.offsetX / 100) * width;
    const y = (height - drawHeight) / 2 + (editor.offsetY / 100) * height;
    ctx.drawImage(image, x, y, drawWidth, drawHeight);

    await drawBrandOverlay(ctx, width, height, {
      logo: logoById(editor.logoId),
      logoSize: editor.logoSize,
      overlayText: editor.overlayText,
      overlaySubtext: editor.overlaySubtext,
    });
  }

  function aspectSize(aspect) {
    const map = {
      "16:9": [1280, 720],
      "9:16": [720, 1280],
      "4:3": [1200, 900],
      "3:4": [900, 1200],
      "3:3": [1000, 1000],
      "1:1": [1000, 1000],
      "2:3": [800, 1200],
      "3:2": [1200, 800],
      "4:5": [960, 1200],
      "5:4": [1200, 960],
      "21:9": [1680, 720],
      "9:21": [720, 1680],
      free: [1280, 720],
    };
    return map[aspect] || map["16:9"];
  }

  function bindCropFrameDrag() {
    const frame = document.getElementById("cropFrame");
    const wrap = frame?.parentElement;
    if (!frame || !wrap) return;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;
    frame.addEventListener("pointerdown", (event) => {
      if (event.target !== frame) return;
      event.preventDefault();
      frame.setPointerCapture(event.pointerId);
      const frameRect = frame.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      startX = event.clientX;
      startY = event.clientY;
      startLeft = frameRect.left - wrapRect.left;
      startTop = frameRect.top - wrapRect.top;
    });
    frame.addEventListener("pointermove", (event) => {
      if (!frame.hasPointerCapture(event.pointerId)) return;
      const wrapRect = wrap.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      const nextLeft = Math.max(0, Math.min(wrapRect.width - frameRect.width, startLeft + event.clientX - startX));
      const nextTop = Math.max(0, Math.min(wrapRect.height - frameRect.height, startTop + event.clientY - startY));
      frame.style.left = `${nextLeft}px`;
      frame.style.top = `${nextTop}px`;
    });
  }

  async function saveEditedThumbnail() {
    const editor = state.imageEditor;
    const canvas = document.getElementById("thumbnailCanvas");
    const original = editor ? state.selectedFiles[editor.index] : null;
    if (!editor || !canvas || !original) return;
    await renderEditedThumbnail(canvas);
    const outputCanvas = editor.aspect === "free" ? cropCanvasToFrame(canvas) : canvas;
    const blob = await new Promise((resolve) => outputCanvas.toBlob(resolve, "image/png", 0.92));
    if (!blob) {
      showToast("Δεν μπόρεσα να αποθηκεύσω το thumbnail.");
      return;
    }
    const name = `${fileTitle(original.name)}-edited.png`;
    const file = new File([blob], name, { type: "image/png" });
    state.selectedFiles[editor.index] = {
      file,
      name,
      type: "image/png",
      size: file.size,
      kind: "image",
    };
    state.draft.logoId = editor.logoId || "";
    state.draft.logoSize = editor.logoSize || 18;
    state.draft.overlayText = editor.overlayText || "";
    state.draft.overlaySubtext = editor.overlaySubtext || "";
    closeImageEditor();
    showToast("Το thumbnail ενημερώθηκε.");
  }

  function cropCanvasToFrame(canvas) {
    const frame = document.getElementById("cropFrame");
    if (!frame) return canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;
    const sx = Math.max(0, (frameRect.left - canvasRect.left) * scaleX);
    const sy = Math.max(0, (frameRect.top - canvasRect.top) * scaleY);
    const sw = Math.min(canvas.width - sx, frameRect.width * scaleX);
    const sh = Math.min(canvas.height - sy, frameRect.height * scaleY);
    const output = document.createElement("canvas");
    output.width = Math.max(1, Math.round(sw));
    output.height = Math.max(1, Math.round(sh));
    output.getContext("2d").drawImage(canvas, sx, sy, sw, sh, 0, 0, output.width, output.height);
    return output;
  }

  function bindGithubSettings() {
    document.getElementById("saveGithubSettings")?.addEventListener("click", () => {
      saveGithubSettings({
        owner: document.getElementById("ghOwner")?.value || DEFAULT_GITHUB_SETTINGS.owner,
        repo: document.getElementById("ghRepo")?.value || DEFAULT_GITHUB_SETTINGS.repo,
        branch: document.getElementById("ghBranch")?.value || DEFAULT_GITHUB_SETTINGS.branch,
        mediaDir: document.getElementById("ghMediaDir")?.value || DEFAULT_GITHUB_SETTINGS.mediaDir,
        siteBaseUrl: document.getElementById("ghSiteBaseUrl")?.value || DEFAULT_GITHUB_SETTINGS.siteBaseUrl,
        token: document.getElementById("ghToken")?.value || "",
      });
      state.settingsOpen = false;
      renderAdmin();
      showToast("Οι ρυθμίσεις αποθήκευσης αποθηκεύτηκαν.");
    });
  }

  function bindActions() {
    document.querySelectorAll(".copy-url").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        copyText(pageUrl(button.dataset.slug));
      });
    });
    document.querySelectorAll(".copy-direct-url").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        if (button.dataset.url) copyText(button.dataset.url);
      });
    });
    document.querySelectorAll(".view-page").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        window.open(pageUrl(button.dataset.slug), "_blank");
      });
    });
    document.querySelectorAll(".edit-page").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const page = state.pages.find((item) => item.id === button.dataset.id);
        state.editId = button.dataset.id;
        state.selectedFiles = [];
        state.uploadErrors = [];
        state.draft.logoId = page?.logo?.id || "";
        state.draft.logoSize = page?.logoSize || 18;
        state.draft.overlayText = page?.overlayText || "";
        state.draft.overlaySubtext = page?.overlaySubtext || "";
        renderAdmin();
        document.getElementById("createPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    document.querySelectorAll(".delete-page").forEach((button) => {
      button.addEventListener("click", async (event) => {
        event.stopPropagation();
        const page = state.pages.find((item) => item.id === button.dataset.id);
        if (!page) return;
        const ok = window.confirm(`Να διαγραφεί η σελίδα "${page.title}";`);
        if (!ok) return;
        for (const file of page.files) {
          if (!file.remoteUrl) await deleteFile(file.id);
        }
        state.pages = state.pages.filter((item) => item.id !== page.id);
        state.expandedRows.delete(page.id);
        saveExpandedRows();
        if (state.selectedId === page.id) state.selectedId = state.pages[0]?.id || "";
        if (state.editId === page.id) clearFormState();
        savePages();
        if (githubSettingsReady()) {
          try {
            await syncPagesToGithub();
          } catch (error) {
            showToast(`Η τοπική λίστα ενημερώθηκε, αλλά το GitHub index όχι: ${error.message}`);
          }
        }
        renderAdmin();
        showToast("Η σελίδα διαγράφηκε.");
      });
    });
  }

  function bindDropzone() {
    const dropzone = document.getElementById("dropzone");
    const input = document.getElementById("mediaInput");
    if (!dropzone || !input) return;

    input.addEventListener("change", () => {
      addPendingFiles(input.files);
      input.value = "";
    });
    ["dragenter", "dragover"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.add("dragover");
      });
    });
    ["dragleave", "drop"].forEach((eventName) => {
      dropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.remove("dragover");
      });
    });
    dropzone.addEventListener("drop", (event) => addPendingFiles(event.dataTransfer.files));
  }

  async function addPendingFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    if (state.processingFiles) {
      showToast("Περίμενε να τελειώσει πρώτα η τρέχουσα μετατροπή.");
      return;
    }

    const setUploadStatus = (message) => {
      state.uploadStatus = message;
      renderAdmin();
    };
    state.processingFiles = true;
    state.uploadErrors = [];
    setUploadStatus("Ελέγχω τύπο, μέγεθος και διάρκεια...");
    showToast("Ελέγχω τύπο, μέγεθος και διάρκεια...");
    const accepted = [];
    const errors = [];
    try {
      for (const file of files) {
        const result = await validateUploadFile(file, setUploadStatus);
        if (result.item) accepted.push(result.item);
        if (result.error) errors.push(result.error);
      }
    } finally {
      state.processingFiles = false;
      state.uploadStatus = "";
    }

    if (accepted.length) {
      state.selectedFiles.push(...accepted);
    }
    state.uploadErrors = errors;
    renderAdmin();
    if (errors.length) {
      showToast(`${errors.length} αρχείο${errors.length === 1 ? "" : "α"} απορρίφθηκαν. Δες τις λεπτομέρειες κάτω από το upload.`);
    } else {
      const pairs = selectedVideoThumbnailPairs().pairs.length;
      showToast(pairs === 0 ? "Πρόσθεσε και το αντίστοιχο βίντεο ή thumbnail." : pairs === 1 ? "Ένα ζευγάρι είναι έτοιμο για URL." : `${pairs} ζευγάρια είναι έτοιμα για URLs.`);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!githubSettingsReady()) {
      showToast("Συμπλήρωσε πρώτα τις ρυθμίσεις GitHub.");
      return;
    }
    if (state.processingFiles) {
      showToast("Περίμενε να τελειώσει πρώτα η μετατροπή/ο έλεγχος αρχείων.");
      return;
    }
    if (state.uploading) return;

    const form = event.currentTarget;
    const title = form.querySelector("#title").value.trim();
    const description = form.querySelector("#description").value.trim();
    const slugInput = form.querySelector("#slug").value.trim();
    const published = form.querySelector("#published").checked;
    const existing = state.editId ? state.pages.find((page) => page.id === state.editId) : null;
    const selectedLogoId = state.draft.logoId || existing?.logo?.id || "";
    const selectedLogo = logoById(selectedLogoId);
    const logoSize = clampNumber(state.draft.logoSize || existing?.logoSize || 18, 8, 35);
    const overlayText = String(state.draft.overlayText || existing?.overlayText || "").trim();
    const overlaySubtext = String(state.draft.overlaySubtext || existing?.overlaySubtext || "").trim();
    const overlayConfig = { logo: selectedLogo, logoSize, overlayText, overlaySubtext };
    const pairState = selectedVideoThumbnailPairs();

    if (existing && !title) {
      showToast("Συμπλήρωσε τίτλο.");
      return;
    }
    if (state.selectedFiles.length && (pairState.missingThumbnails || pairState.missingVideos)) {
      showToast("Κάθε σελίδα χρειάζεται 1 βίντεο και 1 thumbnail.");
      return;
    }
    if (existing && pairState.pairs.length > 1) {
      showToast("Στην επεξεργασία μπορείς να αντικαταστήσεις με ένα ζευγάρι: 1 βίντεο + 1 thumbnail.");
      return;
    }
    if (!existing && !pairState.pairs.length) {
      showToast("Ανέβασε τουλάχιστον 1 βίντεο και 1 thumbnail.");
      return;
    }

    state.uploading = true;
    renderAdmin();

    try {
      if (!existing) {
        const createdPages = [];
        const total = pairState.pairs.length;
        for (const pair of pairState.pairs) {
          const cleanFileTitle = fileTitle(pair.video.name);
          const pageTitle = total > 1 && title ? `${title} - ${cleanFileTitle}` : title || cleanFileTitle;
          const slugBase = total > 1
            ? `${slugInput || title || ""} ${cleanFileTitle}`
            : slugInput || pageTitle;
          const slug = uniqueSlug(slugBase, null);
          const video = await uploadMediaToGithub(pair.video, slug);
          const preparedThumbnail = await photoWithOverlay(pair.thumbnail, overlayConfig);
          const thumbnail = await uploadMediaToGithub(preparedThumbnail, slug);
          const page = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            title: pageTitle,
            description,
            slug,
            published,
            files: [video, thumbnail],
            logo: selectedLogo,
            logoSize,
            overlayText,
            overlaySubtext,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          createdPages.push(page);
        }
        state.pages = [...createdPages, ...state.pages];
        state.selectedId = createdPages[0].id;
        createdPages.forEach((page) => state.expandedRows.add(page.id));
        saveExpandedRows();
        savePages();
        await syncPagesToGithub();
        clearFormState();
        showToast(createdPages.length === 1 ? "Δημιουργήθηκε 1 GitHub URL." : `Δημιουργήθηκαν ${createdPages.length} GitHub URLs.`);
        return;
      }

      const slug = uniqueSlug(slugInput || title, existing.id);
      let files = existing && !state.selectedFiles.length ? existing.files : [];
      if (state.selectedFiles.length) {
        files = [];
        for (const pair of pairState.pairs) {
          files.push(await uploadMediaToGithub(pair.video, slug));
          const preparedThumbnail = await photoWithOverlay(pair.thumbnail, overlayConfig);
          files.push(await uploadMediaToGithub(preparedThumbnail, slug));
        }
      }

      const page = {
        id: existing.id,
        title,
        description,
        slug,
        published,
        files,
        logo: selectedLogo,
        logoSize,
        overlayText,
        overlaySubtext,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      };

      state.pages = state.pages.map((item) => (item.id === page.id ? page : item));
      state.selectedId = page.id;
      state.expandedRows.add(page.id);
      saveExpandedRows();
      savePages();
      await syncPagesToGithub();
      clearFormState();
      showToast("Η σελίδα ενημερώθηκε στο GitHub.");
    } catch (error) {
      showToast(`GitHub upload error: ${error.message}`);
    } finally {
      state.uploading = false;
      renderAdmin();
    }
  }

  function clearFormState() {
    state.editId = null;
    state.selectedFiles = [];
    state.uploadErrors = [];
    state.draft = {
      title: "",
      description: "",
      slug: "",
      published: true,
      slugTouched: false,
      logoId: "",
      logoSize: 18,
      overlayText: "",
      overlaySubtext: "",
    };
  }

  async function hydrateThumbs() {
    const targets = [
      ...document.querySelectorAll("[data-thumb]"),
      ...document.querySelectorAll("[data-preview-video]"),
      ...document.querySelectorAll("[data-gallery-media]"),
    ];
    for (const target of targets) {
      const id = target.dataset.thumb || target.dataset.previewVideo || target.dataset.galleryMedia;
      if (!id) continue;
      const page = state.pages.find((item) => item.files.some((file) => file.id === id));
      const media = page?.files.find((file) => file.id === id);
      if (!media) continue;
      const src = await mediaSrc(media);
      if (!src) continue;
      const isVideo = media.type.startsWith("video/");
      if (target.dataset.previewVideo !== undefined) {
        const poster = pageThumbnail(page);
        const posterSrc = poster ? await mediaSrc(poster) : "";
        const logoUrl = logoSrc(page.logo);
        const overlayHtml = renderTextOverlay(page);
        const logoHtml = logoUrl ? `<img class="video-logo-overlay" style="--logo-size:${escapeHtml(logoSizePercent(page))}%;" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(page.logo.name)}" />` : "";
        target.innerHTML = isVideo
          ? `<video src="${src}" ${posterSrc ? `poster="${posterSrc}"` : ""} ${videoPlaybackAttrs(media)} controls playsinline></video>${overlayHtml}${logoHtml}`
          : `<img src="${src}" alt="${escapeHtml(media.name)}" />${overlayHtml}${logoHtml}`;
      } else if (target.dataset.galleryMedia !== undefined) {
        target.outerHTML = isVideo
          ? `<video src="${src}" muted playsinline></video>`
          : `<img src="${src}" alt="${escapeHtml(media.name)}" />`;
      } else {
        target.outerHTML = isVideo
          ? `<div class="thumb-fallback">${icon("video")}</div>`
          : `<img class="thumb" src="${src}" alt="${escapeHtml(media.name)}" />`;
      }
    }
    bindTimedVideos();
  }

  async function renderPublic(slug) {
    const app = document.getElementById("app");
    const page = state.pages.find((item) => item.slug === slug);
    if (!page || !page.published) {
      app.innerHTML = `
        <section class="not-found">
          <div class="not-found-inner">
            <span class="empty-icon">${icon("folder")}</span>
            <h1>Η σελίδα δεν είναι διαθέσιμη</h1>
            <p>Το link μπορεί να είναι λάθος ή η σελίδα να είναι αποθηκευμένη ως πρόχειρο.</p>
            <a class="primary" href="./">Επιστροφή στη διαχείριση</a>
          </div>
        </section>
      `;
      return;
    }

    const video = pageVideo(page);
    const thumbnail = pageThumbnail(page);
    const logo = page.logo;
    const logoUrl = logoSrc(logo);
    const overlay = renderTextOverlay(page);
    const videoSrc = await mediaSrc(video);
    const thumbnailSrc = await mediaSrc(thumbnail);
    app.innerHTML = `
      <div class="public-page">
        <header class="public-header">
          <a class="public-brand" href="./">
            <span class="brand-mark">${icon("video")}</span>
            <span>Media Pages</span>
          </a>
          <button class="secondary" id="copyPublic">${icon("copy")} Αντιγραφή link</button>
        </header>
        <main class="public-main">
          <div class="public-layout">
            <section>
              <h1 class="public-title">${escapeHtml(page.title)}</h1>
              <p class="public-description">${escapeHtml(page.description || "Χωρίς περιγραφή.")}</p>
              <div class="public-hero-media">
                ${video && video.type.startsWith("video/")
                  ? `<video src="${videoSrc}" ${thumbnailSrc ? `poster="${thumbnailSrc}"` : ""} ${videoPlaybackAttrs(video)} controls playsinline></video>`
                  : `<img src="${thumbnailSrc || videoSrc}" alt="${escapeHtml(thumbnail ? thumbnail.name : page.title)}" />`}
                ${overlay}
                ${logoUrl ? `<img class="video-logo-overlay" style="--logo-size:${escapeHtml(logoSizePercent(page))}%;" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(logo.name)}" />` : ""}
              </div>
              ${thumbnail ? `
                <section class="public-gallery">
                  <h2>Thumbnail</h2>
                  <div class="gallery-grid" id="publicGallery">
                    <img src="${thumbnailSrc}" alt="${escapeHtml(thumbnail.name)}" />
                  </div>
                </section>
              ` : ""}
            </section>
            <aside class="public-side">
              <h2>Στοιχεία σελίδας</h2>
              <p>${mediaKind(page.files)} · ${escapeHtml(pageFileSummary(page))}</p>
              <p style="margin-top:10px;">URL: /${escapeHtml(page.slug)}</p>
            </aside>
          </div>
        </main>
      </div>
    `;
    document.getElementById("copyPublic")?.addEventListener("click", () => copyText(pageUrl(page.slug)));
    bindTimedVideos();
  }

  async function init() {
    state.db = await openDb();
    loadPages();
    await tryLoadPublishedPages();
    state.selectedId = state.pages[0]?.id || "";
    window.addEventListener("hashchange", render);
    render();
  }

  init().catch((error) => {
    console.error(error);
    document.getElementById("app").innerHTML = `
      <section class="not-found">
        <div class="not-found-inner">
          <h1>Δεν μπόρεσε να ανοίξει η εφαρμογή</h1>
          <p>Ο browser δεν επέτρεψε την τοπική αποθήκευση αρχείων. Δοκίμασε να την ανοίξεις μέσω τοπικού server.</p>
        </div>
      </section>
    `;
  });
})();
