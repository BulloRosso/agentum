// A simple Express server that implements the A2A protocol for testing
// This JavaScript implementation bypasses the TypeScript compilation issues

const express = require('express');
const cors = require('cors');

// Create the Express app
const app = express();

// Enable CORS
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Define agent card
const agentCard = {
  name: "Echo Agent",
  description: "A simple demo agent that echoes back what you say to it.",
  suggestedMessages: [
    "Hello, can you echo this?",
    "What time is it?",
    "Tell me a joke!"
  ],
  version: "1.0.0"
};

// Implement /.well-known/agent.json endpoint
app.get('/.well-known/agent.json', (req, res) => {
  res.json(agentCard);
});

// Keep track of tasks
const tasks = new Map();

// Implements the /tasks endpoint for JSON-RPC requests
app.post('/tasks', async (req, res) => {
  const requestBody = req.body;
  
  // Validate JSON-RPC request
  if (!requestBody.jsonrpc || requestBody.jsonrpc !== '2.0' || !requestBody.method) {
    return res.json({
      jsonrpc: '2.0',
      id: requestBody.id || null,
      error: {
        code: -32600,
        message: 'Invalid JSON-RPC request'
      }
    });
  }
  
  // Handle methods
  switch (requestBody.method) {
    case 'tasks/send':
      return handleTaskSend(requestBody, res);
    
    case 'tasks/get':
      return handleTaskGet(requestBody, res);
      
    default:
      return res.json({
        jsonrpc: '2.0',
        id: requestBody.id || null,
        error: {
          code: -32601,
          message: `Method ${requestBody.method} not found`
        }
      });
  }
});

// Handle tasks/send method
async function handleTaskSend(request, res) {
  const params = request.params;
  
  // Validate params
  if (!params || !params.id || !params.message) {
    return res.json({
      jsonrpc: '2.0',
      id: request.id || null,
      error: {
        code: -32602,
        message: 'Invalid params'
      }
    });
  }
  
  const taskId = params.id;
  const userMessage = params.message;
  
  // Create a task if it doesn't exist
  if (!tasks.has(taskId)) {
    tasks.set(taskId, {
      id: taskId,
      status: {
        state: 'submitted',
        timestamp: new Date().toISOString(),
        message: null
      },
      artifacts: []
    });
  }
  
  // Get the task
  const task = tasks.get(taskId);
  
  // Update the task
  task.status = {
    state: 'completed',
    timestamp: new Date().toISOString(),
    message: {
      role: 'agent',
      parts: [
        { text: `I received your message: "${userMessage.parts.map(p => p.text || '').join(' ')}"` }
      ]
    }
  };
  
  // Add an artifact
  task.artifacts = [
    {
      name: 'echo.txt',
      mimeType: 'text/plain',
      parts: [
        { text: `You said: ${userMessage.parts.map(p => p.text || '').join(' ')}` }
      ]
    }
  ];
  
  // Save the updated task
  tasks.set(taskId, task);
  
  // Return the task
  res.json({
    jsonrpc: '2.0',
    id: request.id,
    result: task
  });
}

// Handle tasks/get method
function handleTaskGet(request, res) {
  const params = request.params;
  
  // Validate params
  if (!params || !params.id) {
    return res.json({
      jsonrpc: '2.0',
      id: request.id || null,
      error: {
        code: -32602,
        message: 'Missing task ID'
      }
    });
  }
  
  const taskId = params.id;
  
  // Check if task exists
  if (!tasks.has(taskId)) {
    return res.json({
      jsonrpc: '2.0',
      id: request.id || null,
      error: {
        code: -32000,
        message: `Task ${taskId} not found`
      }
    });
  }
  
  // Return the task
  res.json({
    jsonrpc: '2.0',
    id: request.id,
    result: tasks.get(taskId)
  });
}

// Start the server
const PORT = 3200;
app.listen(PORT, () => {
  console.log(`A2A Server running at http://localhost:${PORT}`);
  console.log('API Endpoints:');
  console.log(`- GET  /.well-known/agent.json`);
  console.log(`- POST /tasks`);
});