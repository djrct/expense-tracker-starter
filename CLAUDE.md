# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

This is the starter project for Mosh Hamedani's [Claude Code course](https://codewithmosh.com/p/claude-code). Per the README, it **originally shipped with a bug, poor UI, and messy code** — these are the material the course fixes step by step. Some have since been fixed (see Known Defects); the README still describes the original state.

## Commands

There is **no test infrastructure** — no test script, no test runner, no test files. Any request to "run the tests" requires setting up a framework first (Vitest is the natural fit alongside Vite).

### Killing a stray dev server (Windows)

Ctrl+C stops the `npm` wrapper but frequently leaves the `vite` child process holding the port, so the next `npm run dev` silently starts on 5174, 5175, and so on. Free the port explicitly:

```powershell
Get-NetTCPConnection -LocalPort 5173 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

## Architecture

React 19 + Vite 7, plain JavaScript (no TypeScript), plain CSS (no framework). No router, no state library, no backend, no persistence — `transactions` lives in a `useState` array seeded with eight hardcoded rows, so every refresh resets the data.

**Component structure:**

- `src/App.jsx` — owns the `transactions` array state, passes it down to children
- `src/components/Summary.jsx` — computes and displays `totalIncome`, `totalExpenses`, `balance` from the `transactions` prop
- `src/components/TransactionForm.jsx` — owns form state (`description`, `amount`, `type`, `category`), calls the `onAdd` prop on submit
- `src/components/TransactionList.jsx` — owns filter state (`filterType`, `filterCategory`), renders the filtered transactions table, and calls the `onDelete` prop with a transaction's `id` after a `window.confirm`
- `src/constants.js` — exports `CATEGORIES`, shared by the form's category select and the list's filter select
- `src/format.js` — exports `formatAmount(amount)`, a module-level `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })`. Every displayed amount goes through it: `Summary`'s three cards and `TransactionList`'s amount cells

`App.jsx` is deliberately thin (~40 lines): one piece of state, two handlers. New feature state belongs in the child that uses it, and only rises to `App` when a second component needs it. `onAdd` and `onDelete` are the only channels by which a child mutates App state.

Deletion keys off `id`, never the row index — `TransactionList` renders a *filtered* view, so an index refers to the wrong transaction whenever a filter is active.

### Styling

All CSS is global and centralized: `src/index.css` (reset + body font) and `src/App.css` (everything else). **Components have no stylesheets of their own** and do not import CSS — `App.jsx` imports `App.css` once and the class names cascade everywhere.

Before moving rules into a component stylesheet, check for sharing: `.income-amount` and `.expense-amount` are used by **both** `Summary`'s cards and `TransactionList`'s amount cells, so splitting them per-component breaks one of the two. Class names otherwise map one-to-one onto components (`.summary`/`.summary-card`, `.add-transaction`, `.transactions`/`.filters`, `.delete-btn`).

## Known Defects

- **Miscategorized seed row** (`src/App.jsx:12`): "Freelance Work" is `type: "expense"` with `category: "salary"`. Almost certainly meant to be income; flipping it moves $800 from expenses to income, so it changes the displayed totals.
- **No edit**: rows can be added and deleted, but an existing transaction cannot be edited in place.

### Fixed — do not reintroduce

`formatAmount` returns the **currency symbol itself** (`$5,000.00`), so JSX must never prefix a literal `$` — that was the original shape and it would render `$$5,000.00`. `TransactionList` still prefixes `+`/`-` by `type`, which is separate and correct: amounts are stored unsigned. The locale is hardcoded `en-US`.

Amounts must be stored as **numbers**, never strings. The original bug was `reduce((sum, t) => sum + t.amount, 0)` concatenating because seed amounts were quoted and the number `<input>` yields a string, rendering Income as `$05000` and Balance as `NaN`. Both entry points are now guarded: seed data is unquoted, and `TransactionForm` runs `parseFloat` before calling `onAdd`. Any new path that introduces a transaction must parse too. Note the submit guard tests `Number.isNaN(parsedAmount)`, not falsiness, so a legitimate `0` is accepted.

## Conventions

- Double-quoted strings and semicolons in `App.jsx`'s body and in every file under `src/components/`; the Vite-generated files (`main.jsx`, `App.jsx`'s import lines, config files) use single quotes and omit semicolons. Match whichever file you are editing.
- Components are function declarations with a `default` export at the bottom, one component per file, props destructured in the signature. No PropTypes or TypeScript anywhere — do not add them to a single file in isolation.
- The npm package is named `finance-tracker` and the UI heading reads "Finance Tracker", while the repo is `expense-tracker-starter`. Both names are in play; don't "correct" one to the other without being asked.

