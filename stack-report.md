Tech stack and API call sites

- Frontend: Create React App (via CRACO)
  - Detected by `react-scripts` and `@craco/craco` in `frontend/package.json`.
  - Backend calls use Axios.
  - Call sites:
    - `frontend/src/App.js` (multiple axios.get/post/delete to `/api/...`)
    - `frontend/src/components/AddHabitModal.tsx` (axios.post to `/api/habits`)

- Backend: FastAPI (Python)
  - Detected by `from fastapi import FastAPI` in `backend/server.py`.
  - DB: MongoDB via `motor` with `MONGO_URL` and `DB_NAME` from env.
  - CORS currently wildcard; will be tightened via env in a later step.
  - SECRET_KEY currently hard-coded; will be moved to env in a later step.

Notes
- Frontend env currently uses `REACT_APP_BACKEND_URL`; will migrate to `REACT_APP_API_URL` via a shared `src/config` helper.
- Tests: `backend_test.py` currently uses a hard-coded preview URL; will be shifted to env for hygiene.

