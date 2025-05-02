const express = require('express');
const cors = require('cors');
const winston = require('winston');

// Set up logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'mcp-server' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Define available tools
const availableTools = [
  {
    name: 'fetch',
    description: 'Fetches content from a URL',
    inputSchema: {
      type: 'object',
      required: ['url'],
      properties: {
        url: {
          type: 'string',
          description: 'URL to fetch',
        }
      }
    }
  },
  {
    name: 'saveFile',
    description: 'Saves content to a file',
    inputSchema: {
      type: 'object',
      required: ['filename', 'content'],
      properties: {
        filename: {
          type: 'string',
          description: 'Name of the file to save',
        },
        content: {
          type: 'string',
          description: 'Content to save',
        }
      }
    }
  }
];

// Define available resources
const availableResources = [
  {
    uri: 'file:///greeting.txt',
    name: 'greeting',
    description: 'A welcome message',
    mimeType: 'text/plain',
    content: 'Hello! Welcome to the MCP server.'
  },
  {
    uri: 'file:///help.txt',
    name: 'help',
    description: 'Help information',
    mimeType: 'text/plain',
    content: 'This server provides tools and resources for testing MCP functionality.'
  },
  {
    uri: 'file:///config.json',
    name: 'config',
    description: 'Configuration settings',
    mimeType: 'application/json',
    content: JSON.stringify({ version: '1.0.0', features: ['tools', 'resources', 'prompts'] })
  }
];

// Define available prompts
const availablePrompts = [
  {
    name: 'simple',
    description: 'A simple prompt template with optional context and topic',
    arguments: [
      {
        name: 'context',
        description: 'Additional context to consider',
        required: false
      },
      {
        name: 'topic',
        description: 'Specific topic to focus on',
        required: false
      }
    ]
  },
  {
    name: 'analyzer',
    description: 'Analyzes provided content with specific instructions',
    arguments: [
      {
        name: 'content',
        description: 'Content to analyze',
        required: true
      },
      {
        name: 'instructions',
        description: 'Specific analysis instructions',
        required: true
      }
    ]
  }
];

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Heartbeat/health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// MCP Status endpoint - provides info about available tools, resources, and prompts
app.get('/status', (req, res) => {
  res.json({
    tools: availableTools.length,
    resources: availableResources.length,
    prompts: availablePrompts.length,
    status: 'operational'
  });
});

// List tools endpoint
app.get('/tools', (req, res) => {
  res.json(availableTools);
});

// List resources endpoint
app.get('/resources', (req, res) => {
  res.json(availableResources.map(r => ({
    uri: r.uri,
    name: r.name,
    description: r.description,
    mimeType: r.mimeType
  })));
});

// Get resource endpoint
app.get('/resources/:name', (req, res) => {
  const resource = availableResources.find(r => r.name === req.params.name);
  if (!resource) {
    return res.status(404).json({ error: 'Resource not found' });
  }
  
  if (resource.mimeType === 'application/json') {
    return res.json(JSON.parse(resource.content));
  }
  
  res.type(resource.mimeType).send(resource.content);
});

// List prompts endpoint
app.get('/prompts', (req, res) => {
  res.json(availablePrompts);
});

// SSE endpoint for streaming responses
app.get('/sse', (req, res) => {
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connection', message: 'Connected to MCP server' })}\n\n`);
  
  // Keep connection alive with periodic pings
  const pingInterval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() })}\n\n`);
  }, 30000);

  // Handle disconnection
  req.on('close', () => {
    clearInterval(pingInterval);
    logger.info('SSE client disconnected');
  });
});

// Handle tool calls via SSE
app.post('/sse/tools/:name', (req, res) => {
  const toolName = req.params.name;
  const tool = availableTools.find(t => t.name === toolName);
  
  if (!tool) {
    return res.status(404).json({ error: `Tool '${toolName}' not found` });
  }
  
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // Start processing
  res.write(`data: ${JSON.stringify({ type: 'status', state: 'processing' })}\n\n`);
  
  // Simulate processing delay
  setTimeout(() => {
    // Send result
    let result;
    if (toolName === 'fetch') {
      result = { type: 'text', text: `Content fetched from ${req.body.url || 'unknown URL'}` };
    } else if (toolName === 'saveFile') {
      result = { type: 'text', text: `Saved ${req.body.content?.length || 0} characters to ${req.body.filename || 'unknown file'}` };
    } else {
      result = { type: 'text', text: 'Tool executed successfully' };
    }
    
    res.write(`data: ${JSON.stringify({ type: 'result', result })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'status', state: 'completed' })}\n\n`);
    res.end();
  }, 1500);
});

// Handle prompt requests via SSE
app.post('/sse/prompts/:name', (req, res) => {
  const promptName = req.params.name;
  const prompt = availablePrompts.find(p => p.name === promptName);
  
  if (!prompt) {
    return res.status(404).json({ error: `Prompt '${promptName}' not found` });
  }
  
  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // Process arguments
  const args = req.body || {};
  
  // Start processing
  res.write(`data: ${JSON.stringify({ type: 'status', state: 'processing' })}\n\n`);
  
  // Simulate processing delay
  setTimeout(() => {
    // Create prompt response
    let messages = [];
    
    if (promptName === 'simple') {
      // Add context if provided
      if (args.context) {
        messages.push({
          role: 'user',
          content: { type: 'text', text: `Here is some relevant context: ${args.context}` }
        });
      }
      
      // Add the main prompt
      let promptText = 'Please help me with ';
      if (args.topic) {
        promptText += `the following topic: ${args.topic}`;
      } else {
        promptText += 'whatever questions I may have.';
      }
      
      messages.push({
        role: 'user',
        content: { type: 'text', text: promptText }
      });
    } else if (promptName === 'analyzer') {
      messages.push({
        role: 'user',
        content: { type: 'text', text: `Please analyze the following content: ${args.content}` }
      });
      
      messages.push({
        role: 'user',
        content: { type: 'text', text: `Instructions: ${args.instructions}` }
      });
    }
    
    // Send prompt messages
    res.write(`data: ${JSON.stringify({ type: 'prompt', messages })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'status', state: 'completed' })}\n\n`);
    res.end();
  }, 1000);
});

// Start server
const PORT = process.env.PORT || 3400;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`MCP Server running at http://0.0.0.0:${PORT}`);
});