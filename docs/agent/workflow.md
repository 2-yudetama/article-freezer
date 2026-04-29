# エージェント開発ワークフロー

このファイルは、issue を起点にエージェントが自律的に開発作業を進めるための全体フローを定義する。

## 前提

- 1サイクルで扱うタスクは**1 issue**のみ
- issueとPRは**1対1**で紐づける
- エージェントの成果物(ソースコードは除く)・ログは**issueにコメントとして残す**

## ロール定義

開発ワークフローにおけるエージェントのロールを定義する。各ロールの詳細は `roles/*.md` に記載する。

### Manager (Main Agent)

- 開発ワークフロー全体の管理を行う
- 開発サイクルの開始・PR作成・人間へのフォールバック判断を行う
- 詳細: [roles/manager.md](./roles/manager.md)

#### I/O

- 入力: 対象 issue、各エージェントの成果物、ユーザからの判断・補足
- 出力: 各エージェントへの依頼、フェーズ移行の判断、PR作成、ユーザへのフォールバック

### Planner (Sub Agent)

- Issue を分析し、要件・スコープ・受け入れ条件・Generator が満たすべき実装契約を整理する
- 詳細: [roles/planner.md](./roles/planner.md)

#### I/O

- 入力: 対象 issue、マイルストーン情報、関連する issue / PR / ドキュメント
- 出力: Planner Output

### Generator (Sub Agent)

- Planner の実装計画に沿ってコード・ドキュメントを変更する
- Evaluator の指摘に基づいて修正する
- 詳細: [roles/generator.md](./roles/generator.md)

#### I/O

- 入力: Planner Output
- 出力: Generator Output

### Evaluator (Sub Agent)

- Generator の実装結果をレビューし、合格 / 修正必要 / 停止を判定する
- 詳細: [roles/evaluator.md](./roles/evaluator.md)

#### I/O

- 入力: Generator Output
- 出力: Evaluator Output

## 基本フロー

```mermaid
flowchart TD
  Start([対象 issue])
  CycleStart["【Manager】<br/>開始確認"]
  HumanCheck["人間確認"]
  Planning["【Planner】<br/>計画作成"]
  PlanDecision{"【Manager】<br/>計画判断"}
  Split["【Manager】<br/>issue 分割"]
  Implement["【Generator】<br/>実装"]
  ImplementationDecision{"【Manager】<br/>実装結果確認"}
  Evaluate["【Evaluator】<br/>評価"]
  FixLoop{"【Manager】<br/>修正判断"}
  Finalize["【Manager】<br/>PR 最終化"]
  SplitDone([親 issue の直接実装を停止])
  Done([PR 作成完了])

  Start --> CycleStart
  CycleStart -->|開始不可| HumanCheck
  CycleStart -->|開始可| Planning
  Planning --> PlanDecision
  PlanDecision -->|実装計画を採用| Implement
  PlanDecision -->|Issue分割案を採用| Split
  PlanDecision -->|差し戻し| Planning
  PlanDecision -->|判断不能| HumanCheck
  Split -->|成功| SplitDone
  Implement --> ImplementationDecision
  ImplementationDecision -->|評価依頼| Evaluate
  ImplementationDecision -->|再計画が必要| Planning
  ImplementationDecision -->|人間確認が必要| HumanCheck
  Evaluate --> FixLoop
  FixLoop -->|合格| Finalize
  FixLoop -->|修正必要| Implement
  FixLoop -->|停止| HumanCheck
  FixLoop -->|修正上限到達| HumanCheck
  FixLoop -->|再計画が必要| Planning
  Finalize --> Done
```

## フェーズとskill

| フェーズ   | 主担当    | 使用 skill              | 概要                                                   |
| ---------- | --------- | ----------------------- | ------------------------------------------------------ |
| 開始確認   | Manager   | `start-workflow`           | 対象 issue と開始条件を確認する                        |
| 計画作成   | Planner   | `issue-planning`        | 実装計画または issue 分割案を作成する                  |
| 計画判断   | Manager   | `plan-review`         | Planner の成果物の採用可否と扱いを判断する             |
| issue 分割 | Manager   | `issue-splitting`       | 採用した issue 分割案に基づいてサブ issue を作成する   |
| 実装       | Generator | `impl-commit` | 実装計画に沿って変更し、issue スコープ内で commit する |
| 評価       | Evaluator | `impl-evaluation`     | 実装結果をレビューし、評価結果を判定する               |
| 修正判断   | Manager   | `fix-decision`              | Evaluator の成果物に基づいて修正継続可否を判断する     |
| PR 最終化  | Manager   | `pr-finalization`       | PR 作成条件を確認し、push と PR 作成を行う             |

### Issue分割について

- Issue 分割は、対象 issue を 1 PR で扱うよりも、複数の独立した issue として扱う方が安全に進められる場合に行う
- 分割を採用した場合は親 issue の直接実装は停止し、作成したサブ issue をそれぞれ独立した開発サイクルの対象にする
- サブ issue はそれぞれ 1 issue / 1 PR として扱い、対応 PR の closing keyword で close する
- 親 issue は最後のサブ issue の PR でだけ closing keyword の対象にする

#### 分割基準

- 1 PR で完了させるには変更範囲が広い
- 複数 package や複数機能にまたがり、受け入れ条件を分けた方が評価しやすい
- DB スキーマ、API 契約、UI、運用ドキュメントなど、リスクや検証観点が異なる作業が混在している
- 前段の設計・整備が完了しないと後続の実装に進めない

## 人間確認条件

次の場合は後続フェーズへ進まず、人間確認へフォールバックする。

- サイクルの開始条件を満たさない
- Planner の成果物の採用可否を判断できない
- セキュリティ、認証・認可、データ破壊、DB スキーマ、API 契約の判断が必要
- 修正ループが上限に達した
