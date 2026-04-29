# git / GitHub 手順移行ドラフト

Manager が issue 整備や PR 作成で使う git / GitHub 操作のコマンド例。

正式ドキュメントでは `docs/agent/github-operations.md` は作成しない。
許可条件・禁止事項・失敗時ルールの正本は `docs/agent/workflow.md` に統合し、具体的なコマンド例は手順単位の skill へ移す。

## 移行先

```txt
docs/agent/workflow.md
.agents/skills/start-workflow/SKILL.md
.agents/skills/issue-splitting/SKILL.md
.agents/skills/impl-commit/SKILL.md
.agents/skills/output-comment/SKILL.md
.agents/skills/pr-finalization/SKILL.md
.agents/skills/external-op-failure/SKILL.md
```

## 分配方針

- 外部副作用の実行条件、記録ルール、禁止事項は `docs/agent/workflow.md` へ移す
- issue / branch / worktree 開始条件確認は `.agents/skills/start-workflow/SKILL.md` へ移す
- サブ issue 作成、Sub-issues API、親 issue コメントは `.agents/skills/issue-splitting/SKILL.md` へ移す
- 明示 stage、commit 前確認、commit コマンド例は `.agents/skills/impl-commit/SKILL.md` へ移す
- AI Output コメント投稿は `.agents/skills/output-comment/SKILL.md` へ移す
- push、PR 作成、PR 作成結果コメントは `.agents/skills/pr-finalization/SKILL.md` へ移す
- 外部副作用失敗時のリトライ可否判断、停止、記録は `.agents/skills/external-op-failure/SKILL.md` へ移す

## 前提

- 対象リポジトリは `2-yudetama/article-freezer`
- GitHub との通信には `gh` を使う
- DELETE 系の操作は行わない
- サブ issue の親子関係は GitHub の Sub-issues 機能を使う
- `gh issue` に sub-issue 専用サブコマンドはないため、Sub-issues API は `gh api` で呼び出す
- Manager は実行条件を満たした場合、追加の人間確認なしで GitHub issue / PR 作成、issue コメント、Sub-issues API 呼び出し、push を実行できる
- 外部副作用は確認ではなく、事前条件、実行ログ、失敗時の停止条件で制御する

## 親 issue の取得

```bash
gh issue view 54 \
  --repo 2-yudetama/article-freezer \
  --json number,title,body,labels,milestone,assignees
```

## サブ issue 作成

親 issue の milestone / label / assignee を引き継いで作成する。

```bash
gh issue create \
  --repo 2-yudetama/article-freezer \
  --title "サブ issue のタイトル" \
  --body-file /tmp/sub-issue-body.md \
  --milestone "マイルストーン名" \
  --label "label-a,label-b" \
  --assignee "2-yudetama"
```

## サブ issue の REST id 取得

Sub-issues API の `sub_issue_id` には issue 番号ではなく REST issue id を渡す。

```bash
gh api \
  repos/2-yudetama/article-freezer/issues/123 \
  --jq '.id'
```

## 親 issue への Sub-issues 紐づけ

```bash
gh api \
  --method POST \
  repos/2-yudetama/article-freezer/issues/54/sub_issues \
  -f sub_issue_id=4329989445
```

`sub_issue_id` には、サブ issue の REST issue id を指定する。

## 親 issue へのコメント追加

コメント本文の正本は GitHub issue コメントとする。
`--body-file` 用の一時ファイルは必要な場合だけ使い、正式な保存先にはしない。

```bash
gh issue comment 54 \
  --repo 2-yudetama/article-freezer \
  --body-file /tmp/parent-issue-split-comment.md
```

## サブ issue 一覧確認

```bash
gh api \
  repos/2-yudetama/article-freezer/issues/54/sub_issues \
  --jq '.[] | {number, title, id}'
```

## ブランチ確認

```bash
git branch --show-current
git status --short
```

ブランチ名は `issue/{issue番号}` 形式にする。
Manager は Planner 起動前と PR 作成前にブランチ名と作業ツリーを確認する。
開発サイクル開始時の作業ツリーは clean 必須とし、`git status --short` に出力がある場合は開始しない。

## ブランチ作成

基点ブランチで作業ツリーが clean の場合、Manager は対象 issue 用のブランチを作成できる。

```bash
git switch -c issue/54
```

既に同名ブランチがある場合は、そのブランチを使うか人間確認へフォールバックする。

## ブランチリネーム

Manager は現在ブランチが対象 issue の作業ブランチだと判断でき、作業ツリーが clean の場合のみリネームできる。

```bash
git branch -m issue/54
```

別 issue の作業ブランチを対象 issue のブランチへリネームしない。
作業ツリーが clean ではない場合は、人間確認へフォールバックする。

## 差分確認

```bash
git status --short
git log --oneline origin/main..HEAD
git diff --stat origin/main..HEAD
git diff --name-only origin/main..HEAD
```

## commit 前確認

```bash
git status --short
git diff --stat
git diff --name-only
```

## commit

`git add .` は使わず、対象ファイルを明示して stage する。

```bash
git add docs/draft/ai-harness/workflow.md docs/draft/ai-harness/output-templates.md
git commit -m "📝 エージェント開発ワークフロードラフトを追加 (#54)"
```

複数 commit になる場合も、全て同じ issue 番号を含める。

```bash
git commit -m "📝 Planner 出力テンプレートを整理 (#54)"
git commit -m "📝 Sub-issues 運用フローを追加 (#54)"
```

## push

```bash
git push -u origin issue/54
```

## PR 作成

```bash
gh pr create \
  --repo 2-yudetama/article-freezer \
  --base main \
  --head issue/54 \
  --title "エージェント開発ワークフロー整備 (#54)" \
  --body-file /tmp/pr-body.md
```

## PR 作成結果の issue コメント

```bash
gh issue comment 54 \
  --repo 2-yudetama/article-freezer \
  --body "PR を作成しました: {PR URL}"
```

## AI Output コメント

Planner / Generator / Evaluator Output の正本は GitHub issue コメントに保存する。
リポジトリ内にはエージェント成果物ログを作らない。
ローカル一時ファイルは必須ではなく、必要な場合だけ使う。

```bash
gh issue comment 54 \
  --repo 2-yudetama/article-freezer \
  --body-file /tmp/planner-output-comment.md
```

コメント見出し:

- `AI: Planner Output`
- `AI: Generator Output`
- `AI: Evaluator Output`
- `AI: Manager Log`
- `AI: PR Created`
- `AI: Split Proposal`
- `AI: Split Result`

修正ループがある場合は、コメント本文に `Loop: {番号}` を含める。

## 外部副作用の実行条件

- 操作主体が Manager である
- 対象 issue が 1 つに確定している
- 対象リポジトリが `2-yudetama/article-freezer` である
- DELETE 系 GitHub 操作ではない
- 対象ブランチが `issue/{issue番号}` 形式である
- 既存変更がなく、作業ツリーの状態が操作条件を満たしている
- PR 作成時は Evaluator Output の総合判定とスコープ判定が `pass` である
- サブ issue 作成時は Planner の `split-proposal` を Manager が採用している
- issue コメント時はコメント本文が作成済みで、対象 issue 番号が明確である
- `gh api` 利用時は method と endpoint が明確で、DELETE 系ではない

## 外部副作用の記録

- `gh issue create` 後は作成された issue 番号を記録する
- `gh pr create` 後は PR URL を記録する
- `gh issue comment` 後はコメント対象 issue とコメント概要を記録する
- `gh api` 後は対象 endpoint と結果概要を記録する
- `git push` 後は push した branch と remote を記録する

## 外部副作用失敗時のリトライ

`git push` は、一時的失敗に見える場合のみ最大 2 回までリトライできる。
non-fast-forward、ブランチ保護、権限不足、remote / branch 不明の場合はリトライせず停止する。

`gh pr create` に失敗した場合は、まず既存 PR を確認する。

```bash
gh pr list \
  --repo 2-yudetama/article-freezer \
  --head issue/54 \
  --json number,title,url
```

既存 PR が見つかった場合は、その PR URL を記録して PR 作成済みとして扱う。
既存 PR が見つからず、一時的失敗に見える場合は 1 回だけリトライできる。

`gh issue create` は自動リトライしない。
レスポンス取得に失敗しても issue が作成済みの可能性があるため、重複作成を避けて停止する。

`gh api --method POST` は自動リトライしない。
Sub-issues 紐づけなどは成功済みの可能性があるため、重複更新を避けて停止する。
Sub-issues API の失敗時は作成済みの issue を削除せず、親 issue コメントとサブ issue 側の本文またはコメントでリンクを残す。
Manager は対象 issue に `AI: Manager Log` を残し、紐づけ失敗理由、手動確認事項、手動で Sub-issues 紐づけが必要なことを記録する。

`gh api --method PATCH` は自動リトライしない。
更新済みの可能性があるため、対象状態を確認してから停止する。

`gh issue comment` は、コメント作成有無を軽量に確認できる場合のみ 1 回リトライできる。
コメント作成済みの可能性を否定できない場合はリトライせず停止する。

認証失敗、権限不足、対象 repo / issue / branch 不明、DELETE 系要求は即停止する。
停止時は、失敗した外部副作用、実行済みの前段操作、未実行の後続操作を記録する。
途中まで作成された issue / PR / コメント / Sub-issues 紐づけは削除しない。

## 注意点

- Generator は commit まで行えるが、push / PR 作成 / issue 操作は行わない
- Manager は Evaluator Output の総合判定とスコープ判定が `pass` の場合のみ push / PR 作成へ進める
- Evaluator は stage / commit / push / PR 作成 / issue 操作を行わない
- Manager は実行条件を満たした場合、追加の人間確認なしで外部副作用を実行できる
- 対象 repo / issue / branch が不明確な場合は、人間確認へフォールバックする
- 外部副作用の失敗後に再実行してよいか判断できない場合は、人間確認へフォールバックする
- 外部副作用の失敗時は、コマンド種別ごとの固定ルールでリトライ可否を判断する
- 成功したか曖昧な作成・更新系操作は、重複を避けるため原則として自動リトライしない
- Manager は Planner 起動前と PR 作成前に `git branch --show-current` と `git status --short` を確認する
- `git status --short` に出力がある場合、Manager は Planner を起動せず開発サイクルを開始しない
- 現在ブランチに関わらず、既存変更がある場合は人間確認へフォールバックする
- 既存変更が対象 issue に属しているように見える場合でも、自動で作業対象に含めない
- 既存変更がある状態で Generator を起動しない
- 既存変更を自動で破棄、stash、別ブランチへ移動しない
- untracked file も既存変更として扱う
- PR 作成前に未コミット変更や untracked file が残っている場合は、push / PR 作成へ進まない
- `gh issue create` の出力から issue 番号を控える
- Sub-issues API には issue 番号ではなく REST issue id を渡す
- 親 issue へのコメントには、分割理由・分割方針・子 issue 一覧・推奨対応順を含める
- 親 issue の本文は基本的に編集しない
- PR 作成前に Evaluator Output の総合判定とスコープ判定が `pass` であることを確認する
- PR body は Generator Output と Evaluator Output をもとに作成する
- commit は実装の意味単位で切る
- `git add .` は使わない
- unrelated changes の stage / commit は行わない
- `git reset --hard` / `git clean` / 変更破棄を伴う `git checkout` は行わない
