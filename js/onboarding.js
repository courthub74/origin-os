// onboarding.js
const API_BASE = "http://localhost:4000";

const state = {
  rolePrimary: "",
  focus: "",
  avatarFile: null,
  displayName: "",
  brandName: "",
  links: {
    website: "",
    x: "",
    instagram: "",
    opensea: "",
    xrpcafe: ""
  }
};

function $(id){ return document.getElementById(id); }

function showNotice(msg){
  const n = $("notice");
  n.textContent = msg;
  n.hidden = !msg;
}

function setStep(step){
  const s1 = $("step1");
  const s2 = $("step2");
  const dot1 = $("dot1");
  const dot2 = $("dot2");
  const label = $("stepLabel");

  if (step === 1){
    s1.hidden = false;
    s2.hidden = true;
    dot1.classList.add("on");
    dot2.classList.remove("on");
    label.textContent = "Step 1";
  } else {
    s1.hidden = true;
    s2.hidden = false;
    dot1.classList.remove("on");
    dot2.classList.add("on");
    label.textContent = "Step 2";
  }

  showNotice("");
}

function getAccessToken(){
  return localStorage.getItem("origin_access") || "";
}

function authHeaders(){
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function pickRole(role){
  state.rolePrimary = role;

  document.querySelectorAll("[data-role]").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.role === role);
  });
}

function pickFocus(focus){
  state.focus = focus;

  document.querySelectorAll("[data-focus]").forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.focus === focus);
  });
}

function setAvatarPreview(file){
  const img = $("avatarPreviewImg");
  const fallback = $("avatarFallback");

  if (!file){
    img.src = "";
    img.style.display = "none";
    fallback.style.display = "flex";
    return;
  }

  const url = URL.createObjectURL(file);
  img.src = url;
  img.onload = () => URL.revokeObjectURL(url);
  img.style.display = "block";
  fallback.style.display = "none";
}

async function uploadAvatarIfAny(){
  if (!state.avatarFile) return "";

  const fd = new FormData();
  fd.append("avatar", state.avatarFile);

  const res = await fetch(`${API_BASE}/users/me/avatar`, {
    method: "POST",
    credentials: "include",
    headers: {
      ...authHeaders()
    },
    body: fd
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw (data.error || "Avatar upload failed.");

  return data.avatarUrl || "";
}

async function saveOnboarding(){
  const payload = {
    displayName: state.displayName,
    rolePrimary: state.rolePrimary,
    roles: state.rolePrimary ? [state.rolePrimary] : [],
    brandName: state.brandName,
    focus: state.focus,
    links: state.links
  };

  const res = await fetch(`${API_BASE}/users/me/onboarding`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders()
    },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw (data.error || "Onboarding save failed.");

  return data.user;
}

function hydrateSignedInLabel(){
  const cached = JSON.parse(localStorage.getItem("origin_user") || "{}");
  $("whoName").textContent = cached.displayName || cached.name || "Signed in";
  $("whoEmail").textContent = cached.email || "—";

  // Prefill display name if present
  if (cached.displayName && !$("displayName").value) {
    $("displayName").value = cached.displayName;
    state.displayName = cached.displayName;
  }
}

function wireAccountMenu(){
  const accountFooter = document.querySelector(".account-footer");
  if (!accountFooter) return;

  const accountBtn = $("accountBtn");
  const accountMenu = $("accountMenu");

  function close(){
    accountMenu.classList.remove("show");
    accountBtn.setAttribute("aria-expanded", "false");
  }

  accountBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = accountMenu.classList.toggle("show");
    accountBtn.setAttribute("aria-expanded", String(isOpen));
  });

  accountMenu.addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.target.closest("[data-go]");
    if (!btn) return;
    close();
    window.location.href = btn.dataset.go;
  });

  document.addEventListener("click", (e) => {
    if (!accountMenu.classList.contains("show")) return;
    if (accountFooter.contains(e.target)) return;
    close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Basic guard: if not logged in, go back
  if (!getAccessToken()){
    window.location.href = "index.html";
    return;
  }

  hydrateSignedInLabel();
  wireAccountMenu();

  // Step 1 interactions
  document.querySelectorAll("[data-role]").forEach(btn => {
    btn.addEventListener("click", () => pickRole(btn.dataset.role));
  });

  document.querySelectorAll("[data-focus]").forEach(btn => {
    btn.addEventListener("click", () => pickFocus(btn.dataset.focus));
  });

  $("btnContinue").addEventListener("click", () => {
    if (!state.rolePrimary) return showNotice("Choose a primary role to continue.");
    if (!state.focus) return showNotice("Choose a focus to continue.");

    // Pre-fill display name from stored user if empty
    const cached = JSON.parse(localStorage.getItem("origin_user") || "{}");
    const pref = cached.displayName || "";
    if (!$("displayName").value && pref) {
      $("displayName").value = pref;
      state.displayName = pref;
    }

    setStep(2);
  });

  $("btnSkip1").addEventListener("click", () => {
    // Keep onboarding incomplete; allow later from dashboard settings
    window.location.href = "dashboard.html";
  });

  // Step 2 interactions
  $("btnBack").addEventListener("click", () => setStep(1));
  $("btnSkip2").addEventListener("click", () => window.location.href = "dashboard.html");

  $("avatarInput").addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;

    // Basic size guard (2MB)
    if (f.size > 2 * 1024 * 1024){
      e.target.value = "";
      showNotice("Avatar too large. Max 2MB.");
      return;
    }

    state.avatarFile = f;
    setAvatarPreview(f);
  });

  $("displayName").addEventListener("input", (e) => {
    state.displayName = e.target.value;
  });

  $("brandName").addEventListener("input", (e) => {
    state.brandName = e.target.value;
  });

  // Links
  $("linkWebsite").addEventListener("input", (e) => state.links.website = e.target.value);
  $("linkX").addEventListener("input", (e) => state.links.x = e.target.value);
  $("linkIG").addEventListener("input", (e) => state.links.instagram = e.target.value);
  $("linkOpenSea").addEventListener("input", (e) => state.links.opensea = e.target.value);
  $("linkXRPCafe").addEventListener("input", (e) => state.links.xrpcafe = e.target.value);

  $("btnFinish").addEventListener("click", async () => {
    const btn = $("btnFinish");
    btn.disabled = true;
    btn.style.opacity = "0.7";
    btn.style.cursor = "not-allowed";
    showNotice("");

    try {
      // Require displayName? Optional. If you want it required, enforce it here.
      if (!state.rolePrimary || !state.focus){
        setStep(1);
        throw "Role and Focus are required.";
      }

      // 1) Upload avatar if chosen
      const avatarUrl = await uploadAvatarIfAny();

      // 2) Save onboarding profile
      const user = await saveOnboarding();

      // If avatarUrl came back, merge it into local user cache too
      const cached = JSON.parse(localStorage.getItem("origin_user") || "{}");
      const merged = { ...cached, ...user };
      if (avatarUrl) merged.avatarUrl = avatarUrl;

      localStorage.setItem("origin_user", JSON.stringify(merged));

      // 3) Go to dashboard
      window.location.href = "dashboard.html";

    } catch (err){
      showNotice(typeof err === "string" ? err : "Could not finish setup.");
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.style.opacity = "";
      btn.style.cursor = "";
    }
  });

  // Initialize
  setStep(1);
  setAvatarPreview(null);
});
