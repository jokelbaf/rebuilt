<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-hero?w=880&amp;theme=dark&amp;v=2" />
  <img alt="ReBuilt — turn the job search into a focused workflow" src="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-hero?w=880&amp;theme=light&amp;v=2" width="880" />
</picture>

ReBuilt is a local-first desktop workspace for finding relevant roles and creating focused
applications. It combines authenticated vacancy discovery, AI-assisted fit scoring, reusable
career context, and document generation in one private workflow.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-section?w=880&amp;theme=dark&amp;label=Overview&amp;kicker=Product%20loop" />
  <img alt="Overview" src="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-section?w=880&amp;theme=light&amp;label=Overview&amp;kicker=Product%20loop" width="880" />
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-workflow?w=880&amp;theme=dark" />
  <img alt="Discover, decide, and create with ReBuilt" src="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-workflow?w=880&amp;theme=light" width="880" />
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-section?w=880&amp;theme=dark&amp;label=Stack&amp;kicker=Core%20technologies" />
  <img alt="Stack" src="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-section?w=880&amp;theme=light&amp;label=Stack&amp;kicker=Core%20technologies" width="880" />
</picture>

| Layer | Technology |
| --- | --- |
| Backend | Python 3.14, FastAPI, SQLModel, SQLite, Pydantic, WeasyPrint |
| Frontend | React Router, React, Vite, Tailwind CSS, shadcn/ui, TanStack Query |
| Desktop | Tauri v2, Rust, Nuitka one-file sidecar |
| Tooling | `uv`, `pnpm`, Ruff, Pyright, ESLint, Prettier, Clippy, rustfmt |
| AI | Claude Code and Codex CLIs behind a unified provider interface |

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-section?w=880&amp;theme=dark&amp;label=Architecture&amp;kicker=Repository%20map" />
  <img alt="Architecture" src="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-section?w=880&amp;theme=light&amp;label=Architecture&amp;kicker=Repository%20map" width="880" />
</picture>

```text
backend/
├── app/                    FastAPI application and API routes
│   ├── ai/                 providers, prompts, chat streaming, MCP tools
│   ├── crud/               asynchronous data access
│   ├── models/             SQLModel database tables
│   ├── services/           generation, discovery, backups, imports
│   └── migrations/         embedded forward-only schema revisions
└── packages/jobboards/     authenticated job-board clients and parsers

frontend/                   React Router SPA, components, hooks, typed API layer
shell/                      Tauri v2 host that manages the compiled backend sidecar
```

The root is a pnpm workspace for frontend and desktop orchestration. `backend/` remains an
independent uv workspace, while `shell/` is a standalone Rust crate.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-section?w=880&amp;theme=dark&amp;label=Data%20%26%20AI&amp;kicker=Local-first" />
  <img alt="Data and AI" src="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-section?w=880&amp;theme=light&amp;label=Data%20%26%20AI&amp;kicker=Local-first" width="880" />
</picture>

Application state, exported documents, chat uploads, and temporary repository clones live in one
platform-specific data directory. Set `REBUILT_DATA` to override it during development.

| Platform | Default location |
| --- | --- |
| Linux | `~/.local/share/ReBuilt` |
| macOS | `~/Library/Application Support/ReBuilt` |
| Windows | `%LOCALAPPDATA%\ReBuilt` |

The active AI provider is selected in the application and stored locally. Each provider CLI owns
its authentication and sessions; ReBuilt supplies structured career context without moving the
application database into a hosted service. Versioned database migrations and `.rebuilt` backups
preserve existing data across upgrades.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-section?w=880&amp;theme=dark&amp;label=Development&amp;kicker=Local%20workflow" />
  <img alt="Development" src="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-section?w=880&amp;theme=light&amp;label=Development&amp;kicker=Local%20workflow" width="880" />
</picture>

Start the backend at `http://localhost:8000`:

```bash
cd backend
cp .env.example .env
uv run python app/app.py
```

Start the frontend at `http://localhost:1420`; Vite proxies `/api` to the backend:

```bash
cd frontend
pnpm install
pnpm dev
```

With both development servers running, start the Tauri shell from the repository root:

```bash
pnpm tauri dev
```

Run the local quality gates before submitting a change:

```bash
cd backend && uv run ruff format --check . && uv run ruff check . && uv run pyright
cd frontend && pnpm format:check && pnpm lint && pnpm typecheck
cd shell && cargo fmt --all -- --check && cargo clippy --all-targets --all-features -- -D warnings
```

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-section?w=880&amp;theme=dark&amp;label=Production&amp;kicker=Web%20deployment" />
  <img alt="Production" src="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-section?w=880&amp;theme=light&amp;label=Production&amp;kicker=Web%20deployment" width="880" />
</picture>

The frontend builds to a static SPA that FastAPI serves alongside the API:

```bash
cd frontend && pnpm build
cp -r build/client/* ../backend/static/
cd ../backend && PRODUCTION=yes uv run python app/app.py
```

Compiled builds enable production mode automatically, so packaged applications do not need a
`PRODUCTION` environment variable.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-section?w=880&amp;theme=dark&amp;label=Desktop%20packaging&amp;kicker=Tauri%20%2B%20Nuitka" />
  <img alt="Desktop packaging" src="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-section?w=880&amp;theme=light&amp;label=Desktop%20packaging&amp;kicker=Tauri%20%2B%20Nuitka" width="880" />
</picture>

The desktop build is a compact three-stage pipeline:

1. `pnpm build` compiles the frontend and stages the SPA in `backend/static/`.
2. Nuitka compiles FastAPI, the SPA, and required package data into one backend executable.
3. Tauri bundles that executable as the `rebuilt-server` sidecar for the host platform.

Install the uv, pnpm, and Rust toolchains plus the
[Tauri system dependencies](https://v2.tauri.app/start/prerequisites/), then run from the repository
root:

```bash
pnpm install
pnpm build
```

Installers are written under `shell/target/release/bundle/`. For desktop development, build the
sidecar once with `pnpm backend`, then launch `pnpm dev`.

At runtime the Rust shell chooses a free local port, starts the backend, waits for `/api/health`,
and navigates the window to the bundled application. It also terminates the sidecar process tree
when the window exits.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-section?w=880&amp;theme=dark&amp;label=License&amp;kicker=GPL-3.0" />
  <img alt="License" src="https://gita.jokelbaf.dev/api/widget/public/rebuilt-readme-section?w=880&amp;theme=light&amp;label=License&amp;kicker=GPL-3.0" width="880" />
</picture>

ReBuilt is licensed under the [GNU General Public License v3.0](LICENSE).
