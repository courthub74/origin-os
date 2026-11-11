document.addEventListener("DOMContentLoaded", () => {
  //BAKING API INTO THE BASE
  // Using the actual localhost address to avoid CORS issues during development.
  // In production, this should be the real API URL or relative path.
  const API_BASE = "http://127.0.0.1:4000";

  // Helper function to perform authenticated fetch requests, with automatic token refresh on 401 responses. It first tries the request with the current access token, and if it receives a 401 Unauthorized response, it attempts to refresh the token using the refresh endpoint. If the refresh is successful, it retries the original request with the new access token. If the refresh fails, it clears the stored tokens and redirects to the login page.
  async function authFetch(url, options = {}) {
    const access = token();

    let res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${access}`,
      },
      credentials: "include",
    });

    if (res.status !== 401) return res;

    // Try refresh
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!refreshRes.ok) {
      localStorage.removeItem("origin_access");
      localStorage.removeItem("origin_user");
      window.location.href = "/index.html";
      return res;
    }

    const data = await refreshRes.json();
    localStorage.setItem("origin_access", data.accessToken);

    // Retry original request
    res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${data.accessToken}`,
      },
      credentials: "include",
    });

    return res;
  }

  function sizeFromOutput(output) {
    if (output === "portrait") return "1024x1536";
    if (output === "landscape") return "1536x1024";
    return "1024x1024";
  }

  // helper to poll artwork until generation is ready, then update preview
  async function fetchArtworkById(id) {
    const res = await authFetch(`${API_BASE}/artworks/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token()}`,
      },
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch artwork");
    return data.artwork;
  }

  let progressTimer = null;
  let simulatedProgress = 0;

  function startSimulatedProgress() {
    stopSimulatedProgress();
    simulatedProgress = 18;

    const barEl = document.getElementById("generationProgressBar");
    if (barEl) barEl.style.width = `${simulatedProgress}%`;

    progressTimer = setInterval(() => {
      const bar = document.getElementById("generationProgressBar");
      if (!bar) return;

      // creep upward slowly, but never complete on its own
      if (simulatedProgress < 88) {
        simulatedProgress += Math.random() * 4;
        if (simulatedProgress > 88) simulatedProgress = 88;
        bar.style.width = `${simulatedProgress}%`;
      }
    }, 700);
  }

  function stopSimulatedProgress() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  // Updates the generation status text and progress bar based on the current status of the artwork generation process.
  function updateGenerationStatus(status) {
    const statusEl = document.getElementById("generationStatus");
    const barEl = document.getElementById("generationProgressBar");
    if (!statusEl || !barEl) return;

    if (status === "queued") {
      stopSimulatedProgress();
      simulatedProgress = 12;
      statusEl.textContent = "Queued…";
      barEl.style.width = "12%";
    } else if (status === "generating") {
      statusEl.textContent = "Generating…";
      if (!progressTimer) startSimulatedProgress();
    } else if (status === "generated") {
      stopSimulatedProgress();
      simulatedProgress = 100;
      statusEl.textContent = "Image created";
      barEl.style.width = "100%";
    } else if (status === "failed") {
      stopSimulatedProgress();
      simulatedProgress = 100;
      statusEl.textContent = "Generation failed";
      barEl.style.width = "100%";
    } else {
      stopSimulatedProgress();
      simulatedProgress = 0;
      statusEl.textContent = "";
      barEl.style.width = "0%";
    }
  }

  // RENDER GENERATED IMAGE IN PREVIEW
  async function renderGeneratedImage(artwork) {
    const stage = document.getElementById("previewStage");
    if (!stage) return;

    if (!artwork?.imageFileId) {
      stage.innerHTML = "<span>Image ready, but file is missing.</span>";
      return;
    }

    stage.innerHTML = "<span>Loading image…</span>";

    const res = await authFetch(
      `${API_BASE}/api/images/${artwork.imageFileId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token()}`,
        },
        credentials: "include",
      },
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to load generated image");
    }

    const blob = await res.blob();
    const imageUrl = URL.createObjectURL(blob);

    const img = document.createElement("img");
    img.alt = "Generated artwork";
    img.src = imageUrl;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";

    stage.innerHTML = "";
    stage.appendChild(img);
  }

  // Polls the artwork status until it's generated or failed, then updates the preview. Times out after a certain number of attempts to avoid infinite polling.
  async function pollArtworkUntilReady(
    id,
    maxAttempts = 60,
    intervalMs = 2000,
  ) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const artwork = await fetchArtworkById(id);
      const status = artwork?.status;

      updateGenerationStatus(status);

      if (status === "generated") {
        await renderGeneratedImage(artwork);
        return artwork;
      }

      if (status === "failed") {
        throw new Error(artwork.generationError || "Image generation failed");
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new Error("Generation timed out.");
  }

  // GENERATE IMAGE FROM PROMPT
  async function generateImageFromPrompt() {
    const output = document.getElementById("output")?.value || "square";
    const prompt =
      document.getElementById("compiledPrompt")?.value?.trim() ||
      document.getElementById("description")?.value?.trim();

    if (!prompt || prompt.length < 10) {
      throw new Error("Compile a prompt before generating.");
    }

    const stage = document.getElementById("previewStage");
    stage.innerHTML = "";
    updateGenerationStatus("queued");

    stage?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    const id = await createDraftIfNeeded();
    console.log("CLIENT DEBUG artworkId =", id);

    const res = await authFetch(`${API_BASE}/api/images/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
      credentials: "include",
      body: JSON.stringify({
        artworkId: id,
        prompt,
        size: sizeFromOutput(output),
        format: "png",
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Generation failed");

    await pollArtworkUntilReady(id);
  }

  document.getElementById("generateBtn")?.addEventListener("click", () => {
    generateImageFromPrompt().catch((err) => {
      // Check for common auth issues no token, expired token, etc. and handle by redirecting to login
      const t = token();
      // if (!t) {
      //   alert("Session expired. Please log in again.");
      //   window.location.href = "/login.html"; // or your route
      //   return;
      // }

      console.error(err);
      alert(err.message);
    });
  });

  const saveBtn = document.getElementById("saveDraftBtn");
  const previewBtn = document.getElementById("previewBtn");
  const pill = document.querySelector(".topRight .pill"); // "Draft · Unsaved"

  // We'll store current draft id here
  // let artworkId = localStorage.getItem("origin_current_artwork_id") || null;
  const workIdFromUrl = new URLSearchParams(window.location.search).get(
    "workId",
  );

  let artworkId =
    workIdFromUrl || localStorage.getItem("origin_current_artwork_id") || null;

  if (workIdFromUrl) {
    localStorage.setItem("origin_current_artwork_id", workIdFromUrl);
  }

  function token() {
    return localStorage.getItem("origin_access");
  }

  function setPill(text) {
    if (pill) pill.textContent = text;
  }

  // GET FORM DATA FROM INPUTS
  function getFormData() {
    const value = (id) => document.getElementById(id)?.value?.trim() || "";

    const tagsRaw = value("tags");
    const tags = tagsRaw
      ? tagsRaw
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    return {
      output: document.getElementById("output")?.value || "square",

      // Manual and compiled prompts are stored separately.
      description: value("description"),
      promptCompiled: value("compiledPrompt"),

      promptBuilder: {
        subject: value("p_subject"),
        mood: value("p_mood"),
        palette: value("p_palette"),
        style: value("p_style"),
        left: value("p_left"),
        right: value("p_right"),
        top: value("p_top"),
        bottom: value("p_bottom"),
        lighting: value("p_lighting"),
        camera: value("p_camera"),
        avoid: value("p_avoid"),
      },

      title: value("title"),
      year: value("year"),
      collectionName: document.getElementById("collection")?.value || "",
      notes: value("notes"),
      tags,
    };
  }

  // Sets the value of an input field by its ID. If the element is found, it sets its value to the provided value or an empty string if the value is null or undefined.
  function setFieldValue(id, value = "") {
    const element = document.getElementById(id);
    if (element) element.value = value ?? "";
  }

  async function loadExistingArtwork() {
    if (!artworkId) return;

    setPill("Draft · Loading…");

    try {
      const artwork = await fetchArtworkById(artworkId);
      const builder = artwork.promptBuilder || {};

      setFieldValue("output", artwork.output || "square");

      setFieldValue("p_subject", builder.subject);
      setFieldValue("p_mood", builder.mood);
      setFieldValue("p_palette", builder.palette);
      setFieldValue("p_style", builder.style);
      setFieldValue("p_left", builder.left);
      setFieldValue("p_right", builder.right);
      setFieldValue("p_top", builder.top);
      setFieldValue("p_bottom", builder.bottom);
      setFieldValue("p_lighting", builder.lighting);
      setFieldValue("p_camera", builder.camera);
      setFieldValue("p_avoid", builder.avoid);

      setFieldValue("compiledPrompt", artwork.promptCompiled);
      setFieldValue("description", artwork.description);
      setFieldValue("title", artwork.title);
      setFieldValue("year", artwork.year);
      setFieldValue("collection", artwork.collectionName);
      setFieldValue("notes", artwork.notes);
      setFieldValue(
        "tags",
        Array.isArray(artwork.tags) ? artwork.tags.join(", ") : "",
      );

      if (artwork.promptCompiled) {
        document
          .getElementById("compiledPromptField")
          ?.classList.remove("hidden");

        document.getElementById("compiledPrompt")?.classList.add("show");
      }

      setPill("Draft · Saved");
    } catch (error) {
      console.error("Failed to load artwork:", error);
      setPill("Draft · Load failed");
    }
  }

  // Creates a draft if none exists, returns the artworkId (existing or new)
  /////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////
  async function createDraftIfNeeded() {
    // If we have an artworkId cached, verify it belongs to THIS logged-in user
    if (artworkId) {
      try {
        const check = await authFetch(`${API_BASE}/artworks/${artworkId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token()}`,
          },
          credentials: "include",
        });

        if (check.ok) return artworkId;

        // Stale/foreign/deleted draft id
        localStorage.removeItem("origin_current_artwork_id");
        artworkId = null;
      } catch (e) {
        // If check fails (server down, etc.), wipe and recreate to avoid blocking
        localStorage.removeItem("origin_current_artwork_id");
        artworkId = null;
      }
    }

    // Create a new draft
    const res = await authFetch(`${API_BASE}/artworks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
      credentials: "include",
      body: JSON.stringify(getFormData()),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create draft");

    artworkId = data.artwork._id;
    localStorage.setItem("origin_current_artwork_id", artworkId);
    return artworkId;
  }

  // Save draft: creates if needed, then PATCH updates
  // HERE IS WHERE YOU UP DATE FOR GENERATION STATUS
  ////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////
  async function saveDraft() {
    setPill("Draft · Saving…");

    const id = await createDraftIfNeeded();

    const res = await authFetch(`${API_BASE}/artworks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`,
      },
      credentials: "include",
      body: JSON.stringify(getFormData()),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save draft");

    setPill("Draft · Saved");
    return data.artwork;
  }

  // Hooks
  saveBtn?.addEventListener("click", async () => {
    try {
      await saveDraft();
    } catch (e) {
      console.warn(e);
      setPill("Draft · Unsaved");
      alert(e.message || "Save failed");
    }
  });

  previewBtn?.addEventListener("click", async () => {
    // lightweight preview hook: just save first
    try {
      const art = await saveDraft();
      alert(
        `Preview ready for: ${art.title || "(untitled)"}\nNext: open a modal/preview page.`,
      );
    } catch (e) {
      alert(e.message || "Preview failed");
    }
  });

  // UNSAVED FIELD LIST
  [
    "output",
    "p_subject",
    "p_mood",
    "p_palette",
    "p_style",
    "p_left",
    "p_right",
    "p_top",
    "p_bottom",
    "p_lighting",
    "p_camera",
    "p_avoid",
    "compiledPrompt",
    "description",
    "title",
    "year",
    "collection",
    "notes",
    "tags",
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", () => setPill("Draft · Unsaved"));
    el.addEventListener("change", () => setPill("Draft · Unsaved"));
  });

  // Load existing artwork if we have an ID
  loadExistingArtwork();
});
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

// Structured Prompt inputs
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function compilePrompt() {
  const blocks = [];

  const subject = val("p_subject");
  const mood = val("p_mood");
  const palette = val("p_palette");
  const style = val("p_style");

  const left = val("p_left");
  const right = val("p_right");
  const top = val("p_top");
  const bottom = val("p_bottom");

  const lighting = val("p_lighting");
  const camera = val("p_camera");
  const avoid = val("p_avoid");

  // Header / identity
  if (style) blocks.push(`${style}.`);
  if (subject) blocks.push(`Subject: ${subject}.`);
  if (mood) blocks.push(`Mood: ${mood}.`);
  if (palette) blocks.push(`Palette: ${palette}.`);

  // Composition
  const comp = [];
  if (left) comp.push(`Left: ${left}.`);
  if (right) comp.push(`Right: ${right}.`);
  if (top) comp.push(`Top: ${top}.`);
  if (bottom) comp.push(`Bottom: ${bottom}.`);
  if (comp.length) blocks.push(`Composition: ${comp.join(" ")}`);

  // Optics
  const optics = [];
  if (lighting) optics.push(`Lighting: ${lighting}.`);
  if (camera) optics.push(`Camera: ${camera}.`);
  if (optics.length) blocks.push(optics.join(" "));

  // Avoidances
  if (avoid) blocks.push(`Avoid: ${avoid}.`);

  // Quality defaults (optional)
  blocks.push(`High detail, coherent geometry, clean edges, no artifacts.`);

  return blocks.join("\n");
}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
//COMPILE PROMPT & COPY

// TEXTAREA TYPING EFFECT
function typeIntoTextarea(el, text, speed = 12) {
  el.value = "";
  el.classList.add("revealing");

  let i = 0;
  const interval = setInterval(() => {
    el.value += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(interval);
      el.classList.remove("revealing");
    }
  }, speed);
}

// COMPILE PROMPT BUTTON
document.getElementById("compileBtn")?.addEventListener("click", () => {
  const compiled = compilePrompt();
  const el = document.getElementById("compiledPrompt");
  const field = document.getElementById("compiledPromptField");

  if (!el || !field) return;

  field.classList.remove("hidden");
  el.classList.remove("show");
  el.value = compiled;
  el.dispatchEvent(new Event("input", { bubbles: true }));

  requestAnimationFrame(() => {
    el.classList.add("show");
  });
});

// COPY PROMPT BUTTON
document
  .getElementById("copyPromptBtn")
  ?.addEventListener("click", async () => {
    const compiledEl = document.getElementById("compiledPrompt");
    const descEl = document.getElementById("description");

    const text = (compiledEl?.value || descEl?.value || "").trim();
    if (!text) return;

    await navigator.clipboard.writeText(text);
  });

// SCROLL TO PREVIEW ON GENERATE
document.getElementById("previewPanel")?.scrollIntoView({
  behavior: "smooth",
  block: "start",
});
