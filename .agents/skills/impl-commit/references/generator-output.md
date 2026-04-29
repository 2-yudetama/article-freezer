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

Generator Output の issue コメント投稿は `output-comment` skill を使う。

## 記録する内容

- 実装概要
- 変更した主なファイル
- 受け入れ条件への対応状況
- commit hash と commit ごとの意図
- 実行した検証コマンドと結果
- 未実行の検証と理由
- 未解決事項、リスク、Manager に戻す判断事項
- 修正ループ時は対応した Evaluator 指摘
