---
name: plan-review
description: Manager が Planner Output を確認し、採用、修正依頼、issue 分割、人間確認へのフォールバックを判断する。
metadata:
  short-description: Planner Output の扱いを決める
---

# plan-review

## 目的

Manager が Planner Output を確認し、採用、差し戻し、分割フロー、人間確認のいずれへ進むか判断する。

## 使用フェーズ

- 計画判断

## 実行ロール

- Manager

## 入力

- Planner Output
- 対象 issue
- `docs/agent/workflow.md` の Planner Output 採用基準

## 出力

- Planner Output の採用判断
- Generator への依頼
- Planner への差し戻し
- サブ issue 分割フローへの移行判断
- 必要に応じた `AI: Manager Log`

## 参照する正式ドキュメント

- `docs/agent/workflow.md`
- `docs/agent/roles/manager.md`
- `docs/agent/roles/planner.md`

## 追加リソース

- `references/decision-outputs.md`: 判断結果、差し戻し依頼の骨子

## 実行手順

1. Planner Output の Type を確認する
2. 必須要素がそろっているか確認する
3. スコープ、スコープ外、受け入れ条件に矛盾がないか確認する
4. `implementation-plan` の場合は Generator が実装契約として使える粒度か確認する
5. `split-proposal` の場合は各サブ issue が 1 PR で完了できる粒度か確認する
6. 採用、差し戻し、人間確認のいずれかを決める

## この skill が判断しないこと

- 実装そのもの
- Evaluator の判定
- サブ issue 作成コマンドの詳細
- 受け入れ条件やスコープの独断変更
