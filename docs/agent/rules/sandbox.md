# Sandbox / Rules

## 目的

- エージェント開発ワークフローの運用時に、sandbox 内で扱う filesystem 境界と、sandbox bypass を明示許可するコマンドを分けて管理する。
- rules はロール判定や issue スコープ判定を置き換えるものではなく、明確な許可操作と禁止操作に対する guardrail として扱う。

## 基本方針

- `prompt` は人間の介入が必須になるため使わない
- rules は sandbox bypass を明示許可するコマンドと、文脈が不要で常に禁止したいコマンドを制御する
- ロール判定、issue スコープ判定、Planner Output からの逸脱判定はドキュメント運用と Evaluator のレビューで扱う
- rules で表現しにくい引数順・文脈依存チェックは hooks で補完する
- 自動運用を優先するため、approval は原則 `never` とする
- Manager / Planner / Generator / Evaluator は、Output コメント投稿や検証、生成物の書き込みを考慮して `workspace-write` とする
- filesystem の許可範囲は `.codex/config.toml` の `[permissions.workspace.filesystem]` で管理する
- 外部副作用を伴う GitHub 操作は `.codex/rules/default.rules` で明示許可し、sandbox bypass 対象として扱う
- Codex の仕様上、通常の実行中エージェントは `.codex/hooks`、`.codex/rules`、`.codex/agents` 配下を直接変更できない
- `.codex` 配下の変更自体を明示スコープに含む issue で Manager が許可した場合のみ、guardrail を弱体化しない最小変更を行う

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

### forbidden 対象

rules は sandbox bypass を明示許可するコマンドと、文脈が不要で常に禁止したいコマンドを制御する。
filesystem の許可範囲は `.codex/rules/default.rules` ではなく `.codex/config.toml` で管理する。

### allow 対象

`allow` は通常の sandbox 制約を bypass しうるため、外部副作用を伴い、かつワークフロー上必要な代表コマンドだけを対象にする。

#### GitHub への push

- `git push origin ...`

rules の allow は `git push origin` prefix を対象にする。
`git push` のような引数なし push は sandbox bypass 対象外のため使わない。

#### commit 作成

- `git commit`

#### 依存関係インストール

- `pnpm install`
- `pnpm install --lockfile-only`
- `pnpm install --frozen-lockfile`

### forbidden 対象の代表例

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
- `git push --force`
- `git push -f`
- `git push --force-with-lease`

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

### 運用上の注意

- `git add <明示ファイル>`、`git commit` などのロール別妥当性は rules では判定しない
- commit 前検証は lefthook を正本とし、Codex hook では staged files と検証 bypass / 履歴修正禁止だけを確認する
- push は `git push origin issue/{issue番号}` のように remote と branch を明示し、引数なし push / upstream 設定に依存しない
- commit message は `{Gitmoji} {メッセージタイトル} (#{issue番号})` 形式にする
- issue ブランチかどうか、push 前検証が通っているかなどの文脈依存チェックは hooks で扱う
- `gh` 系操作は sandbox 内の挙動確認後に allow 対象へ追加する
- rules / hooks は完全な enforcement boundary ではなく guardrail として扱う
