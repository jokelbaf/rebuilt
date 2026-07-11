# rebuilt

AI-powered job-search workspace. Discover and rank vacancies, then tailor resumes and cover
letters to the roles you choose.

## Features

- Automatic authenticated vacancy discovery from robota.ua and Djinni.
- AI fit scoring against profile, experience, projects, and saved search preferences.
- Approval inbox with dismiss/restore history and transparent live activity events.
- Scheduled searches, salary conversion, and optional Telegram alerts.
- Targeted resume and cover-letter generation with editable HTML templates and PDF export.
- Project import from Git repositories plus reusable profile and experience documents.

## Stack

- **Backend** - FastAPI + SQLModel + loguru, SQLite (async via `aiosqlite`), managed with `uv` (Python 3.14).
- **Frontend** - React Router 7 (framework mode, SPA) + Vite + Tailwind CSS v4 + shadcn/ui, managed with `pnpm`.

## Layout

```
backend/    FastAPI app (app/app.py entry, SQLModel models, /api routes)
frontend/   React Router SPA (app/ routes & components, shadcn ui)
shell/      Tauri v2 desktop shell (Rust): launches the sidecar, opens the window
```

The repo root is a pnpm workspace (`pnpm-workspace.yaml`) whose only JS package is
`frontend/`; the root `package.json` holds the Tauri CLI and the orchestration scripts
(`pnpm dev` / `pnpm build`). `backend/` is a separate `uv` project.

Backend modules:

```
app/models/      SQLModel tables (vacancy, template, markdown file, project, resume, cover letter, git source)
app/schemas/     camelCase Pydantic request/response models
app/crud/        async data-access, one module per resource
app/services/    business logic (generation, export, repo import, context)
app/services/discovery/ vacancy search runner, scoring, scheduler, currency, promotion
app/ai/          AiProvider interface + Claude Code (claude -p) implementation + prompts
app/parsing/     site-specific vacancy parsers (robota.ua, work.ua, djinni.co, linkedin.com)
app/gitops/      git provider interface + GitHub implementation
app/pdf/         WeasyPrint HTML -> PDF renderer
app/routes/      FastAPI routers, one per resource
app/responses/   { message, data } envelope helpers
packages/jobboards/ standalone authenticated job-board clients and parser tests
```

## Data location

The app stores its SQLite database, exported PDFs and temporary repo clones in a
single data directory, resolved in this order:

1. `REBUILT_DATA` environment variable, if set (used in development - `.env` points it at `../data`).
2. Otherwise a platform-specific user data directory (`platformdirs`), e.g.
   `~/.local/share/ReBuilt` (Linux), `~/Library/Application Support/ReBuilt` (macOS),
   `%LOCALAPPDATA%\ReBuilt` (Windows).

The AI backend supports both the local `claude` and `codex` CLIs through a unified
`AiProvider` interface. Select the active provider in Settings > AI Backend; the
choice is persisted in the application database. Each CLI manages its own sign-in,
and existing chats remain bound to the provider they were created with.

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

## Production (from source)

The frontend builds to a static SPA that the backend serves directly.

```bash
cd frontend && pnpm build      # outputs build/client/
cp -r build/client/* ../backend/static/
cd backend && PRODUCTION=yes uv run python app/app.py
```

In production the backend serves the SPA from `static/` via `app.frontend()` (with
client-side-routing fallback). Production mode is enabled by
`PRODUCTION=yes` **or automatically whenever the app is compiled**, so the packaged binary needs no environment variables.

## Packaging (desktop app)

The desktop build has two layers: the backend (and the bundled SPA) is compiled into
a single-file executable with Nuitka, which is then shipped as a Tauri v2 sidecar.

```
backend/build.py     Nuitka build: pnpm build -> stage static/ -> onefile -> sidecar
shell/               Tauri v2 shell (Rust): launches the sidecar, opens the window
```

**Prerequisites:** the backend toolchain (`uv`), the frontend toolchain (`pnpm`), a
[Rust toolchain](https://www.rust-lang.org/tools/install), and the
[Tauri Linux system dependencies](https://v2.tauri.app/start/prerequisites/)
(`webkit2gtk-4.1`, `libsoup-3.0`, …). Nuitka needs a C compiler; a working `patchelf`
is provided as a backend dev dependency (the system `patchelf 0.18.0` is rejected by
Nuitka, so `build.py` puts the venv's copy ahead on `PATH`).

Everything runs from the repo root; no `cd` needed.

```bash
pnpm install          # once - installs the workspace (frontend) + the Tauri CLI
pnpm build            # backend sidecar (frontend + Nuitka) -> tauri build
```

`pnpm build` runs `pnpm backend` then `tauri build`:

- **`pnpm backend`** (`uv run --project backend python backend/build.py --sidecar`)
  builds the frontend, stages it into `backend/static/`, compiles `app/app.py` into
  `backend/dist/ReBuilt` (onefile, with `static/` and the `langdetect` data bundled),
  and copies it into `shell/binaries/rebuilt-server-<target-triple>`. Pass
  `--skip-frontend` to reuse an already-staged `static/`, or omit `--sidecar` to just
  produce the binary.
- **`tauri build`** bundles the shell -> `shell/target/release/bundle/{deb,rpm,appimage}/`.

Use `pnpm dev` (= `tauri dev`) to run the shell during development - build the sidecar
once with `pnpm backend` first.

**How it fits together:** at launch the Rust shell picks a free localhost port, spawns
the backend sidecar with that `PORT` (inheriting the environment so the `claude` CLI
stays reachable), shows a splash screen, waits for `/api/health`, then points the
window at `http://127.0.0.1:<port>`. The backend serves both the API and the SPA, so
the frontend's relative `/api` calls work unchanged. On exit the shell terminates the
sidecar process tree. The inherited environment keeps both supported AI CLIs
reachable. Application data (database, exports, clones) lives in the platform
user-data directory - see [Data location](#data-location).

## License

The project is licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE) for details.
