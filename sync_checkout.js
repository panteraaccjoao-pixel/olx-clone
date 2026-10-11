const fs = require('fs');

let content = fs.readFileSync('checkout.html', 'utf8');

// Strip any CSP meta tags from checkout.html too!
content = content.replace(/<meta[^>]*content-security-policy[^>]*>/gi, '');

// Give unique IDs to address elements in checkout.html
content = content.replace(
  '<span class="typo-body-small text-neutral-130 line-clamp-2 block">Seu endereço</span><span class="typo-body-small text-neutral-110 line-clamp-1 block">Seu bairro, Cidade, UF</span>',
  '<span id="checkout-user-street" class="typo-body-small text-neutral-130 line-clamp-2 block font-semibold">Seu endereço</span><span id="checkout-user-details" class="typo-body-small text-neutral-110 line-clamp-1 block">Seu bairro, Cidade, UF</span>'
);

content = content.replace(
  '<button type="button" class="olx-core-link olx-core-link--main olx-core-link--small">Mudar endereço</button>',
  '<button type="button" id="checkout-change-addr-btn" class="olx-core-link olx-core-link--main olx-core-link--small">Mudar endereço</button>'
);

content = content.replace(
  '<span class="typo-caption gap-0-5 inline-flex items-center font-semibold"><span>Vila Guilherme, São Paulo - SP</span></span>',
  '<span class="typo-caption gap-0-5 inline-flex items-center font-semibold"><span id="checkout-badge-addr">Vila Guilherme, São Paulo - SP</span></span>'
);

// Add Address Change Modal before </body> if not already there
const addressModalHtml = `
  <!-- Modal Mudar Endereço -->
  <div id="checkout-address-modal" class="olx-modal-backdrop" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; align-items:center; justify-content:center;">
    <div style="background:#fff; border-radius:12px; padding:24px; max-width:440px; width:90%; box-shadow:0 12px 30px rgba(0,0,0,0.2); font-family: 'Nunito Sans', sans-serif;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3 style="font-size:18px; font-weight:700; color:#111827; margin:0;">Endereço de entrega</h3>
        <button id="close-addr-modal-btn" type="button" style="background:none; border:none; font-size:20px; cursor:pointer; color:#6b7280;">✕</button>
      </div>
      <p style="font-size:13px; color:#6b7280; margin-bottom:16px;">Digite seu CEP para atualizar o local de entrega:</p>
      
      <div style="position:relative; margin-bottom:14px;">
        <input type="text" id="modal-cep-input" maxlength="9" placeholder="00000-000" style="width:100%; height:46px; border:2px solid #6e0ad6; border-radius:8px; padding:0 44px 0 14px; font-size:16px; box-sizing:border-box; outline:none;" />
        <svg id="modal-cep-spinner" style="display:none; position:absolute; right:12px; top:12px; width:22px; height:22px; animation:spin 0.75s linear infinite;" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9.5" stroke="#6e0ad6" stroke-width="2.3" stroke-linecap="round" stroke-dasharray="44 16"></circle>
        </svg>
      </div>
      <div id="modal-addr-preview" style="font-size:14px; color:#1f2937; margin-bottom:16px; min-height:20px; line-height:1.4;"></div>
      
      <div style="display:flex; gap:10px;">
        <button id="save-addr-modal-btn" type="button" style="flex:1; background:#6e0ad6; color:#fff; border:none; border-radius:8px; height:44px; font-size:15px; font-weight:700; cursor:pointer;">Confirmar endereço</button>
      </div>
    </div>
  </div>
`;

if (!content.includes('id="checkout-address-modal"')) {
  content = content.replace('</body>', addressModalHtml + '\n</body>');
}

// Update script logic in checkout.html
const syncScript = `
      // Sync address from product page or localStorage
      function syncAddressUI() {
        const streetEl = document.getElementById('checkout-user-street');
        const detailsEl = document.getElementById('checkout-user-details');
        const badgeEl = document.getElementById('checkout-badge-addr');

        let addr = null;
        try {
          const raw = localStorage.getItem('olx_user_address');
          if (raw) {
            addr = JSON.parse(raw);
            if (addr && (addr.cep === '07141-427' || addr.cep === '07141427' || addr.city === 'Guarulhos' || addr.localidade === 'Guarulhos')) {
              addr = null;
              localStorage.removeItem('olx_user_address');
              localStorage.removeItem('olx_calculated_cep');
            }
          }
        } catch (e) {}

        if (addr && (addr.city || addr.localidade)) {
          const street = addr.street || addr.logradouro || 'Seu endereço';
          const neigh = addr.neighborhood || addr.bairro || '';
          const city = addr.city || addr.localidade;
          const state = addr.state || addr.uf || '';
          const cep = addr.formattedCep || (addr.cep ? addr.cep.slice(0,5)+'-'+addr.cep.slice(5) : '');

          if (streetEl) streetEl.textContent = street;
          if (detailsEl) detailsEl.textContent = (neigh ? neigh + ', ' : '') + city + (state ? ' - ' + state : '') + (cep ? ' • CEP ' + cep : '');
          if (badgeEl) badgeEl.textContent = (neigh || city) + ', ' + city + (state ? ' - ' + state : '');
        } else {
          // Endereço padrão solicitado pelo usuário
          if (streetEl) streetEl.textContent = 'Seu endereço';
          if (detailsEl) detailsEl.textContent = 'Sua cidade, seu estado UF';
          if (badgeEl) badgeEl.textContent = 'Sua cidade, seu estado UF';
        }
      }

      syncAddressUI();

      // Mudar endereço modal
      const changeAddrBtn = document.getElementById('checkout-change-addr-btn');
      const addrModal = document.getElementById('checkout-address-modal');
      const closeAddrModalBtn = document.getElementById('close-addr-modal-btn');
      const saveAddrModalBtn = document.getElementById('save-addr-modal-btn');
      const modalCepInput = document.getElementById('modal-cep-input');
      const modalCepSpinner = document.getElementById('modal-cep-spinner');
      const modalAddrPreview = document.getElementById('modal-addr-preview');

      let currentResolvedModalAddr = null;

      if (changeAddrBtn && addrModal) {
        changeAddrBtn.addEventListener('click', function(e) {
          e.preventDefault();
          addrModal.style.display = 'flex';
          const savedCep = localStorage.getItem('olx_calculated_cep') || '';
          if (modalCepInput) {
            modalCepInput.value = savedCep;
            if (savedCep) {
              lookupModalCep(savedCep.replace(/\\D/g, ''));
            } else if (modalAddrPreview) {
              modalAddrPreview.textContent = '';
            }
          }
        });
      }

      if (closeAddrModalBtn && addrModal) {
        closeAddrModalBtn.addEventListener('click', function() {
          addrModal.style.display = 'none';
        });
      }

      async function lookupModalCep(cleanCep) {
        if (!cleanCep || cleanCep.length !== 8) return;
        if (modalCepSpinner) modalCepSpinner.style.display = 'block';
        if (modalAddrPreview) modalAddrPreview.textContent = 'Buscando endereço...';

        try {
          let data = null;
          try {
            const r = await fetch('/api/cep?cep=' + cleanCep);
            if (r.ok) data = await r.json();
          } catch(e) {}

          if (!data || data.erro) {
            try {
              const r2 = await fetch('https://viacep.com.br/ws/' + cleanCep + '/json/');
              if (r2.ok) data = await r2.json();
            } catch(e2) {}
          }

          if (data && !data.erro && data.localidade) {
            currentResolvedModalAddr = {
              cep: cleanCep,
              formattedCep: cleanCep.slice(0,5)+'-'+cleanCep.slice(5),
              street: data.logradouro || '',
              neighborhood: data.bairro || '',
              city: data.localidade,
              state: data.uf
            };
            const display = (data.logradouro ? data.logradouro + ', ' : '') + (data.bairro ? data.bairro + ', ' : '') + data.localidade + ' - ' + data.uf;
            if (modalAddrPreview) modalAddrPreview.innerHTML = '<span style="color:#16a34a; font-weight:600;">📍 ' + display + '</span>';
          } else {
            if (modalAddrPreview) modalAddrPreview.innerHTML = '<span style="color:#d9383a;">CEP não encontrado.</span>';
          }
        } catch(err) {
          if (modalAddrPreview) modalAddrPreview.innerHTML = '<span style="color:#d9383a;">Erro ao consultar CEP.</span>';
        } finally {
          if (modalCepSpinner) modalCepSpinner.style.display = 'none';
        }
      }

      if (modalCepInput) {
        modalCepInput.addEventListener('input', function() {
          let v = this.value.replace(/\\D/g, '').slice(0, 8);
          if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
          this.value = v;
          const clean = v.replace(/\\D/g, '');
          if (clean.length === 8) {
            lookupModalCep(clean);
          }
        });
      }

      if (saveAddrModalBtn && addrModal) {
        saveAddrModalBtn.addEventListener('click', function() {
          if (currentResolvedModalAddr) {
            localStorage.setItem('olx_user_address', JSON.stringify(currentResolvedModalAddr));
            localStorage.setItem('olx_calculated_cep', currentResolvedModalAddr.formattedCep);
            syncAddressUI();
          }
          addrModal.style.display = 'none';
        });
      }
`;

// Insert sync script inside DOMContentLoaded
if (!content.includes('syncAddressUI()')) {
  content = content.replace('// Initial call\n      updateTimingUI();', syncScript + '\n      // Initial call\n      updateTimingUI();');
}

fs.writeFileSync('checkout.html', content, 'utf8');
console.log('checkout.html successfully updated with dynamic user address synchronization!');
