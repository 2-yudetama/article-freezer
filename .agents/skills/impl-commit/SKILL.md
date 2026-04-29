---
name: impl-commit
description: Generator が採用済み implementation-plan に沿って実装、検証、明示 stage、スコープ内 commit、Generator Output 作成を行う。
metadata:
  short-description: スコープ内の実装と commit を行う
---

# impl-commit

## 目的

Generator が `implementation-plan` に沿って実装し、issue スコープ内の変更を検証して commit する。

## 使用フェーズ

- 実装
- 修正判断

## 実行ロール

- Generator

## 入力

- 対象 issue
- 採用済みの `implementation-plan`
- 関連する `AGENTS.md`
- 現在のコードベース
- 修正ループ時の Evaluator Output

## 出力

- issue スコープ内の commit
- Generator Output

## 参照する正式ドキュメント

- `docs/agent/workflow.md`
- `docs/agent/roles/generator.md`
- `docs/agent/rules/hooks.md`
- ルートおよび対象 package の `AGENTS.md`

## 追加リソース

- `references/commit-check.md`: commit 前チェック、commit message 形式
- `references/generator-output.md`: Generator Output テンプレート

## 実行手順

1. `implementation-plan` と受け入れ条件を確認する
2. 対象 package の `AGENTS.md` を確認する
3. 既存設計とコードスタイルに合わせて実装する
4. 必要なセルフチェックと検証を行う
5. `git status --short` と差分を確認する
6. 対象ファイルを明示して stage する
7. staged diff が issue スコープ内だけか確認する
8. issue スコープ内の変更だけを commit する
9. commit hash と検証結果を Generator Output に記録する

## この skill が判断しないこと

- Planner Output の採用可否
- 受け入れ条件やスコープの変更
- push / PR 作成
- Generator Output 以外の issue コメント投稿
- unrelated changes の stage / commit
