#!/usr/bin/env python3
import json
import pathlib
import subprocess
import sys


BIOME_EXTENSIONS = {
    ".css",
    ".js",
    ".json",
    ".jsonc",
    ".jsx",
    ".mjs",
    ".ts",
    ".tsx",
    ".yaml",
    ".yml",
}

PYTHON_EXTENSIONS = {".py"}


def notify(message: str) -> None:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": message,
                }
            },
            ensure_ascii=False,
        )
    )


def load_payload() -> dict:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return {}
    if isinstance(payload, dict):
        return payload
    return {}


def repo_root() -> pathlib.Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode == 0:
        return pathlib.Path(result.stdout.strip())
    return pathlib.Path.cwd()


def normalize_path(root: pathlib.Path, value: object) -> pathlib.Path | None:
    if not isinstance(value, str) or not value:
        return None

    path = pathlib.Path(value)
    if not path.is_absolute():
        path = root / path

    try:
        path = path.resolve().relative_to(root.resolve())
    except ValueError:
        return None
    return path


def payload_paths(root: pathlib.Path, payload: dict) -> list[pathlib.Path]:
    tool_input = payload.get("tool_input")
    if not isinstance(tool_input, dict):
        return []

    candidates = [
        tool_input.get("file_path"),
        tool_input.get("path"),
    ]
    paths = []
    for candidate in candidates:
        path = normalize_path(root, candidate)
        if path is not None:
            paths.append(path)
    return paths


def changed_paths(root: pathlib.Path) -> list[pathlib.Path]:
    commands = [
        ["git", "diff", "--name-only"],
        ["git", "ls-files", "--others", "--exclude-standard"],
    ]
    paths: set[pathlib.Path] = set()
    for command in commands:
        result = subprocess.run(
            command,
            cwd=root,
            check=False,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            continue
        paths.update(
            pathlib.Path(line)
            for line in result.stdout.splitlines()
            if line.strip() and (root / line).is_file()
        )
    if not paths:
        return []
    return sorted(paths)


def format_targets(root: pathlib.Path, payload: dict) -> tuple[list[str], list[str]]:
    paths = payload_paths(root, payload) or changed_paths(root)
    unique_paths = sorted(
        {
            path
            for path in paths
            if (root / path).is_file()
            and path.parts[:1] != ("docs",)
            and path.parts != ("pnpm-lock.yaml",)
        }
    )

    biome = [
        str(path)
        for path in unique_paths
        if path.suffix in BIOME_EXTENSIONS
    ]
    python = [
        str(path)
        for path in unique_paths
        if path.suffix in PYTHON_EXTENSIONS
        and (
            path.parts[:2] == ("packages", "md-extractor")
            or path.parts[:2] == (".codex", "hooks")
        )
    ]
    return biome, python


def run(root: pathlib.Path, command: list[str]) -> tuple[bool, str]:
    result = subprocess.run(
        command,
        cwd=root,
        check=False,
        capture_output=True,
        text=True,
    )
    output = "\n".join(part for part in (result.stdout, result.stderr) if part)
    if "No files were processed in the specified paths" in output:
        return True, output
    return result.returncode == 0, output


def main() -> int:
    payload = load_payload()
    root = repo_root()
    biome_targets, python_targets = format_targets(root, payload)
    failures = []

    if biome_targets:
        ok, output = run(
            root, ["pnpm", "exec", "biome", "check", "--write", *biome_targets]
        )
        if not ok:
            failures.append(
                f"$ pnpm exec biome check --write {' '.join(biome_targets)}\n{output}"
            )

    if python_targets:
        ok, output = run(
            root,
            [
                "uv",
                "run",
                "--project",
                "packages/md-extractor",
                "ruff",
                "check",
                "--fix",
                *python_targets,
            ],
        )
        if not ok:
            failures.append(
                f"$ uv run --project packages/md-extractor ruff check --fix {' '.join(python_targets)}\n{output}"
            )

    if failures:
        notify("書き込み後 formatter に失敗しました\n\n" + "\n\n".join(failures))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
