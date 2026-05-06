# Evaluator Output template

修正ループ時は `Loop: {番号}` を含める。初回評価では `Loop:` 行を省略する。

```md
# Evaluator Output

対象 issue:

Loop:

## Result

pass | needs-fix | blocked のいずれか:

## Result の根拠

## 評価対象の差分概要

## 受け入れ条件ごとの判定

## スコープ

## 検証

## 発見した問題

## 未実行の検証と理由

## 未解決事項
```

Evaluator Output の issue コメント投稿は Evaluator 自身が `output-comment` skill を使う。

## 記録する内容

- `pass | needs-fix | blocked` のいずれかの Result
- Result の根拠
- 評価対象の差分概要
- 受け入れ条件ごとの判定
- 発見した問題
- 検証
- 未実行の検証と理由
- `needs-fix` の場合は修正が必要な事項
- `blocked` の場合は停止理由と人間判断が必要な事項

## Result 判断

- `pass`: 受け入れ条件を満たし、PR 最終化へ進める重大な問題がない
- `needs-fix`: issue スコープ内で Generator が修正できる問題がある
- `blocked`: 受け入れ条件やスコープの見直し、人間判断、外部状態確認が必要で修正ループへ進めない
