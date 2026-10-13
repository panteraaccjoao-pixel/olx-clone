const handleRequest = require('../../server.js');
const { Readable } = require('stream');

exports.handler = async (event, context) => {
  return new Promise((resolve) => {
    try {
      // 1. Reconstruct clean path and query string
      let rawPath = event.path || '/';
      // If path was redirected from /.netlify/functions/api/*
      if (rawPath.startsWith('/.netlify/functions/api')) {
        rawPath = rawPath.replace('/.netlify/functions/api', '/api');
      }
      if (!rawPath.startsWith('/api')) {
        rawPath = '/api' + (rawPath.startsWith('/') ? rawPath : '/' + rawPath);
      }

      let qs = '';
      if (event.rawQuery) {
        qs = '?' + event.rawQuery;
      } else if (event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0) {
        qs = '?' + new URLSearchParams(event.queryStringParameters).toString();
      }

      const fullUrl = rawPath + qs;

      // 2. Prepare body
      let bodyBuf = Buffer.alloc(0);
      if (event.body) {
        if (event.isBase64Encoded) {
          bodyBuf = Buffer.from(event.body, 'base64');
        } else {
          bodyBuf = Buffer.from(event.body, 'utf8');
        }
      }

      // 3. Mock IncomingMessage (Readable stream)
      const req = new Readable({
        read() {
          if (bodyBuf.length > 0) {
            this.push(bodyBuf);
          }
          this.push(null);
        }
      });

      req.method = event.httpMethod || 'GET';
      req.url = fullUrl;
      req.headers = Object.assign({}, event.headers || {});
      // Ensure host header
      req.headers.host = req.headers.host || 'localhost';

      // 4. Mock ServerResponse
      let statusCode = 200;
      let resHeaders = {};
      const resChunks = [];

      const res = {
        writeHead(code, headers) {
          statusCode = code;
          if (headers) {
            Object.keys(headers).forEach(k => {
              resHeaders[k.toLowerCase()] = headers[k];
            });
          }
          return this;
        },
        setHeader(key, val) {
          resHeaders[key.toLowerCase()] = val;
          return this;
        },
        getHeader(key) {
          return resHeaders[key.toLowerCase()];
        },
        write(chunk) {
          if (chunk) {
            resChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          return true;
        },
        end(chunk) {
          if (chunk) {
            resChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const finalBuffer = Buffer.concat(resChunks);
          const contentType = resHeaders['content-type'] || '';
          const isText = contentType.includes('text') || contentType.includes('json') || contentType.includes('javascript');

          resolve({
            statusCode: statusCode,
            headers: resHeaders,
            body: isText ? finalBuffer.toString('utf8') : finalBuffer.toString('base64'),
            isBase64Encoded: !isText
          });
        }
      };

      // 5. Delegate to server.js handleRequest
      handleRequest(req, res);
    } catch (err) {
      console.error('[Netlify Function Error]', err);
      resolve({
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: err.message })
      });
    }
  });
};
