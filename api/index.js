const handleRequest = require('../server.js');

module.exports = (req, res) => {
  try {
    if (req.url && req.url.includes('__orig_path=')) {
      const m = req.url.match(/[?&]__orig_path=([^&]+)/);
      if (m) {
        const orig = decodeURIComponent(m[1]);
        const cleanQuery = req.url.replace(/[?&]__orig_path=[^&]*/, '').replace(/\?$/, '');
        const qIdx = cleanQuery.indexOf('?');
        req.url = orig + (qIdx !== -1 ? cleanQuery.slice(qIdx) : '');
      }
    } else {
      const fwd = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'] || req.headers['x-invoke-path'];
      if (fwd && !fwd.startsWith('/api/index.js')) {
        const qIdx = req.url.indexOf('?');
        req.url = fwd + (qIdx !== -1 ? req.url.slice(qIdx) : '');
      }
    }
  } catch (e) {}

  return handleRequest(req, res);
};
