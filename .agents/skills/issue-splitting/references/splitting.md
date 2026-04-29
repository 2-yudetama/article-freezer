# issue-splitting reference

## サブ issue body

- 背景
- スコープ
- スコープ外
- 受け入れ条件
- 検証
- 親 issue
- 対応順

## 実行コマンド

```bash
gh issue create --title "{サブ issue タイトル}" --body "{サブ issue body}"
```

本文が長い場合は shell の標準入力を使って `gh issue create --title "{サブ issue タイトル}" --body-file -` で作成する。
一時ファイルは原則として作らない。

親子関係は GitHub Sub-issues API で紐づける。

```bash
gh api repos/{owner}/{repo}/issues/{サブissue番号} --jq .id
gh api -X POST repos/{owner}/{repo}/issues/{親issue番号}/sub_issues -f sub_issue_id={サブissue_id}
gh api repos/{owner}/{repo}/issues/{親issue番号}/sub_issues
```

- `sub_issue_id` は issue 番号ではなく issue の `id` を使う
- `replace_parent` は通常指定しない
- 既に別の親 issue に紐づいている可能性がある場合は自動で `replace_parent=true` を使わず、人間確認へフォールバックする
- 紐づけ確認は `GET repos/{owner}/{repo}/issues/{親issue番号}/sub_issues` の結果で行う
- endpoint / payload は GitHub API の現在仕様を確認してから使い、DELETE 系 method は使わない

## Split Result

- 親 issue
- 作成したサブ issue 一覧
- 推奨対応順
- Sub-issues 紐づけ結果
- 失敗または未実行の操作

## 失敗時

- 作成済みサブ issue やコメントは削除しない
- 作成や紐づけの成功状態が曖昧な場合は自動リトライしない
- 実行済み操作、未実行操作、停止理由を `AI: Manager Log` に記録する
- 以降は `external-op-failure` skill を使う
