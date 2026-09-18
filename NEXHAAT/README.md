# NexHaat starter

This Task 1 skeleton was copied from `SIH-2026` and reduced to its farmer journey:

- `nexhaat-backend`: Express API with OTP registration/login and protected farmer lot endpoints.
- `nexhaat-frontend`: static NexHaat pages for farmer registration, login, dashboard, and posting/listing lots.

Run `npm install` then `npm run dev` in `nexhaat-backend`. Serve `nexhaat-frontend` with any static server. The displayed OTP is demo-only and must not be returned by a production API.

`POST /api/recommend` requires farmer authentication and a NexHaat-owned `lot_id`, plus `latitude`, `longitude`, and optional `max_distance_km`. It reads the listing quantity (quintals) and the latest NexHaat mandi price (₹/quintal), calculates gross earnings, Haversine GPS distance, ₹4/km transport, and net profit, then returns all options sorted by net profit.

## Demo seed data

Run `npm run seed:demo` in `nexhaat-backend` before a live demo. `seedDemoData.js` clears only its own demo records, then upserts three markets, two farmers with lots, two buyer requirements, and 11 days of price history — all keyed on fixed ids so re-running it always reproduces the same screen.

It then drives the real recommendation, price-prediction, and matching services and fails loudly if the demo would not look right:

| Screen | What the demo shows |
| --- | --- |
| Best Mandi (`/api/recommend`) | Market A lists the **highest** price (₹2,150/q) but Market B nets **more** (₹10,440 vs ₹10,150) after ₹4/km transport over 5 quintals. Ramesh's picked lot is 500 kg of Wheat at 26.49, 89.55. |
| Market Prices (`/api/market/prices`) | The same three markets for `Wheat`, plus a second price level for `Potato`. |
| Price Trend (`/api/market/price-prediction`) | `Wheat` reads *trending up* (advisory: wait) and `Potato` reads *trending down* (advisory: sell now), so the signal is visibly computed. |
| Buyer matching (`/api/buyer-requirements/:id/matches`) | `Northeast AgriTraders`' Wheat requirement matches Ramesh's lot; `Dooars Fresh Produce Co.`' Onion requirement returns zero matches to prove the filter works. |

Demo logins (OTP is returned by `/api/auth/send-otp` and printed by `server.js`): Ramesh Roy `9800000001`, Sabina Khatun `9800000002`, Northeast AgriTraders `9800000003`, Dooars Fresh Produce Co. `9800000004`.

The seeded demo mandis are named `Market A/B/C - ...` on purpose: live Agmarknet refresh compares canonical mandi names, so the live feed can never overwrite the seeded prices mid-presentation.

## Live mandi prices

Copy `nexhaat-backend/.env.example` to `.env` and set `AGMARKNET_API_KEY` with a data.gov.in API key. NexHaat uses Agmarknet resource `9ef84268-d588-465a-a308-a864a43d0070` server-side. `GET /api/market/prices?crop=Tomato` returns the live normalized comparison, while `/api/recommend` refreshes matching geocoded NexHaat mandis before ranking. If the key or live service is unavailable, both endpoints label and use NexHaat's cached local prices.
