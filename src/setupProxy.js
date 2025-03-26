// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Main API proxy
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8888',
      changeOrigin: true
    })
  );
  
  // Add proxy for direct endpoint calls (without /api prefix)
  app.use(
    '/create-checkout-session',
    createProxyMiddleware({
      target: 'http://localhost:8888',
      changeOrigin: true
    })
  );

  // Fix: Explicitly add proxy for /api/create-checkout-session
  app.use(
    '/api/create-checkout-session',
    createProxyMiddleware({
      target: 'http://localhost:8888',
      changeOrigin: true
    })
  );
  
  // Proxy for subscription endpoints
  app.use(
    '/api/subscription',
    createProxyMiddleware({
      target: 'http://localhost:8888',
      changeOrigin: true
    })
  );
  
  // Health check endpoint
  app.use(
    '/api/healthcheck',
    createProxyMiddleware({
      target: 'http://localhost:8888',
      changeOrigin: true
    })
  );
};