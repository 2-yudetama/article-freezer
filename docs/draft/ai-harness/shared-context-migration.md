# 共通コンテキスト移行ドラフト

Manager / Planner / Generator / Evaluator が共通で参照する制約・前提のドラフト。

正式移行時は、内容ごとに `docs/agent/AGENTS.md`、`docs/agent/workflow.md`、`docs/agent/roles/*.md`、`docs/architecture/*`、ルート `AGENTS.md` へ分配する。

## 移行先

```txt
docs/agent/AGENTS.md
docs/agent/workflow.md
docs/agent/roles/*.md
docs/architecture/AGENTS.md
docs/architecture/data-flow.md
docs/architecture/auth.md
AGENTS.md
```

## 分配方針

- 参照優先順位と読み順は `docs/agent/AGENTS.md` へ移す
- issue / PR ルール、git / GitHub 操作ルール、成果物保存ルール、ブランチ・既存変更ルールは `docs/agent/workflow.md` へ移す
- ロール固有の責務は `docs/agent/roles/*.md` へ移す
- package 間の責務概要、横断データフロー、認証・認可は `docs/architecture/*` へ移す
- repo 全体で常に守る作業ルールはルート `AGENTS.md` へ移す

## 目的

各エージェントが同じ前提で判断できるように、個別の Planner 出力へ毎回書くべきではない共通ルールを集約する。

## 参照優先順位

- ルートの `AGENTS.md` を確認する
- `packages/*` を編集する場合は、対象 package の `AGENTS.md` を優先する
- 機能仕様は `docs/features` を参照する
- 環境変数は `.env` ではなく `.env.example` を参照する

## issue / PR ルール

- 1 サイクルで扱うタスクは 1 issue のみ
- issue と PR は 1 対 1 で紐づける
- 1 PR に収まらない場合は、Planner が `split-proposal` を出す
- サブ issue 分割時は Manager が GitHub の Sub-issues 機能で親子関係を作る
- Generator は issue スコープ内の変更を適切な粒度で commit できる
- Generator は push / PR 作成 / issue 操作を行わない
- Evaluator は stage / commit / push / PR 作成 / issue 操作を行わない
- Manager は Evaluator Output の総合判定とスコープ判定が `pass` の場合のみ push / PR 作成できる
- Manager は PR 作成後に issue コメントできる
- commit message は `{Gitmoji} {メッセージタイトル} (#{issue番号})` 形式にする
- commit は実装の意味単位で切る
- `git add .` は使わない

## git / GitHub 操作ルール

全エージェント共通で、次の状態確認は行ってよい。

- `git status`
- `git diff`
- `git log`
- `git branch --show-current`
- 非破壊的な状態確認

全エージェント共通で、次の操作は禁止する。

- `git add .`
- unrelated changes の stage / commit
- `git reset --hard`
- `git clean`
- 変更破棄を伴う `git checkout`
- merge commit の作成
- DELETE 系 GitHub 操作
- issue スコープ外の変更を commit すること

文脈が不要で常に禁止したいコマンドは、`.codex/rules/default.rules` で forbidden にする。
prompt は人間の介入が必須になるため使わない。
rules で表現しにくい引数順・文脈依存チェックは hooks で補完する。
hook 設定は `.codex/hooks.json`、hook スクリプトは `.codex/hooks/pre_tool_use_policy.py` に配置する。
hooks の利用には Codex の `codex_hooks` feature flag を有効にする必要がある。
rules / hooks の詳細は `docs/agent/rules/sandbox.md` と `docs/agent/rules/hooks.md` を参照する。

## skill 利用ルール

- skill は反復的な手順・コマンド例・成果物整形の補助として使う
- エージェントの責務、許可・禁止操作、PR 作成条件、判定基準の正本は正式ドキュメントと `AGENTS.md` に置く
- skill には正式ドキュメントと矛盾する独自ルールを持たせない
- skill と正式ドキュメントが矛盾した場合は、正式ドキュメントを優先する
- エージェント開発ワークフロー固有 skill は既存の `.agents/skills/` 配下に配置する
- skill は role 単位ではなく、ワークフロー上の手順単位で分ける
- `start-workflow` には issue 確定、branch / worktree 状態確認、開始条件判定を置く
- `issue-planning` には Planner Output 作成手順を置く
- `plan-review` には Planner Output の採用、差し戻し、分割フローへの分岐手順を置く
- `issue-splitting` にはサブ issue 作成、Sub-issues 紐づけ、親 issue コメント手順を置く
- `impl-commit` には実装、セルフチェック、明示 stage、commit、Generator Output 作成手順を置く
- `impl-evaluation` には差分レビュー、検証、Evaluator Output 作成手順を置く
- `fix-decision` には `needs-fix` / `blocked` / 修正ループ上限時の分岐手順を置く
- `output-comment` には各 Output / Manager Log / Split Result / PR Created のコメント整形・投稿手順を置く
- `pr-finalization` には Manager による push、PR 作成、PR 作成結果コメント手順を置く
- `external-op-failure` には外部副作用失敗時のリトライ可否判断、停止、記録手順を置く

### skill に外部化する対象

- Manager の GitHub issue / PR 操作手順
- サブ issue 作成と GitHub Sub-issues API 呼び出し手順
- PR body / issue コメント body の組み立て手順
- Planner / Generator / Evaluator Output のテンプレート利用手順
- Generator の commit 前セルフチェック手順
- Evaluator のレビュー観点と検証コマンド選定の手順
- 各フェーズの機械的なチェック手順

### skill に外部化しない対象

- Manager / Planner / Generator / Evaluator の責務定義
- git / GitHub 操作の許可・禁止ルール
- rules / hooks で機械的に制御する内容
- `pass | needs-fix | blocked` の判定基準
- issue / PR テンプレートの正本
- package 間の責務境界やアーキテクチャ正本

## エージェント起動ルール

- 原則として 1 フェーズで起動するエージェントは 1 種類にする
- 複数のサブエージェントを並列起動しない
- read-only な調査であっても、サブエージェントの並列起動は避ける
- Manager は各エージェントの出力を確認してから次フェーズへ進む

## GitHub issue / PR 操作ルール

- GitHub との通信には `gh` を使う
- DELETE 系の GitHub 操作は行わない
- サブ issue 作成時は親 issue の milestone / label / assignee を引き継ぐ
- 親 issue の本文は基本的に編集しない
- 分割結果は親 issue へのコメントで管理する
- PR 作成は Manager が行う
- Manager は実行条件を満たした場合、追加の人間確認なしで GitHub issue / PR 作成、issue コメント、Sub-issues API 呼び出し、push を実行できる
- 外部副作用は確認ではなく、事前条件、実行ログ、失敗時の停止条件で制御する
- Manager は実行した外部副作用のコマンド種別、対象 issue / PR、結果 URL または番号を Manager Output または作業ログに記録する
- 外部副作用の対象 repo / issue / branch が不明確な場合は、人間確認へフォールバックする
- 外部副作用の失敗後に再実行してよいか判断できない場合は、人間確認へフォールバックする
- 外部副作用の失敗時は、コマンド種別ごとの固定ルールでリトライ可否を判断する
- 成功したか曖昧な作成・更新系操作は、重複を避けるため原則として自動リトライしない
- `git push` は一時的失敗に見える場合のみ最大 2 回までリトライできる
- `gh pr create` は既存 PR を確認し、未作成かつ一時的失敗に見える場合のみ 1 回リトライできる
- `gh issue create` と `gh api --method POST/PATCH` は自動リトライしない
- `gh issue comment` はコメント作成有無を軽量に確認できる場合のみ 1 回リトライできる
- 認証失敗、権限不足、対象 repo / issue / branch 不明、DELETE 系要求は即停止する

## エージェント成果物保存ルール

- Planner / Generator / Evaluator Output の正本は GitHub issue コメントに保存する
- リポジトリ内にはエージェント成果物ログを作らない
- ローカル一時ファイルは必須にせず、Manager が必要な場合だけ使う
- Planner Output は対象 issue のコメントに保存する
- Generator Output は対象 issue のコメントに保存する
- Evaluator Output は対象 issue のコメントに保存する
- Manager Log は必要な場合のみ対象 issue のコメントに保存する
- サブ issue 分割時の `split-proposal` と分割結果は親 issue のコメントに保存する
- Output コメントの見出しは `AI: Planner Output` / `AI: Generator Output` / `AI: Evaluator Output` の形式にする
- 修正ループがある場合は、コメント本文に `Loop: {番号}` を含める
- Output コメント本文の整形と投稿手順は skill 化候補とする

## ブランチ・既存変更ルール

- ブランチ名は基本的に `issue/{issue番号}` とする
- Manager は Planner 起動前と PR 作成前に `git branch --show-current` と `git status --short` を確認する
- 開発サイクル開始時の作業ツリーは clean 必須とする
- `git status --short` に出力がある場合、Manager は Planner を起動せず開発サイクルを開始しない
- 現在ブランチが対象 issue の `issue/{issue番号}` の場合は、そのまま作業を続行できる
- 現在ブランチが別の `issue/*` の場合は、原則として作業を開始しない
- 基点ブランチで作業ツリーが clean の場合、Manager は `issue/{issue番号}` ブランチを作成できる
- 現在ブランチに関わらず、既存変更がある場合は人間確認へフォールバックする
- Manager は現在ブランチが対象 issue の作業ブランチだと判断できる場合のみ、`issue/{issue番号}` 形式へリネームできる
- 作業ツリーが clean ではない場合は、リネームせず人間確認へフォールバックする
- 既存変更が対象 issue に属しているように見える場合でも、自動で作業対象に含めない
- 既存変更がある状態で Generator を起動しない
- 既存変更を自動で破棄、stash、別ブランチへ移動しない
- untracked file も既存変更として扱う
- PR 作成前に未コミット変更や untracked file が残っている場合は、PR 作成へ進まない

## 実装ルール

- 既存のコードスタイル・アーキテクチャに合わせる
- 変更前から存在していたコメントは勝手に消さない
- コメントに句点はつけない
- 不要な空白は削除する
- 新規ファイルを作成する場合は末尾に改行を足す
- JavaScript / TypeScript workspace では `pnpm` を使う
- `npm` / `yarn` を混在させない

## ドキュメント同期ルール

- 機能の挙動や責務を変更した場合は `docs/features` も同期して更新する
- コマンド・構成・アーキテクチャを変更した場合は、対応する `AGENTS.md` / `README.md` も同期して更新する

## 人間確認が必要な条件

- 破壊的変更が必要な場合
- DELETE 系操作が必要な場合
- 受け入れ条件やスコープの変更が必要な場合
- セキュリティ・認可・データ破壊に関わる判断が必要な場合
- Evaluator Output が `pass` にならないまま修正ループ上限に達した場合
