const fs = require('fs');

['index.html', 'iphone-17-branco-olx.html'].forEach(fn => {
  if (!fs.existsSync(fn)) return;
  let content = fs.readFileSync(fn, 'utf8');
  
  // Replace direct link
  const oldTarget = 'href=https://www.olx.com.br/perfil/william-navarro-3f54cb01';
  const newTarget = 'onclick="window.location.href=\'/perfil\'; return false;" href="/perfil"';
  
  if (content.includes(oldTarget)) {
    content = content.replaceAll(oldTarget, newTarget);
    fs.writeFileSync(fn, content);
    console.log('Replaced target in', fn);
  } else {
    console.log('Target not found in', fn);
  }

  // Also bind via JS just in case there are multiple buttons or components
  const jsTrigger = `
<script>
  // Acessar perfil do anunciante
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('button, a').forEach(el => {
      if (el.textContent && el.textContent.trim().includes('Acessar perfil do anunciante')) {
        el.style.cursor = 'pointer';
        el.onclick = function(e) {
          e.preventDefault();
          window.location.href = '/perfil';
        };
      }
    });
  });
</script>
`;
  if (!content.includes('// Acessar perfil do anunciante')) {
    content = content.replace('</body>', jsTrigger + '\n</body>');
    fs.writeFileSync(fn, content);
    console.log('Appended JS trigger to', fn);
  }
});
