# MCP Client Documentation

## Overview

The Media Control Protocol (MCP) Client is a TypeScript implementation that provides a client-side interface for interacting with the MCP Server. It allows frontend applications to access tools, resources, and prompts from the MCP Server.

## Key Components

The project contains two MCP client implementations:

1. **MCP API Module** (`frontend/src/api/mcpApi.ts`): 
   - A collection of individual API functions
   - Used by the MCP store for state management

2. **MCP Client Class** (`frontend/src/utils/mcp-client.ts`): 
   - A class-based implementation
   - Provides a more object-oriented approach

## Type Definitions

Both implementations share similar type definitions:

### MCPStatus

```typescript
export interface MCPStatus {
  tools: number;
  resources: number;
  prompts: number;
  status: string;
}
```

### MCPTool

```typescript
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    required: string[];
    properties: Record<string, {
      type: string;
      description: string;
    }>;
  };
}
```

### MCPResource

```typescript
export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}
```

### MCPPrompt

```typescript
export interface MCPPrompt {
  name: string;
  description: string;
  arguments: {
    name: string;
    description: string;
    required: boolean;
  }[];
}
```

## MCP API Functions

The `mcpApi.ts` module provides individual functions for interacting with the MCP Server:

### Status

```typescript
export const fetchMCPStatus = async (): Promise<MCPStatus> => {
  try {
    const response = await axios.get('/sse/status');
    return response.data;
  } catch (error) {
    console.error('Error fetching MCP status:', error);
    // Return default status to prevent UI errors
    return {
      tools: 0,
      resources: 0,
      prompts: 0,
      status: 'offline'
    };
  }
};
```

### Tools

```typescript
export const fetchMCPTools = async (): Promise<MCPTool[]> => {
  try {
    const response = await axios.get('/sse/tools');
    return response.data;
  } catch (error) {
    console.error('Error fetching MCP tools:', error);
    return [];
  }
};
```

### Resources

```typescript
export const fetchMCPResources = async (): Promise<MCPResource[]> => {
  try {
    const response = await axios.get('/sse/resources');
    return response.data;
  } catch (error) {
    console.error('Error fetching MCP resources:', error);
    return [];
  }
};
```

### Prompts

```typescript
export const fetchMCPPrompts = async (): Promise<MCPPrompt[]> => {
  try {
    const response = await axios.get('/sse/prompts');
    return response.data;
  } catch (error) {
    console.error('Error fetching MCP prompts:', error);
    return [];
  }
};
```

## MCP Client Class

The `MCPClient` class in `mcp-client.ts` provides an object-oriented approach:

```typescript
export class MCPClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/sse') {
    this.baseUrl = baseUrl;
  }

  // Methods for interacting with the MCP server
  async getStatus(): Promise<MCPStatus> { /* ... */ }
  async listTools(): Promise<MCPTool[]> { /* ... */ }
  async listResources(): Promise<MCPResource[]> { /* ... */ }
  async listPrompts(): Promise<MCPPrompt[]> { /* ... */ }
  async downloadResource(resourceName: string): Promise<Blob> { /* ... */ }
}

// Export singleton instance
export const mcpClient = new MCPClient();
export default mcpClient;
```

## State Management with Zustand

The MCP client interacts with a Zustand store (`frontend/src/store/mcpStore.ts`) for state management:

```typescript
export const useMCPStore = create<MCPState>((set, get) => ({
  status: null,
  tools: [],
  resources: [],
  prompts: [],
  isLoading: false,
  error: null,

  fetchStatus: async () => { /* ... */ },
  fetchTools: async () => { /* ... */ },
  fetchResources: async () => { /* ... */ },
  fetchPrompts: async () => { /* ... */ },
  fetchAll: async () => { /* ... */ }
}));
```

## Integration with UI Components

The MCP client interfaces with the UI through several components:

### MCPStatusCard

Displays the status of the MCP server, including:
- Operational status
- Tool count
- Resource count
- Prompt count
- Expandable sections for details

### MCPToolsSection

Allows users to:
- View available tools
- See tool descriptions and parameters
- Execute tools with parameters

### MCPResourcesSection

Provides:
- List of available resources
- Resource descriptions
- Download functionality

### MCPPromptsSection

Enables:
- Browsing available prompt templates
- Viewing prompt parameters
- Generating prompts with custom arguments

## Server-Sent Events (SSE)

The MCP client can establish a persistent SSE connection for real-time updates:

```typescript
export class MCPEventListener {
  private eventSource: EventSource | null = null;
  
  connect() {
    this.eventSource = new EventSource('/sse');
    
    this.eventSource.onopen = () => {
      console.log('SSE connection established');
    };
    
    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('SSE event received:', data);
    };
    
    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      this.disconnect();
    };
  }
  
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
```

## Error Handling

The MCP client includes comprehensive error handling:

- API errors are logged to the console
- Default values are returned to prevent UI crashes
- Error states are stored in the Zustand store
- UI components can display appropriate error messages

## Usage Examples

### Basic Usage

```typescript
import { mcpClient } from '../utils/mcp-client';

// Get MCP server status
const status = await mcpClient.getStatus();

// List available tools
const tools = await mcpClient.listTools();

// List available resources
const resources = await mcpClient.listResources();

// List available prompts
const prompts = await mcpClient.listPrompts();

// Download a resource
const blob = await mcpClient.downloadResource('greeting');
```

### With Zustand Store

```typescript
import { useMCPStore } from '../store/mcpStore';

// In a React component
const { status, tools, resources, prompts, fetchAll } = useMCPStore();

// Load all MCP data
useEffect(() => {
  fetchAll();
}, [fetchAll]);

// Render data in the UI
return (
  <div>
    <div>MCP Status: {status?.status}</div>
    <div>Tools: {status?.tools}</div>
    <div>Resources: {status?.resources}</div>
    <div>Prompts: {status?.prompts}</div>
  </div>
);
```

## Future Enhancements

Potential improvements to consider:

- Add authentication and authorization support
- Implement retry logic for failed requests
- Add support for streaming responses
- Improve event handling for SSE events
- Implement caching for frequently used resources and tools