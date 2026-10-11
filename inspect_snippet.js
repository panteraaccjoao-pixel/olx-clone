const fs = require('fs');
const s = fs.readFileSync('perfil_snippet.html', 'utf8');
const imgs = s.match(/src="[^"]+"/g) || [];
console.log('Images found:', imgs);
