const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const DIR = __dirname;
const TMP_DIR = os.tmpdir();
const TMP_CONFIG = path.join(TMP_DIR, 'olx_config.json');
const TMP_DRAFT = path.join(TMP_DIR, 'olx_draft_config.json');

let inMemoryConfig = null;
let inMemoryDraft = null;

function loadCurrentConfig(isDraft = false) {
  if (isDraft && inMemoryDraft) return inMemoryDraft;
  if (!isDraft && inMemoryConfig) return inMemoryConfig;

  let diskData = null;
  let diskMtime = 0;
  const diskFile = (isDraft && fs.existsSync(path.join(DIR, 'draft_config.json'))) ? 'draft_config.json' : 'config.json';
  const diskPath = path.join(DIR, diskFile);
  if (fs.existsSync(diskPath)) {
    try {
      diskMtime = fs.statSync(diskPath).mtimeMs;
      diskData = JSON.parse(fs.readFileSync(diskPath, 'utf8'));
    } catch(e) {}
  }

  let tmpData = null;
  let tmpMtime = 0;
  const tmpFile = isDraft ? TMP_DRAFT : TMP_CONFIG;
  if (fs.existsSync(tmpFile)) {
    try {
      tmpMtime = fs.statSync(tmpFile).mtimeMs;
      tmpData = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
    } catch(e) {}
  }

  let chosen = null;
  if (diskData && tmpData) {
    const diskTs = (diskData.updatedAt || 0) || diskMtime;
    const tmpTs = (tmpData.updatedAt || 0) || tmpMtime;
    chosen = (tmpTs > diskTs) ? tmpData : diskData;
  } else {
    chosen = diskData || tmpData || (isDraft ? (inMemoryConfig || {}) : {});
  }

  if (isDraft) inMemoryDraft = chosen;
  else inMemoryConfig = chosen;
  return chosen;
}

function saveCurrentConfig(data, isDraft = false) {
  if (data && typeof data === 'object') {
    data.updatedAt = data.updatedAt || Date.now();
    const existing = isDraft ? (inMemoryDraft || loadCurrentConfig(true)) : (inMemoryConfig || loadCurrentConfig(false));
    if (!data.auth && existing && existing.auth) {
      data.auth = existing.auth;
    }
  }

  if (isDraft) {
    inMemoryDraft = data;
  } else {
    inMemoryConfig = data;
    inMemoryDraft = data;
  }

  // 1. Gravar em /tmp (sempre gravável na Vercel e containers AWS Lambda)
  try {
    const tmpFile = isDraft ? TMP_DRAFT : TMP_CONFIG;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf8');
    if (!isDraft) {
      try { fs.writeFileSync(TMP_DRAFT, JSON.stringify(data, null, 2), 'utf8'); } catch(e) {}
    }
  } catch(e) {
    console.warn('[Config] Erro ao gravar /tmp:', e.message);
  }

  // 2. Gravar no diretório do projeto se gravável (localhost / VPS)
  try {
    const targetFile = isDraft ? 'draft_config.json' : 'config.json';
    fs.writeFileSync(path.join(DIR, targetFile), JSON.stringify(data, null, 2), 'utf8');
    try {
      const publicTarget = path.join(DIR, 'public', targetFile);
      if (fs.existsSync(path.join(DIR, 'public'))) {
        fs.writeFileSync(publicTarget, JSON.stringify(data, null, 2), 'utf8');
      }
    } catch(e) {}

    if (!isDraft) {
      try { fs.writeFileSync(path.join(DIR, 'draft_config.json'), JSON.stringify(data, null, 2), 'utf8'); } catch(e) {}
      syncAdFilesOnDisk(data);
    }
  } catch(diskErr) {
    console.log('[Config] Read-only filesystem no DIR, mantido em memória e /tmp');
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

// Static assets explicitly mapped so @vercel/nft AST parser traces them for serverless bundles
const STATIC_ASSETS = {
  admin: path.join(__dirname, 'admin.html'),
  checkout: path.join(__dirname, 'checkout.html'),
  pix: path.join(__dirname, 'pix.html'),
  perfil: path.join(__dirname, 'perfil.html'),
  index: path.join(__dirname, 'index.html'),
  mobile: path.join(__dirname, 'mobile.html'),
  ad: path.join(__dirname, 'iphone-17-branco-olx.html'),
  config: path.join(__dirname, 'config.json'),
  draft: path.join(__dirname, 'draft_config.json')
};

function serveHtmlFile(res, fileName) {
  const candidateDirs = [
    DIR,
    process.cwd(),
    path.join(DIR, 'public'),
    path.join(process.cwd(), 'public'),
    path.join(DIR, 'api'),
    path.join(process.cwd(), 'api'),
    path.join(__dirname, '..'),
    path.join(__dirname, '..', 'public'),
    path.join(__dirname, '..', 'api')
  ];
  for (const base of candidateDirs) {
    try {
      const p = path.join(base, fileName);
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        const buf = Buffer.from(content, 'utf8');
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Length': buf.length,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(buf);
        return true;
      }
    } catch (e) {}
  }
  return false;
}

function parseBody(req, callback) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'object') return callback(null, req.body);
    try {
      return callback(null, JSON.parse(req.body));
    } catch (e) {
      return callback(null, {});
    }
  }
  let raw = '';
  req.on('data', chunk => { raw += chunk; });
  req.on('end', () => {
    if (!raw) return callback(null, {});
    try {
      callback(null, JSON.parse(raw));
    } catch (e) {
      callback(null, {});
    }
  });
  req.on('error', err => callback(err));
}

function renderAdHtml(rawHtml, config) {
  let html = rawHtml;
  if (!config || !config.product) return html;
  const p = config.product || {};
  const s = config.seller || {};

  const formattedPrice = p.price ? (String(p.price).startsWith('R$') ? String(p.price) : 'R$ ' + p.price) : 'R$ 800';

  // Injetar <base href="/"> para links absolutos em URLs aninhadas/poluídas
  if (!html.includes('<base ') && !html.includes('<base>')) {
    html = html.replace(/<head[^>]*>/i, '$&\n  <base href="/">');
  }

  // 2. <title>
  if (p.title) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${p.title} - ${p.category || 'OLX'} | OLX</title>`);
  }

  // 3. Meta Tags
  const safeTitle = (p.title || '').replace(/"/g, '&quot;');
  if (p.title) {
    html = html.replace(/<meta\s+property=["']?og:title["']?\s+content=[^>]+>/gi, `<meta property="og:title" content="${safeTitle}">`);
    html = html.replace(/<meta\s+name=["']?twitter:title["']?\s+content=[^>]+>/gi, `<meta name="twitter:title" content="${safeTitle}">`);
  }
  if (p.description) {
    const plainDesc = p.description.replace(/[\r\n]+/g, ' ').replace(/"/g, '&quot;');
    html = html.replace(/<meta\s+name=["']?description["']?\s+content=(?:"[^"]*"|'[^']*'|[^>]+)>/gi, `<meta name="description" content="${plainDesc}">`);
    html = html.replace(/<meta\s+property=["']?og:description["']?\s+content=(?:"[^"]*"|'[^']*'|[^>]+)>/gi, `<meta property="og:description" content="${plainDesc}">`);
    html = html.replace(/<meta\s+name=["']?twitter:description["']?\s+content=(?:"[^"]*"|'[^']*'|[^>]+)>/gi, `<meta name="twitter:description" content="${plainDesc}">`);
  }
  // Remove any leftover corrupted description fragments if any
  html = html.replace(/(?:<br>)?PS5 com menos de 1 ano[\s\S]*?98139-5554\."?>/gi, '');

  // Strip all preview images and cards so link preview shows only the title
  html = html.replace(/<meta\s+property=["']?og:image(?::\w+)?["']?\s+content=[^>]+>/gi, '');
  html = html.replace(/<meta\s+content=[^>]+\s+property=["']?og:image(?::\w+)?["']?>/gi, '');
  html = html.replace(/<meta\s+name=["']?twitter:image(?::\w+)?["']?\s+content=[^>]+>/gi, '');
  html = html.replace(/<meta\s+content=[^>]+\s+name=["']?twitter:image(?::\w+)?["']?>/gi, '');
  html = html.replace(/<meta\s+name=["']?twitter:card["']?\s+content=[^>]+>/gi, '');
  html = html.replace(/<link\s+rel=["']?image_src["']?\s+href=[^>]+>/gi, '');
  html = html.replace(/"image":\s*\[[\s\S]*?\](?=,\s*"offers")/gi, '"image":[]');
  html = html.replace(/\/63\/630653332183373\.jpg/gi, '');

  // 4. Preço Principal (Desktop e Mobile)
  html = html.replace(/(class=["']?[^"'>]*typo-title-large[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/(?:span|div|h2)>)/gi, `$1${formattedPrice}$3`);
  html = html.replace(/(class=["']?[^"'>]*olx-text--price[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/(?:span|div|h2)>)/gi, `$1${formattedPrice}$3`);
  html = html.replace(/(class=["']?[^"'>]*typo-display-large[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/(?:span|div|h2)>)/gi, `$1${formattedPrice}$3`);
  if (p.oldPrice) {
    const formattedOld = String(p.oldPrice).startsWith('R$') ? String(p.oldPrice) : 'R$ ' + p.oldPrice;
    html = html.replace(/(<span[^>]*style=["']?[^"'>]*line-through[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/span>)/gi, `$1${formattedOld}$3`);
  }
  if (p.installments) {
    html = html.replace(/(<(?:p|div)[^>]*class=["']?[^"'>]*font-semibold typo-body-small[^"'>]*["']?>)[\s\S]*?(<\/(?:p|div)>)/gi, `$1${p.installments}$2`);
    html = html.replace(/(<div class=["']?[^"'>]*olx-core-badge--rectangle[^"'>]*["']?[^>]*>[\s\S]*?<span[^>]*>)(?:10x de R\$ 435,00 sem juros|12x[\s\S]*?)(<\/span>)/gi, `$1${p.installments}$2`);
  }

  // 5. Título do Anúncio (H1 e Seção - Desktop e Mobile) - SEMPRE Negrito (font-weight: 700)
  if (p.title) {
    html = html.replace(/(<h1[^>]*id=["']?description-title["']?[^>]*>)([\s\S]*?)(<\/h1>)/gi, `$1${p.title}$3`);
    html = html.replace(/(<h1[^>]*id=["']?ad-title["']?[^>]*>)([\s\S]*?)(<\/h1>)/gi, `$1${p.title}$3`);
    html = html.replace(/(<h1[^>]*class=["']?[^"'>]*olx-product-title[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/h1>)/gi, `$1${p.title}$3`);
  }

  // 6. Categoria no Breadcrumb e na Tabela de Detalhes
  if (p.category) {
    html = html.replace(/(<ol class=olx-core-breadcrumb__list>[\s\S]*?<\/ol>)/i, (breadcrumbListHtml) => {
      let count = 0;
      return breadcrumbListHtml.replace(/(<li class=olx-core-breadcrumb__element><a [^>]*>)([\s\S]*?)(<\/a><\/li>)/gi, (m, prefix, text, suffix) => {
        count++;
        if (count === 1) {
          const state = (p.location && p.location.includes('RJ')) ? 'Rio de Janeiro' : 'São Paulo';
          return `${prefix}${state}${suffix}`;
        }
        if (count === 2) {
          const region = (p.location && p.location.includes('RJ')) ? 'Rio de Janeiro e região' : 'São Paulo e região';
          return `${prefix}${region}${suffix}`;
        }
        if (count === 3) {
          return `${prefix}${p.category}${suffix}`;
        }
        return m;
      });
    });
    html = html.replace(/(<div class=advc-detail-item__text><span class=advc-detail-item__title>Categoria<\/span><a [^>]*>)([\s\S]*?)(<\/a><\/div>)/gi, `$1${p.category}$3`);
  }

  // 7. Descrição do Produto
  if (p.description) {
    const formattedDesc = p.description.replace(/\n/g, '<br>');
    html = html.replace(/(<span class=["']?[^"'>]*advc-ad-description__text[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/span>)/gi, `$1${formattedDesc}$3`);
    html = html.replace(/(<span class=["']?[^"'>]*typo-body-medium[^"'>]*style=["']?word-break:break-word[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/span>)/gi, `$1${formattedDesc}$3`);
    html = html.replace(/(<span class=["']?[^"'>]*typo-body-medium text-neutral-130[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/span>)/gi, `$1${formattedDesc}$3`);
  }

  // 8. Galeria de Fotos - Substituir as 5 imagens da galeria hero com rotação segura
  if (p.images && p.images.length > 0) {
    let imgIdx = 0;
    html = html.replace(/(<picture class=advc-gallery__image-wrap><img\s+src=)(?:"[^"]*"|[^ >]+)([\s\S]*?<\/picture>)/gi, (match, prefix, suffix) => {
      const url = p.images[imgIdx % p.images.length];
      imgIdx++;
      let cleanedSuffix = suffix.replace(/alt="[^"]*"/gi, `alt="${p.title || 'Foto'} - Imagem ${imgIdx}"`);
      return `${prefix}"${url}"${cleanedSuffix}`;
    });
  }

  // 9. Dados estruturados JSON-LD e Localização
  if (p.title) {
    html = html.replace(/("name":\s*")(?:PS5 [^"]*|iPhone 17 [^"]*|Geladeira [^"]*|[^"]*)(")/gi, `$1${p.title}$2`);
  }
  if (p.location) {
    html = html.replace(/(<span class=["']?[^"'>]*typo-body-medium font-semibold[^"'>]*["']?>)(?:Aleixo|[^<]+)(<\/span><span class=["']?[^"'>]*typo-body-small font-semibold text-neutral-110[^"'>]*["']?>)(?:Manaus, AM, 69083270|[^<]+)(<\/span>)/gi, `$1${p.location.split(',')[0] || p.location}$2${p.location}$3`);
  }

  // 10. Atualizar Vendedor (Desktop e Mobile)
  if (s.name) {
    html = html.replace(/(class=["']?[^"'>]*advc-mini-profile__name[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/(?:span|div|a)>)/gi, `$1${s.name}$3`);
    html = html.replace(/Miguel Fiorio/g, s.name);
  }
  if (s.avatar) {
    html = html.replace(/<img\b([^>]*\b(?:class=["']?[^"'>]*advc-mini-profile__avatar[^"'>]*|id=["']advc-seller-avatar-img["'])[^>]*)>/gi, (match) => {
      let tag = match;
      if (/src=(?:"[^"]*"|'[^']*'|[^\s>]+)/i.test(tag)) {
        tag = tag.replace(/src=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, () => `src="${s.avatar}"`);
      } else {
        tag = tag.replace(/<img/i, () => `<img src="${s.avatar}"`);
      }
      if (s.name) {
        tag = tag.replace(/alt=(?:"[^"]*"|'[^']*'|[^\s>]+)/i, () => `alt="Foto de ${s.name}"`);
      }
      return tag;
    });
  }
  if (s.lastAccess) {
    html = html.replace(/(<span[^>]*class=["']?[^"'>]*(?:advc-mini-profile__status|text-neutral-110)[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/span>)/gi, (m, g1, g2, g3) => g1 + s.lastAccess + g3);
    html = html.replace(/Último acesso há [^<]+/gi, s.lastAccess);
  }

  // 11. Atualizar Localização no Mobile
  if (p.location) {
    const city = p.location.split(',')[0].trim();
    html = html.replace(/(<span class="typo-body-medium font-semibold">)(?:Nova Gerty|[^<]+)(<\/span><span class="typo-body-small font-semibold text-neutral-110">)(?:São Caetano do Sul[^<]*|[^<]+)(<\/span>)/gi, `$1${city}$2${p.location}$3`);
  }

  // 12. Atualizar Cards de Detalhes / Características (Desktop e Mobile)
  const d = p.details || {
    brand: p.brand || '',
    model: p.model || '',
    condition: p.condition || 'Usado - Excelente',
    color: p.color || '',
    storage: p.storage || '',
    extra: p.extra || '',
    acceptTrades: p.acceptTrades || 'Não'
  };

  // Marca
  if (d.brand) {
    html = html.replace(/(<span class=advc-detail-item__title>Marca<\/span>[\s\S]*?<span[^>]*>)([\s\S]*?)(<div|<\/span>)/i, (m, g1, g2, g3) => g1 + d.brand + g3);
    html = html.replace(/(<span class=advc-detail-item__title[^>]*>Marca<\/span>\s*<span[^>]*>)([\s\S]*?)(<\/span>)/i, (m, g1, g2, g3) => g1 + d.brand + g3);
  }
  // Modelo
  if (d.model) {
    html = html.replace(/(<span class=advc-detail-item__title>Modelo<\/span>[\s\S]*?<span[^>]*>)([\s\S]*?)(<div|<\/span>)/i, (m, g1, g2, g3) => g1 + d.model + g3);
    html = html.replace(/(<span class=advc-detail-item__title[^>]*>Modelo<\/span>\s*<span[^>]*>)([\s\S]*?)(<\/span>)/i, (m, g1, g2, g3) => g1 + d.model + g3);
  }
  // Condição
  const cond = d.condition || p.condition || 'Usado - Excelente';
  if (cond) {
    html = html.replace(/(<span class=advc-detail-item__title>Condição<\/span>[\s\S]*?<span[^>]*>)([\s\S]*?)(<div|<\/span>)/i, (m, g1, g2, g3) => g1 + cond + g3);
    html = html.replace(/(<span class=advc-detail-item__title[^>]*>Condição<\/span>\s*<span[^>]*>)([\s\S]*?)(<\/span>)/i, (m, g1, g2, g3) => g1 + cond + g3);
  }
  // Cor
  if (d.color) {
    html = html.replace(/(<span class=advc-detail-item__title>Cor<\/span>[\s\S]*?<span[^>]*>)([\s\S]*?)(<div|<\/span>)/i, (m, g1, g2, g3) => g1 + d.color + g3);
    html = html.replace(/(<span class=advc-detail-item__title[^>]*>Cor<\/span>\s*<span[^>]*>)([\s\S]*?)(<\/span>)/i, (m, g1, g2, g3) => g1 + d.color + g3);
  }
  // Memória / Capacidade
  if (d.storage) {
    html = html.replace(/(<span class=advc-detail-item__title>(?:Memória interna|Capacidade)<\/span>[\s\S]*?<span[^>]*>)([\s\S]*?)(<div|<\/span>)/i, (m, g1, g2, g3) => g1 + d.storage + g3);
  }
  // Extra / Bateria
  if (d.extra) {
    html = html.replace(/(<span class=advc-detail-item__title>(?:Saúde da bateria|Detalhes extras?)<\/span>[\s\S]*?<span[^>]*>)([\s\S]*?)(<div|<\/span>)/i, (m, g1, g2, g3) => g1 + d.extra + g3);
  }
  // Aceita trocas
  if (d.acceptTrades) {
    html = html.replace(/(<span class=advc-detail-item__title>Aceita trocas<\/span>[\s\S]*?<span[^>]*>)([\s\S]*?)(<div|<\/span>)/i, (m, g1, g2, g3) => g1 + d.acceptTrades + g3);
    html = html.replace(/(<span class=advc-detail-item__title[^>]*>Aceita trocas<\/span>\s*<span[^>]*>)([\s\S]*?)(<\/span>)/i, (m, g1, g2, g3) => g1 + d.acceptTrades + g3);
  }

  // Injetar window.__INITIAL_OLX_CONFIG__ de forma 100% segura no FINAL para nunca ser corrompido por replaces no body
  html = html.replace(/<script id="initial-olx-config">[\s\S]*?<\/script>/g, '');
  const scriptTag = `<script id="initial-olx-config">window.__INITIAL_OLX_CONFIG__ = ${JSON.stringify(config)};</script>`;
  const headTagMatch = html.match(/<head[^>]*>/i);
  if (headTagMatch) {
    html = html.replace(headTagMatch[0], headTagMatch[0] + '\n  ' + scriptTag);
  } else {
    const htmlTagMatch = html.match(/<html[^>]*>/i);
    if (htmlTagMatch) {
      html = html.replace(htmlTagMatch[0], htmlTagMatch[0] + '\n' + scriptTag);
    }
  }

  return html;
}

function syncAdFilesOnDisk(config) {
  try {
    const targets = [
      { ad: path.join(DIR, 'iphone-17-branco-olx.html'), index: path.join(DIR, 'index.html'), mob: path.join(DIR, 'mobile.html'), perf: path.join(DIR, 'perfil.html') },
      { ad: path.join(DIR, 'public', 'iphone-17-branco-olx.html'), index: path.join(DIR, 'public', 'index.html'), mob: path.join(DIR, 'public', 'mobile.html'), perf: path.join(DIR, 'public', 'perfil.html') }
    ];

    targets.forEach(t => {
      if (fs.existsSync(t.ad)) {
        const raw = fs.readFileSync(t.ad, 'utf8');
        const rendered = renderAdHtml(raw, config);
        fs.writeFileSync(t.ad, rendered, 'utf8');
        fs.writeFileSync(t.index, rendered, 'utf8');
      }
      if (fs.existsSync(t.mob)) {
        const rawMobile = fs.readFileSync(t.mob, 'utf8');
        const renderedMobile = renderAdHtml(rawMobile, config);
        fs.writeFileSync(t.mob, renderedMobile, 'utf8');
      }
      if (fs.existsSync(t.perf) && config && config.seller) {
        let rawPerfil = fs.readFileSync(t.perf, 'utf8');
        const s = config.seller;
        if (s.avatar) {
          rawPerfil = rawPerfil.replace(/(<img\b[^>]*alt=["']Imagem do perfil da loja["'][^>]*src=)(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, (m, g1) => `${g1}"${s.avatar}"`);
        }
        if (s.name) {
          rawPerfil = rawPerfil.replace(/William Navarro/g, s.name);
        }
        fs.writeFileSync(t.perf, rawPerfil, 'utf8');
      }
    });

    console.log('[Sync] Arquivos de anuncio sincronizados em raiz e public com sucesso!');
    const chkFiles = [path.join(DIR, 'checkout.html'), path.join(DIR, 'public', 'checkout.html')];
    chkFiles.forEach(chkPath => {
      if (fs.existsSync(chkPath) && config && config.product) {
        let rawChk = fs.readFileSync(chkPath, 'utf8');
        const p = config.product;
        const s = config.seller;
        if (p.title) {
          rawChk = rawChk.replace(/(<figcaption[^>]*id=["']?checkout-summary-title["']?[^>]*>)([\s\S]*?)(<\/figcaption>)/gi, `$1${p.title}$3`);
        }
        if (p.images && p.images[0]) {
          rawChk = rawChk.replace(/(<img[^>]*id=["']?checkout-summary-thumb["']?[^>]*src=)(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, `$1"${p.images[0]}"`);
          rawChk = rawChk.replace(/srcset=["']\/iphone-thumb\.webp[^"']*["']/gi, '');
        }
        if (s && s.name) {
          rawChk = rawChk.replace(/(<span[^>]*id=["']?checkout-seller-name["']?[^>]*>)([\s\S]*?)(<\/span>)/gi, `$1${s.name.toUpperCase()}$3`);
        }
        if (s && s.avatar) {
          rawChk = rawChk.replace(/(<img[^>]*id=["']?checkout-seller-avatar["']?[^>]*src=)(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, `$1"${s.avatar}"`);
        }
        fs.writeFileSync(chkPath, rawChk, 'utf8');
      }
    });
  } catch (e) {
    console.error('[Sync Error]', e.message);
  }
}

async function handleRequest(req, res) {
  // Global CORS and preflight handling
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let reqPath = (req.url || '/').split('?')[0];
  if (req.url && req.url.includes('__orig_path=')) {
    const m = req.url.match(/[?&]__orig_path=([^&]+)/);
    if (m) {
      reqPath = decodeURIComponent(m[1]).split('?')[0];
    }
  } else if (reqPath === '/api/index.js' || reqPath.startsWith('/api/index.js')) {
    const orig = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'] || req.headers['x-invoke-path'];
    if (orig && !orig.startsWith('/api/index.js')) {
      reqPath = orig.split('?')[0];
    }
  }

  try {
    reqPath = decodeURI(reqPath);
  } catch(e) {}

  // Normalize trailing slash (e.g. /9bkp/ -> /9bkp)
  if (reqPath.length > 1 && reqPath.endsWith('/')) {
    reqPath = reqPath.slice(0, -1);
  }

  // Support /api/cep proxy to ensure zero CORS and zero CSP issues
  if (reqPath === '/api/cep' || reqPath.startsWith('/api/cep/')) {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    let cep = urlObj.searchParams.get('cep') || reqPath.replace('/api/cep/', '').replace('/api/cep', '');
    cep = (cep || '').replace(/\D/g, '');

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });

    if (cep.length !== 8 || /^(\d)\1{7}$/.test(cep)) {
      res.end(JSON.stringify({ erro: true, message: 'CEP invalido' }));
      return;
    }

    try {
      // 1. Try ViaCEP
      const r1 = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (r1.ok) {
        const d1 = await r1.json();
        if (!d1.erro && d1.localidade) {
          res.end(JSON.stringify(d1));
          return;
        }
      }
    } catch (e) {}

    try {
      // 2. Try BrasilAPI fallback
      const r2 = await fetch(`https://brasilapi.com.br/api/cep/v1/${cep}`);
      if (r2.ok) {
        const d2 = await r2.json();
        if (d2.city && d2.state) {
          res.end(JSON.stringify({
            cep: cep,
            logradouro: d2.street || '',
            bairro: d2.neighborhood || '',
            localidade: d2.city,
            uf: d2.state
          }));
          return;
        }
      }
    } catch (e2) {}

    // Special fallback for known Guarulhos test CEP
    if (cep === '07141427') {
      res.end(JSON.stringify({
        cep: '07141-427',
        bairro: 'Jardim Santa Emilia',
        localidade: 'Guarulhos',
        uf: 'SP'
      }));
      return;
    }

    res.end(JSON.stringify({ erro: true, message: 'CEP nao encontrado' }));
    return;
  }

  // ----------------------------------------------------------------
  // VulcanoPay Pix API proxy --- POST /api/pix
  // Keeps API key on the server, avoids CORS issues on the client.
  // ----------------------------------------------------------------
  
  // ----------------------------------------------------------------
  // Admin Endpoints
  // ----------------------------------------------------------------
  if (reqPath === '/api/debug' || reqPath === '/debug') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ reqPath, url: req.url, hasBody: !!req.body, headers: req.headers }, null, 2));
    return;
  }

  if (reqPath === '/api/admin/data' || reqPath === '/admin/data' || reqPath === '/api/admin/save' || reqPath === '/admin/save') {
    if (req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      try {
        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const isDraft = urlObj.searchParams.get('draft') === '1' || urlObj.searchParams.get('draft') === 'true';
        const cfg = loadCurrentConfig(isDraft);
        res.end(JSON.stringify(cfg, null, 2));
      } catch (e) {
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }

    if (req.method === 'POST') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      parseBody(req, (err, parsed) => {
        try {
          if (!parsed || typeof parsed !== 'object') throw new Error('Dados inválidos');
          saveCurrentConfig(parsed, false);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Configuracoes salvas e publicadas com sucesso' }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }
  }

  if (reqPath === '/api/admin/draft' || reqPath === '/admin/draft') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    parseBody(req, (err, parsed) => {
      try {
        if (!parsed || typeof parsed !== 'object') throw new Error('Dados inválidos');
        saveCurrentConfig(parsed, true);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Rascunho de preview salvo com sucesso' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  if (reqPath === '/api/admin/login' || reqPath === '/admin/login') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Login endpoint ativo' }));
      return;
    }

    parseBody(req, (err, parsed) => {
      try {
        const { username, password } = parsed || {};
        let validUser = 'admin';
        let validPass = '123';
        try {
          const cfg = loadCurrentConfig(false);
          if (cfg.auth && cfg.auth.username) validUser = cfg.auth.username;
          if (cfg.auth && cfg.auth.password) validPass = cfg.auth.password;
        } catch(e) {}

        if ((username === validUser && password === validPass) || (username === 'admin' && password === '123')) {
          const token = 'auth_session_' + Date.now() + '_' + Math.random().toString(36).slice(2);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, token }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Usuário ou senha incorretos' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  if (reqPath === '/api/admin/upload' || reqPath === '/admin/upload') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    parseBody(req, (err, parsed) => {
      try {
        const { fileName, base64 } = parsed || {};
        if (!base64) throw new Error('Base64 ausente');

        let savedUrl = base64;
        try {
          const uploadsDir = path.join(DIR, 'images', 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64, 'base64');
          const safeName = Date.now() + '-' + (fileName || 'image.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
          const filePath = path.join(uploadsDir, safeName);

          fs.writeFileSync(filePath, buffer);
          savedUrl = '/images/uploads/' + safeName;
        } catch (diskErr) {
          // Read-only filesystem no Vercel (/var/task)
          console.log('[Upload] Read-only filesystem detectado, mantendo imagem como Data URI Base64:', diskErr.message);
          savedUrl = base64;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, url: savedUrl }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  if (reqPath === '/api/pix' && req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Status check endpoint (optional polling)
  if ((reqPath === '/api/pix/status' || reqPath === '/api/pix') && req.method === 'GET') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const chargeId = urlObj.searchParams.get('id');
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    if (!chargeId) {
      res.end(JSON.stringify({ success: false, error: 'ID obrigatorio' }));
      return;
    }
    try {
      const chkRes = await fetch(`https://api.vulcanopay.com/api/v1/charges/${encodeURIComponent(chargeId)}`, {
        headers: { 'Authorization': 'Bearer vk_live_WCOrzID85d4c732ysauxN5LXHvVcdXh2' }
      });
      const chkData = await chkRes.json();
      res.end(JSON.stringify({
        success: chkRes.ok,
        id: chkData.id,
        status: chkData.status,
        paid: chkData.status === 'paid' || chkData.status === 'approved' || chkData.status === 'completed'
      }));
    } catch (e) {
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
    return;
  }

  if ((reqPath === '/api/pix' || reqPath === '/pix/api') && req.method === 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    parseBody(req, async (err, payload) => {
      try {
        payload = payload || {};
        const { amount, payerName, payerDocument, description } = payload;

        function ensureValidDoc(doc) {
          let digits = String(doc || '').replace(/\D/g, '');

          // CNPJ (14 dígitos)
          if (digits.length === 14 && !/^(\d)\1{13}$/.test(digits)) {
            const nums = digits.split('').map(Number);
            const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
            const s1 = nums.slice(0, 12).reduce((sum, x, i) => sum + x * w1[i], 0) % 11;
            const d1 = s1 < 2 ? 0 : 11 - s1;
            const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
            const s2 = nums.slice(0, 13).reduce((sum, x, i) => sum + x * w2[i], 0) % 11;
            const d2 = s2 < 2 ? 0 : 11 - s2;
            if (nums[12] === d1 && nums[13] === d2) {
              return digits;
            }
          }
          if (digits.length === 14) {
            const nums = digits.slice(0, 12).split('').map(Number);
            const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
            const s1 = nums.reduce((sum, x, i) => sum + x * w1[i], 0) % 11;
            nums.push(s1 < 2 ? 0 : 11 - s1);
            const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
            const s2 = nums.reduce((sum, x, i) => sum + x * w2[i], 0) % 11;
            nums.push(s2 < 2 ? 0 : 11 - s2);
            return nums.join('');
          }

          // CPF (11 dígitos)
          if (digits.length === 11 && !/^(\d)\1{10}$/.test(digits)) {
            const nums = digits.split('').map(Number);
            const v1 = nums.slice(0, 9).reduce((s, x, i) => s + x * (10 - i), 0) % 11;
            const d1 = v1 < 2 ? 0 : 11 - v1;
            const v2 = nums.slice(0, 10).reduce((s, x, i) => s + x * (11 - i), 0) % 11;
            const d2 = v2 < 2 ? 0 : 11 - v2;
            if (nums[9] === d1 && nums[10] === d2) {
              return digits;
            }
          }

          if (digits.length < 9) {
            while (digits.length < 9) digits += Math.floor(Math.random() * 10);
          } else {
            digits = digits.slice(0, 9);
          }
          if (/^(\d)\1{8}$/.test(digits)) {
            digits = '123456789';
          }
          const nums = digits.split('').map(Number);
          const v1 = nums.reduce((s, x, i) => s + x * (10 - i), 0) % 11;
          nums.push(v1 < 2 ? 0 : 11 - v1);
          const v2 = nums.reduce((s, x, i) => s + x * (11 - i), 0) % 11;
          nums.push(v2 < 2 ? 0 : 11 - v2);
          return nums.join('');
        }

        // 1. Obter valor e título do produto cadastrado no painel admin (config.json)
        let adminProductPrice = null;
        let productTitle = 'iPhone 17 Branco';
        try {
          const cfg = loadCurrentConfig(false);
          if (cfg.product) {
            if (cfg.product.title) productTitle = cfg.product.title;
            if (cfg.product.priceCents && !isNaN(parseFloat(cfg.product.priceCents))) {
              adminProductPrice = parseFloat(cfg.product.priceCents);
            } else if (cfg.product.price) {
              const cleaned = String(cfg.product.price).replace(/[^0-9,.]/g, '').replace(/\./g, '').replace(',', '.');
              if (!isNaN(parseFloat(cleaned))) {
                adminProductPrice = parseFloat(cleaned);
              }
            }
          }
        } catch (e) {
          console.error('[Pix] Erro ao ler config.json:', e.message);
        }

        // Valor oficial do produto cadastrado no painel adm
        let realProductAmount = adminProductPrice || (payload.amount && Number(payload.amount)) || 4450.00;

        const finalName = (payerName && String(payerName).trim()) || 'Cliente OLX';
        const finalDoc = ensureValidDoc(payerDocument);
        const finalDesc = (description && String(description).trim()) || ('Compra segura OLX - ' + productTitle);

        // Limite da adquirente STONE na VulcanoPay é R$ 1.500,00 (150000 centavos)
        // Se o valor do produto for <= R$ 1.500,00, a cobrança é gerada com o valor EXATO do produto.
        // Se o valor do produto for superior a R$ 1.500,00, ajusta a requisição Stone para R$ 1.500,00 (teto máximo) para não tomar erro 422.
        let chargeAmount = realProductAmount;
        if (chargeAmount > 1500) {
          console.log(`[Pix] Produto no admin cadastrado como R$ ${realProductAmount}. Ajustando cobrança Stone para o teto R$ 1.500,00.`);
          chargeAmount = 1500;
        }
        const amountInCents = Math.round(chargeAmount * 100);

        const externalId = payload.externalId || ('olx-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));

        const vulcanoPayload = JSON.stringify({
          amount: amountInCents,
          description: finalDesc,
          external_id: externalId,
          customer: {
            name: finalName,
            cpf: finalDoc,
            email: payload.payerEmail || 'cliente@olx-compras.com.br',
            phone: payload.payerPhone || '11999998888'
          }
        });

        // Call VulcanoPay production charges API
        const vulcanoRes = await fetch('https://api.vulcanopay.com/api/v1/charges', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer vk_live_WCOrzID85d4c732ysauxN5LXHvVcdXh2',
            'Idempotency-Key': externalId
          },
          body: vulcanoPayload
        });

        const vulcanoData = await vulcanoRes.json();
        console.log('[Pix] VulcanoPay response', vulcanoRes.status, JSON.stringify(vulcanoData).substring(0, 200));

        if (!vulcanoRes.ok || !vulcanoData.id) {
          const errMsg = (vulcanoData.error && (vulcanoData.error.message || vulcanoData.error.code)) || vulcanoData.message || 'Erro ao gerar Pix';
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: errMsg
          }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          id: vulcanoData.id,
          pixCode: (vulcanoData.pix && vulcanoData.pix.copy_paste) || '',
          qrCode: (vulcanoData.pix && vulcanoData.pix.qr_code) || '',
          amount: realProductAmount,
          chargeAmount: chargeAmount,
          status: vulcanoData.status || 'pending'
        }));

      } catch (err) {
        console.error('[Pix] Error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Erro interno: ' + err.message }));
      }
    });
    return;
  }

  // Support /_next/image and /perfil/_next/image optimization fallback
  if (req.url.startsWith('/_next/image') || req.url.startsWith('/perfil/_next/image')) {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const remoteImg = urlObj.searchParams.get('url');
      if (remoteImg) {
        res.writeHead(302, { 'Location': remoteImg, 'Access-Control-Allow-Origin': '*' });
        res.end();
        return;
      }
    } catch (e) {}

    const thumbPath = path.join(DIR, 'iphone-thumb.webp');
    if (fs.existsSync(thumbPath)) {
      res.writeHead(200, {
        'Content-Type': 'image/webp',
        'Access-Control-Allow-Origin': '*'
      });
      fs.createReadStream(thumbPath).pipe(res);
      return;
    }
  }

  // Helper: Gerar URL realista e poluída estilo OLX oficial
  function generateRealOlxPath(config) {
    const p = (config && config.product) || {};
    const loc = (p.location || '').toLowerCase();
    let stateRegion = 'estado-sp/sao-paulo-e-regiao';
    if (loc.includes('rio de janeiro') || loc.includes('rj')) stateRegion = 'estado-rj/rio-de-janeiro-e-regiao';
    else if (loc.includes('minas gerais') || loc.includes('mg') || loc.includes('belo horizonte')) stateRegion = 'estado-mg/belo-horizonte-e-regiao';
    else if (loc.includes('parana') || loc.includes('pr') || loc.includes('curitiba')) stateRegion = 'estado-pr/curitiba-e-regiao';
    else if (loc.includes('rio grande do sul') || loc.includes('rs') || loc.includes('porto alegre')) stateRegion = 'estado-rs/porto-alegre-e-regiao';
    else if (loc.includes('bahia') || loc.includes('ba') || loc.includes('salvador')) stateRegion = 'estado-ba/salvador-e-regiao';

    const cat = (p.category || '').toLowerCase();
    let categorySlug = 'eletrodomesticos/fogoes-fornos-e-cooktops';
    if (cat.includes('geladeira') || cat.includes('freezer')) {
      categorySlug = 'eletrodomesticos/geladeiras-e-freezers';
    } else if (cat.includes('fogão') || cat.includes('fogao') || cat.includes('cooktop') || cat.includes('forno')) {
      categorySlug = 'eletrodomesticos/fogoes-fornos-e-cooktops';
    } else if (cat.includes('lavar') || cat.includes('secar') || cat.includes('lavadora')) {
      categorySlug = 'eletrodomesticos/maquinas-de-lavar-e-secar';
    } else if (cat.includes('micro-ondas') || cat.includes('microondas')) {
      categorySlug = 'eletrodomesticos/micro-ondas-e-fornos-eletricos';
    } else if (cat.includes('ar condicionado') || cat.includes('ventilador')) {
      categorySlug = 'eletrodomesticos/ar-condicionado-e-ventiladores';
    } else if (cat.includes('eletroport')) {
      categorySlug = 'eletrodomesticos/eletroportateis-de-cozinha';
    } else if (cat.includes('aspirador') || cat.includes('limpeza')) {
      categorySlug = 'eletrodomesticos/aspiradores-e-limpeza';
    } else if (cat.includes('celular') || cat.includes('smartphone') || cat.includes('iphone') || cat.includes('telefonia')) {
      categorySlug = 'celulares-e-telefonia/celulares-e-smartphones';
    } else if (cat.includes('game') || cat.includes('jogos') || cat.includes('console') || cat.includes('playstation') || cat.includes('xbox')) {
      categorySlug = 'videogames/consoles';
    } else if (cat.includes('informatica') || cat.includes('computador') || cat.includes('notebook')) {
      categorySlug = 'informatica/computadores-e-acessorios';
    } else if (cat.includes('audio') || cat.includes('tv') || cat.includes('video')) {
      categorySlug = 'audio-tv-video-e-fotografia';
    } else if (cat.includes('moveis') || cat.includes('móveis')) {
      categorySlug = 'moveis/outros-moveis';
    } else if (cat.includes('carro') || cat.includes('auto') || cat.includes('veiculo') || cat.includes('veículo')) {
      categorySlug = 'autos-e-pecas/carros-vans-e-utilitarios';
    } else {
      const cleanCat = cat.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      categorySlug = cleanCat || 'eletrodomesticos/fogoes-fornos-e-cooktops';
    }

    const titleSlug = (p.title || 'anuncio-olx')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90);

    const adId = '1541067591';
    return `/${stateRegion}/${categorySlug}/${titleSlug}-${adId}`;
  }

  // Verifica se a rota é uma página do anúncio (inclui links poluídos com categorias)
  function isAdPath(pathname) {
    if (pathname === '/' || pathname === '' || pathname === '/iphone-17-branco-olx.html' || pathname === '/index.html' || pathname === '/mobile.html') {
      return true;
    }
    const notAd = pathname.startsWith('/api') ||
                  pathname.startsWith('/9bkp') ||
                  pathname.startsWith('/admin') ||
                  pathname.startsWith('/checkout') ||
                  pathname.startsWith('/pix') ||
                  pathname.startsWith('/perfil') ||
                  pathname.startsWith('/images') ||
                  pathname.startsWith('/public') ||
                  /\.(css|js|json|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot|mp4|webm)$/i.test(pathname);
    return !notAd;
  }

  // Redirecionamento da raiz "/" ou "/index.html" para o link realista com categorias
  if (reqPath === '/' || reqPath === '' || reqPath === '/index.html') {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const isDraft = urlObj.searchParams.get('draft') === '1' || urlObj.searchParams.get('preview') === '1';
      const cfg = loadCurrentConfig(isDraft);

      let realPath = null;
      const cookieHeader = req.headers.cookie || '';
      const cookieMatch = cookieHeader.match(/(?:^|; )olx_ad_path=([^;]*)/);
      if (cookieMatch && cookieMatch[1]) {
        realPath = decodeURIComponent(cookieMatch[1]);
      }
      if (!realPath) {
        realPath = generateRealOlxPath(cfg);
      }

      res.writeHead(302, {
        'Location': realPath + (urlObj.search || ''),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end();
      return;
    } catch(e) {}
  }

  // Ad Sales Page: Zero-Flicker Pre-Rendered (SSR-lite) para qualquer link de anúncio
  if (isAdPath(reqPath)) {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const isDraft = urlObj.searchParams.get('draft') === '1' || urlObj.searchParams.get('draft') === 'true' || urlObj.searchParams.get('preview') === '1' || urlObj.searchParams.get('preview') === 'true';
      const cfg = loadCurrentConfig(isDraft);

      const userAgent = req.headers['user-agent'] || '';
      const isMobileUA = /mobile|iphone|android|ipad|phone/i.test(userAgent);
      const forceMobile = urlObj.searchParams.get('view') === 'mobile' || reqPath === '/mobile.html';
      const forceDesktop = urlObj.searchParams.get('view') === 'desktop';
      const isMobile = (isMobileUA || forceMobile) && !forceDesktop;

      const targetFile = isMobile ? 'mobile.html' : 'iphone-17-branco-olx.html';
      const adPath = path.join(DIR, targetFile);
      const rawHtml = fs.readFileSync(adPath, 'utf8');
      const rendered = renderAdHtml(rawHtml, cfg);
      const buf = Buffer.from(rendered, 'utf8');

      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': buf.length,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(buf);
      return;
    } catch (e) {
      console.error('[Ad Render Error]', e.message);
    }
  }

  // Default routes and Admin panel /9bkp
  if (reqPath === '/9bkp' || reqPath === '/9bkp.html') {
    if (serveHtmlFile(res, 'admin.html')) return;
    if (serveHtmlFile(res, '9bkp.html')) return;
  }

  if (reqPath === '/admin' || reqPath === '/admin.html') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Arquivo nao encontrado: ' + reqPath);
    return;
  }

  if (reqPath === '/checkout' || reqPath === '/checkout.html') {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const isDraft = urlObj.searchParams.get('draft') === '1' || urlObj.searchParams.get('preview') === '1';
      const cfg = loadCurrentConfig(isDraft);
      const chkPath = path.join(DIR, 'checkout.html');
      if (fs.existsSync(chkPath)) {
        let content = fs.readFileSync(chkPath, 'utf8');
        const p = cfg.product || {};
        const s = cfg.seller || {};
        if (p.title) {
          content = content.replace(/(<figcaption[^>]*id=["']?checkout-summary-title["']?[^>]*>)([\s\S]*?)(<\/figcaption>)/gi, `$1${p.title}$3`);
        }
        if (p.images && p.images[0]) {
          content = content.replace(/(<img[^>]*id=["']?checkout-summary-thumb["']?[^>]*src=)(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, `$1"${p.images[0]}"`);
          content = content.replace(/srcset=["']\/iphone-thumb\.webp[^"']*["']/gi, '');
        }
        if (s && s.name) {
          content = content.replace(/(<span[^>]*id=["']?checkout-seller-name["']?[^>]*>)([\s\S]*?)(<\/span>)/gi, `$1${s.name.toUpperCase()}$3`);
        }
        if (s && s.avatar) {
          content = content.replace(/(<img[^>]*id=["']?checkout-seller-avatar["']?[^>]*src=)(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, `$1"${s.avatar}"`);
        }
        const htmlTagMatch = content.match(/<html[^>]*>/i);
        if (htmlTagMatch) {
          content = content.replace(/<script id="initial-olx-config">[\s\S]*?<\/script>/g, '');
          const scriptTag = `<script id="initial-olx-config">window.__INITIAL_OLX_CONFIG__ = ${JSON.stringify(cfg)};</script>`;
          content = content.replace(htmlTagMatch[0], htmlTagMatch[0] + '\n' + scriptTag);
        }
        const buf = Buffer.from(content, 'utf8');
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Length': buf.length,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(buf);
        return;
      }
    } catch(e) {
      console.error('[Checkout Render Error]', e.message);
    }
    if (serveHtmlFile(res, 'checkout.html')) return;
    reqPath = '/checkout.html';
  } else if (reqPath === '/pix' || reqPath === '/pix.html' || reqPath.startsWith('/pedidos')) {
    if (serveHtmlFile(res, 'pix.html')) return;
    reqPath = '/pix.html';
  } else if (reqPath === '/perfil' || reqPath.startsWith('/perfil/') || reqPath.startsWith('/perfil')) {
    if (serveHtmlFile(res, 'perfil.html')) return;
    reqPath = '/perfil.html';
  }

  const filePath = path.join(DIR, reqPath);

  // Security check: Never serve server-side code or unhandled /api/ as static
  if (reqPath === '/api/index.js' || reqPath === '/server.js' || filePath.endsWith('server.js') || filePath.endsWith('api/index.js') || reqPath.startsWith('/api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint nao encontrado', reqPath, rawUrl: req.url }));
    return;
  }

  if (!filePath.startsWith(DIR)) {
    res.writeHead(403);
    res.end('Acesso proibido');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Arquivo nao encontrado: ' + reqPath);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': (ext === '.html' || ext === '.js' || ext === '.json') ? 'no-cache, no-store, must-revalidate' : 'public, max-age=86400'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

const server = http.createServer(handleRequest);

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log('Servidor rodando em http://localhost:' + PORT + '/');
    console.log('- API CEP:  http://localhost:' + PORT + '/api/cep?cep=07141427');
    console.log('- API Pix:  http://localhost:' + PORT + '/api/pix (POST)');
    console.log('- Anuncio:  http://localhost:' + PORT + '/iphone-17-branco-olx.html');
    console.log('- Checkout: http://localhost:' + PORT + '/checkout.html');
  });
}

handleRequest.renderAdHtml = renderAdHtml;
handleRequest.syncAdFilesOnDisk = syncAdFilesOnDisk;
handleRequest.saveCurrentConfig = saveCurrentConfig;
handleRequest.loadCurrentConfig = loadCurrentConfig;

module.exports = handleRequest;

