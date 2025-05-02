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

// Create a proxy server instance with WebSocket support
const proxy = httpProxy.createProxyServer({
  ws: true, // Enable WebSocket support
  changeOrigin: true
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  logger.error('Proxy error:', err);
  if (res && res.writeHead) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Proxy error: Service unavailable');
  }
});

// Create Express app
const app = express();

// Health check endpoint needs to be explicitly routed to maintain API path
app.get('/api/v1/health', (req, res) => {
  logger.info(`Proxying health check request to API endpoint`);
  
  // Direct the request to the FastAPI backend health endpoint
  proxy.web(req, res, {
    target: 'http://localhost:3000/v1/health',
    ignorePath: true,
    changeOrigin: true
  });
});

// A2A Server endpoints (.well-known and /tasks)
app.get('/.well-known/*', (req, res) => {
  logger.info(`Proxying A2A well-known request to A2A server: ${req.path}`);
  
  proxy.web(req, res, {
    target: 'http://localhost:3200',
    changeOrigin: true
  });
});

app.post('/tasks', (req, res) => {
  logger.info(`Proxying A2A tasks request to A2A server`);
  
  proxy.web(req, res, {
    target: 'http://localhost:3200',
    changeOrigin: true
  });
});

// Generic API endpoint proxy for all other API routes
app.use('/api', (req, res) => {
  if (req.path === '/v1/health') {
    // Skip this handler for health check - it's handled by the specific route above
    return;
  }
  
  logger.info(`Proxying API request: ${req.path}`);
  
  // Remove /api prefix when forwarding to backend
  const backendPath = req.path;
  proxy.web(req, res, {
    target: `http://localhost:3000${backendPath}`,
    ignorePath: true,
    changeOrigin: true
  });
});

// Frontend proxy for development
app.use('/', (req, res) => {
  // Skip if it's an API request or an A2A request
  if (req.url.startsWith('/api/') || 
      req.url.startsWith('/.well-known/') || 
      req.url === '/tasks') {
    return;
  }
  
  logger.info(`Proxying request to frontend: ${req.url}`);
  proxy.web(req, res, {
    target: 'http://localhost:5173',
    changeOrigin: true
  });
});

// Create server
const server = http.createServer(app);

// Setup WebSocket proxy for Vite HMR (Hot Module Replacement)
server.on('upgrade', (req, socket, head) => {
  logger.info(`WebSocket upgrade request for: ${req.url}`);
  
  // Route WebSocket connections to the appropriate target
  if (req.url.startsWith('/api/')) {
    // WebSocket connections to API routes
    proxy.ws(req, socket, head, {
      target: 'http://localhost:3000',
      changeOrigin: true
    });
  } else if (req.url.startsWith('/.well-known/') || req.url === '/tasks') {
    // WebSocket connections to A2A server
    proxy.ws(req, socket, head, {
      target: 'http://localhost:3200',
      changeOrigin: true
    });
  } else {
    // WebSocket connections to frontend (Vite HMR)
    proxy.ws(req, socket, head, {
      target: 'http://localhost:5173',
      changeOrigin: true
    });
  }
});

// Start the server
const PORT = process.env.PORT || 80;
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Proxy server running at http://0.0.0.0:${PORT}`);
  logger.info('Proxying API requests to http://localhost:3000');
  logger.info('Proxying Frontend requests to http://localhost:5173');
  logger.info('Proxying A2A requests to http://localhost:3200');
  logger.info('WebSocket proxying enabled for HMR and real-time updates');
});
