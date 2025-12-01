export default defineContentScript({
  matches: ['*://*.google.com/*'],
  main() {
    console.log('Hello content.');
    
    // Listen for messages from popup
    browser.runtime.onMessage.addListener((request: any, sender: any, sendResponse: any) => {
      if (request.action === 'addCurrentSite') {
        // Logic to add current site would go here
        console.log('Add current site requested');
        // For now, we'll just send a response back
        sendResponse({status: 'success'});
      }
      return true;
    });
  },
});
