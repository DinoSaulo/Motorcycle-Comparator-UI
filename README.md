# Motorcycle Comparator — Web

React front end for the [Motorcycle Comparator API](../Motorcycle-Comparator-API). Browse the
catalogue, filter it, and put two to four motorcycles side by side.

## Requirements

- Node.js 20+ (developed against 24.19.0)
- The API running on `http://localhost:8080`

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173
```

`5173` is one of the origins the API's CORS configuration already trusts, so the browser
talks to the backend directly and no dev proxy is involved.

To point at a different backend, copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.

## Scripts

| Script            | Purpose                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Vite dev server with HMR         |
| `npm run build`   | Production build into `dist/`    |
| `npm run preview` | Serve the production build       |

## Architecture

```text
src/
├── assets/          # Static files (images, icons, svgs)
├── components/
│   ├── admin/       # LoginForm, MotorcycleForm, FormField, ImageUploader,
│   │                #   AdditionalSpecsEditor, AdminMotorcycleTable
│   ├── common/      # Navbar, Footer, LoadingSpinner, Modal, ErrorBoundary,
│   │                #   ErrorMessage, MotorcycleCard
│   ├── compare/     # ComparisonTable, SpecRow, AddMotorcycleCard
│   └── search/      # SearchBar, AutocompleteDropdown
├── pages/           # HomePage, ComparePage, AdminPage,
│                    #   AdminMotorcycleFormPage, NotFoundPage
├── routes/          # AppRoutes.jsx
├── services/        # api.js (axios + error normalisation), motorcycleService.js,
│                    #   authService.js
├── hooks/           # useMotorcycles, useDebounce, useAuth
├── utils/           # formatters.js, motorcycleForm.js
└── styles/          # index.css — Tailwind v4 entry and theme tokens
```

## Administration

`/admin` shows a sign-in form to anyone without a session and the catalogue back office to a
signed-in administrator. From there an admin can create, edit and delete motorcycles, and
upload or clear the image on each one.

Sign in with an account holding `ROLE_ADMIN` (the dev profile ships `admin` / `admin123`).
The API's token lasts two hours; the session is restored across reloads and cleared
automatically the moment it lapses.

Notes on how it behaves, and why:

- **Editing replaces the whole record.** `PUT /motorcycles/{id}` clears any optional field
  the payload omits, so the form loads the complete motorcycle and always submits all of it.
  Emptying a field is therefore a real edit, and the form says so.
- **Blank means null, never zero.** Every empty input is sent as `null`; a `0` would be
  stored as a genuine measurement, and `""` fails the API's `@Positive`/`@Size` constraints.
- **`engine` is always sent**, even when entirely blank — it is `@NotNull` upstream, and
  omitting it is a 400.
- **Images travel outside the JSON.** Upload is a separate multipart endpoint keyed by id,
  so editing a specification never re-sends the binary. On the create screen the file is
  held locally and uploaded the moment the record exists.
- **Field violations land on their own input.** A 400 names fields as `brand` or
  `engine.gears`; the form maps each to the control it came from.

### Decisions worth knowing

**The comparison table is a dumb renderer.** `GET /motorcycles/compare` returns the table
already shaped as `groups[].rows[]`, with the label, unit, display order, `winnerIndexes`
and a `differing` flag all decided server-side. `ComparisonTable` and `SpecRow` render that
as-is rather than re-deriving any of it, so a spec added to the API shows up here with no
front-end change.

**A `null` value means "not published", never zero.** Every formatter and `SpecRow` renders
an em dash for it. Roughly 80% of catalogue rows have gaps, so this is the common path.

**The URL is the comparison state.** `/compare?ids=1,2,3` mirrors the backend's choice to
expose comparison as a shareable GET. There is no store duplicating it. Ids are validated
and de-duplicated on read so a hand-edited URL cannot produce a request the API rejects.

**Requests below the API's minimum are never sent.** The endpoint requires 2–4 ids;
`useComparison` skips the fetch outside that range instead of showing a self-inflicted 400.

**One error shape.** The API answers every failure with the same `ApiError` body, so
`services/api.js` normalises all of it — including network and timeout failures — into a
single `ApiRequestError` that `ErrorMessage` knows how to render, field violations included.

**Every request is abortable.** Search runs on each debounced keystroke; each effect owns an
`AbortController` so a superseded response can never overwrite a newer one.

## Backend notes

Observed against the live API and worth being aware of when reading the UI:

- Uploaded images come back **host-relative** (`/api/v1/images/motorcycles/{uuid}.jpg`),
  because the API cannot know the origin it is reached on behind a proxy. `resolveImageUrl`
  in `services/api.js` resolves those against the API origin, and passes absolute
  `http(s)://` values through untouched.
- `imageUrl` is absent across the seeded dataset, so cards and comparison columns fall back
  to a placeholder icon until an image is uploaded.
- `brands` contains case variants of the same marque (`Aprilia` and `APRILIA`), which surface
  as separate entries in the brand filter.
- A row where one bike has a value and the other is `null` comes back with `differing: false`,
  so "Show differences only" hides it. That flag is the backend's to define.
- Enum-valued rows (for example Category) arrive raw, e.g. `NAKED`, since the table renders
  server-supplied strings verbatim.
