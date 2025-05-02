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

// MCP Server endpoints (/sse)
app.all('/sse*', (req, res) => {
  logger.info(`Proxying SSE request to MCP server: ${req.path}`);
  
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
  
  // For static content and regular requests
  logger.info(`Proxying request to frontend: ${req.url}`);
  
  // Set a longer timeout for all frontend requests
  const frontendProxyOptions = {
    target: 'http://localhost:5173',
    changeOrigin: true,
    followRedirects: true,
    timeout: 60000,
    proxyTimeout: 60000,
    // Add CORS and other necessary headers
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Connection': 'keep-alive'
    }
  };
  
  proxy.web(req, res, frontendProxyOptions, (err) => {
    if (err) {
      logger.error(`Frontend proxy error: ${err.message}`, { error: err });
      // Send a friendly error response
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error connecting to frontend service. Please try again later.');
    }
  });
});

// Create server
const server = http.createServer(app);

// Setup WebSocket proxy (we've disabled HMR in Vite config)
server.on('upgrade', (req, socket, head) => {
  logger.info(`WebSocket upgrade request for: ${req.url}`);
  
  // Route WebSocket connections to the appropriate target
  if (req.url.startsWith('/api/')) {
    // WebSocket connections to API routes
    proxy.ws(req, socket, head, {
      target: 'http://localhost:3000',
      changeOrigin: true
    });
  } else if (req.url.startsWith('/.well-known/') || req.url === '/tasks' || req.url.startsWith('/agent-card')) {
    // WebSocket connections to A2A server
    proxy.ws(req, socket, head, {
      target: 'http://localhost:3200',
      changeOrigin: true
    });
  } else if (req.url.startsWith('/sse')) {
    // Event Source connections to MCP server
    logger.info(`Proxying SSE WebSocket: ${req.url}`);
    proxy.ws(req, socket, head, {
      target: 'http://localhost:3400',
      ws: true,
      changeOrigin: true
    });
  } else {
    // Close other WebSocket connections gracefully
    // This prevents Vite HMR from constantly retrying
    logger.info(`Closing unused WebSocket for: ${req.url}`);
    
    // Send a proper WebSocket close handshake
    const message = 'HTTP/1.1 400 Bad Request\r\n' +
                   'Connection: close\r\n' +
                   '\r\n';
    socket.write(message);
    socket.destroy();
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
