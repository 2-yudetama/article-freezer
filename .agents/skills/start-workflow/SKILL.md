---
name: start-workflow
description: issue 起点のエージェント開発サイクルを開始できるか、対象 issue、ブランチ、作業ツリー状態、必要なリポジトリ指示を確認する。
metadata:
  short-description: issue サイクル開始条件を確認する
---

# start-workflow

## 目的

エージェント開発ワークフローを開始できるか確認し、対象 issue、ブランチ、作業ツリー状態を確定する。

## 使用フェーズ

- 開始確認

## 実行ロール

- Manager

## 入力

- 対象 issue 番号
- 現在ブランチ
- 作業ツリー状態
- ルートおよび対象 package の `AGENTS.md`

## 出力

- 開始可否の判断
- Planner への依頼可否
- 必要に応じた `AI: Manager Log`

## 参照する正式ドキュメント

- `docs/agent/AGENTS.md`
- `docs/agent/workflow.md`
- `docs/agent/roles/manager.md`
- `docs/agent/rules/sandbox.md`
- `docs/agent/rules/hooks.md`

## 追加リソース

- `references/start-check.md`: 確認コマンド、ブランチ判断、停止条件

## 実行手順

1. 対象 issue が 1 つに確定しているか確認する
2. `git branch --show-current` で現在ブランチを確認する
3. `git status --short` に既存変更や untracked file がないか確認する
4. 現在ブランチが `issue/{issue番号}` か、clean な基点ブランチか確認する
5. 既存の別 issue ブランチで作業していないか確認する
6. ルートの `AGENTS.md` と対象 package の `AGENTS.md` を確認する
7. 開始条件を満たす場合だけ Planner 起動へ進む
8. 開始条件を満たさない場合は人間確認へフォールバックし、必要に応じて `AI: Manager Log` を残す

## この skill が判断しないこと

- issue の実装可否
- issue の分割要否
- 実装計画の採用可否
- 実装や評価の代行
- 既存変更の破棄、stash、別ブランチ移動
- DELETE 系 GitHub 操作
