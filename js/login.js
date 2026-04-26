  // LOGIN LOGIC

  // Test Print
  console.log("Login script loaded.");

  // /js/login.js
  document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = "http://localhost:4000";

    const signInBtn = document.getElementById("signInBtn");

    // Diagnostic log to verify button selection (remove in production)
    console.log("signInBtn:", signInBtn);

    const emailEl = document.getElementById("email");
    const passwordEl = document.getElementById("password");

    // Create Account button (give it an id in HTML OR select it safely)
    const createAccountBtn = document.querySelector(".registerPrompt .btn.ghost");

    // Overlay elements
    const overlay = document.getElementById("authLoading");
    const loadingText = document.getElementById("authLoadingText");
    const loadingBar = document.getElementById("authLoadingBar");

    const stepsSignIn = [
      "Initializing session…",
      "Verifying credentials…",
      "Syncing workspace state…",
      "Loading dashboard…"
    ];

    const stepsCreate = [
      "Opening registration…",
      "Preparing onboarding shell…",
      "Warming up workspace…"
    ];

    let stepTimer = null;

     // Optional: Enter key submits
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      if (!signInBtn || signInBtn.disabled) return;

      // prevents Enter triggering other default form actions
      e.preventDefault();
      signInBtn.click();
    });

    function setOverlay(show){
      overlay.classList.toggle("show", !!show);
      overlay.setAttribute("aria-hidden", show ? "false" : "true");
    }

    function lockButtons(lock){
      if (signInBtn) signInBtn.disabled = lock;
      if (createAccountBtn) createAccountBtn.disabled = lock;
    }

    function setStep(text, progressPct){
      loadingText.textContent = text;
      if (typeof progressPct === "number") loadingBar.style.width = `${progressPct}%`;
    }

    function startSequence(steps, { interval = 850 } = {}){
      clearInterval(stepTimer);
      setOverlay(true);
      lockButtons(true);

      let i = 0;
      setStep(steps[i], 18);

      stepTimer = setInterval(() => {
        i++;
        if (i < steps.length){
          const pct = Math.min(18 + Math.round((i / steps.length) * 70), 90);
          setStep(steps[i], pct);
        } else {
          // Stop advancing. We wait for finishSequence() to be called by real events.
          clearInterval(stepTimer);
        }
      }, interval);
    }

    function finishSequence(finalText, nextHref){
      clearInterval(stepTimer);
      setStep(finalText, 100);

      document.body.classList.add("fade-out");
      setTimeout(() => {
        window.location.href = nextHref;
      }, 350);
    }

    function failSequence(errText){
      clearInterval(stepTimer);
      setStep(errText, 0);

      // Give the user a breath, then unlock and hide overlay
      setTimeout(() => {
        setOverlay(false);
        lockButtons(false);
        // keep the text ready for next time
        setStep("Initializing…", 0);
      }, 900);
    }

    // SIGN IN CLICK HANDLER
    if (signInBtn){
      signInBtn.addEventListener("click", async () => {
        // Test Print
        console.log("Sign In button clicked.");
        const email = (emailEl?.value || "").trim();
        const password = passwordEl?.value || "";

        if (!email || !password){
          failSequence("Email and password required.");
          return;
        }

        startSequence(stepsSignIn);

        try {
          // Diagnostic log to verify before API call (remove in production)
          console.log("About to call /auth/login");
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password })
          });

          const data = await res.json().catch(() => ({}));

          // Handle API errors (like invalid credentials) gracefully
          if (!res.ok){
            const msg = data?.error || "Login failed. Check credentials.";
            failSequence(msg);
            return;
          }

          // ✅ Save auth session
          localStorage.setItem("origin_access", data.accessToken);
          localStorage.setItem("origin_user", JSON.stringify(data.user));

          // Diagnostic log to verify token is stored correctly (remove in production)
          console.log("LOGIN DEBUG origin_access length:", (data.accessToken || "").length);

          // Diagnostic log to verify token is stored correctly (remove in production)
          console.log("LOGIN DEBUG origin_user:", JSON.stringify(data.user));

          // ✅ Prevent cross-account draft mismatch
          localStorage.removeItem("origin_current_artwork_id");

          finishSequence("Access granted.", "dashboard.html");
        } catch (e){
          failSequence("Network error. Try again.");
        }
      });
    }

    // CREATE ACCOUNT (smooth transition, then navigate)
    if (createAccountBtn){
      createAccountBtn.addEventListener("click", (e) => {
        e.preventDefault();
        startSequence(stepsCreate, { interval: 780 });

        setTimeout(() => {
          finishSequence("Redirecting…", "registration.html");
        }, 1200);
      });
    }
  });

