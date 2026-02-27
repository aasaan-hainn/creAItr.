# Repository Guidelines

## Project Structure & Module Organization
This repository is a full-stack app with a React frontend and Flask backend.

- `frontend/`: Vite + React client code.
- `frontend/src/pages/`: route-level screens (`LandingPage`, `Chat`, `Auth`).
- `frontend/src/components/`: reusable UI and tool components.
- `frontend/src/context/`: shared React context (auth/session state).
- `backend_server/`: Flask API (`backend.py`) plus auth, DB, ingestion, and analytics modules.
- `my_local_db/`: local ChromaDB data store.
- `uploads/`: user-uploaded files and ingested assets.

## Build, Test, and Development Commands
Frontend (from `frontend/`):

- `npm install`: install dependencies.
- `npm run dev`: start Vite dev server (default `http://localhost:5173`).
- `npm run build`: create production bundle in `dist/`.
- `npm run preview`: preview production build locally.
- `npm run lint`: run ESLint checks.

Backend (from `backend_server/`):

- `pip install -r requirements.txt`: install Python dependencies.
- `python backend.py`: run Flask API (default port from `.env`, commonly `5000`).

## Coding Style & Naming Conventions
- JavaScript/JSX: 2-space indentation, semicolons, double quotes (match existing files).
- React components: `PascalCase` filenames and exports (for example `MyProjects.jsx`).
- Utility modules/helpers: `camelCase` naming.
- Python: follow PEP 8 (`snake_case` for functions/modules, `PascalCase` for classes).
- Linting: use ESLint config in `frontend/eslint.config.js`; fix lint warnings before PR.

## Testing Guidelines
Automated tests are not yet configured in this repo. For now, validate changes with:

- `npm run lint` in `frontend/`.
- Manual UI verification of touched routes/components.
- Manual API checks against changed endpoints (for example with Postman/curl).

When adding tests, colocate frontend tests near components (for example `Component.test.jsx`) and backend tests under a new `backend_server/tests/` directory.

## Commit & Pull Request Guidelines
Recent commits use short, lowercase prefixes like `feat:`, `fix:`, and `style:`. Follow that pattern:

- `feat: add project deletion confirmation modal`
- `fix: handle missing token on /auth/verify`

PRs should include:

- Clear summary of behavior changes.
- Linked issue/task when available.
- Screenshots or short recordings for UI changes.
- Notes on env/config updates (`.env` keys, API dependencies).
