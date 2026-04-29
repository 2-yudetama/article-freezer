# Sandbox / Rules

## 目的

- エージェント開発ワークフローの運用時に、文脈不要で危険と判断できる操作を rules で機械的に止める。
- rules はロール判定や issue スコープ判定を置き換えるものではなく、明確な禁止操作に対する guardrail として扱う。

## 基本方針

- `prompt` は人間の介入が必須になるため使わない
- rules は文脈が不要で、常に禁止したいコマンドだけを制御する
- ロール判定、issue スコープ判定、Planner Output からの逸脱判定はドキュメント運用と Evaluator のレビューで扱う
- rules で表現しにくい引数順・文脈依存チェックは hooks で補完する
- 自動運用を優先するため、approval は原則 `never` とする
- Manager / Planner / Generator / Evaluator は、Output コメント投稿や検証、生成物の書き込みを考慮して `workspace-write` とする
- Codex の仕様上、実行中のエージェントは `.codex/hooks`、`.codex/rules`、`.codex/agents` 配下を直接変更できない

## 配置

```txt
.codex/config.toml
.codex/rules/default.rules
```

## Sandbox

### ロール別 sandbox / approval

- Manager: `approval_policy = "never"`、`sandbox_mode = "workspace-write"`
- Planner: `approval_policy = "never"`、`sandbox_mode = "workspace-write"`
- Generator: `approval_policy = "never"`、`sandbox_mode = "workspace-write"`
- Evaluator: `approval_policy = "never"`、`sandbox_mode = "workspace-write"`

## Rules

### allow 対象

自動運用で sandbox 外実行が必要になる代表操作は `allow` する。
文脈依存の妥当性は hooks とロール運用で確認する。

#### git / GitHub 操作

- `git add <明示ファイル>`
- `git commit`
- `git push`
- `gh issue comment`
- `gh issue create`
- `gh issue view`
- `gh pr create`
- `gh pr list`
- `gh api`

#### Python package 操作

- `uv run`

### forbidden 対象

#### 広範囲 stage

- `git add .`
- `git add -A`
- `git add --all`
- `git add -u`
- `git add :/`

#### 破壊的または履歴を複雑化する git 操作

- `git reset --hard`
- `git clean`
- `git merge`
- `git rebase`
- `git checkout --`

#### DELETE 系 GitHub 操作

- `gh repo delete`
- `gh issue delete`
- `gh pr close`
- `gh api --method DELETE`

#### 再帰削除系の `rm`

- `rm -rf`
- `rm -fr`
- `rm -r`
- `rm -R`
- `rm --recursive`
- `rm -f -r`
- `rm -r -f`

### 許可する代表操作

- `git status`
- `git diff`
- `git log`
- `git branch --show-current`
- `git add <明示ファイル>`
- `git commit`
- `git push`
- `gh issue comment`
- `gh issue create`
- `gh issue view`
- `gh pr create`
- `gh pr list`
- `gh api`
- `uv run`

### 運用上の注意

- `git add <明示ファイル>` や `git commit` は通常のエージェント開発ワークフローで使うため allow する
- `git push` や `gh pr create` は Manager の責務として扱い、ロール判定は rules では行わない
- `gh api` は Sub-issues API の GET / POST で使うため allow し、DELETE 系は forbidden と hook で止める
- `uv run` は `pnpm --recursive run typecheck` 配下の `pyright` と Python formatter hook で必要なため allow する
- rules / hooks は完全な enforcement boundary ではなく guardrail として扱う
