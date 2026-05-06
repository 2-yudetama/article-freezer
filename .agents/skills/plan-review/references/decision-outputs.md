# plan-review reference

## 判断結果

- 採用: `implementation-plan` を Generator に渡す
- 分割: `split-proposal` を `issue-splitting` skill に渡す
- 差し戻し: 不足要素と修正してほしい観点を Planner に返す
- 人間確認: スコープ変更、受け入れ条件変更、安全性判断、分割可否の判断不能を記録する

## implementation-plan 採用基準

- `Type: implementation-plan` が明記されている
- 対象 issue が 1 つに確定している
- 要求整理、スコープ、スコープ外、受け入れ条件が互いに矛盾していない
- Generator が満たすべき実装契約が、実装後の期待振る舞い、変更してよい範囲、変更してはいけない範囲を含んでいる
- 想定される変更領域が、package や主要ドキュメント単位で示されている
- 検証計画が受け入れ条件に対応している
- 未決定事項や人間判断が必要な事項が、実装前に解消不要なリスクとして扱える

## split-proposal 採用基準

- `Type: split-proposal` が明記されている
- 分割が必要な理由が、変更範囲、責務境界、検証観点、依存関係のいずれかに基づいている
- 各サブ issue 案に目的、スコープ、スコープ外、受け入れ条件が含まれている
- 各サブ issue が原則 1 PR で完了できる粒度になっている
- サブ issue 間の依存関係と推奨対応順が明示されている
- 親 issue で直接実装を続けない理由が明示されている
- 作成前に人間判断が必要な事項が残っていない

## 差し戻し依頼

- 対象 issue
- 差し戻し理由
- 不足または矛盾している項目
- 修正してほしい Output 種別
- 変更してはいけない前提

Planner Output を issue コメントへ保存する場合は `output-comment` skill を使う。
