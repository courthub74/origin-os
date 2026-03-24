// page checks for auth on load, then fetches dashboard data and renders the appropriate sections and states based on the response
console.log("✅ dashboard.js LOADED", new Date().toISOString());
window.__DASH_LOADED = true;


document.addEventListener("DOMContentLoaded", async () => {

  console.log("✅ dashboard DOMContentLoaded fired");
  console.log("token?", !!localStorage.getItem("origin_access"), "userRaw?", !!localStorage.getItem("origin_user"));
  console.log("[Dashboard] DOMContentLoaded, initializing dashboard...");

  const userRaw = localStorage.getItem("origin_user");
  const token = localStorage.getItem("origin_access");

  // 🔒 Hard auth guard
  if (!token || !userRaw) {
    window.location.href = "login.html";
    return;
  }

  let user;
  try {
    user = JSON.parse(userRaw);
  } catch {
    localStorage.removeItem("origin_user");
    localStorage.removeItem("origin_access");
    window.location.href = "login.html";
    return;
  }

  // Onboarding gate
  if (user.onboardingComplete === false) {
    window.location.href = "onboarding.html";
    return;
  }

  // const user = JSON.parse(localStorage.getItem("origin_user") || "{}");

  // // If user hasn't completed onboarding, send them there
  // if (user && user.onboardingComplete === false) {
  //   window.location.href = "onboarding.html";
  //   return;
  // }

  const emptyWorks = document.getElementById("emptyState");
  const activeWorks = document.getElementById("activeState");


// Helper to navigate, optionally with a workId param for context
  function navTo(go, workId) {
  if (!go) return;
  window.location.href = workId ? `${go}?workId=${workId}` : go;
}

function setBtnWithDot(btn, label) {
  if (!btn) return;
  btn.textContent = label + " ";
  const dot = document.createElement("span");
  dot.className = "dot";
  btn.appendChild(dot);
}

function renderNextAction(next) {
  const panel = document.getElementById("nextActionPanel");
  if (!panel) return;

  if (!next) {
    panel.setAttribute("hidden", "");
    return;
  }

  panel.removeAttribute("hidden");

  const kickerEl = document.getElementById("nextActionKicker");
  if (kickerEl) kickerEl.textContent = next.type === "continue" ? "Up next" : "Next";

  const titleEl = document.getElementById("nextActionTitle");
  if (titleEl) titleEl.textContent = next.title || "Untitled";

  const subEl = document.getElementById("nextActionSub");
  if (subEl) subEl.textContent = next.subtitle || "";

  const pill = document.getElementById("nextActionPill");
  if (pill) pill.textContent = next.type === "continue" ? "Priority" : "Next";

  const primary = document.getElementById("nextActionBtn");
  if (primary) {
    setBtnWithDot(primary, next.primaryCta?.label || "Continue");
    primary.onclick = () => navTo(next.primaryCta?.go || "create.html", next.workId);
  }

  const secondary = document.getElementById("nextActionAltBtn");
  if (secondary) {
    secondary.textContent = next.secondaryCta?.label || "Assign Collection";
    secondary.onclick = () => navTo(next.secondaryCta?.go || "collections.html", next.workId);
  }
}

function renderAttention(items = []) {
  const list = document.getElementById("attentionList");
  const pill = document.getElementById("attentionCount");
  if (!list) return;

  list.innerHTML = "";
  if (pill) pill.textContent = `Attention: ${items.length}`;

  if (!items.length) {
    list.innerHTML = `
      <div class="item">
        <div class="meta">
          <div class="name">All clear</div>
          <div class="sub">Nothing needs attention right now.</div>
        </div>
        <div class="tag">✅</div>
      </div>
    `;
    return;
  }

  for (const it of items.slice(0, 5)) {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div class="meta">
        <div class="name">“${it.title || "Untitled"}”</div>
        <div class="sub">${it.reason || ""}</div>
      </div>
      <div class="wm-right">
        <div class="tag">${it.tag || ""}</div>
        <button class="btn" type="button">${it.cta?.label || "Open"}</button>
      </div>
    `;
    row.querySelector("button")?.addEventListener("click", () => navTo(it.cta?.go || "create.html", it.workId));
    list.appendChild(row);
  }
}

function renderContinue(items = []) {
  const wrap = document.getElementById("continueTiles");
  if (!wrap) return;

  wrap.innerHTML = "";

  if (!items.length) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.innerHTML = `
      <div class="t">Start a new work</div>
      <div class="d">No drafts to continue yet.</div>
      <div class="go"><span>Create</span><span>↗</span></div>
    `;
    tile.addEventListener("click", () => navTo("create.html"));
    wrap.appendChild(tile);
    return;
  }

  for (const it of items) {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.innerHTML = `
      <div class="t">“${it.title || "Untitled"}”</div>
      <div class="d">Last edited · ${it.lastEditedText || ""}</div>
      <div class="go"><span>Continue</span><span>↗</span></div>
    `;
    tile.addEventListener("click", () => navTo("create.html", it.workId));
    wrap.appendChild(tile);
  }
}

// Renders the Recent Activity list, which is a simple feed of recent work edits with no required order or actions
// function renderRecent(items = []) {
//   const list = document.getElementById("recentActivityList");
//   if (!list) return;

//   list.innerHTML = "";

//   if (!items.length) {
//     list.innerHTML = `
//       <div class="item">
//         <div class="meta">
//           <div class="name">No activity yet</div>
//           <div class="sub">Create or edit a work to see history here.</div>
//         </div>
//         <div class="tag">—</div>
//       </div>
//     `;
//     return;
//   }

//   for (const it of items) {
//     const row = document.createElement("div");
//     row.className = "item";
//     row.dataset.workId = it.workId || "";
//     row.dataset.imageFileId = it.imageFileId || "";
//     row.dataset.thumbUrl = it.thumbUrl || "";
//     row.dataset.originalUrl = it.originalUrl || "";

//     row.innerHTML = `
//       <div class="meta">
//         <div class="name">“${it.title || "Untitled"}”</div>
//         <div class="sub">${it.subtitle || ""}</div>
//       </div>
//       <div class="tag">${it.type || ""}</div>
//     `;

//     list.appendChild(row);
//   }
// }

  const quickActionsPanel = document.getElementById("quickActionsPanel");
  const recentActivityPanel = document.getElementById("recentActivityPanel");
  const emptyQuickActionsSlot = document.getElementById("emptyQuickActionsSlot");

  // Sanity check: ensure we have the main panels to toggle between
  console.log("[Dashboard] emptyWorks?", !!emptyWorks, "activeWorks?", !!activeWorks);

  // Initial state: show empty until we know otherwise
  if (!emptyWorks || !activeWorks) return;

  const API_BASE = "http://localhost:4000";

  // Uses localStorage access token (auth-guard should keep this fresh)
  function getAccessToken(){
    return localStorage.getItem("origin_access");
  }

  async function fetchDashboard(){
    const token = getAccessToken();
    if (!token) throw new Error("Missing token");

    const res = await fetch(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include"
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load dashboard");
    return data;
}



  function setKpiValue(label, value){
    // Finds the KPI by its label text ("Works", "Collections", "Drops") and updates the number above it
    const kpis = document.querySelectorAll(".kpi");
    kpis.forEach(kpi => {
      const lab = kpi.querySelector(".kpi-label");
      const val = kpi.querySelector(".kpi-value");
      if (!lab || !val) return;
      if (lab.textContent.trim().toLowerCase() === label.toLowerCase()) {
        val.textContent = String(value);
      }
    });
  }

  // Explicit state handler to avoid toggle bugs and ensure consistent panel visibility rules
  function showState(worksCount){
    const showEmpty = Number(worksCount) === 0;

    console.log("[showState] worksCount =", worksCount, "showEmpty =", showEmpty);

    if (showEmpty) {
      emptyWorks.removeAttribute("hidden");
      activeWorks.setAttribute("hidden", "");
    } else {
      activeWorks.removeAttribute("hidden");
      emptyWorks.setAttribute("hidden", "");
    }

    // Quick Actions always visible
    if (quickActionsPanel) quickActionsPanel.removeAttribute("hidden");

    // Recent Activity hidden only when empty
    if (recentActivityPanel) {
      if (showEmpty) recentActivityPanel.setAttribute("hidden", "");
      else recentActivityPanel.removeAttribute("hidden");
    }

    console.log("[showState] after:", {
      emptyHidden: emptyWorks.hasAttribute("hidden"),
      activeHidden: activeWorks.hasAttribute("hidden"),
    });
  }

    let dash;

    try {
      dash = await fetchDashboard();
    } catch (err) {
      console.warn("[Dashboard] Fetch failed:", err.message);

      // Only fetch failures should zero everything
      setKpiValue("Works", 0);
      setKpiValue("Collections", 0);
      setKpiValue("Drops", 0);
      showState(0);
      return;
    }

    const stats = dash.stats || { works: 0, collections: 0, drops: 0 };
    
    // Initial state: show empty until we know otherwise
    console.log("[Dashboard] stats =", stats);

    setKpiValue("Works", stats.works ?? 0);
    setKpiValue("Collections", stats.collections ?? 0);
    setKpiValue("Drops", stats.drops ?? 0);
    showState(stats.works ?? 0);

    // Additional debug logs to verify data structure
    console.log("[Dashboard] stats.works =", stats.works);

    // Render sections, but don't allow ONE render bug to wipe the whole UI
    try { renderNextAction(dash.nextAction); } catch(e){ console.warn("renderNextAction failed:", e); }
    try { renderAttention(dash.attention); } catch(e){ console.warn("renderAttention failed:", e); }
    try { renderContinue(dash.continue); } catch(e){ console.warn("renderContinue failed:", e); }
    try { renderRecent(dash.recent); } catch(e){ console.warn("renderRecent failed:", e); }

   


    /////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////
    ///////////////////MODAL SETUP FOR RECENT ACTIVITY ITEMS - shows a preview and option to edit when clicking on a recent item with type "Generated" (indicating it was created via AI and may need user edits before publishing)
    /////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////
    /* =========================
      Recent Activity Modal
    ========================= */

    const activityModal = document.getElementById("activityModal");
    const activityModalBackdrop = document.getElementById("activityModalBackdrop");
    const activityModalClose = document.getElementById("activityModalClose");
    const activityModalCancel = document.getElementById("activityModalCancel");
    const activityModalEdit = document.getElementById("activityModalEdit");

    const activityModalMedia = document.getElementById("activityModalMedia");
    const activityModalTitle = document.getElementById("activityModalTitle");
    const activityModalSubtitle = document.getElementById("activityModalSubtitle");
    const activityModalPill = document.getElementById("activityModalPill");

    let activeRecentWork = null;


    /* =========================
      Helpers
    ========================= */

    function getRecentImageSrc(item) {
      if (item.imageFileId) {
        return `${API_BASE}/api/images/${item.imageFileId}`;
      }

      return (
        item.thumbUrl ||
        item.originalUrl ||
        item.imageUrl ||
        item.image ||
        item.previewUrl ||
        item.thumbnailUrl ||
        item.artworkUrl ||
        null
      );
    }


    /* =========================
      Actions
    ========================= */

    function closeActivityModal() {
      if (!activityModal) return;

      activityModal.classList.add("hidden");
      activityModal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    async function openActivityModal(item) {
      if (!activityModal) return;

      activeRecentWork = item;

      // Title
      if (activityModalTitle) {
        activityModalTitle.textContent = item.title || "Artwork Preview";
      }

      // Subtitle
      if (activityModalSubtitle) {
        activityModalSubtitle.textContent =
          item.subtitle || "Recently generated artwork.";
      }

      // Status pill
      if (activityModalPill) {
        activityModalPill.textContent = item.type || "Generated";
      }

      // Image
      if (activityModalMedia) {
        const imageSrc = getRecentImageSrc(item);

        if (imageSrc) {
          activityModalMedia.innerHTML = `
            <img
              src="${imageSrc}"
              alt="${item.title || "Artwork preview"}"
              class="activity-preview-image"
            />
          `;
        } else {
          activityModalMedia.innerHTML = `
            <span class="activity-modal-placeholder">
              No preview image available for this activity yet.
            </span>
          `;
        }
      }

      // Open modal
      activityModal.classList.remove("hidden");
      activityModal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }


    /* =========================
      Init Modal
    ========================= */

    function initActivityModal() {
      // Close buttons
      activityModalClose?.addEventListener("click", closeActivityModal);
      activityModalCancel?.addEventListener("click", closeActivityModal);
      activityModalBackdrop?.addEventListener("click", closeActivityModal);

      // ESC key
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && activityModal && !activityModal.classList.contains("hidden")) {
          closeActivityModal();
        }
      });

      // CLICK HANDLER (THIS WAS MISSING 🔥)
      document.getElementById("recentActivityList")?.addEventListener("click", (e) => {
        const row = e.target.closest(".item");
        if (!row) return;

        const item = {
          workId: row.dataset.workId || "",
          imageFileId: row.dataset.imageFileId || "",
          thumbUrl: row.dataset.thumbUrl || "",
          originalUrl: row.dataset.originalUrl || "",
          title: row.querySelector(".name")?.textContent?.replace(/[“”"]/g, "") || "Untitled",
          subtitle: row.querySelector(".sub")?.textContent || "",
          type: row.querySelector(".tag")?.textContent || "Generated"
        };

        openActivityModal(item);
      });

      // Edit button
      activityModalEdit?.addEventListener("click", () => {
        if (!activeRecentWork?.workId) return;

        window.location.href = `create.html?id=${encodeURIComponent(activeRecentWork.workId)}`;
      });
    }


    /* =========================
      Render Recent Activity
    ========================= */

    function renderRecent(items = []) {
      const list = document.getElementById("recentActivityList");
      if (!list) return;

      list.innerHTML = "";

      for (const it of items) {
        const row = document.createElement("div");
        row.className = "item";

        // 🔥 DATA PIPELINE (critical)
        row.dataset.workId = it.workId || "";
        row.dataset.imageFileId = it.imageFileId || "";
        row.dataset.thumbUrl = it.thumbUrl || "";
        row.dataset.originalUrl = it.originalUrl || "";

        row.innerHTML = `
          <div class="meta">
            <div class="name">“${it.title || "Untitled"}”</div>
            <div class="sub">${it.subtitle || ""}</div>
          </div>
          <div class="tag">${it.type || ""}</div>
        `;

        list.appendChild(row);
      }
    }

     initActivityModal();
});
