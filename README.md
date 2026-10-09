# ProfitPilot

Responsive expense management system (Next.js + MongoDB).

Track spends like **“John bought glass for Rs 100”** — with users, categories, filters, and month totals.

## Setup

```bash
cd profitpilot
cp .env.example .env.local
# put MONGODB_URI + AUTH_SECRET in .env.local
npm install
npm run dev
```

Open http://localhost:3000

## Features

- Register / login (each user has private expenses)
- Add expense: title, who spent, amount, currency, category, date, note
- List + search/filter + delete
- Dashboard: this month, all time, by person, by category

## Stack

Next.js App Router · MongoDB (Mongoose) · JWT cookie auth · Tailwind
