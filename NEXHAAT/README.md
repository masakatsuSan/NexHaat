# NexHaat starter

This Task 1 skeleton was copied from `SIH-2026` and reduced to its farmer journey:

- `nexhaat-backend`: Express API with OTP registration/login and protected farmer lot endpoints.
- `nexhaat-frontend`: static NexHaat pages for farmer registration, login, dashboard, and posting/listing lots.

Run `npm install` then `npm run dev` in `nexhaat-backend`. Serve `nexhaat-frontend` with any static server. The displayed OTP is demo-only and must not be returned by a production API.

`POST /api/recommend` requires farmer authentication and a NexHaat-owned `lot_id`, plus `latitude`, `longitude`, and optional `max_distance_km`. It reads the listing quantity (quintals) and the latest NexHaat mandi price (₹/quintal), calculates gross earnings, Haversine GPS distance, ₹4/km transport, and net profit, then returns all options sorted by net profit.

## Live mandi prices

Copy `nexhaat-backend/.env.example` to `.env` and set `AGMARKNET_API_KEY` with a data.gov.in API key. NexHaat uses Agmarknet resource `9ef84268-d588-465a-a308-a864a43d0070` server-side. `GET /api/market/prices?crop=Tomato` returns the live normalized comparison, while `/api/recommend` refreshes matching geocoded NexHaat mandis before ranking. If the key or live service is unavailable, both endpoints label and use NexHaat's cached local prices.
