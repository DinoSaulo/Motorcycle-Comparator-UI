# Security Audit — Motorcycle Comparator UI (frontend)

**Scope:** static analysis of the React SPA in `src/` at
`c:\Users\saulo\projects\Motorcycle-Comparator-UI`, plus `npm audit` of the dependency
tree. No requests were made against a live server; nothing here touches the backend at
`C:\Users\saulo\projects\Motorcycle-Comparator-API` or `http://localhost:8080`.

**Method:** every finding below was verified by reading the actual file cited. Nothing
is reported from generic OWASP checklists alone, and nothing that belongs to the
backend (auth issuance, bean validation, persistence, CORS policy) is repeated here —
per `CLAUDE.md` §3, the backend contract is the source of truth for those, not this
document. Where a category was checked and nothing was found, that is stated
explicitly as "No issue found" — an empty category is a valid, useful result.

> ## Remediation status — all five findings fixed
>
> Sections 1–4 below are the **point-in-time audit**, written before any fix. They
> describe the code as it stood at the time of the review; read them as the record of
> what was found, not as the current state of the tree. Every finding has since been
> remediated:
>
> | ID | Status | Where the fix lives |
> |----|--------|---------------------|
> | SEC-001 | Fixed — approach changed | Token moved to a module-level variable in `src/services/api.js`; `src/services/authService.js` persists only `{username, roles, expiresAt}` to `sessionStorage` and purges the pre-fix `localStorage` keys |
> | SEC-002 | Fixed | `hasExpired` fails closed and `parseStoredSession` shape-validates in `src/services/authService.js`; `src/hooks/useAuth.jsx` routes its expiry effect through `hasExpired` |
> | SEC-003 | Fixed, with a documented gap | CSP + `referrer` meta tags in `index.html` |
> | SEC-004 | Fixed | 2–4 id guard added to `compareMotorcycles` in `src/services/motorcycleService.js` |
> | SEC-005 | Fixed | `encodeURIComponent` on all six id/slug interpolations in `src/services/motorcycleService.js` |
>
> **SEC-001 was fixed by a different approach than §4 proposes.** The plan below
> recommends an httpOnly cookie, which needs a coordinated backend change. The approach
> actually taken — an in-memory token — was chosen deliberately because it requires no
> backend work. Its accepted cost is that **a page reload signs the administrator out**.
>
> **Residual gap on SEC-003:** the shipped `script-src` still allows `'unsafe-inline'`,
> because one static `index.html` serves both `vite dev` (which injects an inline Fast
> Refresh preamble) and the production bundle. That allowance is what a CSP mainly
> defends against, so the policy's anti-XSS value is limited until `script-src 'self'`
> is set as a real HTTP response header at the deployment edge. `frame-ancestors` is
> likewise absent by necessity — it is ignored in a `<meta>` policy and must be an HTTP
> header. Both are noted in the comment in `index.html`.
>
> **Test evidence, measured independently after the fixes:** `npx vitest run
> --pool=vmThreads` → **618 tests, 584 passed, 34 failed**. All 8 `*.security.test.*`
> files pass. The 34 failures are confined to `LoginForm.test.jsx` and
> `SearchBar.test.jsx`, all with `mockReturnValue/mockResolvedValue is not a function` —
> a `vi.mock` artifact of the `vmThreads` pool, unrelated to any finding here. It is
> intermittent: some runs report zero such failures. `npm run build` succeeds.
>
> **Known blocker — the default test pool does not run at all.** `npm test` fails
> collection on all 45 files with `Vitest failed to find the runner`, under Node 24.19.0
> + Vitest 4.1.11 on Windows. This predates the audit and is unrelated to it. Ruled out
> by bisection: corrupt install, Vite version (7 and 8 both fail), `@vitejs/plugin-react`
> version, `npx` resolution, project config (a bare two-line test with no plugins and no
> setup file fails identically), and worker topology (`singleFork`, `singleThread`,
> `maxForks:1`, `fileParallelism:false`). Only `--pool=vmThreads` executes. Vitest
> 4.1.11 is the latest stable, so the untested remaining lever is the Node version —
> `.github/workflows/ci.yml` pins Node 24 on all three jobs and may be affected.
> **Consequence: these security tests have never been verified on the pool CI uses.**

**Test evidence (at time of audit, pre-fix):** `npm test` (`vitest run`) — **591 passed,
1 failed** (that one failure was intentional; see SEC-001). Full run: 592 tests across
45 files, including the 8 new security test files listed in
[Section 3](#3-automated-security-tests).

---

## 1. Findings

| ID | Title | Severity | Location |
|----|-------|----------|----------|
| SEC-001 | Admin JWT and session persisted in `localStorage` | Medium (hardening) | `src/services/api.js:16,71-91`, `src/services/authService.js:4,39-69` |
| SEC-002 | Admin route/UI gate trusts unsigned client-stored session data | Informational | `src/hooks/useAuth.jsx:14,43-53`, `src/services/authService.js:39-55`, `src/pages/AdminPage.jsx:18-30`, `src/pages/AdminMotorcycleFormPage.jsx:20-38` |
| SEC-003 | No Content-Security-Policy / clickjacking header configured | Medium (hardening) | `index.html:1-14` (whole file), repo root (no `_headers`/`netlify.toml`/`vercel.json`) |
| SEC-004 | `compareMotorcycles` has no built-in 2–4 id guard (hook-only enforcement) | Informational (hardening) | `src/services/motorcycleService.js:66-72` |
| SEC-005 | Path segments (`id`, `slug`) interpolated into API URLs without `encodeURIComponent` | Informational (hardening) | `src/services/motorcycleService.js:46-54,86-93,106-124` |

No CVSS score is given for a pure "Informational" entry with no demonstrable
confidentiality/integrity/availability impact (SEC-002, SEC-004, SEC-005); a CVSS
vector is given for SEC-001 and SEC-003 with an explicit caveat about the
prerequisites the scenario assumes.

---

### SEC-001 — Admin JWT and full session persisted in `localStorage`

**Severity:** Medium (hardening / defense-in-depth — not an actively exploitable
vulnerability in this codebase today; see caveat below)
**CVSS 3.1:** `AV:N/AC:H/PR:N/UI:R/S:C/C:H/I:N/A:N` — **6.1**
*(This score models the standard "XSS steals the token from Web Storage" scenario.
It assumes an attacker can already run script on the page — i.e. it is a chained
score. This audit found no exploitable XSS sink anywhere in `src/` — see the
static-analysis results under SEC-003's "no issue found" list and
`src/testing/staticSecurityAnalysis.security.test.js`. Treat this as a
defense-in-depth priority, not an active incident.)*

**Files / lines:**
- `src/services/api.js:16` — `export const AUTH_TOKEN_KEY = 'motorcycle-comparator.token';`
- `src/services/api.js:71-91` — `getStoredToken()` / `setStoredToken()` read/write `window.localStorage`
- `src/services/authService.js:4` — `const SESSION_KEY = 'motorcycle-comparator.session';`
- `src/services/authService.js:63-69` — `saveSession()` writes the **entire** login response, including `accessToken`, to `localStorage`

```js
// src/services/authService.js:12-17
export async function login({ username, password }) {
  const { data } = await api.post('/auth/login', { username, password });
  setStoredToken(data.accessToken);
  saveSession(data);
  return data;
}
```

**Why it's exploitable in this app:** `window.localStorage` has no origin-script
restriction beyond same-origin — any JavaScript that executes on
`http://localhost:5173` (or wherever this SPA is deployed) can read
`localStorage.getItem('motorcycle-comparator.token')` and exfiltrate the live admin
bearer token, e.g. to an attacker's server via `fetch()`, with a one-line payload. An
`httpOnly` cookie issued by the API would not be readable this way at all. Today,
reaching that payload requires an XSS bug this audit did not find (no
`dangerouslySetInnerHTML`, no `innerHTML =`, no `eval`, all rendering goes through
React's escaped JSX). The risk is real but **latent**: it activates the moment any
future dependency, browser extension interaction, or copy-pasted snippet introduces
an XSS sink.

**Regression test:** `src/services/tokenStorage.security.test.js`
- Test 1 ("documents current behaviour…") **passes** — confirms the token is written
  to `localStorage` today.
- Test 2 ("FAILS TODAY (SEC-001)…") **fails** — it encodes the secure invariant
  (`getStoredToken()` should be `null`) and is failing against the real
  implementation, proving this finding. **Keep this test red** until the remediation
  below ships; do not delete it to make CI green.

**Remediation:** see [Section 4, item 1](#4-remediation-plan-for-reactspecialist).

---

### SEC-002 — Admin route/UI gate trusts unsigned client-stored session data

**Severity:** Informational (no demonstrated confidentiality/integrity/availability
impact through the frontend alone)

**Files / lines:**
- `src/services/authService.js:39-55` — `restoreSession()` parses whatever JSON is
  under `SESSION_KEY` and trusts `session.roles` outright; the only checks are "is it
  parseable JSON" and "has `expiresAt` passed" — there is no signature verification
  (correct, since a JWT can't be verified without the server's key, and the code
  never attempts to).
- `src/hooks/useAuth.jsx:14,43-53` — `AuthProvider` seeds `session` from
  `restoreSession()` and derives `isAuthenticated`/`isAdmin` straight from it.
- `src/pages/AdminPage.jsx:18-30` and `src/pages/AdminMotorcycleFormPage.jsx:20-38` —
  both gate purely on `useAuth()`'s `isAuthenticated`/`isAdmin`, with no server
  round-trip to confirm the session is real before rendering the privileged screen.

```js
// src/services/authService.js:39-55
export function restoreSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session?.accessToken || hasExpired(session.expiresAt)) {
      logout();
      return null;
    }
    return session;
  } catch {
    logout();
    return null;
  }
}
```

**Why it's exploitable in this app:** any visitor can open devtools and run
`localStorage.setItem('motorcycle-comparator.session', JSON.stringify({accessToken:'x', roles:['ROLE_ADMIN'], expiresAt: '<future date>'}))`
plus the matching `motorcycle-comparator.token`, reload, and land on `/admin` or
`/admin/motorcycles/new` with the full admin UI rendered — **without ever calling
`/auth/login`**. This is proven by
`src/hooks/useAuth.security.test.jsx` and `src/routes/AppRoutes.security.test.jsx`
(both pass — they demonstrate the behaviour, not a broken invariant). It is also
implicitly already exercised by the pre-existing
`src/hooks/useAuth.test.jsx` test "restores a valid stored session on mount", which
seeds `localStorage` directly and gets `isAdmin: true` back.

This is flagged **Informational, not a vulnerability**, for two reasons verified
during this audit:
1. Every write endpoint the UI calls (`createMotorcycle`, `updateMotorcycle`,
   `deleteMotorcycle`, `uploadMotorcycleImage`, `deleteMotorcycleImage` in
   `src/services/motorcycleService.js`) sends the forged token as
   `Authorization: Bearer <forged>` via the request interceptor in `api.js:93-99` —
   a real backend will reject an invalid/unsigned JWT with 401/403, which the
   response interceptor already handles by dropping the token (`api.js:126-129`).
   This audit cannot verify the backend's behaviour (out of scope), but per
   `CLAUDE.md` "the server remains the only authority", so no privileged mutation is
   expected to actually succeed.
2. The data an unauthorized visitor sees on the forged `/admin` dashboard (brand,
   model, price, image, slug) is identical to what `GET /motorcycles` already returns
   to any anonymous visitor on the public catalogue — there is no additional
   confidentiality exposure.

This is an inherent property of any pure client-side SPA gate (there is no way for
JavaScript in the browser to verify a JWT's signature without either the server's
public key or a round trip), so it is documented rather than scored as a fixable bug.

**Regression tests:** `src/hooks/useAuth.security.test.jsx`,
`src/routes/AppRoutes.security.test.jsx` (both pass, and would fail if a future
change silently required the API for this state to be reached — a useful trip-wire
even though the current behaviour is expected).

---

### SEC-003 — No Content-Security-Policy / clickjacking protection configured

**Severity:** Medium (hardening)
**CVSS 3.1:** `AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N` — **4.3** (models the clickjacking
class of impact from a missing frame-ancestors/X-Frame-Options policy)

**Files:**
- `index.html:1-14` — full `<head>`, no `<meta http-equiv="Content-Security-Policy">`
  tag.
- Repo root — no `_headers`, `netlify.toml`, `vercel.json`, or any other
  hosting-header configuration file exists anywhere in this repository (confirmed via
  a full-tree search).
- `vite.config.js` — no `server.headers` / `preview.headers` configuration either.

```html
<!-- index.html:1-14, verbatim -->
<!doctype html>
<html lang="pt" class="h-full">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="Browse motorcycles and compare their engine, chassis and dimension specifications side by side."
    />
    <title>Motorcycle Comparator</title>
  </head>
  <body class="h-full">
    <div id="root" class="h-full"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Why it's exploitable in this app:** as shipped, whatever serves this build (the CI
pipeline in `.github/workflows/ci.yml` only runs `npm run build`; nothing in this
repo sets response headers for the built output) will not send
`Content-Security-Policy`, `X-Frame-Options`, or `X-Content-Type-Options` unless the
hosting platform adds them out-of-band. Concretely: the admin login page
(`/admin`, rendering `LoginForm`) could be iframed by an attacker-controlled page and
clickjacked into submitting real admin credentials, and there is no CSP to restrict
where scripts/styles/images may load from as a defense-in-depth backstop if an XSS is
ever introduced (see SEC-001's caveat).

Note the honest limits of an in-repo fix: `X-Frame-Options` and
`Strict-Transport-Security` **cannot** be set via an HTML `<meta>` tag — only
`Content-Security-Policy` (via `frame-ancestors` and other directives) can be
partially mitigated from `index.html` alone; the rest genuinely needs hosting-level
configuration outside this repo's current scope.

**No dedicated test was added for this finding** — it is a missing-configuration gap
in static markup/build config, not application logic; the fix is a config change
(see remediation plan) rather than something a unit test meaningfully regresses
against in this test runner.

---

### SEC-004 — `compareMotorcycles` has no built-in 2–4 id guard

**Severity:** Informational (hardening, not a vulnerability — the backend rejects an
out-of-range request with a 400 regardless)

**Files / lines:** `src/services/motorcycleService.js:66-72`

```js
// src/services/motorcycleService.js:66-72
export async function compareMotorcycles(ids, { signal } = {}) {
  const { data } = await api.get('/motorcycles/compare', {
    params: { ids: ids.join(',') },
    signal,
  });
  return data;
}
```

**Why it's worth noting:** the 2–4 bound documented in `CLAUDE.md` §3 ("Comparison
takes 2–4 ids. Do not issue a request outside that range.") is correctly enforced
today, but only one layer up, in `useComparison` /
`useComparisonSelection` (`src/hooks/useMotorcycles.js:97-165`) — confirmed correct
by this audit and locked in by
`src/hooks/useMotorcycles.security.test.jsx`. The service function itself performs no
such check. Every current call site in the app goes through the hook, so this is not
exploitable today, but it means the guard is one hook away from being silently
bypassed by a future caller (a new page, a script, a console one-liner during
debugging) that calls `compareMotorcycles` directly.

**Regression test:** `src/services/motorcycleService.security.test.js` — passes,
documenting that the service function still issues the request for 6 ids. Update this
test if the guard is later pushed down into the service function.

---

### SEC-005 — Path segments not URI-encoded before insertion into API URLs

**Severity:** Informational (hardening; no exploitation path found — the browser's
address bar already gives a user full control over their own request, so there is no
attacker-controlled input this could turn into a *cross-user* attack)

**Files / lines:**
- `src/services/motorcycleService.js:46-49` — `getMotorcycleById(id)`:
  `` api.get(`/motorcycles/${id}`, ...) ``
- `src/services/motorcycleService.js:52-55` — `getMotorcycleBySlug(slug)`:
  `` api.get(`/motorcycles/slug/${slug}`, ...) ``
- `src/services/motorcycleService.js:86-93` — `updateMotorcycle(id, ...)`,
  `deleteMotorcycle(id)`
- `src/services/motorcycleService.js:106-124` — `uploadMotorcycleImage(id, ...)`,
  `deleteMotorcycleImage(id)`

None of these wrap `id`/`slug` in `encodeURIComponent()` before template-literal
interpolation. `id` reaches these functions from `useParams()`
(`src/pages/MotorcycleDetailPage.jsx:90`,
`src/pages/AdminMotorcycleFormPage.jsx:22`), i.e. straight from the URL path,
unvalidated for shape (not even checked to be numeric, unlike the comparison ids in
SEC-004's neighbourhood).

**Why this is Informational rather than a vulnerability:** the value is not
attacker-supplied in a way that crosses a trust boundary — a user already fully
controls their own browser's address bar and could hand-craft any request this would
produce directly. There is no reflected/stored injection path from one user's input
into another user's request. This is a robustness/hygiene finding: a slug or id
containing `/`, `?`, `#`, or non-ASCII characters could produce a malformed or
unintended request path instead of a clean 404, which is a correctness issue more
than a security one.

**No dedicated test was added** — there is no security invariant to regress against
without a genuine exploitation scenario; flagged for the remediation plan as cheap,
low-risk hardening.

---

## 2. Categories checked with no issue found

Each of these was verified directly against the source, not assumed:

- **`dangerouslySetInnerHTML` / `innerHTML =` / `outerHTML =` / `eval()` / `new Function()`** —
  none found anywhere in `src/` (full-tree grep, confirmed again by the automated
  static-analysis suite below). Every dynamic string in the app — search results,
  comparison values, admin-authored "additional specs", API error messages — is
  rendered through plain JSX text nodes, which React escapes by default.
- **`twemoji` usage** (`src/components/common/LanguageSwitcher.jsx`) — only
  `twemoji.convert.toCodePoint()` is used, a pure string function with no DOM
  mutation. The library's DOM-rewriting `twemoji.parse()` (which does use
  `innerHTML`) is never imported or called.
- **Open redirect** — no code reads a redirect target from a query
  parameter/user input and hands it to `window.location` or `navigate()`. The one
  `window.location.href = '/'` assignment
  (`src/pages/MotorcycleDetailPage.jsx:73`) is a hardcoded fallback in a "go back"
  button, not attacker-influenced.
- **`target="_blank"` without `rel="noopener noreferrer"`** — there is no
  `target="_blank"` anywhere in `src/` at all.
- **Prototype pollution via the admin "additional specs" key/value editor**
  (`src/components/admin/AdditionalSpecsEditor.jsx`,
  `src/utils/motorcycleForm.js:325-329`) — `toPayload` collapses entries with
  `Object.fromEntries`, which creates a normal own data property named `__proto__`
  rather than reassigning the object's prototype. Verified and locked in by
  `src/utils/motorcycleForm.security.test.js`.
- **`resolveImageUrl` and `javascript:`/`vbscript:` URIs**
  (`src/services/api.js:44-50`) — a value like `javascript:alert(1)` does not match
  the function's `https?://` / protocol-relative / `data:` allow-branches, so it
  falls into the string-concatenation branch and comes back as
  `http://localhost:8080/javascript:alert(1)` — inert as an `<img src>`. Verified and
  locked in by `src/services/api.security.test.js`. (`resolveImageUrl` *does*
  deliberately pass real `http(s)://` and protocol-relative URLs through untouched —
  this is documented, intended behaviour for "curated external links", and today
  there is no UI path for even an admin to type an arbitrary external `imageUrl`:
  it is only ever set by the trusted, host-relative value the upload endpoint
  returns, or cleared to `null` — `imageUrl` is not one of the editable
  `IDENTITY_FIELDS` in `src/utils/motorcycleForm.js`.)
- **Comparison endpoint's 2–4 id constraint** — correctly enforced before any
  request leaves the browser, at both the URL-parsing layer
  (`useComparisonSelection` drops anything that isn't `/^\d+$/`,
  `src/hooks/useMotorcycles.js:142-149`) and the request-gating layer
  (`useComparison` skips the fetch entirely outside `[COMPARISON_MIN, COMPARISON_MAX]`,
  `src/hooks/useMotorcycles.js:97-133`). See SEC-004 for the one related hardening
  note (enforcement lives in the hook, not the service function).
- **Upload `Content-Type` header** — the shared axios instance
  (`src/services/api.js:18-24`) sets no default `Content-Type`, and
  `uploadMotorcycleImage` (`src/services/motorcycleService.js:106-118`) does not set
  one either, exactly as `CLAUDE.md` §3 requires ("Never set a Content-Type for
  uploads"). Locked in by `src/services/api.security.test.js`.
- **API error normalisation leaking the raw response** — `ApiRequestError`
  (`src/services/api.js:56-69`) only ever carries `message`, `status`, `violations`,
  and `path`; the response interceptor (`api.js:101-140`) never attaches the raw
  axios `response`, `request`, or `config` objects to the thrown error, so a
  component can never accidentally render a raw server body, headers, or stack
  trace. Locked in by `src/services/api.security.test.js`.
- **Hardcoded secrets / API keys in source** — none found. `.env.example`
  (tracked) contains only the public default `VITE_API_BASE_URL=http://localhost:8080/api/v1`.
  `.env` and `.env.*` (except `.env.example`) are excluded via `.gitignore:75-76`.
  No AWS-style keys, private key blocks, or literal `secret`/`password`/`apiKey`
  assignments exist in application code (the only "password"-adjacent string is the
  UI label `password: 'Password'` in `src/i18n/translations/en.js:178`, a translation
  string, not a credential). Confirmed by the static-analysis suite.
- **Dependency vulnerabilities** — `npm audit --json` reports
  `{"info":0,"low":0,"moderate":0,"high":0,"critical":0,"total":0}` against the
  installed lockfile. No actionable findings.
- **Source map exposure** — `vite.config.js` sets no `build.sourcemap` option, so
  Vite's default (`false` for production builds) applies; no explicit override
  enables source maps in the shipped bundle.
- **Sensitive data in `console.*`** — the only `console.*` call in application code
  is `console.error('Unhandled rendering error', error, errorInfo)` in
  `src/components/common/ErrorBoundary.jsx:45`, which logs a caught render exception
  to the *user's own* browser console (same-origin, same-user) — not a leak to a
  third party, and not logging credentials or API responses. No `console.log` of
  tokens, passwords, or API payloads exists anywhere in `src/`.
- **Route protection for `/admin*` in the absence of a session** — confirmed correct:
  `AppRoutes.test.jsx`'s existing "shows the login form on an admin route when there
  is no session" test proves an anonymous visitor at `/admin/motorcycles/new` sees the
  login form and **zero** API calls are made. The only gap is the client-side-trust
  property covered separately as SEC-002.

---

## 3. Automated security tests

All tests were added in the project's existing framework (Vitest + Testing Library +
`axios-mock-adapter`), colocated next to the code they exercise, following the exact
conventions already used by `*.test.js(x)` in this repo (`renderWithProviders`,
`mockApi`, `buildSession`/`buildMotorcycle`/`buildComparison` fixtures). No new test
framework or dependency was introduced. Every file is suffixed `.security.test.js(x)`
so it is easy to find as a set, while still matching Vitest's default
`*.test.{js,jsx}` discovery (and therefore `npm test` / `npm run test:unit`).

| File | Maps to | Result |
|------|---------|--------|
| `src/services/tokenStorage.security.test.js` | SEC-001 | 1 pass (documents behaviour), **1 fail (proves the finding)** |
| `src/services/api.security.test.js` | "No issue found": error normalisation, `resolveImageUrl` scheme neutralisation, no default `Content-Type` | 4 pass |
| `src/hooks/useAuth.security.test.jsx` | SEC-002 | 1 pass (demonstrates the gate can be bypassed) |
| `src/routes/AppRoutes.security.test.jsx` | SEC-002 (route-level) | 1 pass |
| `src/utils/motorcycleForm.security.test.js` | "No issue found": prototype pollution via additional specs | 1 pass |
| `src/hooks/useMotorcycles.security.test.jsx` | "No issue found": comparison id bound + id sanitisation | 6 pass |
| `src/services/motorcycleService.security.test.js` | SEC-004 | 1 pass (documents the gap) |
| `src/testing/staticSecurityAnalysis.security.test.js` | Section 2 static-analysis claims (no `dangerouslySetInnerHTML`, no `eval`, no unsafe `target="_blank"`, no hardcoded secrets) | 5 pass |

**Full suite result (`npm test`):** `Test Files 1 failed | 44 passed (45)` /
`Tests 1 failed | 591 passed (592)`.

The single failing test, `src/services/tokenStorage.security.test.js > SEC-001…
FAILS TODAY`, is failing **on purpose** — it asserts the secure invariant
(`getStoredToken()` returns `null`) against code that, by design, stores the token in
`localStorage`. This is not a flaky or mistaken test: it is the proof for finding
SEC-001. Per the task brief, it has been kept in the suite rather than removed or
weakened. If `react-specialist` implements the SEC-001 remediation
(httpOnly-cookie-backed auth, or equivalent), this test will start passing and can
then be merged into the "documents current behaviour" test above.

---

## 4. Remediation plan (for `react-specialist`)

Instructions only — **no file under `src/` was modified by this audit.**

1. **SEC-001 — stop persisting the bearer token in `localStorage`.**
   - `src/services/api.js`: remove `AUTH_TOKEN_KEY`, `getStoredToken`,
     `setStoredToken`, and the `window.localStorage` calls inside them
     (lines 16, 71-91). Replace the request interceptor at lines 93-99 — instead of
     reading a token from storage and setting the `Authorization` header manually,
     rely on the browser sending an `httpOnly`, `Secure`, `SameSite=Strict` (or
     `Lax`, depending on the deployment topology) session cookie automatically; add
     `withCredentials: true` to the `axios.create({...})` config at lines 18-24 so
     cookies are sent cross-origin between the Vite dev server (`:5173`) and the API
     (`:8080`).
     *This requires a coordinated backend change (issue the token as a cookie from
     `POST /auth/login` instead of/in addition to a JSON body field) — flag this as a
     cross-repo dependency before implementing.*
   - `src/services/authService.js`: drop `SESSION_KEY`/`saveSession`/the
     `window.localStorage.setItem(SESSION_KEY, ...)` call at line 65. Keep
     `username`/`roles`/`expiresAt` in memory only (e.g. return them from `login()`
     and let `AuthProvider` hold them in React state, same as it does today) if a
     page reload dropping the session is acceptable; if it is not, the expiry
     timestamp and non-sensitive display fields (`username`, `roles`) — but **not**
     `accessToken` — may still be cached in `localStorage` or `sessionStorage`,
     since a UI hint being forgeable is exactly the accepted, documented risk in
     SEC-002.
   - Update `src/hooks/useAuth.jsx` (`restoreSession()` call at line 14) and every
     test/fixture that currently seeds `localStorage` with
     `motorcycle-comparator.token` / `motorcycle-comparator.session` to match the new
     mechanism once it lands (existing tests in `api.test.js`, `authService.test.js`,
     `useAuth.test.jsx`, `AdminPage.test.jsx`, `AppRoutes.test.jsx`,
     `AdminMotorcycleFormPage.test.jsx` all currently assert the old behaviour and
     will need updating in lockstep — coordinate so the security test suite added by
     this audit and the pre-existing suite move together).

2. **SEC-002 — no client-only code change can fully close this** (see the
   finding's explanation). Optional hardening if pursued: make `restoreSession()`
   fail closed on any shape mismatch it doesn't already check (it already handles
   missing/expired/corrupt — no further action strictly required). Document the
   accepted risk in a code comment near `AdminPage.jsx:21` and
   `AdminMotorcycleFormPage.jsx:25` referencing this report, so a future reader does
   not mistake the client gate for a real authorization boundary.

3. **SEC-003 — add defense-in-depth headers.**
   - `index.html`: add a `<meta http-equiv="Content-Security-Policy" content="...">`
     tag inside `<head>` (after line 7) scoped to this app's actual needs, at minimum:
     `default-src 'self'; img-src 'self' data: https:; connect-src 'self' http://localhost:8080 https://<production-api-host>; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'`.
     (`style-src 'unsafe-inline'` is likely required for Tailwind v4's runtime style
     injection — verify against the actual build output before locking it down
     further.)
   - Add hosting-level headers outside this repo's build step wherever the built
     `dist/` is actually served (e.g. a `_headers` file if deployed to Netlify, a
     `vercel.json` `headers` block if deployed to Vercel, or reverse-proxy
     configuration): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
     `Referrer-Policy: strict-origin-when-cross-origin`,
     `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HTTPS
     deployments only). This is a deployment-configuration task, not a `src/` change.

4. **SEC-004 — push the 2–4 id bound into the service layer.**
   - `src/services/motorcycleService.js:66-72`: at the top of `compareMotorcycles`,
     add
     `if (ids.length < COMPARISON_MIN || ids.length > COMPARISON_MAX) throw new Error('compareMotorcycles requires 2-4 ids');`
     (or return a rejected promise) before the `api.get(...)` call, so every current
     and future caller gets the same fast-fail `useComparison` already provides.
     Update `src/services/motorcycleService.security.test.js` to assert the throw
     once this lands instead of asserting the request goes out.

5. **SEC-005 — encode path segments defensively.**
   - `src/services/motorcycleService.js`: wrap the interpolated `id`/`slug` in
     `encodeURIComponent(...)` at every call site listed in the finding — lines
     47 (`getMotorcycleById`), 53 (`getMotorcycleBySlug`), 87
     (`updateMotorcycle`), 92 (`deleteMotorcycle`), 110
     (`uploadMotorcycleImage`), 122 (`deleteMotorcycleImage`). Low risk, low effort;
     no behaviour change for the existing numeric-id/slug-format inputs already in
     use, only for edge-case characters.
