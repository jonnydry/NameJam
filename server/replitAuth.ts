import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { secureLog } from "./utils/secureLogger";
import { SessionSecretManager } from "./utils/sessionSecretRotation";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

// Initialize session secret manager
const sessionSecretManager = new SessionSecretManager(process.env.SESSION_SECRET);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  const secrets = sessionSecretManager.getSecrets();
  const sessionSecrets = secrets.previous 
    ? [secrets.current, secrets.previous] 
    : [secrets.current];
  
  return session({
    secret: sessionSecrets, // Support both new and old secrets during rotation
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Always false for Replit development
      maxAge: sessionTtl,
      sameSite: 'lax', // More permissive for dev
      // Remove domain restriction for development
    },
    rolling: true, // Reset expiration on activity
    name: 'namejam.session', // Custom session name
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Use only the configured Replit domains - don't add localhost for development
  const domains = process.env.REPLIT_DOMAINS!.split(",");
  
  for (const domain of domains) {
    // Use the current protocol and domain for callback URL
    const protocol = domain.includes('replit.dev') ? 'https' : 'http';
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `${protocol}://${domain}/api/callback`,
      },
      verify,
    );
    passport.use(strategy);
  }

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    try {
      // Use the first configured domain for authentication
      const domains = process.env.REPLIT_DOMAINS!.split(",");
      const authDomain = domains[0]; // Use first domain as primary
      
      secureLog.info("Starting authentication for domain:", authDomain);
      
      passport.authenticate(`replitauth:${authDomain}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    } catch (error) {
      secureLog.error("Login error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.get("/api/callback", (req, res, next) => {
    try {
      // Use the first configured domain for callback
      const domains = process.env.REPLIT_DOMAINS!.split(",");
      const authDomain = domains[0];
      
      secureLog.info("Processing callback for domain:", authDomain);
      secureLog.debug("Callback query params:", req.query);
      
      passport.authenticate(`replitauth:${authDomain}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/auth-error",
        failureFlash: false
      })(req, res, next);
    } catch (error) {
      secureLog.error("Callback error:", error);
      res.redirect("/auth-error");
    }
  });

  app.get("/api/logout", async (req, res) => {
    try {
      const config = await getOidcConfig();
      req.logout(() => {
        // Fix hostname deprecation warning and use proper domain
        const domains = process.env.REPLIT_DOMAINS!.split(",");
        const domain = domains[0];
        const protocol = domain.includes('replit.dev') ? 'https' : 'http';
        const logoutUri = `${protocol}://${domain}`;
        
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: logoutUri,
          }).href
        );
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.redirect("/");
    }
  });

  // Add auth error route
  app.get("/auth-error", (req, res) => {
    res.status(401).send(`
      <html>
        <head><title>Authentication Error</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1>Authentication Failed</h1>
          <p>Sorry, there was a problem signing you in.</p>
          <a href="/" style="color: #007bff; text-decoration: none;">← Back to NameJam</a>
        </body>
      </html>
    `);
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};