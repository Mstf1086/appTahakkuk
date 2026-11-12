# AGENTS.md

## Project overview

This repository contains an **Angular 22** single-page application named **Tahakkuk**. Users sign in with **Firebase Authentication** (email/password) and then reach a protected area with a **dashboard**, a **profile** page, and a **logout** action.

The **Damga Vergisi Hesaplama** module (`/modules/stamp-tax`) is intentionally public: guests can open it from the dashboard module card or by URL without signing in. Every other feature route stays behind `authGuard`.

The navigation adapts to the viewport: on desktop (≥ 900px) the menu sits in the top bar; on mobile the menu opens as a slide-in panel from the left.

The user-facing language is Turkish. Keep UI text and test names in Turkish unless the product scope changes.

## Runtime and toolchain

- **Node:** v24.22.2 LTS (pinned in `.nvmrc`; nvm default alias is `24`).
- **npm:** 11.19.1 (ships with Node 24.22.2).
- **Angular:** 22.2.5 with `@angular/build` 22.2.6 (the `application` builder; the legacy `@angular-devkit/build-angular` package is gone).
- **Angular CLI:** 22.2.6, installed globally with `npm install -g @angular/cli`.
- **Vite:** installed independently as a devDependency (`npm install -D vite`, currently 8.3.8) in addition to the Vite-based dev server and Vitest runner that `@angular/build` uses internally.
- **Unit tests:** Vitest 5 through the `@angular/build:unit-test` builder with the `vitest` runner and `jsdom` as the DOM environment. Karma and Jasmine have been removed.
- **Backend SDK:** Firebase 13 (`firebase/app`, `firebase/auth`, `firebase/firestore`, `firebase/storage`).

Use the Node 24 toolchain for every command:

```bash
export NVM_DIR=/usr/local/nvm
. "$NVM_DIR/nvm.sh"
nvm use 24
```

## Commands

- `npm install` — install dependencies.
- `npm run env:init` — create the local `.env` from `.env.example`.
- `npm run env:generate` — generate `src/environments/environment.ts` from `.env`.
- `npm start` — start the Angular dev server (Vite-based) on http://localhost:4200.
- `npm run build` — production build into `dist/tahakkuk/`.
- `npm run watch` — development build in watch mode.
- `npm run test:ci` — one-shot unit test run (Vitest + jsdom), standard CI command.
- `npm test` — unit tests in watch mode.

`prestart`, `prebuild`, and `pretest:ci` hooks regenerate the environment file automatically.

## Versioning rules

- **`package.json` `version` is the single source of truth.** The footer reads it through `src/app/core/app-info.ts` (`APP_VERSION`), so there is never a second hard-coded version string.
- **Every code change bumps the version by one in the last component only** (`0.0.1` → `0.0.2` → `0.0.3`). This is the "minor" increment the project owner asked for.
- **Never change the `0.0` major/minor part on your own.** `0.0.x` stays `0.0.x` until the user explicitly asks for a major/minor release; only then change `0.0.x` to `0.1.0`, `1.0.0`, etc.
- Bump the version in the same change as the code edit, and add a matching `## [x.y.z] - YYYY-MM-DD` section to `CHANGELOG.md` describing what changed.
- The version is displayed in the footer (`src/app/layout/footer.component.*`); never hide it behind a constant that is not connected to `package.json`.

## Documentation rules

- **`README.md` is the canonical setup and usage guide.** It must document installation, the `.env` variables, Firebase console setup, the available routes, the module list, the test/build commands, and troubleshooting. Update it in the same change whenever a command, route, module, environment variable, or setup step changes.
- **`CHANGELOG.md` follows the Keep a Changelog format.** Add every user-visible change under the `## [Güncellenmemiş]` heading using the `### Eklenen / ### Değiştirilen / ### Düzeltilen / ### Kaldırılan` sections (Turkish). Move entries to a version heading and bump `package.json` only when the user asks for a release.
- **Update `AGENTS.md` in the same change** whenever the stack, commands, directory layout, budgets, or the rules below change. Do not leave stale instructions behind.
- Document the *why* and the *how to use* in `README.md`; keep `AGENTS.md` limited to rules and structure. Never duplicate whole file contents between documents.
- Do not create unsolicited documentation files (summaries, reports, design notes) beyond `README.md` and `CHANGELOG.md` unless the user explicitly asks.

## Token efficiency rules

These rules exist to keep the context window small while still delivering verified work.

1. **Search first, read second.** Use `Grep`/`Glob` to locate code, then `Read` only the file (or line range) that matters. Do not read a whole directory tree or a large file to find one function.
2. **Read with bounds.** Pass `line_offset`/`n_lines` for large files. Never read `node_modules/`, `dist/`, `.angular/`, `package-lock.json`, or the generated `src/environments/environment.ts` unless the task is explicitly about them.
3. **Batch independent calls.** Put independent `Read`/`Grep`/`Bash` calls in a single message so they run in parallel instead of one round trip per file.
4. **Never re-read a file after `Edit`/`Write`.** The tool already confirms success; re-reading only to verify burns tokens.
5. **Use dedicated tools instead of shell.** `Read` instead of `cat`, `Grep` instead of `rg`, `Glob` instead of `find`; use `Bash` only for real shell semantics (package managers, git, pipelines, background processes).
6. **Prefer low-noise output modes.** Start with `files_with_matches` or `count_matches`, then read only the relevant hits. Filter command output (`| tail -n 30`) instead of dumping full logs.
7. **Reuse what you already know.** `AGENTS.md`, the manifest, and earlier tool results are the source of truth; do not re-derive the same facts by re-reading files.
8. **Test narrowly while iterating, fully at the end.** Run the single affected spec (`npm test -- --include='src/app/...spec.ts'`) during development and the full `npm run test:ci` plus `npm run build` once before declaring the work done.
9. **Group edits before verification.** Batch related edits into one change, then verify once; do not rebuild after every single-line change.
10. **Report, do not paste.** Summarize findings as short bullets with `path:line` references; do not echo build logs, diffs, or file contents into the final answer.
11. **Skip exploration that cannot change the outcome.** Do not inspect directories or generated output that the task does not touch.
12. **Ask one focused question instead of guessing.** When a rule (tax rate, rounding, access model) is ambiguous, a single structured question is cheaper than rework.

## MCP usage rules

### Angular CLI MCP

- Call `list_projects` **first** in every session before any project-specific action; take the workspace path, project name, and framework version from its output.
- Call `get_best_practices` (with the workspace path) before writing or modifying Angular code; it is the version-specific contract for standalone components, signals, and templates.
- Use `search_documentation` with the `frameworkVersion` from `list_projects` for API questions (pipe signatures, router APIs, new APIs) instead of guessing; verify the `searchedVersion` field.
- Use `run_target` for configured targets such as `build` and `test`; it requires a prior `list_projects` call.
- Use `devserver_start` → `devserver_wait_for_build` → `devserver_stop` for manual UI verification, and wait for the build after every file change while the server is alive.
- Use `onpush_zoneless_migration` only for an explicit migration request; it is read-only and must be driven one step at a time.
- Do not use the Angular MCP for things `npm` scripts already do (`npm run build`, `npm run test:ci`); use the local toolchain there to keep output small.

### Firebase MCP

- Check the CLI/MCP state with `firebase_get_environment` (and `firebase_login` when a project operation reports that authentication is required) before any project mutation.
- When `firebase_login` starts the browser flow, show **both** the login URL and the session ID to the user and tell them to verify that the session ID in the browser matches the one you display.
- Use `firebase_get_project`, `firebase_list_apps`, and `firebase_get_sdk_config` for project/app facts; use `firebase_get_security_rules` before touching rules.
- Use `firebase_init` to enable a service and `firebase_deploy` to publish. Deployments reach production: only run them when the user explicitly asks, and state exactly which targets (`only`) will be published.
- For Firebase/Google product questions, prefer `developerknowledge_answer_query`, or `developerknowledge_search_documents` followed by `developerknowledge_get_documents` for exact code or configuration; cite the returned `documents/...` sources in the answer instead of relying on memory.
- Never read, print, or transmit `.env`, tokens, or private keys through MCP calls; Firebase client config values stay in environment files.

### General

- Do not deploy, publish, or mutate remote resources without explicit user approval; local, reversible work is done freely.
- If an MCP tool fails, diagnose the cause from its output before retrying with the same arguments; do not loop on failing calls.

## Code organization

- `angular.json` — workspace and builder configuration, including bundle budgets (900 kB warning / 1.4 MB error for the initial bundle).
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json` — TypeScript configuration; `tsconfig.spec.json` registers `vitest/globals`.
- `src/main.ts` — bootstrap entry point.
- `src/index.html`, `src/styles.css` — app shell, global styles, and SEO meta tags (description, Open Graph, Twitter Card, JSON-LD, canonical).
- `public/` — static assets (`favicon.ico`, `robots.txt`).
- `src/app/app.component.*` — root component; renders the router outlet only.
- `src/app/app.config.ts`, `src/app/app.routes.ts` — providers and routing. The shell route is public and renders the top menu; `dashboard` (the default page) and `modules/stamp-tax` are public child routes, while `profile` stays behind `authGuard`. The app registers the `tr-TR` locale and provides `LOCALE_ID`.
- `src/app/core/firebase.ts` — Firebase initialization; exports `firebaseApp`, `auth`, `db`, `storage`, `firebaseConfig`, `isFirebaseConfigured`.
- `src/app/core/auth.service.ts` — Firebase Authentication wrapper (login, register, logout, profile update) with signal-based state.
- `src/app/core/auth.guard.ts` — route guard that redirects unauthenticated users to `/login?returnUrl=...`.
- `src/app/core/auth-errors.ts` — maps Firebase error codes to Turkish messages.
- `src/app/core/seo.service.ts` — sets the page title, meta description/keywords, Open Graph, Twitter Card, and the canonical link for the active page.
- `src/app/core/google-drive.service.ts` — Google Identity Services token flow (`VITE_GOOGLE_CLIENT_ID`, scopes `drive.file` + `email` + `profile`) and Drive API v3 folder creation (`tahakkuk.web.app`); connection info lives in `sessionStorage`.
- `src/app/core/app-info.ts` — exports `APP_VERSION`, read from `package.json`; the footer renders it.
- `src/app/layout/shell.component.*` — responsive frame: flex column with `min-height: 100vh`, so the footer pins to the viewport bottom while content grows; top navigation on desktop, slide-in sidebar on mobile.
- `src/app/layout/footer.component.*` — application footer showing the app name, copyright, and the current version (no navigation links).
- `src/app/features/login/*` — login and account creation form (no module cards).
- `src/app/features/dashboard/*` — dashboard page; contains only the module card grid (5 modules per row on desktop), no summary cards or activity panel.
- `src/app/features/profile/*` — profile details, display name editing, and the "Bağlı hesaplar" panel (Google Drive link status and account info).
- `src/app/features/modules/stamp-tax/*` — public damga vergisi hesaplama module (damga vergisi kesintisi, KDV dahil fatura bedeli, ödenecek tutar).
- `src/environments/environment.ts` — generated from `.env`; never edit or commit it.
- `scripts/generate-env.mjs` — reads `.env` and writes `src/environments/environment.ts`.
- `README.md` — setup and usage guide. `CHANGELOG.md` — change log.

## Development conventions

- TypeScript with strict typing; Angular standalone components (no NgModules).
- Component styles are scoped CSS files; global styles live in `src/styles.css`.
- Angular's default formatting is two-space indentation and single quotes.
- Prefer signals and standalone services over class-field state as the app grows.
- Keep Firebase access behind `src/app/core/firebase.ts`; do not call `initializeApp` elsewhere.
- Route components are lazy-loaded with `loadComponent`; keep new feature routes lazy as well.
- The responsive breakpoint is 900px: desktop shows the top navigation, mobile shows the hamburger button and the slide-in sidebar.
- Angular CLI schematics generate new components, services, and guards; use them instead of hand-rolling boilerplate.
- Major Angular upgrades must be applied one major version at a time (`ng update @angular/cli@20`, then `@21`, then `@22`); multi-major jumps are rejected by the CLI.
- Format money with `Intl.NumberFormat('tr-TR', ...)` or a correctly configured currency pipe; the Turkish output is `₺1.000,00`. Do not pass a locale string in the `digitsInfo` position of `currency`.

## Feature and access rules

- **The dashboard is the default page for everyone.** `/` redirects to `/dashboard`, and the dashboard route is public: guests see the module grid. Only `/profile` stays behind `authGuard`.
- **Profile is invisible to guests.** The "Profil" entry exists only in the top menu and the mobile sidebar for signed-in users; the footer contains no navigation links at all (brand, copyright, version only).
- **The damga vergisi module is a guest feature.** `/modules/stamp-tax` is a child route of the shell, so the top menu and footer stay visible for both guests and signed-in users; it is linked from the dashboard module grid only.
- **The module must not be listed in the top menu or the mobile sidebar.** It is reachable only from the dashboard card (never from the login screen or the menus).
- New public modules follow the same shape: a child route of the shell (so the frame stays consistent), a guest-friendly header with a "Giriş yap" entry, and a card on the dashboard.
- **Google Drive linking requires a signed-in Firebase user and `VITE_GOOGLE_CLIENT_ID`.** Keep token handling inside `GoogleDriveService`; components only call `connect()` / `disconnect()` and render `status`, `info`, `error`. Never request the broad `drive` scope — `drive.file` only — and never persist tokens beyond `sessionStorage`.
- The shell layout must keep the footer pinned to the bottom: `.shell` is a flex column with `min-height: 100vh`, `.content { flex: 1 0 auto; }`, `.footer { margin-top: auto; }`. Do not add fixed positioning to the footer.
- Calculation rules for the module: damga vergisi kesintisi = KDV hariç fatura bedeli × 9,48/1000; KDV dahil fatura bedeli = KDV hariç bedel + KDV bedeli; ödenecek tutar = KDV dahil fatura bedeli − damga vergisi kesintisi − tevkifat kesintisi. KDV bedeli and tevkifat kesintisi are manual inputs.
- Never invent modules, cards, or dashboard entries for functionality that does not exist; show only implemented features. The dashboard intentionally contains only real module cards — no placeholder summary cards or activity list.
- Every new route sets a Turkish `title` in `app.routes.ts` and calls `SeoService.setPage()` with a unique description.

## Environment variables

- The source of truth is the local `.env` file; it is git-ignored and must never be committed.
- `.env.example` is the committed template and uses the same `VITE_FIREBASE_*` and `VITE_GOOGLE_CLIENT_ID` keys.
- `scripts/generate-env.mjs` parses `.env` and generates the typed `environment.ts` consumed by the app.
- Angular does not read `.env` natively, so the generation step must run before any build, serve, or test command.

## Firebase Hosting

- The app deploys to the `tahakkuk` Hosting site of the `tahakkuk-bc03b` project (`firebase.json` → `hosting.target: "tahakkuk"`, applied via `firebase target:apply hosting tahakkuk tahakkuk`); the primary live URL is `https://tahakkuk.web.app`. A second site `https://tahakkuk-bc03b.web.app` exists in the same project.
- `firebase.json` → `hosting.public` is `dist/tahakkuk/browser` (the `@angular/build` application output). Pointing it anywhere else (e.g. `dist`) publishes Firebase's stock "Welcome to Firebase Hosting" page instead of the app.
- `hosting.rewrites` sends every path to `index.html` (SPA routing).
- Both the Firebase **Authorized domains** and the Google Cloud **Authorized JavaScript origins** lists must include `tahakkuk.web.app` for auth and the Google Drive flow to work in production.

## Firebase Authentication

- The project is `tahakkuk-bc03b`. The **Email/Password** provider must be enabled in the Firebase console (Authentication → Sign-in method) for the login form to work.
- Firebase console → Authentication → Settings → **Authorized domains** must contain the deployment domain (localhost is allowed by default in development).
- `AuthService` owns every auth call; components never call the Firebase SDK directly.
- `authGuard` protects the shell route, so `/dashboard` and `/profile` redirect to `/login?returnUrl=...` when there is no session.
- Error codes from Firebase are translated to Turkish in `src/app/core/auth-errors.ts`; add new codes there instead of showing raw messages.

## Google Drive

- Requires a signed-in Firebase user and `VITE_GOOGLE_CLIENT_ID` (Google Cloud OAuth Web client with `http://localhost:4200` and the deployment origin in **Authorized JavaScript origins**; **Google Drive API** enabled).
- Scope is `https://www.googleapis.com/auth/drive.file` plus `email`/`profile` — never the broad `drive` scope.
- On connect the service fetches the Google account email, then finds or creates the `tahakkuk.web.app` folder in the user's Drive root and stores `{ uid, email, folderId, folderUrl, connectedAt }` in `sessionStorage` only.
- The Google token request must pass the signed-in Firebase user's email as `login_hint`, and the returned Google account email must match the Firebase account email (case-insensitive); a mismatch is rejected with `ACCOUNT_MISMATCH`. Drive is always linked to the same account that signed in via Firebase Auth.
- All token/folder logic stays in `src/app/core/google-drive.service.ts`; the profile page only renders `status` / `info` / `error` and calls `connect()` / `disconnect()`.

## Testing instructions

- Tests use Vitest (Angular's `unit-test` builder) and live next to the source as `*.spec.ts`.
- Run the suite once with `npm run test:ci`; it needs no browser because `jsdom` provides the DOM.
- Run a single file with `npm test -- --include='src/app/app.component.spec.ts'`.
- The `pretest:ci` hook regenerates `src/environments/environment.ts` before the run.
- Assertions should target rendered output, not private component internals.
- Components that inject `AuthService` must be tested with a stub provider (`{ user: signal(null) }`), not the real Firebase service.
- Route-level access rules belong in `src/app/app.routes.spec.ts` using `RouterTestingHarness`.
- Components that inject `GoogleDriveService` must be tested with a stub provider (`{ status: signal('disconnected'), busy: signal(false), error: signal(''), info: signal(null), isLinked: signal(false), connect: vi.fn(), disconnect: vi.fn() }`), not the real GIS flow.

## Security considerations

- Never commit `.env`, `.env.local`, credentials, tokens, or private keys.
- Keep secrets in environment variables and document required variables in `.env.example`.
- Firebase web configuration values are client-visible identifiers; still keep them out of version control.
- Keep `package-lock.json` current and review dependency changes before merging.
- Validate and encode untrusted input at system boundaries.

## Guidance for future agents

1. Inspect the current manifests and source before making architectural assumptions.
2. Run commands with Node 24 LTS; older or newer major versions are not the pinned toolchain.
3. Run `npm run test:ci` and `npm run build` before considering a change complete.
4. Update this file when the stack, commands, budgets, or directory layout changes.
5. Update `README.md` and `CHANGELOG.md` together with the behavior change they describe.
6. Follow the token efficiency rules above: search before reading, batch parallel calls, verify once.
7. If a nested directory later contains its own `AGENTS.md`, follow it for that subtree.
