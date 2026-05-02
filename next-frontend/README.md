# Flex 2.0 Next.js Frontend

This folder contains the Next.js migration frontend for Flex 2.0.

## What Was Migrated
- Next.js App Router structure
- Tailwind CSS v4 global styling
- Existing Flex UI/UX and role workflows running inside a dedicated Next console shell

## How To Run
1. `cd next-frontend`
2. `npm install`
3. `npm run dev`

The app will run on:
- `http://localhost:3000`

## Routes
- `/` futuristic landing experience
- `/console` full Flex application workspace
- `/credentials` seeded login directory (for local testing)

## Notes
- `app/console/page.tsx` now loads `components/console-runtime.tsx` directly inside Next.
- The old cross-project import from root `src/App.tsx` has been removed.
- Backend remains in `backend/` (FastAPI + PostgreSQL).

## Next Steps (Recommended)
- Move `src/App.tsx` into `next-frontend/components/`.
- Split role views into dedicated route segments.
- Replace local state with API calls to FastAPI.