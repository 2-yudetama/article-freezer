# fix-decision reference

## 分岐

- `pass`: `pr-finalization` skill に進む
- `needs-fix` かつ修正ループ 2 回未満: Generator に修正依頼を出す
- `needs-fix` かつ修正ループ 2 回到達: 人間確認へフォールバックする
- `blocked`: 人間確認へフォールバックする
- Result が不明: Evaluator に差し戻すか、人間確認へフォールバックする

## 修正依頼

- 対象 issue
- Loop 番号
- Evaluator Output の Result
- 修正必須項目
- 変更してはいけないスコープ
- 再検証してほしい項目

## Manager Log

- 対象 issue
- 停止理由
- 最新の Generator Output
- 最新の Evaluator Output
- 修正ループ回数
- 人間に確認したい事項
