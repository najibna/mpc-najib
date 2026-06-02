# Frontend — Fraud / Expense Policy Analyzer

React + TypeScript + Vite + TailwindCSS + Recharts dashboard.

## Run

```bash
npm install
cp .env.example .env   # set VITE_API_BASE_URL if backend isn't on :8000
npm run dev
```

Open http://localhost:5173.

## Flow

1. Upload an `.xlsx` (drag & drop or browse).
2. The app uploads, triggers analysis, and shows a dashboard:
   summary cards, risk charts, and a filterable/sortable transactions table.
3. Expand any row to see triggered rules, explanation, and recommended action.
4. Export flagged transactions to CSV or XLSX.
