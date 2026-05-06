# エージェント開発ワークフロー整理メモ

- 整理Issue: https://github.com/2-yudetama/article-freezer/issues/54

## 目的

AI エージェントが 1 issue / 1 PR 単位で開発サイクルを回せるように、Codex Subagents を前提とした開発ワークフローを整備する。

## ゴール

- Manager / Planner / Generator / Evaluator の責務を定義する
- 各エージェントの I/O と情報伝達方法を定義する
- issue 確認から PR 作成までの最小運用フローを定義する
- Codex custom agents の設定雛形を作成する
- 実運用で使うプロンプト例を用意する

## 前提

- 1 サイクルで扱うタスクは 1 issue のみ
- issue と PR は 1 対 1 で紐づける
- 実装対象が大きい場合は、PR を出せる粒度まで issue を分割してから着手する
- サブエージェントは主に探索・計画・レビューのような read-heavy な作業に使う
- write-heavy な作業は衝突を避けるため Manager が制御する

## ドラフト管理方針

- `docs/draft/ai-harness.md` は全体方針と決定ログの入口として使う
- 内容が大きくなる場合は、`docs/draft` 配下に適宜ファイルやフォルダを作成して分割する
- 分割したドラフトは、必要に応じて `docs/draft/ai-harness.md` から参照する
- 確定した内容は、最終的に正式なドキュメントや Codex 設定へ反映する

## 詳細ドラフト

- [ロール定義ドラフト](./ai-harness/roles.md)
- [ワークフロー正本ドラフト](./ai-harness/workflow.md)
- [Output / テンプレート移行ドラフト](./ai-harness/output-templates.md)
- [Codex custom agents 設計](./ai-harness/codex-agents.md)
- [git / GitHub 手順移行ドラフト](./ai-harness/git-github-procedures.md)
- [共通コンテキスト](./ai-harness/shared-context-migration.md)
- [エージェント開発ワークフロー構築計画](./ai-harness/implementation-plan.md)

## エージェント構成案

```txt
Manager
  ├─ Planner
  ├─ Generator
  └─ Evaluator
```

## 未整理事項

- issue / PR テンプレートの正式配置
- 上位ルール変更後の `AGENTS.md` 反映内容
- 実際のエージェント開発ワークフロー運用に使うプロンプト例

## 決定ログ

- 2026-04-26: 最終的には運用可能な最小構成まで整備する
- 2026-04-26: 一度に全体を確定せず、`docs/draft/ai-harness.md` を更新しながら対話形式で整理する
- 2026-04-26: Manager はワークフロー管理と最終意思決定のみを担い、実装そのものは行わない
- 2026-04-26: issue のサブ issue 分割要否は Planner が計画作成時に判断し、Manager が最終判断する
- 2026-04-26: Evaluator は実装後のレビューに集中し、サブ issue 分割案の判断には関与しない
- 2026-04-26: ドラフトは `docs/draft` 配下で必要に応じてファイルやフォルダを分割して管理する
- 2026-04-26: サブ issue 分割時は親 issue 本文を基本的に編集せず、分割理由・方針・子 issue 一覧・推奨対応順をコメントする
- 2026-04-26: サブ issue には親 issue の milestone / label / assignee を引き継ぐ
- 2026-04-26: サブ issue 分割時は人間確認を挟まず、Manager が最終判断して作成する
- 2026-04-26: 親子関係は GitHub の Sub-issues 機能で管理し、`gh api` で REST API を呼び出す
- 2026-04-26: Planner は変更対象候補や実装ステップを原則固定せず、Generator が満たすべき実装契約を整理する
- 2026-04-26: 守るべき既存設計・制約は Planner 出力ではなく、共通コンテキストとして分離する
- 2026-04-26: Generator は軽微調整許可型とし、受け入れ条件やスコープを変えない範囲で実装上の細部を判断する
- 2026-04-26: Evaluator はレビュー専任だが、必要な非破壊的検証コマンドは実行してよい
- 2026-04-26: Generator / Evaluator の出力は自分の作業結果・観測結果に限定し、他エージェントの行動に干渉する記載は含めない
- 2026-04-26: 実装後の `Generator -> Evaluator` 修正ループは最大 2 回とし、解決しない場合や `blocked` の場合は人間確認へフォールバックする
- 2026-04-26: Generator は意味のある変更単位で commit できるが、push / PR 作成は行わない
- 2026-04-26: Evaluator は commit 群と差分が issue スコープ内か確認し、Manager は総合判定とスコープ判定が `pass` の場合のみ push / PR 作成へ進める
- 2026-04-26: Manager は PR 作成条件を満たした場合に push / `gh pr create` / issue への PR コメントを行う
- 2026-04-26: Generator の commit は実装の意味単位で切り、message は `{Gitmoji} {メッセージタイトル} (#{issue番号})` 形式にする
- 2026-04-26: Manager は custom agent にせず、Planner / Generator / Evaluator を `.codex/agents/*.toml` として定義する
- 2026-04-26: 複数のサブエージェントは並列起動せず、Manager が各出力を確認してから次フェーズへ進める
- 2026-04-26: skill は反復的な手順・コマンド例・成果物整形の補助として使い、責務や判断基準の正本は正式ドキュメントと `AGENTS.md` に置く
- 2026-04-26: Manager は Planner 起動前と PR 作成前にブランチ名と作業ツリーを確認し、既存変更がある場合は開発サイクルを開始せず人間確認へフォールバックする
- 2026-04-26: Manager は実行条件を満たした場合、追加の人間確認なしで GitHub issue / PR 作成、issue コメント、Sub-issues API 呼び出し、push を実行できる
- 2026-04-26: 外部副作用失敗時はコマンド種別ごとの固定ルールでリトライ可否を判断し、成功したか曖昧な作成・更新系操作は原則自動リトライしない
- 2026-04-26: Planner / Generator / Evaluator Output の正本は GitHub issue コメントに保存し、コメント見出しは `AI: Planner Output` 形式にする
- 2026-04-26: Output コメント本文の整形と投稿手順は skill に切り出す候補とする
- 2026-04-27: 正式ドキュメントは `docs/ai-harness/` には置かず、`docs/agent/` に集約する
- 2026-04-27: `docs/agent/` は `AGENTS.md`、`workflow.md`、`roles/*.md`、`rules/README.md`、`rules/*.md` で構成する
- 2026-04-27: skill は role 単位ではなく、ワークフロー上の手順単位で `.agents/skills/*` に分ける
- 2026-04-27: `docs/architecture/` は `AGENTS.md`、`data-flow.md`、`auth.md`、`er.md` の薄い構成にする
- 2026-04-27: 機能仕様は `docs/features/`、package 固有の作業ルールは `packages/*/AGENTS.md` に残す
