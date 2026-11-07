# 💸 Expensio - Production-Ready Expense Tracker PWA

A high-performance, offline-first Progressive Web App (PWA) built with **React 18**, **Tailwind CSS**, **Dexie.js (IndexedDB)**, and **Chart.js**. Designed with a mobile-first philosophy, multi-level category hierarchy, zero-latency local operations, encrypted dual-backup, and comparative visual analytics (WoW, MoM).

---

## 🚀 Key Highlights & Architecture

### 1. Offline-First Architecture (Dexie.js & IndexedDB)
- **Zero Network Latency**: All expense insertions, batch operations, edits, deletions, category updates, and filter queries execute in pure local IndexedDB via Dexie.js.
- **Background Sync**: Works completely offline. Service worker precaches assets and provides offline functionality.
- **Reactive State**: Built with `useLiveQuery` from `dexie-react-hooks`—any change in IndexedDB automatically re-renders affected UI components in real time.

### 2. Multi-Select & Batch Deletion Operations
- **Checkbox Selection Mode**: Individual checkboxes on transaction cards and a master **Select All** checkbox for the currently filtered view.
- **Floating Action Bar**:
  - Dynamically appears when 1 or more entries are selected.
  - Displays selected count and aggregate dollar value.
  - Quick "Cancel Selection" button.
  - "Delete Selected" button triggering safety modal.
- **Safe Batch Delete**: Executes via Dexie `db.expenses.bulkDelete(ids)` inside a single atomic IndexedDB transaction with confirmation modal.

### 3. Month-Wise Isolation & Filtering (Single Month vs. Consolidated)
- **Dedicated Month Picker**: Select among dynamically detected months (e.g., "November 2026", "October 2026", etc.).
- **Dual View Mode Switch**:
  - **Single Month View**: Strictly isolates calculations, reports, charts, and lists to the chosen month only.
  - **Consolidated (All Time) View**: Combines all historical data across all months.
- **Dynamically Recalculated Summary Cards**:
  - Month Total Spent
  - Week-over-Week (WoW)
  - Month-over-Month (MoM) vs prior month
  - Daily Average Burn Rate (strictly adjusted for days elapsed or days in month)
- **Month-Scoped Category Distribution**: Donut and Trend charts only display the active month's data when in Single Month View.

### 4. Hierarchical Category Architecture (Multi-Level Subcategories)
- **Arbitrary Depth Support**:
  - Root Category: `Grocery`
  - Subcategory: `Daal & Pulses`
  - Nested Sub-child: `Daal Channa`, `Daal Moong`, `Daal Masoor`
- **Dynamic Category Management**:
  - Add root categories or subcategories under any node.
  - Custom color palettes and Lucide icons.
  - **Category Merge Engine**: Merge Category A into Category B with automatic reassignment of all associated historical expenses and child records.
  - Safe delete with cascading or reparenting safeguards.
- **Quick Tagging**: Rapid expense categorization with `#urgent`, `#cash`, `#monthly`, `#weekend`, `#tax-deductible`, or custom user tags.

### 5. Dual Backup System (Offline & Cloud Sync)
- **Offline JSON Backup**:
  - One-click export to local device storage.
  - **AES-GCM 256-bit Encryption**: Encrypts sensitive financial data with PBKDF2 + Web Crypto API.
  - **Offline Restore**: Upload JSON backup with automatic schema verification and duplicate prevention (Merge vs Clean Replace).
- **Offline CSV Export**: Instant export of all transactions formatted for Microsoft Excel, Google Sheets, or Apple Numbers.
- **Online / Cloud Sync Adapter**:
  - Pluggable adapter for **Supabase**, Firebase REST, or generic JSON endpoints.
  - Background auto-sync on expense modifications.
  - Conflict resolution strategy (Last-Write-Wins based on ISO timestamps).
  - Test connection utility with live network status indicator in the top navbar.

### 6. PWA & Device Performance
- **Ultra-low Bundle Size**: Tree-shaken icons, vendor code-splitting (`vendor-react`, `vendor-db`, `vendor-chart`, `vendor-icons`), minified ESBuild assets.
- **Standalone Display Mode**: Configured `manifest.webmanifest` and service worker caching strategies (`CacheFirst` for web fonts, `NetworkFirst`/`StaleWhileRevalidate` for assets).
- **Installable Banner**: Prompts mobile (Android & iOS) and desktop (Chrome / Edge) users to install to home screen.

---

## 💻 Commands

### Install Dependencies
```bash
npm install
```

### Run Local Development Server
```bash
npm run dev
```

### Build Production PWA
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```
