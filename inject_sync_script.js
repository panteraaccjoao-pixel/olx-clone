const fs = require('fs');

const files = [
  'index.html',
  'iphone-17-branco-olx.html',
  'perfil.html',
  'checkout.html',
  'pix.html'
];

files.forEach(fn => {
  if (!fs.existsSync(fn)) return;
  let html = fs.readFileSync(fn, 'utf8');
  if (!html.includes('/sync_dynamic_config.js')) {
    html = html.replace('</body>', '<script src="/sync_dynamic_config.js"></script>\n</body>');
    if (!html.includes('/sync_dynamic_config.js')) {
      // If no </body> tag
      html += '\n<script src="/sync_dynamic_config.js"></script>';
    }
    fs.writeFileSync(fn, html);
    console.log('Injected sync script into', fn);
  } else {
    console.log('Already injected in', fn);
  }
});
