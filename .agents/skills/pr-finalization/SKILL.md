---
name: pr-finalization
description: Evaluator が pass を返した後、Manager が PR 作成条件確認、push、PR 作成、PR 作成結果コメントを行う。
metadata:
  short-description: pass 済み作業を PR 化する
---

# pr-finalization

## 目的

Evaluator Output の Result が `pass` の場合に、Manager が push、PR 作成、PR 作成結果コメントを行う。

## 使用フェーズ

- PR 最終化

## 実行ロール

- Manager

## 入力

- 対象 issue
- 採用済みの `implementation-plan`
- Generator Output
- Evaluator Output
- commit 一覧
- 現在ブランチ
- 作業ツリー状態
- 対象 issue の assignee / label / milestone / project

## 出力

- remote branch
- Pull Request
- `AI: PR Created`
- 必要に応じた `AI: Manager Log`

## 参照する正式ドキュメント

- `docs/agent/workflow.md`
- `docs/agent/roles/manager.md`
- `docs/agent/rules/hooks.md`

## 追加リソース

- `references/pr-finalization.md`: PR 作成前チェック、実行コマンド、PR body、作成後記録
- `references/pr-body-template.md`: PR body テンプレート
- `references/pr-created-template.md`: `AI: PR Created` テンプレート
- `.agents/skills/external-op-failure/SKILL.md`: push / PR 作成 / コメント失敗時の外部副作用失敗処理

## 実行手順

1. PR 作成条件を満たしているか確認する
2. 現在ブランチが `issue/{issue番号}` 形式か確認する
3. 未コミット変更や untracked file がないか確認する
4. Evaluator Output の Result が `pass` であることを確認する
5. 対象 issue の assignee / label / milestone / project を取得する
6. branch を push する
7. 対象 issue のメタデータを引き継いで PR を作成する
8. `output-comment` skill を使い、対象 issue に `AI: PR Created` をコメントする
9. 失敗時は `external-op-failure` skill に従う

## この skill が判断しないこと

- `pass` ではない実装の PR 作成
- 実装 commit の作成
- 評価 Result の作成や上書き
- 受け入れ条件やスコープの変更
- DELETE 系 GitHub 操作
- 作成済み PR、branch、コメントの削除
