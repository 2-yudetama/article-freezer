# Output / テンプレート移行ドラフト

このファイルは、Output 仕様、issue / PR テンプレート、コメント本文整形手順を正式配置へ分配するための元ドラフト。
正式ドキュメントでは `docs/agent/outputs.md` は作成しない。

## 移行先

```txt
docs/agent/workflow.md
.agents/skills/output-comment/SKILL.md
.agents/skills/issue-planning/SKILL.md
.agents/skills/issue-splitting/SKILL.md
.agents/skills/impl-commit/SKILL.md
.agents/skills/impl-evaluation/SKILL.md
.github/ISSUE_TEMPLATE/task.md
.github/PULL_REQUEST_TEMPLATE/task.md
```

## 分配方針

- Output の保存先、見出し、必須要素、`Result` の扱いは `docs/agent/workflow.md` へ移す
- Planner Output の本文テンプレート利用手順は `.agents/skills/issue-planning/SKILL.md` へ移す
- Split Proposal / Split Result の本文テンプレート利用手順は `.agents/skills/issue-splitting/SKILL.md` へ移す
- Generator Output の本文テンプレート利用手順は `.agents/skills/impl-commit/SKILL.md` へ移す
- Evaluator Output の本文テンプレート利用手順は `.agents/skills/impl-evaluation/SKILL.md` へ移す
- Manager Log / PR Created / issue コメント投稿手順は `.agents/skills/output-comment/SKILL.md` へ移す
- issue / PR テンプレート本文は `.github/*` の正式テンプレートへ移す

## 対象

- Planner Output
- Generator Output
- Evaluator Output
- Manager Log
- PR Created
- Split Proposal
- Split Result

issue / PR テンプレートは別項目で扱う。

## issue テンプレート

issue テンプレートは、人間が Planner の作業を先取りしすぎないように、依頼の背景とゴールを簡潔に記録する構成にする。
スコープ、スコープ外、受け入れ条件、検証観点の精緻化は Planner Output で扱う。
配置先は `.github/ISSUE_TEMPLATE/task.md` とする。

```md
## 概要

## 背景・理由

## ゴール

## 補足
```

## PR テンプレート

PR body は Generator Output / Evaluator Output から作れる構成にする。
`AIサマリ` には Generator / Evaluator の Output をそれぞれ折り畳みセクションで記載する。
サブ issue は対応 PR の closing keyword で close し、最後のサブ issue の PR body には親 issue も closing keyword として含める。
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

## Planner 出力テンプレート

Planner は issue 分析後、必ず `implementation-plan` または `split-proposal` のどちらかを出力する。
Planner Output を issue コメントに保存する場合は、コメント先頭に `## AI: Planner Output` を付ける。

### 共通ヘッダー

```md
# Planner Output

## Type

implementation-plan | split-proposal
```

### implementation-plan

対象 issue を 1 PR で実装可能な場合に出力する。

```md
## 対象 issue

## 要求整理

## スコープ

## スコープ外

## 受け入れ条件

## 検証計画

## リスク・確認事項
```

### split-proposal

対象 issue を複数のサブ issue に分割すべき場合に出力する。

サブ issue 案は、そのまま GitHub issue body に転用できる粒度を目指す。

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

## Split Result テンプレート

Manager がサブ issue を作成した後、親 issue にコメントする内容の候補。

```md
# Split Result

## 親 issue

## 分割理由

## 分割方針

## 作成したサブ issue

## 推奨対応順

## 親 issue の扱い
```

## Generator 出力テンプレート

Generator の出力は、自分の作業結果と観測結果に限定する。他エージェントの行動に干渉する記載は含めない。
Generator Output を issue コメントに保存する場合は、コメント先頭に `## AI: Generator Output` を付ける。
修正ループがある場合は、コメント本文に `Loop: {番号}` を含める。

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

## Evaluator 出力テンプレート

Evaluator の出力は、自分の評価結果と観測結果に限定する。他エージェントの行動に干渉する記載は含めない。
Evaluator Output を issue コメントに保存する場合は、コメント先頭に `## AI: Evaluator Output` を付ける。
修正ループがある場合は、コメント本文に `Loop: {番号}` を含める。

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

## Manager Log テンプレート

Manager Log は必要な場合に対象 issue のコメントに保存する。
人間確認へフォールバックする場合は、必ず対象 issue に `AI: Manager Log` コメントを残す。

```md
# Manager Log

## 対象 issue

## 実行した操作

## 結果

## 停止理由・人間確認事項

## 判断が必要な理由

## 選択肢

## 影響範囲

## 推奨案
```

## PR Created テンプレート

```md
# PR Created

## 対象 issue

## PR

## 概要
```
