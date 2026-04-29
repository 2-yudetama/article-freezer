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

- 採用済みの `split-proposal`
- 親 issue
- サブ issue 案
- 推奨対応順

## 出力

- 作成したサブ issue 一覧
- 親 issue への `AI: Split Result`
- 必要に応じた `AI: Manager Log`

## 参照する正式ドキュメント

- `docs/agent/workflow.md`
- `docs/agent/roles/manager.md`
- `docs/agent/rules/hooks.md`

## 追加リソース

- `references/splitting.md`: サブ issue body、作成コマンド、Split Result、失敗時の扱い
- `references/sub-issue-template.md`: サブ issue テンプレート
- `references/split-result-template.md`: Split Result テンプレート

## 実行手順

1. `split-proposal` が採用済みであることを確認する
2. サブ issue 案が issue body に転用できる粒度か確認する
3. サブ issue を作成する
4. GitHub Sub-issues API で親 issue に紐づける
5. 親 issue に `AI: Split Result` をコメントする
6. 失敗時は削除せず、人間確認へフォールバックする

## この skill が判断しないこと

- 分割要否の初回判断
- 親 issue 本文の編集
- 作成済みサブ issue の削除
- DELETE 系 GitHub 操作
