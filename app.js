(function () {
  const DB_NAME = "media-pages-db";
  const DB_VERSION = 1;
  const STORE = "files";
  const META_KEY = "media-pages:pages";
  const SETTINGS_KEY = "media-pages:github-settings";
  const INDEX_PATH = "data/pages.json";
  const GITHUB_API_VERSION = "2022-11-28";
  const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
  const MAX_GITHUB_BYTES = 100 * 1024 * 1024;
  const MAX_VIDEO_SECONDS = 600;
  const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg"]);
  const VIDEO_EXTENSIONS = new Set(["mp4", "3gp"]);

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
    previewOpen: localStorage.getItem("media-pages:preview-open") !== "false",
    settingsOpen: false,
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

  function githubSettingsReady() {
    const settings = state.github;
    return Boolean(settings.owner && settings.repo && settings.branch && settings.token);
  }

  function loadGithubSettings() {
    const defaults = {
      owner: "",
      repo: "",
      branch: "main",
      mediaDir: "media",
      siteBaseUrl: "",
      token: "",
    };
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
    } catch {
      return defaults;
    }
  }

  function saveGithubSettings(settings) {
    state.github = {
      owner: settings.owner.trim(),
      repo: settings.repo.trim(),
      branch: settings.branch.trim() || "main",
      mediaDir: normalizeFolder(settings.mediaDir),
      siteBaseUrl: settings.siteBaseUrl.trim().replace(/\/+$/g, ""),
      token: settings.token.trim(),
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.github));
  }

  function pageUrl(slug) {
    const base = state.github.siteBaseUrl || window.location.href.split("#")[0];
    return `${base}#/p/${slug}`;
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

  function mediaMeta(media) {
    const parts = [];
    if (media.type) parts.push(media.type);
    if (media.size) parts.push(formatBytes(media.size));
    if (media.durationSeconds !== undefined) parts.push(`διάρκεια ${formatSeconds(media.durationSeconds)}`);
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

  async function validateUploadFile(file) {
    const extension = fileExtension(file);
    const isImage = IMAGE_EXTENSIONS.has(extension);
    const isVideo = VIDEO_EXTENSIONS.has(extension);

    if (!isImage && !isVideo) {
      return {
        error: `${file.name}: επιτρέπονται μόνο φωτογραφίες png, jpg, jpeg και βίντεο mp4, 3gp.`,
      };
    }

    if (file.size > MAX_GITHUB_BYTES) {
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
      const durationSeconds = await getVideoDuration(file);
      if (durationSeconds > MAX_VIDEO_SECONDS) {
        return {
          error: `${file.name}: διάρκεια ${formatSeconds(durationSeconds)}. Το όριο είναι 600.00 sec.`,
        };
      }
      return {
        item: {
          file,
          name: file.name,
          type: file.type || `video/${extension}`,
          size: file.size,
          kind: "video",
          durationSeconds,
        },
      };
    } catch {
      return {
        error: `${file.name}: δεν μπόρεσα να διαβάσω με ακρίβεια τη διάρκεια, άρα δεν δημιουργείται URL.`,
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

  function rawGithubUrl(path) {
    const { owner, repo, branch } = state.github;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
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
    const stamp = new Date().toISOString().slice(0, 10);
    const role = item.kind === "image" ? "thumbnail" : "video";
    const path = `${normalizeFolder(state.github.mediaDir)}/${stamp}/${slug}-${role}-${cleanFileName(item.name)}`;
    const content = await fileToBase64(item.file);
    await uploadGithubFile(path, content, `Add media ${item.name}`);
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: item.name,
      type: item.type,
      size: item.size,
      kind: item.kind,
      durationSeconds: item.durationSeconds,
      githubPath: path,
      remoteUrl: rawGithubUrl(path),
    };
  }

  async function syncPagesToGithub() {
    const publicPages = state.pages.filter((page) => !page.id.startsWith("sample-"));
    const json = JSON.stringify({ pages: publicPages }, null, 2);
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
      savePages();
    } catch {
      // The public index exists only after the first GitHub sync.
    }
  }

  async function mediaSrc(media) {
    if (!media) return "";
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
        <aside class="sidebar">
          <nav class="nav-list" aria-label="Πλοήγηση">
            <button class="nav-item">${icon("home")} Πίνακας</button>
            <button class="nav-item active">${icon("plus")} Νέα σελίδα</button>
            <button class="nav-item">${icon("folder")} Βιβλιοθήκη</button>
            <button class="nav-item">${icon("settings")} Ρυθμίσεις</button>
          </nav>
        </aside>
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
    `;

    bindAdminEvents();
    hydrateThumbs();
  }

  function renderForm() {
    const editing = state.pages.find((page) => page.id === state.editId);
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
            <input class="input" id="title" name="title" ${editing ? "required" : ""} value="${escapeHtml(editing ? editing.title : "")}" placeholder="${editing ? "" : "Προαιρετικό - αλλιώς θα μπει το όνομα αρχείου"}" />
          </div>
          <div class="field">
            <label for="description">Περιγραφή</label>
            <textarea id="description" name="description" maxlength="500">${escapeHtml(editing ? editing.description : "")}</textarea>
            <span class="hint">Έως 500 χαρακτήρες.</span>
          </div>
          <div class="field">
            <label for="slug">${batchMode ? "Βάση URL" : "Slug URL"} ${editing ? '<span class="required">*</span>' : ""}</label>
            <div class="slug-row">
              <span class="slug-prefix">${escapeHtml(window.location.href.split("#")[0])}#/p/</span>
              <input class="input" id="slug" name="slug" ${editing ? "required" : ""} value="${escapeHtml(editing ? editing.slug : "")}" placeholder="${batchMode ? "π.χ. viber-video" : "δημιουργείται αυτόματα"}" />
            </div>
            <span class="hint">${batchMode ? "Για πολλά αρχεία θα προστεθεί αυτόματα το όνομα κάθε αρχείου, ώστε κάθε URL να είναι μοναδικό." : "Μπορείς να το αφήσεις κενό και θα δημιουργηθεί αυτόματα."}</span>
          </div>
          <div class="field">
            <label>Βίντεο ή φωτογραφίες <span class="required">*</span></label>
            <label class="dropzone" id="dropzone">
              <input id="mediaInput" type="file" accept=".png,.jpg,.jpeg,.mp4,.3gp,image/png,image/jpeg,video/mp4,video/3gpp" multiple />
              <span>
                <span class="empty-icon">${icon("upload")}</span>
                <p class="drop-title">Σύρε αρχεία εδώ ή <span>κάνε κλικ για επιλογή</span></p>
                <p class="drop-note">Για κάθε σελίδα ανέβασε 1 βίντεο MP4/3GP και 1 thumbnail PNG/JPG/JPEG. Τα ζευγάρια δημιουργούνται με τη σειρά που επιλέγεις τα αρχεία.</p>
              </span>
            </label>
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
              <input id="published" type="checkbox" ${editing && !editing.published ? "" : "checked"} />
              <span></span>
            </label>
          </div>
          <button class="primary" type="submit" ${state.uploading ? "disabled" : ""}>${state.uploading ? icon("upload") + " Ανεβάζω στο GitHub..." : editing ? icon("edit") + " Αποθήκευση" : icon("plus") + " Δημιουργία URL" + (pairs.pairs.length > 1 ? "s" : "")}</button>
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
              <p>Αυτό χρειάζεται μόνο μία φορά, για να ξέρει η εφαρμογή σε ποιο GitHub repo θα ανεβάζει τα αρχεία.</p>
            </div>
            <button class="icon-button" id="closeSettings" type="button" title="Κλείσιμο">${icon("x")}</button>
          </div>
          <div class="settings-status">
            <span class="status ${githubSettingsReady() ? "live" : "draft"}">${githubSettingsReady() ? "Έτοιμο για upload" : "Δεν έχει ρυθμιστεί"}</span>
          </div>
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
          <label class="settings-wide">
            <span>GitHub token</span>
            <input class="input" id="ghToken" type="password" value="${escapeHtml(settings.token)}" placeholder="Token με Contents: Read and write" autocomplete="off" />
          </label>
          <p class="settings-note">Το token μένει μόνο σε αυτόν τον browser και δεν ανεβαίνει στο GitHub.</p>
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
      pendingIndex: index,
    }));
    const files = pending.length ? pending : existing;
    if (!files.length) return "";
    const list = files
      .map((file) => `
        <div class="media-file">
          <div data-thumb="${escapeHtml(file.id)}" class="thumb-fallback">${icon(file.type.startsWith("video/") ? "video" : "image")}</div>
          <div>
            <p class="file-name">${escapeHtml(file.name)}</p>
            <p class="file-meta">${escapeHtml(file.kind === "image" ? "thumbnail" : file.kind === "video" ? "video" : mediaKind([file]))} · ${escapeHtml(mediaMeta(file))}${file.pendingIndex !== undefined ? " · θα μπει σε ζευγάρι" : ""}</p>
          </div>
          ${file.pendingIndex !== undefined ? `<button class="icon-button remove-pending" type="button" data-index="${file.pendingIndex}" title="Αφαίρεση">${icon("x")}</button>` : ""}
        </div>
      `)
      .join("");
    const pendingNote = state.selectedFiles.length && !editing
      ? `<div class="url-note">${pairState.videos.length} βίντεο + ${pairState.thumbnails.length} thumbnails: θα δημιουργηθούν ${pairState.pairs.length} σελίδες. ${pairState.missingThumbnails ? `Λείπουν ${pairState.missingThumbnails} thumbnails.` : ""} ${pairState.missingVideos ? `Λείπουν ${pairState.missingVideos} βίντεο.` : ""}</div>`
      : "";
    return pendingNote + list;
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
    const rows = pages.map((page) => `
      <tr data-row="${escapeHtml(page.id)}">
        <td>
          <div class="title-cell">
            <div data-thumb="${escapeHtml((pageThumbnail(page) || {}).id || "")}" class="thumb-fallback">${icon("image")}</div>
            <div>
              <strong>${escapeHtml(page.title)}</strong>
              <span>${escapeHtml(pageFileSummary(page))}</span>
            </div>
          </div>
        </td>
        <td><span class="type-chip">${icon("video")} ${mediaKind(page.files)}</span></td>
        <td><span class="slug-link">${escapeHtml(pageUrl(page.slug))}</span></td>
        <td><span class="status ${page.published ? "live" : "draft"}">${page.published ? "Δημοσιευμένη" : "Πρόχειρο"}</span></td>
        <td>
          <div class="row-actions">
            <button class="icon-button copy-url" data-slug="${escapeHtml(page.slug)}" title="Αντιγραφή URL">${icon("copy")}</button>
            <button class="icon-button view-page" data-slug="${escapeHtml(page.slug)}" title="Προβολή">${icon("eye")}</button>
            <button class="icon-button edit-page" data-id="${escapeHtml(page.id)}" title="Επεξεργασία">${icon("edit")}</button>
            <button class="icon-button delete-page" data-id="${escapeHtml(page.id)}" title="Διαγραφή">${icon("trash")}</button>
          </div>
        </td>
      </tr>
    `).join("");

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
        ${rows ? `
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Τίτλος</th>
                  <th>Τύπος</th>
                  <th>URL</th>
                  <th>Κατάσταση</th>
                  <th>Ενέργειες</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
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
            <div class="url-box">
              <input readonly value="${escapeHtml(url)}" />
              <button class="icon-button copy-url" data-slug="${escapeHtml(page.slug)}" title="Αντιγραφή URL">${icon("copy")}</button>
            </div>
            <article class="public-preview">
              <div class="preview-content">
                <h3 class="preview-title">${escapeHtml(page.title)}</h3>
              </div>
              <div class="preview-media" data-preview-video="${escapeHtml(video ? video.id : "")}" data-preview-poster="${escapeHtml(thumbnail ? thumbnail.id : "")}">
                ${video ? `<span class="play-overlay">${icon("play")}</span>` : ""}
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

    const title = document.getElementById("title");
    const slug = document.getElementById("slug");
    title?.addEventListener("input", () => {
      if (!slug.dataset.touched) slug.value = slugify(title.value);
    });
    slug?.addEventListener("input", () => {
      slug.dataset.touched = "true";
      slug.value = slugify(slug.value);
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

    document.querySelectorAll("tr[data-row]").forEach((row) => {
      row.addEventListener("click", (event) => {
        if (event.target.closest("button")) return;
        state.selectedId = row.dataset.row;
        renderAdmin();
      });
    });
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

  function bindGithubSettings() {
    document.getElementById("saveGithubSettings")?.addEventListener("click", () => {
      saveGithubSettings({
        owner: document.getElementById("ghOwner")?.value || "",
        repo: document.getElementById("ghRepo")?.value || "",
        branch: document.getElementById("ghBranch")?.value || "main",
        mediaDir: document.getElementById("ghMediaDir")?.value || "media",
        siteBaseUrl: document.getElementById("ghSiteBaseUrl")?.value || "",
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
    document.querySelectorAll(".view-page").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        window.open(pageUrl(button.dataset.slug), "_blank");
      });
    });
    document.querySelectorAll(".edit-page").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        state.editId = button.dataset.id;
        state.selectedFiles = [];
        state.uploadErrors = [];
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

    showToast("Ελέγχω τύπο, μέγεθος και διάρκεια...");
    const accepted = [];
    const errors = [];
    for (const file of files) {
      const result = await validateUploadFile(file);
      if (result.item) accepted.push(result.item);
      if (result.error) errors.push(result.error);
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
    if (state.uploading) return;

    const form = event.currentTarget;
    const title = form.querySelector("#title").value.trim();
    const description = form.querySelector("#description").value.trim();
    const slugInput = form.querySelector("#slug").value.trim();
    const published = form.querySelector("#published").checked;
    const existing = state.editId ? state.pages.find((page) => page.id === state.editId) : null;
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
          const thumbnail = await uploadMediaToGithub(pair.thumbnail, slug);
          const page = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            title: pageTitle,
            description,
            slug,
            published,
            files: [video, thumbnail],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          createdPages.push(page);
        }
        state.pages = [...createdPages, ...state.pages];
        state.selectedId = createdPages[0].id;
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
          files.push(await uploadMediaToGithub(pair.thumbnail, slug));
        }
      }

      const page = {
        id: existing.id,
        title,
        description,
        slug,
        published,
        files,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      };

      state.pages = state.pages.map((item) => (item.id === page.id ? page : item));
      state.selectedId = page.id;
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
        target.innerHTML = isVideo
          ? `<video src="${src}" ${posterSrc ? `poster="${posterSrc}"` : ""} controls playsinline></video>`
          : `<img src="${src}" alt="${escapeHtml(media.name)}" />`;
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
                  ? `<video src="${videoSrc}" ${thumbnailSrc ? `poster="${thumbnailSrc}"` : ""} controls playsinline></video>`
                  : `<img src="${thumbnailSrc || videoSrc}" alt="${escapeHtml(thumbnail ? thumbnail.name : page.title)}" />`}
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
