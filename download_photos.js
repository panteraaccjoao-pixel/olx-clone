const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'images');
if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir);

const urls = [
  { id: '1', url: 'https://img.olx.com.br/images/63/630653332183373.jpg' },
  { id: '2', url: 'https://img.olx.com.br/images/66/662611575228586.jpg' },
  { id: '3', url: 'https://img.olx.com.br/images/67/675611217616864.jpg' },
  { id: '4', url: 'https://img.olx.com.br/images/68/682620330363369.jpg' },
  { id: '5', url: 'https://img.olx.com.br/images/69/699666094916655.jpg' },
  { id: '6', url: 'https://img.olx.com.br/images/70/701655217208370.jpg' }
];

async function download() {
  for (const item of urls) {
    try {
      const res = await fetch(item.url);
      if (res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        const filePath = path.join(imgDir, `foto-${item.id}.jpg`);
        fs.writeFileSync(filePath, buffer);
        console.log(`Downloaded foto-${item.id}.jpg (${buffer.length} bytes)`);
      } else {
        console.error(`Failed ${item.url}: ${res.status}`);
      }
    } catch (e) {
      console.error(`Error downloading ${item.url}:`, e.message);
    }
  }
}

download();
