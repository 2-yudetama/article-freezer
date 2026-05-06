# start-workflow reference

## 確認コマンド

```bash
git branch --show-current
git status --short
```

## ブランチ判断

- 現在ブランチが対象 issue の `issue/{issue番号}` の場合は続行できる
- clean な基点ブランチの場合、Manager は `issue/{issue番号}` ブランチ作成を判断できる
- `issue/{別番号}` の場合は、別 issue 作業中として開始しない
- ブランチ名だけでは対象 issue の作業ブランチか判断できない場合は、人間確認へフォールバックする

## 停止条件

- 対象 issue が 1 つに確定していない
- 作業ツリーに既存変更または untracked file がある
- 既存の別 issue ブランチで作業している
- 必要な `AGENTS.md` を確認できない
- ブランチ作成やリネームの安全性を判断できない
