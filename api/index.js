const handleRequest = require('../server.js');

module.exports = (req, res) => {
  try {
    const origPath = req.headers['x-matched-path'] || req.headers['x-forwarded-uri'] || req.headers['x-invoke-path'];
    if (origPath && !origPath.startsWith('/api/index.js')) {
      const urlObj = new URL(req.url, 'http://localhost');
      const query = urlObj.search ? urlObj.search : '';
      req.url = origPath + (query && !origPath.includes('?') ? query : '');
    } else {
      const urlObj = new URL(req.url, 'http://localhost');
      if (urlObj.searchParams.has('__orig_path')) {
        const query = urlObj.search ? urlObj.search : '';
        req.url = urlObj.searchParams.get('__orig_path') + query;
      }
    }
  } catch (e) {}

  return handleRequest(req, res);
};
