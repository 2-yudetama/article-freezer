---
name: impl-evaluation
description: Evaluator が Generator の commit と差分をレビューし、非破壊的な検証を行い、pass、needs-fix、blocked の評価を作成する。
metadata:
  short-description: 実装結果をレビューする
---

# impl-evaluation

## 目的

Evaluator が Generator の commit と差分を非破壊的にレビューし、`pass | needs-fix | blocked` のいずれかを Result として記録する。

## 使用フェーズ

- 評価
- 修正ループ後の再評価

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
- 対象 issue の `AI: Evaluator Output` コメント

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
6. `pass | needs-fix | blocked` のいずれかを判定する
7. Evaluator Output に Result と根拠を記録する。修正ループ時は `references/evaluator-output.md` に従い、本文に `Loop: {番号}` を含める
8. `output-comment` skill を使い、対象 issue に `AI: Evaluator Output` として投稿する

## この skill が判断しないこと

- コード修正
- stage / commit / push / PR 作成
- 受け入れ条件やスコープの変更
- Evaluator Output 以外の issue コメント投稿
- 破壊的検証や DELETE 系 GitHub 操作
