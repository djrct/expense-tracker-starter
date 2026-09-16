# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

This is the starter project for Mosh Hamedani's [Claude Code course](https://codewithmosh.com/p/claude-code). Per the README, it **intentionally ships with a bug, poor UI, and messy code** — these are the material the course fixes step by step. Do not treat the existing flaws as accidental or as conventions to imitate; they are the work items.

## Commands

```bash
npm install      # install dependencies
npm run dev      # Vite dev server on http://localhost:5173
npm run build    # production build to dist/
npm run preview  # serve the built dist/
npm run lint     # ESLint over all .js/.jsx
```

There is **no test infrastructure** — no test script, no test runner, no test files. Any request to "run the tests" requires setting up a framework first (Vitest is the natural fit alongside Vite).

### Killing a stray dev server (Windows)

Ctrl+C stops the `npm` wrapper but frequently leaves the `vite` child process holding the port, so the next `npm run dev` silently starts on 5174, 5175, and so on. Free the port explicitly:

```powershell
Get-NetTCPConnection -LocalPort 5173 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## Architecture

React 19 + Vite 7, plain JavaScript (no TypeScript), plain CSS (no framework).

The entire application is **one component**: `src/App.jsx` holds all state, all derived values, and all markup in ~157 lines. `src/main.jsx` does nothing but mount it under `StrictMode`. There is no router, no state library, no backend, and no persistence — transactions live in a `useState` array seeded with eight hardcoded rows, so every refresh resets the data.

Data flow inside `App.jsx`, in the order it appears:

1. **State** — `transactions` plus six separate `useState` values for the form fields (`description`, `amount`, `type`, `category`) and the filters (`filterType`, `filterCategory`).
2. **Derived totals** — `totalIncome` / `totalExpenses` computed by `filter().reduce()`, then `balance` as their difference. Recomputed inline on every render; nothing is memoized.
3. **Derived list** — `filteredTransactions` built by reassigning a `let` and chaining `.filter()` calls, one per active filter.
4. **`handleSubmit`** — guards on empty description/amount, appends a transaction keyed by `Date.now()`, stamps today's date, resets the form.

The `categories` array (`src/App.jsx:23`) is the single source of truth for category options and drives both the form's category `<select>` and the filter `<select>`.

Styling lives in `src/index.css` (global reset + body font) and `src/App.css` (component classes, flexbox layout, fixed `max-width: 800px`). Class names map one-to-one onto the sections of `App.jsx` (`.summary`, `.summary-card`, `.add-transaction`, `.transactions`, `.filters`). Note that `.income-amount` and `.expense-amount` are reused for both the summary cards and the table cells, so changing them affects both.

## Known Defects

These are pre-existing and deliberate. Know which one you are being asked to fix.

- **The totals bug** (`src/App.jsx:25-31`): amounts are stored as **strings**, both in the seed data and in `handleSubmit` (the number `<input>` yields a string). `reduce((sum, t) => sum + t.amount, 0)` therefore concatenates instead of adding — Income renders `$05000`, Expenses `$0120015080095651545`, and Balance `NaN`. A real fix has to cover the seed data, the form submission, and the reducers together; patching only the reducer leaves new entries broken.
- **Miscategorized seed row** (`src/App.jsx:9`): "Freelance Work" is `type: "expense"` with `category: "salary"`.
- **Orphaned table column** (`src/App.jsx:135` and `:147`): an empty `<th>` and empty `<td>` remain where a per-row action (delete) was removed. Adding a delete feature should reuse those slots.
- **No amount formatting**: values are interpolated raw as `${t.amount}` with no currency or decimal formatting.

## Conventions

- Double-quoted strings and semicolons inside `App.jsx`; the Vite-generated files (`main.jsx`, config files) use single quotes and omit semicolons. Match whichever file you are editing.
- ESLint runs flat config with `react-hooks` and `react-refresh`; `no-unused-vars` is an **error**, with an exemption for identifiers matching `^[A-Z_]`.
- The npm package is named `finance-tracker` and the UI heading reads "Finance Tracker", while the repo is `expense-tracker-starter`. Both names are in play; don't "correct" one to the other without being asked.
