# Codex custom agents 設計

## 決定事項

- `.codex/config.toml`
- `.codex/agents/planner.toml`
- `.codex/agents/generator.toml`
- `.codex/agents/evaluator.toml`
- Manager を custom agent として定義しない

## 基本方針

- Manager は custom agent にしない
- Manager はメインの Codex セッションとして動く
- custom agents は Planner / Generator / Evaluator の 3 つにする
- custom agents は `.codex/agents/*.toml` に配置する
- agent 定義には詳細仕様を詰め込みすぎない
- agent 定義には `name`、`description`、`developer_instructions` を持たせる
- `developer_instructions` にはロール定義本文を直接書かない
- ロール定義本文は `docs/agent/roles/*.md` に置く
- `developer_instructions` には該当 role doc を読む短い指示だけを書く
- agent 定義には必要に応じて参照すべき skill 名を記載する
- skill は手順補助として使い、責務や禁止事項の正本にはしない

## Manager を custom agent にしない理由

- Manager はユーザとの対話を担う
- Manager は最終意思決定を担う
- Manager は各エージェントへの委譲を制御する
- Manager は GitHub 操作、push、PR 作成を担う
- これらはサブエージェントではなく、メインセッションが担う方が自然

## 配置案

```txt
.codex/
  config.toml
  agents/
    planner.toml
    generator.toml
    evaluator.toml
docs/
  agent/
    README.md
    workflow.md
    roles/
      manager.md
      planner.md
      generator.md
      evaluator.md
    rules/
      AGENTS.md
      sandbox.md
      hooks.md
```

## `.codex/config.toml`

```toml
#:schema https://developers.openai.com/codex/config-schema.json

approval_policy = "never"
sandbox_mode = "workspace-write"

default_permissions = "workspace"

[permissions.workspace.filesystem]
":minimal" = "read"
"/tmp" = "write"
glob_scan_max_depth = 5

[permissions.workspace.filesystem.":project_roots"]
"." = "write"
".codex" = "write"
".agents" = "write"
".git" = "write"
"**/*.env" = "none"

[features]
multi_agent = true
codex_hooks = true
goals = true

[agents]
max_threads = 1
max_depth = 1
```

## custom agent TOML 構成

```toml
#:schema https://developers.openai.com/codex/config-schema.json

name = "planner"
description = "Issue を分析し、実装契約またはサブ issue 分割案を作成する"
approval_policy = "never"
sandbox_mode = "read-only"
developer_instructions = """
docs/agent/roles/planner.md を読み、その内容を Planner ロールの正本として従うこと。
"""
```

## sandbox / approval 方針

- Manager はメインセッションとして `approval_policy = "never"`、`sandbox_mode = "workspace-write"` で動く
- Planner は計画専任のため `approval_policy = "never"`、`sandbox_mode = "read-only"` とする
- Generator は実装と commit を担うため `approval_policy = "never"`、`sandbox_mode = "workspace-write"` とする
- Evaluator は検証コマンドがキャッシュや生成物を書く可能性があるため `approval_policy = "never"`、`sandbox_mode = "workspace-write"` とする
- filesystem の許可範囲は `.codex/config.toml` の `[permissions.workspace.filesystem]` で管理する
- commit 前検証は lefthook を正本とし、`git commit` は `.codex/rules/default.rules` の `allow` で sandbox bypass 対象として扱う
- GitHub への push は `.codex/rules/default.rules` の `allow` で sandbox bypass 対象として扱う
- `pnpm install` は依存関係インストールと lockfile 検証のため `.codex/rules/default.rules` の `allow` で sandbox bypass 対象として扱う
- PR / issue 操作の `allow` は sandbox 内の挙動確認後に追加する
- GitHub DELETE 系操作、Generator の push / PR / issue 操作、Evaluator の stage / commit / push / PR / issue 操作の文脈依存チェックは rules / hooks で制御する

## skill 参照方針

- Manager は custom agent にしないため、Manager 用 skill はメインセッションが必要時に呼び出す
- Planner / Generator / Evaluator の custom agents は、`developer_instructions` で必要な skill 名と参照目的を短く示す
- skill の本文には長い仕様を重複させず、正式ドキュメントへの参照と実行手順を置く
- ルールや判断基準が skill とドキュメントで矛盾した場合は、ドキュメントを優先する

### skill 候補

既存の `.agents/skills/` 配下に、ワークフロー上の手順単位で skill を置く。
role 単位では分けない。

- `.agents/skills/start-workflow`: issue 確定、branch / worktree 状態確認、開始条件判定
- `.agents/skills/issue-planning`: Planner Output 作成
- `.agents/skills/plan-review`: Planner Output の採用、差し戻し、分割フローへの分岐
- `.agents/skills/issue-splitting`: サブ issue 作成、Sub-issues 紐づけ、親 issue コメント
- `.agents/skills/impl-commit`: 実装、セルフチェック、明示 stage、commit、Generator Output 作成
- `.agents/skills/impl-evaluation`: 差分レビュー、検証、Evaluator Output 作成
- `.agents/skills/fix-decision`: `needs-fix` / `blocked` / 修正ループ上限時の分岐
- `.agents/skills/output-comment`: 各 Output / Manager Log / Split Result / PR Created のコメント整形・投稿
- `.agents/skills/pr-finalization`: Manager による push、PR 作成、PR 作成結果コメント
- `.agents/skills/external-op-failure`: 外部副作用失敗時のリトライ可否判断、停止、記録
