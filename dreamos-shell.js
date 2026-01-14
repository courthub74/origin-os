(function initDreamOSShell(){
  const sidebar = document.getElementById("sidebar");
  const burger = document.getElementById("burger");
  const scrim = document.getElementById("scrim");

  if(!sidebar || !burger || !scrim) return;

  function openSidebar(){
    sidebar.classList.add("open");
    scrim.classList.add("show");
    burger.classList.add("active");
    burger.setAttribute("aria-expanded","true");
  }
  function closeSidebar(){
    sidebar.classList.remove("open");
    scrim.classList.remove("show");
    burger.classList.remove("active");
    burger.setAttribute("aria-expanded","false");
  }

  burger.addEventListener("click", ()=>{
    sidebar.classList.contains("open") ? closeSidebar() : openSidebar();
  });
  scrim.addEventListener("click", closeSidebar);

  window.addEventListener("keydown", (e)=>{
    if(e.key === "Escape") closeSidebar();
  });
})();

// Demo flag for now. Swap this with your real count later.
  const worksCount = 0; // 0 = empty state

  const emptyState = document.querySelector(".empty-state");
  const emptyQuickActionsSlot = document.getElementById("emptyQuickActionsSlot");

  const quickActionsPanel = document.getElementById("quickActionsPanel");
  const recentActivityPanel = document.getElementById("recentActivityPanel");

  const showEmpty = worksCount === 0;

  if(showEmpty){
    // Show empty state
    if(emptyState) emptyState.style.display = "block";

    // Hide Recent Activity
    if(recentActivityPanel) recentActivityPanel.style.display = "none";

    // Move Quick Actions panel to the right column of empty state
    if(quickActionsPanel && emptyQuickActionsSlot){
      emptyQuickActionsSlot.appendChild(quickActionsPanel);
    }
  } else {
    // Hide empty state
    if(emptyState) emptyState.style.display = "none";

    // Show Recent Activity
    if(recentActivityPanel) recentActivityPanel.style.display = "";

    // Ensure Quick Actions lives in the normal grid again (left column)
    // (Put it back at the top of the grid, before recent activity)
    const grid = document.querySelector(".grid");
    if(grid && quickActionsPanel){
      grid.insertBefore(quickActionsPanel, recentActivityPanel || null);
    }
  }

  // Artwork Preview Drag and Drop
  const detailsEl = document.getElementById("artworkDetails");
  const genEl = document.getElementById("artworkGenerating");
  const genBtn = document.getElementById("generateBtn");

  const stage = document.getElementById("previewStage");
  const stageLabel = document.getElementById("stageLabel");
  const genFill = document.getElementById("genFill");
  const genHint = document.getElementById("genHint");

  let genTimer = null;

  genBtn.addEventListener("click", () => {
    // 1) Hide details, show generating
    detailsEl.classList.add("hidden");
    genEl.classList.remove("hidden");

    // 2) Switch preview stage into “generating”
    stage.classList.add("is-generating");
    stage.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
        <div class="stageSpinner" aria-hidden="true"></div>
        <div style="font-family:var(--mono); letter-spacing:.08em; text-transform:uppercase; font-size:12px;">
          Generating…
        </div>
      </div>
    `;

    // 3) Fake progress (replace with real progress later)
    let pct = 20;
    genFill.style.width = pct + "%";
    genHint.textContent = "Preparing canvas…";

    const hints = [
      "Compiling prompt structure…",
      "Stitching composition…",
      "Rendering light + texture…",
      "Finalizing output…"
    ];
    let hintIdx = 0;

    clearInterval(genTimer);
    genTimer = setInterval(() => {
      pct = Math.min(100, pct + Math.floor(Math.random() * 18) + 6);
      genFill.style.width = pct + "%";

      if (pct >= 35 && hintIdx === 0) genHint.textContent = hints[hintIdx++];
      if (pct >= 60 && hintIdx === 1) genHint.textContent = hints[hintIdx++];
      if (pct >= 80 && hintIdx === 2) genHint.textContent = hints[hintIdx++];

      if (pct >= 100) {
        clearInterval(genTimer);
        genHint.textContent = "Complete. Ready to review.";
        // Here is where you would swap in the generated image/video.
        stage.classList.remove("is-generating");
        stage.innerHTML = `<span style="opacity:.8; font-family:var(--mono);">Generated artwork will appear here</span>`;
      }
    }, 700);
  });

  function cancelGenerate(){
    clearInterval(genTimer);

    // Show details again
    genEl.classList.add("hidden");
    detailsEl.classList.remove("hidden");

    // Reset preview stage
    stage.classList.remove("is-generating");
    stage.innerHTML = `<span id="stageLabel">Drop artwork here</span>`;

    // Reset progress
    genFill.style.width = "20%";
    genHint.textContent = "Cancelled.";
  }