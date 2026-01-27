function toggleSidebar(force){
      const sidebar = document.getElementById('sidebar');
      const scrim = document.getElementById('scrim');
      const burger = document.getElementById('burger');

      const willOpen = (typeof force === 'boolean') ? force : !sidebar.classList.contains('open');
      sidebar.classList.toggle('open', willOpen);
      scrim.classList.toggle('show', willOpen);
      burger.classList.toggle('active', willOpen);
    }

    function connectSocial(p){
      const el = document.getElementById('st-' + p);
      if (!el) return;
      el.textContent = 'connected';
      el.classList.add('on');
      alert('Hook: OAuth connect for ' + p);
    }
    function disconnectSocial(p){
      const el = document.getElementById('st-' + p);
      if (!el) return;
      el.textContent = 'not connected';
      el.classList.remove('on');
      alert('Hook: revoke token for ' + p);
    }
    function manageSocial(p){ alert('Hook: manage ' + p + ' settings'); }

    // file state pill
    (function wireFileState(){
      const input = document.getElementById('postAsset');
      const state = document.getElementById('postAssetState');
      if (!input || !state) return;
      input.addEventListener('change', () => {
        const f = input.files && input.files[0];
        state.textContent = f ? f.name : 'none selected';
      });
    })();

    function saveDraftPost(){ alert('Hook: save draft'); }

    function queuePost(){
      const platform = document.getElementById('postPlatform').value;
      const type = document.getElementById('postType').value;
      const when = document.getElementById('postWhen').value || 'not scheduled';

      addSocialQueueItem({
        title: platform.charAt(0).toUpperCase() + platform.slice(1) + ' post',
        meta: `${type} · ${when ? 'scheduled' : 'draft'} · ${when || 'not scheduled'}`,
        status: 'draft',
        platform,
        when: when || '—',
        notes: (document.getElementById('postCopy').value || '—').slice(0, 140)
      });

      alert('Hook: POST /api/social/queue');
    }

    function addSocialQueueItem(p){
      const queue = document.getElementById('socialQueue');
      if (!queue) return;

      const item = document.createElement('div');
      item.className = 'qItem';

      item.dataset.title = p.title || '—';
      item.dataset.meta = p.meta || '—';
      item.dataset.status = p.status || 'draft';
      item.dataset.platform = p.platform || '—';
      item.dataset.when = p.when || '—';
      item.dataset.notes = p.notes || '—';

      item.innerHTML = `
        <div class="qLeft">
          <div class="qTitle">${escapeHtml(item.dataset.title)}</div>
          <div class="qMeta">${escapeHtml(item.dataset.meta)}</div>
        </div>
        <div class="qRight">
          <div class="statusPill">${escapeHtml(item.dataset.status)}</div>
          <button class="iconBtn" type="button" onclick="openSocialModal(this)" aria-label="Open details">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      `;
      queue.prepend(item);
    }

    function openSocialModal(btn){
      const item = btn.closest('.qItem');
      if (!item) return;

      document.getElementById('sTitle').textContent = item.dataset.title || item.querySelector('.qTitle')?.textContent?.trim() || '—';
      document.getElementById('sMeta').textContent  = item.dataset.meta  || item.querySelector('.qMeta')?.textContent?.trim()  || '—';

      document.getElementById('sPlatform').textContent = item.dataset.platform || '—';
      document.getElementById('sWhen').textContent = item.dataset.when || '—';
      document.getElementById('sNotes').textContent = item.dataset.notes || '—';

      const statusEl = document.getElementById('sStatus');
      const status = (item.dataset.status || '').toLowerCase();
      statusEl.textContent = status || '—';
      statusEl.classList.remove('ready','pending','draft');
      if (status) statusEl.classList.add(status);

      const statusBox = document.getElementById('sStatusBox');
      statusBox.classList.toggle('is-ready', status === 'ready');

      const modal = document.getElementById('socialModal');
      modal.classList.add('show');
      modal.setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
    }

    function closeSocialModal(){
      const modal = document.getElementById('socialModal');
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden','true');
      document.body.style.overflow = '';
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSocialModal();
    });

    function escapeHtml(str){
      return String(str)
        .replaceAll('&','&amp;')
        .replaceAll('<','&lt;')
        .replaceAll('>','&gt;')
        .replaceAll('"','&quot;')
        .replaceAll("'","&#039;");
    }