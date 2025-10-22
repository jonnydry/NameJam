# 🛡️ Replit Protection Guide Template

## 📝 How to Use This Template
1. Copy this file to your new project as `REPLIT_PROTECTION_GUIDE.md`
2. Replace all `[PLACEHOLDERS]` with your project-specific details
3. Remove framework examples that don't apply to your stack
4. Share with team members and external developers

---

## Purpose
This guide prevents external development environments (Cursor, VSCode, etc.) from breaking your **NameJam** Replit deployment by protecting critical infrastructure files and configurations.

**Why This Matters:** Replit uses specific configuration files and workflows to manage your NameJam application. Modifying these files in external editors can cause deployment failures, broken builds, and runtime errors that are difficult to debug.

---

## 🚨 CRITICAL: NEVER MODIFY THESE FILES

### Replit Infrastructure Files
These files are **sacred** to Replit's operation. Any modifications will break your deployment:

#### `.replit`
- **What it does:** Controls run commands, build commands, deployment settings
- **Why it's critical:** Replit uses this to start your application and configure workflows
- **Never change:** Run commands, deployment targets, environment variables managed by Replit
- **Located at:** Project root

#### `replit.nix` (or `.config/nix/replit.nix`)
- **What it does:** Manages system-level dependencies (language runtime, system packages, etc.)
- **Why it's critical:** Provides reproducible environment for your app
- **Never change:** Package versions, Nix configuration syntax
- **Located at:** Project root or `.config/nix/`

#### Workflow Configurations
- **What they do:** Define automated task sequences (like "[YOUR_WORKFLOW_NAME]")
- **Why they're critical:** Control how Replit runs your development server
- **Never change:** Workflow commands, execution order
- **Managed through:** Replit's Workflow pane (not file-based)

---

## ⚠️ DANGEROUS ZONE: High-Risk Files

### Package Management (Modify with EXTREME Care)

Choose your package manager and follow these rules:

#### For Node.js Projects (npm/yarn/pnpm):

**`package.json`**
- **Safe to modify:** Adding new dependencies via commands
- **NEVER manually edit:** Dependency versions, scripts that Replit manages
- **Correct approach:** Use `npm install <package>` (or `yarn add`, `pnpm add`) commands only
- **Why:** Replit's dependency tool syncs with package.json automatically

**`package-lock.json` / `yarn.lock` / `pnpm-lock.yaml`**
- **NEVER manually edit these files**
- **Why:** Auto-generated lockfiles that ensure consistent installs
- **Correct approach:** Let package manager regenerate via install commands
- **If corrupted:** Delete and run `npm install` (or equivalent) in Replit

#### For Python Projects (pip/poetry):

**`requirements.txt` / `pyproject.toml`**
- **Safe to modify:** Adding new packages via commands
- **NEVER manually edit:** Package versions directly
- **Correct approach:** Use `pip install <package>` or `poetry add <package>` commands only
- **Why:** Keeps dependencies synchronized with virtual environment

**`poetry.lock` / `Pipfile.lock`**
- **NEVER manually edit these files**
- **Why:** Auto-generated lockfiles
- **Correct approach:** Let poetry/pipenv regenerate via install commands

#### For Go Projects:

**`go.mod` / `go.sum`**
- **Safe to modify:** Via `go get` commands only
- **NEVER manually edit:** Module versions, checksums
- **Correct approach:** Use `go get <package>` commands
- **Why:** Go module system manages these automatically

#### For Rust Projects:

**`Cargo.toml` / `Cargo.lock`**
- **Safe to modify:** Via `cargo add` commands only
- **NEVER manually edit:** Dependency versions directly
- **Correct approach:** Use `cargo add <package>` commands
- **Why:** Cargo manages dependency resolution

---

## 🔧 Build & Configuration Files

### Framework-Specific Configuration

**NameJam Critical Config Files:**

#### React/Vite (NameJam Frontend):
- `vite.config.ts`
  - **Critical:** Path aliases (@, @shared, @assets), build output, server configuration
  - **Safe changes:** Adding new aliases (carefully)
  - **Dangerous changes:** Changing ports, server host, proxy config

#### Express (NameJam Backend):
- `server/index.ts`
  - **Critical:** Port binding (hardcoded to 5000), middleware setup
  - **Safe changes:** Adding new routes
  - **Dangerous changes:** Changing port from Replit's requirements

### TypeScript Configuration (if applicable):

**`tsconfig.json`**
- **What it controls:** TypeScript compilation settings
- **Critical sections:**
  - Path mappings (must match build tool's structure)
  - Module resolution strategy
  - Base URL configuration
- **Why it's critical:** Enables imports to work in Replit environment
- **Safe changes:** Adding new paths (if also added to build config)
- **Dangerous changes:** Changing module resolution, base URL, target

---

## 💾 Database Configuration

### General Database Rules

**`drizzle.config.ts` (NameJam Database Config)**

- **What it controls:** Database connection and migration settings
- **Critical sections:**
  - Database URL (uses Replit's DATABASE_URL env var)
  - Schema file location (`./shared/schema.ts`)
  - Migration configuration (`./migrations`)
- **Why it's critical:** Must match Replit's database connection
- **NEVER change:** Connection string format, environment variables
- **Safe changes:** None recommended without testing in Replit first

### CRITICAL: Primary Key Rules

**⚠️ NEVER CHANGE PRIMARY KEY ID COLUMN TYPES ⚠️**

This is the #1 cause of catastrophic database failures:

❌ **DON'T DO THIS:**
```sql
-- Changing from integer to UUID (or vice versa)
ALTER TABLE users ALTER COLUMN id TYPE VARCHAR; -- BREAKS EVERYTHING
```

❌ **DON'T DO THIS (Drizzle/Prisma):**
```typescript
// Before: id: serial("id").primaryKey()
// After:
id: varchar("id").primaryKey()  // WRONG - breaks all existing data
```

✅ **DO THIS:**
- Check existing schema BEFORE making changes
- Keep ID types exactly as they are
- If you need UUIDs in new tables, that's fine
- Never migrate existing tables from serial → varchar or vice versa

---

## ✅ SAFE TO MODIFY

### Application Code (Full Freedom)
- **NameJam Source Directories:**
  - `client/src/` - React frontend components and pages
  - `server/` - Express backend routes and services
  - `shared/` - Shared types and database schema
  - All application logic files
  - All route handlers
  - All component files

### Documentation & Guidelines
- `README.md` - Project readme
- `[PROJECT_DOCS_DIR]/` - Documentation folder
- Any `.md` files (except those in `.replit` configs)

### Styling Configuration (Generally Safe)
Examples:
- `tailwind.config.ts` / `tailwind.config.js` - Tailwind CSS settings
- `postcss.config.js` - PostCSS configuration
- `.css` / `.scss` files - Stylesheets
- These are safe because they only affect styling, not infrastructure

---

## 📋 STRICT RULES FOR LLMS IN EXTERNAL EDITORS

### Rule 1: Package Installation
**NEVER manually edit dependency files**

Choose your package manager:

**Node.js:**
```bash
# ✅ DO THIS
npm install <package>
yarn add <package>
pnpm add <package>

# ❌ DON'T manually edit package.json
```

**Python:**
```bash
# ✅ DO THIS
pip install <package>
poetry add <package>
pipenv install <package>

# ❌ DON'T manually edit requirements.txt or pyproject.toml
```

**Go:**
```bash
# ✅ DO THIS
go get <package>

# ❌ DON'T manually edit go.mod
```

**Rust:**
```bash
# ✅ DO THIS
cargo add <package>

# ❌ DON'T manually edit Cargo.toml
```

### Rule 2: Database Schema Changes
**Use ORM/migration tools, never manual SQL**

**For Drizzle (NameJam):**
```typescript
// 1. Modify schema file (shared/schema.ts)
export const users = pgTable("users", {
  id: serial("id").primaryKey(), // NEVER change existing ID type
  name: varchar("name", { length: 255 })
});

// 2. Run migration command
npm run db:push --force
```

**For Prisma (Node.js):**
```bash
# 1. Modify schema.prisma
# 2. Run migration
npx prisma migrate dev
```

**For SQLAlchemy (Python):**
```bash
# 1. Modify models.py
# 2. Run migration
flask db migrate
flask db upgrade
# or for Alembic
alembic revision --autogenerate
alembic upgrade head
```

**For Django (Python):**
```bash
# 1. Modify models.py
# 2. Run migration
python manage.py makemigrations
python manage.py migrate
```

**CRITICAL DATABASE RULES:**
- **NEVER change primary key ID types** (integer ↔ UUID breaks everything)
- Always use framework's migration tools
- Check existing schema before making changes
- No manual SQL migrations

### Rule 3: Port Configuration
**Respect Replit's port requirements**

Replit typically requires binding to `0.0.0.0` with the port specified in `.replit` file.

❌ **DON'T DO THIS:**
```javascript
// Hardcoding localhost or wrong port
app.listen(3000, 'localhost')  // WRONG
```

✅ **DO THIS (NameJam):**
```javascript
// NameJam uses hardcoded port 5000
const port = 5000;
server.listen({ port, hostname: '0.0.0.0', reusePort: true });
```

```python
# Python example
PORT = int(os.environ.get('PORT', 5000))
app.run(host='0.0.0.0', port=PORT)
```

### Rule 4: Environment Variables
**Only suggest adding to Replit's Secrets, never hardcode**

❌ **DON'T DO THIS:**
```javascript
const API_KEY = "sk-1234567890abcdef"; // WRONG - hardcoded
```

✅ **DO THIS:**
```
"Add your API key to Replit Secrets:
1. Go to Tools > Secrets in Replit
2. Add: [SECRET_NAME] = your-value-here
3. Access via: process.env.[SECRET_NAME] (or os.environ in Python)"
```

### Rule 5: Deployment
**NEVER create custom deployment configs**

❌ **DON'T DO THIS:**
- Create GitHub Actions workflows
- Write custom build scripts in `.replit`
- Configure Docker containers
- Set up CI/CD pipelines

✅ **DO THIS:**
```
"Use Replit's built-in Publish feature to deploy your application.
Click the Publish/Deploy button in Replit when ready."
```

---

## 🔄 SAFE WORKFLOWS FOR EXTERNAL DEVELOPMENT

### What You CAN Do in Cursor/VSCode:

#### ✅ Write Application Code
- Create new components/modules
- Write API routes/endpoints
- Add utility functions
- Implement business logic
- Style with CSS frameworks

#### ✅ Modify Safe Schemas
- Update ORM models/schemas
- Modify type definitions
- Create new database models

#### ✅ Test Locally
- Run tests in external environment
- Debug with breakpoints
- Use local dev servers for testing
- Install packages with proper commands

### What You CANNOT Do:

#### ❌ Infrastructure Changes
- Modify `.replit` or `replit.nix`
- Change build configuration files
- Edit package files directly
- Create deployment configs

#### ❌ System Configuration
- Change port bindings
- Modify database connection strings
- Alter build commands
- Configure system packages

---

## 🏥 RECOVERY CHECKLIST

### If Something Breaks in Replit:

#### Step 1: Check Protected Files
```bash
git status
```
Look for changes to:
- `.replit`
- `replit.nix`
- `[package.json / requirements.txt / go.mod / Cargo.toml]`
- `[your-config-files]`

#### Step 2: Restore Critical Files
```bash
# Restore individual files
git checkout HEAD -- .replit
git checkout HEAD -- replit.nix
git checkout HEAD -- [config-file]

# Or restore all config files at once
git checkout HEAD -- .replit replit.nix [list-your-critical-files]
```

#### Step 3: Verify Package Installation

**Node.js:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Python:**
```bash
rm -rf venv __pycache__
pip install -r requirements.txt
# or
poetry install
```

**Go:**
```bash
go mod download
go mod tidy
```

**Rust:**
```bash
cargo clean
cargo build
```

#### Step 4: Test Workflow
- Click "Run" button in Replit
- Verify workflow executes correctly
- Check for console errors
- Confirm app loads at your Replit URL

#### Step 5: Database Sync (if schema changed)

**Drizzle (NameJam):**
```bash
npm run db:push --force
```

**Prisma:**
```bash
npx prisma migrate dev
```

**SQLAlchemy/Alembic:**
```bash
alembic upgrade head
```

**Django:**
```bash
python manage.py migrate
```

---

## 📊 PROJECT-SPECIFIC DETAILS

### NameJam Tech Stack:
- **Language:** Node.js / TypeScript
- **Frontend:** React with Vite
- **Backend:** Express.js
- **Database:** PostgreSQL
- **ORM/Database Tool:** Drizzle
- **Package Manager:** npm
- **Other Tools:** Tailwind CSS, Radix UI, React Query

### Critical Port Configuration:
**NameJam Port Setup:**
```javascript
// NameJam uses hardcoded port 5000
const port = 5000;
server.listen({ port, hostname: '0.0.0.0', reusePort: true });
```

### Critical Path Aliases (NameJam):
```
'@': './client/src'
'@shared': './shared'
'@assets': './attached_assets'
```

### Database Migration Pattern (NameJam):
```bash
# Drizzle (NameJam)
npm run db:push --force
```

### Workflow Commands:
**NameJam Development runs:**
```bash
npm run dev
```

This starts both the Vite dev server and Express backend.

---

## 🎯 QUICK REFERENCE CARD

### Before Committing Changes from External Editor:

**✅ SAFE:**
- Application code in `client/src/`, `server/`, `shared/`
- New components/routes/modules
- Styles and assets
- Documentation files
- Database schema files in `shared/schema.ts` (then run migration)

**⚠️ VERIFY IN REPLIT:**
- Any config file changes
- New path aliases
- Build configuration
- Port/host settings

**🚫 NEVER COMMIT:**
- Modified `.replit` or `replit.nix`
- Manually edited package files
- Changed port bindings
- Custom deployment scripts
- Database connection string changes
- **NEVER changed database ID column types**

### Emergency Rollback (NameJam):
```bash
# Restore all critical files
git checkout HEAD -- .replit replit.nix package.json package-lock.json vite.config.ts drizzle.config.ts tsconfig.json

# Reinstall dependencies
npm install

# Sync database
npm run db:push --force
```

---

## 📚 Additional Resources

- **Replit Docs:** https://docs.replit.com
- **Your Framework Docs:** [Add your framework documentation links]
- **Your Database/ORM Docs:** [Add your database tool docs]
- **Project Docs:** [Link to your project documentation]

---

## ✏️ Customization Checklist

Use this checklist when setting up this guide for a new project:

- [ ] Replace `[PROJECT_NAME]` with your actual project name
- [ ] Fill in "Your Tech Stack" section with your actual stack
- [ ] List your critical configuration files
- [ ] Document your port configuration
- [ ] Add your database migration commands
- [ ] List your workflow commands
- [ ] Add your path aliases (if applicable)
- [ ] Remove framework examples that don't apply
- [ ] Update recovery commands for your package manager
- [ ] Add project-specific gotchas or warnings
- [ ] Share with team members

---

**Last Updated:** [DATE]  
**For Questions:** Refer to this guide before making infrastructure changes
