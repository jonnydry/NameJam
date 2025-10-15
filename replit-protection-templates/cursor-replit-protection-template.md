# REPLIT PROJECT PROTECTION RULES

## 📝 CUSTOMIZATION INSTRUCTIONS
**Before using this prompt:**
1. Replace all `[PLACEHOLDERS]` with your project specifics
2. Remove framework sections that don't apply to your stack
3. Copy the entire content and paste into Cursor → Settings → "Rules for AI"
4. Keep this updated when your project structure changes

---

## CRITICAL: YOU ARE EDITING THE REST-EXPRESS REPLIT-HOSTED PROJECT

This project (rest-express) is hosted on **Replit** and has specific infrastructure requirements. Violating these rules will **break deployment**.

### 🚨 SACRED FILES - NEVER MODIFY UNDER ANY CIRCUMSTANCES

**NEVER touch these files:**
- `.replit` - Controls Replit run commands, workflows, deployment, port mappings
- `replit.nix` (or `.config/nix/replit.nix`) - System dependencies and environment
- Any workflow configurations managed by Replit

**Consequence of editing:** Deployment failure, broken builds, runtime errors

**rest-express .replit file contains:**
- Run command: `npm run dev`
- Port mappings (5000, 3000, 5173, etc.)
- Workflow definitions
- Deployment configuration

---

## ⚠️ DANGEROUS ZONE: HIGH-RISK FILES

### Package Management Files

**Choose your stack and follow STRICTLY:**

**Node.js (npm - rest-express uses npm):**
- `package.json` - NEVER manually edit
- `package-lock.json` - NEVER manually edit
- ✅ DO THIS: `npm install <package>`

**Python (pip/poetry):**
- `requirements.txt` / `pyproject.toml` - NEVER manually edit
- `poetry.lock` / `Pipfile.lock` - NEVER manually edit  
- ✅ DO THIS: `pip install <package>` or `poetry add <package>`

**Go:**
- `go.mod` / `go.sum` - NEVER manually edit
- ✅ DO THIS: `go get <package>`

**Rust:**
- `Cargo.toml` / `Cargo.lock` - NEVER manually edit
- ✅ DO THIS: `cargo add <package>`

### Build Configuration Files

**rest-express Critical Config Files:**

**React/Vite (rest-express Frontend):**
- `vite.config.ts` - Path aliases (@, @shared, @assets), build config (NO port/host settings here)
- `tsconfig.json` - TypeScript paths (must match build config)

**Express (rest-express Backend):**
- `server/index.ts` - Port binding files (respect Replit requirements)

**Database/ORM (rest-express uses Drizzle):**
- `drizzle.config.ts` - Database connection and migration settings
- `shared/schema.ts` - Database schema definitions (sessions, users, stash tables)
- NEVER change: Database URL format, connection strings, migration paths
- **Current schema includes:** sessions, users, stash tables with proper indexes

---

## 🚫 ABSOLUTE PROHIBITIONS

### 1. NEVER CHANGE DATABASE ID COLUMN TYPES
**This is the #1 cause of catastrophic failures**

❌ **DON'T:**
```typescript
// Changing from serial to varchar (or vice versa)
id: varchar("id").primaryKey()  // If it was serial("id") - BREAKS EVERYTHING
```

❌ **DON'T:**
```sql
ALTER TABLE users ALTER COLUMN id TYPE VARCHAR; -- CATASTROPHIC
```

✅ **DO:**
- Check existing schema before ANY database changes
- Keep ID types exactly as they are
- Never migrate existing tables between integer ↔ UUID/varchar

### 2. NEVER MANUALLY EDIT PACKAGE FILES
❌ **DON'T:**
```json
// Manually editing package.json
"dependencies": {
  "express": "^5.0.0"  // WRONG - use install command
}
```

✅ **DO:**
```bash
npm install express@5.0.0
# or: yarn add express@5.0.0
# or: pnpm add express@5.0.0
# or: pip install express==5.0.0
# or: cargo add express@5.0.0
```

### 3. NEVER CHANGE PORT CONFIGURATION
❌ **DON'T:**
```javascript
app.listen(3000, 'localhost')  // WRONG
```

✅ **DO (rest-express uses port 5000):**
```javascript
const port = 5000;  // rest-express is hardcoded to port 5000
server.listen({ port, host: '0.0.0.0', reusePort: true });  // Replit requirement
```

```python
# Python
PORT = int(os.environ.get('PORT', 5000))
app.run(host='0.0.0.0', port=PORT)
```

### 4. NEVER HARDCODE SECRETS
❌ **DON'T:**
```javascript
const API_KEY = "sk-1234567890";  // WRONG
```

✅ **DO:**
```
Tell user: "Add to Replit Secrets:
1. Tools → Secrets in Replit
2. Add: [SECRET_NAME] = your-key
3. Access: process.env.[SECRET_NAME]"
```

### 5. NEVER CREATE DEPLOYMENT CONFIGS
❌ **DON'T:**
- Create GitHub Actions workflows
- Write custom deployment scripts
- Configure Docker/containers
- Set up CI/CD pipelines

✅ **DO:**
```
Tell user: "Use Replit's Publish button to deploy"
```

---

## ✅ SAFE OPERATIONS

### You CAN freely modify:
- **Application code:** `client/src/`, `server/`, `shared/` (rest-express source directories)
- **Components/Routes:** All business logic files in client/src/components/, server/routes/
- **Styles:** CSS/SCSS files, Tailwind config (styling only)
- **Documentation:** README.md, docs folders, .md files

### Database Schema Changes (SAFE if done correctly):

**Step 1:** Modify schema file (`shared/schema.ts` for rest-express)

**Step 2:** Run migration command:

**rest-express Migration Command:**
- Drizzle: `npm run db:push --force`

**CRITICAL:** Never change existing ID types in Step 1

---

## 📋 MANDATORY WORKFLOWS

### For Package Installation:
**rest-express uses npm:**
```bash
# Node.js (rest-express)
npm install <package>
```

### For Database Migrations:
**rest-express Migration Pattern:**
```bash
# 1. Modify shared/schema.ts
# 2. Run migration command
npm run db:push --force
```

### For Environment Variables:
```
1. Never hardcode values
2. Tell user to add to Replit Secrets
3. Access via process.env.VAR_NAME (or os.environ in Python)
```

### For Deployment:
```
Tell user: "Use Replit's Publish/Deploy button"
```

---

## 🏥 EMERGENCY RECOVERY

### If Replit Breaks:

**Step 1: Restore critical files**
```bash
git checkout HEAD -- .replit package.json package-lock.json vite.config.ts drizzle.config.ts tsconfig.json
```

**Step 2: Reinstall dependencies**

**rest-express Reinstall Commands:**
```bash
# Node.js (rest-express)
rm -rf node_modules package-lock.json
npm install
```

**Step 3: Sync database**
```bash
npm run db:push --force
```

**Step 4: Test in Replit**
- Click Run button
- Verify workflow executes
- Check console for errors

---

## 🎯 DO/DON'T QUICK REFERENCE

### ✅ DO:
- Write application code in `client/src/`, `server/`, `shared/`
- Create new components/routes/modules
- Add styles and assets
- Modify database schemas in `shared/schema.ts` (then run migration)
- Use `npm install` for packages
- Bind to `0.0.0.0` for servers (rest-express uses port 5000)
- Use Replit Secrets for sensitive data
- Test changes in Replit before committing

### 🚫 DON'T:
- Touch `.replit` or `replit.nix`
- Manually edit package files
- Change database ID column types
- Hardcode ports or secrets
- Create custom deployment scripts
- Manually write SQL migrations
- Change TypeScript paths without matching build config
- Commit infrastructure changes from external editors

---

## 📊 REST-EXPRESS PROJECT SPECIFICS

### rest-express Stack:
- **Language:** Node.js / TypeScript
- **Frontend:** React with Vite
- **Backend:** Express.js
- **Database:** PostgreSQL
- **ORM:** Drizzle
- **Package Manager:** npm
- **Key Dependencies:** Radix UI, React Query, Tailwind CSS, OpenAI, Passport

### Critical Files (rest-express Project):
```
- .replit - Replit configuration (NEVER MODIFY)
- vite.config.ts - Vite build configuration with path aliases
- drizzle.config.ts - Database connection and migration settings
- tsconfig.json - TypeScript configuration
- server/index.ts - Express server with port binding
- shared/schema.ts - Database schema definitions
- package.json - Dependencies and scripts (use npm install only)
```

### Port Configuration (rest-express Project):
```javascript
// rest-express uses hardcoded port 5000
const port = 5000;
server.listen({ port, host: '0.0.0.0', reusePort: true });
```

### Available Scripts (rest-express Project):
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run check    # TypeScript type checking
npm run db:push  # Database migration
```

### Migration Command (rest-express Project):
```bash
npm run db:push --force
```

### Path Aliases (rest-express Project):
```
# In tsconfig.json:
'@': './client/src'
'@shared': './shared'

# In vite.config.ts (additional):
'@assets': './attached_assets'
```

---

## 🔄 VERIFICATION CHECKLIST

Before suggesting ANY change involving:

### Configuration Files:
- [ ] Am I modifying `.replit` or `replit.nix`? → STOP, DON'T DO IT
- [ ] Am I manually editing package files? → STOP, use install command
- [ ] Will this change ports/hosts? → STOP, verify Replit requirements first

### Database:
- [ ] Am I changing ID column types? → STOP, CATASTROPHIC ERROR
- [ ] Have I checked existing schema? → Verify before proceeding
- [ ] Am I using migration command? → Required for schema changes

### Packages:
- [ ] Am I using install command? → Required (npm install, pip install, etc.)
- [ ] Manually editing package.json? → STOP, use command instead

### Secrets:
- [ ] Am I hardcoding API keys? → STOP, use Replit Secrets
- [ ] Suggesting environment variables? → Tell user to add via Replit Secrets

---

## ⚡ REMEMBER

**Three Golden Rules:**
1. **Infrastructure is sacred** - Never modify `.replit`, `replit.nix`, workflows
2. **Use tools, not manual edits** - Package managers, migration commands, Replit Secrets
3. **IDs are permanent** - Never change database primary key types

**When in doubt:**
- Suggest user test in Replit first
- Prefer application code changes over config changes
- Always use proper commands (install, migrate, etc.)

---

**Last Updated:** [DATE]  
**For Full Guide:** See `REPLIT_PROTECTION_GUIDE.md` in project root
