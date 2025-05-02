import axios from 'axios';

// Define types based on the MCP specification
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

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface MCPPromptArgument {
  name: string;
  description: string;
  required: boolean;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments: MCPPromptArgument[];
}

export interface MCPStatus {
  tools: number;
  resources: number;
  prompts: number;
  status: string;
}

export interface MCPToolArguments {
  [key: string]: any;
}

export interface MCPPromptArguments {
  [key: string]: any;
}

export type MCPToolResult = Array<{
  type: string;
  text?: string;
  url?: string;
  uri?: string;
  alt?: string;
}>;

export type MCPPromptResult = Array<{
  role: string;
  content: {
    type: string;
    text: string;
  };
}>;

/**
 * MCP Client for interacting with the Model Context Protocol server
 */
export class MCPClient {
  private baseUrl: string;

  /**
   * Create a new MCP client instance
   * @param baseUrl Base URL for the MCP server
   */
  constructor(baseUrl: string = '/sse') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get server status
   */
  async getStatus(): Promise<MCPStatus> {
    try {
      const response = await axios.get(`${this.baseUrl}/status`);
      return response.data;
    } catch (error) {
      console.error('Error fetching MCP status:', error);
      throw error;
    }
  }

  /**
   * List available tools
   */
  async listTools(): Promise<MCPTool[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/tools`);
      return response.data;
    } catch (error) {
      console.error('Error fetching MCP tools:', error);
      throw error;
    }
  }

  /**
   * List available resources
   */
  async listResources(): Promise<MCPResource[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/resources`);
      return response.data;
    } catch (error) {
      console.error('Error fetching MCP resources:', error);
      throw error;
    }
  }

  /**
   * List available prompts
   */
  async listPrompts(): Promise<MCPPrompt[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/prompts`);
      return response.data;
    } catch (error) {
      console.error('Error fetching MCP prompts:', error);
      throw error;
    }
  }

  /**
   * Call a tool with arguments
   * @param toolName Name of the tool to call
   * @param arguments Arguments for the tool
   */
  async callTool(toolName: string, args: MCPToolArguments): Promise<MCPToolResult> {
    try {
      const response = await axios.post(`${this.baseUrl}/tools/${toolName}`, args);
      return response.data;
    } catch (error) {
      console.error(`Error calling MCP tool ${toolName}:`, error);
      throw error;
    }
  }

  /**
   * Get a resource by name
   * @param resourceName Name of the resource to get
   * @param raw If true, return the raw resource content instead of parsing as JSON
   */
  async getResource(resourceName: string, raw: boolean = false): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/resources/${resourceName}`, {
        responseType: raw ? 'blob' : 'json'
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching MCP resource ${resourceName}:`, error);
      throw error;
    }
  }

  /**
   * Get a prompt with arguments
   * @param promptName Name of the prompt to get
   * @param arguments Arguments for the prompt
   * @param responseType Optional response type (defaults to 'json')
   */
  async getPrompt(
    promptName: string, 
    args: MCPPromptArguments, 
    responseType: 'json' | 'text' = 'json'
  ): Promise<MCPPromptResult | string> {
    try {
      const response = await axios.post(`${this.baseUrl}/prompts/${promptName}`, args, {
        responseType: responseType === 'text' ? 'text' : 'json',
        transformResponse: responseType === 'text' ? [(data) => data] : undefined
      });
      return response.data;
    } catch (error) {
      console.error(`Error getting MCP prompt ${promptName}:`, error);
      throw error;
    }
  }

  /**
   * Download a resource as a blob
   * @param resourceName Name of the resource to download
   */
  async downloadResource(resourceName: string): Promise<Blob> {
    try {
      const response = await axios.get(`${this.baseUrl}/resources/${resourceName}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error(`Error downloading MCP resource ${resourceName}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const mcpClient = new MCPClient();
export default mcpClient;