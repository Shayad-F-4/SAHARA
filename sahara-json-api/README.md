# Sahara JSON API (ESM)

A lightweight Node.js + Express backend for Sahara using JSON files for persistence. ESM imports, JWT auth, modular routes/controllers, ready for React frontends.

## Endpoints

- POST `/api/users/register` { email, password, full_name?, phone?, location?, bio? }
- POST `/api/users/login` { email, password } → { token, user }
- GET `/api/users/settings` (Authorization: Bearer <token>) → { profile, settings }
- PUT `/api/users/settings` (Authorization: Bearer <token>) body: any of profile/settings fields
- GET `/api/help/` → list posts
- POST `/api/help/` (Authorization: Bearer <token>) { category, title, description, location? }

## Run locally

```bash
cd sahara-json-api
cp .env.example .env
npm install
npm run dev
# API on http://localhost:4000
```

## Project structure

```
sahara-json-api/
  data/
    posts.json
    users.json
  src/
    controllers/
      helpController.js
      usersController.js
    middleware/
      auth.js
    routes/
      help.js
      users.js
    utils/
      fileHelper.js
    server.js
  .env.example
  package.json
  README.md
```

## Notes
- Data is stored in `data/*.json` and persists until manually deleted.
- Replace JWT secret in `.env` with a random string.
- Designed to avoid warnings and crashes; minimal deps.
