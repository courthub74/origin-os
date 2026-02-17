document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "http://localhost:4000";

  function sizeFromOutput(output) {
    if (output === "portrait") return "1024x1536";
    if (output === "landscape") return "1536x1024";
    return "1024x1024";
  }

  async function generateImageFromPrompt() {
    const output = document.getElementById("output")?.value || "square";
    const prompt = document.getElementById("compiledPrompt")?.value?.trim() ||
                 document.getElementById("description")?.value?.trim();

  if (!prompt || prompt.length < 10) {
    throw new Error("Compile a prompt before generating.");
  }

  // Optional: UI state
  const stage = document.getElementById("previewStage");
  stage.innerHTML = "<span>Generating…</span>";

    // make sure draft exists first
    const id = await createDraftIfNeeded();
    console.log("CLIENT DEBUG artworkId =", id);


    const res = await fetch(`${API_BASE}/api/images/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`
      },
      credentials: "include",
      body: JSON.stringify({
        artworkId: id,
        prompt,
        size: sizeFromOutput(output),
        format: "png"
      })
    });



    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Generation failed");

    // const stage = document.getElementById("previewStage");
    stage.innerHTML = "";

    const img = document.createElement("img");
    img.alt = "Generated artwork";
    img.src = `data:${data.mimeType};base64,${data.base64}`;
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";

    stage.appendChild(img);
  }

  document.getElementById("generateBtn")?.addEventListener("click", () => {
    generateImageFromPrompt().catch(err => {
      console.error(err);
      alert(err.message);
    });
  });


  const saveBtn = document.getElementById("saveDraftBtn");
  const previewBtn = document.getElementById("previewBtn");
  const pill = document.querySelector(".topRight .pill"); // "Draft · Unsaved"

  // We'll store current draft id here
  let artworkId = localStorage.getItem("origin_current_artwork_id") || null;

  function token() {
    return localStorage.getItem("origin_access");
  }

  function setPill(text) {
    if (pill) pill.textContent = text;
  }

  function getFormData() {
    const tagsRaw = (document.getElementById("tags")?.value || "").trim();
    const tags = tagsRaw
      ? tagsRaw.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    return {
      output: document.getElementById("output")?.value || "square",
      description: document.getElementById("description")?.value || "",
      title: document.getElementById("title")?.value || "",
      year: document.getElementById("year")?.value || "",
      collection: document.getElementById("collection")?.value || "",
      notes: document.getElementById("notes")?.value || "",
      tags
    };
  }

  // Creates a draft if none exists, returns the artworkId (existing or new)
  /////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////
  async function createDraftIfNeeded() {
    // If we have an artworkId cached, verify it belongs to THIS logged-in user
    if (artworkId) {
      try {
        const check = await fetch(`${API_BASE}/artworks/${artworkId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token()}`
          },
          credentials: "include"
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
    const res = await fetch(`${API_BASE}/artworks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`
      },
      credentials: "include",
      body: JSON.stringify(getFormData())
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

    const res = await fetch(`${API_BASE}/artworks/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token()}`
      },
      credentials: "include",
      body: JSON.stringify(getFormData())
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
      alert(`Preview ready for: ${art.title || "(untitled)"}\nNext: open a modal/preview page.`);
    } catch (e) {
      alert(e.message || "Preview failed");
    }
  });

  // Optional: mark unsaved when typing
  ["output", "description", "title", "year", "collection", "notes", "tags"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => setPill("Draft · Unsaved"));
    el.addEventListener("change", () => setPill("Draft · Unsaved"));
  });

  // If a draft exists, show saved state
  if (artworkId) setPill("Draft · Saved");
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

document.getElementById("compileBtn")?.addEventListener("click", () => {
  const compiled = compilePrompt();
  const el = document.getElementById("compiledPrompt");

  if (!el) return;

  el.classList.remove("show");
  el.value = compiled;

  requestAnimationFrame(() => {
    el.classList.add("show");
  });
});



document.getElementById("copyPromptBtn")?.addEventListener("click", async () => {
  const compiledEl = document.getElementById("compiledPrompt");
  const descEl = document.getElementById("description");

  const text = (compiledEl?.value || descEl?.value || "").trim();
  if (!text) return;

  await navigator.clipboard.writeText(text);
});




