// profile-menu.js
document.addEventListener("DOMContentLoaded", async () => {
  console.log("profile-menu.js loaded");

  const accountFooter = document.querySelector(".account-footer");
  if (!accountFooter) return;

  const accountBtn = accountFooter.querySelector("#accountBtn");
  const accountMenu = accountFooter.querySelector("#accountMenu");
  if (!accountBtn || !accountMenu) return;

  const API_BASE = "http://localhost:4000";

   
  // ✅ IMPORTANT: scoped selectors (only inside the account button)
  const nameEl = accountBtn.querySelector(".account-name");
  const roleEl = accountBtn.querySelector(".account-role");
  const avatarImg = accountBtn.querySelector(".user_avatar");

  async function hydrateAccountMeta() {
    try {
      const token = localStorage.getItem("origin_access");
      if (!token) return;

      // Fetch fresh user data from server to get latest avatarUrl
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include"
      });

      if (!res.ok) throw new Error("Failed to fetch user data");

      const data = await res.json();
      const user = data.user || data;

      console.log("USER FROM API:", user);

      const displayName = user.displayName || user.name || user.email || "Account";
      const role = user.rolePrimary || user.role || user.accountRole || "";

      if (nameEl) nameEl.textContent = displayName;
      if (roleEl) roleEl.textContent = role;

      // Load avatar from database
      // Load avatar from database (normalize URL)
      if (avatarImg && user.avatarUrl) {
        const raw = user.avatarUrl;

        const resolved =
        raw.startsWith("http://") ||
        raw.startsWith("https://") ||
        raw.startsWith("data:")          // ✅ ADD THIS
          ? raw
          : raw.startsWith("/")
            ? `${API_BASE}${raw}`
            : `${API_BASE}/${raw}`;
            console.log("Resolved avatar URL:", resolved);

            avatarImg.src = resolved;
          }


      // Update localStorage with latest user data
      localStorage.setItem("origin_user", JSON.stringify(user));
    } catch (err) {
      console.error("Error hydrating account meta:", err);
    }
  }

  await hydrateAccountMeta();

  function closeAccountMenu() {
    accountMenu.classList.remove("show");
    accountBtn.setAttribute("aria-expanded", "false");
  }

  function openAccountMenu() {
    accountMenu.classList.add("show");
    accountBtn.setAttribute("aria-expanded", "true");
  }

  function toggleAccountMenu() {
    const isOpen = accountMenu.classList.contains("show");
    isOpen ? closeAccountMenu() : openAccountMenu();
  }

  async function logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch {}

    localStorage.removeItem("origin_access");
    localStorage.removeItem("origin_user");
    localStorage.removeItem("origin_current_artwork_id"); // ✅ clear stale draft


    // If your login file path differs, adjust:
    window.location.href = "index.html";
  }

  // Button toggles menu
  accountBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleAccountMenu();
  });

  // Menu click: navigate OR logout
  accountMenu.addEventListener("click", async (e) => {
    e.stopPropagation();

    const btn = e.target.closest("button");
    if (!btn) return;

    // Logout action
    if (btn.dataset.action === "logout") {
      closeAccountMenu();
      await logout();
      return;
    }

    // Normal navigation
    const go = btn.dataset.go;
    if (go) {
      closeAccountMenu();
      window.location.href = go;
    }
  });

  // Click outside closes
  document.addEventListener("click", (e) => {
    if (!accountMenu.classList.contains("show")) return;
    if (accountFooter.contains(e.target)) return;
    closeAccountMenu();
  });

  // Escape closes (only once)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAccountMenu();
  });
});
