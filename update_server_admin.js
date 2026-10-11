const fs = require('fs');

let serverCode = fs.readFileSync('server.js', 'utf8');

const adminEndpoints = `
  // ----------------------------------------------------------------
  // Admin Endpoints
  // ----------------------------------------------------------------
  if (reqPath === '/api/admin/data' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    try {
      const config = fs.readFileSync(path.join(DIR, 'config.json'), 'utf8');
      res.end(config);
    } catch (e) {
      res.end(JSON.stringify({ error: e.message }));
    }
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
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Configuracoes salvas com sucesso' }));
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

        const matches = base64.match(/^data:([A-Za-z-+\\/]+);base64,(.+)$/);
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
`;

// Insert admin endpoints right before /api/pix
if (!serverCode.includes('/api/admin/data')) {
  serverCode = serverCode.replace('if (reqPath === \'/api/pix\' && req.method === \'OPTIONS\')', adminEndpoints + '\n  if (reqPath === \'/api/pix\' && req.method === \'OPTIONS\')');
}

// Add route for /admin
if (!serverCode.includes("reqPath === '/admin'")) {
  serverCode = serverCode.replace("reqPath = '/perfil.html';", "reqPath = '/perfil.html';\n  } else if (reqPath === '/admin' || reqPath === '/admin.html') {\n    reqPath = '/admin.html';");
}

fs.writeFileSync('server.js', serverCode);
console.log('server.js updated with admin endpoints and routes.');
