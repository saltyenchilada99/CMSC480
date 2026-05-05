const { createProxyMiddleware } = require('http-proxy-middleware');

/**
 * Create React App development-server proxy.
 *
 * This file intentionally stays CommonJS JavaScript because CRA loads
 * setupProxy.js directly in Node before the TypeScript frontend is compiled.
 */
module.exports = function (app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
    })
  );
};
