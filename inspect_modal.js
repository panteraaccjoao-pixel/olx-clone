const fs = require('fs');
const html = fs.readFileSync('checkout.html', 'utf8');

const idx = html.indexOf('payment-success-modal');
console.log('payment-success-modal idx:', idx);
if (idx !== -1) {
  console.log(html.slice(idx - 100, idx + 1500));
}
