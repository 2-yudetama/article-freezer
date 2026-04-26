# Sandbox / Rules

## 目的

AI ハーネス運用時に、文脈不要で危険と判断できる操作を rules で機械的に止める。
rules はロール判定や issue スコープ判定を置き換えるものではなく、明確な禁止操作に対する guardrail として扱う。

## 基本方針

- `prompt` は人間の介入が必須になるため使わない
- rules は文脈が不要で、常に禁止したいコマンドだけを制御する
- ロール判定、issue スコープ判定、Planner Output からの逸脱判定はドキュメント運用と Evaluator のレビューで扱う
- rules で表現しにくい引数順・文脈依存チェックは hooks で補完する

## 配置

```txt
.codex/rules/default.rules
```

## forbidden 対象

### 広範囲 stage

- `git add .`
- `git add -A`
- `git add --all`
- `git add -u`
- `git add :/`

### 破壊的または履歴を複雑化する git 操作

- `git reset --hard`
- `git clean`
- `git merge`
- `git rebase`
- `git checkout --`

### DELETE 系 GitHub 操作

- `gh repo delete`
- `gh issue delete`
- `gh pr close`
- `gh api --method DELETE`

### 再帰削除系の `rm`

- `rm -rf`
- `rm -fr`
- `rm -r`
- `rm -R`
- `rm --recursive`
- `rm -f -r`
- `rm -r -f`

## 許可する代表操作

- `git status`
- `git diff`
- `git log`
- `git branch --show-current`
- `git add <明示ファイル>`
- `git commit`

## 運用上の注意

- `git add <明示ファイル>` や `git commit` は通常のハーネス運用で使うため禁止しない
- `git push` や `gh pr create` は Manager の責務として扱い、ロール判定は rules では行わない
- rules / hooks は完全な enforcement boundary ではなく guardrail として扱う
