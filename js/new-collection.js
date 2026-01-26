// Sidebar toggle (matches your burger/scrim pattern)
    function toggleSidebar(force){
      const sidebar = document.getElementById('sidebar');
      const scrim = document.getElementById('scrim');
      const burger = document.getElementById('burger');

      const willOpen = (typeof force === 'boolean') ? force : !sidebar.classList.contains('open');

      sidebar.classList.toggle('open', willOpen);
      scrim.classList.toggle('show', willOpen);
      burger.classList.toggle('active', willOpen);
    }

    // Live preview wiring
    const nameEl = document.getElementById('colName');
    const slugEl = document.getElementById('colSlug');
    const descEl = document.getElementById('colDesc');
    const visEl  = document.getElementById('colVisibility');
    const fileEl = document.getElementById('coverFile');

    const pName = document.getElementById('previewName');
    const pSlug = document.getElementById('previewSlug');
    const pDesc = document.getElementById('previewDesc');
    const pVis  = document.getElementById('previewVis');
    const fileMeta = document.getElementById('fileMeta');
    const coverMock = document.getElementById('coverMock');

    function slugify(v){
      return (v || '')
        .toLowerCase()
        .trim()
        .replace(/['"]/g,'')
        .replace(/\s+/g,'-')
        .replace(/[^a-z0-9\-]/g,'')
        .replace(/\-+/g,'-');
    }

    function syncPreview(){
      const name = nameEl.value.trim() || 'War & Feast';
      const slug = slugEl.value.trim() || slugify(name) || 'war-and-feast';
      const desc = descEl.value.trim() || 'A dossier of rituals, appetite, and power structures.';
      const vis  = visEl.value;

      pName.textContent = name;
      pSlug.textContent = slug;
      pDesc.textContent = desc;
      pVis.textContent = vis;
    }

    nameEl.addEventListener('input', () => {
      // auto-fill slug only if user hasn't touched slug much
      if (!slugEl.dataset.touched){
        slugEl.value = slugify(nameEl.value);
      }
      syncPreview();
    });

    slugEl.addEventListener('input', () => {
      slugEl.dataset.touched = "1";
      syncPreview();
    });

    descEl.addEventListener('input', syncPreview);
    visEl.addEventListener('change', syncPreview);

    fileEl.addEventListener('change', () => {
      const f = fileEl.files && fileEl.files[0];
      if (!f){
        fileMeta.textContent = 'No file selected';
        coverMock.style.backgroundImage = '';
        syncPreview();
        return;
      }
      fileMeta.textContent = f.name;

      // tiny preview: set as background image (non-destructive, only UI)
      const url = URL.createObjectURL(f);
      coverMock.style.background = `
        radial-gradient(650px 220px at 30% 20%, rgba(180,207,106,0.08), transparent 60%),
        radial-gradient(520px 240px at 85% 30%, rgba(120,90,255,0.10), transparent 60%),
        url(${url}) center/cover no-repeat
      `;
      syncPreview();
    });

    function resetForm(){
      nameEl.value = '';
      slugEl.value = '';
      delete slugEl.dataset.touched;
      descEl.value = '';
      visEl.value = 'public';
      fileEl.value = '';
      fileMeta.textContent = 'No file selected';
      coverMock.style.background = `
        radial-gradient(650px 220px at 30% 20%, rgba(180,207,106,0.10), transparent 60%),
        radial-gradient(520px 240px at 85% 30%, rgba(120,90,255,0.14), transparent 60%),
        rgba(255,255,255,0.02)
      `;
      syncPreview();
    }

    function saveCollection(){
      // Hook this to your backend later
      const payload = {
        name: nameEl.value.trim(),
        slug: slugEl.value.trim(),
        description: descEl.value.trim(),
        visibility: visEl.value,
      };
      alert('Hook to POST /api/collections\n\n' + JSON.stringify(payload, null, 2));
    }

    // initial preview
    syncPreview();