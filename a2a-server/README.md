# A2A Server Implementation

This directory contains a TypeScript implementation of an A2A (Agent-to-Agent) server, which follows the [A2A specification](https://github.com/ai-agents/a2a) for agent interoperability.

## Components

The A2A server implementation consists of the following main components:

- **server.ts**: Core server implementation with Express routing
- **schema.ts**: TypeScript types and interfaces for the A2A schema
- **handler.ts**: Handler interface and task context definitions
- **store.ts**: Task storage implementation (in-memory and file-based)
- **error.ts**: Error handling utilities for A2A-specific errors
- **utils.ts**: Helper functions for A2A operations
- **demo-handler.ts**: A simple echo task handler implementation for demonstration
- **simple-server.js**: A JavaScript fallback implementation for testing purposes

## API Endpoints

The A2A server provides the following endpoints:

1. **GET `/.well-known/agent.json`**: Returns the agent card with metadata
2. **POST `/tasks`**: Accepts JSON-RPC requests for task operations:
   - `tasks/send`: Send a message to the agent
   - `tasks/sendSubscribe`: Send a message and subscribe to updates (streaming)
   - `tasks/get`: Get a task by ID
   - `tasks/cancel`: Cancel a running task

## Integration with Proxy

The A2A server is integrated with the main application proxy server:

- The A2A server listens on port 3200 (configurable)
- The proxy server forwards requests from `/.well-known/*` to the A2A server
- The proxy server forwards requests from `/tasks` to the A2A server

## Running Tests

To run integration tests for the A2A server:

```bash
cd tests
node run-tests.js
```

This will run all A2A server integration tests, including:
- Direct connection to the A2A server
- Access through the proxy server

## Implementation Details

### Task Handling

Tasks are implemented using an async generator pattern:

```typescript
export type TaskHandler = (
  context: TaskContext
) => AsyncGenerator<TaskYieldUpdate, schema.Task | void, unknown>;
```

This allows task handlers to yield updates as they progress, while the server manages the task state.

### Storage

Task storage is abstracted through the `TaskStore` interface, with two implementations:

- `InMemoryTaskStore`: Stores tasks and history in-memory
- `FileStore`: Persists tasks and history to disk

### Error Handling

Error handling follows the JSON-RPC error specification, with specific error codes for A2A operations.

## Using the A2A Server

To use the A2A server in your application:

1. Create a task handler implementation
2. Configure the A2A server with your handler
3. Start the server

### Server Setup Example

```typescript
import { A2AServer } from './server';
import { demoTaskHandler } from './demo-handler';

// Create server with demo handler
const server = new A2AServer(demoTaskHandler, {
  // Optional configuration
  card: {
    name: "My Agent",
    description: "A custom agent that does amazing things",
    suggestedMessages: ["Hello", "What can you do?"],
    version: "1.0.0"
  }
});

// Start the server
server.start(3200);
console.log("A2A Server running at http://localhost:3200");
```

### Creating a Custom Task Handler

Here's an example of a custom task handler implementation:

```typescript
import { TaskHandler, TaskContext } from './handler';
import * as schema from './schema';
import { isObject } from './utils';

/**
 * A custom task handler that processes user messages
 */
export const customTaskHandler: TaskHandler = async function* (
  context: TaskContext
): AsyncGenerator<TaskYieldUpdate, schema.Task | void, unknown> {
  // First yield a "working" status to indicate the task is being processed
  yield {
    state: "working",
    message: null
  };
  
  // Extract the user's message
  const userMessage = context.userMessage;
  const userText = userMessage.parts.find(part => part.text)?.text || "";
  
  // Process the message (example: analyze sentiment)
  const analysis = await processSentiment(userText);
  
  // Create a response message
  const responseMessage: schema.Message = {
    role: "agent",
    parts: [
      { 
        text: `I analyzed your message: "${userText}"\nSentiment: ${analysis.sentiment}\nConfidence: ${analysis.confidence}`
      }
    ]
  };
  
  // Yield an artifact with the full analysis results
  yield {
    name: "sentiment-analysis",
    mimeType: "application/json",
    parts: [
      { text: JSON.stringify(analysis, null, 2) }
    ],
    description: "Full sentiment analysis results"
  };
  
  // Finally, yield a "completed" status with the response message
  yield {
    state: "completed",
    message: responseMessage
  };
};

// Example helper function (implementation would vary)
async function processSentiment(text: string) {
  // In a real implementation, this might call an external API
  return {
    sentiment: text.includes("happy") ? "positive" : 
               text.includes("sad") ? "negative" : "neutral",
    confidence: 0.85,
    details: {
      positive_score: 0.7,
      negative_score: 0.1,
      neutral_score: 0.2
    }
  };
}
```

### Example Client Code

Here's how a client might interact with the A2A server:

```javascript
// Example of sending a task to the A2A server
async function sendTask() {
  const response = await fetch('http://localhost:3200/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "client-" + Date.now(),
      method: "tasks/send",
      params: {
        id: "task-" + Date.now(),
        message: {
          role: "user",
          parts: [
            { text: "Analyze this: I'm feeling happy about the progress we're making!" }
          ]
        }
      }
    })
  });
  
  const result = await response.json();
  console.log("Task result:", result);
  
  // Access the agent's response
  const agentMessage = result.result.status.message;
  console.log("Agent response:", agentMessage.parts[0].text);
  
  // Access artifacts if any
  const artifacts = result.result.artifacts;
  if (artifacts && artifacts.length > 0) {
    console.log("Artifacts:", artifacts);
  }
}
```

### Streaming Example

For real-time updates using Server-Sent Events (SSE):

```javascript
function subscribeToTask() {
  const taskId = "task-" + Date.now();
  
  // First create the task
  fetch('http://localhost:3200/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "client-" + Date.now(),
      method: "tasks/sendSubscribe",
      params: {
        id: taskId,
        message: {
          role: "user",
          parts: [
            { text: "Process this request with real-time updates" }
          ]
        }
      }
    })
  });
  
  // Then subscribe to the SSE stream for updates
  const eventSource = new EventSource(`http://localhost:3200/tasks/subscribe?taskId=${taskId}`);
  
  eventSource.addEventListener('status', (event) => {
    const statusUpdate = JSON.parse(event.data);
    console.log("Status update:", statusUpdate);
    
    if (statusUpdate.final) {
      eventSource.close();
    }
  });
  
  eventSource.addEventListener('artifact', (event) => {
    const artifactUpdate = JSON.parse(event.data);
    console.log("Artifact update:", artifactUpdate);
  });
  
  eventSource.onerror = (error) => {
    console.error("SSE error:", error);
    eventSource.close();
  };
}
```