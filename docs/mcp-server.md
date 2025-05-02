# MCP Server Documentation

## Overview

The Media Control Protocol (MCP) Server is a Python-based FastAPI implementation that provides a standardized interface for agents to access tools, resources, and prompts. It replaces the previous Node.js implementation while maintaining the same API structure.

## Key Features

- **Tools API**: Provides access to functionality like fetching web content and saving files
- **Resources API**: Offers access to static resources like text files and configuration
- **Prompts API**: Delivers prompt templates with customizable arguments
- **Server-Sent Events (SSE)**: Supports real-time updates and streaming responses
- **Dual Path Structure**: Maintains compatibility with both `/endpoint` and `/sse/endpoint` paths

## Technical Specifications

- **Language**: Python 3.11+
- **Framework**: FastAPI 0.109.0
- **ASGI Server**: Uvicorn 0.27.0
- **Port**: 3400
- **Host**: 0.0.0.0 (accessible from any network interface)

## Dependencies

The MCP Server requires the following Python packages:

```
fastapi==0.109.0
uvicorn==0.27.0
pydantic==2.5.3
httpx==0.24.1
anyio==3.7.1
click==8.1.7
```

## API Endpoints

### Health Check

- **GET `/health`**
  - Returns server health status, uptime, and version
  - Response: `{"status": "operational", "uptime": 12.34, "version": "1.0.0"}`

### Status

- **GET `/status`** or **GET `/sse/status`**
  - Returns counts of available tools, resources, and prompts
  - Response: `{"tools": 2, "resources": 3, "prompts": 2, "status": "operational"}`

### Tools

- **GET `/tools`** or **GET `/sse/tools`**
  - Lists all available tools with their schemas
  - Response: Array of tool objects

- **POST `/tools/{name}`** or **POST `/sse/tools/{name}`**
  - Executes a specific tool with the provided arguments
  - Request: JSON object with tool arguments
  - Response: Array of result objects

### Resources

- **GET `/resources`** or **GET `/sse/resources`**
  - Lists all available resources (without their content)
  - Response: Array of resource metadata objects

- **GET `/resources/{name}`** or **GET `/sse/resources/{name}`**
  - Returns the content of a specific resource
  - Response: The resource content with appropriate Content-Type

### Prompts

- **GET `/prompts`** or **GET `/sse/prompts`**
  - Lists all available prompt templates
  - Response: Array of prompt template objects

- **POST `/prompts/{name}`** or **POST `/sse/prompts/{name}`**
  - Creates a prompt with the provided arguments
  - Request: JSON object with prompt arguments
  - Response: Array of message objects

### Server-Sent Events

- **GET `/sse`**
  - Establishes a persistent SSE connection for real-time updates
  - Events:
    - `connection`: Initial connection message
    - `ping`: Periodic heartbeat message (every 30 seconds)

## Sample Tools

The server provides the following example tools:

1. **fetch**
   - Description: Fetches a website and returns its content
   - Required parameters: `url` (string)
   
2. **saveFile**
   - Description: Saves content to a file
   - Required parameters: `filename` (string), `content` (string)

## Sample Resources

The server provides the following example resources:

1. **greeting**
   - URI: `file:///greeting.txt`
   - MIME Type: `text/plain`
   - Description: A welcome message

2. **help**
   - URI: `file:///help.txt`
   - MIME Type: `text/plain`
   - Description: Help information

3. **config**
   - URI: `file:///config.json`
   - MIME Type: `application/json`
   - Description: Configuration settings

## Sample Prompts

The server provides the following example prompt templates:

1. **simple**
   - Description: A simple prompt template with optional context and topic
   - Arguments:
     - `context` (optional): Additional context to consider
     - `topic` (optional): Specific topic to focus on

2. **analyzer**
   - Description: Analyzes provided content with specific instructions
   - Arguments:
     - `content` (required): Content to analyze
     - `instructions` (required): Specific analysis instructions

## Running the Server

To run the MCP server:

```bash
cd mcp-server
pip install -r requirements.txt
python mcp_server.py
```

Custom options:
- `--port`: Specify a custom port (default: 3400)
- `--host`: Specify a custom host (default: 0.0.0.0)

## Integration with Frontend

The MCP Server integrates with the frontend through the `MCPStatusCard` component, which displays:
- Server operational status
- Available tools count
- Available resources count
- Available prompts count
- Collapsible sections for viewing details

## Integration with Proxy Server

The proxy server forwards requests to the MCP Server:
- Requests to `/sse/*` are routed to the MCP Server
- This allows the frontend to communicate with the MCP Server through a single domain

## Error Handling

The MCP Server provides meaningful error responses:
- 404 Not Found: When a requested resource/tool/prompt does not exist
- 400 Bad Request: When required parameters are missing
- 500 Internal Server Error: For unexpected server issues

## Security Considerations

- CORS is enabled for all origins (`*`)
- No authentication is currently implemented (for demonstration purposes)
- Consider adding authentication for production use

## Future Enhancements

Potential improvements to consider:
- Add authentication and authorization
- Implement more sophisticated tools with actual functionality
- Provide webhooks for push notifications
- Add metrics and monitoring
- Implement rate limiting