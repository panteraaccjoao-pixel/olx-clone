const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');

// 1. Extract ALL <style> tags from index.html
const allStyles = (indexHtml.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []).join('\n');
console.log('Total extracted styles size:', allStyles.length);

// 2. Extract header from index.html
const headerMatch = indexHtml.match(/<header[\s\S]*?<\/header>/i);
if (!headerMatch) {
  console.error('Header not found in index.html');
  process.exit(1);
}
const headerHtml = headerMatch[0];
console.log('Header html size:', headerHtml.length);

// 3. Extract footer from index.html
const footerMatch = indexHtml.match(/<footer[\s\S]*?<\/footer>/i);
const footerHtml = footerMatch ? footerMatch[0] : '';
console.log('Footer html size:', footerHtml.length);

// 4. Read user snippet
let snippet = fs.readFileSync('perfil_snippet.html', 'utf8');

// Replace external image URLs with our local images
snippet = snippet.replace(/https:\/\/img\.olx\.com\.br\/thumbs256x256\/63\/630653332183373\.jpg/g, '/images/perfil/iphone-17.jpg');
snippet = snippet.replace(/https:\/\/img\.olx\.com\.br\/thumbs256x256\/68\/680692393397558\.jpg/g, '/images/perfil/capa-poco.jpg');
snippet = snippet.replace(/https:\/\/img\.olx\.com\.br\/thumbs256x256\/76\/767668446878062\.jpg/g, '/images/perfil/xiaomi-17t.jpg');
snippet = snippet.replace(/https:\/\/img\.olx\.com\.br\/thumbs256x256\/53\/531620312168581\.jpg/g, '/images/perfil/protetor-motor.jpg');
snippet = snippet.replace(/https:\/\/img\.olx\.com\.br\/thumbs256x256\/19\/195632434088728\.jpg/g, '/images/perfil/bagageiro-nmax.jpg');

// Avatars
snippet = snippet.replace(/\/perfil\/_next\/image\?url=https%3A%2F%2Flh3\.googleusercontent\.com%2Fa-%2FALV-UjX3EPtSkjGtCBThKvsalnBty87FxRqGnjlnN7BWj-6N13lYN26L%3Ds100&amp;[^\"]+/g, '/images/perfil/avatar-william.jpg');
snippet = snippet.replace(/https:\/\/lh3\.googleusercontent\.com\/[^\"]+/g, '/images/perfil/avatar-william.jpg');
snippet = snippet.replace(/\/perfil\/_next\/image\?url=https%3A%2F%2Fstatic\.olx\.com\.br%2Fperfil%2Fprofile-olx%2F_next%2Fstatic%2Fmedia%2Favatar\.2d977a2a\.png&amp;[^\"]+/g, '/images/perfil/avatar-user.png');
snippet = snippet.replace(/https:\/\/static\.olx\.com\.br\/perfil\/profile-olx\/_next\/static\/media\/avatar\.2d977a2a\.png/g, '/images/perfil/avatar-user.png');

// Clean up srcset and sources that might interfere
snippet = snippet.replace(/srcset="[^"]*"/gi, '');
snippet = snippet.replace(/<source[^>]*>/gi, '');

// Profile specific scoped styles (ONLY for #main and below, NEVER touching the header)
const profileScopedStyles = `
<style>
  /* Base page structure */
  body.look-feel {
    background-color: #FFFFFF !important;
  }
  
  /* Main Container */
  #main, .sc-206a520e-0 {
    max-width: 1240px;
    margin: 0 auto;
    padding: 24px 20px 60px 20px;
  }
  .sc-206a520e-1 {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  @media (min-width: 1024px) {
    .sc-206a520e-1 {
      flex-direction: row;
      align-items: flex-start;
    }
    #profile-fixed, .sc-206a520e-2 {
      width: 290px;
      flex-shrink: 0;
      position: sticky;
      top: 24px;
    }
    #profile-listing, .sc-206a520e-4 {
      flex: 1;
      min-width: 0;
    }
  }

  /* Left column: Profile card */
  .sc-e48bb94-1.olx-container {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.02);
  }
  .sc-5642d660-0 {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 20px;
  }
  .sc-cbe5f5f1-0 img, [data-testid="avatar-seller"] img {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
  }
  .sc-4ab85633-0 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
  }
  .sc-4ab85633-2 {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10B981;
  }
  .sc-4ab85633-1 {
    font-size: 12px;
    color: #6B7280;
    margin: 0;
  }
  #reputation-bar {
    margin-bottom: 18px;
  }
  #reputation-bar button {
    border: none;
    background: transparent;
    padding: 0;
    width: 100%;
    text-align: left;
  }
  .olx-core-badge--primary.olx-core-badge--pill {
    background: #F3E8FF !important;
    color: #6E0AD6 !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    padding: 2px 8px !important;
    border-radius: 12px !important;
  }
  .sc-f92f1d1e-0 {
    display: flex;
    flex-direction: column;
    gap: 12px;
    border-top: 1px solid #F1F5F9;
    padding-top: 16px;
  }
  .sc-f92f1d1e-1 {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #374151;
    font-size: 13px;
  }
  .sc-f92f1d1e-2 { margin: 0; }

  /* Right column: Histórico */
  [data-testid="ads-history"], .sc-e3fee87b-0 {
    margin-bottom: 28px;
  }
  [data-testid="ads-history"] .typo-body-large {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 12px;
  }
  [data-testid="ads-history-carousel"], .sc-e3fee87b-1 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }
  [data-testid="ads-history-card"], .sc-ffda45a8-0 {
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 16px 18px;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    min-height: 94px;
  }
  [data-testid="ads-history-card"] svg {
    width: 22px;
    height: 22px;
    color: #374151;
  }
  .sc-ffda45a8-1 {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
    margin: 4px 0 0 0;
    display: flex;
    align-items: baseline;
    gap: 4px;
  }
  .sc-ffda45a8-1 .typo-caption {
    font-size: 13px;
    font-weight: 500;
    color: #111827;
    margin: 0;
  }

  /* Right column: Avaliações */
  [data-testid="ratings-container"], .sc-b13ae57f-0 {
    margin-bottom: 32px;
  }
  [data-testid="ratings-container"] > .typo-body-large {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 8px;
  }
  .sc-42545084-0 {
    font-size: 30px;
    font-weight: 800;
    color: #111827;
    margin: 0;
    line-height: 1;
  }
  [data-testid="ratings-carousel"], .sc-33a130bb-0 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 12px;
  }
  @media (max-width: 900px) {
    [data-testid="ratings-carousel"], .sc-33a130bb-0 {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 500px) {
    [data-testid="ratings-carousel"], .sc-33a130bb-0 {
      grid-template-columns: 1fr;
    }
  }
  .sc-33a130bb-1 {
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 14px;
    background: #FFFFFF;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 150px;
    gap: 8px;
  }
  .sc-33a130bb-5 {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sc-33a130bb-5 img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #E2E8F0;
  }
  .sc-33a130bb-5 .typo-body-small {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
  .sc-33a130bb-5 .typo-caption {
    font-size: 11px;
    color: #6B7280;
    margin: 0;
  }
  .sc-33a130bb-2 {
    font-size: 12px;
    font-weight: 600;
    color: #1F2937;
    margin: 0;
    line-height: 1.3;
  }
  .sc-82307d60-0 {
    color: #6E0AD6 !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    margin-top: 8px;
    display: inline-block;
  }

  /* Right column: Anúncios */
  [data-testid="content-profile-listing"], .sc-206a520e-5 {
    margin-top: 24px;
  }
  .sc-ab591e97-1 {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }
  .sc-ab591e97-2 {
    font-size: 13px;
    color: #6B7280;
    margin: 2px 0 0 0;
  }

  /* Search & Filters */
  #ds-inputchips-element-3-combobox .olx-text-input__input-container {
    display: flex;
    align-items: center;
    border: 1px solid #D1D5DB;
    border-radius: 8px;
    padding: 0 16px;
    height: 44px;
    background: #FFFFFF;
    width: 100%;
  }
  #ds-inputchips-element-3-input {
    border: none;
    outline: none;
    width: 100%;
    font-size: 14px;
    padding-left: 10px;
    color: #111827;
  }
  #filters, .sc-3ad14ab8-0 {
    margin-top: 16px;
    margin-bottom: 24px;
  }
  .sc-3ad14ab8-2 {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
    flex-wrap: wrap;
    gap: 16px;
  }
  .sc-3ad14ab8-4 .olx-text--body-medium,
  .sc-3ad14ab8-5 .olx-text--body-medium {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 6px;
    display: block;
  }
  .sc-3ad14ab8-7 { margin-left: auto; }
  .sc-3ad14ab8-4 .olx-dropdown__wrapper,
  .sc-3ad14ab8-5 .olx-dropdown__wrapper {
    border: 1px solid #D1D5DB;
    border-radius: 8px;
    padding: 0 12px;
    height: 40px;
    display: flex;
    align-items: center;
    background: #FFFFFF;
    min-width: 150px;
  }
  .sc-3ad14ab8-4 .olx-dropdown__native,
  .sc-3ad14ab8-5 .olx-dropdown__native {
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    color: #374151;
    width: 100%;
    cursor: pointer;
  }
  .sc-3ad14ab8-3 { display: none; }
  .olx-modal { display: none; }

  /* Ad Cards Grid 3 columns */
  .sc-65ac10a6-1 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  @media (max-width: 860px) {
    .sc-65ac10a6-1 {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 580px) {
    .sc-65ac10a6-1 {
      grid-template-columns: 1fr;
    }
  }

  .olx-ad-card {
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    background: #FFFFFF;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    position: relative;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .olx-ad-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.06);
  }
  .olx-image-carousel {
    position: relative;
    width: 100%;
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
  .olx-image-carousel__right-button {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
  }
  .olx-arrow-button--right {
    background: rgba(30, 41, 59, 0.75) !important;
    border: none !important;
    width: 24px !important;
    height: 42px !important;
    min-width: 24px !important;
    min-height: 42px !important;
    border-radius: 4px 0 0 4px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #FFFFFF !important;
    cursor: pointer;
  }
  .olx-image-carousel__counter-wrapper {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(17, 24, 39, 0.8);
    color: #FFFFFF;
    padding: 2px 7px;
    border-radius: 4px;
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 4px;
    z-index: 2;
  }
  .olx-ad-card__favorite-container {
    position: absolute;
    bottom: 12px;
    right: 12px;
    z-index: 2;
  }
  .olx-ad-card__badges-favorite-button {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .olx-ad-card__badges-favorite-button svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: #6B7280;
    stroke-width: 1.5;
  }
  .olx-ad-card__content {
    padding: 14px 14px 10px 14px;
    display: flex;
    flex-direction: column;
    flex: 1;
    justify-content: space-between;
  }
  .olx-ad-card__old-price {
    font-size: 11px;
    color: #9CA3AF;
    text-decoration: line-through;
    margin: 0;
  }
  .olx-ad-card__price {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin: 1px 0 4px 0;
  }
  .olx-ad-card__title {
    font-size: 13px;
    font-weight: 400;
    color: #1F2937;
    margin: 0 0 8px 0;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .olx-ad-card__badges-items {
    list-style: none;
    margin: 0 0 10px 0;
    padding: 0;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .olx-badge--info {
    background: #E0F2FE !important;
    color: #0284C7 !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    padding: 3px 8px !important;
    border-radius: 4px !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
  }
  .olx-badge--info svg {
    width: 13px;
    height: 13px;
  }
  .olx-ad-card__bottom {
    border-top: 1px solid #F1F5F9;
    padding-top: 8px;
    margin-top: 6px;
    position: relative;
  }
  .olx-ad-card__location {
    font-size: 11px;
    color: #6B7280;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .olx-ad-card__location svg {
    width: 13px;
    height: 13px;
  }
  .olx-ad-card__date--vertical {
    font-size: 11px;
    color: #9CA3AF;
    margin: 0;
  }

  /* Floating Voltar ao Topo button */
  .floating-back-to-top {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: #FFFFFF;
    border: 1px solid #D1D5DB;
    border-radius: 24px;
    padding: 8px 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    cursor: pointer;
    z-index: 1000;
    transition: background 0.2s;
  }
  .floating-back-to-top:hover {
    background: #F9FAFB;
  }
</style>
`;

const perfilHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>William Navarro | Perfil do anunciante - OLX</title>
  <link rel="icon" href="https://static.olx.com.br/cd/general/favicon.ico">
  <meta name="referrer" content="no-referrer">

  <!-- Exact full stylesheets from product page -->
  ${allStyles}

  <!-- Scoped profile page layout styles -->
  ${profileScopedStyles}
</head>
<body class="look-feel" style="padding-right:0px">
  <div id="root">
    <div id="adview" class="ad__sc-1bw7mho-0 KgeRE">
      <div class="ad__sc-mc54lg-0 knzacr">
        ${headerHtml}
      </div>
    </div>
  </div>

  ${snippet}

  <button type="button" class="floating-back-to-top" onclick="window.scrollTo({top: 0, behavior: 'smooth'});">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
    Voltar ao Topo
  </button>

  ${footerHtml}

  <script>
    // Link the iPhone 17 ad card directly to our product page /
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
console.log('perfil.html built successfully with exact header and styles from index.html! Size:', perfilHtml.length);
