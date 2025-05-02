// A2A Server Integration Test
// This test script checks if the /.well-known/agent.json endpoint returns the expected response

import { default as axios } from 'axios';

console.log('Starting A2A server integration test...');

// Define the URL for A2A server
const BASE_URL = 'http://localhost';

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
        
        console.log('✅ A2A server integration test PASSED');
        process.exit(0);
      } else {
        console.error(`FAILED: Missing required properties in agent card: ${missingProps.join(', ')}`);
        process.exit(1);
      }
    } else {
      console.error(`FAILED: Unexpected response status: ${response.status}`);
      process.exit(1);
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
    
    process.exit(1);
  }
}

// Run the test
testWellKnownEndpoint();