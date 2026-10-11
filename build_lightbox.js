const fs = require('fs');

const lightboxMarkup = `
<!-- OLX Photo Lightbox Modal Component -->
<div id="olx-photo-lightbox" class="olx-photo-lightbox" style="display: none;" role="dialog" aria-modal="true" aria-label="Visualizador de fotos">
  <style>
    .olx-photo-lightbox {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: #f4f5f7;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      user-select: none;
      -webkit-user-select: none;
      font-family: Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      box-sizing: border-box;
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    }
    .olx-photo-lightbox.is-open {
      opacity: 1;
    }
    .olx-photo-lightbox__topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 32px 12px 32px;
      width: 100%;
      box-sizing: border-box;
      z-index: 10;
    }
    .olx-photo-lightbox__counter {
      font-size: 15px;
      font-weight: 500;
      color: #1a1d23;
      letter-spacing: 0.5px;
    }
    .olx-photo-lightbox__close-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1a1d23;
      transition: background-color 0.15s ease;
    }
    .olx-photo-lightbox__close-btn:hover {
      background-color: #e5e7eb;
    }
    .olx-photo-lightbox__stage {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 100%;
      min-height: 0;
      padding: 0 70px;
      box-sizing: border-box;
    }
    .olx-photo-lightbox__image-container {
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: 100%;
      max-height: 100%;
      position: relative;
    }
    .olx-photo-lightbox__main-img {
      max-height: calc(100vh - 175px);
      max-width: min(85vw, 860px);
      object-fit: contain;
      border-radius: 4px;
      display: block;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: opacity 0.18s ease-in-out, transform 0.18s ease-in-out;
    }
    .olx-photo-lightbox__nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 38px;
      height: 38px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
      color: #1a1d23;
      z-index: 20;
      transition: background-color 0.15s, border-color 0.15s, box-shadow 0.15s, transform 0.1s;
    }
    .olx-photo-lightbox__nav-btn:hover {
      background-color: #f9fafb;
      border-color: #d1d5db;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    }
    .olx-photo-lightbox__nav-btn:active {
      transform: translateY(-50%) scale(0.94);
    }
    .olx-photo-lightbox__nav-btn--prev {
      left: 24px;
    }
    .olx-photo-lightbox__nav-btn--next {
      right: 24px;
    }
    .olx-photo-lightbox__bottom {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 24px 24px 24px;
      width: 100%;
      box-sizing: border-box;
      gap: 12px;
      z-index: 10;
    }
    .olx-photo-lightbox__thumbs-track {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow-x: auto;
      max-width: calc(100vw - 120px);
      padding: 4px 6px;
      scrollbar-width: none;
    }
    .olx-photo-lightbox__thumbs-track::-webkit-scrollbar {
      display: none;
    }
    .olx-photo-lightbox__thumb {
      width: 52px;
      height: 52px;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      flex-shrink: 0;
      border: 2px solid transparent;
      opacity: 0.65;
      background: #e2e8f0;
      transition: opacity 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
      padding: 0;
    }
    .olx-photo-lightbox__thumb:hover {
      opacity: 0.95;
    }
    .olx-photo-lightbox__thumb.is-active {
      opacity: 1;
      border-color: #1a1d23;
      transform: scale(1.02);
    }
    .olx-photo-lightbox__thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .olx-photo-lightbox__logo-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      margin-left: 6px;
    }

    @media (max-width: 640px) {
      .olx-photo-lightbox__topbar {
        padding: 16px 16px 8px 16px;
      }
      .olx-photo-lightbox__stage {
        padding: 0 12px;
      }
      .olx-photo-lightbox__nav-btn {
        width: 32px;
        height: 32px;
      }
      .olx-photo-lightbox__nav-btn--prev {
        left: 8px;
      }
      .olx-photo-lightbox__nav-btn--next {
        right: 8px;
      }
      .olx-photo-lightbox__main-img {
        max-height: calc(100vh - 150px);
        max-width: 95vw;
      }
      .olx-photo-lightbox__thumb {
        width: 44px;
        height: 44px;
      }
      .olx-photo-lightbox__bottom {
        padding: 8px 12px 16px 12px;
      }
    }
  </style>

  <!-- Top Bar: Counter & Close -->
  <div class="olx-photo-lightbox__topbar">
    <span id="olx-lightbox-counter" class="olx-photo-lightbox__counter">1/6</span>
    <button type="button" id="olx-lightbox-close" class="olx-photo-lightbox__close-btn" aria-label="Fechar galeria">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a1d23" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>

  <!-- Stage: Main Image & Prev/Next Arrows -->
  <div class="olx-photo-lightbox__stage" id="olx-lightbox-stage">
    <button type="button" id="olx-lightbox-prev" class="olx-photo-lightbox__nav-btn olx-photo-lightbox__nav-btn--prev" aria-label="Imagem anterior">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1d23" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>

    <div class="olx-photo-lightbox__image-container">
      <img id="olx-lightbox-main-img" class="olx-photo-lightbox__main-img" src="/images/foto-1.jpg" alt="Foto ampliada do iPhone 17" />
    </div>

    <button type="button" id="olx-lightbox-next" class="olx-photo-lightbox__nav-btn olx-photo-lightbox__nav-btn--next" aria-label="Próxima imagem">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1d23" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
  </div>

  <!-- Bottom: Thumbnails & OLX Logo -->
  <div class="olx-photo-lightbox__bottom">
    <div class="olx-photo-lightbox__thumbs-track" id="olx-lightbox-thumbs"></div>
    <div class="olx-photo-lightbox__logo-wrap">
      <svg viewBox="0 0 40 40" width="34" height="34" class="olx-logo-olx" aria-hidden="true">
        <g fill="none" fill-rule="evenodd">
          <path fill="#6E0AD6" d="M7.579 26.294c-2.282 0-3.855-1.89-3.855-4.683 0-2.82 1.573-4.709 3.855-4.709 2.28 0 3.855 1.889 3.855 4.682 0 2.82-1.574 4.71-3.855 4.71m0 3.538c4.222 0 7.578-3.512 7.578-8.248 0-4.682-3.173-8.22-7.578-8.22C3.357 13.363 0 16.874 0 21.61c0 4.763 3.173 8.221 7.579 8.221"></path>
          <path fill="#6E0AD6" d="M18.278 23.553h7.237c.499 0 .787-.292.787-.798V20.44c0-.505-.288-.798-.787-.798h-4.851V9.798c0-.505-.288-.798-.787-.798h-2.386c-.498 0-.787.293-.787.798v12.159c0 1.038.551 1.596 1.574 1.596"></path>
          <path fill="#F28000" d="M28.112 29.593l4.353-5.082 4.222 5.082c.367.452.839.452 1.258.08l1.705-1.517c.42-.373.472-.851.079-1.277l-4.694-5.321 4.274-4.869c.367-.426.34-.878-.078-1.277l-1.6-1.463c-.42-.4-.892-.373-1.259.08l-3.907 4.602-3.986-4.603c-.367-.425-.84-.479-1.259-.08l-1.652 1.49c-.42.4-.446.825-.053 1.278l4.354 4.868-4.747 5.348c-.393.452-.34.905.079 1.277l1.652 1.464c.42.372.89.372 1.258-.08"></path>
        </g>
      </svg>
    </div>
  </div>
</div>

<script id="olx-lightbox-script">
(function() {
  // Photos array in exact order matching the listing
  const photos = [
    {
      url: '/images/foto-1.jpg',
      fallback: 'https://img.olx.com.br/images/63/630653332183373.jpg',
      alt: 'iPhone 17 branco - Traseira com mão'
    },
    {
      url: '/images/foto-2.jpg',
      fallback: 'https://img.olx.com.br/images/66/662611575228586.jpg',
      alt: 'iPhone 17 branco - Detalhe da câmera'
    },
    {
      url: '/images/foto-4.jpg',
      fallback: 'https://img.olx.com.br/images/68/682620330363369.jpg',
      alt: 'iPhone 17 branco - Conector USB-C e alto-falante'
    },
    {
      url: '/images/foto-3.jpg',
      fallback: 'https://img.olx.com.br/images/67/675611217616864.jpg',
      alt: 'iPhone 17 branco - Na caixa original'
    },
    {
      url: '/images/foto-6.jpg',
      fallback: 'https://img.olx.com.br/images/70/701655217208370.jpg',
      alt: 'iPhone 17 branco - Saúde da bateria 99% e 150 ciclos'
    },
    {
      url: '/images/foto-5.jpg',
      fallback: 'https://img.olx.com.br/images/69/699666094916655.jpg',
      alt: 'iPhone 17 branco - Vista lateral e botões'
    }
  ];

  let currentIndex = 0;
  const modal = document.getElementById('olx-photo-lightbox');
  const mainImg = document.getElementById('olx-lightbox-main-img');
  const counter = document.getElementById('olx-lightbox-counter');
  const thumbsTrack = document.getElementById('olx-lightbox-thumbs');
  const closeBtn = document.getElementById('olx-lightbox-close');
  const prevBtn = document.getElementById('olx-lightbox-prev');
  const nextBtn = document.getElementById('olx-lightbox-next');
  const stage = document.getElementById('olx-lightbox-stage');

  if (!modal || !mainImg || !thumbsTrack) return;

  // Build thumbnails dynamically
  thumbsTrack.innerHTML = '';
  photos.forEach((photo, idx) => {
    const thumbBtn = document.createElement('button');
    thumbBtn.type = 'button';
    thumbBtn.className = 'olx-photo-lightbox__thumb' + (idx === 0 ? ' is-active' : '');
    thumbBtn.setAttribute('aria-label', 'Ver foto ' + (idx + 1));
    thumbBtn.innerHTML = '<img src="' + photo.url + '" alt="' + photo.alt + '" onerror="this.src=\\'' + photo.fallback + '\\'" />';
    thumbBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      goToSlide(idx);
    });
    thumbsTrack.appendChild(thumbBtn);
  });

  function updateLightboxUI() {
    const photo = photos[currentIndex];
    mainImg.style.opacity = '0';
    setTimeout(() => {
      mainImg.src = photo.url;
      mainImg.alt = photo.alt;
      mainImg.onerror = function() {
        this.src = photo.fallback;
      };
      mainImg.style.opacity = '1';
    }, 80);

    counter.textContent = (currentIndex + 1) + '/' + photos.length;

    // Update active thumbnail
    const thumbButtons = thumbsTrack.querySelectorAll('.olx-photo-lightbox__thumb');
    thumbButtons.forEach((btn, i) => {
      if (i === currentIndex) {
        btn.classList.add('is-active');
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        btn.classList.remove('is-active');
      }
    });
  }

  function goToSlide(index) {
    if (index < 0) {
      currentIndex = photos.length - 1;
    } else if (index >= photos.length) {
      currentIndex = 0;
    } else {
      currentIndex = index;
    }
    updateLightboxUI();
  }

  function openLightbox(startIndex) {
    currentIndex = (typeof startIndex === 'number' && startIndex >= 0 && startIndex < photos.length) ? startIndex : 0;
    updateLightboxUI();
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      modal.classList.add('is-open');
    });
  }

  function closeLightbox() {
    modal.classList.remove('is-open');
    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }, 200);
  }

  // Exposed globally
  window.openOlxLightbox = openLightbox;
  window.closeOlxLightbox = closeLightbox;

  // Event listeners
  if (closeBtn) {
    closeBtn.addEventListener('click', closeLightbox);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      goToSlide(currentIndex - 1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      goToSlide(currentIndex + 1);
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (modal.style.display === 'none') return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
    else if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
  });

  // Clicking backdrop outside main image to close
  modal.addEventListener('click', function(e) {
    if (e.target === modal || e.target === stage) {
      closeLightbox();
    }
  });

  // Mobile swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  stage.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  stage.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    if (touchEndX < touchStartX - 50) {
      goToSlide(currentIndex + 1); // Swipe left -> next
    } else if (touchEndX > touchStartX + 50) {
      goToSlide(currentIndex - 1); // Swipe right -> prev
    }
  }, { passive: true });

  // Bind gallery triggers in the page
  function attachGalleryTriggers() {
    // 1. Specific buttons in grid
    const item0 = document.getElementById('item-gallery-image-0');
    const item1 = document.getElementById('item-gallery-image-1');
    const item2 = document.getElementById('item-gallery-image-2');
    const item3 = document.getElementById('item-gallery-image-3');
    const item4 = document.getElementById('item-gallery-image-4');

    if (item0) item0.addEventListener('click', () => openLightbox(0));
    if (item1) item1.addEventListener('click', () => openLightbox(1));
    if (item2) item2.addEventListener('click', () => openLightbox(2));
    if (item3) item3.addEventListener('click', () => openLightbox(3));
    if (item4) item4.addEventListener('click', () => openLightbox(4));

    // 2. Any .advc-gallery__item or child element
    const galleryItems = document.querySelectorAll('.advc-gallery__item');
    galleryItems.forEach((btn, index) => {
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        openLightbox(index);
      });
    });

    // 3. The "+1" overlay button specifically
    const moreBtn = document.querySelector('.advc-gallery__more');
    if (moreBtn) {
      moreBtn.style.cursor = 'pointer';
      moreBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openLightbox(4);
      });
    }

    // 4. Any image inside #gallery
    const galleryContainer = document.getElementById('gallery');
    if (galleryContainer) {
      galleryContainer.addEventListener('click', function(e) {
        const item = e.target.closest('.advc-gallery__item');
        if (item) {
          const id = item.id;
          const match = id && id.match(/item-gallery-image-(\\d+)/);
          if (match) {
            openLightbox(parseInt(match[1], 10));
          }
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachGalleryTriggers);
  } else {
    attachGalleryTriggers();
  }
})();
</script>
`;

// Inject into iphone-17-branco-olx.html and index.html
['iphone-17-branco-olx.html', 'index.html'].forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Remove previous lightbox injection if any
  if (content.includes('id="olx-photo-lightbox"')) {
    const start = content.indexOf('<!-- OLX Photo Lightbox Modal Component -->');
    const end = content.indexOf('</script>', content.indexOf('id="olx-lightbox-script"')) + 9;
    if (start !== -1 && end > start) {
      content = content.slice(0, start) + content.slice(end);
    }
  }

  // Insert before </body>
  const bodyEnd = content.lastIndexOf('</body>');
  if (bodyEnd !== -1) {
    content = content.slice(0, bodyEnd) + lightboxMarkup + '\n' + content.slice(bodyEnd);
  } else {
    content += '\n' + lightboxMarkup;
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Successfully injected lightbox into ${file}`);
});
