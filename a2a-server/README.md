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

Example:

```typescript
import { A2AServer } from './server';
import { demoTaskHandler } from './demo-handler';

// Create server with demo handler
const server = new A2AServer(demoTaskHandler, {
  // Optional configuration
  card: {
    name: "My Agent",
    description: "A custom agent that does amazing things",
    suggestedMessages: ["Hello", "What can you do?"]
  }
});

// Start the server
server.start(3200);
console.log("A2A Server running at http://localhost:3200");
```