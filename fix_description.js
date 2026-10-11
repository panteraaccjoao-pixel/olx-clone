const fs = require('fs');

const scriptToAdd = `
<script>
  // Expandir / recolher descrição completa do anúncio
  (function() {
    function initDescriptionToggle() {
      const btn = document.querySelector('.advc-ad-description__see-more');
      const lines = document.querySelector('.advc-ad-description__lines');
      if (!btn || !lines) return;

      btn.style.cursor = 'pointer';
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const isClosed = lines.getAttribute('data-closed') !== 'false';

        if (isClosed) {
          lines.setAttribute('data-closed', 'false');
          lines.dataset.closed = 'false';
          lines.style.setProperty('display', 'block', 'important');
          lines.style.setProperty('-webkit-line-clamp', 'unset', 'important');
          lines.style.setProperty('max-height', 'none', 'important');
          lines.style.setProperty('overflow', 'visible', 'important');
          btn.textContent = 'Ver menos';
        } else {
          lines.setAttribute('data-closed', 'true');
          lines.dataset.closed = 'true';
          lines.style.removeProperty('display');
          lines.style.removeProperty('-webkit-line-clamp');
          lines.style.removeProperty('max-height');
          lines.style.removeProperty('overflow');
          btn.textContent = 'Ver descrição completa';
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initDescriptionToggle);
    } else {
      initDescriptionToggle();
    }
  })();
</script>
`;

['index.html', 'iphone-17-branco-olx.html'].forEach(fn => {
  if (!fs.existsSync(fn)) return;
  let html = fs.readFileSync(fn, 'utf8');

  if (html.includes('initDescriptionToggle')) {
    html = html.replace(/<script>[\s\S]*?initDescriptionToggle[\s\S]*?<\/script>/, '');
  }

  html = html + '\n' + scriptToAdd;
  fs.writeFileSync(fn, html);
  console.log('Successfully appended script to', fn, 'New size:', html.length);
});
