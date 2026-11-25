# AGENTS.md

## Project overview

This repository contains an **Angular 22** single-page application named **Tahakkuk**. Users sign in with **Firebase Authentication** (email/password) and then reach a protected area with an **anasayfa**, a **profile** page, and a **logout** action.

The **Damga Vergisi Hesaplama** module (`/modules/damga-vergisi-modulu`), the **Dosya Modülü** (`/modules/dosya`) and the **Sözleşme Modülü** (`/modules/sozlesme/:recordNumber`) are intentionally public: guests can open them from the anasayfa module cards or by URL without signing in (the contracts module is reached through the Dosya Modülü "Sözleşme Aç" button). Every other feature route stays behind `authGuard`.

The navigation adapts to the viewport: on desktop (≥ 900px) the menu sits in the top bar; on mobile the menu opens as a slide-in panel from the left.

The user-facing language is Turkish. Keep UI text and test names in Turkish unless the product scope changes.

## Runtime and toolchain

- **Node:** v24.22.3 LTS (pinned in `.nvmrc`; nvm default alias is `24`).
- **npm:** 11.19.1 (ships with Node 24.22.3).
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
- `src/app/app.config.ts`, `src/app/app.routes.ts` — providers and routing. The shell route is public and renders the top menu; `anasayfa` (the default page), `modules/damga-vergisi-modulu`, `modules/dosya`, `modules/sozlesme/:recordNumber`, `policy` and `terms` are public child routes, while `profile` stays behind `authGuard`. The app registers the `tr-TR` locale and provides `LOCALE_ID`.
- `src/app/core/firebase.ts` — Firebase initialization; exports `firebaseApp`, `auth`, `db`, `storage`, `firebaseConfig`, `isFirebaseConfigured`.
- `src/app/core/auth.service.ts` — Firebase Authentication wrapper (login, register, logout, profile update) with signal-based state.
- `src/app/core/auth.guard.ts` — route guard that redirects unauthenticated users to `/login?returnUrl=...`.
- `src/app/core/auth-errors.ts` — maps Firebase error codes to Turkish messages.
- `src/app/core/error-handler.ts` — global `ErrorHandler`; yakalanmamış hataları `ErrorLogger` üzerinden konsola yazar.
- `src/app/core/error-logger.ts` — merkezi hata günlüğü (`ErrorLogger` servisi + `writeErrorLog`); tüm hatalar `[Tahakkuk] [HATA]/[UYARI] <bağlam> | <zaman damgası> | <hata>` biçiminde konsola yazılır, Firebase hata kodu ve ek ayrıntılar ayrı argüman olarak eklenir.
- `src/app/core/global-error-listeners.ts` — `window.onerror` ve `unhandledrejection` dinleyicileri; `main.ts` içinde bootstrap öncesinde kurulur.
- Every `catch` block that swallows an error must also log it through `ErrorLogger` (`error()` / `warn()`); raw `console.*` calls are only allowed inside `error-logger.ts`.
- `src/app/core/seo.service.ts` — sets the page title, meta description/keywords, Open Graph, Twitter Card, and the canonical link for the active page.
- `src/app/core/google-drive.service.ts` — Google Identity Services token flow (`VITE_GOOGLE_CLIENT_ID`, scopes `drive.file` + `email` + `profile`), Drive API v3 folder creation (`tahakkuk.web.app`), `connectAfterSignIn()` auto-connect on sign-in, and the Google Sheets read/write layer (`writeSheet` full rewrite / `loadSheetRows` via `values:get`) for the "dosyalar" and "sözleşmeler" sheets; access tokens stay in memory only, the link metadata stays in `localStorage` across sign-out (removed only by manual `disconnect()` or a different user restoring over it).
- `src/app/core/idle-timeout.service.ts` — 30-minute inactivity timeout: user interactions (pointer/keyboard/touch/wheel) reset the timer; on expiry the session is closed via `AuthService.logout()` and the user is sent to `/login?reason=idle`.
- `src/app/core/app-info.ts` — exports `APP_VERSION`, read from `package.json`; the footer renders it.
- `src/app/layout/shell.component.*` — responsive frame: flex column with `min-height: 100vh`, so the footer pins to the viewport bottom while content grows; top navigation on desktop, slide-in sidebar on mobile.
- `src/app/layout/footer.component.*` — application footer showing the app name, copyright, and the current version (no navigation links).
- `src/app/features/login/*` — login form (email/password **and** Google popup sign-in) and account creation (no module cards).
- `src/app/features/home/*` — public anasayfa (`/anasayfa`): two module-grid cards — **Ana Modüller** (Dosya Modülü, with a Sözleşme Modülü intro entry below it) on top and **Yardımcı Modüller** (Damga Vergisi Hesaplama) below.
- `src/app/features/profile/*` — profile details, display name editing, and the "Bağlı hesaplar" panel (Google Drive link status and account info).
- `src/app/features/legal/*` — public legal pages: `policy.component.*` (`/policy`, privacy policy) and `terms.component.*` (`/terms`, terms of service); guest-accessible shell children used for OAuth consent screen verification links.
- `src/app/features/modules/documents/*` — public Dosya Modülü (`/modules/dosya`): record list, simple menu (Yeni kayıt / Düzenle / Sil, plus `Google Drive'a bağlan` only when the session token cannot be silently refreshed), modal dialogs (record picker + record form), `document.schema.json` validation source, `documents.service.ts` (localStorage-backed records, cleared on sign-out, auto-mirrors every add/update/remove to the Drive "dosyalar" sheet), unique `REC-000001`-style record numbers (`Sıra No` column, dedup/sort key), "Sözleşme Aç" button per record that navigates to the contracts module. Drive "dosyalar" sheet is written header-first as a full rewrite through `GoogleDriveService.writeSheet()` and read back through `GoogleDriveService.loadSheetRows()` (header row skipped); an effect triggers the load automatically when the module opens and the Drive link is present.
- `src/app/features/modules/contracts/*` — public Sözleşme Modülü (`/modules/sozlesme/:recordNumber`, reachable only via the Dosya Modülü "Sözleşme Aç" button): record summary panel, contract list for the record, contract form modal (firma adı, vergi no 10–11 digits, Türkçe tutar, `YYYY-AA-GG` tarih), `SOZ-000001`-style contract ids, `contract-record.ts` (validation, `parseTutar`, sheet row mapping, sorting), `contracts.service` yok — state lives in the component; contracts mirror to the Drive "sözleşmeler" sheet with `writeSheet()` full rewrites on add/delete and auto-load on open (`loadSheetRows`).
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

- **The anasayfa is the default page for everyone.** `/` redirects to `/anasayfa`, and the anasayfa route is public: guests see the module grids. Only `/profile` stays behind `authGuard`.
- **Profile is invisible to guests.** The "Profil" entry exists only in the top menu and the mobile sidebar for signed-in users; the footer contains no navigation links at all (brand, copyright, version only).
- **The damga vergisi module is a guest feature.** `/modules/damga-vergisi-modulu` is a child route of the shell, so the top menu and footer stay visible for both guests and signed-in users; it is linked from the anasayfa yardımcı modül card only.
- **The modules must not be listed in the top menu or the mobile sidebar.** They are reachable only from the anasayfa cards (never from the login screen or the menus).
- New public modules follow the same shape: a child route of the shell (so the frame stays consistent), a guest-friendly header with a "Giriş yap" entry, and a card on the anasayfa (main-module card for ana modules, helper card for yardımcı modules).
- **Google Drive linking requires a signed-in Firebase user and `VITE_GOOGLE_CLIENT_ID`.** Signing in auto-connects (`connectAfterSignIn()` in `AppComponent`): stored link → silent token refresh, first time → interactive consent window. Keep token handling inside `GoogleDriveService`; components only call `connect()` / `disconnect()` and render `status`, `info`, `error`. Never request the broad `drive` scope — `drive.file` only — and never persist tokens (memory only).
- **Drive sheets are full rewrites, not appends.** Every documents/contracts change calls `writeSheet(sheetName, header, rows)` which clears `A:ZZ` and rewrites header + rows; reads go through `loadSheetRows(sheetName, header)`. Do not reintroduce "Drive'a Kaydet"/"Drive'dan Yükle" buttons — mirroring is automatic on record change and loading is automatic on module open.
- The shell layout must keep the footer pinned to the bottom: `.shell` is a flex column with `min-height: 100vh`, `.content { flex: 1 0 auto; }`, `.footer { margin-top: auto; }`. Do not add fixed positioning to the footer.
- Calculation rules for the module: damga vergisi kesintisi = KDV hariç fatura bedeli × 9,48/1000; KDV dahil fatura bedeli = KDV hariç bedel + KDV bedeli; ödenecek tutar = KDV dahil fatura bedeli − damga vergisi kesintisi − tevkifat kesintisi. KDV bedeli and tevkifat kesintisi are manual inputs.
- Never invent modules, cards, or module entries for functionality that does not exist; show only implemented features. The anasayfa intentionally contains only real module cards — no placeholder summary cards or activity list.
- Every new route sets a Turkish `title` in `app.routes.ts` and calls `SeoService.setPage()` with a unique description.
- **Idle session timeout (30 minutes).** `IdleTimeoutService` (instantiated in `AppComponent`) watches pointer/keyboard/touch/wheel activity while a user is signed in; 30 minutes without activity closes the session via `AuthService.logout()` and redirects to `/login?reason=idle` (login page shows a Turkish notice). Sign-out clears every `tahakkuk.*` browser key except `tahakkuk.driveLink`, so the Drive link survives sign-out and is restored on the next sign-in of the same user.

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

- The project is `tahakkuk-bc03b`. The **Email/Password** and **Google** providers must be enabled in the Firebase console (Authentication → Sign-in method) for the login form to work; the Google button uses `signInWithPopup` (Firebase's own OAuth flow, no Cloud Console client id needed).
- Firebase console → Authentication → Settings → **Authorized domains** must contain the deployment domain (localhost is allowed by default in development).
- `AuthService` owns every auth call; components never call the Firebase SDK directly.
- `authGuard` protects the shell route, so `/anasayfa` and `/profile` redirect to `/login?returnUrl=...` when there is no session.
- Error codes from Firebase are translated to Turkish in `src/app/core/auth-errors.ts`; add new codes there instead of showing raw messages.

## Google Drive

- Requires a signed-in Firebase user and `VITE_GOOGLE_CLIENT_ID` (Google Cloud OAuth Web client with `http://localhost:4200` and the deployment origin in **Authorized JavaScript origins**; **Google Drive API** and **Google Sheets API** enabled).
- Scope is `https://www.googleapis.com/auth/drive.file` plus `email`/`profile` — never the broad `drive` scope.
- On connect the service fetches the Google account email, then finds or creates the `tahakkuk.web.app` folder in the user's Drive root and stores `{ uid, email, folderId, folderUrl, connectedAt }` in `localStorage` while the Firebase session lives (page reload / new tab keep the link open); access tokens are never persisted (memory only). Sign-out removes the key.
- Access tokens live in memory only, so a page reload drops the token while the link record stays. `GoogleDriveService.silentConnect()` re-acquires it silently with `prompt: 'none'` (15s timeout, no UI); modules use it to auto-load their sheets when they open after a reload, and show the connect button (`hasSessionToken`) again when the silent refresh fails. **Signing in auto-connects Drive**: `AppComponent` runs an effect that calls `connectAfterSignIn()` on every new Firebase user — stored link → silent token refresh, no stored link → interactive consent window.
- Drive sheet writes are full rewrites: `writeSheet(sheetName, header, rows)` finds or creates the sheet (in the `tahakkuk.web.app` folder), clears `A:ZZ`, then writes header + all rows through the Sheets API (`values/A1` PUT, `valueInputOption=RAW`) — so deletes disappear from the sheet too. `loadSheetRows(sheetName, header)` reads `A:ZZ` via `values:get` and drops the leading header row when it matches. Sheet names: `dosyalar` (documents), `sözleşmeler` (contracts). `resolveSheetToken()` silently refreshes the token before reads/writes or throws `SESSION_TOKEN_REQUIRED`. All inside `drive.file` scope, no extra scopes. The dated rows written before the `RAW` switch are normalized to `YYYY-AA-GG` in `fromSheetRow()`.
- The GIS script is loaded from `src/index.html`; if it is not ready when the button is pressed, the service waits up to 20s, then removes the stale `<script>` tag and retries once more (two attempts total).
- Any signed-in Google account may be linked, regardless of the Firebase account email (the Google window is opened without `login_hint`, so a new Google account can also be created there); the signed-in Google account's email is what is displayed and persisted.
- All token/folder logic stays in `src/app/core/google-drive.service.ts`; the profile page only renders `status` / `info` / `error` and calls `connect()` / `disconnect()`.
- On sign-out, `AuthService.logout()` removes every app-owned browser key (`tahakkuk.` prefix in `sessionStorage`/`localStorage`) and the drive service resets its `status`/`info` signals when the auth user becomes `null` (sign-out, session expiry, or another tab).

## Testing instructions

- Tests use Vitest (Angular's `unit-test` builder) and live next to the source as `*.spec.ts`.
- Run the suite once with `npm run test:ci`; it needs no browser because `jsdom` provides the DOM.
- Run a single file with `npm test -- --include='src/app/app.component.spec.ts'`.
- The `pretest:ci` hook regenerates `src/environments/environment.ts` before the run.
- Assertions should target rendered output, not private component internals.
- Components that inject `AuthService` must be tested with a stub provider (`{ user: signal(null) }`), not the real Firebase service.
- Route-level access rules belong in `src/app/app.routes.spec.ts` using `RouterTestingHarness`.
- Components that inject `GoogleDriveService` must be tested with a stub provider (`{ status: signal('disconnected'), busy: signal(false), error: signal(''), info: signal(null), isLinked: signal(false), hasSessionToken: signal(false), connect: vi.fn(), disconnect: vi.fn(), loadSheetRows: vi.fn(), writeSheet: vi.fn() }`), not the real GIS flow.

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
