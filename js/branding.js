// /js/branding.js
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:4000"; // keep parity w/ your pattern (not required here)

  const baseFile = document.getElementById("baseFile");
  const logoFile = document.getElementById("logoFile");

  const placement = document.getElementById("placement");
  const size = document.getElementById("size");
  const opacity = document.getElementById("opacity");
  const pad = document.getElementById("pad");
  const blend = document.getElementById("blend");

  const sizeVal = document.getElementById("sizeVal");
  const opacityVal = document.getElementById("opacityVal");
  const padVal = document.getElementById("padVal");

  const previewStage = document.getElementById("previewStage");
  const stageLabel = document.getElementById("stageLabel");
  const stageHint = document.getElementById("stageHint");

  const canvas = document.getElementById("brandCanvas");
  const ctx = canvas.getContext("2d");

  const exportPngBtn = document.getElementById("exportPngBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const sendToMintBtn = document.getElementById("sendToMintBtn");

  const loadFromCreateBtn = document.getElementById("loadFromCreateBtn");
  const clearBaseBtn = document.getElementById("clearBaseBtn");
  const clearLogoBtn = document.getElementById("clearLogoBtn");
  const resetLogoPosBtn = document.getElementById("resetLogoPosBtn");
  const brandStatus = document.getElementById("brandStatus");

  const invertHintBtn = document.getElementById("invertHintBtn");

  // Watermark controls
const wmEnabled = document.getElementById("wmEnabled");
const wmMode = document.getElementById("wmMode");
const wmText = document.getElementById("wmText");
const wmOpacity = document.getElementById("wmOpacity");
const wmSize = document.getElementById("wmSize");
const wmRotate = document.getElementById("wmRotate");
const wmGap = document.getElementById("wmGap");
const wmOpacityVal = document.getElementById("wmOpacityVal");
const wmSizeVal = document.getElementById("wmSizeVal");
const wmRotateVal = document.getElementById("wmRotateVal");
const wmGapVal = document.getElementById("wmGapVal");

// Text overlay controls
const txtEnabled = document.getElementById("txtEnabled");
const txtPos = document.getElementById("txtPos");
const txtText = document.getElementById("txtText");
const txtSize = document.getElementById("txtSize");
const txtOpacity = document.getElementById("txtOpacity");
const txtColor = document.getElementById("txtColor");
const txtBackdrop = document.getElementById("txtBackdrop");
const txtSizeVal = document.getElementById("txtSizeVal");
const txtOpacityVal = document.getElementById("txtOpacityVal");


  // LocalStorage keys (simple + consistent)
  const LS_CREATE_LATEST = "origin.latestArtworkDataUrl";   // optional: if you want Create to save here
  const LS_BRANDED_OUT = "origin.brandedArtworkDataUrl";    // what Mint can read

  const state = {
    baseImg: null,
    logoImg: null,
    // custom drag position in canvas coordinates (0..canvas.width/height)
    logoX: null,
    logoY: null,
    isDraggingLogo: false,
    dragOffsetX: 0,
    dragOffsetY: 0,
    lastExport: null,
    helperOn: false
  };

  function setStatus(text) {
    brandStatus.textContent = text;
  }

  function syncLabels() {
    sizeVal.textContent = `${size.value}%`;
    opacityVal.textContent = `${opacity.value}%`;
    padVal.textContent = `${pad.value}px`;
  }

  function canvasClear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function fitCover(imgW, imgH, dstW, dstH) {
    // cover crop
    const srcRatio = imgW / imgH;
    const dstRatio = dstW / dstH;
    let drawW, drawH, x, y;

    if (srcRatio > dstRatio) {
      // wider than destination
      drawH = dstH;
      drawW = dstH * srcRatio;
      x = (dstW - drawW) / 2;
      y = 0;
    } else {
      // taller
      drawW = dstW;
      drawH = dstW / srcRatio;
      x = 0;
      y = (dstH - drawH) / 2;
    }
    return { x, y, w: drawW, h: drawH };
  }

  function computeLogoRect() {
    if (!state.logoImg) return null;

    const pct = Number(size.value) / 100;
    const targetW = Math.round(canvas.width * pct);
    const ratio = state.logoImg.width / state.logoImg.height;
    const targetH = Math.round(targetW / ratio);

    const padding = Number(pad.value);

    // Default anchor positions (non-custom)
    const pos = placement.value;

    let x = padding;
    let y = padding;

    if (pos === "br") {
      x = canvas.width - targetW - padding;
      y = canvas.height - targetH - padding;
    } else if (pos === "bl") {
      x = padding;
      y = canvas.height - targetH - padding;
    } else if (pos === "tr") {
      x = canvas.width - targetW - padding;
      y = padding;
    } else if (pos === "tl") {
      x = padding;
      y = padding;
    } else if (pos === "c") {
      x = Math.round((canvas.width - targetW) / 2);
      y = Math.round((canvas.height - targetH) / 2);
    } else if (pos === "custom") {
      // initialize custom position if absent
      if (state.logoX == null || state.logoY == null) {
        state.logoX = canvas.width - targetW - padding;
        state.logoY = canvas.height - targetH - padding;
      }
      x = state.logoX;
      y = state.logoY;
    }

    // clamp inside bounds
    x = Math.max(0, Math.min(canvas.width - targetW, x));
    y = Math.max(0, Math.min(canvas.height - targetH, y));

    return { x, y, w: targetW, h: targetH };
  }

  function draw() {
    canvasClear();

    // Background base
    if (!state.baseImg) {
      stageLabel.textContent = "Drop base artwork here";
      stageLabel.style.display = "inline-flex";
      return;
    }

    stageLabel.style.display = "none";

    // draw base as cover into canvas
    const cover = fitCover(state.baseImg.width, state.baseImg.height, canvas.width, canvas.height);
    ctx.save();
    ctx.drawImage(state.baseImg, cover.x, cover.y, cover.w, cover.h);
    ctx.restore();

    // helper overlay (optional)
    if (state.helperOn) {
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    // logo overlay
    if (state.logoImg) {
      const rect = computeLogoRect();
      if (!rect) return;

      ctx.save();
      ctx.globalAlpha = Number(opacity.value) / 100;
      ctx.globalCompositeOperation = blend.value || "source-over";
      ctx.drawImage(state.logoImg, rect.x, rect.y, rect.w, rect.h);
      ctx.restore();

      // outline logo bounds when in custom mode (for drag clarity)
      if (placement.value === "custom") {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
        ctx.restore();
      }
    }
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  function loadImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  async function setBaseFromFile(file) {
    const url = await readFileAsDataURL(file);
    state.baseImg = await loadImage(url);
    state.lastExport = null;
    downloadBtn.disabled = true;
    sendToMintBtn.disabled = true;
    setStatus("Loaded · Base set");
    draw();
  }

  async function setLogoFromFile(file) {
    const url = await readFileAsDataURL(file);
    state.logoImg = await loadImage(url);
    state.lastExport = null;
    downloadBtn.disabled = true;
    sendToMintBtn.disabled = true;
    setStatus("Loaded · Logo set");
    draw();
  }

  function resetLogoPos() {
    state.logoX = null;
    state.logoY = null;
    draw();
  }

  function exportPNG() {
    if (!state.baseImg) {
      setStatus("Blocked · Add base artwork");
      return;
    }
    // draw once more to ensure final state, then export
    draw();
    const png = canvas.toDataURL("image/png");
    state.lastExport = png;

    // enable actions
    downloadBtn.disabled = false;
    sendToMintBtn.disabled = false;

    // store locally for Mint
    localStorage.setItem(LS_BRANDED_OUT, png);

    setStatus("Exported · Branded image ready");
  }

  function downloadExport() {
    if (!state.lastExport) return;
    const a = document.createElement("a");
    a.href = state.lastExport;
    a.download = "origin-branded.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function sendToMint() {
    if (!state.lastExport) return;
    // already stored in LS_BRANDED_OUT
    setStatus("Sent · Open Mint");
    window.location.href = "mint.html";
  }

  async function loadLatestFromCreate() {
    const latest = localStorage.getItem(LS_CREATE_LATEST);
    if (!latest) {
      setStatus("No Create export found");
      return;
    }
    try {
      state.baseImg = await loadImage(latest);
      state.lastExport = null;
      downloadBtn.disabled = true;
      sendToMintBtn.disabled = true;
      setStatus("Loaded · From Create");
      draw();
    } catch {
      setStatus("Failed · Create image invalid");
    }
  }

  function clearBase() {
    state.baseImg = null;
    state.lastExport = null;
    downloadBtn.disabled = true;
    sendToMintBtn.disabled = true;
    setStatus("Cleared · Base removed");
    draw();
  }

  function clearLogo() {
    state.logoImg = null;
    state.lastExport = null;
    downloadBtn.disabled = true;
    sendToMintBtn.disabled = true;
    setStatus("Cleared · Logo removed");
    draw();
  }

  // --- Drag + Drop onto stage (base OR logo) ---
  function stopDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover", "dragleave", "drop"].forEach(evt => {
    previewStage.addEventListener(evt, stopDefaults, false);
  });

  previewStage.addEventListener("drop", async (e) => {
    const files = e.dataTransfer.files;
    if (!files || !files.length) return;

    // If two files dropped: first becomes base, second becomes logo (nice UX)
    // If one file: if base missing -> base; else -> logo
    try {
      if (files.length >= 2) {
        await setBaseFromFile(files[0]);
        await setLogoFromFile(files[1]);
        return;
      }
      if (!state.baseImg) await setBaseFromFile(files[0]);
      else await setLogoFromFile(files[0]);
    } catch {
      setStatus("Drop failed · Unsupported file");
    }
  });

  // --- Custom logo drag on canvas ---
  function getCanvasPoint(evt) {
    const rect = canvas.getBoundingClientRect();
    const x = (evt.clientX - rect.left) * (canvas.width / rect.width);
    const y = (evt.clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  }

  function pointInRect(px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  }

  canvas.addEventListener("mousedown", (e) => {
    if (placement.value !== "custom") return;
    if (!state.logoImg) return;

    const r = computeLogoRect();
    if (!r) return;

    const p = getCanvasPoint(e);
    if (!pointInRect(p.x, p.y, r)) return;

    state.isDraggingLogo = true;
    state.dragOffsetX = p.x - r.x;
    state.dragOffsetY = p.y - r.y;
    canvas.style.cursor = "grabbing";
  });

  window.addEventListener("mousemove", (e) => {
    if (!state.isDraggingLogo) return;
    const p = getCanvasPoint(e);

    const r = computeLogoRect();
    if (!r) return;

    const nextX = p.x - state.dragOffsetX;
    const nextY = p.y - state.dragOffsetY;

    state.logoX = Math.max(0, Math.min(canvas.width - r.w, nextX));
    state.logoY = Math.max(0, Math.min(canvas.height - r.h, nextY));
    draw();
  });

  window.addEventListener("mouseup", () => {
    if (!state.isDraggingLogo) return;
    state.isDraggingLogo = false;
    canvas.style.cursor = "default";
  });

  // Cursor hint on hover for custom mode
  canvas.addEventListener("mousemove", (e) => {
    if (placement.value !== "custom" || !state.logoImg) return;
    const r = computeLogoRect();
    if (!r) return;
    const p = getCanvasPoint(e);
    canvas.style.cursor = pointInRect(p.x, p.y, r) ? "grab" : "default";
  });

  // --- UI wiring ---
  baseFile.addEventListener("change", async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    await setBaseFromFile(e.target.files[0]);
  });

  logoFile.addEventListener("change", async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    await setLogoFromFile(e.target.files[0]);
  });

  [placement, size, opacity, pad, blend].forEach(el => {
    el.addEventListener("input", () => {
      syncLabels();
      state.lastExport = null;
      downloadBtn.disabled = true;
      sendToMintBtn.disabled = true;

      stageHint.textContent =
        placement.value === "custom"
          ? "Custom mode: drag the logo directly on the canvas."
          : "Logo drag enabled only in Custom mode.";

      draw();
    });
  });

  exportPngBtn.addEventListener("click", exportPNG);
  downloadBtn.addEventListener("click", downloadExport);
  sendToMintBtn.addEventListener("click", sendToMint);

  loadFromCreateBtn.addEventListener("click", loadLatestFromCreate);
  clearBaseBtn.addEventListener("click", clearBase);
  clearLogoBtn.addEventListener("click", clearLogo);
  resetLogoPosBtn.addEventListener("click", resetLogoPos);

  invertHintBtn.addEventListener("click", () => {
    state.helperOn = !state.helperOn;
    setStatus(state.helperOn ? "Helper · On" : "Helper · Off");
    draw();
  });

  // Init
  syncLabels();
  setStatus("Waiting · Upload base + logo");
  draw();
});
