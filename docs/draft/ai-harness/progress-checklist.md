# エージェント開発ワークフロー進捗チェックリスト

このファイルは `docs/draft/ai-harness/implementation-plan.md` を対話形式で進めるための進捗管理用チェックリスト。

各作業で判断を確定した場合は、このファイルだけでなく、影響するドラフトまたは正式ドキュメントも同期して更新する。

## 進め方

- まず、`docs/draft/ai-harness`内を一通り確認し、関連ドキュメントを把握する
- **各フェーズの「実装・議論メモ」を解決するまでは、ユーザと対話形式で計画を立てる**
- 1 回の対話では原則 1 つのフェーズ、または 1 つの未決事項だけを扱う
- 着手前に対象フェーズ、成果物、確認したい論点を明示する
- 完了時に更新したファイル、残った論点、次の候補を記録する
- コードや設定を変更した場合は、実行した確認コマンドを記録する
- 判断が保留になった場合は、未決事項として残し、無理に次フェーズへ進めない

## フェーズ進捗

- [x] 1. 正式ドキュメント整備
- [x] 2. skill 設計・最小実装
- [x] 3. エージェント開発ワークフロー運用ルール整備
- [x] 4. アーキテクチャ知識整備
- [x] 5. Codex custom agents 作成
- [x] 6. 運用コマンド整備
- [x] 7. hooks 整備
- [ ] 8. 試験運用

## 成果物進捗

### docs/agent

- [x] `docs/agent/AGENTS.md`
- [x] `docs/agent/workflow.md`
- [x] `docs/agent/roles/manager.md`
- [x] `docs/agent/roles/planner.md`
- [x] `docs/agent/roles/generator.md`
- [x] `docs/agent/roles/evaluator.md`
- [x] `docs/agent/rules/sandbox.md`
- [x] `docs/agent/rules/hooks.md`

### docs/architecture

- [x] `docs/architecture/AGENTS.md`
- [x] `docs/architecture/data-flow.md`
- [x] `docs/architecture/auth.md`
- [x] `docs/architecture/er.md`

### AGENTS / Codex 設定

- [x] `AGENTS.md`
- [x] `.codex/agents/planner.toml`
- [x] `.codex/agents/generator.toml`
- [x] `.codex/agents/evaluator.toml`
- [x] `.codex/hooks.json`
- [x] `.codex/hooks/pre_tool_use_policy.py`
- [x] `.codex/hooks/format_after_write.py`
- [x] `.codex/rules/default.rules`

### skills

- [x] `.agents/skills/start-workflow/SKILL.md`
- [x] `.agents/skills/issue-planning/SKILL.md`
- [x] `.agents/skills/plan-review/SKILL.md`
- [x] `.agents/skills/issue-splitting/SKILL.md`
- [x] `.agents/skills/impl-commit/SKILL.md`
- [x] `.agents/skills/impl-evaluation/SKILL.md`
- [x] `.agents/skills/fix-decision/SKILL.md`
- [x] `.agents/skills/output-comment/SKILL.md`
- [x] `.agents/skills/pr-finalization/SKILL.md`
- [x] `.agents/skills/external-op-failure/SKILL.md`

### skills draft

- [x] `docs/draft/.agents/skills/start-workflow/SKILL.md`
- [x] `docs/draft/.agents/skills/start-workflow/agents/openai.yaml`
- [x] `docs/draft/.agents/skills/issue-planning/SKILL.md`
- [x] `docs/draft/.agents/skills/issue-planning/agents/openai.yaml`
- [x] `docs/draft/.agents/skills/plan-review/SKILL.md`
- [x] `docs/draft/.agents/skills/plan-review/agents/openai.yaml`
- [x] `docs/draft/.agents/skills/issue-splitting/SKILL.md`
- [x] `docs/draft/.agents/skills/issue-splitting/agents/openai.yaml`
- [x] `docs/draft/.agents/skills/impl-commit/SKILL.md`
- [x] `docs/draft/.agents/skills/impl-commit/agents/openai.yaml`
- [x] `docs/draft/.agents/skills/impl-evaluation/SKILL.md`
- [x] `docs/draft/.agents/skills/impl-evaluation/agents/openai.yaml`
- [x] `docs/draft/.agents/skills/fix-decision/SKILL.md`
- [x] `docs/draft/.agents/skills/fix-decision/agents/openai.yaml`
- [x] `docs/draft/.agents/skills/output-comment/SKILL.md`
- [x] `docs/draft/.agents/skills/output-comment/agents/openai.yaml`
- [x] `docs/draft/.agents/skills/pr-finalization/SKILL.md`
- [x] `docs/draft/.agents/skills/pr-finalization/agents/openai.yaml`
- [x] `docs/draft/.agents/skills/external-op-failure/SKILL.md`
- [x] `docs/draft/.agents/skills/external-op-failure/agents/openai.yaml`

### GitHub テンプレート

- [x] `.github/ISSUE_TEMPLATE/task.md`
- [x] `.github/PULL_REQUEST_TEMPLATE/task.md`

## 未決事項

### 正式ドキュメント

- [x] 上位ルール変更の具体文面
- [x] 各フェーズの開始条件・完了条件
- [x] `pass | needs-fix | blocked` の判定基準
- [x] Planner Output の採用基準
- [x] `implementation-plan` / `split-proposal` の品質基準
- [x] スコープ確認、修正必須、任意改善の分類基準

### 成果物

- [x] Manager Log と GitHub issue コメントの責務分担
- [x] Generator Output / Evaluator Output の更新ルール

### agent / skill

- [x] `.codex/agents/*.toml` の具体 instructions
- [x] role docs と skill のどちらに具体手順への参照を書くか
- [x] hooks / skills / logs をどのフェーズで使うか
- [x] hooks / rules が止められないロール違反をどう検出するか
- [x] skill の最小実装で扱う範囲と、運用コマンド整備まで遅らせる範囲

### hooks

- [x] コード書き込み後 formatter の対象範囲
- [x] commit 前 hook と push 前 hook の検証項目の重複許容範囲
- [x] hook 失敗時に自動修正する範囲と停止する範囲
- [x] 将来テストを追加するときの実行タイミング

### 運用

- [ ] 試験運用に使う最初の issue
- [ ] 初回試験運用で外部副作用をどこまで実行するか
- [ ] マイルストーン内の次 issue 選定方法
- [x] 一時ファイルの命名、配置、後片付けの運用

### アーキテクチャ

- [x] アーキテクチャ上の未決定事項の扱い
- [x] Planner が読むべき関連ドキュメントや既存コードの探索範囲

## 対話ログ

### 2026-04-29

- 作成: `implementation-plan.md` を進めるための進捗管理ファイルを追加
- 確認: `docs/architecture` は未作成
- 確認: `.github/ISSUE_TEMPLATE/task.md` と `.github/PULL_REQUEST_TEMPLATE/task.md` は完了済み成果物として扱う
- 次候補: フェーズ1「正式ドキュメント整備」から着手し、既存 `docs/agent` と不足ファイルの差分を整理する
- 合意: `docs/agent/README.md` は現時点では作成せず、読み順・正本の扱い・構成説明は `docs/agent/AGENTS.md` に集約する
- 合意: フェーズ1の `workflow.md` と `roles/*.md` は後続フェーズが参照できる正本の骨格までを整備し、具体コマンドや本文整形手順はフェーズ2・フェーズ6で扱う
- 完了: フェーズ1「正式ドキュメント整備」として `docs/agent/workflow.md`、`docs/agent/roles/manager.md` を追加し、Planner / Generator / Evaluator のプレースホルダを解消
- 更新: `docs/agent/rules/sandbox.md` と `docs/agent/rules/hooks.md` は既存の正式成果物として完了扱いに変更
- 確認: フェーズ1の未決事項は正式ドキュメントへ反映済み
- 次候補: フェーズ2「skill 設計・最小実装」に着手し、`.agents/skills/*/SKILL.md` の最小構成を作る
- 合意: sandbox ルール上、実際の `.agents/skills` ではなく `docs/draft/.agents/skills` に skill ドラフトを作成する
- 合意: フェーズ2の skill 最小実装は、目的、使用フェーズ、主担当ロール、入力、出力、参照する正式ドキュメント、実行手順の大枠、判断しないこと、フェーズ6で具体化することに限定する
- 合意: GitHub 操作の具体コマンド、Sub-issues API の endpoint / payload、PR body や issue コメント本文の詳細な組み立て、外部副作用失敗時の細かい再試行手順はフェーズ6へ送る
- 合意: role docs はロールの責務、禁止事項、判断範囲を扱い、skill はワークフロー上の具体手順を扱う。skill と正式ドキュメントが矛盾する場合は `docs/agent` を優先する
- 合意: hooks は禁止操作の機械的な guardrail、skills は手順、logs は GitHub issue コメントとして保存する成果物として扱う
- 合意: Generator Output / Evaluator Output は修正ループごとに新しい issue コメントとして再投稿し、本文に `Loop: {番号}` を含める。既存コメントの編集・削除は原則行わない
- 完了: フェーズ2「skill 設計・最小実装」として `docs/draft/.agents/skills/*/SKILL.md` を追加
- 更新: skill 形式に合わせて各 `SKILL.md` に `name` / `description` frontmatter を追加し、各 skill に `agents/openai.yaml` を追加
- 次候補: フェーズ3「エージェント開発ワークフロー運用ルール整備」に着手し、ルート `AGENTS.md` へ通常作業とワークフロー専用ルールの境界を反映する
- 合意: `docs/agent/workflow.md` は正本として判断基準、責務境界、フェーズ遷移、許可・禁止境界を扱い、具体コマンド、本文整形、PR body、Sub-issues API、失敗時確認手順、修正ループ再投稿は skill に外部化する
- 更新: `docs/agent/workflow.md` に「この文書の責務」を追加し、各詳細手順を扱う skill への参照を明記
- 更新: Generator の commit 許可はエージェント開発ワークフロー中だけの責務とし、通常の Codex 単発作業では明示依頼なしに commit しないことを `docs/agent/workflow.md` に明記
- 次候補: フェーズ3として、`docs/agent/workflow.md` の責務境界をルート `AGENTS.md` に短く接続する
- 更新: `docs/draft/.agents/skills/*/SKILL.md` から `フェーズ6で具体化すること` を外し、実行チェック、Output 骨子、停止条件、コマンド例、失敗時の扱いを skill 側へ移した
- 確認: `quick_validate.py` で draft skill 10 個の基本形式が valid であることを確認
- 次候補: フェーズ3のルート `AGENTS.md` 反映、または今回具体化した draft skill を実配置 `.agents/skills` へ移すタイミングの確認
- 更新: 各 draft skill に `references/` を追加し、詳細なチェックリスト、Output 骨子、コマンド例、失敗時の扱いを `SKILL.md` から参照ファイルへ分離
- 更新: 各 `SKILL.md` は目的、入力、出力、実行手順、判断しないこと、追加リソースへの導線を持つ構成に整理
- 更新: `scripts/render_template.py` は過剰なため削除し、必要な本文雛形は `references/*-template.md` の Markdown テンプレートとして保持する方針に変更
- 更新: `docs/agent/workflow.md` を Manager 手順書ではなく全体フローの正本へ整理し、基本フローを Mermaid flowchart に変更
- 更新: `docs/agent/workflow.md` から開始条件詳細、Output 必須要素、PR body、commit ルールなど skill / role docs 側で扱う詳細を削除
- 更新: `docs/agent/workflow.md` のフローとフェーズ表に、各フェーズで使う skill を明示
- 更新: Planner / Generator / Evaluator Output のコメント保存は各ロール自身が `output-comment` skill で行う扱いに修正し、workflow / role docs / skill の矛盾を解消
- 更新: `docs/agent/workflow.md` のロール定義に担当フェーズ、Output コメント、外部副作用境界を統合し、独立した外部副作用節を削除
- 更新: `docs/agent/roles/*.md` に workflow の形式に合わせて実行形態、担当フェーズ、Output コメント、外部副作用の扱いを補足
- 合意: ルート `AGENTS.md` ではエージェント開発ワークフローの詳細に触れず、既存の `docs/agent` 参照だけに留める
- 合意: Generator の commit 許可はエージェント開発ワークフロー中だけに限定し、通常の単発 Codex 作業では明示依頼なしに commit / push / PR 作成を行わない
- 合意: Manager だけが条件付きで push / PR 作成でき、Planner / Generator / Evaluator はそれぞれの Output コメント投稿を除き issue 操作を行わない
- 合意: サブエージェントは並列起動せず、ブランチ名は原則 `issue/{issue番号}` とする。例外ブランチでは Manager が継続可否を確認する
- 完了: フェーズ3「エージェント開発ワークフロー運用ルール整備」は `docs/agent` 側の既存整理で足りるため、ルート `AGENTS.md` への専用節追加は行わない
- 確認: hooks / rules が止められないロール違反は `docs/agent`、Manager 判断、Evaluator レビューで補完する
- 次候補: フェーズ4「アーキテクチャ知識整備」に着手し、`docs/architecture` の入口と現状整理を作る
- 合意: フェーズ4では運用保守が重くなる網羅的なコードパス一覧や詳細対応表は避け、既存ドキュメントへの入口、責務境界、未確定時の扱いに絞る
- 完了: フェーズ4「アーキテクチャ知識整備」として `docs/architecture/AGENTS.md`、`docs/architecture/data-flow.md`、`docs/architecture/auth.md` を追加し、`docs/er.md` を `docs/architecture/er.md` へ移動
- 確認: `docs/er.md` への直接参照はドラフト内の計画記述だけで、更新が必要な実リンクは見つからなかった
- 更新: 認証・認可の詳細は機能仕様寄りのため `docs/features/auth.md` へ移し、`docs/architecture/auth.md` は package 間境界だけに整理
- 更新: `docs/architecture/README.md` は役割が AGENTS 寄りだったため `docs/architecture/AGENTS.md` へ移動
- 次候補: フェーズ5「Codex custom agents 作成」に着手し、`.codex/agents/*.toml` の具体 instructions を確認する
- 合意: `.codex/agents/*.toml` の `developer_instructions` は詳細手順を重複させず、ルート `AGENTS.md`、`docs/agent/AGENTS.md`、`docs/agent/workflow.md`、各 role docs への参照とロール別禁止境界に絞る
- 完了: フェーズ5「Codex custom agents 作成」は、既存の `.codex/agents/planner.toml`、`.codex/agents/generator.toml`、`.codex/agents/evaluator.toml` が各 role docs を正本として参照する最小構成を満たすため、追加変更なしで完了扱いにする
- 次候補: フェーズ6「運用コマンド整備」に着手し、git / GitHub 操作手順と `.agents/skills/*/SKILL.md` の実配置方針を確認する
- 合意: Manager は custom agent ではなくメインの Codex セッションとして動くため、Manager 主担当 skill には実行ロールを明記する。共用の `output-comment` は呼び出し元ロールに従う
- 更新: Manager 主担当の draft skill と `output-comment` に `実行ロール` セクションを追加
- 完了: フェーズ6「運用コマンド整備」として `docs/draft/.agents/skills/*` を正式配置 `.agents/skills/*` へ反映
- 更新: `.agents/skills/issue-splitting/references/splitting.md` に GitHub Sub-issues REST API の `gh api` 実行例、`sub_issue_id` の扱い、`replace_parent` の停止条件、紐づけ確認手順を追加
- 確認: `.agents/skills/*` に `docs/draft` 参照やフェーズ6向け未確定メモが残っていないことを確認
- 次候補: フェーズ7「hooks 整備」に着手し、formatter / commit 前 / push 前 hook の対象範囲を決める
- 合意: Planner も Planner Output コメントを投稿するため `workspace-write` とする
- 合意: 修正ループ上限は 2 回とする
- 合意: issue コメント、サブ issue body、PR body の作成では一時ファイルを原則作らず、`--body` または標準入力を使う
- 更新: `.codex/agents/planner.toml` と `docs/agent/rules/sandbox.md` で Planner の sandbox を `workspace-write` に変更
- 更新: `.agents/skills/issue-planning/SKILL.md` の存在しない `docs/architecture/README.md` 参照を `docs/architecture/AGENTS.md` に修正
- 更新: `.agents/skills/issue-planning/references/planner-output.md` に `implementation-plan` と `split-proposal` の Markdown テンプレートを追加
- 更新: `.agents/skills/plan-review/references/decision-outputs.md` に Planner Output の採用基準を追加
- 確認: 空の role 別 skill ディレクトリは削除済み
- 合意: issue 分割後はサブ issue ごとに 1 issue / 1 PR とし、親 issue は最後のサブ issue の PR だけで closing keyword の対象にする
- 更新: `docs/agent/workflow.md` に親 issue / サブ issue と PR の紐づけ方針を追加
- 合意: skill 名は短さと明確さを優先し、主流な略語がある場合は `impl` などを使う
- 更新: 正式 skill 名を `start-workflow`、`plan-review`、`impl-commit`、`impl-evaluation`、`fix-decision`、`output-comment`、`external-op-failure` へ変更
- 更新: `docs/agent/workflow.md`、`docs/agent/roles/*.md`、`.agents/skills/*`、関連 draft 文書内の skill 参照を新名へ同期

### 2026-04-30

- 合意: formatter は変更ファイルのみを対象にし、`PostToolUse` の `Edit|MultiEdit|Write` で自動実行する
- 合意: commit 前 hook と push 前 hook の Lint / 型チェック重複は許容し、push 前には `pnpm knip` も実行する
- 合意: hook 内で自動修正する対象は formatter に限定し、Lint / 型チェック / knip / 将来テストの失敗時は停止する
- 合意: 将来テストを追加する場合、commit 前は影響範囲を絞ったテスト、push 前はより広い範囲のテストを実行する
- 完了: フェーズ7「hooks 整備」として `.codex/hooks/pre_tool_use_policy.py` に `git commit` / `git push` 前の検証を追加し、`.codex/hooks/format_after_write.py` に書き込み後 formatter を追加し、`docs/agent/rules/hooks.md` に運用方針を反映
- 確認: `docs` 配下は Biome 設定で対象外のため、書き込み後 formatter の対象から Markdown を外した
- 確認: `pnpm check`、`python3 -c "import ast, pathlib; ast.parse(pathlib.Path('.codex/hooks/pre_tool_use_policy.py').read_text())"`、`git diff --check` が成功
- 確認: `python3 -m py_compile .codex/hooks/pre_tool_use_policy.py` は `.codex/hooks/__pycache__` 作成が read-only file system で失敗したため、構文確認は `ast.parse` で代替
- 次候補: フェーズ8「試験運用」に着手し、最初の issue と外部副作用の実行範囲を決める
