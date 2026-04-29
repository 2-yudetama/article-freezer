# Evaluator Output template

修正ループ時は `Loop: {番号}` を含める。

```md
# Evaluator Output

対象 issue:

Loop:

## Result

## 評価対象の差分概要

## 受け入れ条件ごとの判定

## スコープ

## 検証

## 発見した問題

## 未実行の検証と理由

## 未解決事項
```

Evaluator Output の issue コメント投稿は `output-comment` skill を使う。

## 記録する内容

- Result
- 評価対象の差分概要
- 受け入れ条件ごとの判定
- 指摘事項
- 実行した検証コマンドと結果
- 未実行の検証と理由
- `needs-fix` の場合は修正が必要な事項
- `blocked` の場合は停止理由と人間判断が必要な事項
