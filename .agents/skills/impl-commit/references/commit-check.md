# impl-commit reference

## commit 前チェック

```bash
git status --short
git diff
git diff --cached
```

- `git add .` は使わず、対象ファイルを明示して stage する
- staged diff が issue スコープ内だけか確認する
- unrelated changes がある場合は stage せず、Generator Output の `未対応・懸念` に記録する
- 検証を実行できない場合は、未実行理由を Generator Output に記録する

## commit message

形式:

```txt
{Gitmoji} {メッセージタイトル} (#{issue番号})
```

例:

```txt
📝 エージェントワークフロー手順を整理 (#123)
```
