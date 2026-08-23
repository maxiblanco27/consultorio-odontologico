# Dental Clinic

This is the project for the registration and management of patients at the dental clinic.

## Technologies Used
- HTML5
- CSS3
- JavaScript (Vanilla)
- Supabase (Backend/Database)
- FontAwesome (Icons)

## Description
The system allows you to register new patients, detail their treatments, and keep a history of consultations with search functionality.

## Development Guidelines
- **Language**: All code and comments must be written in English.
- **Best Practices**: Always follow industry standard best programming practices.
- **Design Patterns**: Use modern and current programming patterns appropriate for the architecture.

## AI Coding Guidelines & Architecture Rules

### 1. General Principles
* **Single Responsibility Principle (SRP):** Every module, file, function, and component must have one single, well-defined responsibility.
* **Separation of Concerns:** Keep presentation, business logic, data access, and styling strictly isolated.
* **Language Rules:** All code comments, variable names, function names, and technical documentation MUST be written in English. All user-facing text, alerts, and labels must remain in Spanish.

### 2. JavaScript Modularization (ES Modules)
Avoid monolithic script files. Split functionality into focused modules inside a `/js` or `/src` directory:
* `config/supabaseClient.js`: Handles environment detection, credentials, and Supabase client initialization only.
* `services/`: Dedicated API/Data access layer (e.g., `patientService.js`, `treatmentService.js`). No direct UI manipulation inside services.
* `ui/`: DOM manipulation, rendering, and event handlers (e.g., `patientTable.js`, `treatmentModal.js`, `alertBanner.js`).
* `utils/`: Reusable, pure helper functions (e.g., date formatting, currency parsing, debounce).
* `version/versionManager.js`: Handles version polling and update banners.
* `main.js`: Main entry point responsible only for importing modules and initializing listeners on `DOMContentLoaded`.

Versioning & Creative Codename Convention
* **Mandatory Codename Rotation:** On every single update or new version increment, `VERSION_CODENAME` MUST be updated with a new creative word (e.g., `Dark`, `Motorized`, `OmniDoctor`, `Titanium`, `Nova`).
* **Format:** The codename represents the suffix added after the fixed "Cito" prefix (yielding names like `CitoDark`, `CitoMotorized`, `CitoOmniDoctor`).
* **Synchronization:** Both `CURRENT_VERSION` in the JavaScript config and `"version"` in `version.json` must be incremented simultaneously upon release.

### 3. HTML & CSS Structure
* **Semantic HTML:** Keep `index.html` clean and declarative. Use `<template>` tags or modular container injection for modals and dynamic views rather than hardcoding complex invisible layouts directly in the body.
* **Modular CSS:** Separate stylesheets by domain if they grow (e.g., `base.css`, `components/table.css`, `components/modal.css`, `layout.css`). Avoid inline styling (`style="..."`); use dedicated utility or component CSS classes.

### 4. Data & State Management Standards
* **Immutability & Pure Helpers:** Write stateless utility functions where possible.
* **Explicit Contracts:** Keep function signatures clean and self-documenting. Use JSDoc annotations above functions to define input params and return types clearly.
* **Defensive Error Handling:** Handle async operations with explicit `try...catch` blocks at the service boundary and return structured error objects to the UI layer.