const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');

// Extract all style tags from index.html that are relevant
const allStyles = indexHtml.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
console.log('Total styles in index.html:', allStyles.length);

// We want the styles that define the header and design tokens
let headerStyles = '';
allStyles.forEach((s, idx) => {
  if (
    s.includes('olx-header') ||
    s.includes('S6FMF5') ||
    s.includes('ajfs2S') ||
    s.includes('olx-text-input') ||
    s.includes('--color-primary-100') ||
    s.includes('olx-core-button') ||
    idx < 6 // include base global styles
  ) {
    headerStyles += s + '\n';
  }
});
console.log('Combined headerStyles length:', headerStyles.length);

let perfilHtml = fs.readFileSync('perfil.html', 'utf8');

// Replace any existing header styles or insert right before </head>
const insertMarker = '</head>';
if (perfilHtml.includes('<!-- INJECTED_HEADER_STYLES -->')) {
  perfilHtml = perfilHtml.replace(/<!-- INJECTED_HEADER_STYLES -->[\s\S]*?<!-- END_INJECTED_HEADER_STYLES -->/, `<!-- INJECTED_HEADER_STYLES -->\n${headerStyles}\n<!-- END_INJECTED_HEADER_STYLES -->`);
} else {
  perfilHtml = perfilHtml.replace('</head>', `<!-- INJECTED_HEADER_STYLES -->\n${headerStyles}\n<!-- END_INJECTED_HEADER_STYLES -->\n</head>`);
}

// Additional specific fixes for the search input in the header so it is 100% pixel-perfect:
const customHeaderFixes = `
<style>
  /* Header layout & search bar specific adjustments */
  .olx-header {
    background: #FFFFFF !important;
    border-bottom: 1px solid #E2E8F0 !important;
    width: 100% !important;
    position: relative !important;
    z-index: 100 !important;
  }
  .olx-header__main-menu {
    max-width: 1240px !important;
    margin: 0 auto !important;
    padding: 12px 20px !important;
  }
  .olx-header__primary-menu {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    width: 100% !important;
    gap: 16px !important;
  }
  .olx-header__column-left {
    display: flex !important;
    align-items: center !important;
    flex: 1 !important;
    gap: 20px !important;
    max-width: 680px !important;
  }
  .olx-header__column-right {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
    margin-left: auto !important;
  }
  .olx-header__search {
    flex: 1 !important;
    min-width: 260px !important;
    position: relative !important;
  }
  .S6FMF5 {
    position: relative !important;
    width: 100% !important;
    height: 44px !important;
    display: flex !important;
    align-items: center !important;
  }
  .S6FMF5 .olx-text-input {
    width: 100% !important;
    height: 44px !important;
  }
  .S6FMF5 .olx-text-input__input-container {
    height: 44px !important;
    border: 1px solid #CBD5E1 !important;
    border-radius: 8px !important;
    padding: 0 44px 0 16px !important;
    background: #FFFFFF !important;
    display: flex !important;
    align-items: center !important;
    box-shadow: none !important;
  }
  .S6FMF5 .olx-text-input__input-container:focus-within {
    border-color: #6E0AD6 !important;
    outline: none !important;
  }
  .S6FMF5 .olx-text-input__input-field {
    border: none !important;
    outline: none !important;
    background: transparent !important;
    width: 100% !important;
    height: 100% !important;
    font-size: 14px !important;
    color: #111827 !important;
    padding: 0 !important;
  }
  .S6FMF5 button.ajfs2S {
    position: absolute !important;
    right: 4px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    width: 36px !important;
    height: 36px !important;
    border: none !important;
    background: transparent !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 6px !important;
    color: #4B5563 !important;
    padding: 0 !important;
  }
  .S6FMF5 button.ajfs2S:hover {
    background: #F1F5F9 !important;
  }
  .olx-header__items {
    display: flex !important;
    align-items: center !important;
    gap: 16px !important;
    list-style: none !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  .olx-header__link {
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    color: #374151 !important;
  }
  .olx-header__link:hover {
    color: #6E0AD6 !important;
  }
  .olx-header__action-button {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
  }
  .olx-header__action-button a.olx-core-button--secondary,
  .olx-header__action-button .olx-core-button--secondary {
    border: 1px solid #D1D5DB !important;
    border-radius: 24px !important;
    padding: 6px 18px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    color: #111827 !important;
    background: #FFFFFF !important;
  }
  .olx-header__action-button a.olx-core-button--primary,
  .olx-header__action-button .olx-core-button--primary {
    background: #6E0AD6 !important;
    border: 1px solid #6E0AD6 !important;
    border-radius: 24px !important;
    padding: 6px 18px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    color: #FFFFFF !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
  }
  .sf-hidden { display: none !important; }
</style>
`;

perfilHtml = perfilHtml.replace('</head>', `${customHeaderFixes}\n</head>`);

fs.writeFileSync('perfil.html', perfilHtml);
console.log('Fixed header in perfil.html successfully. Size:', perfilHtml.length);
