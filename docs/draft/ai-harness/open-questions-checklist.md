# エージェント開発ワークフロー不明点チェックリスト

以降の対話では、このチェックリストをベースに優先度順で不明点を解消する。
各項目の決定時は、このチェックリストだけでなく、影響する `docs/draft/ai-harness` 配下の関連ドキュメントも同時に更新する。

- [x] 1. git / GitHub 副作用の許可範囲を決める
- [x] 2. Manager / Generator / Evaluator の git 操作責務を確定する
- [x] 3. rules / hooks で機械的に制御する範囲を決める
- [x] 4. skill で外部化する知識・手順の範囲を決める
- [x] 5. ブランチ作成・リネーム・既存変更がある場合の扱いを決める
- [x] 6. GitHub issue / PR 作成など外部副作用時の確認ルールを決める
- [x] 7. PR 作成失敗・GitHub API 失敗時のリトライ / 停止条件を決める
- [x] 8. Planner / Generator / Evaluator Output の保存場所を決める
- [x] 9. `pass | needs-fix | blocked` の判定基準を定義する
- [x] 10. Planner Output の拘束力と Generator の裁量範囲を定義する
- [x] 11. 成果物テンプレートの確定内容を決める
- [x] 12. issue / PR テンプレートの確定内容を決める
- [x] 13. `.codex/agents/*.toml` の具体形式と記述粒度を決める
- [x] 14. 正式ドキュメントの最終配置を決める
- [x] 15. エージェント開発ワークフローを `AGENTS.md` に明文化する範囲を決める
- [x] 16. `docs/architecture/` と既存ドキュメントの責務分担を決める
- [x] 17. 未決定事項に遭遇した場合の記録・差し戻し方法を決める
- [x] 18. Evaluator が実行できる検証コマンドの基準を決める
- [x] 19. GitHub Sub-issues API 利用可否と失敗時の代替手順を確認する
- [x] 20. サブ issue / 親 issue の終了条件を決める
- [x] 21. 既存 `.github` / `.codex` との整合を確認する

## 決定事項

### 1. git / GitHub 副作用の許可範囲

- ブランチ名は基本的に `issue/{issue番号}` とする
- Generator は issue スコープ内の変更について commit できる
- Generator は push / PR 作成 / issue 作成 / issue コメントを行わない
- Evaluator は stage / commit / push / PR 作成 / issue 操作を行わない
- Manager は Evaluator Output の `Result` が `pass` の場合のみ push / PR 作成へ進める
- Manager は条件を満たした場合のみ issue コメント / サブ issue 作成を行える
- DELETE 系 GitHub 操作は禁止のまま維持する
- git の破壊的操作は原則禁止し、必要な場合は人間確認へフォールバックする

### 2. Manager / Generator / Evaluator の git 操作責務

#### 全エージェント共通

許可:

- `git status`
- `git diff`
- `git log`
- `git branch --show-current`
- 非破壊的な状態確認

禁止:

- `git add .`
- unrelated changes の stage / commit
- `git reset --hard`
- `git clean`
- 変更破棄を伴う `git checkout`
- merge commit の作成
- DELETE 系 GitHub 操作
- issue スコープ外の変更を commit すること

#### Manager

- `issue/{issue番号}` ブランチの作成・リネームを判断できる
- Evaluator Output が `pass` の場合のみ push / PR 作成できる
- PR 作成後に issue コメントできる
- 実装 commit は作らない

#### Generator

- 対象ファイルを明示して stage できる
- issue スコープ内の変更を意味単位で commit できる
- commit hash と内容を Generator Output に記録する
- push / PR 作成 / issue 操作は行わない

#### Evaluator

- commit 一覧と差分をレビューできる
- 非破壊的な検証コマンドを実行できる
- stage / commit / push / PR 作成 / issue 操作は行わない

### 3. rules / hooks で機械的に制御する範囲

- 正式ドキュメントは `docs/agent/rules/sandbox.md` と `docs/agent/rules/hooks.md` に配置する
- rules は文脈が不要で、常に禁止したいコマンドだけを制御する
- prompt は人間の介入が必須になるため使わない
- hooks は rules で表現しにくい引数順・文脈依存チェックに限定する
- rules ファイルは `.codex/rules/default.rules` に配置する

#### rules で forbidden にするもの

- 広範囲 stage
  - `git add .`
  - `git add -A`
  - `git add --all`
  - `git add -u`
  - `git add :/`
- 破壊的または履歴を複雑化する git 操作
  - `git reset --hard`
  - `git clean`
  - `git merge`
  - `git rebase`
  - `git checkout --`
- DELETE 系 GitHub 操作
  - `gh repo delete`
  - `gh issue delete`
  - `gh pr close`
  - `gh api --method DELETE`
- 再帰削除系の `rm`
  - `rm -rf`
  - `rm -fr`
  - `rm -r`
  - `rm -R`
  - `rm --recursive`
  - `rm -f -r`
  - `rm -r -f`

#### hooks で補完するもの

- `gh api` の method / endpoint 検査
- `git push` 前のブランチ名確認
- `git commit` 前の staged files 確認
- rules で拾いきれない削除系・広範囲 stage 表現
- hook 設定は `.codex/hooks.json` に配置する
- hook スクリプトは `.codex/hooks/pre_tool_use_policy.py` に配置する
- hooks は `PreToolUse` の `Bash` に限定する
- hooks の利用には Codex の `codex_hooks` feature flag を有効にする必要がある

### 4. skill で外部化する知識・手順の範囲

skill は、判断基準の正本ではなく、反復的な手順・コマンド例・成果物整形を呼び出すための補助知識として使う。
エージェントの責務、許可・禁止操作、PR 作成条件、判定基準などの運用ルールは正式ドキュメントと `AGENTS.md` に置く。
skill の内容は正式ドキュメントを参照し、正式ドキュメントと矛盾する独自ルールを持たせない。

#### skill に外部化するもの

- Manager の GitHub issue / PR 操作手順
- サブ issue 作成と GitHub Sub-issues API 呼び出し手順
- PR body / issue コメント body の組み立て手順
- Planner / Generator / Evaluator Output のテンプレート利用手順
- Generator の commit 前セルフチェック手順
- Evaluator のレビュー観点と検証コマンド選定の手順
- 各フェーズの機械的なチェック手順

#### skill に外部化しないもの

- Manager / Planner / Generator / Evaluator の責務定義
- git / GitHub 操作の許可・禁止ルール
- rules / hooks で機械的に制御する内容
- `pass | needs-fix | blocked` の判定基準
- issue / PR テンプレートの正本
- package 間の責務境界やアーキテクチャ正本

#### 配置方針

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
- skill には手順と参照先を置き、長い仕様本文は正式ドキュメントへリンクする
- `.codex/agents/*.toml` には、必要に応じて参照すべき skill 名だけを記載する

#### 更新方針

- 正式ドキュメントのルール変更時は、関連 skill の参照先・手順も同期する
- skill と正式ドキュメントが矛盾した場合は、正式ドキュメントを優先する
- skill 追加・変更時は、試験運用で実際に呼び出せるか確認する

### 5. ブランチ作成・リネーム・既存変更がある場合の扱い

Manager は、Planner 起動前と PR 作成前にブランチ名と作業ツリーを確認する。
ブランチ名は基本的に `issue/{issue番号}` とし、1 サイクルで扱う issue とブランチ番号を一致させる。
開発サイクル開始時の作業ツリーは clean 必須とする。

#### 作業開始時の確認

- `git branch --show-current` で現在ブランチを確認する
- `git status --short` で既存変更を確認する
- `git status --short` に出力がある場合は、開発サイクルを開始しない
- 現在ブランチが `issue/{issue番号}` の場合は、そのまま作業を続行できる
- 現在ブランチが別の `issue/*` の場合は、原則として作業を開始しない
- 現在ブランチが `main` などの基点ブランチで、作業ツリーが clean の場合は `issue/{issue番号}` ブランチを作成できる
- 現在ブランチに関わらず、作業ツリーに変更がある場合は、人間確認へフォールバックする

#### ブランチ作成

- Manager は作業開始前に `issue/{issue番号}` ブランチを作成できる
- 既に同名ブランチが存在する場合は、そのブランチを使うか人間確認へフォールバックする
- ブランチ作成は実装 commit ではないため、Manager が実行できる
- ブランチ作成前に、対象 issue とブランチ名を Manager Output または作業ログに記録する

#### ブランチリネーム

- Manager は現在ブランチが対象 issue の作業ブランチだと判断できる場合のみ、`issue/{issue番号}` 形式へリネームできる
- 作業ツリーが clean ではない場合は、リネームせず人間確認へフォールバックする
- 別 issue の作業ブランチを対象 issue のブランチへリネームしない
- リネーム前後のブランチ名を Manager Output または作業ログに記録する

#### 既存変更の扱い

- 既存変更がある場合、Manager は Planner を起動せず開発サイクルを開始しない
- 既存変更が対象 issue に属しているように見える場合でも、自動で作業対象に含めない
- 既存変更がある状態で Generator を起動しない
- 既存変更を自動で破棄しない
- 既存変更を自動で stash しない
- 既存変更を別ブランチへ自動移動しない
- untracked file も既存変更として扱う
- 既存変更をどう扱うかは、人間確認で決める

#### PR 作成前の確認

- Manager は PR 作成前に `git status --short` を確認する
- 未コミット変更や untracked file が残っている場合は、PR 作成へ進まない
- 残った変更が生成物やログの場合も、自動削除せず人間確認へフォールバックする
- ブランチ名が `issue/{issue番号}` 形式でない場合は、push / PR 作成へ進まない

### 6. GitHub issue / PR 作成など外部副作用時の確認ルール

外部副作用時の人間確認は必須にしない。
Manager は実行条件を満たした場合、追加の人間確認なしで GitHub issue / PR 作成、issue コメント、Sub-issues API 呼び出し、push を実行できる。
自動で開発サイクルを回すため、確認ではなく事前条件、実行ログ、失敗時の停止条件で制御する。

#### 確認なしで実行できる外部副作用

- `git push`
- `gh pr create`
- `gh issue create`
- `gh issue comment`
- `gh api --method POST`
- `gh api --method PATCH`

#### 実行条件

- 操作主体が Manager である
- 対象 issue が 1 つに確定している
- 対象リポジトリが `2-yudetama/article-freezer` である
- DELETE 系 GitHub 操作ではない
- 対象ブランチが `issue/{issue番号}` 形式である
- 既存変更がなく、作業ツリーの状態が操作条件を満たしている
- PR 作成時は Evaluator Output の `Result` が `pass` である
- サブ issue 作成時は Planner の `split-proposal` を Manager が採用している
- issue コメント時はコメント本文が作成済みで、対象 issue 番号が明確である
- `gh api` 利用時は method と endpoint が明確で、DELETE 系ではない

#### 記録ルール

- Manager は実行した外部副作用のコマンド種別、対象 issue / PR、結果 URL または番号を Manager Output または作業ログに記録する
- `gh issue create` 後は作成された issue 番号を記録する
- `gh pr create` 後は PR URL を記録する
- `gh issue comment` 後はコメント対象 issue とコメント概要を記録する
- `gh api` 後は対象 endpoint と結果概要を記録する

#### 人間確認へフォールバックする条件

- 実行条件を満たしているか判断できない
- 対象 repo / issue / branch が不明確
- DELETE 系 GitHub 操作が必要
- スコープ変更、受け入れ条件変更、データ破壊、権限変更に関わる判断が必要
- 外部副作用の失敗後に再実行してよいか判断できない

### 7. PR 作成失敗・GitHub API 失敗時のリトライ / 停止条件

外部副作用の失敗時は、コマンド種別ごとの固定ルールで扱う。
Manager が都度広い調査をしないように、成功したか曖昧な操作は原則として自動リトライしない。

#### 共通ルール

- リトライ回数はコマンド種別ごとの上限を超えない
- リトライ前に同じ外部副作用が既に反映されていないか、定義済みの軽量確認だけを行う
- 成功したか曖昧な作成・更新系操作は、重複を避けるため自動リトライしない
- 認証失敗、権限不足、対象 repo / issue / branch 不明、DELETE 系要求は即停止する
- リトライ、停止、確認結果は Manager Output または作業ログに記録する

#### `git push`

- 通信失敗など一時的失敗に見える場合は最大 2 回までリトライできる
- non-fast-forward、ブランチ保護、権限不足、remote / branch 不明の場合はリトライせず停止する
- リトライ前後に対象 remote / branch を記録する

#### `gh pr create`

- 失敗後に `gh pr list --head issue/{issue番号}` で既存 PR を確認する
- 既存 PR が見つかった場合は、その PR URL を記録して PR 作成済みとして扱う
- 既存 PR が見つからず、一時的失敗に見える場合は 1 回だけリトライできる
- base / head / repo / title / body が不明確な場合はリトライせず停止する

#### `gh issue create`

- 自動リトライしない
- レスポンス取得に失敗しても issue が作成済みの可能性があるため、重複作成を避けて停止する
- 停止時は、作成しようとした title と親 issue / milestone / label / assignee を記録する

#### `gh api --method POST`

- 自動リトライしない
- Sub-issues 紐づけなどは成功済みの可能性があるため、重複更新を避けて停止する
- 停止時は endpoint、method、主要 payload、確認すべき対象状態を記録する

#### `gh api --method PATCH`

- 自動リトライしない
- 更新済みの可能性があるため、対象状態を確認してから停止する
- 停止時は endpoint、method、主要 payload、確認結果を記録する

#### `gh issue comment`

- コメント作成有無を軽量に確認できる場合のみ 1 回リトライできる
- コメント作成済みの可能性を否定できない場合はリトライせず停止する
- 停止時は対象 issue とコメント概要を記録する

#### 停止後の扱い

- Manager は失敗した外部副作用、実行済みの前段操作、未実行の後続操作を記録する
- 途中まで作成された issue / PR / コメント / Sub-issues 紐づけは削除しない
- 後続フェーズへ進まず、人間確認へフォールバックする

### 8. Planner / Generator / Evaluator Output の保存場所

Planner / Generator / Evaluator Output の正本は GitHub issue コメントに保存する。
リポジトリ内にはエージェント成果物ログを作らない。

#### 保存先

- Planner Output は対象 issue のコメントに保存する
- Generator Output は対象 issue のコメントに保存する
- Evaluator Output は対象 issue のコメントに保存する
- Manager Log は必要な場合のみ対象 issue のコメントに保存する
- PR 作成結果は対象 issue のコメントに保存する
- サブ issue 分割時の `split-proposal` と分割結果は親 issue のコメントに保存する

#### コメント見出し

- `AI: Planner Output`
- `AI: Generator Output`
- `AI: Evaluator Output`
- `AI: Manager Log`
- `AI: PR Created`
- `AI: Split Proposal`
- `AI: Split Result`

修正ループがある場合は、コメント本文に `Loop: {番号}` を含める。

#### PR body との関係

- PR body には Generator Output と Evaluator Output の要約を含める
- 詳細な Output は対象 issue のコメントを正本とする
- PR body には必要に応じて対象 issue の AI コメントを参照する旨を含める

#### skill 化メモ

- Output コメント本文の整形手順は skill に切り出す
- `AI: Planner Output` / `AI: Generator Output` / `AI: Evaluator Output` の見出し付与を skill で扱う
- `gh issue comment` 投稿手順と失敗時の扱いは `.agents/skills/output-comment` と `.agents/skills/external-op-failure` の候補にする
- Output テンプレートから issue コメント本文へ変換する手順は `.agents/skills/output-comment` の候補にする

### 9. `pass | needs-fix | blocked` の判定基準

Evaluator Output の判定は `Result` として `pass | needs-fix | blocked` のいずれか 1 つを記録する。
スコープを満たしているかどうかは独立した判定ではなく、`Result` を決めるための確認項目の 1 つとして扱う。
Manager は Evaluator Output の `Result` が `pass` の場合のみ push / PR 作成へ進める。

#### `pass`

- issue の受け入れ条件を満たしている
- 変更が issue スコープ内に収まっている
- 必要な検証が通っている
- 修正必須の未解決事項が残っていない

#### `needs-fix`

`pass` に届いていないが、エージェントが自力で修正できる場合は `needs-fix` とする。
Generator に差し戻し、追加の実装・修正・検証で解消する。

例:

- 実装漏れがある
- 受け入れ条件の一部を満たしていない
- 型・lint・format・test・build などの検証が失敗している
- レビューで修正必須のバグが見つかった
- スコープ外変更があるが、エージェントが削る・分離する・実装を戻すことで解消できる
- スコープ内の設計や実装の修正が必要

#### `blocked`

`pass` に届いておらず、エージェントだけでは判断・解消できない場合は `blocked` とする。
後続フェーズへ進まず、人間確認へフォールバックする。

例:

- issue の要求や受け入れ条件が曖昧で、推測すると危険
- スコープ変更、受け入れ条件変更、別 issue 化の判断が必要
- 外部サービス、認証、権限、GitHub API 障害などで進めない
- データ破壊、セキュリティ、権限変更など人間判断が必要
- 既存変更との混在により、エージェントが安全に修正範囲を切り分けられない

#### Evaluator Output の確認項目

Evaluator Output では `Result` に加えて、少なくとも次の確認結果を記録する。

- 受け入れ条件
- スコープ
- 検証
- 未解決事項

### 10. Planner Output の拘束力と Generator の裁量範囲

Planner Output は、Generator が満たすべき実装契約として扱う。
Planner は変更対象ファイルや実装ステップを原則固定せず、要求、スコープ、スコープ外、受け入れ条件、検証計画、リスク・確認事項を整理する。

Generator は軽微調整許可型とする。
Planner の意図・受け入れ条件・スコープを変えない範囲で、実装上の細部は Generator が判断してよい。

#### Planner Output が拘束するもの

- issue の要求整理
- スコープ
- スコープ外
- 受け入れ条件
- 検証計画
- リスク・確認事項

#### Generator が裁量で判断できるもの

- 既存設計に合わせるための実装上の細部
- 変更対象ファイルの最終選定
- 関数・コンポーネント・モジュールの分割粒度
- 既存コードスタイルに合わせた命名や配置
- 受け入れ条件を満たすための局所的な実装順序
- 検証計画を満たすための追加の非破壊的確認

#### Generator が独断で変更してはいけないもの

- 受け入れ条件
- スコープ
- スコープ外
- issue の分割要否
- 外部副作用の方針
- DB スキーマ、API 契約、認証・認可、データ破壊に関わる判断

#### Manager に戻す条件

Generator は次の場合、独断で進めず Manager に戻す。

- 受け入れ条件を変える必要がある
- スコープ外の変更が必要になった
- Planner の前提とコード実態が矛盾している
- DB スキーマや API 契約など影響範囲が広がる
- セキュリティ・認可・データ破壊に関わる判断が必要
- 実装が想定より大きくなり、再分割が必要そう

#### Manager に戻した後の扱い

- Manager は状況を確認し、Planner に再計画を依頼するか、人間確認へフォールバックする
- 受け入れ条件やスコープの変更が必要な場合は、人間確認へフォールバックする
- 再分割が必要そうな場合は、Planner に `split-proposal` を依頼する

### 17. 未決定事項に遭遇した場合の記録・差し戻し方法

未決定事項は、通常の実装判断で解消できる不明点と、人間判断が必要な未決定事項に分けて扱う。
既存コード、既存ドキュメント、対象 issue から合理的に判断でき、受け入れ条件やスコープを変えないものは、各エージェントが判断して Output に根拠を記録できる。

#### 独断で決めない事項

- 受け入れ条件の変更
- スコープの変更
- issue の分割要否の変更
- セキュリティ、認証・認可、データ破壊に関わる判断
- DB スキーマ、API 契約、外部副作用に関わる判断
- 既存変更との混在により安全に切り分けられない判断

#### 記録先

- Planner が見つけた未決定事項は Planner Output の `リスク・確認事項` に記録する
- Generator が見つけた未決定事項は Generator Output の `未対応・懸念` に記録する
- Evaluator が見つけた未決定事項は Evaluator Output の `未解決事項` に記録し、必要に応じて `Result: blocked` とする
- Manager が人間確認へフォールバックする場合は、必ず対象 issue に `AI: Manager Log` コメントを残す

#### 差し戻し先

- 再計画で解消できる場合、Manager は Planner に戻す
- 実装修正で解消できる場合、Manager は Generator に戻す
- 検証観点の整理や代替検証で解消できる場合、Manager は Evaluator に戻す
- 人間の意思決定が必要な場合、Manager は `AI: Manager Log` を対象 issue にコメントし、後続フェーズへ進まない

#### Manager Log に含める内容

- 停止理由
- 人間確認が必要な質問
- 判断が必要な理由
- 選択肢
- 影響範囲
- 推奨案がある場合はその根拠

未決定事項を解消するために、親 issue や受け入れ条件を勝手に編集しない。

### 18. Evaluator が実行できる検証コマンドの基準

Evaluator は、実装結果を評価するために必要なローカル検証コマンドを原則として実行できる。
ローカル環境は検証のために使う前提とし、実行可能な検証コマンドを列挙して制限しない。

#### 制限するもの

- stage / commit / push / PR 作成 / issue 操作
- GitHub や外部サービスへの書き込み
- 本番環境、共有環境、リモート DB を対象にする操作
- issue スコープ外の状態変更を目的にした操作
- 検証目的ではない依存追加、設定変更、コード変更
- rules / hooks で禁止されている操作

#### 検証で変更が残った場合

- Evaluator は検証で作業ツリーに生成物や変更が残った場合、削除や巻き戻しを独断で行わない
- 残った変更、発生理由、影響範囲を Evaluator Output に記録する
- Manager は残った変更の扱いを判断し、必要に応じて人間確認へフォールバックする

#### 記録ルール

- Evaluator は実行した検証コマンド、結果、失敗、未実行理由を Evaluator Output に記録する
- 高コストまたは長時間の検証を実行した場合は、その目的と結果を記録する

### 19. GitHub Sub-issues API 利用可否と失敗時の代替手順

GitHub Sub-issues API は利用する。
親子関係の正本は GitHub Sub-issues とし、Manager はサブ issue 作成後に REST issue id を取得して親 issue に紐づける。

#### 利用方針

- 親 issue への紐づけには `POST /repos/{owner}/{repo}/issues/{issue_number}/sub_issues` を使う
- `sub_issue_id` には issue 番号ではなく REST issue id を渡す
- REST issue id は `gh api repos/{owner}/{repo}/issues/{issue_number} --jq '.id'` で取得する
- Sub-issues API の成功時は `Split Result` に作成したサブ issue と紐づけ結果を記録する

#### 失敗時の扱い

- Sub-issues API の失敗後に自動リトライしない
- 作成済みの issue は削除しない
- 途中まで作成された issue、コメント、Sub-issues 紐づけは削除しない
- Manager は対象 issue に `AI: Manager Log` を残し、紐づけ失敗理由と手動確認事項を記録する
- `Split Result` には Sub-issues API の紐づけに失敗したことを明記する

#### 代替手順

- 親 issue コメントにサブ issue 一覧、推奨対応順、手動で Sub-issues 紐づけが必要なことを残す
- サブ issue 側の本文またはコメントにも親 issue 番号を記録する
- Sub-issues API による親子関係が作れなかった場合でも、コメント上のリンクで追跡可能なら分割自体は成立扱いにする

### 20. サブ issue / 親 issue の終了条件

- サブ issue は対応 PR の closing keyword で close する
- 親 issue は、最後のサブ issue の PR body に closing keyword として含める
- 最後のサブ issue 以外の PR body には親 issue の closing keyword を含めない
- 最後のサブ issue か判断できない場合、親 issue は close 対象に含めない
- close 対象の記載形式は PR テンプレートに従う

### 21. 既存 `.github` / `.codex` との整合確認

既存の `.github` / `.codex` は、ドラフトで決めた配置方針と大きく矛盾しない。
ただし、正式ドキュメントと skill は未整備のものが残っているため、後続の正式移行フェーズで作成・同期する。

#### `.github`

- `.github/ISSUE_TEMPLATE/task.md` は、決定済みの issue テンプレート構成と一致している
- `.github/PULL_REQUEST_TEMPLATE/task.md` は、決定済みの PR テンプレート構成と一致している
- `.github/workflows/sub-issue-sync.yml` は、Sub-issues の親 issue から label / milestone / assignee を同期する補助として存在する
- PR テンプレートの closing keyword 運用は、最後のサブ issue PR に親 issue を含める方針と整合する

#### `.codex`

- `.codex/config.toml` は `approval_policy = "never"`、`sandbox_mode = "workspace-write"`、`multi_agent = true`、`codex_hooks = true`、`max_threads = 1`、`max_depth = 1` で、決定済み方針と一致している
- `.codex/agents/planner.toml`、`.codex/agents/generator.toml`、`.codex/agents/evaluator.toml` は存在し、各 role の `docs/agent/roles/*.md` を参照する構成になっている
- `.codex/rules/default.rules` は、広範囲 stage、破壊的 git 操作、DELETE 系 GitHub 操作、再帰削除系 `rm` の禁止方針と一致している
- `.codex/hooks.json` と `.codex/hooks/pre_tool_use_policy.py` は、`PreToolUse` の `Bash` hook として、`gh api DELETE`、`git push` のブランチ名、空 stage commit、広範囲 stage、再帰削除、`git checkout --` を補完している

#### 後続整備が必要なもの

- `docs/agent/AGENTS.md` は読み順と正本の扱いを集約するため、正式移行時に更新が必要
- `docs/agent/workflow.md` が未作成
- `docs/agent/roles/manager.md` が未作成
- `docs/agent/roles/planner.md`、`docs/agent/roles/generator.md`、`docs/agent/roles/evaluator.md` はプレースホルダーのため、正式なロール定義へ更新が必要
- `.agents/skills/*` が未作成
- `docs/agent` 配下に残る前提知識が必要な呼称は、正式移行時に `エージェント開発ワークフロー` へ寄せる

### 11. 成果物テンプレートの確定内容

成果物テンプレートは、AI エージェントの Output と Manager 系コメントを対象にする。
issue / PR テンプレートは別項目で扱う。

#### 共通方針

- Planner / Generator / Evaluator Output の正本は GitHub issue コメントに保存する
- コメント見出しは `AI: Planner Output` / `AI: Generator Output` / `AI: Evaluator Output` の形式にする
- 修正ループがある場合は、コメント本文に `Loop: {番号}` を含める
- Output は各エージェント自身の作業結果・判断・観測結果に限定する
- Output には他エージェントの行動に干渉する指示を書かない

#### 確定するテンプレート

- Planner Output
  - `implementation-plan`
  - `split-proposal`
- Generator Output
- Evaluator Output
- Manager Log
- PR Created
- Split Proposal
- Split Result

#### Planner Output

Planner は issue 分析後、必ず `implementation-plan` または `split-proposal` のどちらかを出力する。

```md
# Planner Output

## Type

implementation-plan | split-proposal
```

`implementation-plan` は次の構成にする。

```md
## 対象 issue

## 要求整理

## スコープ

## スコープ外

## 受け入れ条件

## 検証計画

## リスク・確認事項
```

`split-proposal` は次の構成にする。

```md
## 対象 issue

## 分割が必要な理由

## 分割方針

## サブ issue 案

### 1. {タイトル}

#### 概要

#### スコープ

#### スコープ外

#### 受け入れ条件

#### 検証観点

## 推奨対応順

## 親 issue へのコメント案
```

#### Generator Output

```md
# Generator Output

Loop: {番号}

## 対象 issue

## 実装概要

## 変更内容

## 受け入れ条件への対応

## Commit 一覧

## 実行した検証

## 未対応・懸念
```

#### Evaluator Output

```md
# Evaluator Output

Loop: {番号}

## 対象 issue

## Result

pass | needs-fix | blocked

## 受け入れ条件

## スコープ

## 検証

## 発見した問題

### 修正必須

### 任意改善

## 未解決事項
```

#### Manager Log

Manager Log は必要な場合のみ対象 issue のコメントに保存する。

```md
# Manager Log

## 対象 issue

## 実行した操作

## 結果

## 停止理由・人間確認事項
```

#### PR Created

```md
# PR Created

## 対象 issue

## PR

## 概要
```

#### Split Result

```md
# Split Result

## 親 issue

## 分割理由

## 分割方針

## 作成したサブ issue

## 推奨対応順

## 親 issue の扱い
```

### 12. issue / PR テンプレートの確定内容

issue テンプレートは、人間が Planner の作業を先取りしすぎないように、依頼の背景とゴールを簡潔に記録する構成にする。
スコープ、スコープ外、受け入れ条件、検証観点の精緻化は Planner Output で扱う。

#### issue テンプレート

配置先は `.github/ISSUE_TEMPLATE/task.md` とする。

```md
## 概要

## 背景・理由

## ゴール

## 補足
```

#### PR テンプレート

PR body は Generator Output / Evaluator Output から作れる構成にする。
`AIサマリ` には Generator / Evaluator の Output をそれぞれ折り畳みセクションで記載する。
配置先は `.github/PULL_REQUEST_TEMPLATE/task.md` とする。

```md
Closes #

## 概要

## 変更内容

## 受け入れ条件への対応

## 検証

## 未解決事項

## AIサマリ

<details>
<summary>Generator Output</summary>

</details>

<details>
<summary>Evaluator Output</summary>

</details>
```

### 13. `.codex/agents/*.toml` の具体形式と記述粒度

`.codex/config.toml` で custom agent と hooks を有効化し、サブエージェントの並列起動と再委譲を抑制する。

```toml
#:schema https://developers.openai.com/codex/config-schema.json

approval_policy = "never"
sandbox_mode = "workspace-write"

[features]
multi_agent = true
codex_hooks = true

[agents]
max_threads = 1
max_depth = 1
```

custom agent は `.codex/agents/*.toml` に配置し、公式形式に合わせて `name`、`description`、`developer_instructions` を持たせる。
`developer_instructions` にはロール定義本文を直接書かず、`docs/agent/roles/*.md` を読む短い指示だけを書く。
これにより、ロール定義本文を Codex 固有の TOML から分離し、他の AI エージェントからも参照しやすくする。

ロール定義の配置:

- `docs/agent/roles/planner.md`
- `docs/agent/roles/generator.md`
- `docs/agent/roles/evaluator.md`

sandbox / approval 方針:

- Manager はメインセッションとして `approval_policy = "never"`、`sandbox_mode = "workspace-write"` で動く
- Planner は計画専任のため `approval_policy = "never"`、`sandbox_mode = "read-only"` とする
- Generator は実装と commit を担うため `approval_policy = "never"`、`sandbox_mode = "workspace-write"` とする
- Evaluator は検証コマンドがキャッシュや生成物を書く可能性があるため `approval_policy = "never"`、`sandbox_mode = "workspace-write"` とする
- GitHub DELETE 系操作、Generator の push / PR / issue 操作、Evaluator の stage / commit / push / PR / issue 操作は rules / hooks で制御する

### 14. 正式ドキュメントの最終配置

正式ドキュメントは `docs/ai-harness/` には置かず、AI 実行時の参照性を優先して `docs/agent/` に集約する。
Output 仕様と git / GitHub 操作ルールは独立ファイルにせず、ワークフロー上の分岐条件として `docs/agent/workflow.md` に統合する。
具体的なコマンド例、本文整形、投稿手順は `.agents/skills/*` に外部化する。

#### `docs/agent/`

```txt
docs/agent/
  AGENTS.md
  workflow.md
  roles/
    manager.md
    planner.md
    generator.md
    evaluator.md
  rules/
    README.md
    sandbox.md
    hooks.md
```

#### `.agents/skills/`

skill は role 単位ではなく、ワークフロー上の手順単位で分ける。

```txt
.agents/skills/
  start-workflow/
    SKILL.md
  issue-planning/
    SKILL.md
  plan-review/
    SKILL.md
  issue-splitting/
    SKILL.md
  impl-commit/
    SKILL.md
  impl-evaluation/
    SKILL.md
  fix-decision/
    SKILL.md
  output-comment/
    SKILL.md
  pr-finalization/
    SKILL.md
  external-op-failure/
    SKILL.md
```

#### `.codex/`

```txt
.codex/
  agents/
    planner.toml
    generator.toml
    evaluator.toml
  rules/
    default.rules
  hooks.json
  hooks/
    pre_tool_use_policy.py
```

`.codex/` は実際の custom agents / rules / hooks 設定を置く。
仕様や意図は `docs/agent/` 側に置く。

### 15. エージェント開発ワークフローを `AGENTS.md` に明文化する範囲

ルート `AGENTS.md` は通常の単発作業でも常に参照されるため、エージェント開発ワークフローの具体的な運用ルールは明文化しない。
エージェント開発ワークフローの正本は `docs/agent` に置き、ワークフロー起動時に skill から必要な参照を注入する。

- ルート `AGENTS.md` には、エージェント開発ワークフローの具体的な運用ルールを明文化しない
- エージェント開発ワークフローの正本は `docs/agent` に置く
- 通常の単発作業ではエージェント開発ワークフローを前提にしない
- エージェント開発ワークフロー起動時は skill から `docs/agent` の参照を注入する
- ルート `AGENTS.md` には Documentation Rules として `docs/agent` と `docs/architecture` の責務だけを追記する

### 16. `docs/architecture/` と既存ドキュメントの責務分担

`docs/architecture/` はエージェント開発ワークフロー固有ではなく、実装判断で参照するアーキテクチャ正本として扱う。
機能仕様は `docs/features/`、package 固有の作業ルールは `packages/*/AGENTS.md` に残す。

```txt
docs/architecture/
  AGENTS.md
  data-flow.md
  auth.md
  er.md
```

- `AGENTS.md`: 入口、読み順、package 責務概要、他 docs との責務分担
- `data-flow.md`: package 間をまたぐ主要データフロー
- `auth.md`: 認証・認可の横断設計
- `er.md`: DB / ドメインデータ構造の ER 図

既存の `docs/er.md` は後続作業で `docs/architecture/er.md` へ移動する。
