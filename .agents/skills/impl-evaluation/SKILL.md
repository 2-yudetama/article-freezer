---
name: impl-evaluation
description: Evaluator が Generator の commit と差分をレビューし、非破壊的な検証を行い、pass、needs-fix、blocked の評価を作成する。
metadata:
  short-description: 実装結果をレビューする
---

# impl-evaluation

## 目的

Evaluator が Generator の実装結果をレビューし、`pass | needs-fix | blocked` を判定する。

## 使用フェーズ

- 評価
- 修正判断

## 実行ロール

- Evaluator

## 入力

- 対象 issue
- 採用済みの `implementation-plan`
- Generator の commit 一覧
- Generator Output
- 実装差分

## 出力

- Evaluator Output
- `pass | needs-fix | blocked` の Result

## 参照する正式ドキュメント

- `docs/agent/workflow.md`
- `docs/agent/roles/evaluator.md`
- `docs/agent/rules/hooks.md`
- ルートおよび対象 package の `AGENTS.md`

## 追加リソース

- `references/evaluation-check.md`: 評価手順、Result 判断
- `references/evaluator-output.md`: Evaluator Output テンプレート

## 実行手順

1. Generator Output と commit 一覧を確認する
2. 差分が issue スコープ内か確認する
3. 受け入れ条件を満たしているか確認する
4. 必要な非破壊的検証を実行する
5. 発見した問題を修正必須と任意改善に分類する
6. `pass | needs-fix | blocked` を判定する
7. Evaluator Output に根拠を記録する

## この skill が判断しないこと

- コード修正
- stage / commit / push / PR 作成
- Evaluator Output 以外の issue コメント投稿
- issue スコープや受け入れ条件の変更
