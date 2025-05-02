import axios from 'axios';

interface HealthResponse {
  status: string;
  uptime: number;
  version: string;
}

interface MethodParameter {
  name: string;
  in: string;
  required: boolean;
  description: string;
}

export interface APIMethod {
  path: string;
  method: string;
  summary: string;
  description: string;
  operationId: string;
  tags: string[];
  parameters: MethodParameter[];
}

interface APIMethodsResponse {
  methods: APIMethod[];
}

/**
 * Fetches the health status from the API
 */
export const fetchHealthStatus = async (): Promise<HealthResponse> => {
  try {
    console.log('Fetching health status from API...');
    // Use the proxy endpoint that's proven to work
    const response = await axios.get<HealthResponse>('/api/v1/health', {
      timeout: 5000, // 5 second timeout
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    console.log('Health status response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching health status:', error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response received from server. API might be down.');
      } else {
        // Something happened in setting up the request
        throw new Error(`Error: ${error.message}`);
      }
    }
    throw new Error('Unknown error occurred while fetching health status');
  }
};

/**
 * Fetches the available API methods from the API
 */
export const fetchApiMethods = async (): Promise<APIMethod[]> => {
  try {
    console.log('Fetching API methods...');
    const response = await axios.get<APIMethodsResponse>('/api/api/methods', {
      timeout: 5000, // 5 second timeout
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    console.log('API methods response:', response.data);
    return response.data.methods;
  } catch (error) {
    console.error('Error fetching API methods:', error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        throw new Error('No response received from server. API might be down.');
      } else {
        throw new Error(`Error: ${error.message}`);
      }
    }
    throw new Error('Unknown error occurred while fetching API methods');
  }
};
