#!/usr/bin/env python3
import json
import os
import shlex
import subprocess
import sys


def deny(reason: str) -> None:
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason,
                }
            },
            ensure_ascii=False,
        )
    )


def deny_with_output(reason: str, output: str) -> None:
    details = output.strip()
    if details:
        reason = f"{reason}\n\n{details}"
    deny(reason)


def load_command() -> str:
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError:
        return ""

    tool_input = payload.get("tool_input")
    if not isinstance(tool_input, dict):
        return ""

    command = tool_input.get("command")
    if isinstance(command, str):
        return command
    return ""


def split_command(command: str) -> list[str]:
    try:
        return shlex.split(command)
    except ValueError:
        return []


def has_option(args: list[str], *options: str) -> bool:
    return any(arg in options for arg in args)


def is_recursive_rm(argv: list[str]) -> bool:
    if not argv or argv[0] != "rm":
        return False

    flags = [arg for arg in argv[1:] if arg.startswith("-")]
    if any(flag in ("-rf", "-fr", "-r", "-R", "--recursive") for flag in flags):
        return True

    has_force = any(
        "f" in flag[1:]
        for flag in flags
        if flag.startswith("-") and not flag.startswith("--")
    )
    has_recursive = any(
        "r" in flag[1:] or "R" in flag[1:]
        for flag in flags
        if flag.startswith("-") and not flag.startswith("--")
    )
    return has_force and has_recursive


def is_broad_git_add(argv: list[str]) -> bool:
    return (
        len(argv) >= 3
        and argv[:2] == ["git", "add"]
        and any(arg in (".", "-A", "--all", "-u", ":/") for arg in argv[2:])
    )


def is_destructive_checkout(argv: list[str]) -> bool:
    return len(argv) >= 3 and argv[:2] == ["git", "checkout"] and "--" in argv[2:]


def git_subcommand_args(argv: list[str], subcommand: str) -> list[str] | None:
    if not argv or argv[0] != "git":
        return None

    for index, arg in enumerate(argv[1:], start=1):
        if arg == subcommand:
            return argv[index + 1 :]
    return None


def gh_subcommand_args(argv: list[str], group: str, subcommand: str) -> list[str] | None:
    if not argv or argv[0] != "gh":
        return None

    group_index = None
    for index, arg in enumerate(argv[1:], start=1):
        if arg == group:
            group_index = index
            break
    if group_index is None:
        return None

    for index, arg in enumerate(argv[group_index + 1 :], start=group_index + 1):
        if arg == subcommand:
            return argv[index + 1 :]
    return None


def is_destructive_git_reset(argv: list[str]) -> bool:
    args = git_subcommand_args(argv, "reset")
    return args is not None and has_option(args, "--hard")


def is_destructive_git_push(argv: list[str]) -> bool:
    args = git_subcommand_args(argv, "push")
    if args is None:
        return False

    if has_option(args, "--force", "-f", "--force-with-lease", "--delete", "-d"):
        return True

    return any(arg.startswith("+") or arg.startswith(":") for arg in args)


def is_incomplete_git_push(argv: list[str]) -> bool:
    args = git_subcommand_args(argv, "push")
    if args is None:
        return False

    positional = [arg for arg in args if not arg.startswith("-")]
    return len(positional) < 2 or positional[0] != "origin"


def is_destructive_gh_issue(argv: list[str]) -> bool:
    return gh_subcommand_args(argv, "issue", "delete") is not None


def is_destructive_gh_pr(argv: list[str]) -> bool:
    return gh_subcommand_args(argv, "pr", "close") is not None


def is_delete_gh_api(argv: list[str]) -> bool:
    if len(argv) < 2 or argv[:2] != ["gh", "api"]:
        return False

    for index, arg in enumerate(argv):
        upper_arg = arg.upper()
        if upper_arg == "DELETE":
            return True
        if (
            arg in ("--method", "-X")
            and index + 1 < len(argv)
            and argv[index + 1].upper() == "DELETE"
        ):
            return True
        if arg.startswith("--method=") and arg.split("=", 1)[1].upper() == "DELETE":
            return True
    return False


def is_commit_verification_bypass(argv: list[str]) -> bool:
    return len(argv) >= 2 and argv[:2] == ["git", "commit"] and has_option(
        argv,
        "--no-verify",
        "-n",
        "--amend",
    )


def current_branch(cwd: str) -> str:
    try:
        result = subprocess.run(
            ["git", "branch", "--show-current"],
            cwd=cwd,
            check=False,
            capture_output=True,
            text=True,
        )
    except OSError:
        return ""
    return result.stdout.strip()


def staged_files(cwd: str) -> list[str]:
    try:
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only"],
            cwd=cwd,
            check=False,
            capture_output=True,
            text=True,
        )
    except OSError:
        return []
    return [line for line in result.stdout.splitlines() if line.strip()]


CHECK_TIMEOUT_SECONDS = 120


def run_check(cwd: str, command: list[str]) -> tuple[bool, str]:
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            check=False,
            capture_output=True,
            text=True,
            timeout=CHECK_TIMEOUT_SECONDS,
        )
    except subprocess.TimeoutExpired as error:
        output = "\n".join(part for part in (error.stdout, error.stderr) if part)
        details = output.strip()
        if details:
            return False, f"{details}\n{CHECK_TIMEOUT_SECONDS}秒で timeout しました"
        return False, f"{CHECK_TIMEOUT_SECONDS}秒で timeout しました"
    except OSError as error:
        return False, str(error)

    output = "\n".join(part for part in (result.stdout, result.stderr) if part)
    return result.returncode == 0, output


def run_checks(cwd: str, checks: list[list[str]]) -> tuple[bool, str]:
    failures = []
    for check in checks:
        ok, output = run_check(cwd, check)
        if not ok:
            failures.append(f"$ {shlex.join(check)}\n{output}")
    return not failures, "\n\n".join(failures)


def main() -> int:
    command = load_command()
    argv = split_command(command)
    cwd = os.getcwd()

    if not argv:
        return 0

    if is_broad_git_add(argv):
        deny("対象ファイルを明示して stage してください")
        return 0

    if is_destructive_checkout(argv):
        deny("変更破棄を伴う checkout は禁止です")
        return 0

    if is_destructive_git_reset(argv):
        deny("変更破棄を伴う git reset は禁止です")
        return 0

    if is_destructive_git_push(argv):
        deny("force push / delete push は禁止です")
        return 0

    if is_destructive_gh_issue(argv):
        deny("DELETE 系 GitHub 操作は禁止です")
        return 0

    if is_destructive_gh_pr(argv):
        deny("PR close はハーネスの自動操作対象外です")
        return 0

    if is_delete_gh_api(argv):
        deny("DELETE 系 GitHub API 操作は禁止です")
        return 0

    if is_commit_verification_bypass(argv):
        deny("commit 前検証の bypass や履歴修正は禁止です")
        return 0

    if is_recursive_rm(argv):
        deny("再帰削除はハーネスの自動操作では禁止です")
        return 0

    if len(argv) >= 2 and argv[:2] == ["git", "push"]:
        if is_incomplete_git_push(argv):
            deny("git push は remote と branch を明示してください")
            return 0

        branch = current_branch(cwd)
        if not branch.startswith("issue/"):
            deny("git push は issue/{issue番号} ブランチでのみ実行してください")
            return 0

        ok, output = run_checks(
            cwd,
            [
                ["pnpm", "check"],
                ["pnpm", "--recursive", "run", "typecheck"],
                ["pnpm", "knip"],
            ],
        )
        if not ok:
            deny_with_output("git push 前の検証に失敗しました", output)
            return 0

    if len(argv) >= 2 and argv[:2] == ["git", "commit"]:
        if not staged_files(cwd):
            deny("staged files がない状態での commit は実行できません")
            return 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
