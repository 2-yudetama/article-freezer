# output-comment reference

## コメント見出し

- `AI: Planner Output`
- `AI: Generator Output`
- `AI: Evaluator Output`
- `AI: Manager Log`
- `AI: PR Created`
- `AI: Split Proposal`
- `AI: Split Result`

## 投稿手順

- 短い本文は `gh issue comment {issue番号} --body ...` を使える
- 長い本文は shell の標準入力を使って `gh issue comment {issue番号} --body-file -` で投稿する
- コメント本文には機密情報や `.env` の内容を含めない
- 投稿済みコメントは原則として編集・削除しない
- 修正ループごとの Generator Output / Evaluator Output は新しいコメントとして投稿し、`Loop: {番号}` を含める

## 失敗時

- 投稿に成功したか曖昧な場合は自動リトライしない
- 認証失敗、権限不足、対象 issue 不明の場合は停止する
- 停止時は `external-op-failure` skill を使う
