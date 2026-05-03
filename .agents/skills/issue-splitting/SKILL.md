---
name: issue-splitting
description: Manager が採用済みの Planner split-proposal に基づき、サブ issue 作成と分割結果の記録を進める。
metadata:
  short-description: 採用済み issue 分割を進める
---

# issue-splitting

## 目的

採用済みの `split-proposal` に基づき、Manager がサブ issue 作成と親 issue への記録を進める。

## 使用フェーズ

- issue 分割

## 実行ロール

- Manager

## 入力

- 対象 issue
- 採用済みの `split-proposal`
- 親 issue の本文、ラベル、マイルストーン
- repo 情報

## 出力

- サブ issue
- 親 issue への分割結果コメント
- 必要に応じた親 issue とサブ issue の紐づけ
- `AI: Split Result`
- 必要に応じた `AI: Manager Log`

## 参照する正式ドキュメント

- `docs/agent/workflow.md`
- `docs/agent/roles/manager.md`
- `docs/agent/rules/hooks.md`

## 追加リソース

- `references/splitting.md`: サブ issue 作成、Sub-issues API、失敗時の扱い
- `references/sub-issue-template.md`: サブ issue 本文テンプレート
- `references/split-result-template.md`: 分割結果コメントテンプレート

## 実行手順

1. `split-proposal` が採用済みであることを確認する
2. サブ issue 本文を作る
3. サブ issue を作成する
4. 必要に応じて Sub-issues API で親子関係を作る
5. `output-comment` skill を使い、親 issue に `AI: Split Result` を投稿する
6. 親 issue の直接実装を停止する
7. 失敗時は外部副作用失敗時の扱いに従う

## この skill が判断しないこと

- 分割案の採用可否
- 親 issue の直接実装継続
- 実装 commit の作成
- DELETE 系 GitHub 操作
- 作成済み issue、紐づけ、コメントの削除
