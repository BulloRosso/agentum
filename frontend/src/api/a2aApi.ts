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