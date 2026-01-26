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

        // Connector stubs
        function connect(m){
        document.getElementById('st-' + m).textContent = 'connected';
        document.getElementById('st-' + m).classList.add('on');
        alert('Hook: OAuth / wallet connect for ' + m);
        }
        function disconnect(m){
        document.getElementById('st-' + m).textContent = 'not connected';
        document.getElementById('st-' + m).classList.remove('on');
        alert('Hook: revoke token for ' + m);
        }
        function manage(m){
        alert('Hook: manage connection settings for ' + m);
        }

        // Mint stubs
        function dryRun(){
        const payload = readForm();
        alert('Dry run (no mint)\n\n' + JSON.stringify(payload, null, 2));
        }

        function queueMint(){
        const payload = readForm();
        addQueueItem(payload);
        alert('Hook: POST /api/mint/queue\n\n' + JSON.stringify(payload, null, 2));
        }

        function readForm(){
            return {
                artwork: document.getElementById('artwork').value,
                collection: document.getElementById('collection').value || null,
                marketplace: document.getElementById('market').value,
                edition: document.getElementById('edition').value,
                royalties: document.getElementById('royalties').value,
                price: document.getElementById('price').value,
                saleType: document.getElementById('saleType').value,
                description: document.getElementById('description').value
            };
        }

        function chainFor(market){
    if (market === 'xrpcafe') return 'XRPL';
    if (market === 'opensea') return 'EVM';
    return '—';
    }

    function addQueueItem(p){
    const queue = document.getElementById('queue');

    const cleanTitle = (p.artwork || '—').replace(/\s*\(Draft\)\s*/i,'').trim();
    const meta = `${p.marketplace} · edition ${p.edition} · ${p.saleType} · ${p.price || '—'}`;

    const item = document.createElement('div');
    item.className = 'qItem';

    // Store details for modal
    item.dataset.title = cleanTitle;
    item.dataset.meta = meta;
    item.dataset.status = 'draft';
    item.dataset.market = p.marketplace;
    item.dataset.chain = chainFor(p.marketplace);
    item.dataset.edition = String(p.edition || '—');
    item.dataset.royalties = (p.royalties !== '' ? `${p.royalties}%` : '—');
    item.dataset.price = p.price || '—';
    item.dataset.description = p.description || '—';

    item.innerHTML = `
        <div class="qLeft">
        <div class="qTitle">${escapeHtml(cleanTitle)}</div>
        <div class="qMeta">${escapeHtml(meta)}</div>
        </div>
        <div class="qRight">
        <div class="statusPill">draft</div>
        <button class="iconBtn" type="button" onclick="openMintModal(this)" aria-label="Open mint details">
            <svg viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </button>
        </div>
    `;

    queue.prepend(item);
    }


    function escapeHtml(str){
      return String(str)
        .replaceAll('&','&amp;')
        .replaceAll('<','&lt;')
        .replaceAll('>','&gt;')
        .replaceAll('"','&quot;')
        .replaceAll("'","&#039;");
    }

    function openMintModal(btn){
        const item = btn.closest('.qItem');
        if (!item) return;

        // Prefer dataset (you already set it). Fallback to visible text.
        const title = item.dataset.title || item.querySelector('.qTitle')?.textContent?.trim() || '—';
        const meta  = item.dataset.meta  || item.querySelector('.qMeta')?.textContent?.trim()  || '—';

        document.getElementById('mTitle').textContent = title;
        document.getElementById('mMeta').textContent  = meta;

        // Fill detail fields
        document.getElementById('mMarket').textContent    = item.dataset.market || '—';
        document.getElementById('mChain').textContent     = item.dataset.chain || '—';
        document.getElementById('mEdition').textContent   = item.dataset.edition || '—';
        document.getElementById('mRoyalties').textContent = item.dataset.royalties || '—';
        document.getElementById('mPrice').textContent     = item.dataset.price || '—';
        document.getElementById('mDescription').textContent =item.dataset.description || '—';


        // ✅ Status text + status-only color
        const statusEl = document.getElementById('mStatus');
        const status = (item.dataset.status || '').toLowerCase();

        statusEl.textContent = status || '—';
        statusEl.classList.remove('ready','pending','draft');
        if (status) statusEl.classList.add(status);

        // ✅ make ONLY the status box green-outlined when ready
        const statusBox = document.getElementById('mStatusBox');
        statusBox.classList.toggle('is-ready', status === 'ready');


        // Open modal
        const modal = document.getElementById('mintModal');
        modal.classList.add('show');
        modal.setAttribute('aria-hidden','false');
        document.body.style.overflow = 'hidden';
    }



function closeMintModal(){
  const modal = document.getElementById('mintModal');
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMintModal();
});
