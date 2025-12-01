document.addEventListener('DOMContentLoaded', function() {
  const optionsButton = document.getElementById('options');
  const reloadButton = document.getElementById('reload');
  
  optionsButton.addEventListener('click', function() {
    chrome.runtime.openOptionsPage();
  });
  
  reloadButton.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.reload(tabs[0].id);
    });
  });
});