document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("origin_access");
  const userRaw = localStorage.getItem("origin_user");

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

  if (user.onboardingComplete === false) {
    window.location.href = "onboarding.html";
    return;
  }

  const API_BASE = "http://localhost:4000";
  const timeline = document.getElementById("activityTimeline");
  const countPill = document.getElementById("activityCountPill");
  const filterButtons = document.querySelectorAll(".filter-btn");

  let allItems = [];
  let activeFilter = "all";

  function normalizeType(type = "") {
    return String(type).trim().toLowerCase();
  }

  function formatMonthLabel(dateInput) {
    const d = new Date(dateInput);
    return d.toLocaleString("en-US", { month: "long", year: "numeric" });
  }

  function formatDateLabel(dateInput) {
    const d = new Date(dateInput);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  function groupByMonth(items) {
    const groups = {};

    for (const item of items) {
      const sourceDate = item.createdAt || item.updatedAt || new Date().toISOString();
      const monthKey = new Date(sourceDate).toISOString().slice(0, 7);

      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(item);
    }

    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([monthKey, monthItems]) => ({
        monthKey,
        label: formatMonthLabel(monthItems[0].createdAt || monthItems[0].updatedAt),
        items: monthItems.sort((a, b) => {
          const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
          const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
          return bTime - aTime;
        })
      }));
  }

  function matchesFilter(item, filter) {
    if (filter === "all") return true;

    const type = normalizeType(item.type);

    if (filter === "generated") return type === "generated" || type === "image";
    if (filter === "draft") return type === "draft" || type === "saved";
    if (filter === "collection") return type === "collection";
    if (filter === "publish") return type === "published" || type === "publish";
    if (filter === "drop") return type === "drop" || type === "scheduled drop";
    if (filter === "social") return type === "social" || type === "caption";

    return true;
  }

  function render(items) {
  timeline.innerHTML = "";

  countPill.textContent = `${items.length} Item${items.length === 1 ? "" : "s"}`;

  if (!items.length) {
    timeline.innerHTML = `
      <div class="activity-empty">
        <div class="activity-empty-title">No matching activity</div>
        <div class="activity-empty-sub">Try another filter or create something new.</div>
      </div>
    `;
    return;
  }

  const groups = groupByMonth(items);

  for (const group of groups) {
    const section = document.createElement("section");
    section.className = "activity-month";

    const rows = group.items.map(item => {
      const title = item.title || "Untitled";
      const subtitle = item.subtitle || item.description || "";
      const type = item.type || "Activity";
      const dateText = formatDateLabel(item.createdAt || item.updatedAt || new Date().toISOString());
      const imageUrl = item.imageUrl || item.previewUrl || item.url || "";
      const targetUrl = item.targetUrl || "";
      const workId = item.workId || "";

      return `
        <button
          class="activity-row activity-row-button"
          type="button"
          data-target-url="${escapeAttr(targetUrl)}"
          data-work-id="${escapeAttr(workId)}"
          data-image-url="${escapeAttr(imageUrl)}"
          aria-label="Open activity for ${escapeHtml(title)}"
        >
          <div class="activity-meta">
            <div class="activity-title">“${escapeHtml(title)}”</div>
            <div class="activity-sub">${escapeHtml(subtitle)}</div>
            <div class="activity-date">${escapeHtml(dateText)}</div>
          </div>

          <div class="activity-pill-wrap">
            <span class="pill">${escapeHtml(type)}</span>
          </div>
        </button>
      `;
    }).join("");

    section.innerHTML = `
      <div class="activity-month-head">
        <div class="activity-month-title">${group.label}</div>
        <div class="activity-month-count">${group.items.length} item${group.items.length === 1 ? "" : "s"}</div>
      </div>
      <div class="activity-list">
        ${rows}
      </div>
    `;

    timeline.appendChild(section);
  }

  timeline.querySelectorAll(".activity-row-button").forEach(row => {
    row.addEventListener("click", () => {
      const targetUrl = row.dataset.targetUrl;
      const workId = row.dataset.workId;
      const imageUrl = row.dataset.imageUrl;

      if (targetUrl) {
        window.location.href = targetUrl;
      } else if (workId) {
        window.location.href = `create.html?workId=${encodeURIComponent(workId)}`;
      } else if (imageUrl) {
        window.open(imageUrl, "_blank", "noopener,noreferrer");
      }
    });
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value = "") {
  return escapeHtml(value);
}

  async function fetchDashboard() {
    const res = await fetch(`${API_BASE}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include"
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load dashboard");
    return data;
  }

  try {
    const dash = await fetchDashboard();
    allItems = Array.isArray(dash.recent) ? dash.recent : [];
    render(allItems);
  } catch (err) {
    timeline.innerHTML = `
      <div class="activity-empty">
        <div class="activity-empty-title">Could not load activity</div>
        <div class="activity-empty-sub">${err.message}</div>
      </div>
    `;
  }

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      activeFilter = btn.dataset.filter;
      const filtered = allItems.filter(item => matchesFilter(item, activeFilter));
      render(filtered);
    });
  });
});