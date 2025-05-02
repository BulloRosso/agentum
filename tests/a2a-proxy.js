// A2A Server Integration Test via Proxy
// This test script verifies that the A2A endpoints are correctly accessible through the proxy

const axios = require('axios');

console.log('Starting A2A server proxy integration test...');

// Define the URL for the Replit WebView (proxy-server)
const BASE_URL = 'http://localhost';

// Test the agent.json endpoint via proxy
async function testWellKnownProxy() {
  console.log(`\nStep 1: Testing /.well-known/agent.json endpoint via proxy at ${BASE_URL}/.well-known/agent.json`);
  
  try {
    const response = await axios.get(`${BASE_URL}/.well-known/agent.json`);
    
    if (response.status === 200) {
      console.log('SUCCESS: /.well-known/agent.json endpoint returned status 200 via proxy');
      
      // Verify response data
      const requiredProps = ['name', 'description'];
      const missingProps = requiredProps.filter(prop => !response.data[prop]);
      
      if (missingProps.length === 0) {
        console.log('PASSED: Agent card has all required properties');
        console.log('Agent name:', response.data.name);
        console.log('Agent description:', response.data.description);
        
        if (response.data.suggestedMessages && Array.isArray(response.data.suggestedMessages)) {
          console.log(`FOUND: ${response.data.suggestedMessages.length} suggested messages`);
        }
        
        console.log('✅ Proxy to A2A well-known endpoint test PASSED');
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
    console.error('ERROR during proxy test:');
    
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

// Test the tasks endpoint via proxy
async function testTasksProxy() {
  console.log(`\nStep 2: Testing /tasks endpoint via proxy at ${BASE_URL}/tasks`);
  
  try {
    // Create a task request
    const taskRequest = {
      jsonrpc: "2.0",
      id: "proxy-test-" + Date.now(),
      method: "tasks/send",
      params: {
        id: "proxy-task-" + Date.now(),
        message: {
          role: "user",
          parts: [
            { text: "Hello from the proxy integration test!" }
          ]
        }
      }
    };
    
    // Send the request via proxy
    const response = await axios.post(`${BASE_URL}/tasks`, taskRequest);
    
    if (response.status === 200 && response.data.result) {
      console.log('SUCCESS: /tasks endpoint processed the request via proxy');
      console.log('Task ID:', response.data.result.id);
      console.log('Task Status:', response.data.result.status.state);
      
      if (response.data.result.status.message && 
          response.data.result.status.message.role === 'agent') {
        console.log('RECEIVED: Agent response message');
        console.log('Message:', response.data.result.status.message.parts[0].text);
      }
      
      console.log('✅ Proxy to A2A tasks endpoint test PASSED');
      return true;
    } else {
      console.error('FAILED: Unexpected response from /tasks endpoint via proxy');
      console.error('Response:', response.data);
      return false;
    }
  } catch (error) {
    console.error('ERROR during tasks proxy test:');
    
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

// Run the tests
async function runTests() {
  // First test the well-known endpoint via proxy
  const wellKnownResult = await testWellKnownProxy();
  
  if (wellKnownResult) {
    // If the first test passed, try the tasks endpoint
    const tasksResult = await testTasksProxy();
    
    // Overall result
    if (tasksResult) {
      console.log('\n✅ ALL PROXY TESTS PASSED! A2A server is properly accessible via proxy.');
      process.exit(0);
    } else {
      console.error('\n❌ Proxy to tasks endpoint test failed.');
      process.exit(1);
    }
  } else {
    console.error('\n❌ Proxy to well-known endpoint test failed.');
    process.exit(1);
  }
}

// Start the tests
runTests();