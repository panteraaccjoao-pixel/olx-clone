const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const headerMatch = indexHtml.match(/<header[\s\S]*?<\/header>/i);
if (!headerMatch) {
  console.log('No header found in index.html');
  process.exit(1);
}
const header = headerMatch[0];
fs.writeFileSync('header_extracted.html', header);

// Find search bar html in header
const searchIdx = header.indexOf('Buscar');
if (searchIdx !== -1) {
  console.log('Search area snippet:');
  console.log(header.slice(Math.max(0, searchIdx - 300), Math.min(header.length, searchIdx + 400)));
}

// Find style rules in index.html affecting the header search
const styles = indexHtml.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
let relevantStyles = '';
styles.forEach(s => {
  if (s.includes('olx-header') || s.includes('olx-search') || s.includes('autocomplete') || s.includes('primary-menu')) {
    relevantStyles += s + '\n';
  }
});
fs.writeFileSync('header_styles.css', relevantStyles);
console.log('Relevant header styles length:', relevantStyles.length);
