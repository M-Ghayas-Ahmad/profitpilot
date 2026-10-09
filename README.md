# ProfitPilot

Partner capital & expense ledger for small businesses (Next.js + MongoDB).

Built for cases like: two partners commit 25k each (50k target), put in 5k each when the shed needs 10k, then log buys (jali, paint, plastic…) and see **cash left**.

## Money flow

1. **Commit** — partners agree how much each will invest  
2. **Put in** — cash enters the pot (contribution)  
3. **Spend** — buys leave the pot (expense)  
4. **Cash left** — contributed − spent  

## Setup

```bash
cd expense-system
# set MONGODB_URI + AUTH_SECRET in .env or .env.local
npm install
npm run dev -- --hostname 127.0.0.1
```

Open http://127.0.0.1:3000

## Stack

Next.js App Router · MongoDB (Mongoose) · JWT cookie auth · Tailwind
