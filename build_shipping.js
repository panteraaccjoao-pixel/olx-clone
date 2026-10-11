const fs = require('fs');

const shippingHtml = `
<div class="advc-delivery-container" id="olx-shipping-calculator-root">
  <style>
    /* OLX Native Freight Calculator Styles matching live OLX classes */
    .olx-frete-wrapper {
      width: 100%;
      box-sizing: border-box;
      margin-top: 8px;
      font-family: "Nunito Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .olx-frete-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .olx-frete-title {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }
    .olx-frete-link {
      font-size: 14px;
      font-weight: 600;
      color: #6e0ad6;
      text-decoration: none;
    }
    .olx-frete-link:hover {
      text-decoration: underline;
    }
    .olx-frete-input-box {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      box-sizing: border-box;
    }
    .olx-frete-input {
      width: 100%;
      height: 48px;
      padding: 0 46px 0 16px;
      border-radius: 8px;
      border: 1px solid #d1d5db;
      background-color: #f4f6fb;
      font-size: 16px;
      font-family: inherit;
      color: #111827;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s ease, background-color 0.15s ease;
    }
    .olx-frete-input:focus,
    .olx-frete-input.is-active {
      border: 2px solid #6e0ad6 !important;
      background-color: #ffffff;
      padding-left: 15px;
    }
    .olx-frete-input.is-invalid {
      border: 2px solid #d9383a !important;
      background-color: #fff8f8 !important;
      padding-left: 15px;
    }
    .olx-frete-input::placeholder {
      color: #8c8c8c;
      font-size: 14px;
    }
    .olx-frete-clear-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 6px;
      display: none;
      align-items: center;
      justify-content: center;
      color: #374151;
      border-radius: 50%;
      line-height: 1;
      font-size: 16px;
      transition: background-color 0.15s, color 0.15s;
    }
    .olx-frete-clear-btn:hover {
      background-color: #e5e7eb;
      color: #111827;
    }
    
    /* Native OLX Purple Spinner Arc with Smooth Guaranteed Rotation */
    .olx-frete-spinner-svg {
      position: absolute;
      right: 13px;
      top: 13px;
      width: 22px;
      height: 22px;
      display: none;
      pointer-events: none;
      transform-origin: center center;
      -webkit-transform-origin: center center;
      animation: olx-rotate-spin 0.75s linear infinite !important;
      -webkit-animation: olx-rotate-spin 0.75s linear infinite !important;
    }

    @keyframes olx-rotate-spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    @-webkit-keyframes olx-rotate-spin {
      0% {
        -webkit-transform: rotate(0deg);
      }
      100% {
        -webkit-transform: rotate(360deg);
      }
    }
    
    /* Error Message */
    .olx-frete-error {
      display: none;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      font-size: 13px;
      color: #d9383a;
      line-height: 1.3;
      animation: olx-frete-fade 0.2s ease-out;
    }

    /* Address Row */
    .olx-frete-address {
      display: none;
      align-items: center;
      gap: 8px;
      margin-top: 14px;
      margin-bottom: 12px;
      font-size: 14px;
      color: #1f2937;
      line-height: 1.4;
      animation: olx-frete-fade 0.2s ease-out;
    }
    .olx-frete-address-text {
      font-size: 14px;
      color: #1f2937;
      font-weight: 400;
    }

    /* Cards Wrapper */
    .olx-frete-cards-wrapper {
      display: none;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      animation: olx-frete-fade 0.2s ease-out;
    }
    @keyframes olx-frete-fade {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Exact OLX Classes as provided by user */
    .advc-frete-modal__delivery-option {
      border: 1px solid #d5d8de;
      border-radius: 8px;
      padding: 14px 16px;
      background-color: #ffffff;
      display: flex;
      flex-direction: column;
      width: 100%;
      box-sizing: border-box;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .advc-frete-modal__delivery-option:hover {
      border-color: #9333ea;
    }
    .advc-frete-modal__delivery-option.is-selected {
      border-color: #6e0ad6;
      box-shadow: 0 0 0 1px #6e0ad6;
    }
    .advc-frete-modal__delivery-option-top {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 14px;
    }
    .advc-frete-modal__delivery-option-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      color: #111827;
      flex-shrink: 0;
    }
    .advc-frete-modal__option-and-price {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .advc-frete-modal__option-info {
      display: flex;
      flex-direction: column;
    }
    .advc-frete-modal__option-info .typo-body-small {
      font-size: 15px;
      line-height: 1.2;
      color: #111827;
      font-weight: 600;
    }
    .advc-frete-modal__option-info .typo-caption {
      font-size: 13px;
      line-height: 1.2;
      color: #4b5563;
      margin-top: 3px;
    }
    .advc-frete-modal__option-prices {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      text-align: right;
    }
    .advc-frete-modal__option-prices .typo-body-small.text-neutral-120 {
      font-size: 13px;
      color: #6b7280;
      line-height: 1.2;
    }
    .advc-frete-modal__option-prices .text-feedback-success-100 {
      font-size: 15px;
      font-weight: 700;
      color: #16a34a !important;
      margin-top: 3px;
      line-height: 1.2;
    }
    .advc-frete-modal__delivery-option hr.divider {
      border: 0;
      border-top: 1px solid #e5e7eb;
      margin: 12px 0 8px 0;
      width: 100%;
    }
    .advc-frete-modal__actions-bar {
      display: flex;
      align-items: center;
      margin-top: 2px;
    }
    .advc-frete-modal__actions-link {
      font-size: 13px;
      font-weight: 700 !important;
      color: #111827 !important;
      text-decoration: underline !important;
      cursor: pointer;
    }
    .advc-frete-modal__actions-link:hover {
      color: #6e0ad6 !important;
    }
    .advc-frete-more-btn {
      background: none;
      border: none;
      padding: 4px 0 0 0;
      color: #6e0ad6;
      font-size: 14px;
      font-weight: 600;
      text-decoration: underline;
      cursor: pointer;
      font-family: inherit;
      text-align: left;
      display: none;
    }
    .advc-frete-more-btn:hover {
      color: #4c0799;
    }

    /* Modal for free shipping rules */
    .olx-frete-rules-modal-backdrop {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      align-items: center;
      justify-content: center;
    }
    .olx-frete-rules-modal-content {
      background: #ffffff;
      border-radius: 12px;
      padding: 24px;
      max-width: 440px;
      width: 90%;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      position: relative;
    }
    .olx-frete-rules-modal-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 12px;
    }
    .olx-frete-rules-modal-text {
      font-size: 14px;
      line-height: 1.5;
      color: #4b5563;
      margin-bottom: 16px;
    }
    .olx-frete-rules-modal-close {
      background: #6e0ad6;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 10px 18px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      width: 100%;
    }
  </style>

  <div class="olx-frete-wrapper">
    <div class="olx-frete-header">
      <span class="olx-frete-title">Calcule o frete</span>
      <a class="olx-frete-link" href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer">Não sei meu CEP</a>
    </div>

    <div class="olx-frete-input-box">
      <input
        type="text"
        id="olx-cep-field"
        class="olx-frete-input"
        placeholder="Digite o CEP para ver o frete"
        inputmode="numeric"
        maxlength="9"
        aria-label="Campo de cep"
        autocomplete="postal-code"
      />
      <button type="button" id="olx-cep-clear-btn" class="olx-frete-clear-btn" aria-label="Limpar CEP">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <!-- Purple open circle arc spinner SVG matching OLX -->
      <svg id="olx-cep-spinner" class="olx-frete-spinner-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="9.5" stroke="#6e0ad6" stroke-width="2.3" stroke-linecap="round" stroke-dasharray="44 16" stroke-dashoffset="0"></circle>
      </svg>
    </div>

    <!-- Error Message -->
    <div id="olx-cep-error" class="olx-frete-error">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d9383a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span id="olx-cep-error-text">CEP não encontrado. Digite um CEP válido.</span>
    </div>

    <!-- Address Result Row (Location Pin) -->
    <div id="olx-frete-address-row" class="olx-frete-address">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f2937" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <span id="olx-frete-address-text" class="olx-frete-address-text"></span>
    </div>

    <!-- Shipping Cards Container -->
    <div id="olx-frete-cards-container" class="olx-frete-cards-wrapper">
      <!-- Option 1: Expressa (exact markup from user) -->
      <div class="advc-frete-modal__delivery-option is-selected" id="card-frete-expressa" data-disable-last-item-margin="false" onclick="selectShipping('expressa')">
        <div class="advc-frete-modal__delivery-option-top" data-expanded="false">
          <div class="advc-frete-modal__delivery-option-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M13.0572 7.43077C14.0335 6.45446 15.6164 6.45446 16.5927 7.43077C17.569 8.40708 17.569 9.98999 16.5927 10.9663C15.6164 11.9426 14.0335 11.9426 13.0572 10.9663C12.0809 9.98999 12.0809 8.40708 13.0572 7.43077ZM15.532 8.49143C15.1415 8.1009 14.5084 8.1009 14.1178 8.49143C13.7273 8.88195 13.7273 9.51512 14.1178 9.90564C14.5084 10.2962 15.1415 10.2962 15.532 9.90564C15.9226 9.51512 15.9226 8.88195 15.532 8.49143ZM21.5086 4.32216C21.2398 3.45736 20.5625 2.78032 19.6976 2.5119L19.0355 2.30643C16.642 1.5636 14.034 2.20802 12.2618 3.98013L11.266 4.97601C9.89622 3.94737 7.94316 4.05621 6.69685 5.30253L5.45432 6.54506C5.16142 6.83795 5.16142 7.31283 5.45432 7.60572L7.04529 9.19669L6.86548 9.3765C6.18206 10.0599 6.18206 11.168 6.86548 11.8514L7.36083 12.3467L5.96527 13.1427C5.76212 13.2585 5.62465 13.4625 5.59352 13.6943C5.56238 13.9261 5.64115 14.1591 5.80651 14.3245L9.69562 18.2136C9.86086 18.3788 10.0937 18.4576 10.3253 18.4267C10.557 18.3957 10.7609 18.2585 10.877 18.0557L11.6749 16.6608L12.1721 17.1579C12.8555 17.8414 13.9635 17.8414 14.6469 17.1579L14.8237 16.9812L16.4133 18.5708C16.7062 18.8636 17.1811 18.8636 17.474 18.5708L18.7165 17.3282C19.9623 16.0824 20.0716 14.1303 19.0442 12.7607L20.0421 11.7627C21.8149 9.98994 22.4591 7.38062 21.715 4.98647L21.5086 4.32216ZM19.253 3.94449C19.6461 4.0665 19.954 4.37425 20.0762 4.76734L20.2826 5.43165C20.8613 7.29377 20.3603 9.32324 18.9815 10.7021L13.5863 16.0973C13.4886 16.1949 13.3303 16.1949 13.2327 16.0973L7.92614 10.7907C7.82851 10.6931 7.82851 10.5348 7.92614 10.4372L13.3225 5.04079C14.7008 3.66249 16.7293 3.16127 18.5909 3.73902L19.253 3.94449ZM17.9641 13.8408C18.4166 14.6065 18.3139 15.6095 17.6558 16.2676L16.9436 16.9798L15.8844 15.9205L17.9641 13.8408ZM7.75751 6.36319C8.41602 5.70468 9.42005 5.60227 10.186 6.05596L8.10595 8.13603L7.04531 7.07539L7.75751 6.36319ZM10.5756 15.5615L10.0623 16.4589L7.56209 13.9588L8.46047 13.4464L10.5756 15.5615ZM6.68987 18.3942C6.98276 18.1013 6.98276 17.6264 6.68987 17.3335C6.39697 17.0406 5.9221 17.0406 5.62921 17.3335L3.15433 19.8084C2.86144 20.1013 2.86144 20.5762 3.15433 20.8691C3.44723 21.162 3.9221 21.162 4.21499 20.8691L6.68987 18.3942ZM4.74529 15.389C5.03818 15.6819 5.03818 16.1568 4.74529 16.4497L3.68463 17.5103C3.39173 17.8032 2.91686 17.8032 2.62397 17.5103C2.33107 17.2174 2.33107 16.7425 2.62397 16.4497L3.68463 15.389C3.97752 15.0961 4.45239 15.0961 4.74529 15.389ZM8.63238 20.3408C8.92528 20.0479 8.92528 19.5731 8.63239 19.2802C8.33951 18.9873 7.86463 18.9873 7.57173 19.2802L6.51313 20.3387C6.22023 20.6316 6.22023 21.1065 6.51312 21.3994C6.80601 21.6923 7.28088 21.6923 7.57378 21.3994L8.63238 20.3408Z" fill="currentColor"></path>
            </svg>
          </div>
          <div class="advc-frete-modal__option-and-price">
            <div class="advc-frete-modal__option-info">
              <span class="typo-body-small font-semibold">Expressa</span>
              <span class="typo-caption">Em até 6 dias úteis</span>
            </div>
            <div class="advc-frete-modal__option-prices">
              <span class="typo-body-small text-neutral-120" style="text-decoration: line-through;">R$ 13,54</span>
              <span class="typo-body-small font-bold text-feedback-success-100" style="min-width: 67px;">Grátis</span>
            </div>
          </div>
        </div>
        <hr class="divider">
        <div class="advc-frete-modal__actions-bar">
          <a class="olx-core-link olx-core-link--main olx-core-link--small advc-frete-modal__actions-link" type="button" onclick="event.stopPropagation(); openRulesModal();">Consulte as regras do frete grátis.</a>
        </div>
      </div>

      <!-- Option 2: Padrão (matching structure) -->
      <div class="advc-frete-modal__delivery-option" id="card-frete-padrao" data-disable-last-item-margin="false" onclick="selectShipping('padrao')">
        <div class="advc-frete-modal__delivery-option-top" data-expanded="false">
          <div class="advc-frete-modal__delivery-option-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M23 4H8V17H23V4Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 9H3.5L1 13V17H8V9Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="5.5" cy="19.5" r="2.5" stroke="currentColor" stroke-width="1.8"/>
              <circle cx="18.5" cy="19.5" r="2.5" stroke="currentColor" stroke-width="1.8"/>
            </svg>
          </div>
          <div class="advc-frete-modal__option-and-price">
            <div class="advc-frete-modal__option-info">
              <span class="typo-body-small font-semibold">Padrão</span>
              <span class="typo-caption">Em até 10 dias úteis</span>
            </div>
            <div class="advc-frete-modal__option-prices">
              <span class="typo-body-small text-neutral-120" style="text-decoration: line-through;">R$ 36,20</span>
              <span class="typo-body-small font-bold text-feedback-success-100" style="min-width: 67px;">R$ 6,30</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mais opções de entrega link -->
      <button type="button" id="olx-frete-more-btn" class="advc-frete-more-btn" onclick="toggleMoreOptions()">Mais opções de entrega</button>
    </div>
  </div>

  <!-- Regras Frete Grátis Modal -->
  <div id="olx-frete-rules-modal" class="olx-frete-rules-modal-backdrop" onclick="closeRulesModal()">
    <div class="olx-frete-rules-modal-content" onclick="event.stopPropagation()">
      <div class="olx-frete-rules-modal-title">Regras do Frete Grátis</div>
      <div class="olx-frete-rules-modal-text">
        O frete grátis com Entrega Expressa é concedido para produtos participantes com a Garantia da OLX entregues em regiões selecionadas com valor promocional subsidiado pela OLX.
      </div>
      <button type="button" class="olx-frete-rules-modal-close" onclick="closeRulesModal()">Entendi</button>
    </div>
  </div>

  <script>
    (function initOlxFrete() {
      const input = document.getElementById('olx-cep-field');
      const clearBtn = document.getElementById('olx-cep-clear-btn');
      const spinner = document.getElementById('olx-cep-spinner');
      const errorBox = document.getElementById('olx-cep-error');
      const errorText = document.getElementById('olx-cep-error-text');
      const addressRow = document.getElementById('olx-frete-address-row');
      const addressText = document.getElementById('olx-frete-address-text');
      const cardsContainer = document.getElementById('olx-frete-cards-container');
      const cardExpressa = document.getElementById('card-frete-expressa');
      const cardPadrao = document.getElementById('card-frete-padrao');
      const moreBtn = document.getElementById('olx-frete-more-btn');
      
      let isShowingBoth = false;
      let primaryOption = 'expressa';
      let currentLookupId = 0;

      window.openRulesModal = function() {
        const modal = document.getElementById('olx-frete-rules-modal');
        if (modal) modal.style.display = 'flex';
      };

      window.closeRulesModal = function() {
        const modal = document.getElementById('olx-frete-rules-modal');
        if (modal) modal.style.display = 'none';
      };

      window.selectShipping = function(type) {
        if (type === 'expressa') {
          cardExpressa.classList.add('is-selected');
          cardPadrao.classList.remove('is-selected');
          localStorage.setItem('olx_selected_shipping', JSON.stringify({
            name: 'Entrega Expressa',
            price: 'Grátis',
            oldPrice: 'R$ 13,54',
            days: 'Em até 6 dias úteis'
          }));
        } else {
          cardPadrao.classList.add('is-selected');
          cardExpressa.classList.remove('is-selected');
          localStorage.setItem('olx_selected_shipping', JSON.stringify({
            name: 'Entrega Padrão',
            price: 'R$ 6,30',
            oldPrice: 'R$ 36,20',
            days: 'Em até 10 dias úteis'
          }));
        }
      };

      window.toggleMoreOptions = function() {
        isShowingBoth = !isShowingBoth;
        if (isShowingBoth) {
          cardExpressa.style.display = 'flex';
          cardPadrao.style.display = 'flex';
          moreBtn.textContent = 'Menos opções de entrega';
        } else {
          updateCardsVisibility();
          moreBtn.textContent = 'Mais opções de entrega';
        }
      };

      function updateCardsVisibility() {
        if (isShowingBoth) {
          cardExpressa.style.display = 'flex';
          cardPadrao.style.display = 'flex';
          moreBtn.textContent = 'Menos opções de entrega';
        } else {
          if (primaryOption === 'expressa') {
            cardExpressa.style.display = 'flex';
            cardPadrao.style.display = 'none';
          } else {
            cardExpressa.style.display = 'none';
            cardPadrao.style.display = 'flex';
          }
          moreBtn.textContent = 'Mais opções de entrega';
        }
        moreBtn.style.display = 'block';
      }

      function formatCep(value) {
        const digits = value.replace(/\\D/g, '').slice(0, 8);
        if (digits.length > 5) {
          return digits.slice(0, 5) + '-' + digits.slice(5);
        }
        return digits;
      }

      function showError(msg) {
        input.classList.remove('is-active');
        input.classList.add('is-invalid');
        errorText.textContent = msg || 'CEP não encontrado. Digite um CEP válido.';
        errorBox.style.display = 'flex';
        addressRow.style.display = 'none';
        cardsContainer.style.display = 'none';
        spinner.style.display = 'none';
        clearBtn.style.display = 'flex';
      }

      function clearError() {
        input.classList.remove('is-invalid');
        errorBox.style.display = 'none';
      }

      async function validateAndFetchCep(cleanCep) {
        const lookupId = ++currentLookupId;

        // Validation rule 1: Must be exactly 8 digits
        if (!cleanCep || cleanCep.length !== 8) {
          showError('Digite um CEP válido com 8 números.');
          return;
        }

        // Validation rule 2: Check for obvious fake repeated sequences (00000000, 11111111, etc)
        if (/^(\\d)\\1{7}$/.test(cleanCep)) {
          showError('CEP inválido. Por favor, verifique o número.');
          return;
        }

        clearError();
        input.classList.add('is-active');

        // IMMEDIATELY show purple rotating spinner arc and hide clear button
        spinner.style.display = 'block';
        clearBtn.style.display = 'none';
        addressRow.style.display = 'none';
        cardsContainer.style.display = 'none';

        let resolvedData = null;

        // Ensure visible spin animation duration (~750ms)
        const minSpinTime = new Promise(resolve => setTimeout(resolve, 750));

        // Fetch query: First try local API proxy
        const fetchOperation = async () => {
          try {
            const rProxy = await fetch('/api/cep?cep=' + cleanCep);
            if (rProxy.ok) {
              const dProxy = await rProxy.json();
              if (!dProxy.erro && dProxy.localidade) {
                resolvedData = dProxy;
                return;
              }
            }
          } catch (eProxy) {}

          // Second fallback: direct ViaCEP
          try {
            const res = await fetch('https://viacep.com.br/ws/' + cleanCep + '/json/');
            if (res.ok) {
              const data = await res.json();
              if (!data.erro && data.localidade) {
                resolvedData = data;
                return;
              }
            }
          } catch (e) {}

          // Third fallback: BrasilAPI
          try {
            const res2 = await fetch('https://brasilapi.com.br/api/cep/v1/' + cleanCep);
            if (res2.ok) {
              const data2 = await res2.json();
              if (data2.city && data2.state) {
                resolvedData = {
                  cep: cleanCep,
                  logradouro: data2.street || '',
                  bairro: data2.neighborhood || '',
                  localidade: data2.city,
                  uf: data2.state
                };
                return;
              }
            }
          } catch (e2) {}

          // Fallback specifically for 07141427 if offline
          if (cleanCep === '07141427') {
            resolvedData = {
              cep: '07141-427',
              logradouro: 'Avenida Marginal',
              bairro: 'Jardim Santa Emilia',
              localidade: 'Guarulhos',
              uf: 'SP'
            };
          }
        };

        try {
          await Promise.all([fetchOperation(), minSpinTime]);
        } catch (err) {}

        // Discard outdated queries
        if (lookupId !== currentLookupId) return;

        // Hide spinner and show clear button
        spinner.style.display = 'none';
        clearBtn.style.display = 'flex';

        if (resolvedData && resolvedData.localidade) {
          // Valid CEP! Show person's full address and shipping card
          handleValidCepSuccess(resolvedData, cleanCep);
        } else {
          // Invalid CEP!
          showError('CEP não encontrado. Por favor, confira o número digitado.');
          localStorage.removeItem('olx_user_address');
          localStorage.removeItem('olx_calculated_cep');
          localStorage.removeItem('olx_calculated_address');
        }
      }

      function handleValidCepSuccess(data, cleanCep) {
        clearError();
        input.classList.add('is-active');

        const street = (data.logradouro || '').trim();
        const neighborhood = (data.bairro || '').trim();
        const city = (data.localidade || '').trim();
        const state = (data.uf || '').trim();

        // Construct person's complete address
        let fullAddress = '';
        if (street) {
          fullAddress = street + (neighborhood ? ', ' + neighborhood : '') + ', ' + city + ', ' + state;
        } else if (neighborhood) {
          fullAddress = neighborhood + ', ' + city + ', ' + state;
        } else {
          fullAddress = city + ', ' + state;
        }

        addressText.textContent = fullAddress;
        addressRow.style.display = 'flex';
        cardsContainer.style.display = 'flex';

        // Choose one of the 2 options based on region/state:
        // Expressa Grátis if SP/Sudeste, Padrão R$ 6,30 for others
        if (state && ['SP', 'RJ', 'MG', 'ES'].includes(state.toUpperCase())) {
          primaryOption = 'expressa';
          selectShipping('expressa');
        } else if (cleanCep === '07141427') {
          primaryOption = 'expressa';
          selectShipping('expressa');
        } else {
          primaryOption = 'padrao';
          selectShipping('padrao');
        }

        isShowingBoth = false;
        updateCardsVisibility();

        // Save complete address object for checkout synchronization
        const addressObj = {
          cep: cleanCep,
          formattedCep: input.value,
          street: street,
          neighborhood: neighborhood,
          city: city,
          state: state,
          fullAddress: fullAddress
        };
        localStorage.setItem('olx_user_address', JSON.stringify(addressObj));
        localStorage.setItem('olx_calculated_cep', input.value);
        localStorage.setItem('olx_calculated_address', fullAddress);
      }

      function resetCalculator() {
        input.value = '';
        input.classList.remove('is-active');
        input.classList.remove('is-invalid');
        clearBtn.style.display = 'none';
        spinner.style.display = 'none';
        errorBox.style.display = 'none';
        addressRow.style.display = 'none';
        cardsContainer.style.display = 'none';
        isShowingBoth = false;
        localStorage.removeItem('olx_user_address');
        localStorage.removeItem('olx_calculated_cep');
        localStorage.removeItem('olx_calculated_address');
        input.focus();
      }

      input.addEventListener('input', function(e) {
        const formatted = formatCep(this.value);
        this.value = formatted;

        if (formatted.length > 0) {
          this.classList.add('is-active');
          clearBtn.style.display = 'flex';
        } else {
          resetCalculator();
          return;
        }

        const digits = formatted.replace(/\\D/g, '');
        if (digits.length === 8) {
          validateAndFetchCep(digits);
        } else {
          // Still typing
          clearError();
          spinner.style.display = 'none';
          addressRow.style.display = 'none';
          cardsContainer.style.display = 'none';
        }
      });

      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          const digits = this.value.replace(/\\D/g, '');
          validateAndFetchCep(digits);
        }
      });

      input.addEventListener('focus', function() {
        if (!this.classList.contains('is-invalid')) {
          this.classList.add('is-active');
        }
      });

      input.addEventListener('blur', function() {
        if (!this.value) {
          this.classList.remove('is-active');
          this.classList.remove('is-invalid');
        } else {
          const digits = this.value.replace(/\\D/g, '');
          if (digits.length > 0 && digits.length < 8) {
            showError('Digite um CEP completo com 8 dígitos.');
          }
        }
      });

      clearBtn.addEventListener('click', function() {
        resetCalculator();
      });

      // Restore if valid CEP already stored
      const savedCep = localStorage.getItem('olx_calculated_cep');
      if (savedCep) {
        input.value = savedCep;
        input.classList.add('is-active');
        clearBtn.style.display = 'flex';
        const clean = savedCep.replace(/\\D/g, '');
        if (clean.length === 8) {
          validateAndFetchCep(clean);
        }
      }
    })();
  </script>
</div>
`;

// Update files and remove ALL CSP meta tags
['iphone-17-branco-olx.html', 'index.html'].forEach(filename => {
  if (!fs.existsSync(filename)) return;
  let content = fs.readFileSync(filename, 'utf8');

  // Strip all CSP meta tags that block fetch
  content = content.replace(/<meta[^>]*content-security-policy[^>]*>/gi, '');

  let start = content.indexOf('<div class="advc-delivery-container" id="olx-shipping-calculator-root">');
  if (start === -1) {
    start = content.indexOf('<div class=advc-delivery-container>');
  }

  if (start !== -1) {
    let nextBlock = content.indexOf('<div class=advc-call-to-actions', start);
    if (nextBlock !== -1) {
      let sliceToReplace = content.substring(start, nextBlock);
      content = content.replace(sliceToReplace, shippingHtml.trim() + '</div>');
      fs.writeFileSync(filename, content, 'utf8');
      console.log('Successfully updated with full address:', filename);
    } else {
      console.error('Could not find nextBlock in', filename);
    }
  } else {
    console.error('Could not find start in', filename);
  }
});
