# 👑 Expensio - Unified Financial Suite (PWA)

A production-ready, executive-quality, offline-first **Unified Financial Suite** built with **React 18**, **Tailwind CSS**, **Dexie.js (IndexedDB)**, and **Recharts**. Combines a multi-level **Expense Tracker**, **Credit & Debt Manager (Receivables, Payables, Committees & Installments)**, **Visual Reports**, and **Encrypted Backup & Cloud Sync**.

---

## 🏛️ Suite Modules & Architecture

```
                                  [ Expensio Unified Financial Suite ]
                                                   │
        ┌───────────────────┬──────────────────────┼───────────────────────┬────────────────────┐
        ▼                   ▼                      ▼                       ▼                    ▼
 [ 🏠 Executive Hub ] [ 💳 Credit & Debt ] [ 🧾 Expense Tracker ]  [ 📊 Visual Reports ]  [ ⚙️ Settings & Backup ]
  ├── Month Outflow    ├── Receivables      ├── Monthly Isolation   ├── Cash Outflow       ├── Default Currency (PKR)
  ├── Net Balance      ├── Payables         ├── Hierarchical Tree   │   vs Inflow (Bars)   ├── AES-256 GCM Backup
  ├── Due Alerts       ├── Committees       ├── Bulk Delete         ├── Amortization Bars  ├── Send to Email Action
  └── Quick Add CTAs   └── Installments     └── Tag Filters         └── Donut Breakdown    └── Cloud Sync (Supabase)
```

---

## 🌟 Key Features

### 1. Executive Home Hub
- **Executive Pulse Overview**: High-contrast summary of net worth position, today's outflow, and upcoming due dates.
- **Two Primary Interactive Cards**:
  1. **Expense Tracker Card**: Month Total Outflow, Today's Spend, Top Category badge, Quick Add Expense CTA, and deep link into Expense Tracker.
  2. **Credit & Debt Manager Card**: Net Outstanding Balance, Total Receivable (Lena hai), Total Payable (Dena hai), Due Alerts ticker, and quick record CTA.
- **Executive Shortcuts**: Instant navigation to Reports, Category Hierarchy, Email Backup, and Storage Center.

### 2. Credit & Debt Engine (Receivables, Payables, Committees & Installments)
- **Directional Clarity**:
  - **"I will receive"** (*Lena hai* / Receivable loans, client invoices).
  - **"I will pay"** (*Dena hai* / Debts, Committees, Installments).
- **Dynamic Ledger History**:
  - Log partial payments to deduct from balance.
  - Issue additional credit/borrowing with timestamped logs.
  - Delete or adjust ledger entries with automatic balance reconciliation.
- **Committee (Kameti) & Installment Scheduler**:
  - Set total amount, monthly installment, tenure (months), start date, next due date, and committee payout month.
  - Real-time calculation of paid vs pending installments and completion percentage.
- **Peak Credit Analytics**:
  - Automatically records and surfaces the **Highest Credit Peak** (the exact date and amount when outstanding balance was at its maximum).
- **Status Indicators**:
  - `Overdue` (past due date)
  - `Due this week` (due within 7 days)
  - `Active`
  - `Settled`

### 3. Refined Expense Tracker
- **Isolated Views**: Dedicated controls for monthly isolation (*Single Month View* vs *Consolidated All-Time View*).
- **Hierarchical Categories**: Arbitrary depth (e.g. `Grocery` -> `Daal & Pulses` -> `Daal Channa`).
- **Dynamic Category Merge**: Seamlessly consolidate duplicate categories with automatic expense reassignment.
- **Bulk Deletion & Multi-Select**: Floating action bar, Select All for filtered items, and safe atomic `bulkDelete`.

### 4. Visual Reports & Analytics (Recharts Engine)
- **Monthly Cash Outflow vs Credit Inflow**: Comparative multi-month grouped bar charts.
- **Committee & Debt Amortization**: Clean visual progress bars tracking completion percentages and remaining months.
- **Category Donut Chart**: Clear legends with percentages and interactive tooltips.

### 5. Settings & Dual Backup System
- **Currency Preferences**: Default currency set to **PKR (Rs)**, with support for USD ($), EUR (€), SAR (SAR), AED (AED), GBP (£), and INR (₹).
- **One-Click Encrypted JSON Export**: Web Crypto API PBKDF2 + AES-GCM 256-bit encryption.
- **Send Backup to Email**: Prepares JSON database file, triggers Web Share API (mobile/desktop apps like Gmail, Outlook, Drive), or falls back to `mailto:` with instructions.
- **Duplicate-Safe Restore**: Match records by ID with *Merge & Skip* or *Clean Replace* options.
- **Cloud Sync Adapter**: Configurable endpoints for Supabase, Firebase, or Google Drive.

---

## ⚡ Run Commands

```bash
# Run local development server
npm run dev

# Build production PWA
npm run build

# Preview production build locally
npm run preview
```
