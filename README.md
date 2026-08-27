# 🏍️ Motorcycle Comparator — Web

> *"Because deciding between a 200hp superbike and a comfy cruiser shouldn't require 47 browser tabs and an existential crisis."*

[![React 19](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tested_with-Vitest-6E9F18?logo=vitest)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📊 SonarQube Quality Metrics

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=DinoSaulo_Motorcycle-Comparator-UI&metric=alert_status)](https://sonarcloud.io/summary/overall?id=DinoSaulo_Motorcycle-Comparator-UI)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=DinoSaulo_Motorcycle-Comparator-UI&metric=coverage)](https://sonarcloud.io/summary/overall?id=DinoSaulo_Motorcycle-Comparator-UI)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=DinoSaulo_Motorcycle-Comparator-UI&metric=bugs)](https://sonarcloud.io/summary/overall?id=DinoSaulo_Motorcycle-Comparator-UI)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=DinoSaulo_Motorcycle-Comparator-UI&metric=code_smells)](https://sonarcloud.io/summary/overall?id=DinoSaulo_Motorcycle-Comparator-UI)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=DinoSaulo_Motorcycle-Comparator-UI&metric=vulnerabilities)](https://sonarcloud.io/summary/overall?id=DinoSaulo_Motorcycle-Comparator-UI)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=DinoSaulo_Motorcycle-Comparator-UI&metric=security_rating)](https://sonarcloud.io/summary/overall?id=DinoSaulo_Motorcycle-Comparator-UI)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=DinoSaulo_Motorcycle-Comparator-UI&metric=reliability_rating)](https://sonarcloud.io/summary/overall?id=DinoSaulo_Motorcycle-Comparator-UI)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=DinoSaulo_Motorcycle-Comparator-UI&metric=sqale_rating)](https://sonarcloud.io/summary/overall?id=DinoSaulo_Motorcycle-Comparator-UI)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=DinoSaulo_Motorcycle-Comparator-UI&metric=sqale_index)](https://sonarcloud.io/summary/overall?id=DinoSaulo_Motorcycle-Comparator-UI)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=DinoSaulo_Motorcycle-Comparator-UI&metric=duplicated_lines_density)](https://sonarcloud.io/summary/overall?id=DinoSaulo_Motorcycle-Comparator-UI)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=DinoSaulo_Motorcycle-Comparator-UI&metric=ncloc)](https://sonarcloud.io/summary/overall?id=DinoSaulo_Motorcycle-Comparator-UI)

---

Welcome to **Motorcycle Comparator UI**! This is the high-octane React front-end for the [Motorcycle Comparator API](../Motorcycle-Comparator-API). Whether you're a weekend rider comparing specs, a gearhead chasing horsepower numbers, or an admin managing the garage, this web app gives you a smooth, responsive ride.

---

## ✨ Features That Make Your Engine Roar

- 🔍 **Real-Time Debounced Search**: Type and find bikes faster than shifting from 1st to 2nd gear—without overloading the backend API.
- ⚡ **Side-by-Side Comparison Arena**: Line up **2 to 4 motorcycles** side-by-side. Spec labels, winner highlighting, unit formatting, and difference badges are all calculated server-side!
- 🔗 **Shareable URL Comparison State**: Bookmark or send `/compare?ids=1,2,3` to your riding buddies—the URL *is* the state.
- 🏍️ **Detailed Specification Inspector**: View dedicated motorcycle detail pages with engine details, dimensions, categories, and high-res imagery.
- 🔐 **Admin Garage (Back Office)**: Full authentication (`ROLE_ADMIN`), complete CRUD capabilities, and multipart image uploading.
- 🌐 **Multilingual Ready (i18n)**: Switch languages effortlessly using the built-in `LanguageSwitcher`.
- 🛡️ **Bulletproof Error Handling**: Graceful error UI rendering, auto-cancelled out-of-order requests via `AbortController`, and strict input validation.

---

## 🛠️ Tech Stack & Dependencies

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Core Framework** | [React 19](https://react.dev/) | Component-driven UI architecture |
| **Build System** | [Vite 8](https://vitejs.dev/) | Lightning-fast HMR and bundle compilation |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS with modern `@theme` design tokens |
| **Icons** | [Lucide React](https://lucide.react.dev/) | Sleek, customizable iconography |
| **Routing** | [React Router DOM v7](https://reactrouter.com/) | Client-side page navigation & URL parameters |
| **HTTP Client** | [Axios](https://axios-http.com/) | API requests, error normalisation, and abort signals |
| **Linting** | [ESLint 9](https://eslint.org/) | Code quality, React hooks linting & style enforcement |
| **Testing** | [Vitest](https://vitest.dev/) + React Testing Library | Unit, integration, and security testing |
| **Localization** | Custom i18n Engine | Seamless multi-language UI translation |

---

## 🚀 Quick Start Guide

### 📋 Prerequisites

- **Node.js**: 20+ (developed & tested against `24.19.0`)
- **Motorcycle Comparator API**: Running at `http://localhost:8080`

### 🔧 Installation & Setup

1. **Clone the repository & install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables (Optional):**
   By default, the app targets `http://localhost:8080/api/v1`. To override it:
   ```bash
   cp .env.example .env
   ```
   Set `VITE_API_BASE_URL` in `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api/v1
   ```

3. **Ignition! Launch Dev Server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`. 
   
   > 💡 **Fun Fact**: Port `5173` is pre-configured in the API's CORS trust list, so frontend and backend talk directly with zero proxy hassle!

---

## 📜 Available Scripts

Run these scripts in your terminal:

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run dev` | 🚀 Dev Server | Starts Vite dev server with Hot Module Replacement (HMR) |
| `npm run build` | 📦 Production Build | Compiles production assets into `dist/` |
| `npm run preview` | 👁️ Preview | Serves the production build locally for verification |
| `npm run lint` | 🧹 Lint Check | Runs ESLint to inspect JavaScript & JSX code |
| `npm run lint:fix` | 🛠️ Auto-Fix Lint | Automatically fixes auto-fixable ESLint issues |
| `npm test` | 🧪 Run Tests | Executes all Vitest unit, integration, and security tests |
| `npm run test:unit` | 🔬 Unit Tests | Runs unit tests (excluding `*.integration.test.*`) |
| `npm run test:integration` | 🔗 Integration Tests | Runs integration tests |
| `npm run test:watch` | ⏱️ Watch Mode | Runs Vitest in interactive watch mode |
| `npm run test:coverage` | 📊 Test Coverage | Generates code coverage report via Vitest v8 |

---

## 🏗️ Project Architecture

```text
src/
├── assets/                  # Static files (images, icons, SVGs)
├── components/
│   ├── admin/               # Admin panel (LoginForm, MotorcycleForm, ImageUploader,
│   │                        #   FormField, AdditionalSpecsEditor, AdminMotorcycleTable)
│   ├── common/              # Global UI (Navbar, Footer, LoadingSpinner, Modal,
│   │                        #   ErrorBoundary, ErrorMessage, MotorcycleCard, LanguageSwitcher)
│   ├── compare/             # Comparison engine (ComparisonTable, SpecRow, AddMotorcycleCard)
│   └── search/              # Search experience (SearchBar, AutocompleteDropdown)
├── hooks/                   # Custom hooks (useMotorcycles, useDebounce, useAuth, useLanguage)
├── i18n/                    # Localization setup & language translations
├── pages/                   # Views (HomePage, ComparePage, MotorcycleDetailPage,
│                            #   AdminPage, AdminMotorcycleFormPage, NotFoundPage)
├── routes/                  # App routing configuration (AppRoutes.jsx)
├── services/                # API layer (api.js, motorcycleService.js, authService.js)
├── styles/                  # Tailwind v4 entry point & theme tokens (index.css)
├── testing/                 # Test helpers, mocks, and setup files
└── utils/                   # Formatter utilities & form helpers (formatters.js, motorcycleForm.js)
```

---

## 🔐 Admin Garage & Back Office

Navigating to `/admin` opens the garage doors:
- **Unauthenticated users** are greeted with a secure login form.
- **Authenticated Admins** gain access to full catalogue management (Create, Edit, Delete, Image Upload/Removal).

### 🔑 Default Credentials (Dev Profile)
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `ROLE_ADMIN`
- **Token Expiry**: 2 hours (restored automatically on page reload and safely cleared upon lapse).

### 📝 Form Rules & Technical Specs
- **Full Replacement on Edit**: `PUT /motorcycles/{id}` overwrites the entire motorcycle entity. The form automatically pre-populates all existing specs to prevent accidental wiping of omitted fields.
- **Blank Means `null` (Never Zero)**: Empty form inputs map to `null`. Submitting `0` or `""` violates backend constraints like `@Positive` or `@Size`.
- **`engine` is Sacred**: The `engine` object is `@NotNull` upstream and must always be submitted, even if blank inside.
- **Independent Image Upload**: Image uploads use a separate multipart endpoint (`POST /motorcycles/{id}/image`). Editing spec data won't re-transmit binary payloads!
- **Granular Error Mapping**: API 400 validation violations map straight to their respective input fields (e.g. `engine.gears`).

---

## 🧠 Smart Engineering & Design Decisions

- **Server-Driven Comparison**: The front-end is a smart renderer, not a heavy math engine. `GET /motorcycles/compare` calculates row order, units, labels, `winnerIndexes`, and `differing` flags. Adding a new spec upstream works instantly with zero UI changes!
- **`null` = "Not Published"**: Gaps in specs (approx 80% of catalogue) render cleanly as an em dash (`—`), preserving layout integrity.
- **URL as the Source of Truth**: `/compare?ids=1,2,3` lets users copy & share their exact comparison matrix. Validated and de-duplicated on read so malformed URLs can't crash the UI.
- **Request Guardrails**: Comparison fetches only fire when 2 to 4 bike IDs are present—preventing self-inflicted API 400 errors.
- **Unified Error Protocol**: `services/api.js` normalises all network, timeout, and field-validation failures into `ApiRequestError` for consistent rendering by `ErrorMessage`.
- **Race Condition Prevention**: Keystrokes during search trigger `AbortController.abort()` to drop obsolete pending requests instantly.

---

## 🔌 Backend Gotchas & Quirks

Keep these live API quirks in mind when hacking on the UI:
1. **Host-Relative Images**: Uploaded image paths return as `/api/v1/images/motorcycles/{uuid}.jpg`. The UI helper `resolveImageUrl()` attaches the backend host automatically.
2. **Missing Seed Images**: Seed dataset motorcycles lack `imageUrl`, triggering the fallback motorcycle silhouette card.
3. **Brand Case Variants**: Brand lists may contain mixed case entries (e.g., `Aprilia` vs `APRILIA`).
4. **Enums are Raw**: Enum values like category arrive as raw strings (`NAKED`, `SPORT`) and are rendered verbatim.

---

## 🧪 Testing & Quality Assurance

This codebase takes testing seriously! Runs on **Vitest** with **React Testing Library** and **Axios Mock Adapter**.

```bash
# Run full test suite
npm test

# Run unit tests only
npm run test:unit

# Generate coverage report
npm run test:coverage
```

Tests cover:
- 🧪 **Unit Tests**: Utility formatters, hooks, and individual components.
- 🔗 **Integration Tests**: Full page user interactions and API communication.
- 🛡️ **Security Tests**: XSS sanitization, authentication state preservation, and token storage safety.

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

Made with 🏍️ and ⚡ by the **Motorcycle Comparator Team**.

