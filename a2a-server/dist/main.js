"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_js_1 = require("./server.js");
const demo_handler_js_1 = require("./demo-handler.js");
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
// Create and start the server
const server = new server_js_1.A2AServer(demo_handler_js_1.demoTaskHandler, {
    card: agentCard
});
const PORT = 3200;
server.start(PORT);
console.log(`A2A Server running at http://localhost:${PORT}`);
console.log('API Endpoints:');
console.log(`- GET  /.well-known/agent.json`);
console.log(`- POST /tasks`);
console.log('Example curl command:');
console.log(`curl -X POST http://localhost:${PORT}/tasks \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tasks/send",
    "id": "request-1",
    "params": {
      "id": "task-123",
      "message": {
        "role": "user",
        "parts": [{"text": "Hello, A2A server!"}]
      }
    }
  }'`);
