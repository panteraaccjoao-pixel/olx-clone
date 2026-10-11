const fs = require('fs');
const path = require('path');

// 1. Read index.html to extract header and footer and style links
const indexHtml = fs.readFileSync('index.html', 'utf8');

const headerMatch = indexHtml.match(/<header[\s\S]*?<\/header>/i);
const headerHtml = headerMatch ? headerMatch[0] : '';

const footerMatch = indexHtml.match(/<footer[\s\S]*?<\/footer>/i);
const footerHtml = footerMatch ? footerMatch[0] : '';

// User snippet content
const snippet = fs.readFileSync('perfil_snippet.html', 'utf8');

// Build perfil.html
const perfilHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>William Navarro | Perfil do anunciante na OLX</title>
  <link rel="icon" href="https://static.olx.com.br/cd/general/favicon.ico">
  <link rel="stylesheet" href="/checkout-style1.css">
  <link rel="stylesheet" href="/olx_chunks_css.css">
  <style>
    :root {
      --color-primary-100: #6E0AD6;
      --color-primary-80: #A855F7;
      --color-primary-70: #C084FC;
      --color-neutral-130: #1A1D20;
      --color-neutral-120: #4A5568;
      --color-neutral-110: #718096;
      --color-neutral-90: #E2E8F0;
      --color-neutral-80: #F7FAFC;
      --color-neutral-70: #FFFFFF;
      --color-feedback-info-100: #0080FF;
      --color-feedback-attention-100: #F59E0B;
      --spacing-0-25: 2px;
      --spacing-1: 8px;
      --spacing-1-5: 12px;
      --border-radius-1: 4px;
    }
    body {
      background-color: #F8F9FA;
      color: var(--color-neutral-130);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    a { text-decoration: none; color: inherit; }
    
    /* Layout */
    #main.sc-206a520e-0 {
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    .sc-206a520e-1 {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    @media (min-width: 992px) {
      .sc-206a520e-1 {
        flex-direction: row;
        align-items: flex-start;
      }
      #profile-fixed {
        width: 320px;
        flex-shrink: 0;
        position: sticky;
        top: 24px;
      }
      #profile-listing {
        flex: 1;
        min-width: 0;
      }
    }

    /* Profile Fixed Sidebar Card */
    .sc-e48bb94-1.olx-container {
      background: #fff;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .sc-5642d660-0 {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    .sc-cbe5f5f1-0 img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      border: 2px solid #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    .sc-4ab85633-0 {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
    }
    .sc-4ab85633-2 {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10B981;
    }
    .sc-4ab85633-1 {
      font-size: 12px;
      color: #64748B;
      margin: 0;
    }
    .sc-f92f1d1e-0 {
      margin-top: 16px;
      border-top: 1px solid #F1F5F9;
      padding-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .sc-f92f1d1e-1 {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #475569;
      font-size: 13px;
    }
    .sc-f92f1d1e-2 {
      margin: 0;
    }

    /* History section */
    .sc-e3fee87b-0 {
      background: #fff;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .sc-e3fee87b-1 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }
    .sc-ffda45a8-0 {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: #F8FAFC;
    }
    .sc-ffda45a8-1 {
      font-size: 24px;
      font-weight: 700;
      margin: 4px 0 0 0;
      display: flex;
      align-items: baseline;
      gap: 4px;
      color: #1E293B;
    }

    /* Ratings Section */
    .sc-b13ae57f-0 {
      background: #fff;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .sc-42545084-0 {
      font-size: 32px;
      font-weight: 800;
      color: #0F172A;
      margin: 0;
    }
    .sc-33a130bb-0 {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 20px;
    }
    .sc-33a130bb-1 {
      border-bottom: 1px solid #F1F5F9;
      padding-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .sc-33a130bb-5 {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .sc-33a130bb-5 img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #E2E8F0;
    }
    .sc-33a130bb-2 {
      font-size: 13px;
      color: #334155;
      font-weight: 500;
      margin: 0;
    }

    /* Ads Section */
    .sc-206a520e-5 {
      background: #fff;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 20px;
    }
    .sc-ab591e97-0 {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 16px;
    }
    .sc-ab591e97-1 {
      font-size: 20px;
      font-weight: 700;
      margin: 0;
    }
    .sc-ab591e97-2 {
      font-size: 14px;
      color: #64748B;
      margin: 0;
    }
    
    /* Search & Filters */
    .sc-65ac10a6-5 {
      margin-bottom: 20px;
    }
    .olx-text-input__input-container {
      display: flex;
      align-items: center;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 0 12px;
      height: 44px;
      background: #fff;
    }
    .olx-text-input__input-field {
      border: none;
      outline: none;
      width: 100%;
      font-size: 14px;
      padding-left: 8px;
    }
    .sc-3ad14ab8-0 {
      margin-top: 12px;
    }
    .sc-3ad14ab8-2 {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .olx-dropdown__wrapper {
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 0 8px;
      height: 38px;
      display: flex;
      align-items: center;
      background: #fff;
    }
    .olx-dropdown__native {
      border: none;
      outline: none;
      background: transparent;
      font-size: 14px;
      cursor: pointer;
    }
    .sc-3ad14ab8-3 {
      display: none;
    }

    /* Ad Cards Grid */
    .sc-65ac10a6-1 {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
    }
    .olx-ad-card {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: #fff;
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
    }
    .olx-ad-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    .olx-image-carousel {
      position: relative;
      height: 200px;
      background: #F1F5F9;
      overflow: hidden;
    }
    .olx-image-carousel__items {
      list-style: none;
      margin: 0;
      padding: 0;
      height: 100%;
    }
    .olx-image-carousel__item {
      height: 100%;
    }
    .olx-image-carousel__item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .olx-image-carousel__counter-wrapper {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0,0,0,0.6);
      color: #fff;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .olx-ad-card__content {
      padding: 12px;
      display: flex;
      flex-direction: column;
      flex: 1;
      justify-content: space-between;
    }
    .olx-ad-card__title {
      font-size: 14px;
      font-weight: 600;
      color: #1E293B;
      margin: 0 0 8px 0;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .olx-ad-card__badges-items {
      list-style: none;
      margin: 0 0 8px 0;
      padding: 0;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .olx-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      background: #EFF6FF;
      color: #2563EB;
    }
    .olx-badge svg {
      width: 12px;
      height: 12px;
    }
    .olx-ad-card__old-price {
      font-size: 12px;
      text-decoration: line-through;
      color: #94A3B8;
      margin: 0;
    }
    .olx-ad-card__price {
      font-size: 18px;
      font-weight: 800;
      color: #0F172A;
      margin: 0 0 8px 0;
    }
    .olx-ad-card__bottom-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #64748B;
      border-top: 1px solid #F1F5F9;
      padding-top: 8px;
    }
    .olx-ad-card__favorite-container {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 2;
    }
    .olx-ad-card__badges-favorite-button {
      background: rgba(255,255,255,0.9);
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .olx-modal { display: none; }
  </style>
</head>
<body class="look-feel">
  ${headerHtml}
  
  ${snippet}
  
  ${footerHtml}

  <script>
    // Link the iPhone 17 card directly to the local product page /
    document.querySelectorAll('a[href*="iphone-17-branco"]').forEach(link => {
      link.href = '/';
      link.target = '_self';
    });

    // Make whole cards clickable
    document.querySelectorAll('.olx-ad-card').forEach(card => {
      card.style.cursor = 'pointer';
      const mainLink = card.querySelector('a.olx-ad-card__title-link');
      if (mainLink) {
        card.addEventListener('click', (e) => {
          if (e.target.closest('button')) return;
          window.location.href = mainLink.href;
        });
      }
    });
  </script>
</body>
</html>
`;

fs.writeFileSync('perfil.html', perfilHtml);
console.log('perfil.html created successfully. Size:', perfilHtml.length);
