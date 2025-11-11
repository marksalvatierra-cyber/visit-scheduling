# Copilot Instructions for Central Prison Camp Sablayan Penal Farm Visit Scheduling System

## Project Overview

- **Stack:** React (SPA) + Vite + Firebase (Firestore, Auth, Storage) + TailwindCSS
- **Purpose:** Manages inmate visit requests, admin dashboards, notifications, QR code validation, and log trails for the Central Prison Camp Sablayan Penal Farm.
- **Major Components:**
  - `src/components/`: Modular React components for admin/client dashboards, visit requests, scanning, records, logs, settings, notifications, and profile management.
  - `src/firebase-services.js`: Centralized service for all Firestore, Auth, and Storage operations. All data flows and business logic are routed through this class.
  - `public/image/`: Static assets for branding and UI.

## Architecture & Data Flow

- **Routing:**
  - Main entry: `src/main.jsx` → `src/App.jsx` (sets up React Router)
  - `/admin/*` and `/client/*` routes load respective dashboards.
- **State & Data:**
  - All CRUD and real-time updates (visit requests, notifications, logs, inmates) use methods from `firebaseService`.
  - Real-time listeners for notifications and requests are set up in dashboard components.
- **Status Normalization:**
  - Status values ("approved", "pending", "rejected", "rescheduled") are normalized via `firebaseService.normalizeStatus()` for consistency across Firestore queries and UI.

## Developer Workflows

- **Start Dev Server:**
  - `npm run dev` (Vite, HMR enabled)
- **Build for Production:**
  - `npm run build`
- **Lint:**
  - `npm run lint` (uses ESLint config in `eslint.config.js`)
- **Preview Build:**
  - `npm run preview`
- **No built-in test suite** (as of current codebase).

## Project-Specific Patterns & Conventions

- **All Firestore access and business logic must go through `firebaseService`.**
  - Do not access Firebase directly in components.
  - Use provided methods for CRUD, stats, notifications, QR code, and log management.
- **Status values:** Always use normalized status strings (see above).
- **Notifications:**
  - Admin notifications are always sent to `userId: 'admin'`.
  - Real-time listeners are used for notification dropdowns.
- **Log Trails:**
  - Every status change or major action creates a log entry via `firebaseService.createLogEntry()`.
- **QR Codes:**
  - Visit requests generate QR codes stored in Firestore; validation and marking as used are handled via service methods.
- **Theme:**
  - Dashboard theme is stored in `localStorage` as `dashboard-theme` and synced via effect hooks.

## Integration Points

- **External Libraries:**
  - Chart.js (analytics), html5-qrcode, qrcode, react-qr-code, react-router-dom
- **TailwindCSS:**
  - Used for all styling; config in `tailwind.config.js`.
- **Vite Plugins:**
  - `@vitejs/plugin-react`, `@tailwindcss/vite`

## Examples

- **To fetch visit requests for a user:**
  ```js
  firebaseService.getVisitRequests(userId);
  ```
- **To update a visit request and log the action:**
  ```js
  firebaseService.updateVisitRequest(requestId, {
    status: "approved",
    reviewedBy: "Officer Name",
  });
  ```
- **To listen for admin notifications:**
  ```js
  firebaseService.listenToAdminNotifications(callback);
  ```

## Key Files & Directories

- `src/components/` — All UI modules
- `src/firebase-services.js` — All backend logic
- `src/App.jsx` — Main app/router
- `public/image/` — Static assets
- `tailwind.config.js` — Styling config

---

**If any section is unclear or missing, please provide feedback so this guide can be improved.**
