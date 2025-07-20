// Performance optimization utilities

// Prefetch critical API endpoints
export function prefetchCriticalData() {
  // Prefetch user data if authenticated
  if (document.cookie.includes('connect.sid')) {
    fetch('/api/auth/user', { 
      method: 'GET',
      credentials: 'include',
    }).catch(() => {
      // Ignore errors, this is just prefetching
    });
  }
}

// Preload fonts to avoid FOUT (Flash of Unstyled Text)
export function preloadFonts() {
  const fontUrls = [
    'https://fonts.gstatic.com/s/jetbrainsmono/v12/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxTOlOV.woff2',
  ];

  fontUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// Resource hints for better performance
export function addResourceHints() {
  // DNS prefetch for external domains
  const dnsPrefetchDomains = [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ];

  dnsPrefetchDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
}

// Initialize all performance optimizations
export function initializePerformanceOptimizations() {
  // Run optimizations after initial render
  requestIdleCallback(() => {
    prefetchCriticalData();
    preloadFonts();
    addResourceHints();
  }, { timeout: 2000 });
}