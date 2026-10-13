const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');

if (!fs.existsSync(PUBLIC)) {
  fs.mkdirSync(PUBLIC, { recursive: true });
}

// 1. Files to mirror from root into public
const filesToCopy = [
  'index.html',
  'mobile.html',
  'iphone-17-branco-olx.html',
  'checkout.html',
  'pix.html',
  'admin.html',
  'perfil.html',
  'config.json',
  'draft_config.json',
  'sync_dynamic_config.js',
  'header_styles.css',
  'checkout-style1.css',
  'checkout-style2.css',
  'olx_chunks_css.css',
  'top_left.png',
  'bottom_strip.png',
  'shake-hands.webp',
  'van-delivery.webp',
  'iphone-thumb.webp'
];

filesToCopy.forEach(fileName => {
  const src = path.join(ROOT, fileName);
  const dest = path.join(PUBLIC, fileName);
  if (fs.existsSync(src)) {
    try {
      fs.copyFileSync(src, dest);
    } catch(e) {}
  }
});

// 2. Ensure images folder in public
const srcImg = path.join(ROOT, 'images');
const destImg = path.join(PUBLIC, 'images');
if (fs.existsSync(srcImg)) {
  function copyRecursive(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      const s = path.join(src, item);
      const d = path.join(dest, item);
      if (fs.statSync(s).isDirectory()) {
        copyRecursive(s, d);
      } else {
        if (!fs.existsSync(d)) {
          try { fs.copyFileSync(s, d); } catch(e) {}
        }
      }
    }
  }
  copyRecursive(srcImg, destImg);
}

// 3. Ensure clean URL folders (e.g. /9bkp, /checkout, /pix, /perfil)
const cleanFolders = [
  { folder: '9bkp', srcHtml: 'admin.html' },
  { folder: 'checkout', srcHtml: 'checkout.html' },
  { folder: 'pix', srcHtml: 'pix.html' },
  { folder: 'perfil', srcHtml: 'perfil.html' }
];

cleanFolders.forEach(({ folder, srcHtml }) => {
  const dir = path.join(PUBLIC, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const src = path.join(ROOT, srcHtml);
  if (fs.existsSync(src)) {
    try {
      fs.copyFileSync(src, path.join(dir, 'index.html'));
    } catch(e) {}
  }
});

// 4. Create _redirects file for Netlify in root and public
const redirectsContent = `
# Netlify API redirects to serverless function
/api/*  /.netlify/functions/api/:splat  200

# Clean URLs
/9bkp   /admin.html  200
/9bkp.html   /admin.html  200
/checkout   /checkout.html  200
/pix   /pix.html  200
/perfil   /perfil.html  200

# Fallbacks
/   /index.html  200
`;

fs.writeFileSync(path.join(ROOT, '_redirects'), redirectsContent.trim() + '\n', 'utf8');
fs.writeFileSync(path.join(PUBLIC, '_redirects'), redirectsContent.trim() + '\n', 'utf8');

console.log('[sync_public] Public folder and _redirects synced successfully!');
