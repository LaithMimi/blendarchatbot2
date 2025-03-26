// Replace src/setupProxy.js with this content
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Main API proxy
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8888',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // Remove the '/api' prefix when forwarding the request
      },
    })
  );
  
  // Add proxy for direct endpoint calls (like create-checkout-session)
  app.use(
    '/create-checkout-session',
    createProxyMiddleware({
      target: 'http://localhost:8888',
      changeOrigin: true,
    })
  );
};