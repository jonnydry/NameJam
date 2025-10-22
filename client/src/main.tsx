import { createRoot } from "react-dom/client";
import App from "./App";
import { registerServiceWorker } from "./utils/service-worker-registration";
import { initializePerformanceOptimizations } from "./utils/performance-optimization";
import "./index.css";

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  event.preventDefault(); // Prevent the default behavior (logging to console)
});

// Handle other unhandled errors
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
});

// Register service worker for offline caching
registerServiceWorker();

// Initialize performance optimizations
initializePerformanceOptimizations();

createRoot(document.getElementById("root")!).render(<App />);
