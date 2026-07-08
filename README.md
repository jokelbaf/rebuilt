# rebuilt

AI-powered resume builder. Describe a position and let AI tailor your resume or cover letter to match it.

## Stack

- **Backend** - FastAPI + SQLModel + loguru, SQLite (async via `aiosqlite`), managed with `uv` (Python 3.14).
- **Frontend** - React Router 7 (framework mode, SPA) + Vite + Tailwind CSS v4 + shadcn/ui, managed with `pnpm`.

## Layout

```
backend/    FastAPI app (app/app.py entry, SQLModel models, /api routes)
frontend/   React Router SPA (app/ routes & components, shadcn ui)
```

Backend modules:

```
app/models/      SQLModel tables (vacancy, template, markdown file, project, resume, cover letter, git source)
app/schemas/     camelCase Pydantic request/response models
app/crud/        async data-access, one module per resource
app/services/    business logic (generation, export, repo import, context)
app/ai/          AiProvider interface + Claude Code (claude -p) implementation + prompts
app/parsing/     site-specific vacancy parsers (robota.ua, work.ua, djinni.co, linkedin.com)
app/git/         git provider interface + GitHub implementation
app/pdf/         WeasyPrint HTML -> PDF renderer
app/routes/      FastAPI routers, one per resource
app/responses/   { message, data } envelope helpers
```

## Data location

The app stores its SQLite database, exported PDFs and temporary repo clones in a
single data directory, resolved in this order:

1. `REBUILT_DATA` environment variable, if set (used in development - `.env` points it at `../data`).
2. Otherwise a platform-specific user data directory (`platformdirs`), e.g.
   `~/.local/share/ReBuilt` (Linux), `~/Library/Application Support/ReBuilt` (macOS),
   `%LOCALAPPDATA%\ReBuilt` (Windows).

The AI backend shells out to the local `claude` CLI in print mode (`claude -p`);
`AiProvider` is a unified interface so other providers (e.g. an OpenAI API backend)
can be added later. The default model is `sonnet`.

## Development

Backend (http://localhost:8000):

```bash
cd backend
cp .env.example .env
uv run python app/app.py
```

Frontend (http://localhost:5173, proxies `/api` to the backend):

```bash
cd frontend
pnpm install
pnpm dev
```

## Production

The frontend builds to a static SPA that the backend serves directly.

```bash
cd frontend && pnpm build      # outputs build/client/
cp -r build/client/* ../backend/static/
cd backend && PRODUCTION=yes uv run python app/app.py
```

In production (`PRODUCTION=yes`) the backend serves the SPA from `static/` via
`app.frontend()` (with client-side-routing fallback) and disables API docs. When the
app is later compiled with Nuitka, the static directory is resolved next to the
executable, so the same wiring works for the bundled desktop build.
