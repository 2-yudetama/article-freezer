# Hooks

## 目的

rules で表現しにくい引数順・文脈依存チェックを hooks で補完する。
hooks は rules と同じく guardrail として扱い、ロール判定や issue スコープ判定の正本にはしない。

## 基本方針

- 実行前の禁止操作チェックは `PreToolUse` の `Bash` に限定する
- rules で制御できる文脈不要の禁止操作は rules に寄せる
- hooks では引数順・現在ブランチ・staged files など、実行直前の状態が必要なものを確認する
- commit 前検証の正本は lefthook とし、Codex hook は commit の文脈チェックだけを扱う
- `PostToolUse` の `Edit|MultiEdit|Write` では、変更ファイルのみを対象に formatter を自動実行する
- hook で自動修正する対象は formatter に限定し、検証に失敗した場合は停止する

## 配置

```txt
.codex/hooks.json
.codex/hooks/pre_tool_use_policy.py
.codex/hooks/format_after_write.py
```

## 有効化条件

hooks の利用には Codex の `codex_hooks` feature flag を有効にする必要がある。

## formatter 対象

ファイル書き込み後の formatter は変更ファイルのみを対象にする。

- TypeScript / JavaScript / JSON / YAML / CSS は `pnpm exec biome check --write <path>` を使う
- `packages/md-extractor` 配下の Python は `uv run --project packages/md-extractor ruff check --fix <path>` を使う
- `docs` 配下と `pnpm-lock.yaml` は formatter 自動実行の対象外にする

formatter が失敗した場合、hook は失敗内容を追加コンテキストとして返す。
編集そのものの取り消しは行わない。

## deny 対象

### `gh api` の DELETE 相当操作

`--method DELETE`、`--method=DELETE`、`-X DELETE`、引数内の `DELETE` を検出した場合は deny する。

### `git reset --hard`

`--hard` が含まれる場合は、引数順に依存せず deny する。

### `git push` の force / delete 相当操作

`--force`、`-f`、`--force-with-lease`、`--delete`、`-d`、`+` で始まる refspec、`:` で始まる refspec を検出した場合は deny する。

### `gh issue delete` / `gh pr close`

`gh` の global option が途中に含まれていても、`issue delete` と `pr close` を検出した場合は deny する。

### `git push` 前のブランチ名不一致

現在ブランチが `issue/` で始まらない場合は deny する。
push コマンドは `git push origin issue/{issue番号}` のように remote と branch を明示する。
引数なし `git push` は rules の sandbox bypass allow に一致しないため使わない。

### staged files がない状態での `git commit`

`git diff --cached --name-only` が空の場合は deny する。

### `git commit` の検証 bypass / 履歴修正

`--no-verify`、`-n`、`--amend` が含まれる場合は deny する。
commit 前検証は lefthook を正本とし、Codex hook では検証内容を重複管理しない。
commit message は `{Gitmoji} {メッセージタイトル} (#{issue番号})` 形式にする。

### `git push` 前の検証失敗

`git push` 実行前に以下を実行し、いずれかが失敗した場合は deny する。

- `pnpm check`
- `pnpm --recursive run typecheck`
- `pnpm knip`

push 前 hook では commit 前検証との重複を許容し、リモートへ出る直前の確認を優先する。
将来テストを追加する場合は、push 前検証へより広い範囲のテストを追加する。
PreToolUse hook 全体の timeout は 390 秒、個別検証コマンドの timeout は 120 秒とする。

### rules で拾いきれない広範囲 stage

`git add` の対象に `.`, `-A`, `--all`, `-u`, `:/` が含まれる場合は deny する。

### rules で拾いきれない再帰削除

`rm` の引数から再帰削除相当と判断できる場合は deny する。

### 変更破棄を伴う `git checkout --`

`git checkout` の引数に `--` が含まれる場合は deny する。

## 運用上の注意

- hooks はシェル実行経路のすべてを完全に捕捉するものではない
- hook の deny は、明確に禁止できる操作に限定する
- formatter は変更ファイルのみを対象にし、意図しない広範囲変更を避ける
