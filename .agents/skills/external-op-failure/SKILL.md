---
name: external-op-failure
description: エージェント開発ワークフロー中に GitHub や git の外部副作用が失敗した場合、リトライ、停止、人間確認ログの記録を判断する。
metadata:
  short-description: 外部副作用の失敗を扱う
---

# external-op-failure

## 目的

GitHub issue / PR / comment / Sub-issues API / push などの外部副作用が失敗した場合に、リトライ可否、停止、記録を判断する。

## 使用フェーズ

- 計画作成
- issue 分割
- 実装
- 評価
- 修正判断
- PR 最終化

## 実行ロール

- Manager

## 入力

- 失敗した操作
- 実行済みの前段操作
- 未実行の後続操作
- エラーメッセージ
- 対象 repo / issue / branch

## 出力

- リトライ可否の判断
- 停止判断
- 人間確認へのフォールバック判断
- `AI: Manager Log`

## 参照する正式ドキュメント

- `docs/agent/workflow.md`
- `docs/agent/roles/manager.md`
- `docs/agent/rules/hooks.md`

## 追加リソース

- `references/failure-handling.md`: 操作別の扱い、確認コマンド例、Manager Log
- `references/manager-log-template.md`: Manager Log テンプレート

## 実行手順

1. 失敗した操作の種類を特定する
2. 成功済みの可能性がある作成・更新系操作か確認する
3. 自動リトライ可能な失敗か確認する
4. 認証失敗、権限不足、対象不明、DELETE 系要求の場合は即停止する
5. 成功状態が曖昧な作成・更新系操作は無条件リトライしない
6. 途中まで作成された issue / PR / コメント / 紐づけは削除しない
7. 実行済み操作、未実行操作、停止理由を `AI: Manager Log` に記録する

## この skill が判断しないこと

- 作成済みリソースの削除
- DELETE 系 GitHub 操作
- 成功したか曖昧な作成・更新系操作の無条件リトライ
- 人間確認が必要な状態での後続フェーズ続行
- 実装、評価、Output 本文の作成
