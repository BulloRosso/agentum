import axios from 'axios';

export interface AgentCard {
  name: string;
  description: string;
  version?: string;
  suggestedMessages?: string[];
  capabilities?: string[];
  instructions?: string;
}

/**
 * Fetches the A2A server status by getting the agent card
 * from the well-known endpoint
 */
export const fetchA2AStatus = async (): Promise<AgentCard> => {
  try {
    const response = await axios.get('/.well-known/agent.json');
    return response.data;
  } catch (error) {
    console.error('Error fetching A2A server status:', error);
    throw error;
  }
};

/**
 * Fetches the list of available agents
 * This is a placeholder that returns just the main agent for now
 * In the future, this could fetch from a registry of multiple agents
 */
export const fetchAgents = async (): Promise<AgentCard[]> => {
  try {
    const mainAgent = await fetchA2AStatus();
    return [mainAgent];
  } catch (error) {
    console.error('Error fetching agents:', error);
    throw error;
  }
};