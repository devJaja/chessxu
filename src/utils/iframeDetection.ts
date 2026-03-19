/**
 * Utility functions to detect iframe context and handle OAuth popup issues
 */

export const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

export const isPopupBlocked = (): boolean => {
  try {
    const popup = window.open('', '_blank', 'width=1,height=1');
    if (popup) {
      popup.close();
      return false;
    }
    return true;
  } catch (e) {
    return true;
  }
};

export const handleIframeAuth = (): void => {
  if (isInIframe()) {
    console.warn('Running in iframe context - OAuth popups may be blocked');
    
    // Option 1: Redirect to parent window
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'AUTH_REDIRECT' }, '*');
    }
    
    // Option 2: Show user-friendly message
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #1f2937;
      color: white;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #374151;
      z-index: 10000;
      text-align: center;
      max-width: 400px;
    `;
    message.innerHTML = `
      <h3 style="margin: 0 0 10px 0;">Authentication Required</h3>
      <p style="margin: 0 0 15px 0;">OAuth popups are blocked in this context. Please open this page in a new tab to authenticate.</p>
      <button onclick="window.open(window.location.href, '_blank')" 
              style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
        Open in New Tab
      </button>
    `;
    document.body.appendChild(message);
  }
};
