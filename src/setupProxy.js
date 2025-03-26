// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // The server is running on port 8050, not 8888
  const API_TARGET = 'http://localhost:8050';
  
  // Main API proxy
  app.use(
    '/api',
    createProxyMiddleware({
      target: API_TARGET,
      changeOrigin: true
    })
  );
  
  // Add proxy for direct endpoint calls (without /api prefix)
  app.use(
    '/create-checkout-session',
    createProxyMiddleware({
      target: API_TARGET,
      changeOrigin: true
    })
  );

  // Fix: Explicitly add proxy for /api/create-checkout-session
  app.use(
    '/api/create-checkout-session',
    createProxyMiddleware({
      target: API_TARGET,
      changeOrigin: true,
      pathRewrite: path => path.replace('/api', '')  // Remove /api prefix
    })
  );
  
  // Proxy for subscription endpoints
  app.use(
    '/api/subscription',
    createProxyMiddleware({
      target: API_TARGET,
      changeOrigin: true
    })
  );
  
  // Health check endpoint
  app.use(
    '/api/healthcheck',
    createProxyMiddleware({
      target: API_TARGET,
      changeOrigin: true
    })
  );
};