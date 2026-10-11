const fs = require('fs');

let html = fs.readFileSync('checkout.html', 'utf8');

// 1. Remove old payment-success-modal if present
const oldModalIdx = html.indexOf('id="payment-success-modal"');
if (oldModalIdx !== -1) {
  const start = html.lastIndexOf('<div id="payment-success-modal"', oldModalIdx);
  const end = html.indexOf('</div>\n  </div>', start) + 16;
  if (start !== -1 && end > start) {
    html = html.slice(0, start) + html.slice(end);
    console.log('Removed old payment-success-modal');
  }
}

// 2. Remove duplicate/stale scripts and modal overlays
while (html.includes('<script id="olx-finalize-modal-script">')) {
  const sStart = html.indexOf('<script id="olx-finalize-modal-script">');
  const sEnd = html.indexOf('</script>', sStart) + 9;
  if (sStart !== -1 && sEnd > sStart) {
    html = html.slice(0, sStart) + html.slice(sEnd);
    console.log('Removed olx-finalize-modal-script block');
  } else break;
}

while (html.includes('<!-- OLX Finalize Purchase Modal Component -->')) {
  const start = html.indexOf('<!-- OLX Finalize Purchase Modal Component -->');
  const endMarker = '<!-- End OLX Finalize Purchase Modal -->';
  const end = html.indexOf(endMarker, start);
  if (start !== -1 && end !== -1) {
    html = html.slice(0, start) + html.slice(end + endMarker.length);
    console.log('Removed existing finalize modal injection');
  } else break;
}

const finalizeModalMarkup = `
<!-- OLX Finalize Purchase Modal Component -->
<div id="olx-finalize-modal-overlay" class="olx-finalize-modal-backdrop" style="display: none;">
  <style>
    .olx-finalize-modal-backdrop {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.6);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.2s ease, visibility 0.2s ease;
      font-family: Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      box-sizing: border-box;
      padding: 16px;
    }
    .olx-finalize-modal-backdrop.is-open {
      opacity: 1;
      visibility: visible;
    }
    .olx-modal__dialog {
      position: relative;
      background-color: #ffffff;
      border-radius: 16px;
      box-shadow: 0 10px 38px rgba(0, 0, 0, 0.35), 0 10px 20px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 500px;
      max-height: 94vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-sizing: border-box;
      transform: scale(0.96);
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .olx-finalize-modal-backdrop.is-open .olx-modal__dialog {
      transform: scale(1);
    }
    .olx-modal__close-button {
      position: absolute;
      top: 16px;
      right: 16px;
      background: transparent;
      border: none;
      cursor: pointer;
      z-index: 30;
      color: #3c4453;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .olx-modal__close-button:hover {
      background-color: #f5f6f7;
      color: #1a1d23;
    }
    .olx-modal__content {
      flex: 1;
      overflow-y: auto;
      padding: 24px 24px 96px 24px;
      box-sizing: border-box;
      -webkit-overflow-scrolling: touch;
    }
    .olx-modal__content::-webkit-scrollbar {
      width: 6px;
    }
    .olx-modal__content::-webkit-scrollbar-track {
      background: #f1f1f1;
    }
    .olx-modal__content::-webkit-scrollbar-thumb {
      background: #c5c9d1;
      border-radius: 3px;
    }
    .olx-finalize-sticky-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: #ffffff;
      padding: 12px 24px 20px 24px;
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.08);
      z-index: 20;
      box-sizing: border-box;
    }
    .olx-doc-toggle-btn {
      transition: all 0.2s ease;
    }
    @media (max-width: 600px) {
      .olx-finalize-modal-backdrop {
        padding: 0;
        align-items: flex-end;
      }
      .olx-modal__dialog {
        max-height: 92vh;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }
      .olx-modal__content {
        padding: 20px 16px 90px 16px;
      }
      .olx-finalize-sticky-footer {
        padding: 12px 16px 16px 16px;
      }
    }
  </style>

  <div class="olx-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="modal-finalize-title">
    <button id="olx-finalize-close-btn" class="olx-modal__close-button" aria-label="Fechar modal">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path fill-rule="evenodd" d="M19.7071068,4.29289322 C20.0976311,4.68341751 20.0976311,5.31658249 19.7071068,5.70710678 L13.414,12 L19.7071068,18.2928932 C20.0976311,18.6834175 20.0976311,19.3165825 19.7071068,19.7071068 C19.3165825,20.0976311 18.6834175,20.0976311 18.2928932,19.7071068 L12,13.414 L5.70710678,19.7071068 C5.31658249,20.0976311 4.68341751,20.0976311 4.29289322,19.7071068 C3.90236893,19.3165825 3.90236893,18.6834175 4.29289322,18.2928932 L10.586,12 L4.29289322,5.70710678 C3.90236893,5.31658249 3.90236893,4.68341751 4.29289322,4.29289322 C4.68341751,3.90236893 5.31658249,3.90236893 5.70710678,4.29289322 L12,10.586 L18.2928932,4.29289322 C18.6834175,3.90236893 19.3165825,3.90236893 19.7071068,4.29289322 Z"></path>
      </svg>
    </button>

    <div class="olx-modal__content">
      <!-- Modal Header -->
      <header class="flex flex-col gap-1 items-start" style="margin-bottom: 20px;">
        <h2 id="modal-finalize-title" class="olx-core-modal-title" style="font-size: 22px; font-weight: 700; color: #1a1d23; margin: 0; line-height: 1.25;">Finalizar compra</h2>
        <span class="olx-core-modal-description" style="font-size: 14px; color: #737c8c;">Revise os valores e informe seus dados para gerar o Pix.</span>
      </header>

      <!-- Modal Body Content -->
      <div class="olx-core-modal-body">
        <div class="flex flex-col gap-2">
          <!-- Summary Box matching user screenshot -->
          <div class="flex flex-col gap-1" style="background-color: #f7f8f9; border-radius: 12px; padding: 16px; border: 1px solid #e9ecf0;">
            <div class="flex justify-between items-center" style="font-size: 14px; color: #3c4453; margin-bottom: 6px;">
              <span>Total da compra</span>
              <span id="modal-pix-total" style="font-weight: 700; color: #1a1d23;">R$ 800,00</span>
            </div>

            <div class="flex justify-between items-center" style="font-size: 14px; color: #3c4453; margin-bottom: 6px;">
              <span id="modal-shipping-name">Entrega</span>
              <div>
                <span id="modal-shipping-old-price" style="text-decoration: line-through; color: #737c8c; font-size: 13px; margin-right: 6px;">R$ 29,90</span>
                <span id="modal-shipping-price" style="font-weight: 700; color: #105323;">Grátis</span>
              </div>
            </div>

            <div class="flex justify-between items-center" style="font-size: 14px; color: #3c4453; margin-bottom: 6px;">
              <span>Garantia da OLX</span>
              <div>
                <span style="text-decoration: line-through; color: #737c8c; font-size: 13px; margin-right: 6px;">R$ 100,00</span>
                <span style="font-weight: 700; color: #105323;">Grátis</span>
              </div>
            </div>

            <hr class="olx-divider" data-ds-component="DS-Divider" style="border: none; border-top: 1px solid #e0e3e8; margin: 8px 0;">

            <div class="flex justify-between items-center" style="font-size: 16px; font-weight: 700; color: #1a1d23;">
              <span>Total a pagar via Pix</span>
              <span id="modal-total-final" style="color: #6e0ad6; font-size: 18px;">R$ 800,00</span>
            </div>
          </div>

          <!-- Savings Badge -->
          <div class="olx-core-badge olx-core-badge--success olx-core-badge--medium olx-core-badge--rectangle w-full justify-center" style="display: flex; align-items: center; justify-content: center; background-color: #def9cc; color: #105323; padding: 6px 12px; border-radius: 8px; gap: 6px; margin: 6px 0;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path fill-rule="evenodd" d="M10.718593,12.8735005 L13.2713568,12.8735005 C14.3165829,12.8735005 15.160804,13.697928 15.160804,14.7186478 C15.160804,15.7393675 14.3165829,16.563795 13.2713568,16.563795 L8.67839196,16.563795 C8.1758794,16.563795 7.7638191,16.9661941 7.7638191,17.4569248 C7.7638191,17.9476554 8.1758794,18.3500545 8.67839196,18.3500545 L11.080402,18.3500545 L11.080402,20.1068702 C11.080402,20.5976009 11.4924623,21 11.9949749,21 C12.4974874,21 12.9095477,20.5976009 12.9095477,20.1068702 L12.9095477,18.3500545 L13.281407,18.3500545 C15.3316583,18.3500545 17,16.7208288 17,14.7186478 C17,12.7164667 15.3316583,11.087241 13.281407,11.087241 L10.7286432,11.087241 C9.68341709,11.087241 8.83919598,10.2628135 8.83919598,9.24209378 C8.83919598,8.22137405 9.68341709,7.39694656 10.7286432,7.39694656 L15.241206,7.39694656 C15.7437186,7.39694656 16.1557789,6.99454744 16.1557789,6.50381679 C16.1557789,6.01308615 15.7437186,5.61068702 15.241206,5.61068702 L12.919598,5.61068702 L12.919598,3.89312977 C12.919598,3.40239913 12.5075377,3 12.0050251,3 C11.5025126,3 11.0904523,3.40239913 11.0904523,3.89312977 L11.0904523,5.62050164 L10.718593,5.62050164 C8.66834171,5.62050164 7,7.24972737 7,9.2519084 C7.01005025,11.2442748 8.67839196,12.8735005 10.718593,12.8735005 Z" fill="currentColor"></path>
            </svg>
            <span class="typo-caption">Você economizou</span>
            <span class="typo-caption font-semibold">R$ 129,90</span>
          </div>

          <hr class="olx-divider" data-ds-component="DS-Divider" style="border: none; border-top: 1px solid #cfd4dd; margin: 8px 0;">

          <!-- Buyer Form Fields -->
          <div class="olx-core-form-root" style="margin-bottom: 12px;">
            <div class="flex justify-between">
              <label for="modal-buyer-name" id="modal-buyer-name-label" class="olx-core-form-label" style="font-weight: 600; color: #1a1d23; font-size: 14px;">Nome completo*</label>
            </div>
            <div class="olx-core-input-textarea-root" style="margin-top: 4px;">
              <input class="olx-core-input-textarea-element olx-core-input-element olx-core-input-textarea-element--default" id="modal-buyer-name" placeholder="Preencha o nome conforme seu documento" name="buyerName" aria-label="Nome completo*" value="" style="height: 48px; border-radius: 8px; border: 1px solid #cfd4dd; padding: 0 16px; font-size: 15px; width: 100%; box-sizing: border-box; outline: none; transition: border-color 0.15s ease;">
            </div>
          </div>

          <!-- Document Selector (CPF / CNPJ) -->
          <div class="olx-core-form-root" style="margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label for="modal-buyer-cpf" id="modal-buyer-doc-label" class="olx-core-form-label" style="font-weight: 600; color: #1a1d23; font-size: 14px; margin: 0;">CPF*</label>
              <!-- Toggle switch pills between CPF and CNPJ -->
              <div class="olx-doc-type-pills" style="display: inline-flex; background: #eef0f3; border-radius: 20px; padding: 2px; gap: 2px;">
                <button type="button" id="btn-doc-cpf" class="olx-doc-toggle-btn is-active" style="border: none; background: #6e0ad6; color: #ffffff; padding: 4px 14px; border-radius: 16px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.15);">CPF</button>
                <button type="button" id="btn-doc-cnpj" class="olx-doc-toggle-btn" style="border: none; background: transparent; color: #4b5563; padding: 4px 14px; border-radius: 16px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s ease;">CNPJ</button>
              </div>
            </div>
            <div class="olx-core-input-textarea-root" style="margin-top: 4px;">
              <input class="olx-core-input-textarea-element olx-core-input-element olx-core-input-textarea-element--default" id="modal-buyer-cpf" placeholder="000.000.000-00" maxlength="14" name="buyerTaxDocumentNumber" aria-label="CPF*" value="" style="height: 48px; border-radius: 8px; border: 1px solid #cfd4dd; padding: 0 16px; font-size: 15px; width: 100%; box-sizing: border-box; outline: none; transition: border-color 0.15s ease;">
            </div>
          </div>
        </div>
      </div>

      <!-- Spacer for sticky button -->
      <div style="height: 40px;"></div>

      <!-- Sticky Bottom Footer with Button -->
      <div class="olx-finalize-sticky-footer">
        <hr class="olx-divider" data-ds-component="DS-Divider">
        <div class="p-2">
          <button id="modal-finalize-btn" type="button" aria-disabled="false" class="olx-core-button olx-core-button--primary olx-core-button--large w-full" style="height: 48px; border-radius: 40px; font-weight: 700; font-size: 16px; background-color: #6e0ad6; color: #fff; width: 100%; border: none; cursor: pointer; transition: all 0.15s ease;">
            <span id="modal-finalize-btn-text">Finalizar compra</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
<!-- End OLX Finalize Purchase Modal -->

<script id="olx-finalize-modal-script">
(function() {
  const overlay = document.getElementById('olx-finalize-modal-overlay');
  const closeBtn = document.getElementById('olx-finalize-close-btn');
  const finalizeBtn = document.getElementById('modal-finalize-btn');
  const finalizeBtnText = document.getElementById('modal-finalize-btn-text');
  const nameInput = document.getElementById('modal-buyer-name');
  const cpfInput = document.getElementById('modal-buyer-cpf');
  const docLabel = document.getElementById('modal-buyer-doc-label');
  const btnDocCpf = document.getElementById('btn-doc-cpf');
  const btnDocCnpj = document.getElementById('btn-doc-cnpj');

  // Value display elements in modal
  const modalPixTotal = document.getElementById('modal-pix-total');
  const modalShippingName = document.getElementById('modal-shipping-name');
  const modalShippingPrice = document.getElementById('modal-shipping-price');
  const modalShippingOldPrice = document.getElementById('modal-shipping-old-price');
  const modalTotalFinal = document.getElementById('modal-total-final');

  let currentDocType = localStorage.getItem('olx_doc_type') || 'cpf';

  function fmtBRL(val) {
    return 'R$ ' + Number(val).toFixed(2).replace('.', ',').replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.');
  }

  function setDocType(type) {
    currentDocType = type;
    localStorage.setItem('olx_doc_type', type);

    if (type === 'cnpj') {
      if (btnDocCnpj) {
        btnDocCnpj.style.background = '#6e0ad6';
        btnDocCnpj.style.color = '#ffffff';
        btnDocCnpj.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
      }
      if (btnDocCpf) {
        btnDocCpf.style.background = 'transparent';
        btnDocCpf.style.color = '#4b5563';
        btnDocCpf.style.boxShadow = 'none';
      }
      if (docLabel) docLabel.textContent = 'CNPJ*';
      if (nameInput) {
        const nameLbl = document.getElementById('modal-buyer-name-label');
        if (nameLbl) nameLbl.textContent = 'Razão Social ou Nome do Titular*';
        nameInput.placeholder = 'Preencha a razão social ou nome';
      }
      if (cpfInput) {
        cpfInput.placeholder = '00.000.000/0001-00';
        cpfInput.setAttribute('maxlength', '18');
        cpfInput.setAttribute('aria-label', 'CNPJ*');
        if (cpfInput.value) cpfInput.value = formatCnpj(cpfInput.value);
      }
    } else {
      if (btnDocCpf) {
        btnDocCpf.style.background = '#6e0ad6';
        btnDocCpf.style.color = '#ffffff';
        btnDocCpf.style.boxShadow = '0 1px 3px rgba(0,0,0,0.15)';
      }
      if (btnDocCnpj) {
        btnDocCnpj.style.background = 'transparent';
        btnDocCnpj.style.color = '#4b5563';
        btnDocCnpj.style.boxShadow = 'none';
      }
      if (docLabel) docLabel.textContent = 'CPF*';
      if (nameInput) {
        const nameLbl = document.getElementById('modal-buyer-name-label');
        if (nameLbl) nameLbl.textContent = 'Nome completo*';
        nameInput.placeholder = 'Preencha o nome conforme seu documento';
      }
      if (cpfInput) {
        cpfInput.placeholder = '000.000.000-00';
        cpfInput.setAttribute('maxlength', '14');
        cpfInput.setAttribute('aria-label', 'CPF*');
        if (cpfInput.value) cpfInput.value = formatCpf(cpfInput.value);
      }
    }
    checkFormValidity();
  }

  if (btnDocCpf) btnDocCpf.addEventListener('click', () => setDocType('cpf'));
  if (btnDocCnpj) btnDocCnpj.addEventListener('click', () => setDocType('cnpj'));

  function syncModalValues() {
    try {
      const savedPrice = parseFloat(localStorage.getItem('olx_price')) || 800.00;
      const formatted = fmtBRL(savedPrice);
      if (modalPixTotal) modalPixTotal.textContent = formatted;
      if (modalTotalFinal) modalTotalFinal.textContent = formatted;

      const shippingRaw = localStorage.getItem('olx_selected_shipping');
      if (shippingRaw) {
        const shipping = JSON.parse(shippingRaw);
        if (shipping.name && modalShippingName) {
          modalShippingName.textContent = shipping.name;
        }
        if (shipping.price === 'Grátis' || shipping.price === 'Gratis') {
          if (modalShippingPrice) {
            modalShippingPrice.textContent = 'Grátis';
            modalShippingPrice.style.color = '#105323';
          }
          if (shipping.oldPrice && modalShippingOldPrice) modalShippingOldPrice.textContent = shipping.oldPrice;
        } else if (shipping.price && modalShippingPrice) {
          modalShippingPrice.textContent = shipping.price;
          modalShippingPrice.style.color = '#1a1d23';
          if (shipping.oldPrice && modalShippingOldPrice) modalShippingOldPrice.textContent = shipping.oldPrice;
        }
      }
    } catch(e) {}
  }

  function formatCpf(val) {
    const digits = val.replace(/\\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return digits.slice(0, 3) + '.' + digits.slice(3);
    if (digits.length <= 9) return digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6);
    return digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6, 9) + '-' + digits.slice(9);
  }

  function formatCnpj(val) {
    const digits = val.replace(/\\D/g, '').slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return digits.slice(0, 2) + '.' + digits.slice(2);
    if (digits.length <= 8) return digits.slice(0, 2) + '.' + digits.slice(2, 5) + '.' + digits.slice(5);
    if (digits.length <= 12) return digits.slice(0, 2) + '.' + digits.slice(2, 5) + '.' + digits.slice(5, 8) + '/' + digits.slice(8);
    return digits.slice(0, 2) + '.' + digits.slice(2, 5) + '.' + digits.slice(5, 8) + '/' + digits.slice(8, 12) + '-' + digits.slice(12);
  }

  if (cpfInput) {
    cpfInput.addEventListener('input', function() {
      const rawDigits = cpfInput.value.replace(/\\D/g, '');
      if (rawDigits.length > 11 && currentDocType === 'cpf') {
        setDocType('cnpj');
        cpfInput.value = formatCnpj(rawDigits);
      } else if (currentDocType === 'cnpj') {
        cpfInput.value = formatCnpj(cpfInput.value);
      } else {
        cpfInput.value = formatCpf(cpfInput.value);
      }
      checkFormValidity();
    });
  }

  if (nameInput) {
    nameInput.addEventListener('input', checkFormValidity);
  }

  function checkFormValidity() {
    if (finalizeBtn) {
      finalizeBtn.classList.remove('olx-core-button--disabled');
      finalizeBtn.setAttribute('aria-disabled', 'false');
      finalizeBtn.style.opacity = '1';
      finalizeBtn.style.cursor = 'pointer';
    }
  }

  function openFinalizeModal() {
    syncModalValues();
    setDocType(currentDocType);
    checkFormValidity();
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      overlay.classList.add('is-open');
    });
    if (nameInput && !nameInput.value) {
      nameInput.focus();
    }
  }

  function closeFinalizeModal() {
    overlay.classList.remove('is-open');
    setTimeout(() => {
      overlay.style.display = 'none';
      document.body.style.overflow = '';
    }, 200);
  }

  window.openFinalizePurchaseModal = openFinalizeModal;
  window.closeFinalizePurchaseModal = closeFinalizeModal;

  if (closeBtn) {
    closeBtn.addEventListener('click', closeFinalizeModal);
  }

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      closeFinalizeModal();
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeFinalizeModal();
    }
  });

  // Action when clicking "Finalizar compra" inside modal
  if (finalizeBtn) {
    finalizeBtn.addEventListener('click', function(e) {
      e.preventDefault();

      const nameVal = nameInput && nameInput.value.trim() ? nameInput.value.trim() : '';
      const docVal = cpfInput && cpfInput.value.trim() ? cpfInput.value.trim() : '';
      const docDigits = docVal.replace(/\\D/g, '');

      if (!nameVal) {
        if (nameInput) {
          nameInput.focus();
          nameInput.style.borderColor = '#dc2626';
        }
        return;
      }
      if (nameInput) nameInput.style.borderColor = '#cfd4dd';

      const minLen = currentDocType === 'cnpj' ? 14 : 11;
      if (docDigits.length < minLen) {
        if (cpfInput) {
          cpfInput.focus();
          cpfInput.style.borderColor = '#dc2626';
        }
        return;
      }
      if (cpfInput) cpfInput.style.borderColor = '#cfd4dd';

      // Save for pix.html
      localStorage.setItem('olx_buyer_name', nameVal);
      localStorage.setItem('olx_buyer_cpf', docVal);
      localStorage.setItem('olx_payer_name', nameVal);
      localStorage.setItem('olx_payer_cpf', docVal);
      localStorage.setItem('olx_doc_type', currentDocType);
      sessionStorage.removeItem('olx_pix_data');

      // Close modal
      closeFinalizeModal();

      // Show the "Estamos gerando seu código PIX. Aguarde..." screen
      const generatingScreen = document.getElementById('olx-generating-pix-screen');
      if (generatingScreen) {
        generatingScreen.style.display = 'flex';
        document.body.style.overflow = 'hidden';
      }

      // Pre-gerar o Pix enquanto exibe a tela de carregamento para abrir /pix já 100% pronto
      const rawPrice = parseFloat(localStorage.getItem('olx_price')) || 800.00;
      const prodTitle = localStorage.getItem('olx_product_title') || 'Produto OLX';
      fetch('/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: rawPrice,
          payerName: nameVal,
          payerDocument: docVal,
          description: 'Compra segura OLX - ' + prodTitle,
          externalId: 'olx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)
        })
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && data.success) {
          sessionStorage.setItem('olx_pix_data', JSON.stringify(data));
        }
      })
      .catch(function() {});

      // Redirect after 1.8 seconds to Pix screen
      setTimeout(function() {
        window.location.href = '/pix.html';
      }, 1800);
    });
  }

  // Bind to ALL "Confirmar pagamento" buttons on checkout.html!
  function attachConfirmPaymentTriggers() {
    const allButtons = Array.from(document.querySelectorAll('button'));
    const confirmButtons = allButtons.filter(b => b.textContent && b.textContent.includes('Confirmar pagamento'));

    confirmButtons.forEach(btn => {
      btn.onclick = null;
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openFinalizeModal();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachConfirmPaymentTriggers);
  } else {
    attachConfirmPaymentTriggers();
  }
})();
</script>
`;

// Insert modal before </body>
const bodyEnd = html.lastIndexOf('</body>');
if (bodyEnd !== -1) {
  html = html.slice(0, bodyEnd) + finalizeModalMarkup + '\n' + html.slice(bodyEnd);
} else {
  html += '\n' + finalizeModalMarkup;
}

fs.writeFileSync('checkout.html', html, 'utf8');
console.log('Successfully injected CPF/CNPJ toggle and Finalize Modal into checkout.html');
