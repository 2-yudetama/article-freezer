---
name: output-comment
description: エージェント開発ワークフローの Planner、Generator、Evaluator、Manager、分割、PR 作成結果の Output を GitHub issue コメントとして整形・投稿する。
metadata:
  short-description: AI ワークフローコメントを投稿する
---

# output-comment

## 目的

Planner / Generator / Evaluator Output と Manager 系コメントを GitHub issue コメントとして保存する共通手順を提供する。

## 使用フェーズ

- 計画作成
- issue 分割
- 実装
- 評価
- 修正判断
- PR 最終化

## 実行ロール

- Planner
- Generator
- Evaluator
- Manager

## 入力

- 保存対象の Output または Manager コメント
- 対象 issue 番号
- コメント見出し
- 修正ループ番号

## 出力

- GitHub issue コメント
- コメント投稿結果の記録

## 参照する正式ドキュメント

- `docs/agent/workflow.md`
- `docs/agent/roles/manager.md`
- `docs/agent/roles/planner.md`
- `docs/agent/roles/generator.md`
- `docs/agent/roles/evaluator.md`
- `docs/agent/rules/hooks.md`

## 追加リソース

- `references/comment-format.md`: コメント見出し、投稿手順、失敗時の扱い
- `references/comment-template.md`: issue コメントテンプレート

## 実行手順

1. コメント対象 issue を確認する
2. コメント見出しを `AI: ...` 形式で付ける
3. 修正ループがある場合は `Loop: {番号}` を含める
4. Output 本文が各ロールのテンプレートに沿っているか確認する
5. Output の内容や採用可否は変更せず、投稿形式だけを整える
6. 一時ファイルを作らず `--body` または標準入力で issue コメントを投稿する
7. Output またはコメントを作成したロールが issue コメントを投稿する
8. 投稿失敗時は外部副作用失敗時の扱いに従う

## この skill が判断しないこと

- Planner Output の採用可否
- Generator / Evaluator Output の内容の改変
- Manager のフェーズ移行判断
- 既存コメントの削除
- 既存コメントの原則編集
- DELETE 系 GitHub 操作
