---
name: issue-planning
description: エージェント開発ワークフローの対象 GitHub issue を分析し、Manager 確認用の implementation-plan または split-proposal を作成する。
metadata:
  short-description: issue 実装計画を作成する
---

# issue-planning

## 目的

Planner が対象 issue を分析し、`implementation-plan` または `split-proposal` のどちらか一方を必ず含む Planner Output を作成する。

## 使用フェーズ

- 計画作成

## 実行ロール

- Planner

## 入力

- 対象 issue
- マイルストーン情報
- 関連 issue / PR / ドキュメント
- ルートおよび対象 package の `AGENTS.md`
- 関連する `docs/features`
- 必要に応じた `docs/architecture`

## 出力

- Planner Output
- `Type: implementation-plan` または `Type: split-proposal` のどちらか一方
- 対象 issue の `AI: Planner Output` コメント

## 参照する正式ドキュメント

- `docs/agent/AGENTS.md`
- `docs/agent/workflow.md`
- `docs/agent/roles/planner.md`
- `docs/features`
- `docs/architecture/AGENTS.md`

## 追加リソース

- `references/planner-output.md`: 調査手順、Planner Output の契約、`implementation-plan` / `split-proposal` の骨子
- `references/implementation-plan-template.md`: `implementation-plan` テンプレート
- `references/split-proposal-template.md`: `split-proposal` テンプレート

## 実行手順

1. issue の要求、スコープ、スコープ外を整理する
2. 受け入れ条件と検証計画を整理する
3. 1 PR で扱える粒度か判断する
4. 1 PR で扱える場合は `Type: implementation-plan` を作る
5. 分割が必要な場合は `Type: split-proposal` を作る
6. Planner Output に `implementation-plan` または `split-proposal` のどちらか一方だけが含まれることを確認する
7. 未決定事項やリスクを Planner Output に記録する
8. `output-comment` skill を使い、対象 issue に `AI: Planner Output` として投稿する

## この skill が判断しないこと

- Planner Output の採用可否
- サブ issue の実作成
- 実装の実行
- Manager のフェーズ移行判断
- Planner Output 以外の GitHub issue コメント投稿
