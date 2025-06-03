# DEVELOPMENT.md

> A hands-on guide for getting **Ideazoop** running locally, keeping it in sync with Supabase cloud, and contributing code confidently.

---

## 1. Prerequisites

| Tool | Recommended Version | Install Command / Link |
|------|--------------------|------------------------|
| Node | ≥ **18 LTS**       | `nvm install 18` or <https://nodejs.org> |
| npm  | ≥ **10**           | ships with Node 18 |
| Supabase CLI | ≥ **1.160** | `brew install supabase/tap/supabase` |
| Git | ≥ **2.40**          | <https://git-scm.com> |
| GitHub CLI (gh) | optional | `brew install gh` |
| Vercel CLI | optional     | `npm i -g vercel` |

> **Why npm?** The Netzoop team standardises on **npm** for cross-platform consistency.

---

## 2. Repository Bootstrap

Clone the repo (create it first if it doesn’t yet exist in `Netzoop/Ideazoop`):

```bash
git clone git@github.com:Netzoop/Ideazoop.git
cd Ideazoop
npm install         # 🔌 install dependencies
cp .env.local.example .env.local   # add your keys
```

---

## 3. Environment Variables

Open `.env.local` and fill the placeholders:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | e.g. `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** key (never exposed to client) |
| `OPENAI_API_KEY` | `sk-...` |
| `OPENAI_MODEL` | `gpt-3.5-turbo` (default) or `gpt-4o` |
| `OPENAI_DAILY_LIMIT` | Calls / user / day (default **5**) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |
| `VERCEL_URL` | auto-set by Vercel in prod |

Commit **example** file only – never real secrets.

---

## 4. Local Database Workflow

### 4.1 Start Postgres

```
supabase start             # launches local Postgres+Auth+Storage
```

This spins up Docker containers on ports:

| Service | Port |
|---------|------|
| Postgres | 54322 |
| Studio   | 54323 |
| Realtime | 54321 |

### 4.2 Apply Migrations

```bash
npm run db:migrate         # runs database/migrations/*.sql
```

**Files**

```
database/
└── migrations/
    └── 001_initial_schema.sql   # tables, enums, RLS, triggers
```

### 4.3 Regenerate TypeScript Types

```bash
npm run db:types            # writes src/lib/database.types.ts
```

Keep this file in source control so CI type-checks succeed.

### 4.4 Seed Admin User (optional)

```sql
select public.create_admin_user('admin@ideazoop.dev', 'StrongPassword!');
```

---

## 5. Running the Full Stack

### 5.1 One-liner (Next.js + Supabase)

```bash
npm run dev:all             # Next.js on 3000, Supabase on 54322
```

### 5.2 Separate Tabs

```bash
supabase start
npm run dev                 # faster reload via Turbopack
```

Visit <http://localhost:3000>.

---

## 6. Common npm Scripts

| Script | Purpose |
|--------|---------|
| `dev` | Next.js dev server (`next dev --turbopack`) |
| `dev:all` | Next + Supabase (concurrently) |
| `build` | Production build |
| `lint` | ESLint (Next.js rules) |
| `type-check` | TypeScript strict mode |
| `test` / `test:watch` | Vitest unit tests |
| `test:coverage` | Coverage with v8 |
| `format` | Prettier write |
| `db:migrate` | Apply SQL migrations locally |
| `db:reset` | Drop & recreate local DB |
| `db:seed` | Seed scripts (add your own) |
| `db:types` | Regenerate Supabase types |
| `validate` | lint + types + tests (pre-commit hook) |

---

## 7. Coding Standards

1. **TypeScript strict** (`tsconfig.json`).
2. **shadcn-ui** components live in `src/components/ui`.
3. Use helper `cn()` from `src/lib/utils.ts` for class merging.
4. **React Query** for data fetching on the client; prefer Supabase **server** client in RSC when possible.
5. Follow **Conventional Commits** (`feat:`, `fix:`, `chore:` …).

---

## 8. Testing

* **Unit** – Vitest + Testing Library (`src/**/*.{test,spec}.ts(x)`).
* **E2E** – _Coming soon_ with Playwright (`tests/e2e`).
* Run all before pushing: `npm run validate`.

---

## 9. Git Hooks & CI

### 9.1 Husky

Installed automatically via `prepare` script – runs `npm run validate` on commit.

### 9.2 GitHub Actions

`.github/workflows/ci.yml`:

1. Lint, type-check, test
2. Upload coverage artifact
3. Deploy **preview** on every PR via Vercel
4. Deploy **production** when `main` is updated

Secrets needed in repo:

| Secret | Notes |
|--------|-------|
| `VERCEL_TOKEN` | personal token with deploy scope |
| `SUPABASE_SERVICE_ROLE_KEY` | for admin tests (optional) |

---

## 10. Debugging Tips

| Issue | Fix |
|-------|-----|
| **Auth callback 404** | Add `http://localhost:3000` to Supabase **Auth → URL Config**. |
| **RLS errors** | Check session in Network tab, ensure `supabase.auth.getSession()` returns a user. |
| **“Rate Limit Exceeded”** | Increase `OPENAI_DAILY_LIMIT` or wait 24h. |
| **Docker port conflict** | `supabase stop`, free port 54322, restart. |

---

## 11. Deployment to Vercel

1. **Import** the GitHub repo in Vercel.
2. Framework: **Next.js** • Build Cmd: `npm run vercel-build` • Root: `/`.
3. Add environment variables (same as `.env.local`, minus service role).
4. Push to `main` → GitHub Action triggers prod deploy.

---

## 12. Contribution Workflow

```text
git checkout -b feat/awesome-thing
# code, commit (husky validates)
git push -u origin feat/awesome-thing
open PR to main
```

* PR template enforces description & demo video / screenshots.
* Maintainers run Playwright e2e before merge.

Happy hacking! 🎉
