# external-op-failure reference

## 操作別の扱い

- `git push`: remote branch が作成された可能性を確認し、成功状態が曖昧なら自動リトライしない
- `gh pr create`: 既存 PR が作成済みか確認し、見つかれば PR URL を記録する
- `gh issue create`: 作成済み issue がある可能性を確認し、重複作成を避ける
- `gh issue comment`: 投稿済みコメントの有無が曖昧な場合は自動リトライしない
- `gh api`: method と endpoint を記録し、DELETE 系または対象不明なら停止する

## 確認コマンド例

```bash
git branch -r --list origin/issue/{issue番号}
gh pr list --head issue/{issue番号} --state all
gh issue view {issue番号} --comments
```

確認コマンドは状態確認に限定する。
作成済みリソースの削除、force push、DELETE 系 API は実行しない。

## Manager Log

- 対象 issue
- 失敗した操作
- 実行したコマンド種別
- エラー内容
- 成功済みの可能性がある操作
- 実行済みの前段操作
- 未実行の後続操作
- 停止理由
- 人間に確認したい事項
