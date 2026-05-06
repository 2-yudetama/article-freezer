---
name: fix-decision
description: Manager が評価結果に基づき、PR finalization、Generator 修正ループ、人間確認のいずれへ進めるか判断する。
metadata:
  short-description: 評価後の修正ループを振り分ける
---

# fix-decision

## 目的

Evaluator Output の Result に基づき、Manager が修正継続、PR 作成、人間確認のいずれへ進むか判断する。

## 使用フェーズ

- 修正判断

## 実行ロール

- Manager

## 入力

- Evaluator Output
- Generator Output
- 修正ループ回数
- 対象 issue

## 出力

- PR finalization への移行判断
- Generator への修正依頼
- 人間確認へのフォールバック
- 必要に応じた `AI: Manager Log`

## 参照する正式ドキュメント

- `docs/agent/workflow.md`
- `docs/agent/roles/manager.md`
- `docs/agent/roles/generator.md`
- `docs/agent/roles/evaluator.md`

## 追加リソース

- `references/fix-decision-outputs.md`: 分岐、修正依頼、Manager Log の骨子
- `references/fix-request-template.md`: 修正依頼テンプレート
- `references/manager-log-template.md`: Manager Log テンプレート

## 実行手順

1. Evaluator Output の Result を確認する
2. `pass` の場合は PR 作成条件の確認へ進む
3. `needs-fix` の場合は修正ループ回数を確認する
4. `docs/agent/workflow.md` の修正ループ上限未満なら Generator に修正を依頼する
5. 修正ループ上限以上または `blocked` の場合は人間確認へフォールバックする
6. 受け入れ条件やスコープ変更が必要な場合は Generator に直接修正依頼せず、再計画または人間確認へ進む
7. フォールバック時は `AI: Manager Log` を残す

## この skill が判断しないこと

- コード修正
- Evaluator の Result 上書き
- 受け入れ条件やスコープの独断変更
- push / PR 作成
- Evaluator Output 本文の作成や投稿
