const http = require('http');
const httpProxy = require('http-proxy');
const express = require('express');
const path = require('path');
const { createLogger, format, transports } = require('winston');

// Configure logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'proxy-server' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// Create a proxy server instance
const proxy = httpProxy.createProxyServer({});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  logger.error('Proxy error:', err);
  res.writeHead(500, { 'Content-Type': 'text/plain' });
  res.end('Proxy error: Service unavailable');
});

// Create Express app
const app = express();

// API endpoints proxy - preserve the /api prefix
app.use('/api', (req, res) => {
  logger.info(`Proxying request to API: ${req.url}`);
  // We need to use the full URL without stripping /api since the backend expects it
  const targetUrl = `http://localhost:3000${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  logger.info(`Target URL: ${targetUrl}`);
  
  proxy.web(req, res, { 
    target: 'http://localhost:3000',
    changeOrigin: true,
    // Don't remove the /api prefix because the backend API expects it
    ignorePath: false
  });
});

// Frontend proxy for development
app.use('/', (req, res) => {
  // Skip if it's an API request
  if (req.url.startsWith('/api/')) {
    return;
  }
  
  logger.info(`Proxying request to frontend: ${req.url}`);
  proxy.web(req, res, {
    target: 'http://localhost:5000',
    changeOrigin: true
  });
});

// Create server
const server = http.createServer(app);

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Proxy server running at http://0.0.0.0:${PORT}`);
  logger.info('Proxying API requests to http://localhost:3000');
});
