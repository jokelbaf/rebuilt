"""Compile the backend (and bundled frontend) into a single-file executable with Nuitka."""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent
FRONTEND_DIR = ROOT_DIR / "frontend"
FRONTEND_BUILD = FRONTEND_DIR / "build" / "client"
STATIC_DIR = BACKEND_DIR / "static"
OUTPUT_DIR = BACKEND_DIR / "dist"
ASSETS_DIR = BACKEND_DIR / "assets"
SIDECAR_DIR = ROOT_DIR / "shell" / "binaries"

APP_NAME = "ReBuilt"
SIDECAR_NAME = "rebuilt-server"
VERSION = "0.4.0"
IS_WINDOWS = sys.platform == "win32"
IS_MACOS = sys.platform == "darwin"


def log(message: str) -> None:
    """Print a build step marker."""
    print(f"\033[36m==>\033[0m {message}", flush=True)


def run(command: list[str], cwd: Path, env: dict[str, str] | None = None) -> None:
    """Run a subprocess, streaming its output and failing on a non-zero exit."""
    print(f"    $ {' '.join(command)} (in {cwd})", flush=True)
    subprocess.run(command, cwd=cwd, env=env, check=True)


def build_frontend() -> None:
    """Build the React SPA and stage it into the backend static directory."""
    pnpm = shutil.which("pnpm")
    if not pnpm:
        raise SystemExit("pnpm was not found on PATH; install it or pass --skip-frontend.")

    log("Building frontend (pnpm build)")
    run([pnpm, "build"], cwd=FRONTEND_DIR)

    if not FRONTEND_BUILD.is_dir():
        raise SystemExit(f"Frontend build output not found at {FRONTEND_BUILD}.")

    log(f"Staging frontend into {STATIC_DIR}")
    shutil.rmtree(STATIC_DIR, ignore_errors=True)
    shutil.copytree(FRONTEND_BUILD, STATIC_DIR)


def icon_option() -> list[str]:
    """Return the platform-specific Nuitka icon flag if an icon asset exists."""
    if IS_WINDOWS and (ico := ASSETS_DIR / "icon.ico").is_file():
        return [f"--windows-icon-from-ico={ico}"]
    if IS_MACOS and (icns := ASSETS_DIR / "icon.icns").is_file():
        return [f"--macos-app-icon={icns}"]
    if (png := ASSETS_DIR / "icon.png").is_file():
        return [f"--linux-icon={png}"]
    return []


def build_binary() -> Path:
    """Compile the backend into a single-file executable and return its path."""
    if not STATIC_DIR.is_dir():
        raise SystemExit(f"Static directory {STATIC_DIR} is missing; run without --skip-frontend.")

    output_name = f"{APP_NAME}.exe" if IS_WINDOWS else APP_NAME
    command = [
        sys.executable,
        "-m",
        "nuitka",
        "--standalone",
        "--onefile",
        f"--output-dir={OUTPUT_DIR}",
        f"--output-filename={output_name}",
        "--include-data-dir=static=static",
        "--include-package=jobboards",
        "--include-package-data=langdetect",
        "--assume-yes-for-downloads",
        "--company-name=Nekolab",
        f"--product-name={APP_NAME}",
        f"--file-version={VERSION}",
        f"--product-version={VERSION}",
        "--copyright=Copyright (c) JokelBaf",
        "--file-description=AI resume builder.",
        *icon_option(),
    ]
    if IS_WINDOWS:
        command.append("--windows-console-mode=disable")
    command.append("app/app.py")

    # Nuitka needs a non-buggy patchelf on Linux; the one shipped in the venv works.
    env = dict(os.environ)
    venv_bin = Path(sys.executable).parent
    env["PATH"] = f"{venv_bin}{os.pathsep}{env.get('PATH', '')}"

    log("Compiling backend with Nuitka (this takes several minutes)")
    run(command, cwd=BACKEND_DIR, env=env)

    binary = OUTPUT_DIR / output_name
    if not binary.is_file():
        raise SystemExit(f"Expected compiled binary at {binary}, but it was not produced.")
    log(f"Built {binary} ({binary.stat().st_size / 1_048_576:.1f} MiB)")
    return binary


def rust_target_triple() -> str:
    """Return the Rust host target triple used to name Tauri sidecar binaries."""
    output = subprocess.check_output(["rustc", "-Vv"], text=True)
    for line in output.splitlines():
        if line.startswith("host:"):
            return line.split(":", 1)[1].strip()
    raise SystemExit("Could not determine the Rust host target triple from `rustc -Vv`.")


def copy_sidecar(binary: Path) -> None:
    """Copy the compiled binary into the Tauri sidecar directory with a target-triple name."""
    triple = rust_target_triple()
    suffix = ".exe" if IS_WINDOWS else ""
    SIDECAR_DIR.mkdir(parents=True, exist_ok=True)
    destination = SIDECAR_DIR / f"{SIDECAR_NAME}-{triple}{suffix}"
    shutil.copy2(binary, destination)
    log(f"Copied sidecar to {destination}")


def main() -> None:
    """Build the frontend, compile the backend, and optionally stage the Tauri sidecar."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--skip-frontend",
        action="store_true",
        help="Reuse the already-staged static/ directory instead of rebuilding the frontend.",
    )
    parser.add_argument(
        "--sidecar",
        action="store_true",
        help="Copy the binary into shell/binaries with the Rust target-triple suffix.",
    )
    args = parser.parse_args()

    if not args.skip_frontend:
        build_frontend()
    binary = build_binary()
    if args.sidecar:
        copy_sidecar(binary)
    log("Done.")


if __name__ == "__main__":
    main()
