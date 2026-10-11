const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const perfilDir = path.join(__dirname, 'images', 'perfil');
if (!fs.existsSync(perfilDir)) {
  fs.mkdirSync(perfilDir, { recursive: true });
}

const imagesToDownload = [
  {
    name: 'avatar-william.jpg',
    url: 'https://lh3.googleusercontent.com/a-/ALV-UjX3EPtSkjGtCBThKvsalnBty87FxRqGnjlnN7BWj-6N13lYN26L=s240'
  },
  {
    name: 'avatar-user.png',
    url: 'https://static.olx.com.br/perfil/profile-olx/_next/static/media/avatar.2d977a2a.png'
  },
  {
    name: 'iphone-17.jpg',
    url: 'https://img.olx.com.br/thumbs256x256/63/630653332183373.jpg'
  },
  {
    name: 'capa-poco.jpg',
    url: 'https://img.olx.com.br/thumbs256x256/68/680692393397558.jpg'
  },
  {
    name: 'xiaomi-17t.jpg',
    url: 'https://img.olx.com.br/thumbs256x256/76/767668446878062.jpg'
  },
  {
    name: 'protetor-motor.jpg',
    url: 'https://img.olx.com.br/thumbs256x256/53/531620312168581.jpg'
  },
  {
    name: 'bagageiro-nmax.jpg',
    url: 'https://img.olx.com.br/thumbs256x256/19/195632434088728.jpg'
  }
];

imagesToDownload.forEach(img => {
  const dest = path.join(perfilDir, img.name);
  try {
    execSync(`curl.exe -s -L "${img.url}" -o "${dest}"`);
    const stat = fs.statSync(dest);
    console.log(`Downloaded ${img.name}: ${stat.size} bytes`);
  } catch (e) {
    console.error(`Failed to download ${img.name}:`, e.message);
  }
});

// Now update perfil.html
let perfil = fs.readFileSync('perfil.html', 'utf8');

// Add no-referrer meta
if (!perfil.includes('name="referrer"')) {
  perfil = perfil.replace('<head>', '<head>\n  <meta name="referrer" content="no-referrer">');
}

// Replace ad images
perfil = perfil.replace(/https:\/\/img\.olx\.com\.br\/thumbs256x256\/63\/630653332183373\.jpg/g, '/images/perfil/iphone-17.jpg');
perfil = perfil.replace(/https:\/\/img\.olx\.com\.br\/thumbs256x256\/68\/680692393397558\.jpg/g, '/images/perfil/capa-poco.jpg');
perfil = perfil.replace(/https:\/\/img\.olx\.com\.br\/thumbs256x256\/76\/767668446878062\.jpg/g, '/images/perfil/xiaomi-17t.jpg');
perfil = perfil.replace(/https:\/\/img\.olx\.com\.br\/thumbs256x256\/53\/531620312168581\.jpg/g, '/images/perfil/protetor-motor.jpg');
perfil = perfil.replace(/https:\/\/img\.olx\.com\.br\/thumbs256x256\/19\/195632434088728\.jpg/g, '/images/perfil/bagageiro-nmax.jpg');

// Replace avatars
perfil = perfil.replace(/https:\/\/lh3\.googleusercontent\.com\/[^\"]+/g, '/images/perfil/avatar-william.jpg');
perfil = perfil.replace(/https:\/\/static\.olx\.com\.br\/perfil\/profile-olx\/_next\/static\/media\/avatar\.2d977a2a\.png/g, '/images/perfil/avatar-user.png');

// Also remove any remaining source tags that might override img src
perfil = perfil.replace(/<source[^>]*>/gi, '');

fs.writeFileSync('perfil.html', perfil);
console.log('perfil.html updated with local images and no-referrer meta.');
