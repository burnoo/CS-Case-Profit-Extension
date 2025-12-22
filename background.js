/**
 * CS Case Profit Extension - Background Service Worker
 * Handles cross-origin requests and extension lifecycle events
 */

// Extension installed/updated
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[CSP Background] Extension installed/updated:', details.reason);
});

// Handle messages from content scripts (for future cross-origin requests if needed)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FETCH_URL') {
        // Proxy fetch requests that might need cross-origin handling
        fetch(message.url, message.options || {})
            .then(response => response.json())
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Keep channel open for async response
    }
});

console.log('[CSP Background] Service worker initialized');
