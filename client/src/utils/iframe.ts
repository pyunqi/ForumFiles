// Detect if the app is running inside an iframe
export const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

// Post message to parent window
export const postMessageToParent = (message: any): void => {
  if (isInIframe() && window.parent) {
    window.parent.postMessage(message, '*');
  }
};

// Listen for messages from parent window
export const listenToParentMessages = (
  callback: (event: MessageEvent) => void
): (() => void) => {
  const handler = (event: MessageEvent) => {
    // Add origin validation in production
    callback(event);
  };

  window.addEventListener('message', handler);

  // Return cleanup function
  return () => {
    window.removeEventListener('message', handler);
  };
};

// Send download event to parent
export const notifyParentOfDownload = (filename: string, url: string): void => {
  postMessageToParent({
    type: 'FILE_DOWNLOAD',
    data: { filename, url },
  });
};

// Send upload event to parent
export const notifyParentOfUpload = (
  filename: string,
  fileId: number
): void => {
  postMessageToParent({
    type: 'FILE_UPLOAD',
    data: { filename, fileId },
  });
};

// Send error event to parent
export const notifyParentOfError = (error: string): void => {
  postMessageToParent({
    type: 'ERROR',
    data: { error },
  });
};

// Request parent to resize iframe
export const requestIframeResize = (height: number): void => {
  postMessageToParent({
    type: 'RESIZE_IFRAME',
    data: { height },
  });
};

// Get iframe configuration from parent
export const getIframeConfig = (): Promise<any> => {
  return new Promise((resolve) => {
    const cleanup = listenToParentMessages((event) => {
      if (event.data.type === 'IFRAME_CONFIG') {
        cleanup();
        resolve(event.data.config);
      }
    });

    // Request config
    postMessageToParent({ type: 'REQUEST_CONFIG' });

    // Timeout after 2 seconds
    setTimeout(() => {
      cleanup();
      resolve({});
    }, 2000);
  });
};
