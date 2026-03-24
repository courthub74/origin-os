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

  const activityModal = document.getElementById("activityModal");
  const activityModalBackdrop = document.getElementById("activityModalBackdrop");
  const activityModalClose = document.getElementById("activityModalClose");
  const activityModalCancel = document.getElementById("activityModalCancel");
  const activityModalEdit = document.getElementById("activityModalEdit");
  const activityModalMedia = document.getElementById("activityModalMedia");
  const activityModalTitle = document.getElementById("activityModalTitle");
  const activityModalSubtitle = document.getElementById("activityModalSubtitle");
  const activityModalPill = document.getElementById("activityModalPill");

  let allItems = [];
  let activeFilter = "all";
  let activeRecentWork = null;
  let activePreviewObjectUrl = null;

  function getAccessToken() {
    return localStorage.getItem("origin_access");
  }

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

  function cleanupPreviewObjectUrl() {
    if (activePreviewObjectUrl) {
      URL.revokeObjectURL(activePreviewObjectUrl);
      activePreviewObjectUrl = null;
    }
  }

  function getFallbackRecentImageSrc(item) {
    return (
      item.thumbUrl ||
      item.originalUrl ||
      item.imageUrl ||
      item.image ||
      item.previewUrl ||
      item.thumbnailUrl ||
      item.artworkUrl ||
      item.url ||
      null
    );
  }

  async function loadRecentImageSrc(item) {
    if (item.imageFileId) {
      const accessToken = getAccessToken();
      if (!accessToken) throw new Error("Missing token for image fetch");

      const res = await fetch(`${API_BASE}/api/images/${item.imageFileId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        credentials: "include"
      });

      if (!res.ok) {
        throw new Error(`Image fetch failed: ${res.status}`);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      activePreviewObjectUrl = objectUrl;
      return objectUrl;
    }

    return getFallbackRecentImageSrc(item);
  }

  function closeActivityModal() {
    if (!activityModal) return;

    activityModal.classList.add("hidden");
    activityModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    cleanupPreviewObjectUrl();
  }

  async function openActivityModal(item) {
    if (!activityModal) return;

    activeRecentWork = item;

    if (activityModalTitle) {
      activityModalTitle.textContent = item.title || "Artwork Preview";
    }

    if (activityModalSubtitle) {
      activityModalSubtitle.textContent =
        item.subtitle || "Recently generated artwork.";
    }

    if (activityModalPill) {
      activityModalPill.textContent = item.type || "Generated";
    }

    if (activityModalMedia) {
      activityModalMedia.innerHTML = `
        <span class="activity-modal-placeholder">Loading preview...</span>
      `;
    }

    activityModal.classList.remove("hidden");
    activityModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    try {
      cleanupPreviewObjectUrl();

      const imageSrc = await loadRecentImageSrc(item);

      if (!activityModalMedia) return;

      if (imageSrc) {
        activityModalMedia.innerHTML = `
          <img
            src="${imageSrc}"
            alt="${escapeAttr(item.title || "Artwork preview")}"
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
    } catch (err) {
      console.error("[Activity Modal] Failed to load preview image:", err);

      if (activityModalMedia) {
        activityModalMedia.innerHTML = `
          <span class="activity-modal-placeholder">
            Failed to load preview image.
          </span>
        `;
      }
    }
  }

  function shouldOpenModal(item) {
    return Boolean(
      item.imageFileId ||
      item.thumbUrl ||
      item.originalUrl ||
      item.imageUrl ||
      item.previewUrl ||
      item.url
    );
  }

  function render(items) {
    if (!timeline || !countPill) return;

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

      const rows = group.items.map((item) => {
        const title = item.title || "Untitled";
        const subtitle = item.subtitle || item.description || "";
        const type = item.type || "Activity";
        const dateText = formatDateLabel(item.createdAt || item.updatedAt || new Date().toISOString());

        return `
          <button
            class="activity-row activity-row-button"
            type="button"
            data-target-url="${escapeAttr(item.targetUrl || "")}"
            data-work-id="${escapeAttr(item.workId || "")}"
            data-image-file-id="${escapeAttr(item.imageFileId || "")}"
            data-thumb-url="${escapeAttr(item.thumbUrl || "")}"
            data-original-url="${escapeAttr(item.originalUrl || "")}"
            data-image-url="${escapeAttr(item.imageUrl || item.previewUrl || item.url || "")}"
            data-title="${escapeAttr(title)}"
            data-subtitle="${escapeAttr(subtitle)}"
            data-type="${escapeAttr(type)}"
            aria-label="Open activity for ${escapeAttr(title)}"
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
  }

  function bindTimelineClicks() {
    if (!timeline) return;

    timeline.addEventListener("click", async (e) => {
      const row = e.target.closest(".activity-row-button");
      if (!row) return;

      const item = {
        targetUrl: row.dataset.targetUrl || "",
        workId: row.dataset.workId || "",
        imageFileId: row.dataset.imageFileId || "",
        thumbUrl: row.dataset.thumbUrl || "",
        originalUrl: row.dataset.originalUrl || "",
        imageUrl: row.dataset.imageUrl || "",
        title: row.dataset.title || "Untitled",
        subtitle: row.dataset.subtitle || "",
        type: row.dataset.type || "Activity"
      };

      if (shouldOpenModal(item)) {
        await openActivityModal(item);
        return;
      }

      if (item.targetUrl) {
        window.location.href = item.targetUrl;
        return;
      }

      if (item.workId) {
        window.location.href = `create.html?workId=${encodeURIComponent(item.workId)}`;
      }
    });
  }

  function initActivityModal() {
    activityModalClose?.addEventListener("click", closeActivityModal);
    activityModalCancel?.addEventListener("click", closeActivityModal);
    activityModalBackdrop?.addEventListener("click", closeActivityModal);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && activityModal && !activityModal.classList.contains("hidden")) {
        closeActivityModal();
      }
    });

    activityModalEdit?.addEventListener("click", () => {
      if (!activeRecentWork?.workId) return;
      window.location.href = `create.html?workId=${encodeURIComponent(activeRecentWork.workId)}`;
    });
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
    if (timeline) {
      timeline.innerHTML = `
        <div class="activity-empty">
          <div class="activity-empty-title">Could not load activity</div>
          <div class="activity-empty-sub">${escapeHtml(err.message)}</div>
        </div>
      `;
    }
  }

  bindTimelineClicks();
  initActivityModal();

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      console.log("CLICKED ITEM:", item);
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      activeFilter = btn.dataset.filter;
      const filtered = allItems.filter((item) => matchesFilter(item, activeFilter));
      render(filtered);
    });
  });
});