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

英語の Conventional Commits 形式ではなく、Gitmoji、変更内容を表す日本語タイトル、対象 issue 番号を含める。
複数 commit になる場合も、全て同じ issue 番号を含める。

例:

```txt
📝 エージェントワークフロー手順を整理 (#123)
```
