# Generator Output template

修正ループ時は `Loop: {番号}` を含める。

```md
# Generator Output

対象 issue:

Loop:

## 実装概要

## 変更内容

## 変更した主なファイル

## 受け入れ条件への対応

## Commit 一覧

## 実行した検証

## 未実行の検証と理由

## 未対応・懸念
```

Generator Output の issue コメント投稿は Generator 自身が `output-comment` skill を使う。

## 記録する内容

- 実装概要
- 変更した主なファイル
- 受け入れ条件への対応状況
- commit hash と commit ごとの意図
- 実行した検証コマンドと結果
- 未実行の検証と理由
- 未解決事項、リスク、Manager に戻す判断事項
- 修正ループ時は `Loop: {番号}` と対応した Evaluator 指摘

## 責務境界

- Generator Output の本文は Generator が作成する
- Output の投稿手順は `output-comment` skill に従う
- push、PR 作成、PR 作成結果コメントは Manager の `pr-finalization` が扱う
- unrelated changes は stage / commit せず、必要に応じて `未対応・懸念` に記録する
