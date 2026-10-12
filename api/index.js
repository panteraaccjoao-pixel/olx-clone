const handleRequest = require('../server.js');

module.exports = (req, res) => {
  try {
    const urlObj = new URL(req.url, 'http://localhost');
    if (urlObj.searchParams.has('__orig_path')) {
      const orig = urlObj.searchParams.get('__orig_path');
      urlObj.searchParams.delete('__orig_path');
      const query = urlObj.search ? urlObj.search : '';
      req.url = orig + query;
    } else {
      const fwd = req.headers['x-forwarded-uri'] || req.headers['x-matched-path'] || req.headers['x-invoke-path'];
      if (fwd && !fwd.startsWith('/api/index.js')) {
        const query = urlObj.search ? urlObj.search : '';
        req.url = fwd + (query && !fwd.includes('?') ? query : '');
      }
    }
  } catch (e) {}

  return handleRequest(req, res);
};
