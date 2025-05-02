# Multi-Component System with A2A and MCP Server Integration

This project is a scalable, multi-component system built with modern web technologies.

## Architecture Overview

The system consists of several decoupled components that work together:

1. **Frontend**: React/TypeScript application with Material-UI, built using Vite
2. **Backend API**: Python/FastAPI service providing API endpoints
3. **Proxy Server**: Node.js proxy that routes requests to the appropriate services
4. **A2A Server**: Agent-to-Agent server implementation following the Google A2A protocol
5. **MCP Server**: Anthropic Model Context Protocol server providing tools, resources, and prompts

![Architecture Diagram](./docs/architecture-diagram.svg)

## Components

### Frontend

- Modern React application with TypeScript
- Material-UI for component styling
- State management with Zustand
- Responsive dashboard UI
- Client implementations for both A2A and MCP protocols

### Backend API

- FastAPI (Python) backend
- Health check endpoints
- API documentation with Redoc at `/api/doc`
- API methods listing at `/api/api/v1/methods`

### Proxy Server

- Node.js-based reverse proxy
- Routes requests to appropriate services:
  - Frontend requests → Vite development server
  - API requests → FastAPI backend
  - A2A requests → A2A server
  - MCP/SSE requests → MCP server
- WebSocket support for real-time communication

### A2A Server

- Implementation of the [Google A2A protocol](https://github.com/ai-agents/a2a)
- Enables agent-to-agent communication
- Provides task management and messaging capabilities
- Supports both direct requests and streaming updates

### MCP Server (Python)

- Python/FastAPI implementation of the Anthropic Model Context Protocol
- Provides tools, resources, and prompts for agents
- Supports Server-Sent Events (SSE) for real-time updates
- Dual path structure (`/endpoint` and `/sse/endpoint`)

## Server Integrations

### A2A Server Integration

The A2A server is integrated with the main application via the proxy server. Requests to the following endpoints are routed to the A2A server:

- `/.well-known/agent.json`: Agent information and capabilities
- `/tasks`: Task management endpoint for JSON-RPC requests
- `/agent-card/*`: All requests to this path (any HTTP method) are routed to the A2A server

See the [A2A server documentation](./a2a-server/README.md) for more details on implementation and usage.

### MCP Server Integration

The MCP (Anthropic Model Context Protocol) server is integrated with the main application via the proxy server. Requests to the following endpoints are routed to the MCP server:

- `/sse/*`: All SSE endpoints (status, tools, resources, prompts)
- `/sse`: The SSE event stream endpoint

The MCP server provides:
- Tools API: Functions that can be called to perform actions
- Resources API: Static files and data that can be downloaded
- Prompts API: Templates for generating LLM prompts
- Server-Sent Events (SSE): Real-time updates and streaming

See the [MCP server documentation](./docs/mcp-server.md) and [MCP client documentation](./docs/mcp-client.md) for more details.

## Development

### Prerequisites

- Node.js 20+
- Python 3.11+
- npm or yarn

### Running the Application

The application is divided into multiple services, each running in its own process:

1. **API Backend**:
   ```
   cd api
   pip install -r requirements.txt
   python main.py
   ```

2. **Frontend Development Server**:
   ```
   cd frontend
   npm install
   npm run dev
   ```

3. **Proxy Server**:
   ```
   node proxy-server.js
   ```

4. **A2A Server**:
   ```
   cd a2a-server
   node simple-server.js  # JavaScript implementation
   # or for TypeScript implementation (if compiled)
   # node dist/main.js
   ```

5. **MCP Server**:
   ```
   cd mcp-server
   pip install -r requirements.txt
   python mcp_server.py
   ```

### Running Tests

Integration tests are available for the A2A server:

```
cd tests
node run-tests.js  # Runs all A2A server tests
```

## API Endpoints

### Backend API

- `GET /health`: Health check endpoint
- `GET /api/v1/methods`: List of available API methods
- `GET /api/doc`: API documentation (Redoc)

### A2A Server

- `GET /.well-known/agent.json`: Agent card information
- `POST /tasks`: JSON-RPC endpoint for task operations:
  - `tasks/send`: Send a message to the agent
  - `tasks/sendSubscribe`: Send a message with streaming updates
  - `tasks/get`: Get task information by ID
  - `tasks/cancel`: Cancel a running task

### MCP Server

- `GET /status` or `GET /sse/status`: Server status and available resources
- `GET /tools` or `GET /sse/tools`: List of available tools
- `POST /tools/{name}` or `POST /sse/tools/{name}`: Execute a tool
- `GET /resources` or `GET /sse/resources`: List of available resources
- `GET /resources/{name}` or `GET /sse/resources/{name}`: Get a specific resource
- `GET /prompts` or `GET /sse/prompts`: List of available prompt templates
- `POST /prompts/{name}` or `POST /sse/prompts/{name}`: Generate a prompt
- `GET /sse`: Server-Sent Events (SSE) connection for real-time updates