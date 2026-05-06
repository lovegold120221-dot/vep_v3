# Repository Guidelines

## Project Structure
- **Stack:** Vite + React + TypeScript.
- **Runtime:** `src/`.
- **Key Files:** 
  - `src/App.tsx`: Main UI, Gemini Live wiring, Firebase auth, and Realtime DB.
  - `src/main.tsx`: App mounting.
  - `src/lib/`: Shared utilities (`audio.ts` for PCM playback, `personality.ts` for prompts).
  - `src/index.css`: Global Tailwind CSS.
- **Config:** Root files including `vite.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `firebase-applet-config.json`, and `firestore.rules`.
- **Output:** `dist/` (do not edit).

## Commands
- `npm install`: Install dependencies.
- `npm run dev`: Start Vite on `0.0.0.0:3000`.
- `npm run build`: Create production bundle.
- `npm run preview`: Local preview of build.
- `npm run lint`: Type-check gate (`tsc --noEmit`).
- `npm run clean`: Remove `dist/`.

## Conventions
- **Style:** React functional components/hooks, single quotes, semicolons, 2-space indentation.
- **Naming:** `PascalCase` for components/interfaces; `camelCase` for functions/variables/refs.
- **Organization:** Move independently testable logic from `App.tsx` to `src/lib/`.
- **Commits:** Use short Conventional Commit messages (e.g., `fix: ...`, `feat: ...`).

## Testing & Verification
- **Runner:** None configured.
- **Workflow:** Run `npm run lint` and `npm run build` before submitting.
- **Manual QA:** Use `npm run dev` to verify sign-in, mic permissions, chat updates, and artifacts.
- **New Tests:** Prefer colocated `*.test.ts` or `*.test.tsx`.

## Security & Config
- **Secrets:** `VITE_GEMINI_API_KEY` belongs in `.env.local`. Never commit `.env` files.
- **Firebase:** Review database path and permission changes in `firestore.rules` carefully.
