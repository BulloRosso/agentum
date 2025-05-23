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
app.get('/api/health', (req, res) => {
  logger.info(`Proxying health check request to API endpoint`);
  
  // Direct the request to the FastAPI backend health endpoint
  proxy.web(req, res, {
    target: 'http://localhost:3000/health',
    ignorePath: true,
    changeOrigin: true
  });
});

// Legacy health check (will be deprecated)
app.get('/api/v1/health', (req, res) => {
  logger.info(`Proxying legacy health check request to API endpoint`);
  
  proxy.web(req, res, {
    target: 'http://localhost:3000/v1/health',
    ignorePath: true,
    changeOrigin: true
  });
});

// API Documentation endpoints with versioning
app.get('/api/api/v1/doc', (req, res) => {
  logger.info(`Proxying API v1 documentation request`);
  
  proxy.web(req, res, {
    target: 'http://localhost:3000/api/v1/doc',
    ignorePath: true,
    changeOrigin: true
  });
});

// Legacy API Documentation (will be deprecated)
app.get('/api/api/doc', (req, res) => {
  logger.info(`Proxying legacy API documentation request`);
  
  proxy.web(req, res, {
    target: 'http://localhost:3000/api/doc',
    ignorePath: true,
    changeOrigin: true
  });
});

// API Methods endpoint with versioning
app.get('/api/api/v1/methods', (req, res) => {
  logger.info(`Proxying API v1 methods request`);
  
  proxy.web(req, res, {
    target: 'http://localhost:3000/api/v1/methods',
    ignorePath: true,
    changeOrigin: true
  });
});

// Legacy API Methods endpoint (will be deprecated)
app.get('/api/api/methods', (req, res) => {
  logger.info(`Proxying legacy API methods request`);
  
  proxy.web(req, res, {
    target: 'http://localhost:3000/api/methods',
    ignorePath: true,
    changeOrigin: true
  });
});

// OpenAPI schema endpoint
app.get('/api/openapi.json', (req, res) => {
  logger.info(`Proxying OpenAPI schema request`);
  
  proxy.web(req, res, {
    target: 'http://localhost:3000/openapi.json',
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

// MCP Server endpoints (/sse and root for POST messages)
app.all('/sse*', (req, res) => {
  if (req.method === 'POST') {
    logger.info(`Proxying MCP POST request to MCP server: ${req.path}`);
  } else {
    logger.info(`Proxying SSE request to MCP server: ${req.path}`);
  }
  
  proxy.web(req, res, {
    target: 'http://localhost:3400',
    changeOrigin: true
  });
});

// Add specific POST route for MCP message handling to the root endpoint
app.post('/', (req, res) => {
  logger.info(`Proxying MCP POST message to MCP server root endpoint`);
  
  proxy.web(req, res, {
    target: 'http://localhost:3400',
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

// Add all methods for /agent-card route to A2A server
app.use('/agent-card', (req, res) => {
  logger.info(`Proxying agent-card request to A2A server: ${req.method} ${req.path}`);
  
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

// Storage API endpoints - handle all methods (GET, POST, DELETE)
app.all(['/api/v1/storage*', '/v1/storage*'], (req, res) => {
  logger.info(`Proxying storage API request: ${req.method} ${req.path} with query: ${JSON.stringify(req.query)}`);
  
  // Remove /api prefix if it exists, and route to the API server
  let targetPath = req.path;
  if (targetPath.startsWith('/api/')) {
    targetPath = targetPath.substring(4); // Remove /api
  }
  
  // Preserve query parameters
  const targetUrl = new URL(`http://localhost:3000${targetPath}`);
  
  // Copy all query parameters
  Object.keys(req.query).forEach(key => {
    targetUrl.searchParams.set(key, req.query[key]);
  });
  
  proxy.web(req, res, {
    target: targetUrl.toString(),
    ignorePath: true,
    changeOrigin: true
  });
});

// Handle direct v1 API requests without changing the URL structure
app.use('/v1', (req, res) => {
  logger.info(`Proxying direct v1 API request: ${req.path}`);
  
  // Map directly to the API server's /v1 endpoints
  proxy.web(req, res, {
    target: 'http://localhost:3000',
    changeOrigin: true
  });
});

// Frontend proxy for development
app.use('/', (req, res) => {
  // Skip if it's an API request or an A2A request
  if (req.url.startsWith('/api/') || 
      req.url.startsWith('/.well-known/') || 
      req.url === '/tasks' ||
      req.url.startsWith('/agent-card')) {
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
  if (req.url.startsWith('/ws') || 
      req.url.startsWith('/@vite/') || 
      req.url.includes('vite-hmr')) {
    // Vite HMR WebSocket connections
    logger.info(`Routing HMR WebSocket connection to Vite server: ${req.url}`);
    proxy.ws(req, socket, head, {
      target: 'ws://localhost:5173',
      ws: true,
      changeOrigin: true
    });
  } else if (req.url.startsWith('/api/')) {
    // WebSocket connections to API routes
    proxy.ws(req, socket, head, {
      target: 'http://localhost:3000',
      changeOrigin: true
    });
  } else if (req.url.startsWith('/.well-known/') || 
             req.url === '/tasks' || 
             req.url.startsWith('/agent-card')) {
    // WebSocket connections to A2A server
    proxy.ws(req, socket, head, {
      target: 'http://localhost:3200',
      changeOrigin: true
    });
  } else {
    // Other WebSocket connections to frontend
    logger.info(`Routing other WebSocket connection to frontend: ${req.url}`);
    proxy.ws(req, socket, head, {
      target: 'ws://localhost:5173',
      ws: true,
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
  logger.info('Proxying MCP/SSE requests to http://localhost:3400');
  logger.info('WebSocket proxying enabled for HMR and real-time updates');
});
