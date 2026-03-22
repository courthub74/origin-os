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
function renderRecent(items = []) {
  const list = document.getElementById("recentActivityList");
  if (!list) return;

  list.innerHTML = "";

  if (!items.length) {
    list.innerHTML = `
      <div class="item">
        <div class="meta">
          <div class="name">No activity yet</div>
          <div class="sub">Create or edit a work to see history here.</div>
        </div>
        <div class="tag">—</div>
      </div>
    `;
    return;
  }

  const recentThree = [...items]
    .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
    .slice(0, 3);

  for (const it of recentThree) {
    const row = document.createElement("div");
    row.className = "item";

    const title = it.title || "Untitled";
    const subtitle = it.subtitle || "";
    const type = it.type || "";
    const imageUrl = it.imageUrl || it.previewUrl || it.url || "";
    const workId = it.workId || "";

    const isImageActivity =
      type.toLowerCase() === "image" ||
      type.toLowerCase() === "generated" ||
      !!imageUrl;

    if (isImageActivity && imageUrl) {
      row.innerHTML = `
        <a
          href="${imageUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="recent-thumb-link"
          aria-label="Open image for ${title}"
        >
          <img src="${imageUrl}" alt="${title}" class="recent-thumb" />
        </a>

        <div class="meta">
          <div class="name">“${title}”</div>
          <div class="sub">${subtitle}</div>
        </div>

        <div class="wm-right">
          <div class="tag">${type}</div>
          <button class="btn" type="button">Open</button>
        </div>
      `;

      row.querySelector("button")?.addEventListener("click", () => {
        if (workId) {
          navTo("create.html", workId);
        } else {
          window.open(imageUrl, "_blank", "noopener,noreferrer");
        }
      });
    } else {
      row.innerHTML = `
        <div class="meta">
          <div class="name">“${title}”</div>
          <div class="sub">${subtitle}</div>
        </div>
        <div class="tag">${type}</div>
      `;
    }

    list.appendChild(row);
  }
}


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

  // REPLACE BELOW WITH REAL FETCH DASHBOARD STATS CALL
  // async function fetchStats(){
  //   const token = getAccessToken();
  //   if (!token) throw new Error("Missing token");

  //   const res = await fetch(`${API_BASE}/stats`, {
  //     headers: { Authorization: `Bearer ${token}` },
  //     credentials: "include"
  //   });

  //   const data = await res.json();
  //   if (!res.ok) throw new Error(data.error || "Failed to load stats");
  //   return data.stats;
  // }

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

  // function showState(worksCount){
  //   const showEmpty = worksCount === 0;

  //   // Debug logs to trace state changes
  //   console.log("[Dashboard] showState called with:", worksCount);

  //   // Toggle the two states
  //   emptyWorks.toggleAttribute("hidden", !showEmpty);
  //   activeWorks.toggleAttribute("hidden", showEmpty);

  //   // Keep Quick Actions visible in both, hide Recent Activity when empty
  //   if (quickActionsPanel) quickActionsPanel.toggleAttribute("hidden", false);
  //   if (recentActivityPanel) recentActivityPanel.toggleAttribute("hidden", showEmpty);

  //   // Move Quick Actions into empty right column when empty
  //   if (showEmpty && quickActionsPanel && emptyQuickActionsSlot) {
  //     emptyQuickActionsSlot.appendChild(quickActionsPanel);
  //   } else {
  //     const grid = document.querySelector(".content .grid");
  //     if (grid && quickActionsPanel) grid.appendChild(quickActionsPanel);
  //   }

  //   console.log("[Dashboard] worksCount:", worksCount, "showEmpty:", showEmpty);
  // }
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

});
