# output-comment reference

## コメント見出し

- `AI: Planner Output`
- `AI: Generator Output`
- `AI: Evaluator Output`
- `AI: Manager Log`
- `AI: Split Result`
- `AI: PR Created`

## 投稿契約

- Output の内容は各ロールの skill または参照テンプレートで作成する
- `output-comment` は投稿形式と投稿手順だけを扱い、Output の採用可否や Result を判断しない
- 各ロールは自身が作成した Output を `output-comment` skill で投稿する
- 既存 Output コメントの編集・削除は原則行わない
- DELETE 系 GitHub 操作は行わない

## 投稿手順

1. 対象 issue 番号を確認する
2. 見出しが `AI: ...` 形式か確認する
3. 本文に必要な Type、Result、commit、検証結果、未解決事項が含まれるか確認する
4. 修正ループごとの Generator Output / Evaluator Output は新しいコメントとして投稿し、`Loop: {番号}` を含める
5. `gh issue comment {issue番号} --body "..."` または標準入力で投稿する
6. 投稿 URL または投稿結果を記録する

## 失敗時

- コメント投稿に失敗したロールは自分で復旧判断せず Manager に戻す
- Manager は `external-op-failure` skill で停止、確認、記録を判断する
- 成功したか曖昧なコメント作成は無条件リトライしない
- 作成済みコメントは削除しない
