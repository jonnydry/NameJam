import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupSecurity } from "./security";
import { validateEnvironment, getEnvSummary } from "./utils/envValidation";
import { secureLog } from "./utils/secureLogger";
import { optimizedContextService } from "./services/optimizedContextService";

// Validate environment variables at startup
try {
  validateEnvironment();
  secureLog.info('🔒 Security: Environment validation passed');
  secureLog.info('📊 Environment Summary:', getEnvSummary());
  secureLog.info('⚡ Performance Mode: Quality checks optimized for speed');
} catch (error) {
  secureLog.error('❌ Critical Security Error - Environment validation failed:', error);
  process.exit(1);
}

const app = express();

// Security middleware first (includes CSRF protection)
const securityMiddleware = setupSecurity(app);

// Body parsing with size limits for security
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Pre-warm cache with common genre/mood combinations
async function preWarmCache(): Promise<void> {
  const commonCombinations = [
    { genre: 'rock', mood: 'energetic' },
    { genre: 'pop', mood: 'upbeat' },
    { genre: 'electronic', mood: 'futuristic' },
    { genre: 'jazz', mood: 'smooth' },
    { genre: 'folk', mood: 'melancholic' },
    { genre: 'metal', mood: 'aggressive' },
    { genre: 'indie', mood: 'dreamy' },
    { genre: 'blues', mood: 'soulful' },
    { genre: 'country', mood: 'nostalgic' },
    { genre: 'hip-hop', mood: 'confident' },
    { genre: 'classical', mood: 'dramatic' },
    { genre: 'reggae', mood: 'laid-back' }
  ];

  // Pre-warm context cache with common combinations
  const preWarmPromises = commonCombinations.map(async (combo) => {
    try {
      await optimizedContextService.getContext(combo.genre, combo.mood, 'quality');
      secureLog.debug(`🔥 Pre-warmed cache for ${combo.genre}/${combo.mood}`);
    } catch (error) {
      secureLog.debug(`Failed to pre-warm ${combo.genre}/${combo.mood}:`, error);
    }
  });

  // Also pre-warm some genre-only contexts
  const genreOnlyPromises = ['rock', 'pop', 'electronic', 'jazz', 'indie'].map(async (genre) => {
    try {
      await optimizedContextService.getContext(genre, undefined, 'quality');
      secureLog.debug(`🔥 Pre-warmed cache for ${genre} (no mood)`);
    } catch (error) {
      secureLog.debug(`Failed to pre-warm ${genre}:`, error);
    }
  });

  // Run all pre-warming in parallel
  await Promise.allSettled([...preWarmPromises, ...genreOnlyPromises]);
}

(async () => {
  const server = await registerRoutes(app, securityMiddleware);

  // Pre-warm cache with common genre/mood combinations
  try {
    secureLog.info('🔥 Starting cache pre-warming...');
    await preWarmCache();
    secureLog.info('✅ Cache pre-warming completed');
  } catch (error) {
    secureLog.warn('⚠️ Cache pre-warming failed (non-critical):', error);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
