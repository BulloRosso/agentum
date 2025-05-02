import axios from 'axios';
import { AgentCard, Task, TaskState, MessagePart, MessageTextPart } from '../utils/A2ASchema';

// Re-export the types
export type { AgentCard, Task, TaskState, MessagePart, MessageTextPart };

/**
 * Fetches the agent card from the A2A server
 */
export const fetchAgentCard = async (): Promise<AgentCard> => {
  try {
    const response = await axios.get('/.well-known/agent.json');
    return response.data;
  } catch (error) {
    console.error('Error fetching agent card:', error);
    throw error;
  }
};

/**
 * Fetches the agent status from the A2A server
 */
export const fetchA2AStatus = async (): Promise<{
  status: 'operational' | 'degraded' | 'down';
  agents: AgentCard[];
}> => {
  try {
    const response = await axios.get('/.well-known/agent.json');
    return {
      status: 'operational',
      agents: [response.data]
    };
  } catch (error) {
    console.error('Error fetching A2A status:', error);
    return {
      status: 'down',
      agents: []
    };
  }
};

/**
 * Tests an agent by sending a message and returning the response
 */
export const testAgent = async (message: string): Promise<Task> => {
  try {
    // Create a unique task ID
    const taskId = `task-${Date.now()}`;
    
    // Create the message object
    const messageObj = {
      role: 'user',
      parts: [{ text: message }]
    };
    
    // Send the task to the A2A server
    const response = await axios.post('/tasks', {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tasks/send',
      params: {
        id: taskId,
        message: messageObj
      }
    });
    
    // Check for JSON-RPC error
    if (response.data.error) {
      throw new Error(`RPC Error: ${response.data.error.message}`);
    }
    
    return response.data.result;
  } catch (error) {
    console.error('Error testing agent:', error);
    throw error;
  }
};