// Test runner script
// Runs all integration tests for the A2A server, both direct and via proxy

const { spawn } = require('child_process');
const path = require('path');

console.log('==========================================');
console.log('Starting A2A Server Integration Tests');
console.log('==========================================\n');

// Function to run a test script and handle its output
function runTest(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n[TEST RUNNER] Running test: ${scriptName}`);
    console.log('------------------------------------------');
    
    const testProcess = spawn('node', [path.join(__dirname, scriptName)], { 
      stdio: ['ignore', 'pipe', 'pipe'] 
    });
    
    // Collect stdout
    let output = '';
    testProcess.stdout.on('data', (data) => {
      const dataStr = data.toString();
      console.log(dataStr.trim());
      output += dataStr;
    });
    
    // Collect stderr
    testProcess.stderr.on('data', (data) => {
      const dataStr = data.toString();
      console.error(dataStr.trim());
      output += dataStr;
    });
    
    // Handle process completion
    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`\n[TEST RUNNER] Test '${scriptName}' passed ✅`);
        resolve({ passed: true, name: scriptName });
      } else {
        console.error(`\n[TEST RUNNER] Test '${scriptName}' failed ❌ (exit code: ${code})`);
        resolve({ passed: false, name: scriptName });
      }
    });
    
    testProcess.on('error', (err) => {
      console.error(`[TEST RUNNER] Failed to run test '${scriptName}': ${err.message}`);
      resolve({ passed: false, name: scriptName, error: err.message });
    });
  });
}

// List of test scripts to run (in order)
const testScripts = [
  'a2a.js',             // Direct A2A server connection tests
  'a2a-proxy.js'        // Proxy-based A2A server connection tests
];

// Run all tests and report results
async function runAllTests() {
  const results = [];
  
  for (const script of testScripts) {
    const result = await runTest(script);
    results.push(result);
  }
  
  // Print summary
  console.log('\n==========================================');
  console.log('Test Summary:');
  console.log('==========================================');
  
  let passedCount = 0;
  let failedCount = 0;
  
  results.forEach(result => {
    if (result.passed) {
      console.log(`✅ PASSED: ${result.name}`);
      passedCount++;
    } else {
      console.log(`❌ FAILED: ${result.name}`);
      failedCount++;
    }
  });
  
  console.log('\n------------------------------------------');
  console.log(`Tests: ${results.length} total, ${passedCount} passed, ${failedCount} failed`);
  
  // Exit with code based on results
  if (failedCount > 0) {
    console.log('\n❌ SOME TESTS FAILED - Please fix the issues and try again');
    process.exit(1);
  } else {
    console.log('\n✅ ALL TESTS PASSED - A2A server and proxy are functioning correctly!');
    process.exit(0);
  }
}

// Start running the tests
runAllTests();