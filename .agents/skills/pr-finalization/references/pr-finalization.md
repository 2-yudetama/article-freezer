# pr-finalization reference

## PR 作成前チェック

- 対象 issue が 1 つに確定している
- 採用済み `implementation-plan` がある
- Generator Output がある
- Evaluator Output の `Result` が `pass`
- Generator の commit 一覧と受け入れ条件への対応が記録されている
- 検証結果が記録されている
- ブランチ名が `issue/{issue番号}` 形式である
- `git status --short` に未コミット変更や untracked file がない
- 対象 issue の assignee / label / milestone / project を取得している

## 実行コマンド

```bash
git push origin issue/{issue番号}
gh issue view {issue番号} --json assignees,labels,milestone,projectItems
gh pr create --base {baseブランチ} --head issue/{issue番号} --title "{PRタイトル}" --body "{PR本文}" {metadata flags}
```

- push は remote と branch を明示し、引数なし push / upstream 設定に依存しない
- `git push origin issue/{issue番号}` は rules の sandbox bypass allow 対象であり、`git push` は対象外
- `{baseブランチ}` はリポジトリの既定ブランチまたは対象 issue で指定されたブランチにする
- `{metadata flags}` には対象 issue から引き継ぐ `--assignee`、`--label`、`--milestone`、`--project` を入れる
- PR body が長い場合は shell の標準入力を使って `gh pr create --base {baseブランチ} --head issue/{issue番号} --title "{PRタイトル}" --body-file -` で作成する
- 一時ファイルは原則として作らない
- `gh pr create` が失敗し、既存 PR の可能性がある場合は削除や再作成をせず、既存 PR を確認して記録する

## issue メタデータの引き継ぎ

PR 作成時は、対象 issue に設定された以下のメタデータを可能な範囲で PR に引き継ぐ。

- assignee
- label
- milestone
- project

取得例:

```bash
gh issue view {issue番号} --json assignees,labels,milestone,projectItems
```

作成例:

```bash
gh pr create \
  --base {baseブランチ} \
  --head issue/{issue番号} \
  --title "{PRタイトル}" \
  --body "{PR本文}" \
  --assignee "{login}" \
  --label "{label}" \
  --milestone "{milestone}" \
  --project "{project}"
```

- assignee / label / project が複数ある場合は、同じ flag を複数回指定するか comma 区切りで指定する
- milestone は 1 つだけ引き継ぐ
- 対象 issue に存在しないメタデータの flag は指定しない
- project 引き継ぎで認可 scope が不足している場合は、PR 作成を優先し、project だけ未引き継ぎとして `AI: PR Created` または `AI: Manager Log` に記録する
- 作成時に一部メタデータの引き継ぎが失敗した場合は、PR を削除せず `gh pr edit` で不足分の追加を 1 回だけ試みる
- `gh pr edit` でも失敗した場合は、失敗したメタデータ、エラー、PR URL を記録し、`external-op-failure` skill を使う

## PR body

- 対象 issue
- 概要
- 変更内容
- 受け入れ条件への対応
- 検証
- 未解決事項
- AIサマリ
- Generator Output
- Evaluator Output

サブ issue は対応 PR の closing keyword で close する。
親 issue は、最後のサブ issue の PR body にだけ closing keyword として含める。
最後のサブ issue か判断できない場合、親 issue は close 対象に含めない。

## PR 作成後

- 対象 issue に `AI: PR Created` を投稿する
- PR URL、対象ブランチ、対象 commit を記録する
- 引き継いだ issue メタデータと、未引き継ぎのメタデータがあれば理由を記録する
- 投稿には `output-comment` skill を使う
- push または PR 作成の成否が曖昧な場合は `external-op-failure` skill を使う

## AI: PR Created の記録項目

- Metadata には Labels、Reviewers、Assignees、PR number、Milestone、Release / Deployment target、Testing status、Short summary を記録する
- 引き継ぎ済みと未引き継ぎには Owner、Action item、Date、Status / ETA を記録する
- 引き継ぎ済み例: Owner: Manager / Action item: labels を PR に引き継ぎ / Date: 2026-05-06 / Status: done
- 未引き継ぎ例: Owner: human / Action item: project 追加 / Date: 2026-05-06 / Status: auth scope 確認待ち
