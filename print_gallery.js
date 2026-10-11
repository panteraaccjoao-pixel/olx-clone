const fs = require('fs');

const html = fs.readFileSync('iphone-17-branco-olx.html', 'utf8');

const start = html.indexOf('id=gallery');
console.log('id=gallery found at:', start);
const end = html.indexOf('</section>', start);
console.log('gallery section end at:', end);

console.log(html.slice(start - 50, start + 3000));
