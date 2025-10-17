import { createRoot } from "react-dom/client";
import App from "./App";
import { registerServiceWorker } from "./utils/service-worker-registration";
import { initializePerformanceOptimizations } from "./utils/performance-optimization";
import "./index.css";

// Register service worker for offline caching
registerServiceWorker();

// Initialize performance optimizations
initializePerformanceOptimizations();

createRoot(document.getElementById("root")!).render(<App />);
