# エージェント開発ワークフロー構築計画

## 目的

`docs/draft/ai-harness` で整理したドラフトをもとに、Codex Subagents を使って issue 単位の開発作業を進めるためのワークフローを構築する作業計画を定義する。

このドキュメントは、正式ドキュメントや設定ファイルへの移行そのものではなく、移行に必要な作業・順序・成果物を整理するための計画書。

**各フェーズの「実装・議論メモ」を解決するまでは、ユーザと対話形式で計画を立てること**

## 前提

- 1 サイクルで扱うタスクは 1 issue のみ
- issue と PR は 1 対 1 で紐づける
- Manager はメインの Codex セッションとして動く
- Planner / Generator / Evaluator は Codex custom agents として定義する
- Manager はワークフロー管理と最終意思決定を担う
- DELETE 系 GitHub 操作は禁止のまま維持する
- git の破壊的操作は原則禁止し、必要な場合は人間確認へフォールバックする
- 複数のサブエージェントは並列起動しない

詳細な git / GitHub 操作責務、rules / hooks、成果物は各フェーズと後述の成果物一覧で扱う。

## フェーズ

### 1. 正式ドキュメント整備

ドラフトを実運用向けの正式ドキュメントへ再構成する。

正式配置:

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

作業:

- ドラフトから正式ドキュメントへ内容を移す
- ドキュメントの読み順を整理する
- ドラフト特有の「候補」「未整理」表現を整理する
- `docs/agent/AGENTS.md` に読み順と正本の扱いを集約する
- Output 仕様と git / GitHub 操作ルールは `workflow.md` に仮統合する
- ロール別責務は `roles/*.md` に分割する
- 具体手順・コマンド例・本文整形として外部化すべき境界を洗い出す

成果物:

- `docs/agent/AGENTS.md`
- `docs/agent/workflow.md`
- `docs/agent/roles/manager.md`
- `docs/agent/roles/planner.md`
- `docs/agent/roles/generator.md`
- `docs/agent/roles/evaluator.md`

実装・議論メモ:

- フェーズ1の `workflow.md` と `roles/*.md` は、後続フェーズが参照できる正本の骨格を作ることを目的とする
- フェーズ1では具体コマンド、Output 本文テンプレートの利用手順、issue コメントや PR body の整形手順までは確定しない
- 具体手順はフェーズ2の skill 設計・最小実装とフェーズ6の運用コマンド整備で扱い、必要に応じて `workflow.md` と `roles/*.md` へ不足を戻す
- `docs/agent/roles/*.md` は custom agent が直接参照するため、プレースホルダのままでは試験運用できない
- `workflow.md` に集約する情報量が大きいため、この時点では skill 作成に必要な章立てとルール境界までを決める
- Manager ロールは custom agent 化しないが、正式ドキュメント上の責務定義は必要
- `docs/agent/README.md` は現時点では作成せず、読み順・責務分担は `docs/agent/AGENTS.md` に集約する

### 2. skill 設計・最小実装

ワークフローを机上で確定しすぎないため、早い段階で skill の最小構成を作り、正式ドキュメントとの責務境界を検証する。

作業:

- skill に外部化する手順と、正式ドキュメントに残す判断基準を対応づける
- `.agents/skills/` の基本構成を作る
- 各 skill の `SKILL.md` に、参照すべき正式ドキュメント、入力、出力、実行手順の粒度を定義する
- Manager / Planner / Generator / Evaluator のどのフェーズでどの skill を使うか整理する
- skill から逆算して `workflow.md`、`roles/*.md`、Output テンプレートに不足する項目を洗い出す

成果物:

- `docs/draft/.agents/skills/start-workflow/SKILL.md`
- `docs/draft/.agents/skills/issue-planning/SKILL.md`
- `docs/draft/.agents/skills/plan-review/SKILL.md`
- `docs/draft/.agents/skills/issue-splitting/SKILL.md`
- `docs/draft/.agents/skills/impl-commit/SKILL.md`
- `docs/draft/.agents/skills/impl-evaluation/SKILL.md`
- `docs/draft/.agents/skills/fix-decision/SKILL.md`
- `docs/draft/.agents/skills/output-comment/SKILL.md`
- `docs/draft/.agents/skills/pr-finalization/SKILL.md`
- `docs/draft/.agents/skills/external-op-failure/SKILL.md`
- skill から見えた正式ドキュメント修正メモ

実装・議論メモ:

- skill を先に一度形にしないと、`workflow.md` が抽象ルールだけで肥大化しやすい
- 最小実装ではコマンドを網羅せず、各 skill がどの判断をしないかを明確にする
- skill の本文にルール正本を重複させず、正式ドキュメントへの参照と手順に寄せる必要がある
- このフェーズの結果を受けて、フェーズ3以降で正式ドキュメントを調整する
- sandbox ルール上、実際の `.agents/skills` ではなく `docs/draft/.agents/skills` にドラフトとして作成する
- GitHub 操作の具体コマンド、Sub-issues API の endpoint / payload、PR body や issue コメント本文の詳細な組み立て、外部副作用失敗時の細かい再試行手順はフェーズ6で具体化する
- role docs はロールの責務、禁止事項、判断範囲を扱い、skill はワークフロー上の具体手順を扱う
- Generator Output / Evaluator Output は修正ループごとに新しい issue コメントとして再投稿し、本文に `Loop: {番号}` を含める

### 3. エージェント開発ワークフロー運用ルール整備

エージェント開発ワークフローの運用に合わせて、リポジトリで明文化すべき運用ルールを整理する。

作業:

- Generator が issue スコープ内の変更を commit できることを明記する
- Manager が条件付きで push / PR 作成できることを明記する
- Evaluator は stage / commit / push / PR 作成 / issue 操作を行わないことを明記する
- ブランチ名は基本的に `issue/{issue番号}` とすることを維持する
- サブエージェント並列起動制限を明記する
- DELETE 系 GitHub 操作は禁止のまま維持する

成果物:

- `AGENTS.md`

実装・議論メモ:

- ルート `AGENTS.md` は通常の単発作業にも効くため、エージェント開発ワークフロー専用ルールを書きすぎると通常作業の制約が過剰になる
- Generator の commit 許可と、通常 Codex 作業での commit 方針をどう切り分けるか明記する必要がある
- サブエージェント並列起動禁止は Codex 設定だけでなく、Manager の運用ルールとしても明文化する必要がある
- `issue/{issue番号}` 以外の既存ブランチで作業している場合の例外扱いを決める必要がある

### 4. アーキテクチャ知識整備

Manager / Planner / Generator / Evaluator が判断に使うアーキテクチャ情報を整備する。

現状、ルートや package ごとの `AGENTS.md` に基本情報はあるが、package 間の責務境界や横断的なデータフローを参照できる正本が不足している。

作業:

- 全体アーキテクチャの入口を作る
- package 間の責務概要を整理する
- package 間の横断データフローを整理する
- 認証・認可の横断設計を整理する
- 既存の `docs/er.md` を `docs/architecture/er.md` へ移動する
- AI が機能調査時にどのドキュメント・ファイルを起点に見るべきか整理する
- 未決定事項に遭遇した場合の扱いを整理する

正式配置:

```txt
docs/architecture/
  AGENTS.md
  data-flow.md
  auth.md
  er.md
```

成果物:

- `docs/architecture/AGENTS.md`
- `docs/architecture/data-flow.md`
- `docs/architecture/auth.md`
- `docs/architecture/er.md`

実装・議論メモ:

- 現状 `AGENTS.md` は `docs/architecture` を参照しているが、実体がないため先に最低限の入口を作る必要がある
- `docs/er.md` の移動はリンク切れを起こしやすいため、参照元の確認と更新が必要
- 認証・認可が未実装または未確定の場合、`auth.md` には現状・未決定・判断禁止範囲を分けて書く必要がある
- Planner が調査を始める起点として、package ごとの `AGENTS.md`、`docs/features`、主要コードパスの対応表が必要

### 5. Codex custom agents 作成

Planner / Generator / Evaluator の custom agents を作成する。

作業:

- `.codex/agents/` を作成する
- Planner agent を定義する
- Generator agent を定義する
- Evaluator agent を定義する
- 各 agent の description / instructions を最小限に保つ
- 詳細ルールは正式ドキュメントを参照させる

成果物:

- `.codex/agents/planner.toml`
- `.codex/agents/generator.toml`
- `.codex/agents/evaluator.toml`

実装・議論メモ:

- agent TOML は既に配置済みだが、参照先の role docs が未整備のため現時点では実運用に不足する
- agent の `developer_instructions` に skill 名まで書くか、role docs から skill を参照させるか決める必要がある
- Planner を `read-only` にする方針は妥当だが、調査中にローカル生成物が必要になるケースを許容しない前提でよいか確認する必要がある
- Generator に commit を許可する場合、commit message 形式と staged files 確認をどこまで機械的に検査するか追加検討が必要

### 6. 運用コマンド整備

Manager が使う git / GitHub 操作の手順を整備する。

作業:

- rules / hooks で制御する git / GitHub 操作を整理する
- skill に外部化する知識・手順を整理する
- サブ issue 作成コマンドを正式化する
- Sub-issues API 呼び出し手順を正式化する
- commit / push / PR 作成コマンドを正式化する
- PR 作成結果を issue にコメントする手順を正式化する
- 失敗時の停止条件を整理する

成果物:

- `docs/agent/workflow.md`
- 更新された `.agents/skills/*/SKILL.md`

実装・議論メモ:

- フェーズ2で作った skill を実運用コマンド向けに具体化し、正式ドキュメントとの差分を解消する
- GitHub Sub-issues API は `gh api` 前提のため、権限不足・API 仕様変更・プレビュー扱いの場合の停止条件を明確にする必要がある
- hooks は guardrail でありロール判定はできないため、Generator / Evaluator の禁止操作はドキュメント運用とレビューで補完する前提を明記する必要がある
- `git push` や `gh pr create` の失敗時に残る外部状態を、Manager Log と issue コメントのどちらへ記録するか整理する必要がある
- 一時ファイルを `/tmp` に置く場合、ファイル名衝突や再実行時の扱いを skill 側で決める必要がある

### 7. hooks 整備

試験運用前に、品質確認と自動整形を支える hooks を整備する。

作業:

- コード書き込み後に formatter による自動フォーマットを実行する hook を検討・実装する
- commit 前に Lint チェックと型チェックを実行する hook を検討・実装する
- commit 前 hook は将来的にテストも実行できる構成にする
- push 前に Lint チェック、型チェック、knip による未使用コード検出を実行する hook を検討・実装する
- push 前 hook は将来的にテストも実行できる構成にする
- hooks の対象コマンド、失敗時の停止条件、実行コストを整理する

成果物:

- `.codex/hooks.json`
- `.codex/hooks/pre_tool_use_policy.py`
- `docs/agent/rules/hooks.md`
- hooks 試験結果メモ

実装・議論メモ:

- formatter はコード書き込み後に自動適用するが、意図しない広範囲変更を避けるため対象範囲の決め方が必要
- commit 前と push 前で同じ検証を重複実行するため、速度と確実性のバランスを決める必要がある
- push 前の knip はコストが高い可能性があるため、実行条件や失敗時の扱いを試験運用前に確認する
- 将来テストを追加する前提で、hook の構成はチェック項目を増やしやすくしておく

### 8. 試験運用

小さい issue でエージェント開発ワークフローを試験運用し、ドキュメントと agent 定義を調整する。

作業:

- 1 つの小さい issue を対象にする
- Manager が Planner を起動する
- Planner Output を確認する
- Generator が実装と commit を行う
- Evaluator がレビューと検証を行う
- Manager が push / PR 作成まで進める
- 試験運用で見つかった不足をドキュメントへ反映する

成果物:

- 試験運用結果メモ
- 修正後の正式ドキュメント
- 修正後の `.codex/agents/*.toml`

実装・議論メモ:

- 試験運用に使う issue は、コード変更よりもドキュメント変更など副作用が小さいものを選ぶ必要がある
- 既存の issue / PR テンプレートが Planner Output や PR body 作成に十分か確認し、必要なら調整する
- 試験運用前に、作業ツリー clean、`gh auth status`、対象 repo、ブランチ名、hooks 有効化を確認するチェックリストが必要
- 初回試験では push / PR 作成まで進めるか、ローカルの Planner -> Generator -> Evaluator までで止めるか決める必要がある
- 試験運用で見つかった不足の記録先を、issue コメント、PR コメント、または docs のどこにするか決める必要がある

## 完了済み成果物

- `.github/ISSUE_TEMPLATE/task.md`
- `.github/PULL_REQUEST_TEMPLATE/task.md`

## 成果物一覧

- `docs/agent/AGENTS.md`
- `docs/agent/workflow.md`
- `docs/agent/roles/manager.md`
- `docs/agent/roles/planner.md`
- `docs/agent/roles/generator.md`
- `docs/agent/roles/evaluator.md`
- `docs/architecture/AGENTS.md`
- `docs/architecture/data-flow.md`
- `docs/architecture/auth.md`
- `docs/architecture/er.md`
- `AGENTS.md`
- `.codex/hooks.json`
- `.codex/hooks/pre_tool_use_policy.py`
- `.codex/agents/planner.toml`
- `.codex/agents/generator.toml`
- `.codex/agents/evaluator.toml`
- `.agents/skills/start-workflow/SKILL.md`
- `.agents/skills/issue-planning/SKILL.md`
- `.agents/skills/plan-review/SKILL.md`
- `.agents/skills/issue-splitting/SKILL.md`
- `.agents/skills/impl-commit/SKILL.md`
- `.agents/skills/impl-evaluation/SKILL.md`
- `.agents/skills/fix-decision/SKILL.md`
- `.agents/skills/output-comment/SKILL.md`
- `.agents/skills/pr-finalization/SKILL.md`
- `.agents/skills/external-op-failure/SKILL.md`

## 未決事項

- 正式ドキュメント
  - 上位ルール変更の具体文面
  - 各フェーズの開始条件・完了条件
  - `pass | needs-fix | blocked` の判定基準
  - Planner Output の採用基準
  - `implementation-plan` / `split-proposal` の品質基準
  - スコープ確認、修正必須、任意改善の分類基準
- 成果物
  - Manager Log と GitHub issue コメントの責務分担
  - Generator Output / Evaluator Output の更新ルール
- agent / skill
  - `.codex/agents/*.toml` の具体 instructions
  - role docs と skill のどちらに具体手順への参照を書くか
  - hooks / skills / logs をどのフェーズで使うか
  - hooks / rules が止められないロール違反をどう検出するか
  - skill の最小実装で扱う範囲と、運用コマンド整備まで遅らせる範囲
- hooks
  - コード書き込み後 formatter の対象範囲
  - commit 前 hook と push 前 hook の検証項目の重複許容範囲
  - hook 失敗時に自動修正する範囲と停止する範囲
  - 将来テストを追加するときの実行タイミング
- 運用
  - 試験運用に使う最初の issue
  - 初回試験運用で外部副作用をどこまで実行するか
  - マイルストーン内の次 issue 選定方法
  - 一時ファイルの命名、配置、後片付けの運用
- アーキテクチャ
  - アーキテクチャ上の未決定事項の扱い
  - Planner が読むべき関連ドキュメントや既存コードの探索範囲

## 未検討事項

- 各エージェントの行動時のログ管理方法
- エージェントが詰まった箇所や判断に迷った箇所を記録する方法
- 記録したログをもとにワークフローを自動改善する仕組み
- Sub-issues API が使えない環境での継続運用方法

## skill 外部化方針

skill は、正式ドキュメントに定義されたルールを実行しやすくするための補助手順として使う。
エージェントの責務、git / GitHub 操作の許可・禁止、判定基準、テンプレートの正本は正式ドキュメントと `AGENTS.md` に残す。

外部化対象:

- Manager の GitHub issue / PR 操作手順
- サブ issue 作成と GitHub Sub-issues API 呼び出し手順
- PR body / issue コメント body の組み立て手順
- Planner / Generator / Evaluator Output のテンプレート利用手順
- Generator の commit 前セルフチェック手順
- Evaluator のレビュー観点と検証コマンド選定の手順
- 各フェーズの機械的なチェック手順

外部化しない対象:

- Manager / Planner / Generator / Evaluator の責務定義
- git / GitHub 操作の許可・禁止ルール
- rules / hooks で機械的に制御する内容
- `pass | needs-fix | blocked` の判定基準
- issue / PR テンプレートの正本
- package 間の責務境界やアーキテクチャ正本

配置候補:

```txt
.agents/
  skills/
    start-workflow/
    issue-planning/
    plan-review/
    issue-splitting/
    impl-commit/
    impl-evaluation/
    fix-decision/
    output-comment/
    pr-finalization/
    external-op-failure/
```

skill は role 単位ではなく、ワークフロー上の手順単位で分ける。
各 skill の具体責務は、作成時に上記の外部化対象へ対応づける。
`.codex/agents/*.toml` には、必要に応じて参照すべき skill 名だけを記載する。
skill と正式ドキュメントが矛盾した場合は、正式ドキュメントを優先する。

## エージェント成果物保存方針

Planner / Generator / Evaluator Output の正本は GitHub issue コメントに保存する。
リポジトリ内にはエージェント成果物ログを作らない。
ローカル一時ファイルは必須にせず、Manager が必要な場合だけ使う。

コメント見出し:

- `AI: Planner Output`
- `AI: Generator Output`
- `AI: Evaluator Output`
- `AI: Manager Log`
- `AI: PR Created`
- `AI: Split Proposal`
- `AI: Split Result`

修正ループがある場合は、コメント本文に `Loop: {番号}` を含める。
PR body には Generator Output と Evaluator Output の要約を含め、詳細な Output は対象 issue のコメントを正本とする。

## 完了条件

- 正式ドキュメントからエージェント開発ワークフロー全体の運用手順を追える
- `AGENTS.md` にエージェント開発ワークフロー運用時の commit / push / PR 作成ルールが反映されている
- アーキテクチャ知識の正本を参照できる
- 人間・AI 共通の issue / PR テンプレートがある
- Planner / Generator / Evaluator の custom agents が配置されている
- 小さい issue で Planner -> Generator -> Evaluator -> Manager の一連の流れを試験運用できる
- 試験運用で見つかった不足が正式ドキュメントへ反映されている
