# Strive — Habit Tracker

## Environment variables

Create `.env` files locally (not committed). See examples:

- Backend: `backend/.env.example`
  - `ENV=development`
  - `SECRET_KEY=__set_in_prod__`
  - `MONGO_URL=__set_in_prod__`
  - `DB_NAME=strive`
  - `CORS_ORIGIN=https://your-domain.example` (optional; in dev defaults to `*`)

- Frontend (CRA): `frontend/.env.example`
  - `REACT_APP_API_URL=http://localhost:8000`

- E2E (Playwright): use shell env
  - `E2E_BASE_URL=http://localhost:3000`
  - `E2E_USER_EMAIL=...`
  - `E2E_USER_PASSWORD=...`

## Run locally

Backend:

```
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

Frontend:

```
cd frontend
yarn
yarn start
```

## Playwright

Install and run:

```
npm run e2e:install
E2E_BASE_URL=http://localhost:3000 npm run e2e:run
```

## Deploy envs

- Frontend (Vercel): set `REACT_APP_API_URL`, and any public vars as needed
- Backend host: set `ENV=production`, `SECRET_KEY`, `MONGO_URL`, `DB_NAME`, and `CORS_ORIGIN` to your frontend origin

