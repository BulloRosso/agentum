// Agent Card Route Integration Test
// This test script verifies that the /agent-card path is properly routed to the A2A server

const axios = require('axios');

console.log('Starting Agent Card Route integration test...');

// Define the URLs
const BASE_URL = 'http://localhost';  // Proxy server
const DIRECT_URL = 'http://localhost:3200'; // Direct A2A server

// Test GET request to /agent-card/test
async function testAgentCardGet() {
  console.log('\nTest 1: GET request to /agent-card/test');
  try {
    // First try to access the endpoint through the proxy
    const proxyResponse = await axios.get(`${BASE_URL}/agent-card/test`, {
      validateStatus: () => true // Accept any status code for testing
    });
    
    // Then try to access it directly
    const directResponse = await axios.get(`${DIRECT_URL}/agent-card/test`, {
      validateStatus: () => true // Accept any status code for testing
    });
    
    // Check if both responses have the same status code
    if (proxyResponse.status === directResponse.status) {
      console.log(`SUCCESS: Both responses have the same status code: ${proxyResponse.status}`);
      console.log('This confirms the proxy is correctly forwarding requests to the A2A server');
      return true;
    } else {
      console.error('FAILED: Response status codes differ between proxy and direct access');
      console.error(`Proxy status: ${proxyResponse.status}, Direct status: ${directResponse.status}`);
      return false;
    }
  } catch (error) {
    console.error('ERROR during test:', error.message);
    return false;
  }
}

// Test POST request to /agent-card/data
async function testAgentCardPost() {
  console.log('\nTest 2: POST request to /agent-card/data');
  try {
    const testData = { 
      message: "Test data for agent-card endpoint",
      timestamp: Date.now()
    };
    
    // Send POST through proxy
    const proxyResponse = await axios.post(`${BASE_URL}/agent-card/data`, testData, {
      validateStatus: () => true,
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Send POST directly
    const directResponse = await axios.post(`${DIRECT_URL}/agent-card/data`, testData, {
      validateStatus: () => true,
      headers: { 'Content-Type': 'application/json' }
    });
    
    // Check if both responses have the same status code
    if (proxyResponse.status === directResponse.status) {
      console.log(`SUCCESS: Both responses have the same status code: ${proxyResponse.status}`);
      console.log('This confirms the proxy is correctly forwarding POST requests to the A2A server');
      return true;
    } else {
      console.error('FAILED: Response status codes differ between proxy and direct access');
      console.error(`Proxy status: ${proxyResponse.status}, Direct status: ${directResponse.status}`);
      return false;
    }
  } catch (error) {
    console.error('ERROR during test:', error.message);
    return false;
  }
}

// Run the tests
async function runTests() {
  const getResult = await testAgentCardGet();
  const postResult = await testAgentCardPost();
  
  if (getResult && postResult) {
    console.log('\n✅ All Agent Card route tests PASSED!');
    console.log('The /agent-card/* route is correctly forwarded to the A2A server.');
    process.exit(0);
  } else {
    console.error('\n❌ Some Agent Card route tests FAILED.');
    console.error('Please check the proxy server configuration and A2A server logs.');
    process.exit(1);
  }
}

// Start the tests
runTests();