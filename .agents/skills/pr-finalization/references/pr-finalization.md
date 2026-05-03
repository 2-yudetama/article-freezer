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

## 実行コマンド

```bash
git push origin issue/{issue番号}
gh pr create --base {baseブランチ} --head issue/{issue番号} --title "{PRタイトル}" --body "{PR本文}"
```

- push は remote と branch を明示し、引数なし push / upstream 設定に依存しない
- `{baseブランチ}` はリポジトリの既定ブランチまたは対象 issue で指定されたブランチにする
- PR body が長い場合は shell の標準入力を使って `gh pr create --base {baseブランチ} --head issue/{issue番号} --title "{PRタイトル}" --body-file -` で作成する
- 一時ファイルは原則として作らない
- `gh pr create` が失敗し、既存 PR の可能性がある場合は削除や再作成をせず、既存 PR を確認して記録する

## PR body

- 対象 issue
- 概要
- 変更内容
- 受け入れ条件への対応
- 検証
- 未解決事項
- AIサマリ

サブ issue は対応 PR の closing keyword で close する。
親 issue は、最後のサブ issue の PR body にだけ closing keyword として含める。
最後のサブ issue か判断できない場合、親 issue は close 対象に含めない。

## PR 作成後

- 対象 issue に `AI: PR Created` を投稿する
- PR URL、対象ブランチ、対象 commit を記録する
- 投稿には `output-comment` skill を使う
- push または PR 作成の成否が曖昧な場合は `external-op-failure` skill を使う
