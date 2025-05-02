// A2A Server Integration Test
// This test script checks if the /.well-known/agent.json endpoint returns the expected response

const axios = require('axios');

console.log('Starting A2A server integration test...');

// Define the URL for direct A2A server access
const BASE_URL = 'http://localhost:3200';

// Log the steps for better debugging
console.log(`Step 1: Testing /.well-known/agent.json endpoint at ${BASE_URL}/.well-known/agent.json`);

// Function to make the request and handle results
async function testWellKnownEndpoint() {
  try {
    // Make a GET request to the well-known endpoint
    const response = await axios.get(`${BASE_URL}/.well-known/agent.json`);
    
    // Check if the response contains the expected data
    if (response.status === 200) {
      console.log('SUCCESS: /.well-known/agent.json endpoint returned status 200');
      
      // Check if the response has the required properties
      const requiredProps = ['name', 'description'];
      const missingProps = requiredProps.filter(prop => !response.data[prop]);
      
      if (missingProps.length === 0) {
        console.log('PASSED: Agent card has all required properties');
        console.log('Agent name:', response.data.name);
        console.log('Agent description:', response.data.description);
        
        // Optional properties
        if (response.data.suggestedMessages && Array.isArray(response.data.suggestedMessages)) {
          console.log(`FOUND: ${response.data.suggestedMessages.length} suggested messages`);
        }
        
        if (response.data.version) {
          console.log('FOUND: Agent version:', response.data.version);
        }
        
        console.log('✅ A2A server well-known endpoint test PASSED');
        return true;
      } else {
        console.error(`FAILED: Missing required properties in agent card: ${missingProps.join(', ')}`);
        return false;
      }
    } else {
      console.error(`FAILED: Unexpected response status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('ERROR during A2A server test:');
    
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Response data:`, error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('  No response received from server. Is the A2A server running on port 3200?');
      console.error('  Make sure to start the A2A server before running this test.');
    } else {
      // Something happened in setting up the request
      console.error(`  Error message: ${error.message}`);
    }
    
    return false;
  }
}

// Test for the /tasks endpoint
async function testTasksEndpoint() {
  console.log(`\nStep 2: Testing /tasks endpoint at ${BASE_URL}/tasks`);
  
  try {
    // Create a JSON-RPC request for tasks/send
    const taskRequest = {
      jsonrpc: "2.0",
      id: "test-" + Date.now(),
      method: "tasks/send",
      params: {
        id: "task-" + Date.now(),
        message: {
          role: "user",
          parts: [
            { text: "Hello from the integration test!" }
          ]
        }
      }
    };
    
    // Send the request to the /tasks endpoint
    const response = await axios.post(`${BASE_URL}/tasks`, taskRequest);
    
    // Check the response
    if (response.status === 200 && response.data.result) {
      console.log('SUCCESS: /tasks endpoint processed the request');
      console.log('Task ID:', response.data.result.id);
      console.log('Task Status:', response.data.result.status.state);
      
      if (response.data.result.status.message && 
          response.data.result.status.message.role === 'agent') {
        console.log('RECEIVED: Agent response message');
        console.log('Message:', response.data.result.status.message.parts[0].text);
      }
      
      if (response.data.result.artifacts && response.data.result.artifacts.length > 0) {
        console.log('FOUND:', response.data.result.artifacts.length, 'artifacts');
      }
      
      console.log('✅ Tasks endpoint test PASSED');
      return true;
    } else {
      console.error('FAILED: Unexpected response from /tasks endpoint');
      console.error('Response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('ERROR during tasks endpoint test:');
    
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Response data:`, error.response.data);
    } else if (error.request) {
      console.error('  No response received from server');
    } else {
      console.error(`  Error message: ${error.message}`);
    }
    
    return false;
  }
}

// Run the tests sequentially
async function runTests() {
  // First test the well-known endpoint
  const wellKnownResult = await testWellKnownEndpoint();
  
  if (wellKnownResult !== false) {
    // If the first test passed or was inconclusive, try the tasks endpoint
    const tasksResult = await testTasksEndpoint();
    
    // Exit with success if both tests passed, failure otherwise
    process.exit(tasksResult ? 0 : 1);
  }
}

runTests();