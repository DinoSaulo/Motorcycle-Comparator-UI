# Frontend Technical Guidelines

Core architecture, coding standards and environment rules for the `motorcycle-comparison-web`
frontend. Any AI agent or developer contributing to this repository must follow these rules.

## 1. Stack & environment

- **Framework:** React 19 (React 18+ required), built with Vite
- **Routing:** `react-router-dom` v7
- **HTTP client:** `axios`
- **Styling:** Tailwind CSS v4 + `lucide-react` for icons
- **Linting:** ESLint 9 (Flat Config in `eslint.config.js` — run `npm run lint`)
- **Backend API URL:** `http://localhost:8080/api/v1`
- **Language rule:** all code, file names, variables, functions, comments, commits and
  documentation **MUST BE IN ENGLISH**.

Tailwind v4 keeps its configuration in CSS. Theme tokens live in the `@theme` block of
`src/styles/index.css` — there is no `tailwind.config.js`.

## 2. Directory structure

All source files live in `src/`. Maintain strict separation of concerns:

```text
src/
├── assets/          # Static files (images, icons, svgs)
├── components/      # Reusable UI components
│   ├── admin/       # LoginForm, MotorcycleForm, ImageUploader
│   ├── common/      # Navbar, Footer, LoadingSpinner, Modal
│   ├── compare/     # ComparisonTable, SpecRow, AddMotorcycleCard
│   └── search/      # SearchBar, AutocompleteDropdown
├── pages/           # Page view components (HomePage, ComparePage, NotFoundPage)
├── routes/          # AppRoutes.jsx (route definitions)
├── services/        # API calls & axios configuration (api.js, motorcycleService.js)
├── hooks/           # Custom React hooks (useMotorcycles, useDebounce)
├── utils/           # Helper functions & formatters
└── styles/          # Global styles & Tailwind configuration
```

## 3. Working with the API

The backend lives at `C:\Users\saulo\projects\Motorcycle-Comparator-API`. Read the
controllers and DTOs there before changing anything in `services/` — the contract is the
source of truth, not this document.

Rules that follow from that contract:

- **Never re-derive what the comparison endpoint already decided.** It returns spec labels,
  units, display order, `winnerIndexes` and `differing` per row. Render them.
- **`null` means "not published".** Render an em dash, never `0`.
- **Comparison takes 2–4 ids.** Do not issue a request outside that range.
- **All errors share the `ApiError` shape.** Normalise in `services/api.js`; never parse an
  error body in a component.
- **Every fetch takes an `AbortController` signal** and is cancelled on cleanup.
- **`PUT /motorcycles/{id}` is a full replacement.** Send the complete record; an omitted
  optional field is cleared. `engine` is `@NotNull` and must always be present.
- **Blank form inputs become `null`**, never `""` or `0`.
- **Never set a Content-Type for uploads.** The axios instance deliberately declares no
  default so the browser can add the multipart boundary itself.
- **Uploaded `imageUrl` values are host-relative.** Always render them through
  `resolveImageUrl`, never straight into `<img src>`.

## 4. Conventions

- Components are function components; `ErrorBoundary` is the one class, because React
  provides no hook equivalent.
- Colour must never be the only carrier of meaning — pair it with an icon or `sr-only` text.
- Wide content scrolls inside its own container; the page body never scrolls horizontally.
- Prefer the URL over local state for anything a user might share or bookmark.
