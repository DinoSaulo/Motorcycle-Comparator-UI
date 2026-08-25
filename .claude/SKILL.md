# Frontend Technical Guidelines & AI Agent Skills

This document defines the core architecture, coding standards, design patterns, and environment rules for the `motorcycle-comparison-web` frontend application. Any AI agent or developer contributing to this repository must follow these rules.

---

## 1. Stack & Environment
- **Framework:** React 18+ (using Vite)
- **Routing:** `react-router-dom` (v6+)
- **HTTP Client:** `axios`
- **Styling:** Tailwind CSS + `lucide-react` (for icons)
- **Backend API URL:** `http://localhost:8080/api/v1`
- **Language Rule:** All code, file names, variables, functions, comments, commits, and documentation **MUST BE IN ENGLISH**.

---

## 2. Directory Structure & Architecture

All source files reside in `src/`. Maintain strict separation of concerns:

```text
src/
├── assets/          # Static files (images, icons, svgs)
├── components/      # Reusable UI components
│   ├── common/      # Navbar, Footer, LoadingSpinner, Modal
│   ├── compare/     # ComparisonTable, SpecRow, AddMotorcycleCard
│   └── search/      # SearchBar, AutocompleteDropdown
├── pages/           # Page view components (HomePage, ComparePage, NotFoundPage)
├── routes/          # AppRoutes.jsx (Route definitions)
├── services/        # API calls & Axios configuration (api.js, motorcycleService.js)
├── hooks/           # Custom React hooks (useMotorcycles, useDebounce)
├── utils/           # Helper functions & formatters (formatEngineSize, currencyFormatter)
└── styles/          # Global styles & Tailwind configuration