const fs = require('fs');

const html = fs.readFileSync('iphone-17-branco-olx.html', 'utf8');

const idx = html.indexOf('class=olx-logo-olx');
console.log(html.slice(idx - 60, idx + 1000));
