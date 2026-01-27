/**
 * Manual test runner for Cloud Configuration UI Checkpoint
 * This script can be run in the browser console to test the functionality
 */

console.log('🚀 Starting Cloud Configuration UI Checkpoint Tests...');

// Wait for the page to be fully loaded
function waitForPageLoad() {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });
}

// Wait for the app to be initialized
function waitForApp() {
  return new Promise((resolve) => {
    const checkApp = () => {
      if (window.enveilApp && window.enveilApp.getController()) {
        resolve();
      } else {
        setTimeout(checkApp, 100);
      }
    };
    checkApp();
  });
}

// Main test function
async function runCheckpointTests() {
  try {
    console.log('⏳ Waiting for page and app to load...');
    await waitForPageLoad();
    await waitForApp();
    
    console.log('✅ Page and app loaded successfully');
    
    // Check if CloudConfigUITest is available
    if (typeof window.CloudConfigUITest === 'undefined') {
      console.error('❌ CloudConfigUITest not available. Make sure the test module is loaded.');
      return;
    }
    
    console.log('🧪 Running checkpoint tests...');
    const results = window.CloudConfigUITest.runCheckpointTests();
    
    console.log('\n📋 Generating detailed test report...');
    const report = window.CloudConfigUITest.generateTestReport();
    console.log(report);
    
    // Return results for further processing
    return results;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return null;
  }
}

// Auto-run tests
runCheckpointTests().then(results => {
  if (results && results.passed === results.total) {
    console.log('🎉 All checkpoint tests passed! The configuration UI is functional.');
  } else {
    console.log('⚠️ Some tests failed or could not run. Please check the output above.');
  }
});